import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Plus, Edit2, Trash2, FileText, Users, Mail, Sparkles, RefreshCw, Calendar, Loader2 } from "lucide-react";
import { adminListBookings, adminListContacts, adminListSmileAnalyses, adminListBlog, adminDeleteBlog, clearAdminToken, getAdminToken } from "../../lib/api";

const TABS = [
  { id: "bookings", label: "Bookings", icon: Calendar },
  { id: "contacts", label: "Contacts", icon: Mail },
  { id: "smile", label: "Smile Analyses", icon: Sparkles },
  { id: "blog", label: "Blog Posts", icon: FileText },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const [b, c, s, p] = await Promise.all([
        adminListBookings().catch(() => []),
        adminListContacts().catch(() => []),
        adminListSmileAnalyses().catch(() => []),
        adminListBlog().catch(() => []),
      ]);
      setBookings(b); setContacts(c); setAnalyses(s); setPosts(p);
    } catch { }
    setLoading(false);
  };

  useEffect(() => {
    if (!getAdminToken()) { navigate("/admin/login"); return; }
    load();
  }, [navigate]);

  const logout = () => { clearAdminToken(); navigate("/admin/login"); };

  const handleDelete = async (slug) => {
    if (!window.confirm(`Delete post "${slug}"?`)) return;
    await adminDeleteBlog(slug);
    setPosts(p => p.filter(x => x.slug !== slug));
  };

  return (
    <div data-testid="admin-dashboard" className="min-h-screen bg-bgmain pt-24 pb-16 px-5 md:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <div className="eyebrow mb-1">Admin</div>
            <h1 className="font-serif text-3xl md:text-4xl text-ink">Smile Savers Dental Clinic Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="liquid-glass !py-2 !px-4 inline-flex items-center gap-2 text-sm" data-testid="admin-refresh">
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={logout} className="liquid-glass-dark !py-2 !px-4 inline-flex items-center gap-2 text-sm" data-testid="admin-logout">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Bookings", count: bookings.length, color: "from-cocoa to-ink" },
            { label: "Messages", count: contacts.length, color: "from-mocha to-cocoa" },
            { label: "Smile Analyses", count: analyses.length, color: "from-cream to-mocha" },
            { label: "Blog Posts", count: posts.length, color: "from-beige to-cream" },
          ].map(s => (
            <div key={s.label} className={`rounded-3xl p-5 bg-gradient-to-br ${s.color}`}>
              <div className="text-xs uppercase tracking-[0.18em] font-semibold text-bgmain/80 mb-1">{s.label}</div>
              <div className="font-serif text-4xl text-bgmain">{s.count}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map(t => {
            const I = t.icon;
            return (
              <button
                key={t.id} onClick={() => setTab(t.id)} data-testid={`tab-${t.id}`}
                className={`px-5 py-2.5 rounded-full text-sm flex items-center gap-2 whitespace-nowrap transition-all ${tab === t.id ? "bg-ink text-bgmain" : "bg-beige text-ink hover:bg-cream"
                  }`}
              >
                <I size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-mocha" size={32} /></div>
        ) : (
          <div className="rounded-3xl bg-bgmain border border-cream overflow-hidden">
            {tab === "bookings" && <Table rows={bookings} columns={[
              {
                k: "created_at",
                l: "Date",
                fmt: (v) =>
                  v
                    ? new Date(v).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : ""
              },
              { k: "name", l: "Name" },
              { k: "phone", l: "Phone" },
              { k: "service", l: "Service" },
              { k: "preferred_date", l: "Wants" },
              { k: "preferred_time", l: "Time" },
            ]} />}
            {tab === "contacts" && <Table rows={contacts} columns={[
              {
                k: "created_at",
                l: "Date",
                fmt: (v) =>
                  v
                    ? new Date(v).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : ""
              },
              { k: "name", l: "Name" },
              { k: "email", l: "Email" },
              { k: "phone", l: "Phone" },
              { k: "message", l: "Message", fmt: (v) => v?.slice(0, 80) + (v?.length > 80 ? "…" : "") },
            ]} />}
            {tab === "smile" && <Table rows={analyses} columns={[
              {
                k: "created_at",
                l: "Date",
                fmt: (v) =>
                  v
                    ? new Date(v).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : ""
              },
              { k: "name", l: "Name", fmt: (v) => v || "—" },
              { k: "analysis", l: "Analysis", fmt: (v) => v?.slice(0, 100) + "…" },
              { k: "suggested_services", l: "Suggested", fmt: (v) => Array.isArray(v) ? v.join(", ") : "" },
            ]} />}
            {tab === "blog" && (
              <div>
                <div className="flex justify-between items-center p-5 border-b border-cream">
                  <div className="text-sm text-inkmuted">{posts.length} posts</div>
                  <Link to="/admin/blog/new" data-testid="new-post-btn" className="liquid-glass-dark !py-2 !px-4 inline-flex items-center gap-2 text-sm">
                    <Plus size={14} /> New Post
                  </Link>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-beige text-left">
                      <th className="px-5 py-3">Title</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Updated</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((p) => (
                      <tr key={p.slug} className="border-t border-cream" data-testid={`post-row-${p.slug}`}>
                        <td className="px-5 py-3 font-medium text-ink max-w-md truncate">{p.title}</td>
                        <td className="px-5 py-3 text-inkmuted">{p.category}</td>
                        <td className="px-5 py-3 text-inkmuted">{p.date_updated}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${p.is_published ? "bg-cream text-ink" : "bg-beige text-inkmuted"}`}>
                            {p.is_published ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link to={`/admin/blog/${p.slug}/edit`} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-beige hover:bg-cream mr-2" data-testid={`edit-${p.slug}`}>
                            <Edit2 size={12} /> Edit
                          </Link>
                          <button onClick={() => handleDelete(p.slug)} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-red-50 text-red-700 hover:bg-red-100" data-testid={`delete-${p.slug}`}>
                            <Trash2 size={12} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {(tab !== "blog" && (tab === "bookings" ? bookings : tab === "contacts" ? contacts : analyses).length === 0) && (
              <div className="text-center text-inkmuted py-12">No entries yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Table({ rows, columns }) {
  if (!rows.length) return <div className="text-center text-inkmuted py-12">No entries yet.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-beige text-left">{columns.map(c => <th key={c.k} className="px-5 py-3">{c.l}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-cream hover:bg-beige/40">
              {columns.map(c => (
                <td key={c.k} className="px-5 py-3 text-inkmuted align-top max-w-xs">
                  {c.fmt ? c.fmt(r[c.k]) : (r[c.k] || "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
