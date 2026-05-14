import React, { useState } from "react";
import { Check, ChevronRight, ChevronLeft, Calendar, User, Sparkles, Loader2 } from "lucide-react";
import { createBooking } from "../lib/api";
import { toast } from "sonner";
import { CLINIC_PHONE } from "./Header";

const TIME_SLOTS = ["10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"];

const STEPS = [
  { id: 1, label: "Service", icon: Sparkles },
  { id: 2, label: "Date & Time", icon: Calendar },
  { id: 3, label: "Your Details", icon: User },
  { id: 4, label: "Confirm", icon: Check },
];

export default function BookingStepper({ services, defaultService, onComplete }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    service: defaultService || services?.[0]?.title || "",
    preferred_date: "",
    preferred_time: "",
    name: "", phone: "", email: "", notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  const canNext = () => {
    if (step === 1) return !!data.service;
    if (step === 2) return !!data.preferred_date && !!data.preferred_time;
    if (step === 3) return data.name.trim().length > 1 && /^\d{10,}$/.test(data.phone.replace(/\D/g,""));
    return true;
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await createBooking(data);
      setDone(true);
      toast.success("Appointment requested!");
      const waText = encodeURIComponent(
        `Hi Smile Savers Dental Clinic!\n\nI just booked an appointment:\n• Name: ${data.name}\n• Phone: ${data.phone}\n• Service: ${data.service}\n• Date: ${data.preferred_date} at ${data.preferred_time}\n\nReference: ${res.id.slice(0,8)}`
      );
      window.open(`https://wa.me/919711146547?text=${waText}`, "_blank");
      onComplete?.(res);
    } catch {
      toast.error(`Could not save. Please call ${CLINIC_PHONE}.`);
    }
    setSubmitting(false);
  };

  if (done) {
    return (
      <div className="text-center py-12" data-testid="booking-success">
        <div className="w-20 h-20 mx-auto rounded-full bg-ink text-bgmain flex items-center justify-center mb-6">
          <Check size={36} />
        </div>
        <h3 className="font-serif text-3xl mb-3">Appointment Requested</h3>
        <p className="text-inkmuted max-w-md mx-auto mb-2">Our team will confirm your slot via WhatsApp shortly.</p>
        <p className="text-sm text-inkmuted">For urgent help: <a href={`tel:${CLINIC_PHONE}`} className="text-cocoa underline">{CLINIC_PHONE}</a></p>
      </div>
    );
  }

  return (
    <div data-testid="booking-stepper">
      {/* Progress */}
      <div className="flex items-center justify-between mb-10 gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = step === s.id;
          const complete = step > s.id;
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  complete ? "bg-ink text-bgmain" : active ? "bg-cocoa text-bgmain ring-4 ring-cream" : "bg-beige text-inkmuted"
                }`}>
                  {complete ? <Check size={18}/> : <Icon size={18}/>}
                </div>
                <span className={`text-[0.65rem] tracking-[0.16em] uppercase font-semibold ${active||complete ? "text-ink" : "text-inkmuted"}`}>{s.label}</span>
              </div>
              {i < STEPS.length-1 && <div className={`h-px flex-1 ${complete ? "bg-ink" : "bg-cream"}`}/>}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step content */}
      <div className="min-h-[300px]">
        {step === 1 && (
          <div>
            <h3 className="font-serif text-2xl mb-5">Choose your treatment</h3>
            <div className="grid sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-2">
              {services?.map(s => (
                <button
                  key={s.slug}
                  onClick={() => set("service", s.title)}
                  data-testid={`service-${s.slug}`}
                  className={`text-left px-5 py-4 rounded-2xl border transition-all ${
                    data.service === s.title ? "bg-ink text-bgmain border-ink" : "bg-bgmain border-cream hover:border-mocha"
                  }`}
                >
                  <div className="font-serif text-lg leading-tight">{s.title}</div>
                  <div className={`text-xs mt-1 ${data.service === s.title ? "text-bgmain/70" : "text-inkmuted"}`}>{s.tagline}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="font-serif text-2xl mb-5">Pick a date & time</h3>
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={data.preferred_date}
              onChange={(e) => set("preferred_date", e.target.value)}
              data-testid="booking-date"
              className="w-full px-5 py-4 rounded-2xl border border-cream bg-bgmain mb-5 font-sans"
            />
            <p className="text-sm text-inkmuted mb-3">Available time slots</p>
            <div className="grid grid-cols-3 gap-2.5">
              {TIME_SLOTS.map(t => (
                <button
                  key={t}
                  onClick={() => set("preferred_time", t)}
                  data-testid={`time-${t.replace(/\s|:/g,'')}`}
                  className={`px-3 py-3 rounded-xl border text-sm transition-all ${
                    data.preferred_time === t ? "bg-ink text-bgmain border-ink" : "bg-bgmain border-cream hover:border-mocha"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="font-serif text-2xl mb-5">Your details</h3>
            <div className="space-y-3">
              <input data-testid="booking-name" value={data.name} onChange={(e)=>set("name",e.target.value)} placeholder="Full name *" className="w-full px-5 py-3.5 rounded-2xl border border-cream bg-bgmain"/>
              <input data-testid="booking-phone" value={data.phone} onChange={(e)=>set("phone",e.target.value)} placeholder="Phone number *" className="w-full px-5 py-3.5 rounded-2xl border border-cream bg-bgmain"/>
              <input data-testid="booking-email" type="email" value={data.email} onChange={(e)=>set("email",e.target.value)} placeholder="Email (optional)" className="w-full px-5 py-3.5 rounded-2xl border border-cream bg-bgmain"/>
              <textarea data-testid="booking-notes" value={data.notes} onChange={(e)=>set("notes",e.target.value)} placeholder="Anything we should know? (optional)" rows={3} className="w-full px-5 py-3.5 rounded-2xl border border-cream bg-bgmain resize-none"/>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 className="font-serif text-2xl mb-5">Confirm your booking</h3>
            <div className="bg-beige rounded-2xl p-6 space-y-3">
              {[
                ["Service", data.service],
                ["Date", data.preferred_date],
                ["Time", data.preferred_time],
                ["Name", data.name],
                ["Phone", data.phone],
                ["Email", data.email || "—"],
                ["Notes", data.notes || "—"],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between text-sm border-b border-cream/60 pb-2 last:border-0">
                  <span className="text-inkmuted">{k}</span>
                  <span className="text-ink font-medium text-right">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-inkmuted mt-4">By confirming, our team will reach out via WhatsApp to finalise your slot.</p>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={() => setStep(s => Math.max(1, s-1))}
          disabled={step === 1}
          data-testid="booking-back"
          className="liquid-glass disabled:opacity-30 flex items-center gap-2"
        >
          <ChevronLeft size={16}/> Back
        </button>
        {step < 4 ? (
          <button
            onClick={() => setStep(s => s+1)}
            disabled={!canNext()}
            data-testid="booking-next"
            className="liquid-glass-dark disabled:opacity-40 flex items-center gap-2"
          >
            Continue <ChevronRight size={16}/>
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={submitting}
            data-testid="booking-confirm"
            className="liquid-glass-dark flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="animate-spin" size={16}/> : <Check size={16}/>}
            Confirm Booking
          </button>
        )}
      </div>
    </div>
  );
}
