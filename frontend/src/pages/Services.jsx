import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Drill, Activity, Sun, AlignCenter, Baby, Layers, Heart, Crown, Scissors, Smile, Star } from "lucide-react";
import { fetchServices } from "../lib/api";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SEO from "../components/SEO";

gsap.registerPlugin(ScrollTrigger);

const ICONS = { Sparkles, Drill, Activity, Sun, AlignCenter, Baby, Layers, Heart, Crown, Scissors, Smile, Star };

export default function Services() {
  const [services, setServices] = useState([]);
  const listRef = useRef(null);

  useEffect(() => { fetchServices().then(setServices); }, []);

  useEffect(() => {
    if (!services.length) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".svc-row").forEach((row, i) => {
        gsap.fromTo(row,
          { opacity: 0, y: 60 },
          {
            opacity: 1, y: 0, duration: 1, ease: "power3.out",
            scrollTrigger: { trigger: row, start: "top 88%", toggleActions: "play none none none" }
          }
        );
      });
    }, listRef);
    return () => ctx.revert();
  }, [services]);

  return (
    <div data-testid="services-page" className="pt-32 pb-16 px-5 md:px-8">
      <SEO
        title="Dental Services in Ghaziabad | Implants, RCT, Smile Makeover"
        description="Explore dental services at Dr Prateek Dental Clinic in Ghaziabad including implants, root canal treatment, smile makeover, whitening, braces and pediatric dentistry."
        path="/services"
        keywords="dental services Ghaziabad, dental implants Ghaziabad, RCT Ghaziabad, smile makeover Ghaziabad, teeth whitening Ghaziabad"
      />
      <section className="max-w-5xl mx-auto text-center mb-20">
        <div className="eyebrow mb-3">Treatments</div>
        <h1 className="h-display text-5xl md:text-7xl text-ink mb-6">Every smile,<br /><span className="italic text-cocoa">a custom craft.</span></h1>
        <p className="text-lg text-inkmuted max-w-2xl mx-auto">From subtle whitening touch-ups to full-mouth rehabilitations — explore our complete suite of treatments, each performed by a specialist.</p>
      </section>

      <section ref={listRef} className="max-w-6xl mx-auto">
        <div className="border-t border-cream/70">
          {services.map((s, i) => {
            const Icon = ICONS[s.icon] || Sparkles;
            return (
              <Link
                key={s.slug}
                to={`/services/${s.slug}`}
                data-testid={`service-row-${s.slug}`}
                className="svc-row group grid grid-cols-12 items-center gap-4 md:gap-8 py-7 md:py-9 border-b border-cream/70 hover:bg-beige/40 transition-colors duration-500 px-2 md:px-4 -mx-2 md:-mx-4 rounded-2xl"
              >
                <div className="col-span-1 hidden md:block">
                  <span className="font-serif text-2xl text-mocha tabular-nums">0{i + 1 < 10 ? i + 1 : i + 1}</span>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-beige flex items-center justify-center group-hover:bg-ink group-hover:text-bgmain transition-all duration-500">
                    <Icon size={20} />
                  </div>
                </div>
                <div className="col-span-10 md:col-span-6">
                  <h3 className="font-serif text-2xl md:text-3xl text-ink leading-tight mb-1 group-hover:text-cocoa transition-colors">{s.title}</h3>
                  <p className="text-sm text-inkmuted line-clamp-2 md:line-clamp-1">{s.summary}</p>
                </div>
                <div className="col-span-7 md:col-span-2 hidden md:block">
                  <div className="text-[0.65rem] uppercase tracking-[0.18em] text-mocha font-semibold mb-1">Specialist</div>
                  <div className="font-serif text-base text-ink">Dr. Prateek Aggarwal</div>
                </div>
                <div className="col-span-2 md:col-span-2 flex justify-end">
                  <span className="inline-flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-full bg-bgmain border border-cream group-hover:bg-ink group-hover:text-bgmain group-hover:border-ink transition-all duration-500 text-xs md:text-sm font-semibold tracking-[0.16em] uppercase">
                    <span className="hidden md:inline">Explore</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="max-w-5xl mx-auto mt-24 text-center">
        <div className="rounded-[2rem] bg-ink text-bgmain p-10 md:p-16">
          <h2 className="font-serif text-3xl md:text-5xl mb-5">Not sure which treatment is right?</h2>
          <p className="text-bgmain/70 max-w-xl mx-auto mb-7">Our doctor offers a complimentary consultation where you'll receive a customised treatment plan and transparent quote.</p>
          <Link to="/booking" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-bgmain text-ink font-medium hover:bg-cream transition-colors" data-testid="services-cta-book">Book Free Consultation <ArrowRight size={16} /></Link>
        </div>
      </section>
    </div>
  );
}
