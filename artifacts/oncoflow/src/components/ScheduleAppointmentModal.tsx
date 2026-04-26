import { useState, useRef } from "react";
import { X, Upload, FileText, ChevronDown, AlertCircle, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TimelineEvent } from "@/components/AddEventModal";
import { useLanguage } from "@/context/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppointmentType =
  | "Follow-Up Consultation"
  | "Chemotherapy Session"
  | "Radiotherapy Session"
  | "Surgery"
  | "Lab / Blood Test"
  | "Imaging / Scan"
  | "Other";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: TimelineEvent) => void;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const DOCTORS = [
  "Dr. Sarah Chen",
  "Dr. Marcus Webb",
  "Dr. Priya Patel",
  "Dr. James Morrison",
  "Dr. Elena Ruiz",
  "Dr. Alan Park",
];

const NURSES = [
  "Nurse Rebecca Hall",
  "Nurse David Kim",
  "Nurse Maria Santos",
  "Nurse James Okafor",
  "Nurse Lindsey Price",
];

const TECHNICIANS = [
  "Rad. Tech. Amy Liu",
  "Rad. Tech. Ben Torres",
  "Lab Tech. Chloe Adams",
  "Lab Tech. Samuel Grant",
  "Dr. Elena Ruiz (Radiologist)",
];

const ALL_STAFF = [...DOCTORS, ...NURSES, ...TECHNICIANS];

const CHEMO_PROTOCOLS = [
  "AC-T (Doxorubicin/Cyclophosphamide + Paclitaxel)",
  "FOLFOX (Folinic acid + Fluorouracil + Oxaliplatin)",
  "CHOP",
  "Carboplatin + Paclitaxel",
  "Cisplatin + Gemcitabine",
  "CAPOX",
  "R-CHOP",
  "BEP (Bleomycin/Etoposide/Cisplatin)",
];

const SURGERY_TYPES = [
  "Wide Local Excision",
  "Lumpectomy",
  "Mastectomy (Total)",
  "Mastectomy (Radical)",
  "Prostatectomy",
  "Colectomy",
  "Pneumonectomy",
  "Lobectomy",
  "Oophorectomy",
  "Debulking Surgery",
  "Other",
];

const LAB_TEST_TYPES = [
  "Complete Blood Count (CBC)",
  "Comprehensive Metabolic Panel",
  "Tumour Markers (CEA, CA-125, PSA, AFP…)",
  "Coagulation Studies (PT/INR, APTT)",
  "Liver Function Tests (LFTs)",
  "Renal Function Tests",
  "Thyroid Function Tests",
  "Bone Marrow Aspirate",
  "Circulating Tumour DNA (ctDNA)",
  "Flow Cytometry",
  "Other",
];

const SCAN_TYPES = [
  "CT Scan",
  "MRI",
  "PET Scan",
  "PET-CT",
  "X-Ray",
  "Ultrasound",
  "Bone Scan",
  "Mammogram",
  "Echocardiogram",
];

const APPOINTMENT_TYPES: AppointmentType[] = [
  "Follow-Up Consultation",
  "Chemotherapy Session",
  "Radiotherapy Session",
  "Surgery",
  "Lab / Blood Test",
  "Imaging / Scan",
  "Other",
];

// ─── Color & icon config ──────────────────────────────────────────────────────

const APT_COLORS: Record<AppointmentType, string> = {
  "Follow-Up Consultation": "bg-blue-100 text-blue-700",
  "Chemotherapy Session":   "bg-orange-100 text-orange-700",
  "Radiotherapy Session":   "bg-yellow-100 text-yellow-700",
  "Surgery":                "bg-purple-100 text-purple-700",
  "Lab / Blood Test":       "bg-teal-100 text-teal-700",
  "Imaging / Scan":         "bg-cyan-100 text-cyan-700",
  "Other":                  "bg-slate-100 text-slate-700",
};

const APT_ICON_KEYS: Record<AppointmentType, string> = {
  "Follow-Up Consultation": "activity",
  "Chemotherapy Session":   "pill",
  "Radiotherapy Session":   "zap",
  "Surgery":                "scalpel",
  "Lab / Blood Test":       "microscope",
  "Imaging / Scan":         "scan",
  "Other":                  "file",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function formatDateDisplay(date: string, time: string) {
  if (!date) return "";
  const d = new Date(`${date}T${time || "00:00"}`);
  return d.toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    ...(time ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function buildTitle(type: AppointmentType, f: Record<string, any>): string {
  const scheduled = f.time ? ` at ${f.time}` : "";
  switch (type) {
    case "Follow-Up Consultation":
      return `Follow-Up Consultation${f.doctor ? ` — ${f.doctor}` : ""}${scheduled}`;
    case "Chemotherapy Session":
      return `Chemo Session${f.cycleNumber ? ` — Cycle ${f.cycleNumber}` : ""}${f.protocol ? ` (${f.protocol.split("(")[0].trim()})` : ""}`;
    case "Radiotherapy Session":
      return `Radiotherapy${f.sessionNumber ? ` — Session ${f.sessionNumber}` : ""}${f.targetZone ? ` · ${f.targetZone}` : ""}`;
    case "Surgery":
      return `${f.surgeryType || "Surgery"} Scheduled${f.surgeon ? ` — ${f.surgeon}` : ""}`;
    case "Lab / Blood Test":
      return `${f.testType || "Lab Test"} Ordered`;
    case "Imaging / Scan":
      return `${f.scanType || "Scan"} Scheduled`;
    case "Other":
      return f.description ? f.description.substring(0, 60) : "Appointment Scheduled";
    default:
      return "Appointment Scheduled";
  }
}

function buildDesc(type: AppointmentType, f: Record<string, any>): string {
  const parts: string[] = [];
  if (f.doctor) parts.push(`Assigned: ${f.doctor}`);
  if (f.nurse) parts.push(`Nurse: ${f.nurse}`);
  if (f.technician) parts.push(`Technician: ${f.technician}`);
  if (f.staff) parts.push(`Staff: ${f.staff}`);
  if (f.surgeon && type === "Surgery") parts.push(`Surgeon: ${f.surgeon}`);
  if (f.notes) parts.push(f.notes.substring(0, 80) + (f.notes.length > 80 ? "…" : ""));
  return parts.join(" · ");
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function Input({ value, onChange, type = "text", placeholder, required, min }: {
  value: string; onChange: (v: string) => void; type?: string;
  placeholder?: string; required?: boolean; min?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      min={min}
      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all bg-white"
    />
  );
}

function Select({ value, onChange, options, placeholder, required }: {
  value: string; onChange: (v: string) => void; options: string[];
  placeholder?: string; required?: boolean;
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
  value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; required?: boolean;
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

function DateTimePicker({ date, time, onDateChange, onTimeChange, dateLabel = "Date", timeLabel = "Time", required }: {
  date: string; time: string; onDateChange: (v: string) => void; onTimeChange: (v: string) => void;
  dateLabel?: string; timeLabel?: string; required?: boolean;
}) {
  const today = new Date().toISOString().split("T")[0];
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label required={required}>{dateLabel}</Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={date}
            onChange={e => onDateChange(e.target.value)}
            min={today}
            required={required}
            className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all bg-white"
          />
        </div>
      </div>
      <div>
        <Label>{timeLabel}</Label>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="time"
            value={time}
            onChange={e => onTimeChange(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all bg-white"
          />
        </div>
      </div>
    </div>
  );
}

function FileUpload({ files, onChange }: { files: File[]; onChange: (f: File[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const handle = (list: FileList | null) => {
    if (!list) return;
    onChange([...files, ...Array.from(list)]);
  };
  const remove = (i: number) => onChange(files.filter((_, idx) => idx !== i));

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
        <p className="text-xs text-gray-400 mt-0.5">PDF, DOCX, JPEG, PNG</p>
        <input ref={ref} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden"
          onChange={e => handle(e.target.files)} />
      </div>
      {files.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {files.map((f, i) => {
            const isImg = f.type.startsWith("image/");
            const url = isImg ? URL.createObjectURL(f) : null;
            return (
              <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-100 rounded-lg">
                {isImg && url
                  ? <img src={url} alt={f.name} className="w-10 h-10 object-cover rounded border border-gray-200" />
                  : <div className="w-10 h-10 bg-blue-50 rounded border border-blue-100 flex items-center justify-center"><FileText className="w-5 h-5 text-blue-500" /></div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{f.name}</p>
                  <p className="text-xs text-gray-400">{(f.size / 1024).toFixed(1)} KB</p>
                </div>
                <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
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

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="h-px flex-1 bg-gray-100" />
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{title}</span>
      <div className="h-px flex-1 bg-gray-100" />
    </div>
  );
}

// ─── Dynamic field sets ───────────────────────────────────────────────────────

function FollowUpFields({ f, set }: { f: Record<string, any>; set: (k: string, v: any) => void }) {
  return (
    <>
      <DateTimePicker date={f.date || ""} time={f.time || ""} onDateChange={v => set("date", v)} onTimeChange={v => set("time", v)} required />
      <div>
        <Label required>Doctor Assigned</Label>
        <Select value={f.doctor || ""} onChange={v => set("doctor", v)} options={DOCTORS} placeholder="Select doctor" required />
      </div>
      <div>
        <Label>Purpose / Notes</Label>
        <Textarea value={f.notes || ""} onChange={v => set("notes", v)} placeholder="Reason for follow-up, topics to review, lab results to discuss…" rows={3} />
      </div>
      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
        <input
          id="reminder"
          type="checkbox"
          checked={f.reminder || false}
          onChange={e => set("reminder", e.target.checked)}
          className="w-4 h-4 accent-blue-600 rounded"
        />
        <label htmlFor="reminder" className="text-sm font-medium text-blue-800 cursor-pointer">
          Send patient reminder (24 hrs before)
        </label>
      </div>
    </>
  );
}

function ChemoSessionFields({ f, set }: { f: Record<string, any>; set: (k: string, v: any) => void }) {
  return (
    <>
      <DateTimePicker date={f.date || ""} time={f.time || ""} onDateChange={v => set("date", v)} onTimeChange={v => set("time", v)} required />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label required>Cycle Number</Label>
          <Input type="number" value={f.cycleNumber || ""} onChange={v => set("cycleNumber", v)} placeholder="e.g. 3" required />
        </div>
        <div>
          <Label>Total Cycles Planned</Label>
          <Input type="number" value={f.totalCycles || ""} onChange={v => set("totalCycles", v)} placeholder="e.g. 6" />
        </div>
      </div>
      <div>
        <Label required>Protocol</Label>
        <Select value={f.protocol || ""} onChange={v => set("protocol", v)} options={CHEMO_PROTOCOLS} placeholder="Select protocol" required />
      </div>
      <div>
        <Label>Assigned Nurse</Label>
        <Select value={f.nurse || ""} onChange={v => set("nurse", v)} options={NURSES} placeholder="Select nurse" />
      </div>
      <div>
        <Label>Supervising Doctor</Label>
        <Select value={f.doctor || ""} onChange={v => set("doctor", v)} options={DOCTORS} placeholder="Select doctor" />
      </div>
      <div>
        <Label>Pre-Session Notes</Label>
        <Textarea value={f.notes || ""} onChange={v => set("notes", v)} placeholder="Pre-medications, hydration requirements, port access instructions…" rows={3} />
      </div>
    </>
  );
}

function RadioSessionFields({ f, set }: { f: Record<string, any>; set: (k: string, v: any) => void }) {
  return (
    <>
      <DateTimePicker date={f.date || ""} time={f.time || ""} onDateChange={v => set("date", v)} onTimeChange={v => set("time", v)} required />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label required>Session Number</Label>
          <Input type="number" value={f.sessionNumber || ""} onChange={v => set("sessionNumber", v)} placeholder="e.g. 5" required />
        </div>
        <div>
          <Label>Total Sessions Planned</Label>
          <Input type="number" value={f.totalSessions || ""} onChange={v => set("totalSessions", v)} placeholder="e.g. 25" />
        </div>
      </div>
      <div>
        <Label>Target Zone / Field</Label>
        <Input value={f.targetZone || ""} onChange={v => set("targetZone", v)} placeholder="e.g. Left breast, mediastinum, whole pelvis…" />
      </div>
      <div>
        <Label>Assigned Technician / Doctor</Label>
        <Select value={f.technician || ""} onChange={v => set("technician", v)} options={[...TECHNICIANS, ...DOCTORS]} placeholder="Select staff" />
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea value={f.notes || ""} onChange={v => set("notes", v)} placeholder="Positioning, immobilisation devices, special considerations…" rows={3} />
      </div>
    </>
  );
}

function SurgeryFields({ f, set }: { f: Record<string, any>; set: (k: string, v: any) => void }) {
  return (
    <>
      <DateTimePicker date={f.date || ""} time={f.time || ""} onDateChange={v => set("date", v)} onTimeChange={v => set("time", v)} required />
      <div>
        <Label required>Surgeon</Label>
        <Select value={f.surgeon || ""} onChange={v => set("surgeon", v)} options={DOCTORS} placeholder="Select surgeon" required />
      </div>
      <div>
        <Label required>Surgery Type</Label>
        <Select value={f.surgeryType || ""} onChange={v => set("surgeryType", v)} options={SURGERY_TYPES} placeholder="Select surgery type" required />
      </div>
      <div>
        <Label>Anaesthesia Type</Label>
        <div className="flex flex-wrap gap-2">
          {["General", "Regional", "Local", "Sedation / MAC"].map(opt => (
            <button key={opt} type="button"
              onClick={() => set("anaesthesia", opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${f.anaesthesia === opt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Pre-op Instructions</Label>
        <Textarea value={f.preOpInstructions || ""} onChange={v => set("preOpInstructions", v)} placeholder="Fasting requirements, medication holds, bowel prep, consent forms needed…" rows={3} />
      </div>
      <div>
        <Label>Additional Notes</Label>
        <Textarea value={f.notes || ""} onChange={v => set("notes", v)} placeholder="Theatre booking notes, equipment requests, ICU post-op…" rows={2} />
      </div>
    </>
  );
}

function LabFields({ f, set }: { f: Record<string, any>; set: (k: string, v: any) => void }) {
  return (
    <>
      <DateTimePicker date={f.date || ""} time={f.time || ""} onDateChange={v => set("date", v)} onTimeChange={v => set("time", v)} required />
      <div>
        <Label required>Test Type</Label>
        <Select value={f.testType || ""} onChange={v => set("testType", v)} options={LAB_TEST_TYPES} placeholder="Select test type" required />
      </div>
      <div>
        <Label>Fasting Required</Label>
        <div className="flex gap-3">
          {["Yes", "No", "Unknown"].map(opt => (
            <button key={opt} type="button"
              onClick={() => set("fasting", opt)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${f.fasting === opt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Assigned Technician / Doctor</Label>
        <Select value={f.technician || ""} onChange={v => set("technician", v)} options={ALL_STAFF} placeholder="Select staff" />
      </div>
      <div>
        <Label>Clinical Indication / Notes</Label>
        <Textarea value={f.notes || ""} onChange={v => set("notes", v)} placeholder="Reason for test, monitoring parameters, urgent flag…" rows={3} />
      </div>
    </>
  );
}

function ScanFields({ f, set }: { f: Record<string, any>; set: (k: string, v: any) => void }) {
  return (
    <>
      <DateTimePicker date={f.date || ""} time={f.time || ""} onDateChange={v => set("date", v)} onTimeChange={v => set("time", v)} required />
      <div>
        <Label required>Type of Scan</Label>
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
        <Label>Contrast Required</Label>
        <div className="flex gap-3">
          {["Yes", "No", "To be decided"].map(opt => (
            <button key={opt} type="button"
              onClick={() => set("contrast", opt)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${f.contrast === opt ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Assigned Radiologist / Technician</Label>
        <Select value={f.technician || ""} onChange={v => set("technician", v)} options={[...TECHNICIANS, ...DOCTORS]} placeholder="Select staff" />
      </div>
      <div>
        <Label>Clinical Indication</Label>
        <Textarea value={f.notes || ""} onChange={v => set("notes", v)} placeholder="Reason for scan, area of interest, comparison to previous imaging…" rows={3} />
      </div>
      <div>
        <Label>Upload Previous Images (Optional)</Label>
        <FileUpload files={f.files || []} onChange={v => set("files", v)} />
      </div>
    </>
  );
}

function OtherFields({ f, set }: { f: Record<string, any>; set: (k: string, v: any) => void }) {
  return (
    <>
      <DateTimePicker date={f.date || ""} time={f.time || ""} onDateChange={v => set("date", v)} onTimeChange={v => set("time", v)} required />
      <div>
        <Label required>Description</Label>
        <Textarea value={f.description || ""} onChange={v => set("description", v)} placeholder="Describe the appointment purpose…" rows={3} required />
      </div>
      <div>
        <Label>Assigned Staff</Label>
        <Select value={f.staff || ""} onChange={v => set("staff", v)} options={ALL_STAFF} placeholder="Select staff member" />
      </div>
      <div>
        <Label>Additional Notes</Label>
        <Textarea value={f.notes || ""} onChange={v => set("notes", v)} placeholder="Any additional information…" rows={2} />
      </div>
      <div>
        <Label>Attachments (Optional)</Label>
        <FileUpload files={f.files || []} onChange={v => set("files", v)} />
      </div>
    </>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function ScheduleAppointmentModal({ isOpen, onClose, onSave }: Props) {
  const { t } = useLanguage();
  const [apptType, setApptType] = useState<AppointmentType | "">("");
  const [fields, setFields] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const setField = (key: string, value: any) => setFields(prev => ({ ...prev, [key]: value }));

  const reset = () => {
    setApptType("");
    setFields({});
    setErrors([]);
    setSaving(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!apptType) { errs.push("Please select an appointment type."); return errs; }
    if (!fields.date) errs.push("Date is required.");
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }

    setSaving(true);
    setTimeout(() => {
      const newEvent: TimelineEvent = {
        id: generateId(),
        date: formatDateDisplay(fields.date, fields.time),
        type: `Scheduled: ${apptType}`,
        title: buildTitle(apptType as AppointmentType, fields),
        desc: buildDesc(apptType as AppointmentType, fields),
        color: APT_COLORS[apptType as AppointmentType] || "bg-slate-100 text-slate-700",
        iconKey: APT_ICON_KEYS[apptType as AppointmentType] || "file",
      };
      onSave(newEvent);
      reset();
      setSaving(false);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={handleClose} />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-xl bg-white sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t.modal.scheduleAppointment.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{t.modal.scheduleAppointment.selectType}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="schedule-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Error banner */}
            {errors.length > 0 && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <ul className="text-sm text-red-700 space-y-0.5">
                  {errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            {/* Appointment type */}
            <div>
              <Label required>Appointment Type</Label>
              <div className="relative">
                <select
                  value={apptType}
                  onChange={e => { setApptType(e.target.value as AppointmentType); setFields({}); setErrors([]); }}
                  required
                  className="w-full px-3.5 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all bg-white appearance-none pr-10 font-medium"
                >
                  <option value="">Select appointment type…</option>
                  {APPOINTMENT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {apptType && (
                <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${APT_COLORS[apptType as AppointmentType]}`}>
                  {apptType}
                </div>
              )}
            </div>

            {/* Dynamic fields */}
            {apptType && (
              <>
                <SectionDivider title="Appointment Details" />
                {apptType === "Follow-Up Consultation"     && <FollowUpFields     f={fields} set={setField} />}
                {apptType === "Chemotherapy Session"       && <ChemoSessionFields  f={fields} set={setField} />}
                {apptType === "Radiotherapy Session"       && <RadioSessionFields  f={fields} set={setField} />}
                {apptType === "Surgery"                    && <SurgeryFields       f={fields} set={setField} />}
                {apptType === "Lab / Blood Test"           && <LabFields           f={fields} set={setField} />}
                {apptType === "Imaging / Scan"             && <ScanFields          f={fields} set={setField} />}
                {apptType === "Other"                      && <OtherFields         f={fields} set={setField} />}
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
            <Button type="button" variant="outline" onClick={handleClose}>{t.modal.scheduleAppointment.cancel}</Button>
            <Button
              type="submit"
              form="schedule-form"
              disabled={!apptType || saving}
              className="min-w-[140px]"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {t.modal.scheduleAppointment.schedule}…
                </span>
              ) : t.modal.scheduleAppointment.schedule}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
