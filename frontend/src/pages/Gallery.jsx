import React, { useState } from "react";
import Reveal from "../components/Reveal";
import SEO from "../components/SEO";

const TABS = ["All", "Clinic", "Patients", "Awards"];

const LOCAL_GALLERY = [
  {
    category: "Clinic",
    image: "/images/gallery/WhatsApp Image 2026-05-18 at 12.18.14 PM.jpeg",
    caption: "Clinic Interior",
  },
  {
    category: "Clinic",
    image: "/images/gallery/New folder/Clinic2.jpeg",
    caption: "Reception Area",
  },
  {
    category: "Clinic",
    image: "/images/gallery/New folder/WhatsApp Image 2025-01-29 at 12.11.09 PM.jpeg",
    caption: "Treatment Room",
  },
  {
    category: "Clinic",
    image: "/images/gallery/New folder/WhatsApp Image 2025-01-15 at 1.56.58 PM.jpeg",
    caption: "Clinic Facility",
  },
  {
    category: "Patients",
    image: "/images/gallery/DSC_2779.JPG",
    caption: "Happy Patient",
  },
  {
    category: "Patients",
    image: "/images/gallery/DSC_2534.JPG",
    caption: "Smile Transformation",
  },
  {
    category: "Awards",
    image: "/images/gallery/WhatsApp Image 2019-10-14 at 3.07.37 PM.jpeg",
    caption: "Award Moment",
  },
  {
    category: "Awards",
    image: "/images/gallery/UIFD9790.JPG",
    caption: "Recognition",
  },
  {
    category: "Awards",
    image: "/images/gallery/Jaya Prada.jpg",
    caption: "Celebrity Recognition",
  },
  {
    category: "Awards",
    image: "/images/gallery/FPFA 2024.jpg",
    caption: "FPFA Award 2024",
  },
  {
    category: "Awards",
    image: "/images/gallery/Arbaaz khan.jpg",
    caption: "Award Ceremony",
  },
  {
    category: "Awards",
    image: "/images/gallery/VOC.jpg",
    caption: "VOC Recognition",
  },
  {
    category: "Awards",
    image: "/images/gallery/anti microbial certificate.JPG",
    caption: "Anti Microbial Certificate",
  },
];

export default function Gallery() {
  const [filter, setFilter] = useState("All");

  const filtered =
    filter === "All"
      ? LOCAL_GALLERY
      : LOCAL_GALLERY.filter((item) => item.category === filter);

  return (
    <div data-testid="gallery-page" className="pt-32 pb-16 px-5 md:px-8">
      <SEO
        title="Dental Clinic Gallery | Smile Savers Dental Clinic Ghaziabad"
        description="Explore Smile Savers Dental Clinic through our gallery featuring clinic interiors, advanced dental facilities, happy patients, awards and achievements in Ghaziabad."
        path="/gallery"
        keywords="dental clinic gallery Ghaziabad, Smile Savers gallery, dental clinic photos, dentist clinic images, dental awards Ghaziabad"
      />

      <section className="max-w-5xl mx-auto text-center mb-12">
        <div className="eyebrow mb-3">Gallery</div>

        <h1 className="h-display text-5xl md:text-7xl text-ink mb-6">
          Moments that
          <br />
          <span className="italic text-cocoa">define our craft.</span>
        </h1>

        <p className="text-lg text-inkmuted max-w-2xl mx-auto">
          A behind-the-scenes look at our clinic, our awards, and the smiles
          we've helped craft.
        </p>
      </section>

      <div className="flex justify-center gap-2 mb-10 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            data-testid={`gallery-tab-${tab.toLowerCase()}`}
            className={`px-5 py-2 rounded-full text-sm transition-all ${filter === tab
              ? "bg-ink text-bgmain"
              : "bg-beige text-ink hover:bg-cream"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-5">
          {filtered.map((item, index) => (
            <Reveal key={`${item.image}-${index}`} delay={(index % 6) * 0.05}>
              <div
                className={`rounded-3xl overflow-hidden bg-beige group ${index % 5 === 0 ? "md:row-span-2" : ""
                  }`}
                data-testid={`gallery-item-${index}`}
              >
                <div
                  className={`overflow-hidden ${item.category === "Clinic"
                    ? "aspect-[16/10]"
                    : "aspect-[4/3]"
                    }`}
                >
                  <img
                    src={item.image}
                    alt={item.caption}
                    className={`w-full h-full transition-transform duration-700 ${item.category === "Clinic"
                      ? "object-cover object-center group-hover:scale-105"
                      : "object-cover object-top group-hover:scale-105"
                      }`}
                    loading="lazy"
                  />
                </div>

                <div className="p-4 flex justify-between items-center gap-3">
                  <span className="font-serif text-lg text-ink">
                    {item.caption}
                  </span>
                  <span className="text-[0.65rem] uppercase tracking-[0.16em] text-mocha font-semibold">
                    {item.category}
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
