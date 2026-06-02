import React from "react";
import { Award, ShieldCheck, Beaker, Heart, Star } from "lucide-react";
import Reveal from "../components/Reveal";
import SEO from "../components/SEO";

export default function About() {
  return (
    <div data-testid="about-page" className="pt-32 pb-16">
      <SEO
        title="About Dr Prateek Dental Clinic | NABH Accredited Dental Care"
        description="Learn about Dr Prateek Dental Clinic, a NABH-accredited dental clinic in Ghaziabad offering ethical, specialist-led dental care, smile makeovers, implants and advanced dentistry."
        path="/about"
        keywords="about dentist Ghaziabad, Dr Prateek Aggarwal, NABH dental clinic, Smile Savers Dental Clinic, dental care Ghaziabad"
      />
      <section className="px-5 md:px-8 mb-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="eyebrow mb-3">About Smile Savers Dental Clinic</div>
          <h1 className="h-display text-5xl md:text-7xl text-ink mb-6">A clinic where care<br /><span className="italic text-cocoa">comes before everything.</span></h1>
          <p className="text-lg text-inkmuted max-w-2xl mx-auto leading-relaxed">
            For over 25 years, Smile Savers Dental Clinic has been Ghaziabad's most trusted address for honest, world-class dentistry. NABH-accredited and ISO certified, we marry science with artistry.
          </p>
        </div>
      </section>

      <section className="px-5 md:px-8 mb-24">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <Reveal>
            <img
              src="/images/gallery/WhatsApp Image 2026-05-18 at 12.18.14 PM.jpeg"
              alt="Smile Savers Dental Clinic Interior"
              className="rounded-[2rem] aspect-[4/5] object-cover object-center w-full"
            />
          </Reveal>
          <Reveal delay={0.15}>
            <div className="eyebrow mb-3">Our Story</div>
            <h2 className="font-serif text-4xl md:text-5xl text-ink mb-6">Built on honesty, transparency & respect.</h2>
            <p className="text-inkmuted leading-relaxed mb-4">
              Founded with a singular vision — to provide patients with honest, succinct, professional dental advice — Smile Savers Dental Clinic has grown into a multidisciplinary practice that has served patients from across Delhi NCR and beyond.
            </p>
            <p className="text-inkmuted leading-relaxed mb-4">
              We don't believe in the 'jack-of-all-trades' approach. Every procedure here is performed by a specialist who has spent years mastering that single craft.
            </p>
            <p className="text-inkmuted leading-relaxed">
              Smile Makeovers and Full Mouth Rehabilitations are our signature treatments — and the reason patients fly in from across India to entrust us with their smiles.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="px-5 md:px-8 mb-24">
        <div className="max-w-7xl mx-auto bg-ink text-bgmain rounded-[2rem] p-10 md:p-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bgmain/10 border border-bgmain/20 mb-6">
              <Award size={14} className="text-cream" />
              <span className="text-xs tracking-[0.18em] uppercase text-cream font-semibold">NABH Accredited Clinic</span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl mb-6">India's gold standard for healthcare quality.</h2>
            <p className="text-bgmain/70 leading-relaxed">
              The National Accreditation Board for Hospitals & Healthcare Providers (NABH) is the highest mark of clinical excellence in India. We undergo rigorous quarterly audits on sterilisation, patient rights, infection control and treatment outcomes.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { l: "NABH Accredited", n: "★" },
              { l: "ISO 9001:2015", n: "✓" },
              { l: "Years in Practice", n: "25+" },
              { l: "Patients Served", n: "10K+" },
            ].map(b => (
              <div key={b.l} className="rounded-2xl bg-bgmain/5 border border-bgmain/10 p-6 text-center">
                <div className="font-serif text-4xl text-cream mb-2">{b.n}</div>
                <div className="text-xs uppercase tracking-[0.16em] text-bgmain/60">{b.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 md:px-8">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="eyebrow mb-3">Our Pillars</div>
            <h2 className="font-serif text-4xl md:text-5xl text-ink mb-14">What makes us different.</h2>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { icon: ShieldCheck, t: "Hygiene First", d: "Single-use disposables, autoclave sterilisation at 121°C, distilled dental-grade water, UV-stored sealed instruments. Every patient. Every time." },
              { icon: Beaker, t: "Genuine Materials", d: "Ivoclar Vivadent, 3M, Nobel Biocare, Straumann, Dentsply. Internationally traceable brands — never local substitutes." },
              { icon: Heart, t: "Painless Promise", d: "Sedation, laser-assisted procedures, single-sitting RCTs, and a team trained to make even the most anxious patient feel at home." },
              { icon: Star, t: "Transparent Pricing", d: "Custom quotations after assessment. No surprise add-ons mid-treatment. Parity in pricing for all patients." },
            ].map((p, i) => {
              const I = p.icon;
              return (
                <Reveal key={p.t} delay={i * 0.07}>
                  <div className="rounded-3xl bg-beige p-8 flex gap-5 h-full">
                    <div className="w-12 h-12 rounded-2xl bg-ink text-bgmain flex items-center justify-center flex-shrink-0">
                      <I size={20} />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl text-ink mb-2">{p.t}</h3>
                      <p className="text-inkmuted leading-relaxed text-sm">{p.d}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
