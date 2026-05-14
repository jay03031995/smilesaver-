import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import { adminLogin, setAdminToken } from "../../lib/api";

export default function AdminLogin() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await adminLogin(token);
      setAdminToken(token);
      navigate("/admin");
    } catch {
      setErr("Invalid token");
    }
    setLoading(false);
  };

  return (
    <div data-testid="admin-login" className="min-h-screen flex items-center justify-center px-5 py-20 bg-bgmain">
      <div className="w-full max-w-md rounded-[2rem] bg-bgmain border border-cream p-10 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-ink text-bgmain flex items-center justify-center mb-6 mx-auto">
          <Lock size={20}/>
        </div>
        <h1 className="font-serif text-3xl text-ink text-center mb-2">Admin Sign In</h1>
        <p className="text-sm text-inkmuted text-center mb-8">Smile Savers Dental Clinic Dashboard</p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password" value={token} onChange={(e) => setToken(e.target.value)}
            placeholder="Admin token" required autoFocus data-testid="admin-token-input"
            className="w-full px-5 py-3.5 rounded-2xl border border-cream bg-bgmain"
          />
          {err && <div className="text-sm text-red-600 text-center" data-testid="admin-error">{err}</div>}
          <button type="submit" disabled={loading} data-testid="admin-login-submit"
            className="liquid-glass-dark w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={16}/> : <ArrowRight size={16}/>} Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
