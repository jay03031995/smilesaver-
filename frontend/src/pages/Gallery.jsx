import React, { useEffect, useState } from "react";
import { fetchGallery } from "../lib/api";
import Reveal from "../components/Reveal";

const TABS = ["All", "Clinic", "Patients", "Awards"];

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("All");
  useEffect(() => { fetchGallery().then(setItems); }, []);

  const filtered = filter === "All" ? items : items.filter(i => i.category === filter);

  return (
    <div data-testid="gallery-page" className="pt-32 pb-16 px-5 md:px-8">
      <section className="max-w-5xl mx-auto text-center mb-12">
        <div className="eyebrow mb-3">Gallery</div>
        <h1 className="h-display text-5xl md:text-7xl text-ink mb-6">Moments that<br/><span className="italic text-cocoa">define our craft.</span></h1>
        <p className="text-lg text-inkmuted max-w-2xl mx-auto">A behind-the-scenes look at our clinic, our awards, and the smiles we've helped craft.</p>
      </section>

      <div className="flex justify-center gap-2 mb-10 flex-wrap">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            data-testid={`gallery-tab-${t.toLowerCase()}`}
            className={`px-5 py-2 rounded-full text-sm transition-all ${
              filter === t ? "bg-ink text-bgmain" : "bg-beige text-ink hover:bg-cream"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <section className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-5">
          {filtered.map((g, i) => (
            <Reveal key={g.image} delay={(i%6)*0.05}>
              <div className={`rounded-3xl overflow-hidden bg-beige group ${i % 5 === 0 ? "md:row-span-2" : ""}`} data-testid={`gallery-item-${i}`}>
                <div className={`overflow-hidden ${i % 5 === 0 ? "aspect-[4/5]" : "aspect-[4/3]"}`}>
                  <img src={g.image} alt={g.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"/>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="font-serif text-lg text-ink">{g.caption}</span>
                  <span className="text-[0.65rem] uppercase tracking-[0.16em] text-mocha font-semibold">{g.category}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
