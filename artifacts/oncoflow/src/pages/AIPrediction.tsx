/**
 * src/pages/AIPrediction.tsx
 *
 * Multimodal AI prediction form for OncoFlow.
 * Sends genomic mutations + clinical values + pathology text
 * to POST /api/ai/predict and displays the four-task result.
 *
 * Add to App.tsx:
 *   import AIPrediction from "./pages/AIPrediction";
 *   <Route path="/ai-predict">
 *     <RequireAuth><AppLayout><AIPrediction /></AppLayout></RequireAuth>
 *   </Route>
 *
 * Add to AppLayout nav:
 *   { nameKey: "AI Predict", href: "/ai-predict", icon: BrainCircuit }
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { mockPatients } from "@/data/mockData";
import { api } from "@/lib/api";
import {
  BrainCircuit, Dna, Activity, AlertTriangle,
  Heart, Syringe, RefreshCw, CheckCircle2, Info
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────

interface GenomicInput {
  BRCA1: number; BRCA2: number; TP53: number; PIK3CA: number; PTEN: number;
  ERBB2: number; EGFR: number; KRAS: number; BRAF: number; ALK: number;
}

interface ClinicalInput {
  age: number;
  tumor_size_cm: number;
  stage: number;
  lymph_nodes_positive: number;
  er_status: number;
  pr_status: number;
  her2_status: number;
  ki67_percent: number;
  prior_chemo: number;
  prior_radiation: number;
}

interface PredictResult {
  recommended_treatment: string;
  predicted_stage: string;
  survival_probability_5yr: number;
  recurrence_risk: number;
  survival_label: string;
  recurrence_label: string;
  treatment_probabilities: {
    Chemotherapy: number;
    HormoneTherapy: number;
    TargetedTherapy: number;
  };
  stage_probabilities: {
    StageI: number; StageII: number; StageIII: number; StageIV: number;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

const GENES: (keyof GenomicInput)[] = [
  "BRCA1","BRCA2","TP53","PIK3CA","PTEN","ERBB2","EGFR","KRAS","BRAF","ALK"
];

const riskColor = (label: string) => {
  if (label === "High" || label === "Poor")     return "bg-red-100 text-red-700";
  if (label === "Moderate")                     return "bg-orange-100 text-orange-700";
  return "bg-green-100 text-green-700";
};

const ProbBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-medium">
      <span>{label}</span>
      <span>{(value * 100).toFixed(1)}%</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value * 100}%` }} />
    </div>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────

export default function AIPrediction() {
  const [selectedPatient, setSelectedPatient] = useState(mockPatients[0].id);
  const [report, setReport] = useState(
    "Invasive ductal carcinoma, grade 2, ER positive, PR negative, HER2 negative."
  );
  const [genomic, setGenomic] = useState<GenomicInput>({
    BRCA1:0, BRCA2:0, TP53:0, PIK3CA:0, PTEN:0,
    ERBB2:0, EGFR:0, KRAS:0, BRAF:0, ALK:0,
  });
  const [clinical, setClinical] = useState<ClinicalInput>({
    age: 55, tumor_size_cm: 2.5, stage: 2,
    lymph_nodes_positive: 0, er_status: 1, pr_status: 0, her2_status: 0,
    ki67_percent: 20, prior_chemo: 0, prior_radiation: 0,
  });
  
  useEffect(() => {
  const patient = mockPatients.find(p => p.id === selectedPatient);
  if (!patient) return;

  // Parse stage from patient data
  const stageMap: Record<string, number> = { "I": 1, "II": 2, "III": 3, "IV": 4 };
  const stage = stageMap[patient.stage] || 2;

  // Parse biomarkers into clinical flags
  const bio = patient.biomarkers?.toLowerCase() || "";
  const er  = bio.includes("er+") ? 1 : 0;
  const pr  = bio.includes("pr+") ? 1 : 0;
  const her2 = bio.includes("her2+") || bio.includes("her2 +") ? 1 : 0;

  setClinical({
    age:                  patient.age,
    tumor_size_cm:        stage * 1.2,        // estimate from stage
    stage:                stage,
    lymph_nodes_positive: stage >= 3 ? 3 : 0, // estimate from stage
    er_status:            er,
    pr_status:            pr,
    her2_status:          her2,
    ki67_percent:         stage >= 3 ? 35 : 15,
    prior_chemo:          0,
    prior_radiation:      0,
  });

  // Parse genomic flags from biomarkers
  setGenomic({
    BRCA1:  bio.includes("brca1") ? 1 : 0,
    BRCA2:  bio.includes("brca2") ? 1 : 0,
    TP53:   bio.includes("tp53")  ? 1 : 0,
    PIK3CA: bio.includes("pik3ca") ? 1 : 0,
    PTEN:   bio.includes("pten")  ? 1 : 0,
    ERBB2:  her2,
    EGFR:   bio.includes("egfr")  ? 1 : 0,
    KRAS:   bio.includes("kras")  ? 1 : 0,
    BRAF:   bio.includes("braf")  ? 1 : 0,
    ALK:    bio.includes("alk+")  ? 1 : 0,
  });

  // Auto-fill report from patient diagnosis
  setReport(
    `Patient: ${patient.name}, Age: ${patient.age}. ` +
    `Diagnosis: ${patient.cancerType} Stage ${patient.stage}. ` +
    `Biomarkers: ${patient.biomarkers}. ` +
    `Assigned oncologist: ${patient.doctor}.`
  );
}, [selectedPatient]);
  const [result, setResult]     = useState<PredictResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const toggleGene = (gene: keyof GenomicInput) =>
    setGenomic(prev => ({ ...prev, [gene]: prev[gene] ? 0 : 1 }));

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const patient = mockPatients.find(p => p.id === selectedPatient);
      const data = await api("/ai/predict", {
        method: "POST",
        body: {
          patient_id: patient?.id,
          genomic,
          clinical,
          report,
        },
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BrainCircuit className="w-8 h-8 text-primary" /> AI Multimodal Prediction
        </h1>
        <p className="text-muted-foreground mt-1">
          Combines genomic, clinical, and text data to predict treatment, stage, survival, and recurrence.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Inputs ── */}
        <div className="space-y-5">
          {/* Patient selector */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Patient
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockPatients.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Genomic mutations */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base flex items-center gap-2">
                <Dna className="w-4 h-4 text-primary" /> Genomic Mutations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-2">
                {GENES.map(gene => (
                  <button
                    key={gene}
                    type="button"
                    onClick={() => toggleGene(gene)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      genomic[gene]
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-600 border-gray-200 hover:border-primary/50"
                    }`}
                  >
                    {genomic[gene] ? "✓ " : ""}{gene}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Click to toggle mutation present / absent
              </p>
            </CardContent>
          </Card>

          {/* Clinical values */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base flex items-center gap-2">
                <Syringe className="w-4 h-4 text-primary" /> Clinical Data
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Age (yrs)",          field: "age" as const,                  type: "number", min:20,  max:90  },
                { label: "Tumor size (cm)",    field: "tumor_size_cm" as const,        type: "number", min:0.5, max:15  },
                { label: "Stage (1–4)",        field: "stage" as const,                type: "number", min:1,   max:4   },
                { label: "Lymph nodes +",      field: "lymph_nodes_positive" as const, type: "number", min:0,   max:20  },
                { label: "Ki-67 (%)",          field: "ki67_percent" as const,         type: "number", min:0,   max:100 },
              ].map(({ label, field, type, min, max }) => (
                <div key={field} className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{label}</label>
                  <input
                    type={type}
                    min={min} max={max} step="0.1"
                    value={clinical[field]}
                    onChange={e => setClinical(prev => ({ ...prev, [field]: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              ))}

              {/* Boolean toggles */}
              {[
                { label: "ER positive",      field: "er_status" as const      },
                { label: "PR positive",      field: "pr_status" as const      },
                { label: "HER2 positive",    field: "her2_status" as const    },
                { label: "Prior chemo",      field: "prior_chemo" as const    },
                { label: "Prior radiation",  field: "prior_radiation" as const },
              ].map(({ label, field }) => (
                <div key={field} className="flex items-center justify-between col-span-1">
                  <label className="text-xs font-medium text-muted-foreground">{label}</label>
                  <button
                    type="button"
                    onClick={() => setClinical(prev => ({ ...prev, [field]: prev[field] ? 0 : 1 }))}
                    className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                      clinical[field]
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-500 border-gray-200"
                    }`}
                  >
                    {clinical[field] ? "Yes" : "No"}
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pathology report */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-base">Pathology Report Text</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Textarea
                value={report}
                onChange={e => setReport(e.target.value)}
                rows={4}
                placeholder="Paste or type the pathology report..."
                className="text-sm"
              />
            </CardContent>
          </Card>

          <Button
            onClick={handlePredict}
            disabled={loading}
            className="w-full gap-2 py-6 text-base"
          >
            {loading
              ? <><RefreshCw className="w-5 h-5 animate-spin" /> Running prediction…</>
              : <><BrainCircuit className="w-5 h-5" /> Run AI Prediction</>
            }
          </Button>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Prediction failed</p>
                <p>{error}</p>
                <p className="mt-1 text-xs">Make sure the Python model server is running on port 8000.</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Results ── */}
        <div className="space-y-5">
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center border-2 border-dashed border-gray-200 rounded-xl p-8">
              <BrainCircuit className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-400 font-medium">Results will appear here</p>
              <p className="text-sm text-gray-300 mt-1">Fill in the form and click Run</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <RefreshCw className="w-10 h-10 text-primary animate-spin mb-3" />
              <p className="text-primary font-medium">Analyzing multimodal data…</p>
            </div>
          )}

          {result && (
            <>
              {/* Primary recommendation */}
              <Card className="shadow-sm border-primary/20 bg-primary/5">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-primary">AI Recommendation</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium tracking-wide mb-1">Treatment</p>
                      <p className="font-bold text-lg text-foreground">{result.recommended_treatment}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium tracking-wide mb-1">Predicted Stage</p>
                      <p className="font-bold text-lg text-foreground">{result.predicted_stage}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Survival & recurrence */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="shadow-sm">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-semibold text-gray-700">5-yr Survival</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {(result.survival_probability_5yr * 100).toFixed(0)}%
                    </p>
                    <Badge className={`mt-2 ${riskColor(result.survival_label)} border-0 text-xs`}>
                      {result.survival_label}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-semibold text-gray-700">Recurrence Risk</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {(result.recurrence_risk * 100).toFixed(0)}%
                    </p>
                    <Badge className={`mt-2 ${riskColor(result.recurrence_label)} border-0 text-xs`}>
                      {result.recurrence_label}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Treatment probabilities */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b border-gray-100">
                  <CardTitle className="text-sm text-muted-foreground">Treatment Confidence</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <ProbBar label="Chemotherapy"    value={result.treatment_probabilities.Chemotherapy}    color="bg-orange-400" />
                  <ProbBar label="Hormone Therapy" value={result.treatment_probabilities.HormoneTherapy}  color="bg-teal-400"   />
                  <ProbBar label="Targeted Therapy" value={result.treatment_probabilities.TargetedTherapy} color="bg-blue-500"   />
                </CardContent>
              </Card>

              {/* Stage probabilities */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b border-gray-100">
                  <CardTitle className="text-sm text-muted-foreground">Stage Confidence</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <ProbBar label="Stage I"   value={result.stage_probabilities.StageI}   color="bg-green-400"  />
                  <ProbBar label="Stage II"  value={result.stage_probabilities.StageII}  color="bg-yellow-400" />
                  <ProbBar label="Stage III" value={result.stage_probabilities.StageIII} color="bg-orange-400" />
                  <ProbBar label="Stage IV"  value={result.stage_probabilities.StageIV}  color="bg-red-500"    />
                </CardContent>
              </Card>

              {/* Disclaimer */}
              <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                This prediction is generated by a research AI model trained on synthetic data.
                It is intended as a decision-support tool only and must not replace clinical judgment.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
