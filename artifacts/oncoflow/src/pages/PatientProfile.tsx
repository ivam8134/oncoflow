import { useState } from "react";
import { useParams, Link } from "wouter";
import { mockPatients, getStatusColor } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  Activity,
  Stethoscope,
  Microscope,
  FileText,
  Pill,
  ArrowLeft,
  Plus,
  Zap,
  Shield,
  Scan,
  AlertTriangle,
  Heart,
  CheckCircle2,
} from "lucide-react";
import AddEventModal, { TimelineEvent } from "@/components/AddEventModal";
import ScheduleAppointmentModal from "@/components/ScheduleAppointmentModal";
import { useLanguage } from "@/context/LanguageContext";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  activity: Activity,
  microscope: Microscope,
  scalpel: Stethoscope,
  pill: Pill,
  zap: Zap,
  shield: Shield,
  scan: Scan,
  alert: AlertTriangle,
  heart: Heart,
  file: FileText,
};

function getIcon(key: string) {
  return ICON_MAP[key] || FileText;
}

const DEFAULT_EVENTS: TimelineEvent[] = [
  {
    id: "evt-default-1",
    date: "Oct 12, 2023",
    type: "Diagnosis",
    title: "Diagnosed with Stage II Breast Cancer",
    desc: "Site: Right Breast · Grade: High (Grade 3) · Biomarkers: ER+, PR+, HER2-",
    color: "bg-blue-100 text-blue-600",
    iconKey: "activity",
  },
  {
    id: "evt-default-2",
    date: "Oct 18, 2023",
    type: "Biopsy / Pathology",
    title: "Core Needle Biopsy Performed",
    desc: "Invasive ductal carcinoma confirmed. Nottingham grade 2. Margins not applicable.",
    color: "bg-indigo-100 text-indigo-600",
    iconKey: "microscope",
  },
  {
    id: "evt-default-3",
    date: "Nov 05, 2023",
    type: "Surgery",
    title: "Lumpectomy — Dr. Sarah Chen",
    desc: "Clear (Negative) margins · Post-op pathology confirmed complete local excision.",
    color: "bg-purple-100 text-purple-600",
    iconKey: "scalpel",
  },
  {
    id: "evt-default-4",
    date: "Dec 01, 2023",
    type: "Chemotherapy",
    title: "Chemotherapy — Cycle 1 (AC-T Regimen)",
    desc: "Response: Partial Response (PR) · Side effects: Nausea, Fatigue · Dose: 60 mg/m²",
    color: "bg-orange-100 text-orange-600",
    iconKey: "pill",
  },
  {
    id: "evt-default-5",
    date: "Jan 15, 2024",
    type: "Scan / Imaging",
    title: "PET-CT — Partial response observed. No distant metastases.",
    desc: "RECIST: Partial Response (PR) · Reported by Dr. Marcus Webb",
    color: "bg-cyan-100 text-cyan-600",
    iconKey: "scan",
  },
  {
    id: "evt-default-6",
    date: "Mar 01, 2024",
    type: "Chemotherapy",
    title: "Chemotherapy — Cycle 4 (AC-T Regimen)",
    desc: "Response: Stable Disease (SD) · Side effects: Neuropathy, Fatigue · Dose adjusted.",
    color: "bg-orange-100 text-orange-600",
    iconKey: "pill",
  },
];

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-5 py-3.5 bg-gray-900 text-white rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onDismiss} className="ml-2 text-gray-400 hover:text-white transition-colors text-lg leading-none">
        ×
      </button>
    </div>
  );
}

export default function PatientProfile() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const patient = mockPatients.find(p => p.id === id) || mockPatients[0];

  const [events, setEvents] = useState<TimelineEvent[]>(DEFAULT_EVENTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const addToTimeline = (event: TimelineEvent, message: string) => {
    setEvents(prev => {
      const parseDate = (d: string) => {
        const parsed = new Date(d);
        return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
      };
      return [...prev, event].sort((a, b) => parseDate(a.date) - parseDate(b.date));
    });
    setToast(message);
    setTimeout(() => setToast(null), 4500);
  };

  const handleSaveEvent = (event: TimelineEvent) => {
    addToTimeline(event, t.patientProfile.eventAddedToast);
    setModalOpen(false);
  };

  const handleSaveAppointment = (event: TimelineEvent) => {
    addToTimeline(event, t.patientProfile.appointmentScheduledToast);
    setScheduleModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="sm" asChild className="p-0 h-auto hover:bg-transparent text-muted-foreground hover:text-foreground">
          <Link href="/patients"><ArrowLeft className="w-4 h-4 mr-1" /> {t.patientProfile.backToPatients}</Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex gap-5 items-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border border-primary/20">
            {patient.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{patient.name}</h1>
              <Badge variant="outline" className={`${getStatusColor(patient.status)} border-transparent text-sm`}>
                {patient.status}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-muted-foreground text-sm">
              <span className="flex items-center gap-1 font-mono"><User className="w-4 h-4" /> {patient.id}</span>
              <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4" /> {patient.age} {t.patientProfile.yearsOld}</span>
              <span className="flex items-center gap-1"><Stethoscope className="w-4 h-4" /> {patient.doctor}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">{t.patientProfile.editPatient}</Button>
          <Button onClick={() => setScheduleModalOpen(true)}>{t.patientProfile.scheduleAppointment}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> {t.patientProfile.clinicalDiagnosis}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">{t.patientProfile.primaryCancer}</span>
                <p className="font-semibold text-lg text-foreground mt-1">{patient.cancerType}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">{t.patientProfile.stage}</span>
                  <p className="font-medium text-foreground mt-1">Stage {patient.stage}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">{t.patientProfile.status}</span>
                  <p className="font-medium text-foreground mt-1">{patient.status}</p>
                </div>
              </div>
              <Separator />
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider flex items-center gap-1">
                  <Microscope className="w-3 h-3" /> {t.patientProfile.biomarkers}
                </span>
                <p className="font-medium text-foreground mt-1 bg-muted/50 p-2 rounded-md">{patient.biomarkers}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" /> {t.patientProfile.currentTreatment}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">{t.patientProfile.protocol}</span>
                <p className="font-medium text-foreground mt-1">AC-T Regimen</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">{t.patientProfile.progress}</span>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "66%" }} />
                  </div>
                  <span className="text-sm font-medium">Cycle 4 of 6</span>
                </div>
              </div>
              {patient.nextScan && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">{t.patientProfile.nextScan}</span>
                  <p className="font-medium text-foreground mt-1 text-teal-700">{patient.nextScan}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> {t.patientProfile.demographicsContact}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{patient.name.toLowerCase().replace(' ', '.')}@example.com</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>123 Medical Way, Apt 4B<br />Cityville, ST 12345</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> {t.patientProfile.clinicalTimeline}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{events.length} {t.patientProfile.eventsRecorded}</p>
              </div>
              <Button
                size="sm"
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.patientProfile.addEvent}
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">{t.patientProfile.noEventsYet}</p>
                  <p className="text-xs text-gray-400 mt-1 mb-4">{t.patientProfile.noEventsDesc}</p>
                  <Button size="sm" onClick={() => setModalOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> {t.patientProfile.addFirstEvent}
                  </Button>
                </div>
              ) : (
                <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                  {events.map((event) => {
                    const Icon = getIcon(event.iconKey);
                    const isNew = event.id.startsWith("evt-") && !event.id.startsWith("evt-default");
                    return (
                      <div
                        key={event.id}
                        className={`relative flex items-start gap-4 ${isNew ? "animate-in slide-in-from-bottom-3 duration-300" : ""}`}
                      >
                        <div className="absolute -left-6 w-10 flex items-center justify-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white ${event.color} shadow-sm z-10`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <div className={`flex-1 border rounded-lg p-4 ml-6 transition-colors ${isNew ? "bg-blue-50/40 border-blue-100" : "bg-gray-50 border-gray-100 hover:bg-gray-100/50"}`}>
                          <div className="flex justify-between items-start mb-1 gap-2">
                            <h4 className="font-semibold text-foreground text-sm leading-snug">{event.title}</h4>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isNew && (
                                <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">{t.patientProfile.newBadge}</span>
                              )}
                              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{event.date}</span>
                            </div>
                          </div>
                          <Badge variant="secondary" className={`mb-2 font-normal text-xs ${event.color} border-0`}>
                            {event.type}
                          </Badge>
                          {event.desc && (
                            <p className="text-sm text-muted-foreground leading-relaxed">{event.desc}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="relative flex items-center gap-4">
                    <div className="absolute -left-6 w-10 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="ml-6 flex-1 border border-dashed border-gray-200 rounded-lg p-3 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/30 transition-all text-left"
                    >
                      {t.patientProfile.addNextEvent}
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AddEventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEvent}
      />

      <ScheduleAppointmentModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSave={handleSaveAppointment}
      />

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
