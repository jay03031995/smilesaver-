import React, { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, Loader2 } from "lucide-react";
import { sendChat } from "../lib/api";
import { CLINIC_PHONE } from "./Header";

const sessionId = `web-${Math.random().toString(36).slice(2, 11)}`;

const SUGGESTED = [
  "What does a smile makeover cost?",
  "Do you do single-sitting root canal?",
  "Are you NABH accredited?",
  "Can I book for my child?",
];

export default function AIChat({ open, onClose }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi, I'm Smile — your AI assistant at Smile Savers Dental Clinic. Ask me anything about treatments, pricing, or booking your visit." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const { reply } = await sendChat(sessionId, msg);
      setMessages(m => [...m, { role: "ai", text: reply }]);
    } catch {
      setMessages(m => [...m, { role: "ai", text: `Sorry, I'm having trouble right now. Please call us at ${CLINIC_PHONE}.` }]);
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-end md:p-6" data-testid="ai-chat-modal">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:w-[420px] h-[85vh] md:h-[640px] bg-bgmain border border-cream rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream bg-gradient-to-r from-beige to-bgmain">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ink text-bgmain flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="font-serif text-ink text-lg leading-tight">Smile</div>
              <div className="text-[0.65rem] tracking-[0.18em] uppercase text-mocha font-semibold">AI Assistant · Online</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-cream" data-testid="ai-chat-close">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-ink text-bgmain rounded-br-md"
                    : "bg-beige text-ink rounded-bl-md"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start"><div className="bg-beige px-4 py-2.5 rounded-2xl"><Loader2 className="animate-spin" size={16} /></div></div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-5 pb-2 flex flex-wrap gap-2">
            {SUGGESTED.map(s => (
              <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full border border-cream hover:bg-cream transition-colors" data-testid={`suggested-${s.slice(0,10)}`}>
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="border-t border-cream p-3 flex gap-2 bg-bgmain"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a service..."
            className="flex-1 px-4 py-2.5 rounded-full border border-cream bg-white focus:outline-none focus:border-mocha text-sm"
            data-testid="ai-chat-input"
          />
          <button type="submit" disabled={loading} className="w-10 h-10 rounded-full bg-ink text-bgmain flex items-center justify-center disabled:opacity-50" data-testid="ai-chat-send">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
