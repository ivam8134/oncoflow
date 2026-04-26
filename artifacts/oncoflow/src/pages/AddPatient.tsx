import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import {
  CANCER_TYPES,
  CANCER_SUBTYPES,
  type CancerTypeKey,
} from "@/data/cancerTypes";

const CANCER_TYPE_LABEL_KEYS: Record<CancerTypeKey, string> = {
  breast: "cancerBreast",
  lung: "cancerLung",
  colorectal: "cancerColorectal",
  prostate: "cancerProstate",
  lymphoma: "cancerLymphoma",
  leukemia: "cancerLeukemia",
  ovarian: "cancerOvarian",
  brain: "cancerBrain",
};

export default function AddPatient() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancerType, setCancerType] = useState<CancerTypeKey | "">("");
  const [cancerSubtype, setCancerSubtype] = useState<string>("");

  const handleCancerTypeChange = (value: string) => {
    setCancerType(value as CancerTypeKey);
    setCancerSubtype("");
  };

  const availableSubtypes = cancerType ? CANCER_SUBTYPES[cancerType] : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (cancerType && !cancerSubtype) {
      toast({
        title: t.addPatient.subtypeRequired,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const patientPayload = {
      cancer_type: cancerType,
      cancer_subtype: cancerSubtype,
    };
    console.log("Patient payload:", patientPayload);

    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: t.addPatient.patientCreated,
        description: t.addPatient.patientCreatedDesc,
      });
      setLocation("/patients");
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.addPatient.title}</h1>
        <p className="text-muted-foreground mt-1">{t.addPatient.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle>{t.addPatient.personalInfo}</CardTitle>
            <CardDescription>{t.addPatient.personalInfoDesc}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="patientId">{t.addPatient.patientId}</Label>
              <Input id="patientId" placeholder="PT-10100" defaultValue="PT-10100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">{t.addPatient.fullName}</Label>
              <Input id="fullName" placeholder="Jane Doe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">{t.addPatient.dob}</Label>
              <Input id="dob" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">{t.addPatient.gender}</Label>
              <Select defaultValue="female">
                <SelectTrigger>
                  <SelectValue placeholder={t.addPatient.selectGender} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">{t.addPatient.genderFemale}</SelectItem>
                  <SelectItem value="male">{t.addPatient.genderMale}</SelectItem>
                  <SelectItem value="other">{t.addPatient.genderOther}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t.addPatient.phone}</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency">{t.addPatient.emergency}</Label>
              <Input id="emergency" placeholder={t.addPatient.emergencyPlaceholder} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle>{t.addPatient.clinicalDiagnosis}</CardTitle>
            <CardDescription>{t.addPatient.clinicalDiagnosisDesc}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="diagDate">{t.addPatient.diagDate}</Label>
                <Input id="diagDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cancerType">{t.addPatient.cancerType}</Label>
                <Select
                  value={cancerType}
                  onValueChange={handleCancerTypeChange}
                  required
                >
                  <SelectTrigger id="cancerType">
                    <SelectValue placeholder={t.addPatient.selectCancerType} />
                  </SelectTrigger>
                  <SelectContent>
                    {CANCER_TYPES.map((typeKey) => (
                      <SelectItem key={typeKey} value={typeKey}>
                        {(t.patients as Record<string, string>)[CANCER_TYPE_LABEL_KEYS[typeKey]]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cancerSubtype">{t.addPatient.cancerSubtype}</Label>
                <Select
                  value={cancerSubtype}
                  onValueChange={setCancerSubtype}
                  disabled={!cancerType}
                  required
                >
                  <SelectTrigger id="cancerSubtype">
                    <SelectValue
                      placeholder={
                        cancerType
                          ? t.addPatient.selectCancerSubtype
                          : t.addPatient.selectTypeFirst
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubtypes.map((subKey) => (
                      <SelectItem key={subKey} value={subKey}>
                        {(t.patients.subtypes as Record<string, string>)[subKey]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stage">{t.addPatient.stageLabel}</Label>
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder={t.addPatient.selectStage} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I">Stage I</SelectItem>
                    <SelectItem value="II">Stage II</SelectItem>
                    <SelectItem value="III">Stage III</SelectItem>
                    <SelectItem value="IV">Stage IV</SelectItem>
                    <SelectItem value="unknown">{t.addPatient.unknownStage}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">{t.addPatient.grade}</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t.addPatient.selectGrade} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="G1">{t.addPatient.gradeG1}</SelectItem>
                    <SelectItem value="G2">{t.addPatient.gradeG2}</SelectItem>
                    <SelectItem value="G3">{t.addPatient.gradeG3}</SelectItem>
                    <SelectItem value="G4">{t.addPatient.gradeG4}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="biomarkers">{t.addPatient.biomarkers}</Label>
              <Input id="biomarkers" placeholder={t.addPatient.biomarkersPlaceholder} />
              <p className="text-xs text-muted-foreground">{t.addPatient.biomarkersHelp}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="flex items-center justify-between rounded-lg border p-4 bg-gray-50/50">
                <div className="space-y-0.5">
                  <Label className="text-base">{t.addPatient.metastasis}</Label>
                  <p className="text-sm text-muted-foreground">{t.addPatient.metastasisDesc}</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4 bg-gray-50/50">
                <div className="space-y-0.5">
                  <Label className="text-base">{t.addPatient.recurrence}</Label>
                  <p className="text-sm text-muted-foreground">{t.addPatient.recurrenceDesc}</p>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle>{t.addPatient.assignmentStatus}</CardTitle>
            <CardDescription>{t.addPatient.assignmentStatusDesc}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="doctor">{t.addPatient.assignedOncologist}</Label>
              <Select defaultValue="dr.chen">
                <SelectTrigger>
                  <SelectValue placeholder={t.addPatient.selectDoctor} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dr.chen">Dr. Sarah Chen</SelectItem>
                  <SelectItem value="dr.webb">Dr. Marcus Webb</SelectItem>
                  <SelectItem value="dr.patel">Dr. Priya Patel</SelectItem>
                  <SelectItem value="dr.morrison">Dr. James Morrison</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{t.addPatient.currentStatus}</Label>
              <Select defaultValue="active" required>
                <SelectTrigger>
                  <SelectValue placeholder={t.addPatient.selectStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t.addPatient.statusActiveTreatment}</SelectItem>
                  <SelectItem value="follow-up">{t.addPatient.statusFollowUp}</SelectItem>
                  <SelectItem value="remission">{t.addPatient.statusRemission}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">{t.addPatient.initialNotes}</Label>
              <Textarea id="notes" placeholder={t.addPatient.initialNotesPlaceholder} className="min-h-[100px]" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" type="button" onClick={() => setLocation("/patients")}>{t.addPatient.cancel}</Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
            {isSubmitting ? t.addPatient.saving : t.addPatient.saveRecord}
          </Button>
        </div>
      </form>
    </div>
  );
}
