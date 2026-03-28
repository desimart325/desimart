import { MapPin, Phone, Clock, Mail } from 'lucide-react';

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
  </svg>
);

export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-white mb-3">
          Get in <span className="text-[#f5c518]">Touch</span>
        </h1>
        <p className="text-gray-400 max-w-md mx-auto">
          Visit us in-store or reach out — we're always happy to help you find what you need.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Store info */}
        <div className="space-y-4">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="bg-[#f5c518]/10 p-3 rounded-xl text-[#f5c518]">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Store Location</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Desi Mart LLC<br />
                  31134 Haggerty Rd<br />
                  Farmington Hills, MI 48331
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="bg-[#f5c518]/10 p-3 rounded-xl text-[#f5c518]">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Phone</h3>
                <a href="tel:+12482543258" className="text-[#f5c518] hover:underline text-sm font-medium">
                  (248) 254-3258
                </a>
                <p className="text-gray-500 text-xs mt-1">Call us anytime during store hours</p>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="bg-[#f5c518]/10 p-3 rounded-xl text-[#f5c518]">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Email</h3>
                <a href="mailto:desimart325@gmail.com" className="text-[#f5c518] hover:underline text-sm font-medium">
                  desimart325@gmail.com
                </a>
                <p className="text-gray-500 text-xs mt-1">We'll respond within 24 hours</p>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-3 rounded-xl text-pink-400">
                <InstagramIcon />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">Instagram</h3>
                <a
                  href="https://www.instagram.com/desimart_farmington/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hover:from-purple-300 hover:to-pink-300 transition-all"
                >
                  @desimart_farmington
                </a>
                <p className="text-gray-500 text-xs mt-1">Follow us for deals & updates</p>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="bg-[#f5c518]/10 p-3 rounded-xl text-[#f5c518]">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold mb-2">Store Hours</h3>
                <div className="space-y-1 text-sm">
                  {[
                    { day: 'Monday – Friday', hours: '9:00 AM – 8:00 PM' },
                    { day: 'Saturday', hours: '9:00 AM – 9:00 PM' },
                    { day: 'Sunday', hours: '10:00 AM – 7:00 PM' },
                  ].map(({ day, hours }) => (
                    <div key={day} className="flex justify-between gap-4">
                      <span className="text-gray-400">{day}</span>
                      <span className="text-white font-medium">{hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Send us a Message</h2>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Thank you! We\'ll get back to you soon.'); }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">First Name</label>
                <input type="text" required
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f5c518] transition-colors" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Last Name</label>
                <input type="text" required
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f5c518] transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Email</label>
              <input type="email" required
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f5c518] transition-colors" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Phone (optional)</label>
              <input type="tel"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f5c518] transition-colors" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Message</label>
              <textarea rows={4} required
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f5c518] transition-colors resize-none" />
            </div>
            <button type="submit"
              className="w-full bg-[#f5c518] text-black font-bold py-3 rounded-xl hover:bg-[#ffd740] transition-colors">
              Send Message
            </button>
          </form>
        </div>
      </div>

      {/* Map embed placeholder */}
      <div className="mt-6 bg-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden h-64 flex items-center justify-center">
        <a
          href="https://maps.google.com/?q=31134+Haggerty+Rd+Farmington+Hills+MI+48331"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-3 text-gray-500 hover:text-[#f5c518] transition-colors"
        >
          <MapPin size={40} />
          <span className="text-sm">31134 Haggerty Rd, Farmington Hills, MI 48331</span>
          <span className="text-xs border border-[#2a2a2a] rounded-lg px-4 py-2 hover:border-[#f5c518]">Open in Google Maps</span>
        </a>
      </div>
    </div>
  );
}
