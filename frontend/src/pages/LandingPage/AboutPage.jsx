import { useNavigate } from 'react-router-dom';
import { PublicNav } from './ServicesPage';
import {
  Shield, Zap, Globe, Handshake, Crosshair, Brain, Leaf,
  Lightbulb, Award, Users, ArrowRight
} from 'lucide-react';
import './PublicLayout.css';
import about1 from '../../assets/about1.jpg';
import about2 from '../../assets/about2.jpg';
import about3 from '../../assets/about3.jpg';
import about4 from '../../assets/about4.jpg';

/* ─── Design tokens ───────────────────────────────────────────── */
const NAVY  = '#1a2b4b';
const TEAL  = '#0D7C66';
const LIGHT = '#F9FAFB';

const s = {
  section:    { padding: '88px 24px' },
  container:  { maxWidth: 1140, margin: '0 auto' },
  heading:    { fontSize: 'clamp(1.7rem,3vw,2.3rem)', fontWeight: 800, color: NAVY, margin: '0 0 16px' },
  sub:        { fontSize: '1rem', lineHeight: 1.75, color: '#4B5563', maxWidth: 720, margin: '0 auto 40px', textAlign: 'center' },
  cardGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 },
  card:       { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 18, padding: '28px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 260, transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default' },
  iconBox:    { width: 50, height: 50, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, flexShrink: 0 },
  cardTitle:  { fontWeight: 700, fontSize: '1rem', color: NAVY, marginBottom: 8 },
  cardDesc:   { fontSize: '0.82rem', lineHeight: 1.6, color: '#6B7280', margin: 0 },
  btnPrimary: { background: NAVY, color: '#fff', border: 'none', padding: '13px 30px', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.2s' },
  btnOutline: { background: 'transparent', color: NAVY, border: `2px solid ${NAVY}`, padding: '13px 30px', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' },
};

const whyData = [
  { icon: Shield,    color: '#4F46E5', bg: '#EEF2FF', title: 'Security First',        desc: 'Bank-grade encryption, granular role-based access control, and immutable audit trails protect every action within your system.' },
  { icon: Zap,       color: '#F59E0B', bg: '#FFFBEB', title: 'Speed & Reliability',   desc: 'Sub-100 ms API responses backed by a resilient MySQL and Node.js infrastructure, engineered for peak load at any scale.' },
  { icon: Globe,     color: '#0EA5E9', bg: '#F0F9FF', title: 'Local Expertise',       desc: 'Built specifically for Ethiopian tax regulations, ETB currency, and the realities of a fast-growing African economy.' },
  { icon: Handshake, color: '#10B981', bg: '#F0FDF4', title: 'Long-Term Partnership', desc: 'We are not just a vendor — every subscription includes dedicated onboarding, training, and a direct line to our product team.' },
];

const dnaData = [
  { icon: Crosshair, color: '#EF4444', bg: '#FEF2F2', title: 'Customer Obsession',   desc: 'Every feature starts with a real problem faced by a real Ethiopian business.' },
  { icon: Brain,     color: '#8B5CF6', bg: '#F5F3FF', title: 'Continuous Learning',  desc: 'Global best practices, applied with deep local insight and cultural understanding.' },
  { icon: Leaf,      color: '#059669', bg: '#F0FDF4', title: 'Sustainable Growth',   desc: 'No shortcuts, no technical debt — every line of code is built to serve you for years.' },
  { icon: Lightbulb, color: '#F59E0B', bg: '#FFFBEB', title: 'Bold Innovation',      desc: 'From AI forecasting to pan-African expansion, we dream big and execute carefully.' },
  { icon: Award,     color: '#EC4899', bg: '#FDF2F8', title: 'Excellence in Craft',  desc: 'From pixel-perfect UI to rock-solid infrastructure, we take pride in every detail.' },
  { icon: Users,     color: '#3B82F6', bg: '#EFF6FF', title: 'Community Impact',     desc: 'Empowering businesses to grow — contributing to jobs, prosperity, and progress.' },
];

const timelineData = [
  { year: '2020', title: 'Foundation',                desc: 'SUTANA was born to give Ethiopian businesses the unified platform the market desperately needed — one that understood the local context from day one.' },
  { year: '2022', title: 'Core Modules Launched',     desc: 'Finance, Sales, Inventory, and Printing modules go live. Early adopters cut month-end close times by 70% and eliminated stock discrepancies overnight.' },
  { year: '2026', title: 'Multi-Department Intelligence', desc: 'Cross-department analytics, CEO dashboards, procurement lifecycle management, and a customer portal roll out enterprise-wide.' },
  { year: '2027 →', title: 'AI-Powered Insights',    desc: 'ML forecasting, automated procurement suggestions, smart inventory optimization, and predictive financial alerts on the roadmap.' },
  { year: '2028 →', title: 'Pan-African Expansion',  desc: 'Multi-currency, multi-language support for East African markets with an open API ecosystem for third-party integrations.' },
];

const leaders = [
  { img: about1, name: 'Daniel Bekele', role: 'Chief Technology Officer',    quote: 'Every line of code is a commitment to the businesses that trust us.' },
  { img: about2, name: 'Amir Haile',    role: 'Chief Executive Officer',     quote: 'We believe great software should be locally understood and built to last.' },
  { img: about3, name: 'Sara Alemu',    role: 'Chief Operating Officer',     quote: "Operational excellence is the engine that powers every client's growth." },
  { img: about4, name: 'Meron Tadesse', role: 'Head of Product Design',      quote: 'Design is not decoration — it is the language our clients use daily.' },
];



/* ─── Main Page ───────────────────────────────────────────────── */
function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="public-page">
      <PublicNav />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px 60px', textAlign: 'center', background: `linear-gradient(160deg, #F0FDF4 0%, #EEF2FF 100%)` }}>
        <div style={s.container}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', color: NAVY, padding: '6px 18px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 700, marginBottom: 22, border: `1px solid #E5E7EB` }}>
            <Shield size={14} color={TEAL} /> About SUTANA
          </div>
          <h1 style={{ fontSize: 'clamp(2rem,4.5vw,3rem)', fontWeight: 900, color: NAVY, maxWidth: 720, margin: '0 auto 20px', lineHeight: 1.2 }}>
            Building the Future of&nbsp;
            <span style={{ color: TEAL }}>Ethiopian Enterprise</span>
          </h1>
          <p style={{ ...s.sub, maxWidth: 680, margin: '0 auto 36px' }}>
            We are on a mission to give every growing Ethiopian business the technology tools previously
            available only to large corporations — locally understood, and built to last.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={s.btnPrimary} onClick={() => navigate('/chat')}
              onMouseEnter={e => e.currentTarget.style.background = TEAL}
              onMouseLeave={e => e.currentTarget.style.background = NAVY}>
              Talk to Our Team <ArrowRight size={16} />
            </button>
            <button style={s.btnOutline} onClick={() => navigate('/services')}
              onMouseEnter={e => { e.currentTarget.style.background = NAVY; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = NAVY; }}>
              Explore Services
            </button>
          </div>

          {/* Photo strip */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 0, marginTop: 52, position: 'relative' }}>
            {[about1, about2, about3, about4].map((img, i) => (
              <div key={i} style={{
                width: 68, height: 68, borderRadius: '50%',
                border: '3px solid #fff',
                overflow: 'hidden',
                marginLeft: i === 0 ? 0 : -18,
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                zIndex: 5 - i,
                flexShrink: 0,
              }}>
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
              </div>
            ))}
            <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600, color: NAVY }}>
              Meet our 4-person founding team →
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission ─────────────────────────────────────────────── */}
      <section style={{ ...s.section, background: '#fff' }}>
        <div style={{ ...s.container, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-block', background: '#F0FDF4', color: TEAL, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', padding: '4px 12px', borderRadius: 99, marginBottom: 16 }}>OUR MISSION</div>
            <h2 style={s.heading}>Simplifying Operations,&nbsp;<span style={{ color: TEAL }}>Empowering Growth</span></h2>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.8, color: '#4B5563', marginBottom: 18 }}>
              SUTANA was built from the ground up for the realities of Ethiopian business: manual record-keeping,
              fragmented tools, and the challenge of scaling without the right infrastructure.
            </p>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.8, color: '#4B5563', marginBottom: 18 }}>
              Our platform unifies printing production, financial accounting, sales, procurement, and inventory
              into a single intuitive system — reducing manual errors by over 80% and giving leadership real-time
              visibility into every corner of their business.
            </p>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.8, color: '#4B5563', marginBottom: 28 }}>
              We measure our success by the success of our clients. When a CEO says he finally feels in control
              of his business — that is exactly why we built SUTANA.
            </p>
            <button style={s.btnPrimary} onClick={() => navigate('/chat')}
              onMouseEnter={e => e.currentTarget.style.background = TEAL}
              onMouseLeave={e => e.currentTarget.style.background = NAVY}>
              Get in Touch <ArrowRight size={16} />
            </button>
          </div>
          {/* Stats column */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { value: '80%', label: 'Error Reduction' },
              { value: '70%', label: 'Faster Month-End Close' },
              { value: '6+', label: 'Business Departments' },
              { value: '2020', label: 'Founded' },
            ].map((st, i) => (
              <div key={i} style={{ background: i % 2 === 0 ? NAVY : TEAL, borderRadius: 18, padding: '28px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{st.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.78)', marginTop: 6, fontWeight: 500 }}>{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Meet Our Leaders ─────────────────────────────────────── */}
      <section style={{ ...s.section, background: LIGHT }}>
        <div style={s.container}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-block', background: '#EEF2FF', color: '#4F46E5', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', padding: '4px 12px', borderRadius: 99, marginBottom: 16 }}>
              OUR TEAM
            </div>
            <h2 style={{ ...s.heading, textAlign: 'center', margin: '0 0 16px' }}>
              Meet the <span style={{ color: TEAL }}>Leaders</span> Behind SUTANA
            </h2>
            <p style={{ ...s.sub, margin: '0 auto' }}>
              A passionate founding team with expertise spanning enterprise software, finance, design, and
              operations — united by one mission: to transform how Ethiopian businesses work.
            </p>
          </div>

          {/* 4 leaders flex 25% each */}
          <div className="about-leaders">
            {leaders.map((leader, i) => (
              <div key={i} className="about-leader-item">
                <div className="about-leader-img-wrap">
                  <img src={leader.img} alt={leader.name} />
                  <div className="about-leader-overlay">
                    <p className="about-leader-quote">&ldquo;{leader.quote}&rdquo;</p>
                  </div>
                </div>
                <div className="about-leader-info">
                  <div className="about-leader-name">{leader.name}</div>
                  <div className="about-leader-role">{leader.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why SUTANA ──────────────────────────────────────────── */}
      <section style={{ ...s.section, background: '#fff' }}>
        <div style={s.container}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ ...s.heading, textAlign: 'center' }}>Why <span style={{ color: TEAL }}>SUTANA</span></h2>
            <p style={s.sub}>Four reasons Ethiopian enterprises trust us with their operations.</p>
          </div>
          <div style={s.cardGrid}>
            {whyData.map((w, i) => {
              const Icon = w.icon;
              return (
                <div key={i} className="rotate-card" style={{ borderRadius: 18, '--grad1': w.color, '--grad2': '#0D7C66' }}
                  onMouseEnter={e => { const inner = e.currentTarget.querySelector('.rotate-card-inner'); if (inner) { inner.style.transform = 'translateY(-4px)'; inner.style.boxShadow = '0 16px 48px rgba(0,0,0,0.1)'; } }}
                  onMouseLeave={e => { const inner = e.currentTarget.querySelector('.rotate-card-inner'); if (inner) { inner.style.transform = 'translateY(0)'; inner.style.boxShadow = 'none'; } }}>
                  <div className="rotate-card-inner" style={{ padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: 260, transition: 'transform 0.3s, box-shadow 0.3s' }}>
                    <div style={{ ...s.iconBox, background: w.bg, color: w.color }}><Icon size={22} /></div>
                    <div style={s.cardTitle}>{w.title}</div>
                    <p style={s.cardDesc}>{w.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Roadmap ─────────────────────────────────────────────── */}
      <section style={{ ...s.section, background: LIGHT }}>
        <div style={{ ...s.container, maxWidth: 820 }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ ...s.heading, textAlign: 'center' }}>Where We Are <span style={{ color: TEAL }}>Headed</span></h2>
            <p style={s.sub}>From our founding vision to a pan-African enterprise platform — milestone by milestone.</p>
          </div>
          <div>
            {timelineData.map((t, i) => (
              <div key={i} style={{ position: 'relative', paddingLeft: 52, paddingBottom: i === timelineData.length - 1 ? 0 : 40 }}>
                {i < timelineData.length - 1 && (
                  <div style={{ position: 'absolute', left: 20, top: 28, bottom: 0, width: 2, background: '#E5E7EB' }} />
                )}
                <div style={{ position: 'absolute', left: 12, top: 4, width: 18, height: 18, borderRadius: '50%', background: i < 3 ? NAVY : '#E5E7EB', border: `3px solid ${i < 3 ? TEAL : '#D1D5DB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {i < 3 && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: TEAL, marginBottom: 3, letterSpacing: '0.04em' }}>{t.year}</div>
                <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: NAVY, margin: '0 0 6px' }}>{t.title}</h3>
                <p style={{ fontSize: '0.88rem', lineHeight: 1.75, color: '#6B7280', margin: 0 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our DNA ─────────────────────────────────────────────── */}
      <section style={{ ...s.section, background: '#fff' }}>
        <div style={s.container}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ ...s.heading, textAlign: 'center' }}>Our <span style={{ color: TEAL }}>DNA</span></h2>
            <p style={s.sub}>The principles that guide everything we do.</p>
          </div>
          <div style={{ ...s.cardGrid, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
            {dnaData.map((d, i) => {
              const Icon = d.icon;
              return (
                <div key={i} className="rotate-card" style={{ borderRadius: 18, '--grad1': d.color, '--grad2': '#0D7C66' }}
                  onMouseEnter={e => { const inner = e.currentTarget.querySelector('.rotate-card-inner'); if (inner) { inner.style.transform = 'translateY(-4px)'; inner.style.boxShadow = '0 16px 48px rgba(0,0,0,0.1)'; } }}
                  onMouseLeave={e => { const inner = e.currentTarget.querySelector('.rotate-card-inner'); if (inner) { inner.style.transform = 'translateY(0)'; inner.style.boxShadow = 'none'; } }}>
                  <div className="rotate-card-inner" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: 220, transition: 'transform 0.3s, box-shadow 0.3s' }}>
                    <div style={{ ...s.iconBox, width: 44, height: 44, borderRadius: 12, background: d.bg, color: d.color, marginBottom: 12 }}><Icon size={20} /></div>
                    <div style={{ ...s.cardTitle, fontSize: '0.9rem' }}>{d.title}</div>
                    <p style={{ ...s.cardDesc, fontSize: '0.78rem' }}>{d.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${TEAL} 100%)`, padding: '88px 24px', textAlign: 'center' }}>
        <div style={s.container}>
          <h2 style={{ fontSize: 'clamp(1.7rem,3vw,2.3rem)', fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>
            Join Us on This Journey
          </h2>
          <p style={{ fontSize: '1rem', lineHeight: 1.75, color: 'rgba(255,255,255,0.85)', maxWidth: 640, margin: '0 auto 36px' }}>
            Whether you are a small business taking your first step towards digitization, or a mid-size enterprise
            ready to unify your operations — SUTANA is built for you.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={{ ...s.btnPrimary, background: '#fff', color: NAVY }} onClick={() => navigate('/login')}
              onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
              Get Started <ArrowRight size={16} />
            </button>
            <button style={{ ...s.btnOutline, borderColor: '#fff', color: '#fff' }} onClick={() => navigate('/chat')}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              Talk to Our Team
            </button>
          </div>
        </div>
      </section>


    </div>
  );
}

export default AboutPage;
