import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDoctors } from "../lib/api";
import { Award, Check, ArrowRight, Star } from "lucide-react";
import Reveal from "../components/Reveal";
import SEO from "../components/SEO";

export default function Doctors() {
  const [doctor, setDoctor] = useState(null);
  useEffect(() => { fetchDoctors().then(d => setDoctor(d[0])); }, []);

  if (!doctor) return <div className="pt-32 text-center text-inkmuted min-h-screen">Loading…</div>;

  return (
    <div data-testid="doctors-page" className="pt-32 pb-16 px-5 md:px-8">
      <SEO
        title="Dentist in Ghaziabad | Dr Prateek Aggarwal"
        description="Meet Dr. Prateek Aggarwal, trusted dentist in Ghaziabad providing dental implants, RCT, smile makeover, whitening and specialist dental care."
        path="/doctors"
        keywords="Dr Prateek Aggarwal, dentist Ghaziabad, dental doctor Sahibabad, best dentist Ghaziabad"
      />
      <section className="max-w-5xl mx-auto text-center mb-14">
        <div className="eyebrow mb-3">Meet Our Doctor</div>
        <h1 className="h-display text-5xl md:text-7xl text-ink mb-6">Hands you can<br /><span className="italic text-cocoa">truly trust.</span></h1>
      </section>

      <section className="max-w-7xl mx-auto">
        <Reveal>
          <div className="grid md:grid-cols-12 gap-8 rounded-[2rem] bg-beige overflow-hidden" data-testid="doctor-hero-card">
            <div className="md:col-span-5 aspect-[4/5] md:aspect-auto">
              <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
            </div>
            <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                <Star size={14} className="text-cocoa fill-cocoa" />
                <span className="eyebrow text-cocoa">4.9 Rating · Trusted by Patients</span>
              </div>
              <h2 className="h-display text-4xl md:text-6xl text-ink mb-3 leading-[1.05]">{doctor.name}</h2>
              <div className="text-sm uppercase tracking-[0.18em] text-mocha font-semibold mb-4">{doctor.designation}</div>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-4 py-1.5 rounded-full bg-bgmain text-xs text-ink">{doctor.experience}</span>
                <span className="px-4 py-1.5 rounded-full bg-bgmain text-xs text-ink">{doctor.qualifications}</span>
                <span className="px-4 py-1.5 rounded-full bg-ink text-bgmain text-xs flex items-center gap-1.5"><Award size={12} /> NABH Accredited</span>
              </div>
              <p className="text-inkmuted leading-relaxed mb-7">{doctor.bio}</p>
              <Link to="/booking" className="liquid-glass-dark inline-flex items-center gap-2 self-start" data-testid="doctor-book-btn">Book Consultation <ArrowRight size={16} /></Link>
            </div>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <Reveal>
            <div className="rounded-3xl bg-bgmain border border-cream p-8 h-full">
              <div className="eyebrow mb-4">Areas of Expertise</div>
              <ul className="space-y-3">
                {doctor.expertise?.map(e => (
                  <li key={e} className="flex gap-3 text-ink">
                    <Check size={18} className="text-cocoa flex-shrink-0 mt-0.5" />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-3xl bg-ink text-bgmain p-8 h-full">
              <div className="eyebrow text-cream mb-4">Credentials</div>
              <ul className="space-y-3">
                {doctor.credentials?.map(c => (
                  <li key={c} className="flex gap-3 text-bgmain/85">
                    <Award size={18} className="text-cream flex-shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
