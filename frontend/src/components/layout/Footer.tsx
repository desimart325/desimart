import { Link } from 'react-router-dom';
import { MapPin, Phone } from 'lucide-react';

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-[#0d0d0d] border-t border-[#2a2a2a] mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <img src="/logo.png" alt="Desi Mart" className="h-7 w-7 rounded-full object-cover ring-1 ring-[#f5c518]/40" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span style={{ fontFamily: "'Anton', sans-serif", letterSpacing: '0.02em' }} className="text-xl">
              <span className="text-[#f5c518]">DESI </span>
              <span className="text-white">MART</span>
            </span>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed">
            Your trusted Indian grocery store in Farmington Hills. Fresh, authentic, and always in stock.
          </p>
        </div>

        <div>
          <h3 className="text-white font-bold mb-3 text-sm uppercase tracking-wide">Quick Links</h3>
          <div className="space-y-2">
            {[
              { to: '/products', label: 'All Products' },
              { to: '/products?category=spices-masalas', label: 'Spices & Masalas' },
              { to: '/products?category=rice-grains', label: 'Rice & Grains' },
              { to: '/contact', label: 'Contact Us' },
            ].map(({ to, label }) => (
              <Link key={to} to={to} className="block text-gray-500 text-sm hover:text-[#f5c518] transition-colors">{label}</Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-white font-bold mb-3 text-sm uppercase tracking-wide">Visit Us</h3>
          <div className="space-y-3">
            <div className="flex gap-2 text-sm text-gray-400">
              <MapPin size={16} className="text-[#f5c518] mt-0.5 shrink-0" />
              <div>
                <p>Desi Mart LLC</p>
                <p>31134 Haggerty Rd</p>
                <p>Farmington Hills, MI 48331</p>
              </div>
            </div>
            <a href="tel:+12482543258" className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#f5c518] transition-colors">
              <Phone size={16} className="text-[#f5c518]" />
              (248) 254-3258
            </a>
            <a
              href="https://www.instagram.com/desimart_farmington/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-pink-400 transition-colors"
            >
              <span className="text-pink-400"><InstagramIcon /></span>
              @desimart_farmington
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-[#1a1a1a] py-4 text-center text-gray-600 text-xs">
        © {new Date().getFullYear()} Desi Mart LLC. All rights reserved.
      </div>
    </footer>
  );
}
