import { useState } from 'react';
import { Heart, HandHeart, Check, Globe, Shield, Mail, BookOpen, Users, Sparkles, ArrowRight } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import ScrollReveal from '@/components/ScrollReveal';
import LocationFields, { type LocationData } from '@/components/LocationFields';
import { insertDonation } from '@/lib/supabase';

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

const impactStats = [
  { number: '5,000+', label: 'Believers Growing Daily' },
  { number: '12+',    label: 'Countries Reached' },
  { number: '600+',   label: 'Days of Devotionals' },
  { number: '3',      label: 'Generations Reading' },
];

const impactAreas = [
  { icon: BookOpen, title: 'Create Devotionals', desc: 'Fund the writing, design, and production of new volumes across all six collections — for adults, teens, and children.' },
  { icon: Users, title: 'Reach More Families', desc: 'Help distribute free samples and build WhatsApp communities across Africa and the world.' },
  { icon: Sparkles, title: 'Support the Ministry', desc: 'Sustain the ongoing work of Epic True North in Nairobi — printing, shipping, and equipping local churches.' },
];

const trustSignals = [
  { icon: Shield, title: 'Secure & Private', desc: 'Your information is never shared or sold. PayPal handles all payment processing with bank-grade encryption.' },
  { icon: Globe, title: 'Global Impact', desc: 'Donations reach families in 12+ countries across Africa, Europe, and the Americas.' },
  { icon: Mail, title: 'Stay Informed', desc: 'Receive occasional updates on how your gift is making a difference. Unsubscribe anytime.' },
];

export default function DonatePage() {
  useSEO({
    title: 'Donate | In Him Daily',
    description: 'Partner with In Him Daily through your generosity. Your donation helps share Jesus with families across generations around the world.',
    canonicalPath: '/donate',
    ogImage: 'https://inhimdaily.org/images/733127106_122096833941384062_9064072413288732878_n.jpg',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'DonateAction',
      name: 'Donate to In Him Daily',
      description: 'Support the ministry of In Him Daily by making a donation.',
      recipient: { '@type': 'NGO', name: 'Epic True North' },
    },
  });

  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [location, setLocation]   = useState<LocationData>({ country: '', city_region: '' });
  const [amount, setAmount]       = useState<number | ''>('');
  const [customAmount, setCustom] = useState('');
  const [prayerRequest, setPrayer] = useState('');
  const [message, setMessage]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const inputCls = "w-full px-5 py-3.5 rounded-xl ih-input text-white placeholder-white/35 transition-colors text-sm";

  function handlePreset(val: number) {
    setAmount(val);
    setCustom('');
  }

  function handleCustom(val: string) {
    setCustom(val);
    setAmount(val ? parseFloat(val) : '');
  }

  function getPayPalUrl(): string {
    const baseUrl = 'https://www.paypal.com/donate';
    const params = new URLSearchParams({
      business: 'hello@inhimdaily.org',
      currency_code: 'USD',
      ...(amount ? { amount: String(amount) } : {}),
    });
    return `${baseUrl}?${params.toString()}`;
  }

  function handlePayPal() {
    if (!amount || amount < 1) {
      setFormError('Please select or enter a donation amount first.');
      return;
    }
    window.open(getPayPalUrl(), '_blank');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!name || !email || !location.country) {
      setFormError('Please fill in your name, email, and country.');
      return;
    }
    if (!amount || amount < 1) {
      setFormError('Please select or enter a donation amount.');
      return;
    }
    try {
      await insertDonation({
        name,
        email,
        country: location.country,
        city_region: location.city_region,
        amount: amount || undefined,
        prayer_request: prayerRequest || undefined,
        message: message || undefined,
      });
      setSubmitted(true);
    } catch {
      setFormError('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative pt-32 pb-24 bg-navy-700 overflow-hidden" aria-label="Donate hero">
        <div className="absolute inset-0 bg-cover bg-center" aria-hidden="true" style={{ backgroundImage: "url('https://images.pexels.com/photos/261763/pexels-photo-261763.jpeg?auto=compress&cs=tinysrgb&w=1920')", opacity: 0.2 }} />
        <div className="absolute inset-0" aria-hidden="true" style={{ background: 'linear-gradient(180deg, rgba(14,32,53,0.78) 0%, rgba(14,32,53,0.92) 100%)' }} />
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
          style={{ background: 'radial-gradient(ellipse 55% 45% at 50% 75%, rgba(201,152,58,0.11) 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-gold-400/15 border border-gold-400/30 flex items-center justify-center">
            <HandHeart size={26} className="text-gold-300" aria-hidden="true" />
          </div>
          <p className="text-gold-400 text-[0.72rem] font-semibold tracking-[0.16em] uppercase mb-4">Partner With Us</p>
          <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Support the Mission
          </h1>
          <p className="text-white/65 text-xl max-w-2xl mx-auto leading-relaxed mb-6">
            Your generosity helps share Jesus with families across generations around the world.
          </p>
          <p className="text-white/50 text-base max-w-2xl mx-auto leading-relaxed">
            In Him Daily is a ministry of Epic True North, based in Nairobi, Kenya. Every gift — large or small — helps us
            create Christ-centred devotionals, distribute free samples, and build communities where families encounter Jesus together.
          </p>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-12 ih-section border-t border-white/5" aria-label="Impact statistics">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-8">
            <p className="font-cormorant text-2xl text-gold-200 italic leading-relaxed">
              Over 5,000 believers growing daily in Christ — and counting.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {impactStats.map((s, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <div className="text-center p-5 rounded-2xl bg-white/5 border border-white/10">
                  <p className="font-playfair text-3xl md:text-4xl font-bold text-gold-300 mb-1">{s.number}</p>
                  <p className="text-white/55 text-xs">{s.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Purpose */}
      <section className="py-20 ih-section" aria-labelledby="mission-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-12">
            <p className="ih-eyebrow mb-3">Our Mission</p>
            <h2 id="mission-heading" className="font-playfair text-3xl md:text-4xl font-bold text-white mb-4">
              Why Your Giving Matters
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
              We believe every family — regardless of income or location — deserves to encounter Jesus daily through Scripture.
              Your partnership makes that possible.
            </p>
          </ScrollReveal>
          <ScrollReveal className="max-w-2xl mx-auto mb-12">
            <div className="p-8 rounded-2xl ih-card text-center">
              <p className="font-cormorant text-xl md:text-2xl text-white/90 italic leading-relaxed mb-4">
                &ldquo;For you died, and your life is now hidden with Christ in God.&rdquo;
              </p>
              <span className="text-gold-400 text-sm font-semibold tracking-wider">Colossians 3:3</span>
              <div className="gold-divider mx-auto my-6" aria-hidden="true" />
              <p className="text-white/60 text-sm leading-relaxed">
                In Him Daily exists to help families discover who they are, what they have, and where they stand — in Christ.
                Every devotional, every book, every community is built to reveal Jesus on every page of Scripture, for every generation.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-3 gap-5">
            {impactAreas.map((item, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <div className="p-6 rounded-2xl ih-card h-full">
                  <div className="w-10 h-10 rounded-full bg-gold-400/15 border border-gold-400/25 flex items-center justify-center mb-4">
                    <item.icon size={18} className="text-gold-300" aria-hidden="true" />
                  </div>
                  <h3 className="font-playfair text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-white/55 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Donation Form / Thank You */}
      <section className="py-20 ih-section" aria-labelledby="donate-form-heading">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div id="donate" className="scroll-mt-24">
              <h2 id="donate-form-heading" className="font-playfair text-3xl font-bold text-white text-center mb-2">Make a Donation</h2>
              <p className="text-white/55 text-sm text-center mb-8">Every gift helps families encounter Jesus daily.</p>
            </div>
            {submitted ? (
              <div className="p-8 md:p-10 rounded-2xl ih-card border-gold-400/30 animate-fade-in text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center mx-auto mb-6">
                  <Check size={28} className="text-green-400" aria-hidden="true" />
                </div>
                <h2 className="font-playfair text-2xl md:text-3xl font-bold text-white mb-4">Thank You for Partnering With Us</h2>
                <p className="text-white/60 leading-relaxed mb-6">
                  {name ? `${name}, ` : ''}thank you for your generosity{amount ? ` of $${amount}` : ''}. Your gift helps share Jesus
                  with families across generations around the world. A confirmation email is on its way to {email || 'your inbox'}.
                </p>
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-left mb-6">
                  <p className="text-[0.68rem] font-bold text-gold-300 uppercase tracking-[0.12em] mb-2">What Happens Next</p>
                  <ul className="space-y-2" role="list">
                    <li className="flex items-start gap-2.5 text-sm text-white/60">
                      <Check size={14} className="text-green-400 mt-0.5 shrink-0" aria-hidden="true" />
                      You will receive a confirmation email with your donation details.
                    </li>
                    <li className="flex items-start gap-2.5 text-sm text-white/60">
                      <Check size={14} className="text-green-400 mt-0.5 shrink-0" aria-hidden="true" />
                      If you included a prayer request, our prayer team will be praying over it this week.
                    </li>
                    <li className="flex items-start gap-2.5 text-sm text-white/60">
                      <Check size={14} className="text-green-400 mt-0.5 shrink-0" aria-hidden="true" />
                      You will receive occasional ministry updates — you can unsubscribe anytime.
                    </li>
                  </ul>
                </div>
                <p className="font-cormorant text-lg text-gold-200 italic">
                  &ldquo;Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.&rdquo;
                </p>
                <p className="text-gold-400 text-[0.72rem] font-semibold mt-2 tracking-[0.18em] uppercase">2 Corinthians 9:7</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="ih-card p-8 space-y-5" noValidate>
                {/* Amount selection */}
                <div>
                  <label className="block text-[0.72rem] font-semibold text-white/50 mb-2 tracking-wider uppercase">Donation Amount</label>
                  <div className="flex flex-wrap gap-2.5 mb-3">
                    {PRESET_AMOUNTS.map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handlePreset(val)}
                        className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-250 ${
                          amount === val ? 'ih-btn-gold' : 'ih-btn-ghost'
                        }`}
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                    <input
                      type="number"
                      placeholder="Custom amount"
                      value={customAmount}
                      onChange={e => handleCustom(e.target.value)}
                      min={1}
                      className={inputCls + ' pl-7'}
                      aria-label="Custom donation amount"
                    />
                  </div>
                </div>

                {/* PayPal checkout button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handlePayPal}
                    className="w-full py-4 rounded-xl bg-[#0070BA] hover:bg-[#005ea6] text-white font-bold text-[0.9rem] transition-all duration-300 hover:-translate-y-0.5 shadow-lg flex items-center justify-center gap-2.5"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M7.076 21.567c.04.022.084.042.13.06a7.137 7.137 0 003.977.808 8.27 8.27 0 003.181-.682l-.052-.063a7.47 7.47 0 01-2.69-5.79c0-.102.003-.204.01-.306a5.44 5.44 0 01-2.36-4.48c0-.18.011-.358.032-.533a5.417 5.417 0 00-3.197 4.95c0 1.48.595 2.821 1.563 3.81l-.06.063a7.47 7.47 0 01-2.69 5.79l-.052.063z" opacity="0.7" />
                      <path d="M7.2 14.4A5.4 5.4 0 019.56 9.92a8.27 8.27 0 00-.01.306 7.47 7.47 0 002.69 5.79l.052.063a8.27 8.27 0 01-3.181.682 7.137 7.137 0 01-3.977-.808 7.47 7.47 0 002.066-1.553z" />
                    </svg>
                    {amount ? `Donate $${amount} with PayPal` : 'Donate with PayPal'}
                  </button>
                  <p className="text-white/35 text-xs mt-2 text-center flex items-center justify-center gap-1.5">
                    <Shield size={11} aria-hidden="true" /> Secure checkout via PayPal. No PayPal account required — credit and debit cards accepted.
                  </p>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1 h-px bg-white/10" aria-hidden="true" />
                  <span className="text-white/30 text-[0.68rem] tracking-wider uppercase">Or pledge by email</span>
                  <div className="flex-1 h-px bg-white/10" aria-hidden="true" />
                </div>

                {/* Name & Email */}
                <div className="grid sm:grid-cols-2 gap-3.5">
                  <input type="text" placeholder="Full Name *" value={name} onChange={e=>setName(e.target.value)} required aria-label="Full name" className={inputCls} />
                  <input type="email" placeholder="Email Address *" value={email} onChange={e=>setEmail(e.target.value)} required aria-label="Email address" className={inputCls} />
                </div>

                {/* Location */}
                <LocationFields value={location} onChange={setLocation} />

                {/* Prayer Request (optional) */}
                <div>
                  <label className="block text-[0.72rem] font-semibold text-white/50 mb-1.5 tracking-wider uppercase">Prayer Request <span className="text-white/30 normal-case">(optional)</span></label>
                  <textarea
                    placeholder="Share a prayer request with us…"
                    value={prayerRequest}
                    onChange={e=>setPrayer(e.target.value)}
                    rows={3}
                    aria-label="Prayer request (optional)"
                    className={inputCls + ' resize-none'}
                  />
                </div>

                {/* Message (optional) */}
                <div>
                  <label className="block text-[0.72rem] font-semibold text-white/50 mb-1.5 tracking-wider uppercase">Message <span className="text-white/30 normal-case">(optional)</span></label>
                  <textarea
                    placeholder="A note for the team…"
                    value={message}
                    onChange={e=>setMessage(e.target.value)}
                    rows={3}
                    aria-label="Message (optional)"
                    className={inputCls + ' resize-none'}
                  />
                </div>

                <button type="submit" className="w-full py-4 ih-btn-gold text-[0.9rem]">
                  <span className="inline-flex items-center gap-2 justify-center">
                    <Heart size={16} aria-hidden="true" />
                    {amount ? `Pledge $${amount}` : 'Pledge a Donation'}
                  </span>
                </button>
                <p className="text-white/35 text-xs text-center">
                  Prefer to give another way? Select &ldquo;Pledge&rdquo; and we&apos;ll email you bank transfer and M-Pesa details.
                </p>
                {formError && <p className="text-red-400 text-xs text-center">{formError}</p>}
              </form>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-14 ih-section" aria-label="Trust signals">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-5">
            {trustSignals.map((item, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <div className="flex items-start gap-3 p-5 rounded-2xl ih-card-solid">
                  <div className="w-9 h-9 rounded-full bg-gold-400/15 flex items-center justify-center shrink-0">
                    <item.icon size={16} className="text-gold-300" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold mb-0.5">{item.title}</p>
                    <p className="text-white/45 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Closing scripture */}
      <section className="py-14 ih-section text-center" aria-label="Closing scripture">
        <div className="max-w-xl mx-auto px-4">
          <ScrollReveal>
            <div className="gold-divider mx-auto mb-7" aria-hidden="true" />
            <p className="font-cormorant text-3xl text-white italic leading-relaxed">
              &ldquo;Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.&rdquo;
            </p>
            <p className="text-gold-400 text-[0.72rem] font-semibold mt-3 tracking-[0.18em] uppercase">2 Corinthians 9:7</p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
