import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  X,
  Send,
  BrainCircuit,
  Loader2,
  ChevronDown,
  Stethoscope,
  FlaskConical,
  BarChart2,
  User,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ─── Quick prompt suggestions ────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { icon: Stethoscope, label: "Patient stats", prompt: "What are the current patient statistics by cancer type?" },
  { icon: FlaskConical, label: "Biomarkers", prompt: "Explain the significance of ER+/HER2- biomarkers in breast cancer treatment." },
  { icon: BarChart2, label: "Stage breakdown", prompt: "Give me a summary of patients by stage and their typical treatment protocols." },
  { icon: BrainCircuit, label: "Treatment options", prompt: "What are the latest chemotherapy protocols for Stage III lung cancer?" },
];

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are OncoAssist, an AI clinical assistant embedded in OncoFlow — a clinical oncology registry platform used by oncologists and medical biologists.

Your role:
- Answer questions about oncology, cancer biology, clinical data interpretation, treatment protocols, and biomarkers.
- Help clinicians understand patient statistics, staging, and treatment responses.
- Provide evidence-based information about chemotherapy regimens, targeted therapies, and immunotherapies.
- Assist with interpreting lab values, pathology reports, and imaging findings.
- Offer guidance on clinical trial eligibility and emerging therapies.

Context about the platform:
- The registry tracks patients with breast, lung, colorectal, prostate, lymphoma, leukemia, and ovarian cancers.
- Patient data includes staging (I–IV), biomarkers (ER, PR, HER2, EGFR, KRAS, etc.), treatment cycles, and clinical notes.
- The clinical team includes oncologists: Dr. Sarah Chen, Dr. Marcus Webb, Dr. Priya Patel, Dr. James Morrison.

Important:
- Be concise but thorough. Use clinical terminology appropriately.
- Always clarify that your answers are informational and do not replace clinical judgment.
- Format responses clearly using short paragraphs or bullet points when listing multiple items.
- If asked about a specific patient, note that you don't have access to individual records in this chat — the clinician should use the Patient Profile page.`;

// ─── API call ─────────────────────────────────────────────────────────────────

async function callClaude(messages) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_GEMINI_API_KEY`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: messages.map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }))
      })
    }
  );
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}


// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-2.5 mb-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-indigo-100 text-indigo-600"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <BrainCircuit className="w-4 h-4" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-gray-100 text-foreground rounded-tl-sm"
        }`}
        style={{ whiteSpace: "pre-wrap" }}
      >
        {message.content}
        <div
          className={`text-[10px] mt-1.5 select-none ${
            isUser ? "text-primary-foreground/60 text-right" : "text-muted-foreground"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 mb-4">
      <div className="w-7 h-7 rounded-full flex-shrink-0 bg-indigo-100 text-indigo-600 flex items-center justify-center">
        <BrainCircuit className="w-4 h-4" />
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ─── Main chatbot component ───────────────────────────────────────────────────

export default function OncoChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm OncoAssist, your AI clinical companion. I can help you with oncology questions, treatment protocols, biomarker interpretation, and patient statistics.\n\nHow can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
    timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Build history for API (exclude the initial welcome message)
      const apiMessages = updatedMessages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const reply = await callClaude(apiMessages, SYSTEM_PROMPT);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "I'm sorry, I encountered an error connecting to the AI service. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const unreadCount = 0; // Could be tracked if needed

  return (
    <>
      {/* ── Floating button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center group"
          aria-label="Open OncoAssist chat"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
            AI
          </span>
        </button>
      )}

      {/* ── Chat window ── */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-300 overflow-hidden ${
            isMinimized ? "h-[56px]" : "h-[600px]"
          }`}
          style={{ maxHeight: "calc(100vh - 80px)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-800 to-indigo-900 text-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-400/30 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 text-indigo-200" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">OncoAssist</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-indigo-200">AI Clinical Assistant</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label={isMinimized ? "Expand" : "Minimize"}
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isMinimized ? "rotate-180" : ""}`}
                />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0 bg-white">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick prompts — shown only when no real user messages yet */}
              {messages.filter((m) => m.role === "user").length === 0 && (
                <div className="px-4 pb-3 flex gap-2 flex-wrap border-t border-gray-100 pt-3 bg-gray-50/50">
                  {QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp.label}
                      onClick={() => sendMessage(qp.prompt)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:border-primary hover:text-primary transition-colors text-gray-600"
                    >
                      <qp.icon className="w-3 h-3" />
                      {qp.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input area */}
              <div className="px-3 pb-3 pt-2 border-t border-gray-100 bg-white flex-shrink-0">
                <div className="flex items-end gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about patients, protocols, biomarkers..."
                    className="flex-1 resize-none bg-transparent border-0 focus-visible:ring-0 shadow-none text-sm min-h-[40px] max-h-[120px] p-0 placeholder:text-muted-foreground/60"
                    rows={1}
                    disabled={isLoading}
                  />
                  <Button
                    size="sm"
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isLoading}
                    className="w-8 h-8 p-0 rounded-lg flex-shrink-0 mb-0.5"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">
                  For informational use only — not a substitute for clinical judgment
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
