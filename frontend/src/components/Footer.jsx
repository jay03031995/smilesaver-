import React from "react";
import { Link } from "react-router-dom";
import { Award, Phone, MapPin, Clock, Mail, Instagram, Facebook } from "lucide-react";
import { CLINIC_PHONE } from "./Header";

export default function Footer() {
  return (
    <footer className="bg-ink text-bgmain pt-20 pb-8 px-5 md:px-8 mt-24" data-testid="site-footer">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-4 md:grid-cols-2 gap-12 mb-16">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-5">
            <img
              src="/images/logo.jpeg"
              alt="Smile Savers Dental Clinic"
              className="h-14 w-auto object-contain bg-bgmain rounded-xl p-1.5"
            />
          </div>
          <p className="text-sm text-bgmain/70 leading-relaxed mb-5">
            NABH-accredited dental excellence in Ghaziabad. Trusted cosmetic, implant, and family dental care across Delhi NCR.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bgmain/10 border border-bgmain/20">
            <Award size={14} className="text-cream" />
            <span className="text-xs tracking-[0.16em] uppercase text-cream font-semibold">NABH Accredited</span>
          </div>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-5">Quick Links</h4>
          <ul className="space-y-3 text-sm text-bgmain/70">
            {[["/about", "About Us"], ["/services", "Services"], ["/doctors", "Our Doctors"], ["/gallery", "Gallery"], ["/blog", "Blog"], ["/contact", "Contact"]].map(([to, l]) => (
              <li key={to}><Link to={to} className="hover:text-cream transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-5">Top Services</h4>
          <ul className="space-y-3 text-sm text-bgmain/70">
            {[["smile-makeover", "Smile Makeover"], ["dental-implants", "Dental Implants"], ["root-canal-treatment", "Root Canal"], ["teeth-whitening", "Teeth Whitening"], ["braces-aligners", "Invisalign / Braces"]].map(([s, l]) => (
              <li key={s}><Link to={`/services/${s}`} className="hover:text-cream transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-5">Visit Us</h4>
          <ul className="space-y-4 text-sm text-bgmain/70">
            <li className="flex gap-3"><MapPin size={16} className="text-mocha mt-0.5 flex-shrink-0" /><span>S 28, opp. Gurdwara Sahib, Shubham Apartment, Shalimar Garden Extension I, Sahibabad, Ghaziabad 201006</span></li>
            <li className="flex gap-3"><Phone size={16} className="text-mocha flex-shrink-0" /><a href={`tel:${CLINIC_PHONE}`} className="hover:text-cream">{CLINIC_PHONE}</a></li>
            <li className="flex gap-3"><Mail size={16} className="text-mocha flex-shrink-0" /><span>care@smilesaversdental.in</span></li>
            <li className="flex gap-3"><Clock size={16} className="text-mocha flex-shrink-0" /><span>Open daily · 10:00 AM – 8:00 PM</span></li>
          </ul>
          <div className="flex gap-3 mt-5">
            <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full border border-bgmain/20 flex items-center justify-center hover:bg-bgmain/10"><Instagram size={15} /></a>
            <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-full border border-bgmain/20 flex items-center justify-center hover:bg-bgmain/10"><Facebook size={15} /></a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-bgmain/10 pt-6 flex flex-col md:flex-row justify-between gap-3 text-xs text-bgmain/50">
        <span>© {new Date().getFullYear()} Smile Savers Dental Clinic. All rights reserved.</span>
        <span>NABH · ISO 9001:2015</span>
      </div>
    </footer>
  );
}
