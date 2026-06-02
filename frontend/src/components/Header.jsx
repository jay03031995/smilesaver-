import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Phone, Sparkles } from "lucide-react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/doctors", label: "Doctor" },
  { to: "/gallery", label: "Gallery" },
  { to: "/blog", label: "Blog" },
  { to: "/smile-analysis", label: "AI Smile" },
  { to: "/contact", label: "Contact" },
];

export const CLINIC_LOGO = "/images/logo.jpeg";
export const NABH_LOGO = "/images/nabh.jpeg";
export const CLINIC_PHONE = "9711146547";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header data-testid="site-header" className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${scrolled ? "py-2.5" : "py-4"}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className={`flex items-center justify-between gap-4 px-4 md:px-5 py-2 rounded-full backdrop-blur-2xl border transition-all duration-500 ${
          scrolled ? "bg-bgmain/90 border-cream/80 shadow-[0_8px_32px_rgba(188,163,143,0.15)]" : "bg-white/40 border-white/60"
        }`}>
          {/* Left: Dual Logo */}
          <Link to="/" data-testid="logo-link" className="flex items-center gap-2.5 group flex-shrink-0">
            <img src={CLINIC_LOGO} alt="Smile Savers Dental Clinic" className="h-12 md:h-14 w-auto object-contain group-hover:scale-105 transition-transform duration-500" data-testid="clinic-logo"/>
            <div className="flex items-center gap-2 ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-cream/80">
              <img src={NABH_LOGO} alt="NABH Accredited" className="w-9 h-9 sm:w-10 sm:h-10 object-contain" data-testid="nabh-logo"/>
              <div className="hidden lg:block leading-tight">
                <div className="text-[0.65rem] font-bold text-ink tracking-tight">NABH</div>
                <div className="text-[0.55rem] tracking-[0.18em] uppercase text-cocoa font-semibold">Accredited</div>
              </div>
            </div>
          </Link>

          {/* Center: Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={`nav-${n.label.toLowerCase().replace(/\s/g,'-')}`}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-[0.8rem] rounded-full transition-all flex items-center gap-1 ${
                    isActive ? "bg-ink text-bgmain shadow-md" : "text-ink hover:bg-white/70"
                  }`
                }
              >
                {n.label === "AI Smile" && <Sparkles size={12}/>}{n.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: CTA */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href={`tel:${CLINIC_PHONE}`} data-testid="header-call-btn" className="hidden xl:flex items-center gap-2 text-xs text-ink hover:text-cocoa transition-colors">
              <Phone size={13} /> <span>{CLINIC_PHONE}</span>
            </a>
            <button onClick={() => navigate("/booking")} data-testid="header-book-btn" className="liquid-glass text-xs hidden sm:inline-block !py-2 !px-5">
              Book Now
            </button>
            <button className="lg:hidden p-2 rounded-full bg-white/60" onClick={() => setOpen(!open)} data-testid="mobile-menu-btn" aria-label="menu">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="lg:hidden mx-4 mt-2 rounded-3xl bg-bgmain/95 backdrop-blur-xl border border-cream shadow-lg" data-testid="mobile-nav">
          <div className="px-4 py-3 flex flex-col gap-1">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)}
                className={({ isActive }) => `px-4 py-3 rounded-xl text-base ${isActive ? "bg-ink text-bgmain" : "text-ink hover:bg-beige"}`}>
                {n.label}
              </NavLink>
            ))}
            <button onClick={() => { setOpen(false); navigate("/booking"); }} className="liquid-glass-dark mt-2" data-testid="mobile-book-btn">Book Appointment</button>
          </div>
        </div>
      )}
    </header>
  );
}
