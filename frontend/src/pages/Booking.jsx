import React, { useEffect, useState } from "react";
import { fetchServices } from "../lib/api";
import BookingStepper from "../components/BookingStepper";
import { Award } from "lucide-react";
import SEO from "../components/SEO";

export default function Booking() {
  const [services, setServices] = useState([]);
  useEffect(() => { fetchServices().then(setServices); }, []);

  return (
    <div data-testid="booking-page" className="pt-32 pb-16 px-5 md:px-8">
      <SEO
        title="Book Dental Appointment in Ghaziabad | Dr Prateek Dental Clinic"
        description="Book your dental appointment online with Dr Prateek Dental Clinic in Ghaziabad for implants, RCT, smile makeover, whitening and dental consultation."
        path="/booking"
        keywords="book dentist appointment Ghaziabad, dental appointment Ghaziabad, Dr Prateek booking, dentist Sahibabad"
      />
      <section className="max-w-3xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-beige border border-cream mb-5">
          <Award size={14} className="text-cocoa" />
          <span className="text-xs tracking-[0.18em] uppercase font-semibold text-ink">NABH Accredited Clinic</span>
        </div>
        <h1 className="h-display text-5xl md:text-7xl text-ink mb-5">Book your<br /><span className="italic text-cocoa">smile journey.</span></h1>
        <p className="text-lg text-inkmuted max-w-xl mx-auto">A 4-step process. Pick your service, choose a slot, share your details, confirm. Our team reaches out via WhatsApp within minutes.</p>
      </section>

      <section className="max-w-3xl mx-auto bg-bgmain rounded-[2rem] border border-cream p-8 md:p-12 shadow-sm">
        <BookingStepper services={services} />
      </section>
    </div>
  );
}
