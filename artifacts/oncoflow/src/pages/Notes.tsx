import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mic, ListPlus, Save, StopCircle } from "lucide-react";
import { mockPatients } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";

export default function Notes() {
  const { t } = useLanguage();
  const [selectedPatient, setSelectedPatient] = useState(mockPatients[0].id);
  const [noteContent, setNoteContent] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;
    toast({ title: t.notes.noteSaved, description: t.notes.noteSavedDesc });
    setNoteContent("");
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setTimeout(() => {
        setTranscript("Patient reports mild neuropathy in fingers. Grade 1. Tolerating Cycle 4 well otherwise. Nausea well controlled with current anti-emetics. Will proceed with Cycle 5 as scheduled. Re-evaluate neuropathy next visit.");
        toast({ title: t.notes.voiceProcessed, description: t.notes.voiceProcessedDesc });
      }, 1500);
    } else {
      setIsRecording(true);
      setTranscript("");
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.notes.title}</h1>
          <p className="text-muted-foreground mt-1">{t.notes.subtitle}</p>
        </div>
        <div className="w-full sm:w-[300px]">
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger className="bg-white border-primary/20">
              <SelectValue placeholder={t.notes.selectPatient} />
            </SelectTrigger>
            <SelectContent>
              {mockPatients.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name} ({p.id})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="voice" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted">
          <TabsTrigger value="voice" className="data-[state=active]:bg-white">{t.notes.voiceDictation}</TabsTrigger>
          <TabsTrigger value="text" className="data-[state=active]:bg-white">{t.notes.manualEntry}</TabsTrigger>
        </TabsList>

        <TabsContent value="voice" className="mt-6 space-y-6">
          <Card className="shadow-sm border-blue-100 bg-blue-50/30">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="mb-6 relative">
                {isRecording && (
                  <span className="absolute -inset-4 rounded-full border-4 border-red-500/30 animate-ping"></span>
                )}
                <button 
                  onClick={toggleRecording}
                  className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    isRecording ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30'
                  }`}
                >
                  {isRecording ? <StopCircle className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
                </button>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {isRecording ? t.notes.listening : t.notes.tapToDictate}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {isRecording ? t.notes.voiceHintListening : t.notes.voiceHintIdle}
              </p>
            </CardContent>
          </Card>

          {transcript && (
            <Card className="shadow-sm border-green-100 bg-white">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ListPlus className="w-5 h-5 text-primary" /> {t.notes.structuredOutput}
                </CardTitle>
                <CardDescription>{t.notes.aiExtracted}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-muted/30 p-4 rounded-lg border border-border mb-6">
                  <p className="text-sm italic text-muted-foreground mb-2 font-medium">{t.notes.transcript}</p>
                  <p className="text-foreground">{transcript}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-bold">{t.notes.treatmentResponse}</span>
                    <div className="bg-white border rounded p-2 text-sm font-medium">Tolerating well</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-bold">{t.notes.sideEffects}</span>
                    <div className="bg-white border border-orange-200 bg-orange-50 rounded p-2 text-sm font-medium text-orange-800">
                      Mild Neuropathy (Grade 1)
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-bold">{t.notes.medication}</span>
                    <div className="bg-white border rounded p-2 text-sm font-medium">Anti-emetics working</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase font-bold">{t.notes.nextAction}</span>
                    <div className="bg-white border rounded p-2 text-sm font-medium text-primary">Proceed with Cycle 5</div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline">{t.notes.editText}</Button>
                  <Button onClick={() => { toast({ title: t.notes.saved }); setTranscript(""); }}>{t.notes.saveToRecord}</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="text" className="mt-6 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <CardTitle>{t.notes.manualTitle}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer">{t.notes.symptoms}</Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100 cursor-pointer">{t.notes.response}</Badge>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 hover:bg-orange-100 cursor-pointer">{t.notes.sideEffectsTag}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Textarea 
                placeholder={t.notes.textPlaceholder}
                className="min-h-[250px] text-base leading-relaxed p-4"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
              <div className="flex justify-end mt-4">
                <Button onClick={handleSaveNote} className="gap-2">
                  <Save className="w-4 h-4" /> {t.notes.saveNote}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-foreground">{t.notes.recentNotes}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 font-medium">{t.notes.response}</Badge>
                <span className="text-xs text-muted-foreground">Mar 15, 2024</span>
              </div>
              <p className="text-sm text-foreground mb-3 line-clamp-3">Patient presented for routine follow-up post Cycle 3. Denies any severe nausea, vomiting, or diarrhea. Reports mild fatigue lasting 3 days post-infusion. CBC unremarkable. Cleared for Cycle 4.</p>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                <span className="text-xs font-medium text-muted-foreground">Dr. Sarah Chen</span>
                <Button variant="ghost" size="sm" className="h-8 text-primary">{t.notes.readFull}</Button>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 font-medium">{t.notes.symptoms}</Badge>
                <span className="text-xs text-muted-foreground">Feb 28, 2024</span>
              </div>
              <p className="text-sm text-foreground mb-3 line-clamp-3">Pathology report reviewed. Margins are clear. ER+, PR+, HER2-. Ki-67 is 15%. Discussed adjuvant chemotherapy rationale with patient. She agrees to proceed with AC-T regimen starting next week.</p>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                <span className="text-xs font-medium text-muted-foreground">Dr. Sarah Chen</span>
                <Button variant="ghost" size="sm" className="h-8 text-primary">{t.notes.readFull}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
