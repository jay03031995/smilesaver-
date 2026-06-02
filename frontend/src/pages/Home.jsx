import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Award, Star, Phone, ShieldCheck, Heart, Sparkles, Drill, Activity, Sun, AlignCenter, Baby, Layers, Crown, Scissors, Smile, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchServices, fetchTestimonials, fetchDoctors, fetchGallery, fetchReviewSummary } from "../lib/api";
import Reveal from "../components/Reveal";
import { CLINIC_PHONE } from "../components/Header";
import SEO from "../components/SEO";

gsap.registerPlugin(ScrollTrigger);

const NABH_LOGO = "/images/nabh.jpeg";
const SVC_ICONS = { Sparkles, Drill, Activity, Sun, AlignCenter, Baby, Layers, Heart, Crown, Scissors, Smile, Star };

export default function Home() {
  const [services, setServices] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [reviewSummary, setReviewSummary] = useState({
    clinic_name: "Smile Savers Dental Clinic",
    rating: "4.9",
    review_count: 443,
  });

  const heroImg = useRef(null);
  const heroLine1 = useRef(null);
  const heroLine2 = useRef(null);
  const heroLine3 = useRef(null);
  const heroSub = useRef(null);
  const heroBadge = useRef(null);
  const heroCtas = useRef(null);
  const heroStats = useRef(null);
  const marqueeRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    fetchServices().then(setServices);
    fetchTestimonials().then(setTestimonials);
    fetchDoctors().then(d => setDoctor(d[0]));
    setGallery([
      {
        category: "Clinic",
        image: "/images/gallery/WhatsApp Image 2026-05-18 at 12.18.14 PM.jpeg",
        caption: "Smile Savers Dental Clinic",
      },
      {
        category: "Patients",
        image: "/images/gallery/DSC_2779.JPG",
        caption: "Happy Patient",
      },
      {
        category: "Awards",
        image: "/images/gallery/Jaya Prada.jpg",
        caption: "National Pride Healthcare Award",
      },
    ]);
    fetchReviewSummary().then(setReviewSummary).catch(() => { });
  }, []);

  useEffect(() => {
    if (gallery.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % gallery.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [gallery]);

  // Helper: split a heading into char spans for stagger reveal
  const splitChars = (text) =>
    text.split("").map((c, i) => (
      <span key={i} className="inline-block" style={{ whiteSpace: c === " " ? "pre" : "normal" }}>{c}</span>
    ));

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero image cinematic zoom-out
      gsap.fromTo(heroImg.current, { scale: 1.25, filter: "blur(8px)" }, {
        scale: 1, filter: "blur(0px)", duration: 2.4, ease: "power3.out",
      });

      // Stagger: badge -> headline lines -> sub -> ctas -> stats
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(heroBadge.current, { y: 20, opacity: 0, duration: 0.8 }, 0.2);
      [heroLine1.current, heroLine2.current, heroLine3.current].forEach((el, i) => {
        if (!el) return;
        tl.from(el.querySelectorAll("span"), { yPercent: 110, opacity: 0, stagger: 0.018, duration: 0.9 }, 0.4 + i * 0.12);
      });
      tl.from(heroSub.current, { y: 30, opacity: 0, duration: 0.9 }, 0.95);
      tl.from(heroCtas.current?.children || [], { y: 30, opacity: 0, stagger: 0.1, duration: 0.7 }, 1.1);
      tl.from(heroStats.current?.children || [], { y: 20, opacity: 0, stagger: 0.08, duration: 0.6 }, 1.4);

      // Hero parallax
      gsap.to(heroImg.current, {
        yPercent: 18, ease: "none",
        scrollTrigger: { trigger: heroImg.current, start: "top top", end: "bottom top", scrub: true },
      });

      // Number counter
      const stats = statsRef.current?.querySelectorAll("[data-count]") || [];
      stats.forEach(el => {
        const target = parseInt(el.dataset.count, 10);
        gsap.fromTo(el, { textContent: 0 }, {
          textContent: target, duration: 2, ease: "power1.out", snap: { textContent: 1 },
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
          onUpdate: function () { el.textContent = Math.round(this.targets()[0].textContent).toLocaleString(); }
        });
      });

      // Marquee infinite
      if (marqueeRef.current) {
        const marqueeWidth = marqueeRef.current.scrollWidth / 2;

        const tw = gsap.to(marqueeRef.current, {
          x: -marqueeWidth,
          duration: 80,
          ease: "none",
          repeat: -1,
        });

        return () => tw.kill();
      }
    });
    return () => ctx.revert();
  }, []);

  return (
    <div data-testid="home-page">
      <SEO
        title="Dr Prateek Dental Clinic | NABH Accredited Dentist in Ghaziabad"
        description="Visit Dr Prateek Dental Clinic in Ghaziabad for dental implants, painless RCT, smile makeover, teeth whitening, Invisalign and family dental care."
        path="/"
        keywords="dentist Ghaziabad, dental clinic Sahibabad, Dr Prateek Aggarwal, dental implants Ghaziabad, root canal Ghaziabad"
      />
      {/* HERO */}
      <section className="relative min-h-[100vh] overflow-hidden pt-28 md:pt-32 pb-20">
        <div className="absolute inset-0 -z-10 bg-bgmain" />

        {/* Giant background headline */}
        <div className="absolute inset-x-0 top-[18%] -z-[5] overflow-hidden pointer-events-none select-none">
          <div className="font-serif text-[18vw] md:text-[14vw] lg:text-[11vw] font-light tracking-[-0.04em] leading-none whitespace-nowrap text-cream/60 text-center">
            EVERY SMILE MATTERS
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-5 md:px-8 grid md:grid-cols-12 gap-8 items-center min-h-[80vh] relative">
          <div className="md:col-span-6 lg:col-span-7">
            <div ref={heroBadge} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur border border-white/80 mb-7 shadow-sm">
              <span className="text-sm md:text-base font-semibold tracking-[0.08em] uppercase text-ink">{reviewSummary.clinic_name}</span>
            </div>
            <h1 className="h-display text-[2.7rem] md:text-6xl lg:text-[5.2rem] text-ink mb-7 leading-[1.05]">
              <span ref={heroLine1} className="block overflow-hidden">{splitChars("Crafting smiles")}</span>
              <span ref={heroLine2} className="block italic font-light text-cocoa overflow-hidden">{splitChars("that whisper")}</span>
              <span ref={heroLine3} className="block overflow-hidden">{splitChars("confidence.")}</span>
            </h1>
            <p ref={heroSub} className="text-lg md:text-xl text-inkmuted max-w-xl leading-relaxed mb-5 md:mb-9 font-light">
              NABH-accredited dental excellence in Ghaziabad. Where 14+ years of artistry meets the gentlest hands in the city.
            </p>
            <div ref={heroCtas} className="hidden md:flex flex-wrap gap-3">
              <Link to="/booking" className="liquid-glass-dark inline-flex items-center gap-2" data-testid="hero-book-btn">
                Book Appointment <ArrowRight size={16} />
              </Link>
              <Link to="/smile-analysis" className="liquid-glass inline-flex items-center gap-2" data-testid="hero-analysis-btn">
                <Star size={14} /> Free AI Smile Analysis
              </Link>
            </div>

            <div ref={heroStats} className="flex flex-nowrap sm:flex-wrap items-center gap-2 sm:gap-6 mt-5 pt-5 border-t border-cream/80">
              <div>
                <div className="font-serif text-3xl text-ink">14+</div>
                <div className="text-xs tracking-[0.16em] uppercase text-inkmuted">Years Exp.</div>
              </div>
              <div className="w-px h-10 bg-cream" />
              <div>
                <div className="font-serif text-3xl text-ink">5K+</div>
                <div className="text-xs tracking-[0.16em] uppercase text-inkmuted">patient</div>
              </div>
              <div className="w-px h-10 bg-cream" />
              <div className="flex items-center gap-2">
                <img src={NABH_LOGO} alt="NABH" className="w-9 h-9 object-contain" />
                <div>
                  <div className="font-serif text-base text-ink leading-tight">NABH</div>
                  <div className="text-[0.65rem] tracking-[0.16em] uppercase text-inkmuted">Accredited</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero image card */}
          <div className="md:col-span-6 lg:col-span-5 relative">
            <div ref={heroImg} className="relative will-change-transform">
              <div className="relative rounded-[2.5rem] overflow-hidden aspect-[4/5] shadow-[0_30px_80px_-20px_rgba(139,111,86,0.45)]">
                {gallery.length === 0 && (
                  <img
                    src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&q=80"
                    alt="Smile Savers Dental Clinic"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                {gallery.map((item, index) => (
                  <img
                    key={`${item.image}-${index}`}
                    src={item.image}
                    alt={item.caption}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${index === heroIndex ? "opacity-100" : "opacity-0"
                      }`}
                  />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-5 py-4 bg-gradient-to-t from-ink/65 to-transparent">
                  <div>
                    <div className="text-[0.6rem] tracking-[0.18em] uppercase text-cream font-semibold">{gallery[heroIndex]?.category || "Gallery"}</div>
                    <div className="font-serif text-lg text-bgmain">{gallery[heroIndex]?.caption || "Smile Savers Dental Clinic"}</div>
                  </div>
                  {gallery.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setHeroIndex((current) => (current - 1 + gallery.length) % gallery.length)}
                        className="w-10 h-10 rounded-full bg-bgmain/85 text-ink flex items-center justify-center"
                        aria-label="Previous gallery image"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeroIndex((current) => (current + 1) % gallery.length)}
                        className="w-10 h-10 rounded-full bg-bgmain/85 text-ink flex items-center justify-center"
                        aria-label="Next gallery image"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Floating tag - rating */}
              <div className="absolute -right-3 top-0.5 md:-right-8 px-4 py-3 rounded-2xl bg-ink text-bgmain shadow-xl flex items-center gap-2.5">
                <div className="flex flex-col items-center">
                  <span className="font-serif text-2xl leading-none">{reviewSummary.rating}</span>
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={8} className="text-cream fill-cream" />)}
                  </div>
                </div>
                <div className="leading-tight">
                  <div className="text-[0.6rem] tracking-[0.18em] uppercase text-cream font-semibold">Google</div>
                  <div className="text-xs">{Number(reviewSummary.review_count || 0).toLocaleString()} Reviews</div>
                </div>
              </div>

              {/* Floating tag - implants count */}
              <div className="absolute -left-1 -bottom-12 md:-left-1 md:-bottom-12 px-4 py-3 rounded-2xl bg-cocoa text-bgmain shadow-lg">
                <div className="font-serif text-2xl leading-none">2,500+</div>
                <div className="text-[0.6rem] tracking-[0.18em] uppercase mt-1">Implants Placed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE STRIP */}
      <section className="overflow-hidden bg-ink text-bgmain py-4 md:py-5 border-y border-cocoa/30">
        <div ref={marqueeRef} className="flex gap-12 whitespace-nowrap will-change-transform">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-12 flex-shrink-0">
              {["NABH Accredited", "ISO 9001:2015", "Nobel Biocare Certified", "Straumann Implants", "Zoom Whitening", "Invisalign Provider", "Single-Sitting RCT", "Painless Dentistry", "WCLI", "Epic Laser Dentistry", "Cowellmedi", "Alpha Bio", "Microscopic Dentistry", "Noble Biocare"].map(t => (
                <span key={t} className="font-serif text-2xl md:text-3xl flex items-center gap-12">
                  {t} <span className="text-cocoa">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* QUICK BOOK BAR */}
      <section className="py-16 px-5 md:px-8">
        <div className="max-w-7xl mx-auto bg-beige rounded-3xl px-8 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6 border border-cream">
          <div>
            <div className="eyebrow text-cocoa mb-2">Book Your Online Appointment</div>
            <h3 className="font-serif text-3xl md:text-4xl text-ink">Fast & easy way to start your smile journey</h3>
          </div>
          <Link to="/booking" className="liquid-glass-dark inline-flex items-center gap-2 shrink-0" data-testid="quick-book-btn">
            Book Now <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* WHY US with counters */}
      <section className="py-16 md:py-20 px-5 md:px-8" ref={statsRef}>
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="eyebrow mb-3">Why Smile Savers Dental Clinic</div>
            <h2 className="font-serif text-4xl md:text-6xl text-ink max-w-3xl mb-16">An honest, gentle, world-class dental experience.</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { icon: ShieldCheck, t: "NABH Accredited", d: "We meet the highest patient-safety, hygiene and clinical-outcome standards in India." },
              { icon: Award, t: "14+ Years of Mastery", d: "Founder-led care by Dr. Prateek Aggarwal. Every procedure performed by a focused specialist — never a 'jack of all trades' approach." },
              { icon: Heart, t: "Painless, Always", d: "Single-sitting RCT, laser gum care, sedation options and a team trained in patient comfort." },
            ].map((b, i) => {
              const Icon = b.icon;
              return (
                <Reveal key={b.t} delay={i * 0.1}>
                  <div className="rounded-3xl bg-gradient-to-b from-beige to-bgmain p-8 md:p-10 border border-white/60 h-full hover:-translate-y-2 transition-transform duration-500">
                    <div className="w-14 h-14 rounded-2xl bg-ink text-bgmain flex items-center justify-center mb-6">
                      <Icon size={22} />
                    </div>
                    <h3 className="font-serif text-2xl text-ink mb-3">{b.t}</h3>
                    <p className="text-inkmuted leading-relaxed">{b.d}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
          {/* Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { n: 14, suffix: "+", label: "Years of Practice" },
              { n: 5000, suffix: "+", label: "Smiles Crafted" },
              { n: 2500, suffix: "+", label: "Implants Placed" },
              { n: Number(reviewSummary.review_count || 0), suffix: "+", label: "Google Reviews" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-serif text-5xl md:text-6xl text-ink">
                  <span data-count={s.n}>0</span>{s.suffix}
                </div>
                <div className="eyebrow text-mocha mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES (icon-driven, no images) */}
      <section className="py-24 px-5 md:px-8 bg-beige">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <Reveal>
              <div>
                <div className="eyebrow mb-3">Treatments</div>
                <h2 className="font-serif text-4xl md:text-6xl text-ink max-w-2xl">Every smile gets a thoughtful plan.</h2>
              </div>
            </Reveal>
            <Reveal>
              <Link to="/services" className="liquid-glass inline-flex items-center gap-2" data-testid="see-all-services">All Services <ArrowRight size={16} /></Link>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-4">
            {services.slice(0, 9).map((s, i) => {
              const Icon = SVC_ICONS[s.icon] || Sparkles;
              return (
                <Reveal key={s.slug} delay={(i % 3) * 0.05}>
                  <Link to={`/services/${s.slug}`} className="group relative block rounded-3xl bg-bgmain border border-white/60 p-7 h-full overflow-hidden hover:-translate-y-1 transition-all duration-500" data-testid={`home-service-${s.slug}`}>
                    {/* Decorative number */}
                    <div className="absolute top-4 right-5 font-serif text-5xl text-cream/80 leading-none select-none group-hover:text-cocoa/30 transition-colors duration-500">
                      0{i + 1}
                    </div>
                    {/* Icon tile */}
                    <div className="w-14 h-14 rounded-2xl bg-beige flex items-center justify-center mb-5 group-hover:bg-ink group-hover:text-bgmain transition-all duration-500">
                      <Icon size={22} />
                    </div>
                    <div className="eyebrow text-mocha mb-2 text-[0.65rem]">{s.tagline}</div>
                    <h3 className="font-serif text-2xl text-ink mb-2 leading-tight">{s.title}</h3>
                    <p className="text-sm text-inkmuted leading-relaxed mb-5">{s.summary}</p>
                    <div className="flex items-center justify-end border-t border-cream pt-4">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-beige text-ink text-xs font-semibold tracking-[0.16em] uppercase group-hover:bg-ink group-hover:text-bgmain transition-all duration-500">
                        Explore <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* DOCTOR PREVIEW */}
      {doctor && (
        <section className="py-24 px-5 md:px-8">
          <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-10 items-center">
            <Reveal className="md:col-span-5">
              <div className="rounded-[2rem] overflow-hidden aspect-[4/5]">
                <img
                  src="/images/drprateek.jpeg"
                  alt={doctor.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </Reveal>
            <div className="md:col-span-7">
              <Reveal>
                <div className="eyebrow mb-3">Meet Your Doctor</div>
                <h2 className="font-serif text-4xl md:text-6xl text-ink mb-3 leading-[1.05]">{doctor.name}</h2>
                <div className="text-sm uppercase tracking-[0.18em] text-mocha font-semibold mb-5">{doctor.designation}</div>
                <p className="text-inkmuted leading-relaxed text-lg mb-7 max-w-2xl">{doctor.bio}</p>
                <div className="flex flex-wrap gap-2 mb-7">
                  {doctor.expertise?.slice(0, 4).map(e => (
                    <span key={e} className="px-4 py-1.5 rounded-full bg-beige text-xs text-ink">{e}</span>
                  ))}
                </div>
                <Link to="/doctors" className="liquid-glass-dark inline-flex items-center gap-2" data-testid="home-doctor-btn">View Profile <ArrowRight size={16} /></Link>
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section className="py-24 px-5 md:px-8 bg-ink text-bgmain">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} className="text-cream fill-cream" />
              <span className="eyebrow text-cream">{reviewSummary.rating} · {Number(reviewSummary.review_count || 0).toLocaleString()} Google Reviews</span>
            </div>
            <h2 className="font-serif text-4xl md:text-6xl max-w-3xl mb-16">In their own words.</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.slice(0, 3).map((t, i) => (
              <Reveal key={t.name} delay={i * 0.1}>
                <div className="rounded-3xl bg-bgmain/5 border border-bgmain/10 p-7 backdrop-blur" data-testid={`testimonial-${i}`}>
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, k) => <Star key={k} size={14} className="text-cream fill-cream" />)}
                  </div>
                  <p className="font-serif text-lg leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-bgmain/10">
                    <img src={t.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-bgmain/60">{t.location} · {t.service}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-5 md:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <Reveal>
            <div className="eyebrow mb-4">Ready when you are</div>
            <h2 className="font-serif text-5xl md:text-7xl text-ink mb-8">Your dream smile<br /><span className="italic font-light text-cocoa">starts with a hello.</span></h2>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/booking" className="liquid-glass-dark inline-flex items-center gap-2" data-testid="cta-book-btn">Book Free Consultation <ArrowRight size={16} /></Link>
              <a href={`tel:${CLINIC_PHONE}`} className="liquid-glass inline-flex items-center gap-2" data-testid="cta-call-btn"><Phone size={16} /> {CLINIC_PHONE}</a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
