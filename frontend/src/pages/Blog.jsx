import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { fetchBlog } from "../lib/api";
import Reveal from "../components/Reveal";
import SEO from "../components/SEO";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  useEffect(() => { fetchBlog().then(setPosts); }, []);

  return (
    <div data-testid="blog-page" className="pt-32 pb-16 px-5 md:px-8">
      <SEO
        title="Dental Blog | Oral Health Tips by Dr Prateek Dental Clinic"
        description="Read dentist-written articles on dental implants, root canal treatment, smile makeover, aligners, teeth whitening and oral health care in Ghaziabad."
        path="/blog"
        keywords="dental blog Ghaziabad, oral health tips, dental implants blog, root canal treatment advice, smile makeover tips"
      />
      <section className="max-w-5xl mx-auto text-center mb-16">
        <div className="eyebrow mb-3">Journal · E-E-A-T</div>
        <h1 className="h-display text-5xl md:text-7xl text-ink mb-6">Stories, science<br /><span className="italic text-cocoa">& dental wisdom.</span></h1>
        <p className="text-lg text-inkmuted max-w-2xl mx-auto">Honest, dentist-written and reviewed articles to help you make informed decisions about your oral health.</p>
      </section>

      <section className="max-w-7xl mx-auto">
        {posts[0] && (
          <Reveal>
            <Link to={`/blog/${posts[0].slug}`} className="group grid md:grid-cols-2 gap-8 rounded-[2rem] overflow-hidden bg-beige mb-10" data-testid="featured-post">
              <div className="aspect-[4/3] md:aspect-auto overflow-hidden">
                <img src={posts[0].cover} alt={posts[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
              </div>
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-bgmain text-xs text-ink uppercase tracking-[0.14em] font-semibold">{posts[0].category}</span>
                  <span className="text-xs text-inkmuted self-center flex items-center gap-1.5">
                    <Calendar size={12} /> {posts[0].date_updated || posts[0].date_published}
                  </span>
                  <span className="text-xs text-inkmuted self-center flex items-center gap-1.5">
                    <Clock size={12} /> {posts[0].read_time}
                  </span>
                </div>
                <h2 className="font-serif text-3xl md:text-5xl text-ink mb-4 leading-tight">{posts[0].title}</h2>
                <p className="text-inkmuted leading-relaxed mb-5">{posts[0].excerpt}</p>
                <div className="flex items-center gap-3 mb-6">
                  {posts[0].author_avatar && <img src={posts[0].author_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />}
                  <div className="text-xs">
                    <div className="text-ink font-medium">{posts[0].author_name}</div>
                    <div className="text-inkmuted">{posts[0].author_credentials}</div>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 text-cocoa font-medium group-hover:gap-3 transition-all">Read article <ArrowRight size={16} /></div>
              </div>
            </Link>
          </Reveal>
        )}

        <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-5">
          {posts.slice(1).map((p, i) => (
            <Reveal key={p.slug} delay={(i % 3) * 0.07}>
              <Link to={`/blog/${p.slug}`} className="group block rounded-3xl overflow-hidden bg-bgmain border border-cream hover:-translate-y-1 transition-all duration-500 h-full" data-testid={`post-${p.slug}`}>
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={p.cover} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                </div>
                <div className="p-6">
                  <span className="inline-block px-3 py-1 rounded-full bg-beige text-[0.65rem] uppercase tracking-[0.14em] text-ink font-semibold mb-3">{p.category}</span>
                  <h3 className="font-serif text-xl text-ink leading-tight mb-2 line-clamp-2">{p.title}</h3>
                  <p className="text-sm text-inkmuted leading-relaxed mb-4 line-clamp-2">{p.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-inkmuted border-t border-cream pt-3">
                    <span className="text-ink font-medium">{p.author_name}</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {p.read_time}</span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
