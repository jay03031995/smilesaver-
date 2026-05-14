import React, { useState } from "react";
import { Phone, Mail, MapPin, Clock, Loader2, Check } from "lucide-react";
import { createContact } from "../lib/api";
import { toast } from "sonner";
import { CLINIC_PHONE } from "../components/Header";

export default function Contact() {
  const [data, setData] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createContact(data);
      setDone(true);
      toast.success("Message sent!");
    } catch {
      toast.error("Could not send message. Try calling us instead.");
    }
    setSubmitting(false);
  };

  return (
    <div data-testid="contact-page" className="pt-32 pb-16 px-5 md:px-8">
      <section className="max-w-5xl mx-auto text-center mb-16">
        <div className="eyebrow mb-3">Visit · Call · Write</div>
        <h1 className="h-display text-5xl md:text-7xl text-ink mb-6">We're listening,<br/><span className="italic text-cocoa">always.</span></h1>
      </section>

      <section className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10">
        <div>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {[
              { icon: MapPin, t: "Address", d: "S 28, Shubham Apt, Shalimar Garden Ext I, Sahibabad, Ghaziabad 201006" },
              { icon: Phone, t: "Phone", d: CLINIC_PHONE, href: `tel:${CLINIC_PHONE}` },
              { icon: Mail, t: "Email", d: "care@smilesaversdental.in", href: "mailto:care@smilesaversdental.in" },
              { icon: Clock, t: "Hours", d: "Daily · 10:00 AM – 8:00 PM" },
            ].map(b => {
              const I = b.icon;
              return (
                <div key={b.t} className="rounded-3xl bg-beige p-6">
                  <div className="w-10 h-10 rounded-2xl bg-ink text-bgmain flex items-center justify-center mb-3"><I size={16}/></div>
                  <div className="eyebrow text-mocha mb-1 text-[0.6rem]">{b.t}</div>
                  {b.href ? <a href={b.href} className="text-sm text-ink hover:text-cocoa">{b.d}</a> : <div className="text-sm text-ink leading-relaxed">{b.d}</div>}
                </div>
              );
            })}
          </div>
          <div className="rounded-3xl overflow-hidden border border-cream aspect-[16/10]">
            <iframe
              title="map"
              src="https://www.google.com/maps?q=Shalimar+Garden+Extension+I+Sahibabad+Ghaziabad&output=embed"
              width="100%" height="100%" style={{ border: 0 }} loading="lazy"
            />
          </div>
        </div>

        <div className="rounded-[2rem] bg-bgmain border border-cream p-8 md:p-10">
          {done ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full bg-ink text-bgmain flex items-center justify-center mb-5"><Check size={28}/></div>
              <h3 className="font-serif text-2xl text-ink mb-2">Message received</h3>
              <p className="text-inkmuted">We'll respond within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4" data-testid="contact-form">
              <h2 className="font-serif text-3xl text-ink mb-3">Send us a message</h2>
              <input required value={data.name} onChange={(e)=>setData({...data, name: e.target.value})} placeholder="Your name *" className="w-full px-5 py-3.5 rounded-2xl border border-cream bg-bgmain" data-testid="contact-name"/>
              <input required type="email" value={data.email} onChange={(e)=>setData({...data, email: e.target.value})} placeholder="Email *" className="w-full px-5 py-3.5 rounded-2xl border border-cream bg-bgmain" data-testid="contact-email"/>
              <input value={data.phone} onChange={(e)=>setData({...data, phone: e.target.value})} placeholder="Phone (optional)" className="w-full px-5 py-3.5 rounded-2xl border border-cream bg-bgmain" data-testid="contact-phone"/>
              <textarea required rows={5} value={data.message} onChange={(e)=>setData({...data, message: e.target.value})} placeholder="How can we help?" className="w-full px-5 py-3.5 rounded-2xl border border-cream bg-bgmain resize-none" data-testid="contact-message"/>
              <button type="submit" disabled={submitting} className="liquid-glass-dark w-full flex items-center justify-center gap-2" data-testid="contact-submit">
                {submitting ? <Loader2 className="animate-spin" size={16}/> : null} Send Message
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
