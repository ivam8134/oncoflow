import { useState, useRef } from "react";
import { X, Upload, CheckCircle, ChevronDown, Paperclip, Image as ImageIcon, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventType =
  | "Diagnosis"
  | "Biopsy / Pathology"
  | "Surgery"
  | "Chemotherapy"
  | "Radiotherapy"
  | "Immunotherapy / Targeted Therapy"
  | "Scan / Imaging"
  | "Recurrence / Metastasis / Progression"
  | "Palliative Care / Death"
  | "Other Clinical Notes";

export interface TimelineEvent {
  id: string;
  date: string;
  type: string;
  title: string;
  desc?: string;
  color: string;
  iconKey: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: TimelineEvent) => void;
}

// ─── Mock autocomplete data ────────────────────────────────────────────────────

const CANCER_TYPES = ["Breast", "Lung", "Colorectal", "Prostate", "Ovarian", "Lymphoma", "Leukemia", "Bladder", "Kidney", "Pancreatic", "Thyroid", "Melanoma", "Cervical", "Gastric"];
const TUMOR_SITES = ["Right Breast", "Left Breast", "Right Lung", "Left Lung", "Colon", "Rectum", "Prostate", "Ovary", "Cervix", "Liver", "Pancreas", "Kidney", "Bladder", "Brain", "Bone"];
const SURGEONS = ["Dr. Sarah Chen", "Dr. Marcus Webb", "Dr. Priya Patel", "Dr. James Morrison", "Dr. Elena Ruiz", "Dr. Alan Park"];
const CHEMO_PROTOCOLS = ["AC-T (Doxorubicin/Cyclophosphamide + Paclitaxel)", "FOLFOX (Folinic acid + Fluorouracil + Oxaliplatin)", "CHOP (Cyclophosphamide/Doxorubicin/Vincristine/Prednisone)", "Carboplatin + Paclitaxel", "Cisplatin + Gemcitabine", "CAPOX (Capecitabine + Oxaliplatin)", "BEP (Bleomycin/Etoposide/Cisplatin)", "R-CHOP (Rituximab + CHOP)"];
const TARGETED_DRUGS = ["Trastuzumab (Herceptin)", "Pembrolizumab (Keytruda)", "Nivolumab (Opdivo)", "Bevacizumab (Avastin)", "Osimertinib (Tagrisso)", "Olaparib (Lynparza)", "Atezolizumab (Tecentriq)", "Ribociclib (Kisqali)", "Abemaciclib (Verzenio)", "Cetuximab (Erbitux)"];
const SIDE_EFFECTS_CHEMO = ["Nausea", "Vomiting", "Fatigue", "Alopecia", "Neuropathy", "Mucositis", "Infection / Neutropenia", "Anemia", "Thrombocytopenia", "Diarrhea", "Constipation", "Cognitive Changes", "Cardiotoxicity"];
const SIDE_EFFECTS_RADIO = ["Fatigue", "Skin Irritation", "Nausea", "Diarrhea", "Mucositis", "Xerostomia", "Esophagitis", "Pneumonitis", "Local Pain"];
const SIDE_EFFECTS_IMMUNO = ["Fatigue", "Rash", "Diarrhea / Colitis", "Hepatitis", "Pneumonitis", "Thyroid Dysfunction", "Neuropathy", "Arthralgia", "Pruritus", "Infusion Reaction"];
const SCAN_TYPES = ["CT Scan", "MRI", "PET Scan", "PET-CT", "X-Ray", "Ultrasound", "Bone Scan", "Mammogram", "Echocardiogram"];
const METASTASIS_LOCATIONS = ["Liver", "Lung", "Brain", "Bone", "Adrenal", "Lymph Nodes", "Peritoneum", "Skin", "Pleura", "Spleen"];
const RESPONSE_OPTIONS = ["Complete Response (CR)", "Partial Response (PR)", "Stable Disease (SD)", "Progressive Disease (PD)"];
const BIOPSY_TYPES = ["Fine Needle Aspiration (FNA)", "Core Needle Biopsy", "Excisional Biopsy", "Incisional Biopsy", "Punch Biopsy", "Endoscopic Biopsy", "Bone Marrow Biopsy"];
const SURGERY_TYPES = ["Wide Local Excision", "Lumpectomy", "Mastectomy (Total)", "Mastectomy (Radical)", "Prostatectomy", "Colectomy", "Pneumonectomy", "Lobectomy", "Oophorectomy", "Hysterectomy", "Debulking Surgery"];
const PALLIATIVE_CARE_TYPES = ["Palliative Chemotherapy", "Palliative Radiotherapy", "Pain Management", "Hospice Referral", "Supportive Care Only", "DNAR Established"];
const CAUSE_OF_DEATH = ["Disease Progression", "Treatment Complications", "Infection / Sepsis", "Cardiac Event", "Respiratory Failure", "Multi-Organ Failure", "Unknown", "Other"];
const RECURRENCE_TYPES = ["Local Recurrence", "Regional Recurrence", "Distant Metastasis", "Oligometastatic", "Peritoneal Carcinomatosis", "CNS Metastasis"];

// ─── Event type config ────────────────────────────────────────────────────────

const EVENT_TYPES: EventType[] = [
  "Diagnosis",
  "Biopsy / Pathology",
  "Surgery",
  "Chemotherapy",
  "Radiotherapy",
  "Immunotherapy / Targeted Therapy",
  "Scan / Imaging",
  "Recurrence / Metastasis / Progression",
  "Palliative Care / Death",
  "Other Clinical Notes",
];

const EVENT_COLORS: Record<EventType, string> = {
  "Diagnosis": "bg-blue-100 text-blue-700",
  "Biopsy / Pathology": "bg-indigo-100 text-indigo-700",
  "Surgery": "bg-purple-100 text-purple-700",
  "Chemotherapy": "bg-orange-100 text-orange-700",
  "Radiotherapy": "bg-yellow-100 text-yellow-700",
  "Immunotherapy / Targeted Therapy": "bg-teal-100 text-teal-700",
  "Scan / Imaging": "bg-cyan-100 text-cyan-700",
  "Recurrence / Metastasis / Progression": "bg-red-100 text-red-700",
  "Palliative Care / Death": "bg-gray-200 text-gray-700",
  "Other Clinical Notes": "bg-slate-100 text-slate-700",
};

const EVENT_ICON_KEYS: Record<EventType, string> = {
  "Diagnosis": "activity",
  "Biopsy / Pathology": "microscope",
  "Surgery": "scalpel",
  "Chemotherapy": "pill",
  "Radiotherapy": "zap",
  "Immunotherapy / Targeted Therapy": "shield",
  "Scan / Imaging": "scan",
  "Recurrence / Metastasis / Progression": "alert",
  "Palliative Care / Death": "heart",
  "Other Clinical Notes": "file",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateForDisplay(isoDate: string) {
  if (!isoDate) return "";
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function generateId() {
  return `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function buildTitle(eventType: EventType, fields: Record<string, any>): string {
  switch (eventType) {
    case "Diagnosis":
      return `Diagnosed with ${fields.stage ? `Stage ${fields.stage} ` : ""}${fields.cancerType || "Cancer"}`;
    case "Biopsy / Pathology":
      return `${fields.biopsyType || "Biopsy"} Performed`;
    case "Surgery":
      return `${fields.surgeryType || "Surgery"} — ${fields.surgeonName || "Surgeon TBD"}`;
    case "Chemotherapy":
      return `Chemotherapy${fields.cycleNumber ? ` — Cycle ${fields.cycleNumber}` : ""} ${fields.protocol ? `(${fields.protocol.split("(")[0].trim()})` : ""}`;
    case "Radiotherapy":
      return `Radiotherapy${fields.sessions ? ` — ${fields.sessions} Sessions` : ""}`;
    case "Immunotherapy / Targeted Therapy":
      return `${fields.drugName ? fields.drugName.split("(")[0].trim() : "Immunotherapy / Targeted Therapy"} Initiated`;
    case "Scan / Imaging":
      return `${fields.scanType || "Imaging"} — ${fields.findings ? fields.findings.substring(0, 40) + "…" : "Findings Pending"}`;
    case "Recurrence / Metastasis / Progression":
      return `${fields.recurrenceType || "Recurrence"} — ${fields.location || "Location TBD"}`;
    case "Palliative Care / Death":
      return fields.careType || "Palliative Care / Death Event";
    default:
      return fields.notes ? fields.notes.substring(0, 60) + "…" : "Clinical Note";
  }
}

function buildDesc(eventType: EventType, fields: Record<string, any>): string {
  const parts: string[] = [];
  switch (eventType) {
    case "Diagnosis":
      if (fields.primarySite) parts.push(`Site: ${fields.primarySite}`);
      if (fields.grade) parts.push(`Grade: ${fields.grade}`);
      if (fields.biomarkers) parts.push(`Biomarkers: ${fields.biomarkers}`);
      break;
    case "Biopsy / Pathology":
      if (fields.pathologyResult) parts.push(fields.pathologyResult.substring(0, 100));
      break;
    case "Surgery":
      if (fields.pathologyResult) parts.push(fields.pathologyResult.substring(0, 100));
      break;
    case "Chemotherapy":
      if (fields.response) parts.push(`Response: ${fields.response}`);
      if (fields.sideEffects?.length) parts.push(`Side effects: ${fields.sideEffects.slice(0, 3).join(", ")}`);
      if (fields.dose) parts.push(`Dose: ${fields.dose} ${fields.doseUnit || ""}`);
      break;
    case "Radiotherapy":
      if (fields.targetZone) parts.push(`Target: ${fields.targetZone}`);
      if (fields.totalDose) parts.push(`Total dose: ${fields.totalDose} ${fields.doseUnit || "Gy"}`);
      if (fields.sideEffects?.length) parts.push(`Side effects: ${fields.sideEffects.slice(0, 2).join(", ")}`);
      break;
    case "Immunotherapy / Targeted Therapy":
      if (fields.response) parts.push(`Response: ${fields.response}`);
      if (fields.adverseEffects?.length) parts.push(`Adverse effects: ${fields.adverseEffects.slice(0, 2).join(", ")}`);
      break;
    case "Scan / Imaging":
      if (fields.findings) parts.push(fields.findings.substring(0, 120));
      break;
    case "Recurrence / Metastasis / Progression":
      if (fields.notes) parts.push(fields.notes.substring(0, 120));
      break;
    case "Palliative Care / Death":
      if (fields.notes) parts.push(fields.notes.substring(0, 120));
      break;
    default:
      if (fields.notes) parts.push(fields.notes.substring(0, 120));
  }
  return parts.join(" · ");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function Input({ value, onChange, type = "text", placeholder, required, className = "" }: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      max={type === "date" ? new Date().toISOString().split("T")[0] : undefined}
      className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all bg-white ${className}`}
    />
  );
}

function Select({ value, onChange, options, placeholder, required }: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all bg-white appearance-none"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3, required }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all bg-white resize-none"
    />
  );
}

function MultiSelect({ label, options, selected, onChange }: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt]);
  };
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50 max-h-44 overflow-y-auto">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              selected.includes(opt)
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700"
            }`}
          >
            {selected.includes(opt) && <span className="mr-1">✓</span>}
            {opt}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-blue-600 mt-1">{selected.length} selected</p>
      )}
    </div>
  );
}

function DateRangePicker({ startLabel, endLabel, start, end, onStartChange, onEndChange }: {
  startLabel: string;
  endLabel: string;
  start: string;
  end: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label required>{startLabel}</Label>
        <Input type="date" value={start} onChange={onStartChange} required />
      </div>
      <div>
        <Label>{endLabel}</Label>
        <Input type="date" value={end} onChange={onEndChange} />
      </div>
    </div>
  );
}

function FileUpload({ files, onChange, accept = "*", multiple = true }: {
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming);
    onChange(multiple ? [...files, ...arr] : arr);
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div
        onClick={() => ref.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group text-center"
      >
        <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mx-auto mb-1.5" />
        <p className="text-sm text-gray-500 group-hover:text-blue-600">
          <span className="font-medium">Click to upload</span> or drag & drop
        </p>
        <p className="text-xs text-gray-400 mt-0.5">PDF, DOCX, JPEG, PNG, DICOM</p>
        <input
          ref={ref}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>
      {files.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {files.map((f, i) => {
            const isImage = f.type.startsWith("image/");
            const url = isImage ? URL.createObjectURL(f) : null;
            return (
              <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-100 rounded-lg">
                {isImage && url ? (
                  <img src={url} alt={f.name} className="w-10 h-10 object-cover rounded border border-gray-200" />
                ) : (
                  <div className="w-10 h-10 bg-blue-50 rounded border border-blue-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{f.name}</p>
                  <p className="text-xs text-gray-400">{(f.size / 1024).toFixed(1)} KB</p>
                </div>
                <button type="button" onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="h-px flex-1 bg-gray-100" />
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{title}</span>
      <div className="h-px flex-1 bg-gray-100" />
    </div>
  );
}

// ─── Dynamic form fields per event type ───────────────────────────────────────

function DiagnosisFields({ f, set }: { f: Record<string, any>; set: (k: string, v: any) => void }) {
  return (
    <>
      <div>
        <Label required>Diagnosis Date</Label>
        <Input type="date" value={f.date || ""} onChange={v => set("date", v)} required />
      </div>
      <div>
        <Label required>Cancer Type</Label>
        <Select value={f.cancerType || ""} onChange={v => set("cancerType", v)} options={CANCER_TYPES} placeholder="Select cancer type" required />
      </div>
      <div>
        <Label>Primary Tumor Site</Label>
        <Select value={f.primarySite || ""} onChange={v => set("primarySite", v)} options={TUMOR_SITES} placeholder="Select primary site" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label required>Stage</Label>
          <Select value={f.stage || ""} onChange={v => set("stage", v)} options={["I", "II", "III", "IV"]} placeholder="Stage" required />
        </div>
        <div>
          <Label>Grade</Label>
          <Select value={f.grade || ""} onChange={v => set("grade", v)} options={["Low (Grade 1)", "Intermediate (Grade 2)", "High (Grade 3)"]} placeholder="Grade" />
        </div>
      </div>
      <div>
        <Label>Biomarkers</Label>
        <Input value={f.biomarkers || ""} onChange={v => set("biomarkers", v)} placeholder="e.g. ER+, HER2-, BRCA1 mutation" />
      </div>
      <div>
        <Label>Metastasis at Diagnosis</Label>
        <div className="flex gap-3">
          {["Yes", "No", "Unknown"].map(opt => (
            <button key={opt} type="button"
              onClick={() => set("metastasis", opt)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${f.metastasis === opt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Clinical Notes</Label>
        <Textarea value={f.notes || ""} onChange={v => set("notes", v)} placeholder="Additional clinical notes…" rows={3} />
      </div>
    </>
  );
}

function BiopsyFields({ f, set }: { f: Record<string, any>; set: (k: string, v: any) => void }) {
  return (
    <>
      <div>
        <Label required>Date of Biopsy</Label>
        <Input type="date" value={f.date || ""} onChange={v => set("date", v)} required />
      </div>
      <div>
        <Label required>Biopsy Type</Label>
        <Select value={f.biopsyType || ""} onChange={v => set("biopsyType", v)} options={BIOPSY_TYPES} placeholder="Select biopsy type" required />
      </div>
      <div>
        <Label>Biopsy Site / Location</Label>
        <Select value={f.primarySite || ""} onChange={v => set("primarySite", v)} options={TUMOR_SITES} placeholder="Select biopsy site" />
      </div>
      <div>
        <Label>Pathology Result</Label>
        <Textarea value={f.pathologyResult || ""} onChange={v => set("pathologyResult", v)} placeholder="Describe pathology findings, histology, grade, margins…" rows={4} />
      </div>
      <div>
        <Label>Upload Pathology Report</Label>
        <FileUpload files={f.files || []} onChange={v => set("files", v)} accept=".pdf,.doc,.docx,.jpg,.png" />
      </div>
    </>
  );
}

function SurgeryFields({ f, set }: { f: Record<string, any>; set: (k: string, v: any) => void }) {
  return (
    <>
      <div>
        <Label required>Operation Date</Label>
        <Input type="date" value={f.date || ""} onChange={v => set("date", v)} required />
      </div>
      <div>
        <Label>Surgeon</Label>
        <Select value={f.surgeonName || ""} onChange={v => set("surgeonName", v)} options={SURGEONS} placeholder="Select surgeon" />
      </div>
      <div>
        <Label required>Surgery Type</Label>
        <Select value={f.surgeryType || ""} onChange={v => set("surgeryType", v)} options={SURGERY_TYPES} placeholder="Select surgery type" required />
      </div>
      <div>
        <Label>Surgical Margins</Label>
        <div className="flex gap-3">
          {["Clear (Negative)", "Positive", "Close", "Unknown"].map(opt => (
            <button key={opt} type="button"
              onClick={() => set("margins", opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${f.margins === opt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Post-op Pathology Result</Label>
        <Textarea value={f.pathologyResult || ""} onChange={v => set("pathologyResult", v)} placeholder="Describe post-operative pathology findings, grading, staging…" rows={3} />
      </div>
      <div>
        <Label>Upload Report / Images</Label>
        <FileUpload files={f.files || []} onChange={v => set("files", v)} accept=".pdf,.doc,.docx,.jpg,.png,.dcm" />
      </div>
    </>
  );
}

function ChemoFields({ f, set }: { f: Record<string, any>; set: (k: string, v: any) => void }) {
  return (
    <>
      <DateRangePicker startLabel="Start Date" endLabel="End Date" start={f.startDate || ""} end={f.endDate || ""} onStartChange={v => set("startDate", v)} onEndChange={v => set("endDate", v)} />
      <div>
        <Label required>Protocol</Label>
        <Select value={f.protocol || ""} onChange={v => set("protocol", v)} options={CHEMO_PROTOCOLS} placeholder="Select protocol" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Cycle Number</Label>
          <Input type="number" value={f.cycleNumber || ""} onChange={v => set("cycleNumber", v)} placeholder="e.g. 1" />
        </div>
        <div>
          <Label>Total Cycles Planned</Label>
          <Input type="number" value={f.totalCycles || ""} onChange={v => set("totalCycles", v)} placeholder="e.g. 6" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Dose</Label>
          <Input type="number" value={f.dose || ""} onChange={v => set("dose", v)} placeholder="e.g. 60" />
        </div>
        <div>
          <Label>Dose Unit</Label>
          <Select value={f.doseUnit || ""} onChange={v => set("doseUnit", v)} options={["mg/m²", "mg/kg", "mg", "AUC"]} placeholder="Unit" />
        </div>
      </div>
      <MultiSelect label="Side Effects" options={SIDE_EFFECTS_CHEMO} selected={f.sideEffects || []} onChange={v => set("sideEffects", v)} />
      <div>
        <Label>Treatment Response</Label>
        <div className="grid grid-cols-2 gap-2">
          {RESPONSE_OPTIONS.map(opt => (
            <button key={opt} type="button"
              onClick={() => set("response", opt)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all ${f.response === opt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Additional Notes</Label>
        <Textarea value={f.notes || ""} onChange={v => set("notes", v)} placeholder="Dose adjustments, complications, clinical observations…" rows={3} />
      </div>
    </>
  );
}

function RadioFields({ f, set }: { f: Record<string, any>; set: (k: string, v: any) => void }) {
  return (
    <>
      <DateRangePicker startLabel="Start Date" endLabel="End Date" start={f.startDate || ""} end={f.endDate || ""} onStartChange={v => set("startDate", v)} onEndChange={v => set("endDate", v)} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Number of Sessions</Label>
          <Input type="number" value={f.sessions || ""} onChange={v => set("sessions", v)} placeholder="e.g. 25" />
        </div>
        <div>
          <Label>Total Dose (Gy)</Label>
          <Input type="number" value={f.totalDose || ""} onChange={v => set("totalDose", v)} placeholder="e.g. 60" />
        </div>
      </div>
      <div>
        <Label>Target Zone / Field</Label>
        <Input value={f.targetZone || ""} onChange={v => set("targetZone", v)} placeholder="e.g. Left breast, mediastinum, whole brain…" />
      </div>
      <div>
        <Label>Radiotherapy Technique</Label>
        <Select value={f.technique || ""} onChange={v => set("technique", v)} options={["IMRT", "3D-CRT", "SBRT / SABR", "SRS", "Brachytherapy", "Proton Therapy", "VMAT"]} placeholder="Select technique" />
      </div>
      <MultiSelect label="Side Effects" options={SIDE_EFFECTS_RADIO} selected={f.sideEffects || []} onChange={v => set("sideEffects", v)} />
      <div>
        <Label>Notes</Label>
        <Textarea value={f.notes || ""} onChange={v => set("notes", v)} placeholder="Clinical observations, tolerance, complications…" rows={3} />
      </div>
    </>
  );
}

function ImmunoFields({ f, set }: { f: Record<string, any>; set: (k: string, v: any) => void }) {
  return (
    <>
      <DateRangePicker startLabel="Start Date" endLabel="End Date" start={f.startDate || ""} end={f.endDate || ""} onStartChange={v => set("startDate", v)} onEndChange={v => set("endDate", v)} />
      <div>
        <Label required>Drug / Agent</Label>
        <Select value={f.drugName || ""} onChange={v => set("drugName", v)} options={TARGETED_DRUGS} placeholder="Select drug or agent" required />
      </div>
      <div>
        <Label>Therapy Type</Label>
        <div className="flex flex-wrap gap-2">
          {["Immunotherapy", "Targeted Therapy", "Combination", "CDK 4/6 Inhibitor", "PARP Inhibitor", "mTOR Inhibitor", "VEGF Inhibitor"].map(opt => (
            <button key={opt} type="button"
              onClick={() => set("therapyType", opt)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${f.therapyType === opt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <MultiSelect label="Adverse Effects" options={SIDE_EFFECTS_IMMUNO} selected={f.adverseEffects || []} onChange={v => set("adverseEffects", v)} />
      <div>
        <Label>Treatment Response</Label>
        <div className="grid grid-cols-2 gap-2">
          {RESPONSE_OPTIONS.map(opt => (
            <button key={opt} type="button"
              onClick={() => set("response", opt)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all ${f.response === opt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea value={f.notes || ""} onChange={v => set("notes", v)} placeholder="Dose modifications, irAEs management, laboratory values…" rows={3} />
      </div>
    </>
  );
}

function ScanFields({ f, set }: { f: Record<string, any>; set: (k: string, v: any) => void }) {
  return (
    <>
      <div>
        <Label required>Date of Scan</Label>
        <Input type="date" value={f.date || ""} onChange={v => set("date", v)} required />
      </div>
      <div>
        <Label required>Scan Type</Label>
        <div className="flex flex-wrap gap-2">
          {SCAN_TYPES.map(opt => (
            <button key={opt} type="button"
              onClick={() => set("scanType", opt)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${f.scanType === opt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Reporting Radiologist</Label>
        <Input value={f.radiologist || ""} onChange={v => set("radiologist", v)} placeholder="Dr. Name" />
      </div>
      <div>
        <Label required>Findings / Impression</Label>
        <Textarea value={f.findings || ""} onChange={v => set("findings", v)} placeholder="Describe imaging findings, lesion size, location, RECIST response, lymph node status…" rows={5} required />
      </div>
      <div>
        <Label>RECIST Response</Label>
        <div className="grid grid-cols-2 gap-2">
          {RESPONSE_OPTIONS.map(opt => (
            <button key={opt} type="button"
              onClick={() => set("response", opt)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all ${f.response === opt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Upload Images / Report</Label>
        <FileUpload files={f.files || []} onChange={v => set("files", v)} accept=".pdf,.jpg,.jpeg,.png,.dcm" />
      </div>
    </>
  );
}

function RecurrenceFields({ f, set }: { f: Record<string, any>; set: (k: string, v: any) => void }) {
  return (
    <>
      <div>
        <Label required>Event Date</Label>
        <Input type="date" value={f.date || ""} onChange={v => set("date", v)} required />
      </div>
      <div>
        <Label required>Recurrence / Event Type</Label>
        <Select value={f.recurrenceType || ""} onChange={v => set("recurrenceType", v)} options={RECURRENCE_TYPES} placeholder="Select event type" required />
      </div>
      <div>
        <Label>Site / Location</Label>
        <Select value={f.location || ""} onChange={v => set("location", v)} options={METASTASIS_LOCATIONS} placeholder="Select site" />
      </div>
      <div>
        <Label>Confirmed by Imaging</Label>
        <div className="flex gap-3">
          {["Yes", "No", "Suspected"].map(opt => (
            <button key={opt} type="button"
              onClick={() => set("confirmedImaging", opt)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${f.confirmedImaging === opt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Confirmed by Biopsy</Label>
        <div className="flex gap-3">
          {["Yes", "No"].map(opt => (
            <button key={opt} type="button"
              onClick={() => set("confirmedBiopsy", opt)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${f.confirmedBiopsy === opt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Clinical Notes</Label>
        <Textarea value={f.notes || ""} onChange={v => set("notes", v)} placeholder="Describe the event, planned treatment changes, referrals…" rows={4} />
      </div>
    </>
  );
}

function PalliativeFields({ f, set }: { f: Record<string, any>; set: (k: string, v: any) => void }) {
  const isOutcome = f.subType === "Death / Outcome";
  return (
    <>
      <div>
        <Label required>Sub-type</Label>
        <div className="flex flex-wrap gap-2">
          {["Palliative Care", "Death / Outcome"].map(opt => (
            <button key={opt} type="button"
              onClick={() => set("subType", opt)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${f.subType === opt ? "bg-gray-700 text-white border-gray-700" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label required>Date</Label>
        <Input type="date" value={f.date || ""} onChange={v => set("date", v)} required />
      </div>
      <div>
        <Label>{isOutcome ? "Cause of Death" : "Care Type"}</Label>
        <Select value={f.careType || ""} onChange={v => set("careType", v)} options={isOutcome ? CAUSE_OF_DEATH : PALLIATIVE_CARE_TYPES} placeholder="Select option" />
      </div>
      {!isOutcome && (
        <div>
          <Label>Care Setting</Label>
          <Select value={f.careSetting || ""} onChange={v => set("careSetting", v)} options={["Inpatient", "Outpatient", "Home / Community", "Hospice Inpatient", "Nursing Facility"]} placeholder="Select setting" />
        </div>
      )}
      <div>
        <Label>Notes</Label>
        <Textarea value={f.notes || ""} onChange={v => set("notes", v)} placeholder={isOutcome ? "Death certificate details, circumstances, family contact…" : "Goals of care discussion, symptoms managed, support provided…"} rows={4} />
      </div>
    </>
  );
}

function OtherFields({ f, set }: { f: Record<string, any>; set: (k: string, v: any) => void }) {
  return (
    <>
      <div>
        <Label required>Date</Label>
        <Input type="date" value={f.date || ""} onChange={v => set("date", v)} required />
      </div>
      <div>
        <Label>Note Category</Label>
        <Select value={f.noteCategory || ""} onChange={v => set("noteCategory", v)} options={["Clinical Observation", "Multidisciplinary Team (MDT) Meeting", "Oncology Review", "Genetics Referral", "Second Opinion", "Psychosocial Support", "Complication", "Emergency Admission", "Protocol Deviation", "Consent Obtained"]} placeholder="Select category" />
      </div>
      <div>
        <Label required>Notes</Label>
        <Textarea value={f.notes || ""} onChange={v => set("notes", v)} placeholder="Enter clinical notes, observations, decisions, and context…" rows={6} required />
      </div>
      <div>
        <Label>Attachments</Label>
        <FileUpload files={f.files || []} onChange={v => set("files", v)} />
      </div>
    </>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function AddEventModal({ isOpen, onClose, onSave }: Props) {
  const { t } = useLanguage();
  const [eventType, setEventType] = useState<EventType | "">("");
  const [fields, setFields] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const setField = (key: string, value: any) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setEventType("");
    setFields({});
    setErrors([]);
    setSaving(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!eventType) { errs.push("Please select an event type."); return errs; }
    // Get primary date field
    const dateField = fields.date || fields.startDate;
    if (!dateField) errs.push("A date is required for this event.");
    // Future date check
    if (dateField && new Date(dateField) > new Date()) errs.push("Date cannot be in the future.");
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }

    setSaving(true);
    setTimeout(() => {
      const dateStr = fields.date || fields.startDate || "";
      const newEvent: TimelineEvent = {
        id: generateId(),
        date: formatDateForDisplay(dateStr),
        type: eventType as string,
        title: buildTitle(eventType as EventType, fields),
        desc: buildDesc(eventType as EventType, fields),
        color: EVENT_COLORS[eventType as EventType] || "bg-slate-100 text-slate-700",
        iconKey: EVENT_ICON_KEYS[eventType as EventType] || "file",
      };
      onSave(newEvent);
      resetForm();
      setSaving(false);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full sm:max-w-2xl bg-white sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t.modal.addEvent.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{t.modal.addEvent.selectEventType}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-6 py-5">
          <form id="add-event-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Error banner */}
            {errors.length > 0 && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <ul className="text-sm text-red-700 space-y-0.5">
                  {errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            {/* Event type selector */}
            <div>
              <Label required>Event Type</Label>
              <div className="relative">
                <select
                  value={eventType}
                  onChange={e => { setEventType(e.target.value as EventType); setFields({}); setErrors([]); }}
                  required
                  className="w-full px-3.5 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all bg-white appearance-none pr-10 font-medium"
                >
                  <option value="">Select event type…</option>
                  {EVENT_TYPES.map(et => (
                    <option key={et} value={et}>{et}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {eventType && (
                <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${EVENT_COLORS[eventType as EventType]}`}>
                  {eventType}
                </div>
              )}
            </div>

            {/* Dynamic fields */}
            {eventType && (
              <>
                <SectionHeader title="Event Details" />
                {eventType === "Diagnosis" && <DiagnosisFields f={fields} set={setField} />}
                {eventType === "Biopsy / Pathology" && <BiopsyFields f={fields} set={setField} />}
                {eventType === "Surgery" && <SurgeryFields f={fields} set={setField} />}
                {eventType === "Chemotherapy" && <ChemoFields f={fields} set={setField} />}
                {eventType === "Radiotherapy" && <RadioFields f={fields} set={setField} />}
                {eventType === "Immunotherapy / Targeted Therapy" && <ImmunoFields f={fields} set={setField} />}
                {eventType === "Scan / Imaging" && <ScanFields f={fields} set={setField} />}
                {eventType === "Recurrence / Metastasis / Progression" && <RecurrenceFields f={fields} set={setField} />}
                {eventType === "Palliative Care / Death" && <PalliativeFields f={fields} set={setField} />}
                {eventType === "Other Clinical Notes" && <OtherFields f={fields} set={setField} />}
              </>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <p className="text-xs text-gray-400">
            Fields marked <span className="text-red-400 font-semibold">*</span> are required
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t.modal.addEvent.cancel}
            </Button>
            <Button
              type="submit"
              form="add-event-form"
              disabled={!eventType || saving}
              className="min-w-[120px]"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {t.modal.addEvent.saveEvent}…
                </span>
              ) : t.modal.addEvent.saveEvent}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
