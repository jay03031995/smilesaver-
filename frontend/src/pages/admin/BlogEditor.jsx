import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Plus, Trash2, Eye } from "lucide-react";
import { adminCreateBlog, adminUpdateBlog, fetchBlogPost, fetchServices, getAdminToken } from "../../lib/api";
import Markdown from "../../components/Markdown";
import { toast } from "sonner";

const EMPTY = {
  slug: "", title: "", excerpt: "", cover: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&q=80",
  category: "Cosmetic Dentistry", tags: [], read_time: "6 min", key_takeaways: [],
  content_md: "## Introduction\n\nWrite your introduction here…\n\n## Section\n\nMore content…",
  faqs: [], related_services: [], references: [], is_published: true,
  author_name: "Dr. Prateek Aggarwal",
  author_credentials: "BDS, MDS · Implantologist · 16+ years",
  author_bio: "Founder of Smile Savers Dental Clinic, Ghaziabad.",
  author_avatar: "https://customer-assets.emergentagent.com/job_dental-ghaziabad/artifacts/gsy52duo_ChatGPT%20Image%20May%206%2C%202026%2C%2008_22_07%20PM.png",
};

export default function BlogEditor() {
  const { slug } = useParams();
  const isEdit = !!slug;
  const navigate = useNavigate();
  const [data, setData] = useState(EMPTY);
  const [services, setServices] = useState([]);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!getAdminToken()) { navigate("/admin/login"); return; }
    fetchServices().then(setServices);
    if (isEdit) fetchBlogPost(slug).then(setData);
  }, [slug, isEdit, navigate]);

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const setArr = (k, v) => set(k, v.split(",").map(x => x.trim()).filter(Boolean));

  const addFaq = () => set("faqs", [...(data.faqs || []), { q: "", a: "" }]);
  const updateFaq = (i, field, v) => {
    const next = [...(data.faqs || [])];
    next[i] = { ...next[i], [field]: v };
    set("faqs", next);
  };
  const delFaq = (i) => set("faqs", data.faqs.filter((_, j) => j !== i));

  const toggleService = (sl) => {
    const cur = data.related_services || [];
    set("related_services", cur.includes(sl) ? cur.filter(s => s !== sl) : [...cur, sl]);
  };

  const save = async () => {
    if (!data.slug || !data.title || !data.content_md) {
      toast.error("Slug, title and content are required"); return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await adminUpdateBlog(slug, data);
        toast.success("Post updated");
      } else {
        await adminCreateBlog(data);
        toast.success("Post created");
      }
      navigate("/admin");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed");
    }
    setSaving(false);
  };

  const charCount = (data.content_md || "").length;

  return (
    <div data-testid="blog-editor" className="min-h-screen bg-bgmain pt-24 pb-16 px-5 md:px-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-inkmuted hover:text-cocoa mb-5"><ArrowLeft size={16}/> Back</Link>
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-3xl text-ink">{isEdit ? "Edit Post" : "New Post"}</h1>
          <div className="flex gap-2">
            <button onClick={() => setPreview(p => !p)} className="liquid-glass !py-2 !px-4 inline-flex items-center gap-2 text-sm" data-testid="preview-toggle">
              <Eye size={14}/> {preview ? "Edit" : "Preview"}
            </button>
            <button onClick={save} disabled={saving} className="liquid-glass-dark !py-2 !px-4 inline-flex items-center gap-2 text-sm disabled:opacity-50" data-testid="save-post">
              {saving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} Save
            </button>
          </div>
        </div>

        {preview ? (
          <div className="rounded-[2rem] bg-bgmain border border-cream p-8 md:p-12">
            <div className="max-w-3xl mx-auto">
              <div className="eyebrow mb-3">{data.category}</div>
              <h1 className="h-display text-4xl md:text-5xl text-ink mb-4">{data.title || "(no title)"}</h1>
              <p className="text-lg text-inkmuted mb-7">{data.excerpt}</p>
              <Markdown source={data.content_md}/>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Field label="Slug *" value={data.slug} onChange={(v) => set("slug", v)} placeholder="how-long-do-implants-last" testId="slug"/>
              <Field label="Title *" value={data.title} onChange={(v) => set("title", v)} testId="title"/>
              <Field label="Excerpt" value={data.excerpt} onChange={(v) => set("excerpt", v)} multi testId="excerpt"/>
              <Field label="Cover image URL" value={data.cover} onChange={(v) => set("cover", v)} testId="cover"/>

              <div>
                <Label>Content (Markdown) <span className="text-inkmuted text-xs ml-2">{charCount} chars · min 2000 recommended</span></Label>
                <textarea
                  value={data.content_md} onChange={(e) => set("content_md", e.target.value)}
                  rows={22} data-testid="content"
                  className="w-full px-5 py-4 rounded-2xl border border-cream bg-bgmain font-mono text-sm leading-relaxed"
                />
                <p className="text-xs text-inkmuted mt-1.5">Use ## for H2, ### for H3, - for lists, &gt; for quotes, **bold**, [link](/services/slug). Tables supported with | syntax.</p>
              </div>

              {/* Key takeaways */}
              <div>
                <Label>Key Takeaways (comma-separated)</Label>
                <textarea
                  value={(data.key_takeaways || []).join(", ")} onChange={(e) => setArr("key_takeaways", e.target.value)}
                  rows={3} data-testid="takeaways"
                  className="w-full px-5 py-3 rounded-2xl border border-cream bg-bgmain text-sm"
                />
              </div>

              {/* FAQs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>FAQs (for AEO / featured snippets)</Label>
                  <button onClick={addFaq} className="text-xs text-cocoa flex items-center gap-1"><Plus size={12}/> Add FAQ</button>
                </div>
                <div className="space-y-2">
                  {(data.faqs || []).map((f, i) => (
                    <div key={i} className="rounded-2xl border border-cream p-4 bg-beige/40">
                      <input value={f.q} onChange={(e) => updateFaq(i, "q", e.target.value)}
                             placeholder="Question" data-testid={`faq-q-${i}`}
                             className="w-full px-3 py-2 rounded-xl border border-cream bg-bgmain mb-2 text-sm font-medium"/>
                      <textarea value={f.a} onChange={(e) => updateFaq(i, "a", e.target.value)}
                                placeholder="Answer" rows={2} data-testid={`faq-a-${i}`}
                                className="w-full px-3 py-2 rounded-xl border border-cream bg-bgmain text-sm"/>
                      <button onClick={() => delFaq(i)} className="text-xs text-red-600 mt-1 inline-flex items-center gap-1"><Trash2 size={12}/> Remove</button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>References (one per line — for E-E-A-T)</Label>
                <textarea
                  value={(data.references || []).join("\n")}
                  onChange={(e) => set("references", e.target.value.split("\n").filter(Boolean))}
                  rows={3} data-testid="references"
                  className="w-full px-5 py-3 rounded-2xl border border-cream bg-bgmain text-sm"
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Field label="Category" value={data.category} onChange={(v) => set("category", v)}/>
              <Field label="Read time" value={data.read_time} onChange={(v) => set("read_time", v)}/>
              <Field label="Tags (comma-sep)" value={(data.tags || []).join(", ")} onChange={(v) => setArr("tags", v)}/>

              <div>
                <Label>Related Services (backlinks)</Label>
                <div className="rounded-2xl border border-cream p-3 max-h-64 overflow-auto bg-bgmain space-y-1">
                  {services.map(s => (
                    <label key={s.slug} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-beige px-2 py-1 rounded">
                      <input type="checkbox"
                        checked={(data.related_services || []).includes(s.slug)}
                        onChange={() => toggleService(s.slug)}
                        data-testid={`rel-${s.slug}`}
                      />
                      <span>{s.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-cream p-4 bg-beige/40 space-y-3">
                <Label>Author E-E-A-T</Label>
                <Field compact label="Name" value={data.author_name} onChange={(v) => set("author_name", v)}/>
                <Field compact label="Credentials" value={data.author_credentials} onChange={(v) => set("author_credentials", v)}/>
                <Field compact label="Bio" value={data.author_bio} onChange={(v) => set("author_bio", v)} multi/>
                <Field compact label="Avatar URL" value={data.author_avatar} onChange={(v) => set("author_avatar", v)}/>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={data.is_published} onChange={(e) => set("is_published", e.target.checked)} data-testid="is-published"/>
                Published
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const Label = ({ children }) => <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-mocha mb-1.5">{children}</label>;
function Field({ label, value, onChange, multi, compact, placeholder, testId }) {
  return (
    <div>
      <Label>{label}</Label>
      {multi ? (
        <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={2} placeholder={placeholder} data-testid={testId}
          className={`w-full px-${compact ? "3" : "5"} py-${compact ? "2" : "3"} rounded-2xl border border-cream bg-bgmain text-sm`}/>
      ) : (
        <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} data-testid={testId}
          className={`w-full px-${compact ? "3" : "5"} py-${compact ? "2" : "3"} rounded-2xl border border-cream bg-bgmain text-sm`}/>
      )}
    </div>
  );
}
