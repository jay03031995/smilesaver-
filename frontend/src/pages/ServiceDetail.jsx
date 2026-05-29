import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, Clock, IndianRupee, Plus, Minus, ArrowRight, Beaker } from "lucide-react";
import { fetchService, fetchServices } from "../lib/api";
import BookingStepper from "../components/BookingStepper";
import Reveal from "../components/Reveal";
import SEO from "../components/SEO";

export default function ServiceDetail() {
  const { slug } = useParams();
  const [service, setService] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    setService(null);
    fetchService(slug).then(setService);
    fetchServices().then(setAllServices);
    window.scrollTo(0, 0);
  }, [slug]);

  if (!service) return <div className="pt-32 px-5 md:px-8 text-center text-inkmuted min-h-screen">Loading…</div>;

  return (
    <div data-testid="service-detail-page" className="pt-28 pb-16">
      <SEO
        title={`${service.title} in Ghaziabad | Dr Prateek Dental Clinic`}
        description={`${service.summary} Book ${service.title} at Dr Prateek Dental Clinic, Ghaziabad.`}
        path={`/services/${slug}`}
        keywords={`${service.title} Ghaziabad, dentist Ghaziabad, Dr Prateek Aggarwal, dental clinic Sahibabad`}
      />
      {/* HERO */}
      <section className="px-5 md:px-8 mb-20">
        <div className="max-w-7xl mx-auto">
          <Link to="/services" className="inline-flex items-center gap-2 text-sm text-inkmuted hover:text-cocoa mb-8" data-testid="back-services">
            <ArrowLeft size={16} /> Back to all services
          </Link>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div className="eyebrow mb-3">{service.tagline}</div>
              <h1 className="h-display text-5xl md:text-7xl text-ink mb-6">{service.title}</h1>
              <p className="text-lg text-inkmuted leading-relaxed mb-8">{service.summary}</p>
              <div className="flex flex-wrap gap-3 mb-8">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-beige">
                  <Clock size={15} className="text-cocoa" />
                  <span className="text-sm text-ink">{service.duration}</span>
                </div>
              </div>
              <a href="#book" className="liquid-glass-dark inline-flex items-center gap-2" data-testid="hero-book-service-btn">Book This Treatment <ArrowRight size={16} /></a>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="rounded-[2rem] overflow-hidden aspect-[4/5]">
                <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* DETAILS + BENEFITS */}
      <section className="px-5 md:px-8 mb-24">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">
          <div className="md:col-span-2">
            <Reveal>
              <div className="eyebrow mb-3">About this treatment</div>
              <h2 className="font-serif text-3xl md:text-5xl text-ink mb-6">What to expect</h2>
              <p className="text-inkmuted leading-relaxed text-lg mb-6">{service.details}</p>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <div className="rounded-3xl bg-beige p-8">
              <div className="eyebrow mb-4">Key Benefits</div>
              <ul className="space-y-4">
                {service.benefits?.map(b => (
                  <li key={b} className="flex gap-3 text-sm text-ink">
                    <Check size={18} className="text-cocoa flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PROCESS */}
      <section className="px-5 md:px-8 mb-24 bg-beige py-20 -mx-5 md:-mx-0 md:rounded-[2rem] md:max-w-7xl md:mx-auto">
        <div className="max-w-7xl mx-auto px-0 md:px-12">
          <Reveal>
            <div className="text-center mb-14">
              <div className="eyebrow mb-3">The Smile Savers Dental Clinic Process</div>
              <h2 className="font-serif text-3xl md:text-5xl text-ink">How your treatment unfolds</h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-4 gap-6">
            {service.process?.map((p, i) => (
              <Reveal key={p.step} delay={i * 0.1}>
                <div className="relative">
                  <div className="font-serif text-6xl text-cocoa/30 mb-2 leading-none">0{i + 1}</div>
                  <h3 className="font-serif text-xl text-ink mb-3 leading-tight">{p.step}</h3>
                  <p className="text-sm text-inkmuted leading-relaxed">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* MATERIALS */}
      {service.materials && (
        <section className="px-5 md:px-8 mb-24">
          <div className="max-w-7xl mx-auto rounded-[2rem] bg-ink text-bgmain p-10 md:p-16 grid md:grid-cols-2 gap-10 items-center">
            <Reveal>
              <div className="w-12 h-12 rounded-2xl bg-bgmain/10 flex items-center justify-center mb-5">
                <Beaker size={20} className="text-cream" />
              </div>
              <div className="eyebrow text-cream mb-3">Globally-trusted materials</div>
              <h2 className="font-serif text-3xl md:text-5xl mb-5">Only the brands the world's best dentists use.</h2>
              <p className="text-bgmain/70 leading-relaxed">We never substitute with local materials. Every brand listed here is internationally traceable and recognised by dental professionals globally.</p>
            </Reveal>
            <Reveal delay={0.15}>
              <ul className="space-y-3">
                {service.materials.map(m => (
                  <li key={m} className="flex gap-3 items-center px-5 py-3.5 rounded-2xl bg-bgmain/5 border border-bgmain/10">
                    <div className="w-2 h-2 rounded-full bg-cream" />
                    <span className="text-bgmain">{m}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>
      )}

      {/* FAQs */}
      {service.faqs && (
        <section className="px-5 md:px-8 mb-24">
          <div className="max-w-4xl mx-auto">
            <Reveal>
              <div className="text-center mb-10">
                <div className="eyebrow mb-3">Common questions</div>
                <h2 className="font-serif text-3xl md:text-5xl text-ink">Everything you might wonder</h2>
              </div>
            </Reveal>
            <div className="space-y-3">
              {service.faqs.map((f, i) => (
                <Reveal key={i} delay={i * 0.05}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                    data-testid={`faq-${i}`}
                    className="w-full text-left rounded-2xl bg-beige border border-cream px-6 py-5 hover:border-mocha transition-colors"
                  >
                    <div className="flex items-center justify-between gap-5">
                      <span className="font-serif text-lg md:text-xl text-ink">{f.q}</span>
                      <span className="w-8 h-8 rounded-full bg-bgmain flex items-center justify-center flex-shrink-0">
                        {openFaq === i ? <Minus size={16} /> : <Plus size={16} />}
                      </span>
                    </div>
                    {openFaq === i && (
                      <p className="text-inkmuted leading-relaxed mt-4 text-sm">{f.a}</p>
                    )}
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4-STEP BOOKING */}
      <section className="px-5 md:px-8 mb-20" id="book">
        <div className="max-w-3xl mx-auto bg-bgmain rounded-[2rem] border border-cream p-8 md:p-12 shadow-sm">
          <Reveal>
            <div className="text-center mb-10">
              <div className="eyebrow mb-3">4-Step Booking</div>
              <h2 className="font-serif text-3xl md:text-4xl text-ink">Reserve your {service.title} consultation</h2>
            </div>
          </Reveal>
          <BookingStepper services={allServices} defaultService={service.title} />
        </div>
      </section>

      {/* RELATED */}
      <section className="px-5 md:px-8">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <h2 className="font-serif text-3xl md:text-4xl text-ink mb-10">You might also explore</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {allServices.filter(s => s.slug !== slug).slice(0, 3).map(s => (
              <Link key={s.slug} to={`/services/${s.slug}`} className="group rounded-3xl overflow-hidden bg-beige" data-testid={`related-${s.slug}`}>
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={s.image} alt={s.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-xl text-ink">{s.title}</h3>
                  <p className="text-sm text-inkmuted mt-1">{s.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
