import React, { useState, useRef } from "react";
import { Sparkles, Upload, Loader2, ArrowRight, Check, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API } from "../lib/api";
import Reveal from "../components/Reveal";

export default function SmileAnalysis() {
  const [name, setName] = useState("");
  const [imgPreview, setImgPreview] = useState(null);
  const [imgB64, setImgB64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setError("Image too large (max 8MB)"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setImgPreview(dataUrl);
      setImgB64(dataUrl.split(",")[1]);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!imgB64) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const { data } = await axios.post(`${API}/smile-analysis`, { name, image_base64: imgB64 });
      setResult(data);
    } catch (e) {
      setError("Sorry, we couldn't analyse the photo. Try a clearer front-facing smile photo.");
    }
    setLoading(false);
  };

  const reset = () => {
    setImgPreview(null); setImgB64(null); setResult(null); setError("");
  };

  return (
    <div data-testid="smile-analysis-page" className="pt-32 pb-16 px-5 md:px-8">
      <section className="max-w-4xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-beige border border-cream mb-5">
          <Sparkles size={14} className="text-cocoa"/>
          <span className="text-xs tracking-[0.18em] uppercase font-semibold text-ink">AI Smile Analysis · Free</span>
        </div>
        <h1 className="h-display text-5xl md:text-7xl text-ink mb-6">See your smile<br/><span className="italic text-cocoa">through expert eyes.</span></h1>
        <p className="text-lg text-inkmuted max-w-2xl mx-auto">Upload a front-facing smile photo. Our AI (trained on cosmetic dentistry guidelines) returns a personalised analysis, recommendations, and the best-fit treatments — instantly.</p>
      </section>

      <section className="max-w-4xl mx-auto">
        <div className="rounded-[2rem] bg-bgmain border border-cream p-8 md:p-12 shadow-sm">
          {!result ? (
            <>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                data-testid="sa-name"
                className="w-full px-5 py-3.5 rounded-2xl border border-cream bg-bgmain mb-5"
              />

              {!imgPreview ? (
                <button
                  onClick={() => fileRef.current?.click()}
                  data-testid="sa-upload-btn"
                  className="w-full border-2 border-dashed border-cream hover:border-mocha rounded-3xl p-10 md:p-16 flex flex-col items-center gap-3 text-center transition-colors"
                >
                  <div className="w-14 h-14 rounded-2xl bg-beige flex items-center justify-center">
                    <Upload size={22} className="text-cocoa"/>
                  </div>
                  <div className="font-serif text-2xl text-ink">Upload your smile photo</div>
                  <div className="text-sm text-inkmuted max-w-md">Front-facing, clear, good lighting. JPG/PNG up to 8MB. We never share your photo.</div>
                </button>
              ) : (
                <div className="rounded-3xl overflow-hidden bg-beige relative">
                  <img src={imgPreview} alt="Your smile" className="w-full max-h-[420px] object-contain" data-testid="sa-preview"/>
                  <button onClick={reset} className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-bgmain text-xs text-ink shadow" data-testid="sa-reset">Change photo</button>
                </div>
              )}

              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0])}/>

              {error && <div className="text-sm text-red-600 mt-4 text-center" data-testid="sa-error">{error}</div>}

              <button
                onClick={submit}
                disabled={!imgB64 || loading}
                data-testid="sa-analyse-btn"
                className="liquid-glass-dark w-full mt-5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (<><Loader2 className="animate-spin" size={16}/> Analysing your smile…</>) : (<><Sparkles size={16}/> Analyse My Smile</>)}
              </button>

              <div className="mt-6 grid sm:grid-cols-3 gap-3 text-center text-xs text-inkmuted">
                <div className="px-3 py-3 rounded-2xl bg-beige"><div className="font-serif text-ink mb-1">⏱ 30 seconds</div>Instant analysis</div>
                <div className="px-3 py-3 rounded-2xl bg-beige"><div className="font-serif text-ink mb-1">🔒 Private</div>Your photo isn't shared</div>
                <div className="px-3 py-3 rounded-2xl bg-beige"><div className="font-serif text-ink mb-1">✦ Free</div>No payment needed</div>
              </div>
            </>
          ) : (
            <Reveal>
              <div data-testid="sa-result">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ink text-bgmain mb-4">
                    <Sparkles size={14}/>
                    <span className="text-xs tracking-[0.18em] uppercase font-semibold">Your Personalised Analysis</span>
                  </div>
                  <h2 className="font-serif text-3xl md:text-4xl text-ink">Here's what we noticed{name ? `, ${name}` : ""}.</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="rounded-3xl overflow-hidden bg-beige">
                    <img src={imgPreview} alt="Your smile" className="w-full h-full object-cover max-h-[400px]"/>
                  </div>
                  <div>
                    <div className="eyebrow mb-3">Expert Observation</div>
                    <p className="text-ink leading-relaxed text-lg mb-6">{result.analysis}</p>
                    <div className="eyebrow mb-3">Recommendations</div>
                    <ul className="space-y-3">
                      {result.recommendations?.map((r, i) => (
                        <li key={i} className="flex gap-3 text-sm text-ink">
                          <Check size={18} className="text-cocoa flex-shrink-0 mt-0.5"/>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {result.suggested_services?.length > 0 && (
                  <div className="rounded-3xl bg-ink text-bgmain p-7 mb-6">
                    <div className="eyebrow text-cream mb-3">Best-fit treatments for you</div>
                    <div className="flex flex-wrap gap-2">
                      {result.suggested_services.map(s => (
                        <span key={s} className="px-4 py-2 rounded-full bg-bgmain/10 border border-bgmain/15 text-sm">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 justify-center">
                  <Link to="/booking" className="liquid-glass-dark inline-flex items-center gap-2" data-testid="sa-book-btn">
                    Book Free Consultation <ArrowRight size={16}/>
                  </Link>
                  <button onClick={reset} className="liquid-glass inline-flex items-center gap-2" data-testid="sa-again-btn">
                    <RefreshCw size={14}/> Try another photo
                  </button>
                </div>

                <p className="text-xs text-inkmuted text-center mt-8 max-w-xl mx-auto">This AI analysis is for guidance only. A definitive plan requires an in-person consultation with Dr. Prateek Aggarwal at our NABH-accredited clinic.</p>
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </div>
  );
}
