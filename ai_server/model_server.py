"""
OncoFlow AI Model Server
========================
FastAPI service that loads all 5 pretrained weights and exposes:
  POST /predict  — returns treatment, survival, recurrence, stage
  GET  /health   — readiness check

Run with:
  uvicorn model_server:app --host 0.0.0.0 --port 8000 --reload
"""

import os
import json
import torch
import torch.nn as nn
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from transformers import BertTokenizer, BertModel

# ---------------------------------------------------------------------------
# Paths  —  edit WEIGHTS_DIR if you put the .pt files somewhere else
# ---------------------------------------------------------------------------
WEIGHTS_DIR = Path(os.getenv("WEIGHTS_DIR", "./weights"))

GENE_ORDER = [
    "BRCA1", "BRCA2", "TP53", "PIK3CA", "PTEN",
    "ERBB2", "EGFR", "KRAS", "BRAF", "ALK"
]
CLINICAL_COLS = [
    "age", "tumor_size_cm", "stage", "lymph_nodes_positive",
    "er_status", "pr_status", "her2_status", "ki67_percent",
    "prior_chemo", "prior_radiation"
]
TREATMENT_MAP = {0: "Chemotherapy", 1: "Hormone Therapy", 2: "Targeted Therapy"}
STAGE_MAP     = {0: "Stage I", 1: "Stage II", 2: "Stage III", 3: "Stage IV"}

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ---------------------------------------------------------------------------
# Model architecture (must match training exactly)
# ---------------------------------------------------------------------------
class GenomicEncoderNet(nn.Module):
    def __init__(self, num_genes=10, embedding_dim=128, hidden_dim=64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(num_genes, hidden_dim), nn.ReLU(),
            nn.Linear(hidden_dim, embedding_dim)
        )
    def forward(self, x): return self.net(x)


class ClinicalEncoderNet(nn.Module):
    def __init__(self, input_dim=10, embedding_dim=128, hidden_dim=64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim), nn.ReLU(),
            nn.Linear(hidden_dim, embedding_dim)
        )
    def forward(self, x): return self.net(x)


class BioBERTEncoderWithProjection(nn.Module):
    def __init__(self, bert, tokenizer, embedding_dim=128, max_length=64):
        super().__init__()
        self.bert = bert
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.projection = nn.Linear(bert.config.hidden_size, embedding_dim, bias=False)

    def forward(self, texts):
        enc = self.tokenizer(
            texts, truncation=True, padding="max_length",
            max_length=self.max_length, return_tensors="pt"
        )
        input_ids = enc["input_ids"].to(device)
        attn      = enc["attention_mask"].to(device)
        with torch.no_grad():
            cls = self.bert(input_ids, attention_mask=attn).last_hidden_state[:, 0, :]
        return self.projection(cls)


class FusionTransformer(nn.Module):
    def __init__(self, d_model=128, nhead=4, dim_feedforward=256, dropout=0.1):
        super().__init__()
        self.pos_embedding = nn.Parameter(torch.randn(1, 3, d_model))
        enc_layer = nn.TransformerEncoderLayer(
            d_model=d_model, nhead=nhead,
            dim_feedforward=dim_feedforward, dropout=dropout, batch_first=True
        )
        self.transformer = nn.TransformerEncoder(enc_layer, num_layers=1)
        self.attn_pool = nn.Linear(d_model, 1)

    def forward(self, g, c, t):
        x = torch.stack([g, c, t], dim=1) + self.pos_embedding
        x = self.transformer(x)
        w = torch.softmax(self.attn_pool(x), dim=1)
        return (w * x).sum(dim=1)


class MultiModalPipeline(nn.Module):
    def __init__(self, ge, ce, be, fu):
        super().__init__()
        self.genomic_enc  = ge
        self.clinical_enc = ce
        self.biobert_enc  = be
        self.fusion       = fu

    def forward(self, g, c, t):
        return self.fusion(
            self.genomic_enc(g),
            self.clinical_enc(c),
            self.biobert_enc(t)
        )


class MultiTaskHead(nn.Module):
    def __init__(self, input_dim=128):
        super().__init__()
        self.shared = nn.Sequential(
            nn.Linear(input_dim, 64), nn.ReLU(), nn.Dropout(0.3)
        )
        self.treatment_head  = nn.Linear(64, 3)
        self.survival_head   = nn.Sequential(nn.Linear(64, 1), nn.Sigmoid())
        self.recurrence_head = nn.Sequential(nn.Linear(64, 1), nn.Sigmoid())
        self.stage_head      = nn.Linear(64, 4)

    def forward(self, x):
        s = self.shared(x)
        return {
            "treatment":  self.treatment_head(s),
            "survival":   self.survival_head(s).squeeze(1),
            "recurrence": self.recurrence_head(s).squeeze(1),
            "stage":      self.stage_head(s),
        }


# ---------------------------------------------------------------------------
# Global model holder (populated on startup)
# ---------------------------------------------------------------------------
MODEL = {}


def load_all_models():
    print(f"[startup] Loading weights from {WEIGHTS_DIR.resolve()} ...")
    print(f"[startup] Using device: {device}")

    # 1. Genomic encoder
    gen_enc = GenomicEncoderNet().to(device)
    raw = torch.load(WEIGHTS_DIR / "genomic_encoder_pretrained.pt", map_location=device)
    gen_enc.load_state_dict({"net." + k: v for k, v in raw.items()})
    for p in gen_enc.parameters(): p.requires_grad = False
    gen_enc.eval()
    print("[startup] Genomic encoder loaded ✓")

    # 2. Clinical encoder
    clin_enc = ClinicalEncoderNet().to(device)
    raw = torch.load(WEIGHTS_DIR / "clinical_encoder_pretrained.pt", map_location=device)
    clin_enc.load_state_dict({"net." + k: v for k, v in raw.items()})
    for p in clin_enc.parameters(): p.requires_grad = False
    clin_enc.eval()
    print("[startup] Clinical encoder loaded ✓")

    # 3. BioBERT + projection
    print("[startup] Loading BioBERT (downloads ~440 MB on first run) ...")
    tokenizer = BertTokenizer.from_pretrained(
        str(WEIGHTS_DIR / "biobert_tokenizer"), use_fast=False
    )
    bert_base = BertModel.from_pretrained("dmis-lab/biobert-base-cased-v1.1").to(device)
    for p in bert_base.parameters(): p.requires_grad = False
    bert_base.eval()

    bio_enc = BioBERTEncoderWithProjection(bert_base, tokenizer).to(device)
    bio_enc.projection.load_state_dict(
        torch.load(WEIGHTS_DIR / "biobert_projection_pretrained.pt", map_location=device)
    )
    for p in bio_enc.parameters(): p.requires_grad = False
    bio_enc.eval()
    print("[startup] BioBERT encoder loaded ✓")

    # 4. Fusion transformer
    fusion = FusionTransformer().to(device)
    fusion.load_state_dict(
        torch.load(WEIGHTS_DIR / "fusion_transformer_pretrained.pt", map_location=device)
    )
    for p in fusion.parameters(): p.requires_grad = False
    fusion.eval()
    print("[startup] Fusion transformer loaded ✓")

    # 5. Multi-task head
    head = MultiTaskHead().to(device)
    head.load_state_dict(
        torch.load(WEIGHTS_DIR / "multitask_head.pt", map_location=device)
    )
    for p in head.parameters(): p.requires_grad = False
    head.eval()
    print("[startup] Multi-task head loaded ✓")

    # Assemble pipeline
    pipeline = MultiModalPipeline(gen_enc, clin_enc, bio_enc, fusion).to(device)
    pipeline.eval()

    MODEL["pipeline"] = pipeline
    MODEL["head"]     = head
    print("[startup] All models ready — server is up ✓")


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_all_models()
    yield
    MODEL.clear()


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="OncoFlow AI Model Server",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------
class GenomicInput(BaseModel):
    BRCA1: float = 0
    BRCA2: float = 0
    TP53:  float = 0
    PIK3CA:float = 0
    PTEN:  float = 0
    ERBB2: float = 0
    EGFR:  float = 0
    KRAS:  float = 0
    BRAF:  float = 0
    ALK:   float = 0


class ClinicalInput(BaseModel):
    # All values should be normalised to [0, 1] — same as training
    age:                  float = Field(0.5, ge=0, le=1)
    tumor_size_cm:        float = Field(0.3, ge=0, le=1)
    stage:                float = Field(0.25, ge=0, le=1)
    lymph_nodes_positive: float = Field(0.0, ge=0, le=1)
    er_status:            float = Field(0.0, ge=0, le=1)
    pr_status:            float = Field(0.0, ge=0, le=1)
    her2_status:          float = Field(0.0, ge=0, le=1)
    ki67_percent:         float = Field(0.2, ge=0, le=1)
    prior_chemo:          float = Field(0.0, ge=0, le=1)
    prior_radiation:      float = Field(0.0, ge=0, le=1)


class PredictRequest(BaseModel):
    genomic:  GenomicInput
    clinical: ClinicalInput
    report:   str = Field(
        "No pathology report provided.",
        description="Free-text pathology / clinical report"
    )
    patient_id: Optional[str] = None


class TreatmentProbabilities(BaseModel):
    Chemotherapy:    float
    HormoneTherapy:  float
    TargetedTherapy: float


class StageProbabilities(BaseModel):
    StageI:   float
    StageII:  float
    StageIII: float
    StageIV:  float


class PredictResponse(BaseModel):
    patient_id: Optional[str]
    # Primary recommendations
    recommended_treatment:  str
    predicted_stage:        str
    survival_probability_5yr: float   # 0–1
    recurrence_risk:          float   # 0–1
    # Detailed probabilities
    treatment_probabilities: TreatmentProbabilities
    stage_probabilities:     StageProbabilities
    # Human-readable risk labels
    survival_label:    str   # High / Moderate / Low
    recurrence_label:  str   # High / Moderate / Low


def _risk_label(prob: float, thresholds=(0.33, 0.66)) -> str:
    if prob < thresholds[0]:  return "Low"
    if prob < thresholds[1]:  return "Moderate"
    return "High"

def _survival_label(prob: float) -> str:
    # Survival is inverse: higher prob = better
    if prob >= 0.7: return "Favorable"
    if prob >= 0.4: return "Moderate"
    return "Poor"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "ok",
        "models_loaded": bool(MODEL),
        "device": str(device)
    }


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if not MODEL:
        raise HTTPException(status_code=503, detail="Models not loaded yet")

    # Build tensors
    g_vals = [getattr(req.genomic, gene) for gene in GENE_ORDER]
    c_vals = [getattr(req.clinical, col)  for col  in CLINICAL_COLS]

    g = torch.tensor([g_vals], dtype=torch.float32).to(device)
    c = torch.tensor([c_vals], dtype=torch.float32).to(device)
    t = [req.report]

    pipeline = MODEL["pipeline"]
    head     = MODEL["head"]

    with torch.no_grad():
        fused = pipeline(g, c, t)
        out   = head(fused)

    import torch.nn.functional as F

    treat_probs = F.softmax(out["treatment"], dim=1).squeeze().cpu().tolist()
    stage_probs = F.softmax(out["stage"],     dim=1).squeeze().cpu().tolist()
    survival    = float(out["survival"].cpu())
    recurrence  = float(out["recurrence"].cpu())

    best_treat = int(torch.tensor(treat_probs).argmax())
    best_stage = int(torch.tensor(stage_probs).argmax())

    return PredictResponse(
        patient_id=req.patient_id,
        recommended_treatment=TREATMENT_MAP[best_treat],
        predicted_stage=STAGE_MAP[best_stage],
        survival_probability_5yr=round(survival, 4),
        recurrence_risk=round(recurrence, 4),
        treatment_probabilities=TreatmentProbabilities(
            Chemotherapy=round(treat_probs[0], 4),
            HormoneTherapy=round(treat_probs[1], 4),
            TargetedTherapy=round(treat_probs[2], 4),
        ),
        stage_probabilities=StageProbabilities(
            StageI=round(stage_probs[0], 4),
            StageII=round(stage_probs[1], 4),
            StageIII=round(stage_probs[2], 4),
            StageIV=round(stage_probs[3], 4),
        ),
        survival_label=_survival_label(survival),
        recurrence_label=_risk_label(recurrence),
    )
