import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, User, Sparkles, Plus, Minus, Phone, MessageCircle, Award, Check, ExternalLink } from "lucide-react";
import { fetchBlogPost, fetchServices } from "../lib/api";
import Markdown, { extractTOC } from "../components/Markdown";
import { CLINIC_PHONE } from "../components/Header";

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [services, setServices] = useState([]);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    setPost(null);
    fetchBlogPost(slug).then(setPost);
    fetchServices().then(setServices);
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) return <div className="pt-32 text-center text-inkmuted min-h-screen">Loading…</div>;

  const toc = extractTOC(post.content_md || "");
  const related = (post.related_services || [])
    .map(rs => services.find(s => s.slug === rs))
    .filter(Boolean);

  const faqLd = (post.faqs || []).length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": post.faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  } : null;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.cover,
    "author": {
      "@type": "Person",
      "name": post.author_name,
      "jobTitle": post.author_credentials,
      "worksFor": { "@type": "Dentist", "name": "Smile Savers Dental Clinic" }
    },
    "datePublished": post.date_published,
    "dateModified": post.date_updated,
    "publisher": {
      "@type": "Dentist",
      "name": "Smile Savers Dental Clinic",
      "logo": { "@type": "ImageObject", "url": "https://customer-assets.emergentagent.com/job_dental-ghaziabad/artifacts/ahaez3yf_Untitled%20design%20%282%29.png" }
    }
  };

  return (
    <article data-testid="blog-detail" className="pt-28 pb-16">
      {/* Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(articleLd)}} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(faqLd)}} />}

      {/* Header */}
      <header className="px-5 md:px-8 mb-10">
        <div className="max-w-5xl mx-auto">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-inkmuted hover:text-cocoa mb-7" data-testid="back-blog">
            <ArrowLeft size={16}/> Back to journal
          </Link>
          <div className="flex flex-wrap gap-2 mb-5">
            <span className="px-3 py-1 rounded-full bg-beige text-xs uppercase tracking-[0.14em] text-ink font-semibold">{post.category}</span>
            {post.tags?.slice(0, 3).map(t => (
              <span key={t} className="px-3 py-1 rounded-full bg-bgmain border border-cream text-xs text-inkmuted">#{t}</span>
            ))}
          </div>
          <h1 className="h-display text-4xl md:text-6xl text-ink mb-5 leading-[1.05]">{post.title}</h1>
          <p className="text-xl text-inkmuted font-light leading-relaxed mb-8 max-w-3xl">{post.excerpt}</p>

          {/* Meta strip */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-inkmuted border-y border-cream py-4">
            <div className="flex items-center gap-2.5">
              {post.author_avatar && <img src={post.author_avatar} alt="" className="w-9 h-9 rounded-full object-cover"/>}
              <div className="leading-tight">
                <div className="text-ink font-medium">{post.author_name}</div>
                <div className="text-xs">{post.author_credentials}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5"><Calendar size={14}/> Published {post.date_published}</div>
            <div className="flex items-center gap-1.5"><Calendar size={14}/> Updated {post.date_updated}</div>
            <div className="flex items-center gap-1.5"><Clock size={14}/> {post.read_time}</div>
            <div className="flex items-center gap-1.5 ml-auto"><Award size={14} className="text-cocoa"/> NABH Reviewed</div>
          </div>
        </div>
      </header>

      {/* Cover */}
      <div className="max-w-5xl mx-auto px-5 md:px-8 mb-12">
        <div className="rounded-[2rem] overflow-hidden">
          <img src={post.cover} alt={post.title} className="w-full aspect-[16/9] object-cover"/>
        </div>
      </div>

      {/* Body grid: left sidebar + main */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 grid lg:grid-cols-12 gap-10">
        {/* LEFT STICKY SIDEBAR */}
        <aside className="lg:col-span-3 lg:sticky lg:top-28 lg:self-start space-y-5" data-testid="blog-sidebar">
          {/* Book CTA */}
          <div className="rounded-3xl bg-ink text-bgmain p-6">
            <div className="text-xs tracking-[0.18em] uppercase text-cream font-semibold mb-2">Need help?</div>
            <h3 className="font-serif text-xl mb-2 leading-tight">Book a free consultation</h3>
            <p className="text-sm text-bgmain/70 mb-4">Get a personalised treatment plan from Dr. Prateek.</p>
            <Link to="/booking" data-testid="sidebar-book" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-bgmain text-ink text-sm font-medium hover:bg-cream transition-colors w-full justify-center">
              Book Now <ArrowRight size={14}/>
            </Link>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <a href={`tel:${CLINIC_PHONE}`} className="px-3 py-2 rounded-full bg-bgmain/10 border border-bgmain/20 text-xs flex items-center justify-center gap-1.5 hover:bg-bgmain/20"><Phone size={12}/> Call</a>
              <a href="https://wa.me/919711146547" target="_blank" rel="noreferrer" className="px-3 py-2 rounded-full bg-[#25D366] text-white text-xs flex items-center justify-center gap-1.5 hover:opacity-90"><MessageCircle size={12}/> WhatsApp</a>
            </div>
          </div>

          {/* Treatments backlinks */}
          <div className="rounded-3xl bg-beige p-6">
            <div className="text-xs tracking-[0.18em] uppercase text-mocha font-semibold mb-3">Our Treatments</div>
            <ul className="space-y-1.5">
              {services.slice(0, 8).map(s => (
                <li key={s.slug}>
                  <Link to={`/services/${s.slug}`} data-testid={`sidebar-svc-${s.slug}`} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl hover:bg-bgmain transition-colors text-sm text-ink">
                    <span>{s.title}</span>
                    <ArrowRight size={12} className="text-mocha flex-shrink-0"/>
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/services" className="flex items-center gap-2 px-3 py-2 text-sm text-cocoa font-medium">All services <ArrowRight size={12}/></Link>
              </li>
            </ul>
          </div>

          {/* AI smile */}
          <div className="rounded-3xl bg-gradient-to-br from-cream to-mocha/40 p-6 border border-white/60">
            <div className="flex items-center gap-2 mb-2"><Sparkles size={16} className="text-cocoa"/><div className="text-xs tracking-[0.18em] uppercase text-cocoa font-semibold">Free</div></div>
            <h3 className="font-serif text-xl text-ink mb-2 leading-tight">AI Smile Analysis</h3>
            <p className="text-xs text-inkmuted mb-4">Upload a selfie. Get instant personalised feedback.</p>
            <Link to="/smile-analysis" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-bgmain text-sm hover:bg-cocoa transition-colors w-full justify-center">Try It Now <ArrowRight size={14}/></Link>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="lg:col-span-9">
          {/* Key takeaways */}
          {post.key_takeaways?.length > 0 && (
            <div className="rounded-3xl bg-beige p-7 mb-10" data-testid="key-takeaways">
              <div className="eyebrow mb-3">Key Takeaways</div>
              <ul className="space-y-2.5">
                {post.key_takeaways.map((k, i) => (
                  <li key={i} className="flex gap-3 text-ink">
                    <Check size={18} className="text-cocoa flex-shrink-0 mt-0.5"/>
                    <span>{k}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Table of contents */}
          {toc.length >= 3 && (
            <nav className="rounded-3xl border border-cream p-6 mb-10" data-testid="blog-toc">
              <div className="eyebrow mb-3">In this article</div>
              <ol className="space-y-1.5 list-decimal list-inside">
                {toc.map((h, i) => (
                  <li key={i} className="text-sm">
                    <a href={`#${h.id}`} className="text-ink hover:text-cocoa transition-colors">{h.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Body */}
          <Markdown source={post.content_md || ""}/>

          {/* Related Treatments inline */}
          {related.length > 0 && (
            <section className="rounded-[2rem] bg-ink text-bgmain p-8 md:p-10 my-12" data-testid="related-treatments">
              <div className="eyebrow text-cream mb-3">Related Treatments at Smile Savers Dental Clinic</div>
              <h3 className="font-serif text-2xl md:text-3xl mb-6">Treatments mentioned in this article</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {related.map(s => (
                  <Link key={s.slug} to={`/services/${s.slug}`} data-testid={`related-svc-${s.slug}`}
                        className="group flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-bgmain/5 border border-bgmain/10 hover:bg-bgmain/10 transition-colors">
                    <div>
                      <div className="font-serif text-lg text-bgmain">{s.title}</div>
                      <div className="text-xs text-bgmain/60 mt-0.5">{s.tagline}</div>
                    </div>
                    <ArrowRight size={16} className="text-cream group-hover:translate-x-1 transition-transform"/>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* FAQs */}
          {post.faqs?.length > 0 && (
            <section className="my-12" data-testid="blog-faqs">
              <div className="eyebrow mb-3">Frequently Asked</div>
              <h3 className="font-serif text-3xl md:text-4xl text-ink mb-7">FAQs</h3>
              <div className="space-y-3">
                {post.faqs.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                    data-testid={`blog-faq-${i}`}
                    className="w-full text-left rounded-2xl bg-beige border border-cream px-6 py-5 hover:border-mocha transition-colors"
                  >
                    <div className="flex items-center justify-between gap-5">
                      <span className="font-serif text-lg text-ink">{f.q}</span>
                      <span className="w-8 h-8 rounded-full bg-bgmain flex items-center justify-center flex-shrink-0">
                        {openFaq === i ? <Minus size={16}/> : <Plus size={16}/>}
                      </span>
                    </div>
                    {openFaq === i && <p className="text-inkmuted leading-relaxed mt-4 text-sm">{f.a}</p>}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Author E-E-A-T block */}
          <section className="rounded-[2rem] bg-beige p-8 md:p-10 my-12" data-testid="author-eeat">
            <div className="grid md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-3">
                <img src={post.author_avatar} alt={post.author_name} className="w-32 h-32 rounded-full object-cover"/>
              </div>
              <div className="md:col-span-9">
                <div className="flex items-center gap-2 mb-2">
                  <User size={14} className="text-cocoa"/>
                  <span className="eyebrow text-cocoa">Reviewed by</span>
                </div>
                <h3 className="font-serif text-2xl text-ink mb-1">{post.author_name}</h3>
                <div className="text-sm uppercase tracking-[0.16em] text-mocha font-semibold mb-3">{post.author_credentials}</div>
                <p className="text-inkmuted leading-relaxed text-sm mb-4">{post.author_bio}</p>
                <Link to="/doctors" className="inline-flex items-center gap-2 text-sm text-cocoa font-medium hover:gap-3 transition-all">View full profile <ArrowRight size={14}/></Link>
              </div>
            </div>
          </section>

          {/* References */}
          {post.references?.length > 0 && (
            <section className="rounded-3xl border border-cream p-7 my-10" data-testid="blog-references">
              <div className="eyebrow mb-3">Sources & Further Reading</div>
              <ul className="space-y-2 text-xs text-inkmuted">
                {post.references.map((r, i) => (
                  <li key={i} className="flex gap-2"><ExternalLink size={12} className="text-mocha flex-shrink-0 mt-0.5"/><span>{r}</span></li>
                ))}
              </ul>
            </section>
          )}

          {/* Bottom CTA */}
          <div className="rounded-[2rem] bg-gradient-to-br from-cocoa to-ink text-bgmain p-10 text-center mt-10">
            <h3 className="font-serif text-3xl md:text-4xl mb-3">Have a question this article didn't answer?</h3>
            <p className="text-bgmain/70 mb-7 max-w-xl mx-auto">Speak directly with Dr. Prateek Aggarwal at our NABH-accredited clinic in Ghaziabad.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/booking" className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-bgmain text-ink font-medium hover:bg-cream">Book Free Consultation <ArrowRight size={16}/></Link>
              <Link to="/smile-analysis" className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-bgmain/10 border border-bgmain/20"><Sparkles size={14}/> Try AI Smile Analysis</Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
