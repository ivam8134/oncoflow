import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, Syringe, CalendarX, Activity, Skull, FileText, CalendarClock } from "lucide-react";
import { mockPatients, getStatusColor } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useLanguage } from "@/context/LanguageContext";

export default function Dashboard() {
  const { t } = useLanguage();

  const stats = [
    { titleKey: t.dashboard.todaysPatients, value: "12", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { titleKey: t.dashboard.urgentFollowUps, value: "4", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100", urgent: true },
    { titleKey: t.dashboard.upcomingChemo, value: "7", icon: Syringe, color: "text-purple-600", bg: "bg-purple-100" },
    { titleKey: t.dashboard.missedAppts, value: "3", icon: CalendarX, color: "text-orange-600", bg: "bg-orange-100" },
    { titleKey: t.dashboard.recurrenceAlerts, value: "2", icon: Activity, color: "text-red-600", bg: "bg-red-100", urgent: true },
    { titleKey: t.dashboard.recentDeaths, value: "1", icon: Skull, color: "text-gray-600", bg: "bg-gray-200" },
    { titleKey: t.dashboard.pendingPathology, value: "5", icon: FileText, color: "text-indigo-600", bg: "bg-indigo-100" },
    { titleKey: t.dashboard.nextScanReminders, value: "9", icon: CalendarClock, color: "text-teal-600", bg: "bg-teal-100" },
  ];

  const recentPatients = mockPatients.slice(0, 6);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.dashboard.title}</h1>
        <p className="text-muted-foreground mt-1">{t.dashboard.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.titleKey} className={stat.urgent ? "border-red-200 shadow-sm" : "shadow-sm"}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.titleKey}</p>
                <h3 className="text-3xl font-bold mt-2">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between bg-gray-50/50 border-b border-gray-100 pb-4">
          <CardTitle className="text-lg font-semibold">{t.dashboard.recentActivity}</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/patients">{t.dashboard.viewAllPatients}</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-gray-50 border-b border-border uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">{t.dashboard.tablePatientName}</th>
                  <th className="px-6 py-3 font-medium">{t.dashboard.tableCancerType}</th>
                  <th className="px-6 py-3 font-medium">{t.dashboard.tableStage}</th>
                  <th className="px-6 py-3 font-medium">{t.dashboard.tableStatus}</th>
                  <th className="px-6 py-3 font-medium">{t.dashboard.tableLastVisit}</th>
                  <th className="px-6 py-3 font-medium">{t.dashboard.tableDoctor}</th>
                  <th className="px-6 py-3 font-medium text-right">{t.dashboard.tableAction}</th>
                </tr>
              </thead>
              <tbody>
                {recentPatients.map((patient) => (
                  <tr key={patient.id} className="bg-white border-b border-border hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      <div className="flex flex-col">
                        <span>{patient.name}</span>
                        <span className="text-xs text-muted-foreground">{patient.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{patient.cancerType}</td>
                    <td className="px-6 py-4">{patient.stage}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`${getStatusColor(patient.status)} border-transparent font-medium`}>
                        {patient.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">{patient.lastVisit}</td>
                    <td className="px-6 py-4">{patient.doctor}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/patients/${patient.id}`}>{t.dashboard.view}</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
