import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, Download, FileJson, PieChart, Activity } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";

export default function Exports() {
  const { t } = useLanguage();

  const handleExport = (type: string) => {
    toast({
      title: t.exports.exportStarted,
      description: t.exports.exportStartedDesc(type),
    });
  };

  const exportOptions = [
    {
      titleKey: t.exports.pdfTitle,
      descKey: t.exports.pdfDesc,
      icon: FileText,
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      titleKey: t.exports.excelTitle,
      descKey: t.exports.excelDesc,
      icon: FileSpreadsheet,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      titleKey: t.exports.csvTitle,
      descKey: t.exports.csvDesc,
      icon: FileJson,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      titleKey: t.exports.timelinePdfTitle,
      descKey: t.exports.timelinePdfDesc,
      icon: Activity,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      titleKey: t.exports.meetingSummaryTitle,
      descKey: t.exports.meetingSummaryDesc,
      icon: FileText,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },
    {
      titleKey: t.exports.survivalTitle,
      descKey: t.exports.survivalDesc,
      icon: PieChart,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  const recentExports = [
    { filename: "Registry_Q1_2024.xlsx", type: "Excel", date: "Today, 09:15 AM", size: "2.4 MB" },
    { filename: "Summary_PT-10042.pdf", type: "PDF", date: "Yesterday, 14:30 PM", size: "1.1 MB" },
    { filename: "Analytics_Export_Raw.csv", type: "CSV", date: "Mar 15, 2024", size: "8.7 MB" },
    { filename: "Tumor_Board_Timeline.pdf", type: "PDF", date: "Mar 12, 2024", size: "4.2 MB" },
  ];

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.exports.title}</h1>
        <p className="text-muted-foreground mt-1">{t.exports.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exportOptions.map((opt) => (
          <Card key={opt.titleKey} className="shadow-sm hover:shadow-md transition-shadow border-gray-200">
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-lg ${opt.bg} flex items-center justify-center mb-4`}>
                <opt.icon className={`w-6 h-6 ${opt.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{opt.titleKey}</h3>
              <p className="text-sm text-muted-foreground mb-6 min-h-[60px]">{opt.descKey}</p>
              <Button onClick={() => handleExport(opt.titleKey)} className="w-full gap-2" variant="outline">
                <Download className="w-4 h-4" /> {t.exports.exportReport}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm mt-8">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle>{t.exports.recentExports}</CardTitle>
          <CardDescription>{t.exports.recentExportsDesc}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
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
                  <tr key={i} className="bg-white border-b border-border hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" /> {file.filename}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold">{file.type}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{file.date}</td>
                    <td className="px-6 py-4 text-muted-foreground">{file.size}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="gap-2 text-primary" onClick={() => handleExport(file.filename)}>
                        <Download className="w-4 h-4" /> {t.exports.download}
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
