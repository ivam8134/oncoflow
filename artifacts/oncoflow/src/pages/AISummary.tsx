import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { mockPatients } from "@/data/mockData";
import { BrainCircuit, RefreshCw, FileCheck, Stethoscope, AlertCircle, Activity, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { getStatusColor } from "@/data/mockData";

export default function AISummary() {
  const { t } = useLanguage();
  const [selectedPatient, setSelectedPatient] = useState(mockPatients[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const patient = mockPatients.find(p => p.id === selectedPatient) || mockPatients[0];

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast({ title: t.aiSummary.summaryUpdated, description: t.aiSummary.summaryUpdatedDesc });
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BrainCircuit className="w-8 h-8 text-primary" /> {t.aiSummary.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.aiSummary.subtitle}</p>
        </div>
        <div className="w-full sm:w-[300px]">
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger className="bg-white border-primary/20">
              <SelectValue placeholder={t.aiSummary.selectPatient} />
            </SelectTrigger>
            <SelectContent>
              {mockPatients.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name} ({p.id})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isGenerating ? (
        <Card className="h-[500px] flex flex-col items-center justify-center border-dashed border-2 border-primary/20 bg-primary/5">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
          <h3 className="text-lg font-medium text-primary">{t.aiSummary.synthesizing}</h3>
          <p className="text-sm text-muted-foreground max-w-sm text-center mt-2">
            {t.aiSummary.synthesizingDesc}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm border-blue-100 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>
              <CardHeader className="bg-slate-50/80 border-b border-gray-100 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Sparkles className="w-5 h-5 text-indigo-500" /> {t.aiSummary.clinicalOverview}
                    </CardTitle>
                    <CardDescription className="mt-1">{t.aiSummary.generatedAt}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleRegenerate} className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                    <RefreshCw className="w-4 h-4" /> {t.aiSummary.regenerate}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-base leading-relaxed text-foreground mb-6">
                  {t.aiSummary.patientSummary(patient.name, patient.age, patient.stage, patient.cancerType)}{" "}
                  Biomarker profile shows <span className="bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded text-sm font-mono">{patient.biomarkers}</span>. 
                  Currently undergoing active treatment protocol. Recent scans indicate a partial response to chemotherapy with no evidence of new metastatic disease. 
                  Patient reports mild side effects primarily manageable with current supportive care.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block mb-1">{t.aiSummary.status}</span>
                    <Badge variant="outline" className={`${getStatusColor(patient.status)} border-transparent`}>{patient.status}</Badge>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block mb-1">{t.aiSummary.treatmentPhase}</span>
                    <span className="font-semibold text-foreground text-sm">Cycle 4 of 6</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block mb-1">{t.aiSummary.latestResponse}</span>
                    <span className="font-semibold text-teal-600 text-sm">{t.aiSummary.partialResponse}</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block mb-1">{t.aiSummary.nextScan}</span>
                    <span className="font-semibold text-foreground text-sm">{patient.nextScan || t.aiSummary.notScheduled}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" /> {t.aiSummary.keyTimeline}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  <li className="flex gap-4">
                    <div className="w-24 shrink-0 text-sm font-medium text-muted-foreground text-right mt-0.5">Mar 2024</div>
                    <div className="flex-1 pb-4 border-b border-gray-100">
                      <p className="font-medium text-foreground mb-1">{t.aiSummary.chemoComplete}</p>
                      <p className="text-sm text-muted-foreground">{t.aiSummary.chemoCompleteDesc}</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-24 shrink-0 text-sm font-medium text-muted-foreground text-right mt-0.5">Jan 2024</div>
                    <div className="flex-1 pb-4 border-b border-gray-100">
                      <p className="font-medium text-foreground mb-1">{t.aiSummary.midTreatmentScan}</p>
                      <p className="text-sm text-muted-foreground">{t.aiSummary.midTreatmentScanDesc}</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-24 shrink-0 text-sm font-medium text-muted-foreground text-right mt-0.5">Nov 2023</div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground mb-1">{t.aiSummary.primaryResection}</p>
                      <p className="text-sm text-muted-foreground">{t.aiSummary.primaryResectionDesc}</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-sm border-orange-200 bg-orange-50/30">
              <CardHeader className="pb-3 border-b border-orange-100">
                <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
                  <AlertCircle className="w-5 h-5" /> {t.aiSummary.clinicalAlerts}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="bg-white p-3 rounded border border-orange-200 shadow-sm text-sm">
                  <span className="font-semibold text-orange-800 block mb-1">{t.aiSummary.alert1Title}</span>
                  {t.aiSummary.alert1Desc}
                </div>
                <div className="bg-white p-3 rounded border border-orange-200 shadow-sm text-sm">
                  <span className="font-semibold text-orange-800 block mb-1">{t.aiSummary.alert2Title}</span>
                  {t.aiSummary.alert2Desc}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-3 border-b border-blue-100">
                <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                  <Stethoscope className="w-5 h-5" /> {t.aiSummary.meetingAssistant}
                </CardTitle>
                <CardDescription className="text-blue-700/70">{t.aiSummary.meetingAssistantDesc}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3 text-sm text-blue-900">
                  <li className="flex gap-2 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                    <p>{t.aiSummary.meeting1}</p>
                  </li>
                  <li className="flex gap-2 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                    <p>{t.aiSummary.meeting2}</p>
                  </li>
                  <li className="flex gap-2 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                    <p>{t.aiSummary.meeting3}</p>
                  </li>
                </ul>
                <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  <FileCheck className="w-4 h-4" /> {t.aiSummary.copyToClipboard}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
