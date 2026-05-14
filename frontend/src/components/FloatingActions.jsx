import React, { useState } from "react";
import { MessageCircle, Phone, Sparkles } from "lucide-react";
import AIChat from "./AIChat";
import { CLINIC_PHONE } from "./Header";

export default function FloatingActions() {
  const [chatOpen, setChatOpen] = useState(false);
  const phone = "919711146547";
  const waMessage = encodeURIComponent("Hi Smile Savers Dental Clinic! I'd like to know more about your services.");

  return (
    <>
      <div className="float-cluster" data-testid="floating-actions">
        <a
          href={`https://wa.me/${phone}?text=${waMessage}`}
          target="_blank" rel="noreferrer"
          className="float-icon float-icon-wa"
          aria-label="WhatsApp"
          data-testid="floating-whatsapp-btn"
        >
          <MessageCircle size={20} />
        </a>
        <button
          onClick={() => setChatOpen(true)}
          className="float-icon"
          aria-label="AI Chat"
          data-testid="floating-ai-btn"
        >
          <Sparkles size={20} />
        </button>
        <a
          href={`tel:${CLINIC_PHONE}`}
          className="float-icon float-icon-call"
          aria-label="Call"
          data-testid="floating-call-btn"
        >
          <Phone size={20} />
        </a>
      </div>
      <AIChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
