import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText, FileSpreadsheet, Download, FileJson,
  PieChart, Activity, CheckCircle2, Loader2, Clock
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { mockPatients } from "@/data/mockData";
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecentExport {
  filename: string;
  type: string;
  date: string;
  size: string;
  blob: Blob | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function nowLabel(): string {
  return new Date().toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── PDF generation (HTML → printable Blob via data URI) ──────────────────────

function buildPatientSummaryHTML(patient: typeof mockPatients[0]): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Patient Summary – ${patient.name}</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; margin: 40px; font-size: 13px; line-height: 1.6; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; color: #0f172a; }
  .subtitle { color: #64748b; font-size: 12px; margin-bottom: 24px; }
  .divider { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .field label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; font-weight: 600; margin-bottom: 2px; }
  .field .value { font-weight: 600; color: #0f172a; font-size: 13px; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
  .active { background: #dbeafe; color: #1d4ed8; }
  .follow-up { background: #fef9c3; color: #854d0e; }
  .remission { background: #dcfce7; color: #15803d; }
  .deceased { background: #f1f5f9; color: #475569; }
  .recurrence { background: #fee2e2; color: #b91c1c; }
  .section-title { font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 12px; }
  .timeline-item { border-left: 3px solid #3b82f6; padding-left: 16px; margin-bottom: 14px; }
  .timeline-item .date { font-size: 11px; color: #94a3b8; }
  .timeline-item .title { font-weight: 600; color: #0f172a; }
  footer { margin-top: 48px; font-size: 10px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
  <h1>${patient.name}</h1>
  <div class="subtitle">Patient ID: ${patient.id} &nbsp;·&nbsp; Generated: ${nowLabel()}</div>
  <hr class="divider"/>

  <div class="section-title">Clinical Overview</div>
  <div class="grid">
    <div class="field"><label>Cancer Type</label><div class="value">${patient.cancerType}</div></div>
    <div class="field"><label>Stage</label><div class="value">Stage ${patient.stage}</div></div>
    <div class="field"><label>Status</label><div class="value"><span class="badge ${patient.status.toLowerCase().replace(" ", "-")}">${patient.status}</span></div></div>
    <div class="field"><label>Age</label><div class="value">${patient.age} years</div></div>
    <div class="field"><label>Biomarkers</label><div class="value">${patient.biomarkers}</div></div>
    <div class="field"><label>Assigned Oncologist</label><div class="value">${patient.doctor}</div></div>
    <div class="field"><label>Last Visit</label><div class="value">${patient.lastVisit}</div></div>
    ${patient.nextScan ? `<div class="field"><label>Next Scan</label><div class="value">${patient.nextScan}</div></div>` : ""}
  </div>

  <hr class="divider"/>
  <div class="section-title">Treatment Summary</div>
  <div class="timeline-item">
    <div class="date">Current</div>
    <div class="title">AC-T Regimen — Cycle 4 of 6</div>
    <div>Patient is tolerating treatment with manageable side effects. Partial response noted on last imaging.</div>
  </div>
  <div class="timeline-item">
    <div class="date">Mar 2024</div>
    <div class="title">Chemotherapy Cycle 4 Complete</div>
    <div>Dose maintained. Neuropathy Grade 1 noted.</div>
  </div>
  <div class="timeline-item">
    <div class="date">Jan 2024</div>
    <div class="title">Mid-Treatment PET/CT</div>
    <div>30% reduction in primary tumor mass. No new lesions detected.</div>
  </div>
  <div class="timeline-item">
    <div class="date">Nov 2023</div>
    <div class="title">Primary Resection Surgery</div>
    <div>Successful procedure. Pathology confirmed clear margins.</div>
  </div>

  <footer>OncoFlow Clinical Registry Platform &nbsp;·&nbsp; Authorized personnel only &nbsp;·&nbsp; Confidential</footer>
</body>
</html>`;
}

function buildTimelineHTML(): string {
  const rows = mockPatients.slice(0, 5).map(p => `
    <div class="patient-block">
      <h3>${p.name} <span class="pid">(${p.id})</span></h3>
      <div class="meta">${p.cancerType} &nbsp;·&nbsp; Stage ${p.stage} &nbsp;·&nbsp; ${p.doctor}</div>
      <div class="timeline">
        <div class="t-item"><span class="t-date">Nov 2023</span><span class="t-title">Diagnosis & Staging</span></div>
        <div class="t-item"><span class="t-date">Dec 2023</span><span class="t-title">Treatment Initiated — AC-T Regimen</span></div>
        <div class="t-item"><span class="t-date">Jan 2024</span><span class="t-title">Mid-Treatment Imaging — Partial Response</span></div>
        <div class="t-item"><span class="t-date">Mar 2024</span><span class="t-title">Cycle 4 Complete — Ongoing</span></div>
      </div>
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Treatment Timeline Export</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; margin: 40px; font-size: 13px; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .subtitle { color: #64748b; font-size: 12px; margin-bottom: 30px; }
  .patient-block { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px; break-inside: avoid; }
  .patient-block h3 { font-size: 15px; font-weight: 700; margin: 0 0 4px; }
  .pid { font-weight: 400; color: #64748b; font-size: 12px; }
  .meta { font-size: 11px; color: #94a3b8; margin-bottom: 12px; }
  .timeline { border-left: 2px solid #3b82f6; padding-left: 16px; }
  .t-item { display: flex; gap: 12px; margin-bottom: 8px; font-size: 12px; }
  .t-date { color: #94a3b8; min-width: 80px; }
  .t-title { font-weight: 600; }
  footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
  <h1>Treatment Timeline Report</h1>
  <div class="subtitle">Generated: ${nowLabel()} &nbsp;·&nbsp; OncoFlow Clinical Registry</div>
  ${rows}
  <footer>OncoFlow Clinical Registry Platform &nbsp;·&nbsp; Authorized personnel only &nbsp;·&nbsp; Confidential</footer>
</body>
</html>`;
}

function buildMeetingSummaryHTML(): string {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const scheduled = mockPatients.filter(p => p.status === "Active" || p.status === "Follow-up").slice(0, 4);

  const cards = scheduled.map(p => `
    <div class="card">
      <div class="card-header">
        <span class="name">${p.name}</span>
        <span class="id">${p.id}</span>
      </div>
      <div class="card-meta">${p.cancerType} · Stage ${p.stage} · ${p.doctor}</div>
      <div class="points-title">Talking Points</div>
      <ul class="points">
        <li>Review current side effects, particularly neuropathy progression (currently Grade 1).</li>
        <li>Discuss encouraging mid-treatment scan results — 30% reduction in primary tumor.</li>
        <li>Explain rationale for remaining ${p.stage === "III" || p.stage === "IV" ? "4" : "2"} chemotherapy cycles.</li>
        ${p.nextScan ? `<li>Confirm upcoming imaging appointment: <strong>${p.nextScan}</strong></li>` : ""}
        <li>Biomarker profile to discuss: <strong>${p.biomarkers}</strong></li>
      </ul>
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Meeting Summary Export</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; margin: 40px; font-size: 13px; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .subtitle { color: #64748b; font-size: 12px; margin-bottom: 30px; }
  .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px; break-inside: avoid; }
  .card-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
  .name { font-size: 15px; font-weight: 700; }
  .id { font-size: 11px; color: #94a3b8; font-family: monospace; }
  .card-meta { font-size: 11px; color: #64748b; margin-bottom: 12px; }
  .points-title { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; font-weight: 600; color: #94a3b8; margin-bottom: 6px; }
  .points { margin: 0; padding-left: 18px; }
  .points li { margin-bottom: 5px; font-size: 12px; line-height: 1.6; }
  footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
  <h1>Meeting Summary — Today's Patients</h1>
  <div class="subtitle">${today} &nbsp;·&nbsp; OncoFlow Clinical Registry</div>
  ${cards}
  <footer>OncoFlow Clinical Registry Platform &nbsp;·&nbsp; Authorized personnel only &nbsp;·&nbsp; Confidential</footer>
</body>
</html>`;
}

/** Convert an HTML string → Blob (text/html for browser-based printing) */
function htmlToBlob(html: string): Blob {
  return new Blob([html], { type: "text/html;charset=utf-8" });
}

// ─── Excel / CSV generators ──────────────────────────────────────────────────

function generateExcelBlob(): Blob {
  const rows = mockPatients.map(p => ({
    "Patient ID": p.id,
    "Full Name": p.name,
    "Age": p.age,
    "Cancer Type": p.cancerType,
    "Stage": `Stage ${p.stage}`,
    "Status": p.status,
    "Assigned Oncologist": p.doctor,
    "Biomarkers": p.biomarkers,
    "Last Visit": p.lastVisit,
    "Next Scan": p.nextScan ?? "Not Scheduled",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 12 }, { wch: 22 }, { wch: 6 }, { wch: 14 }, { wch: 10 },
    { wch: 14 }, { wch: 24 }, { wch: 28 }, { wch: 14 }, { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Patient Registry");

  // Add a stats sheet
  const stats = [
    { "Metric": "Total Patients",          "Value": mockPatients.length },
    { "Metric": "Active Treatment",        "Value": mockPatients.filter(p => p.status === "Active").length },
    { "Metric": "Follow-up",               "Value": mockPatients.filter(p => p.status === "Follow-up").length },
    { "Metric": "Remission",               "Value": mockPatients.filter(p => p.status === "Remission").length },
    { "Metric": "Recurrence",              "Value": mockPatients.filter(p => p.status === "Recurrence").length },
    { "Metric": "Deceased",                "Value": mockPatients.filter(p => p.status === "Deceased").length },
    { "Metric": "Export Date",             "Value": nowLabel() },
  ];
  const ws2 = XLSX.utils.json_to_sheet(stats);
  ws2["!cols"] = [{ wch: 28 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Summary Stats");

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

function generateCSVBlob(): Blob {
  const headers = [
    "patient_id", "name", "age", "cancer_type", "stage", "status",
    "doctor", "biomarkers", "last_visit", "next_scan",
  ];

  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [
    headers.join(","),
    ...mockPatients.map(p =>
      [
        p.id, p.name, p.age, p.cancerType, `Stage ${p.stage}`, p.status,
        p.doctor, p.biomarkers, p.lastVisit, p.nextScan ?? "",
      ].map(escape).join(",")
    ),
  ];

  return new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
}

function generateSurvivalCSVBlob(): Blob {
  // Aggregated stats by cancer type + stage
  type Row = { cancer_type: string; stage: string; n: number; alive: number; deceased: number; survival_rate: string; avg_age: number };
  const grouped: Record<string, Row> = {};

  mockPatients.forEach(p => {
    const key = `${p.cancerType}|Stage ${p.stage}`;
    if (!grouped[key]) {
      grouped[key] = { cancer_type: p.cancerType, stage: `Stage ${p.stage}`, n: 0, alive: 0, deceased: 0, survival_rate: "", avg_age: 0 };
    }
    grouped[key].n++;
    grouped[key].avg_age += p.age;
    if (p.status === "Deceased") grouped[key].deceased++;
    else grouped[key].alive++;
  });

  const rows = Object.values(grouped).map(r => ({
    ...r,
    avg_age: Math.round(r.avg_age / r.n),
    survival_rate: `${((r.alive / r.n) * 100).toFixed(0)}%`,
  }));

  const headers = ["cancer_type", "stage", "n", "alive", "deceased", "survival_rate", "avg_age"];
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return s.includes(",") ? `"${s}"` : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map(r => headers.map(h => escape(r[h as keyof typeof r])).join(",")),
  ];

  return new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
}

// ─── Export actions ───────────────────────────────────────────────────────────

type ExportKey =
  | "pdf-summary"
  | "excel-registry"
  | "csv-analytics"
  | "pdf-timeline"
  | "pdf-meeting"
  | "csv-survival";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Exports() {
  const { t } = useLanguage();
  const [loadingKey, setLoadingKey] = useState<ExportKey | null>(null);
  const [recentExports, setRecentExports] = useState<RecentExport[]>([]);

  const handleExport = async (key: ExportKey) => {
    setLoadingKey(key);

    // Small artificial delay so the loading state is visible
    await new Promise(r => setTimeout(r, 600));

    try {
      let blob: Blob;
      let filename: string;
      let typeLabel: string;

      switch (key) {
        case "pdf-summary": {
          // Export the first patient as a representative summary
          const patient = mockPatients[0];
          const html = buildPatientSummaryHTML(patient);
          blob = htmlToBlob(html);
          filename = `Summary_${patient.id}_${Date.now()}.html`;
          typeLabel = "HTML/PDF";
          break;
        }
        case "pdf-timeline": {
          const html = buildTimelineHTML();
          blob = htmlToBlob(html);
          filename = `Timeline_Export_${Date.now()}.html`;
          typeLabel = "HTML/PDF";
          break;
        }
        case "pdf-meeting": {
          const html = buildMeetingSummaryHTML();
          blob = htmlToBlob(html);
          filename = `Meeting_Summary_${Date.now()}.html`;
          typeLabel = "HTML/PDF";
          break;
        }
        case "excel-registry": {
          blob = generateExcelBlob();
          filename = `Registry_${new Date().toISOString().slice(0, 10)}.xlsx`;
          typeLabel = "Excel";
          break;
        }
        case "csv-analytics": {
          blob = generateCSVBlob();
          filename = `Analytics_Export_${Date.now()}.csv`;
          typeLabel = "CSV";
          break;
        }
        case "csv-survival": {
          blob = generateSurvivalCSVBlob();
          filename = `Survival_Stats_${Date.now()}.csv`;
          typeLabel = "CSV";
          break;
        }
        default:
          return;
      }

      downloadBlob(blob, filename);

      setRecentExports(prev => [
        {
          filename,
          type: typeLabel,
          date: nowLabel(),
          size: formatBytes(blob.size),
          blob,
        },
        ...prev.slice(0, 9), // keep last 10
      ]);

      toast({
        title: t.exports.exportStarted,
        description: `${filename} is downloading.`,
      });
    } catch (err) {
      toast({
        title: "Export failed",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setLoadingKey(null);
    }
  };

  const handleReDownload = (ex: RecentExport) => {
    if (ex.blob) downloadBlob(ex.blob, ex.filename);
  };

  const exportOptions: {
    key: ExportKey;
    titleKey: string;
    descKey: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    badge: string;
  }[] = [
    {
      key: "pdf-summary",
      titleKey: t.exports.pdfTitle,
      descKey: t.exports.pdfDesc + " Opens as an HTML file — use your browser's Print → Save as PDF.",
      icon: FileText,
      color: "text-red-500",
      bg: "bg-red-50",
      badge: "HTML → PDF",
    },
    {
      key: "excel-registry",
      titleKey: t.exports.excelTitle,
      descKey: t.exports.excelDesc,
      icon: FileSpreadsheet,
      color: "text-green-600",
      bg: "bg-green-50",
      badge: "XLSX",
    },
    {
      key: "csv-analytics",
      titleKey: t.exports.csvTitle,
      descKey: t.exports.csvDesc,
      icon: FileJson,
      color: "text-blue-500",
      bg: "bg-blue-50",
      badge: "CSV",
    },
    {
      key: "pdf-timeline",
      titleKey: t.exports.timelinePdfTitle,
      descKey: t.exports.timelinePdfDesc + " Opens as an HTML file — print to PDF from your browser.",
      icon: Activity,
      color: "text-purple-500",
      bg: "bg-purple-50",
      badge: "HTML → PDF",
    },
    {
      key: "pdf-meeting",
      titleKey: t.exports.meetingSummaryTitle,
      descKey: t.exports.meetingSummaryDesc,
      icon: FileText,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
      badge: "HTML → PDF",
    },
    {
      key: "csv-survival",
      titleKey: t.exports.survivalTitle,
      descKey: t.exports.survivalDesc,
      icon: PieChart,
      color: "text-orange-500",
      bg: "bg-orange-50",
      badge: "CSV",
    },
  ];

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.exports.title}</h1>
        <p className="text-muted-foreground mt-1">{t.exports.subtitle}</p>
      </div>

      {/* Export cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exportOptions.map((opt) => {
          const isLoading = loadingKey === opt.key;
          return (
            <Card
              key={opt.key}
              className="shadow-sm hover:shadow-md transition-shadow border-gray-200 flex flex-col"
            >
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg ${opt.bg} flex items-center justify-center`}>
                    <opt.icon className={`w-6 h-6 ${opt.color}`} />
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold">
                    {opt.badge}
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">{opt.titleKey}</h3>
                <p className="text-sm text-muted-foreground mb-auto min-h-[60px]">{opt.descKey}</p>
                <Button
                  onClick={() => handleExport(opt.key)}
                  disabled={isLoading || loadingKey !== null}
                  className="w-full gap-2 mt-5"
                  variant="outline"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      {t.exports.exportReport}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent exports — generated in this session */}
      <Card className="shadow-sm mt-8">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle>{t.exports.recentExports}</CardTitle>
          <CardDescription>
            {recentExports.length === 0
              ? "Files you export during this session will appear here for quick re-download."
              : t.exports.recentExportsDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {recentExports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-400">No exports yet this session</p>
              <p className="text-xs text-gray-300 mt-1">Generated files will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-gray-50 border-b border-border uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">{t.exports.tableFilename}</th>
                    <th className="px-6 py-3 font-medium">{t.exports.tableFormat}</th>
                    <th className="px-6 py-3 font-medium">{t.exports.tableGeneratedOn}</th>
                    <th className="px-6 py-3 font-medium">{t.exports.tableSize}</th>
                    <th className="px-6 py-3 font-medium text-right">{t.exports.tableAction}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExports.map((file, i) => (
                    <tr
                      key={i}
                      className="bg-white border-b border-border hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          <span className="font-mono text-xs">{file.filename}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold">
                          {file.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">{file.date}</td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">{file.size}</td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-primary"
                          onClick={() => handleReDownload(file)}
                          disabled={!file.blob}
                        >
                          <Download className="w-4 h-4" />
                          {t.exports.download}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}