import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockPatients, getStatusColor } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Search } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function PatientsList() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cancerFilter, setCancerFilter] = useState("all");

  const filteredPatients = mockPatients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesCancer = cancerFilter === "all" || p.cancerType === cancerFilter;
    return matchesSearch && matchesStatus && matchesCancer;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.patients.title}</h1>
          <p className="text-muted-foreground mt-1">{t.patients.subtitle}</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/add-patient">{t.patients.addNewPatient}</Link>
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={t.patients.searchPlaceholder}
                className="pl-9 w-full bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px] bg-white">
                  <SelectValue placeholder={t.patients.tableStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.patients.allStatuses}</SelectItem>
                  <SelectItem value="Active">{t.patients.statusActive}</SelectItem>
                  <SelectItem value="Follow-up">{t.patients.statusFollowUp}</SelectItem>
                  <SelectItem value="Remission">{t.patients.statusRemission}</SelectItem>
                  <SelectItem value="Recurrence">{t.patients.statusRecurrence}</SelectItem>
                  <SelectItem value="Deceased">{t.patients.statusDeceased}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cancerFilter} onValueChange={setCancerFilter}>
                <SelectTrigger className="w-full md:w-[160px] bg-white">
                  <SelectValue placeholder={t.patients.tableDiagnosis} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.patients.allTypes}</SelectItem>
                  <SelectItem value="Breast">{t.patients.cancerBreast}</SelectItem>
                  <SelectItem value="Lung">{t.patients.cancerLung}</SelectItem>
                  <SelectItem value="Colorectal">{t.patients.cancerColorectal}</SelectItem>
                  <SelectItem value="Prostate">{t.patients.cancerProstate}</SelectItem>
                  <SelectItem value="Lymphoma">{t.patients.cancerLymphoma}</SelectItem>
                  <SelectItem value="Leukemia">{t.patients.cancerLeukemia}</SelectItem>
                  <SelectItem value="Ovarian">{t.patients.cancerOvarian}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-gray-50 border-b border-border uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">{t.patients.tableId}</th>
                  <th className="px-6 py-3 font-medium">{t.patients.tableName}</th>
                  <th className="px-6 py-3 font-medium">{t.patients.tableAge}</th>
                  <th className="px-6 py-3 font-medium">{t.patients.tableDiagnosis}</th>
                  <th className="px-6 py-3 font-medium">{t.patients.tableStage}</th>
                  <th className="px-6 py-3 font-medium">{t.patients.tableStatus}</th>
                  <th className="px-6 py-3 font-medium">{t.patients.tableDoctor}</th>
                  <th className="px-6 py-3 font-medium text-right">{t.patients.tableActions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <tr key={patient.id} className="bg-white border-b border-border hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{patient.id}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{patient.name}</td>
                      <td className="px-6 py-4">{patient.age}</td>
                      <td className="px-6 py-4">{patient.cancerType}</td>
                      <td className="px-6 py-4 font-medium">{patient.stage}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`${getStatusColor(patient.status)} border-transparent font-medium`}>
                          {patient.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{patient.doctor}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" asChild className="mr-2">
                          <Link href={`/patients/${patient.id}`}>{t.patients.view}</Link>
                        </Button>
                        <Button variant="outline" size="sm">{t.patients.edit}</Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                      {t.patients.noResults}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-gray-50/50">
            <span className="text-sm text-muted-foreground">
              {t.patients.showing} {filteredPatients.length} {t.patients.of} {mockPatients.length} {t.patients.patientsLabel}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>{t.patients.previous}</Button>
              <Button variant="outline" size="sm" disabled>{t.patients.next}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
