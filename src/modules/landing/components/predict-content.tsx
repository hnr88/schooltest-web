/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from 'react';

import '../landing.css';

export function LandingPredictContent({ aeo, footer }: { aeo?: ReactNode; footer?: ReactNode }) {
  return (
    <div className="st-landing">



<a href="#main" style={{ position: 'absolute', left: '-9999px', top: '0', background: '#0E2350', color: '#FFFFFF', padding: '12px 18px', zIndex: '100' }} data-predict-f="0">Skip to main content</a>

<div data-screen-label="Notice" style={{ background: '#0A1A3C', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '11px 32px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#2563EB', color: '#FFFFFF', fontSize: '11px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', padding: '5px 11px', borderRadius: '6px' }}>Notice</span>
    <span style={{ fontSize: '13.5px', color: '#C7D6F2' }}>Pilot testing in term 4, 2026. Become a founding school and contribute to the design and development of SchoolTest.</span>
  </div>
</div>

<header data-screen-label="Masthead" style={{ background: '#FFFFFF', borderBottom: '1px solid #E3E8F0', position: 'sticky', top: '0', zIndex: '50' }}>
  <div className="st-masthead-row" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'nowrap' }}>
    <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', padding: '18px 0', flex: '0 0 auto' }}>
      <img src="/images/landing/logo.png" alt="SchoolTest" style={{ height: '30px', width: 'auto' }} />
    </a>
    <nav aria-label="Primary" className="st-masthead-nav" style={{ display: 'flex', alignItems: 'stretch', gap: '2px', flex: '1 1 auto', minWidth: '0', overflowX: 'auto' }}>
      <a href="/#programme" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-predict-h="0">Overview</a>
      <a href="/diagnose" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-predict-h="1">Diagnose</a>
      <a href="/teach" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-predict-h="2">Teach</a>
      <a href="/track" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-predict-h="3">Track</a>
      <a href="/predict" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#0E2350', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid #2563EB', textDecoration: 'none' }}>Predict</a>
      <a href="/report" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-predict-h="4">Report</a>
    </nav>
    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px', flex: '0 0 auto' }}>
      <a href="/sign-in" style={{ fontSize: '14px', fontWeight: '600', color: '#16326E', textDecoration: 'none' }} data-predict-h="5">Sign in</a>
      <a href="/#register" style={{ background: '#2563EB', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', padding: '11px 20px', borderRadius: '10px', textDecoration: 'none' }} data-predict-h="6">Join the pilot</a>
    </div>
  </div>
</header>

<main id="main">

<section data-screen-label="Hero" style={{ background: '#F7F9FC', borderBottom: '1px solid #E3E8F0' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px 60px' }}>
    <div>
      <span style={{ display: 'inline-block', fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488' }}>04 · Predict mainstream readiness</span>
      <h1 style={{ margin: '16px 0 0', fontSize: '46px', lineHeight: '1.07', fontWeight: '700', letterSpacing: '-0.03em', color: '#0E2350', textWrap: 'balance', maxWidth: '16ch' }}>Know when a student is ready, and prove it.</h1>
      <div style={{ width: '56px', height: '3px', background: '#0D9488', marginTop: '20px', borderRadius: '2px' }}></div>
      <p data-speakable="summary" style={{ margin: '22px 0 0', fontSize: '18px', lineHeight: '1.6', color: '#475569', textWrap: 'pretty', maxWidth: '52ch' }}>One readiness indicator, aggregated from every subskill across all four domains. The exit call stays yours - the evidence behind it stops being a hunch.</p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '30px' }}>
        <a href="/#register" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: '#2563EB', color: '#FFFFFF', fontSize: '15px', fontWeight: '600', padding: '15px 26px', borderRadius: '12px', textDecoration: 'none' }} data-predict-h="7">Join the pilot<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
      </div>
    </div>
  </div>
  <img src="/images/landing/photo-a.webp" alt="Students walking between classes on a school campus" style={{ display: 'block', width: '100%', height: '340px', objectFit: 'cover' }} />
</section>

<section data-screen-label="The individual" style={{ background: '#FFFFFF' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,400px),1fr))', gap: '56px', alignItems: 'center' }}>
    <div>
      <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488' }}>The individual</span>
      <h2 style={{ margin: '14px 0 0', fontSize: '32px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', textWrap: 'balance', maxWidth: '20ch' }}>Data-informed exit decisions</h2>
      <div style={{ width: '56px', height: '3px', background: '#0D9488', marginTop: '18px', borderRadius: '2px' }}></div>
      <p style={{ margin: '22px 0 0', fontSize: '16.5px', lineHeight: '1.7', color: '#475569', textWrap: 'pretty', maxWidth: '56ch' }}>See how close a student actually is, and what is still standing in the way - not a gut feel formed across a busy term.</p>
      <p style={{ margin: '22px 0 0', background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: '14px', padding: '16px 18px', fontSize: '15px', lineHeight: '1.6', color: '#0E2350' }}><strong style={{ fontWeight: '700' }}>What this means for you:</strong> tell a parent, a principal and a student exactly when they are ready for mainstream classes, and why.</p>
    </div>
    <div style={{ border: '1px solid #E3E8F0', borderRadius: '16px', overflow: 'hidden', background: '#FFFFFF' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 24px', borderBottom: '1px solid #E3E8F0', background: '#F7F9FC' }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#0E2350' }}>Mainstream readiness · one student</span>
        <span style={{ marginLeft: 'auto', fontSize: '12.5px', color: '#94A3B8' }}>Year 9</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,150px),1fr))', gap: '1px', background: '#E3E8F0' }}>
        <div style={{ background: '#FFFFFF', padding: '26px 24px' }}><div style={{ fontSize: '12.5px', fontWeight: '600', color: '#94A3B8' }}>Term 1</div><div style={{ fontSize: '38px', fontWeight: '700', letterSpacing: '-0.03em', color: '#94A3B8', marginTop: '4px' }}>34%</div></div>
        <div style={{ background: '#FFFFFF', padding: '26px 24px' }}><div style={{ fontSize: '12.5px', fontWeight: '600', color: '#2563EB' }}>Term 3</div><div style={{ fontSize: '38px', fontWeight: '700', letterSpacing: '-0.03em', color: '#0E2350', marginTop: '4px' }}>81%</div></div>
      </div>
      <div style={{ padding: '20px 24px', borderTop: '1px solid #E3E8F0' }}>
        <div style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#94A3B8' }}>Still holding her back</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#16326E', background: '#EFF5FF', border: '1px solid #DBEAFE', padding: '7px 13px', borderRadius: '8px' }}>Vocabulary</span>
          <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#16326E', background: '#EFF5FF', border: '1px solid #DBEAFE', padding: '7px 13px', borderRadius: '8px' }}>Syntax</span>
          <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#16326E', background: '#EFF5FF', border: '1px solid #DBEAFE', padding: '7px 13px', borderRadius: '8px' }}>Inference</span>
        </div>
      </div>
    </div>
  </div>
</section>

<section data-screen-label="Cohort chart" style={{ background: '#F7F9FC', borderTop: '1px solid #E3E8F0', borderBottom: '1px solid #E3E8F0' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: '56px', alignItems: 'center' }}>
    <div>
      <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488' }}>The cohort</span>
      <h2 style={{ margin: '14px 0 0', fontSize: '32px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', textWrap: 'balance', maxWidth: '18ch' }}>Plan the program</h2>
      <p style={{ margin: '20px 0 0', fontSize: '16.5px', lineHeight: '1.7', color: '#475569', textWrap: 'pretty', maxWidth: '52ch' }}>See the whole cohort’s readiness in one view and forecast next term’s exits and intakes before you set the timetable.</p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '22px' }}>
        <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0E2350', background: '#FFFFFF', border: '1px solid #E3E8F0', padding: '8px 14px', borderRadius: '8px' }}>Cohort readiness · 22 students</span>
        <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0D9488', background: '#F0FDFA', border: '1px solid #CCFBF1', padding: '8px 14px', borderRadius: '8px' }}>4 projected to exit next term</span>
      </div>
      <p style={{ margin: '22px 0 0', background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: '14px', padding: '16px 18px', fontSize: '15px', lineHeight: '1.6', color: '#0E2350' }}><strong style={{ fontWeight: '700' }}>What this means for you:</strong> answer “how many are leaving us next term” with a number instead of an estimate.</p>
    </div>
    <figure style={{ margin: '0', border: '1px solid #E3E8F0', borderRadius: '16px', overflow: 'hidden', background: '#FFFFFF' }}>
      <figcaption style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', padding: '18px 24px', borderBottom: '1px solid #E3E8F0', background: '#F7F9FC' }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#0E2350' }}>Figure 1 - Cohort readiness distribution</span>
        <span style={{ fontSize: '12.5px', color: '#94A3B8' }}>Year 9 · 22 students</span>
      </figcaption>
      <div style={{ padding: '22px 24px 8px' }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', padding: '0 0 16px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: '600', color: '#475569' }}><span style={{ width: '11px', height: '11px', borderRadius: '3px', background: '#BFDBFE' }}></span>Term 1</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: '600', color: '#475569' }}><span style={{ width: '11px', height: '11px', borderRadius: '3px', background: '#0E2350' }}></span>Term 3</span>
        </div>
        <svg viewBox="0 0 760 350" role="img" aria-label="Grouped column chart showing how many students in a cohort of 22 sit in each mainstream readiness band at Term 1 and Term 3" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <g stroke="#EEF2F7" strokeWidth="1">
            <line x1="150" y1="20" x2="740" y2="20" />
            <line x1="150" y1="76" x2="740" y2="76" />
            <line x1="150" y1="132" x2="740" y2="132" />
            <line x1="150" y1="188" x2="740" y2="188" />
            <line x1="150" y1="244" x2="740" y2="244" />
            <line x1="150" y1="300" x2="740" y2="300" />
          </g>
          <g fill="#94A3B8" fontSize="12" fontFamily="Google Sans, sans-serif" textAnchor="end">
            <text x="138" y="24">10 students</text>
            <text x="138" y="80">8</text>
            <text x="138" y="136">6</text>
            <text x="138" y="192">4</text>
            <text x="138" y="248">2</text>
            <text x="138" y="304">0</text>
          </g>
          <line x1="150" y1="300" x2="740" y2="300" stroke="#CBD5E1" strokeWidth="1.5" />
          <g>
            <rect x="186" y="48" width="34" height="252" rx="3" fill="#BFDBFE" />
            <rect x="227" y="216" width="34" height="84" rx="3" fill="#0E2350" />
            <rect x="334" y="132" width="34" height="168" rx="3" fill="#BFDBFE" />
            <rect x="375" y="160" width="34" height="140" rx="3" fill="#0E2350" />
            <rect x="481" y="160" width="34" height="140" rx="3" fill="#BFDBFE" />
            <rect x="522" y="76" width="34" height="224" rx="3" fill="#0E2350" />
            <rect x="629" y="244" width="34" height="56" rx="3" fill="#BFDBFE" />
            <rect x="670" y="132" width="34" height="168" rx="3" fill="#0E2350" />
          </g>
          <g fill="#64748B" fontSize="11.5" fontWeight="600" fontFamily="Google Sans, sans-serif" textAnchor="middle">
            <text x="203" y="40">9</text>
            <text x="244" y="208" fill="#0E2350">3</text>
            <text x="351" y="124">6</text>
            <text x="392" y="152" fill="#0E2350">5</text>
            <text x="498" y="152">5</text>
            <text x="539" y="68" fill="#0E2350">8</text>
            <text x="646" y="236">2</text>
            <text x="687" y="124" fill="#0E2350">6</text>
          </g>
          <g fill="#0E2350" fontSize="13" fontWeight="600" fontFamily="Google Sans, sans-serif" textAnchor="middle">
            <text x="224" y="325">Under 40%</text>
            <text x="371" y="325">40–59%</text>
            <text x="519" y="325">60–79%</text>
            <text x="666" y="325">80% +</text>
          </g>
        </svg>
      </div>
    </figure>
  </div>
</section>

<section data-screen-label="Cohort photo" style={{ background: '#FFFFFF' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,400px),1fr))', gap: '56px', alignItems: 'center' }}>
    <figure style={{ margin: '0', alignSelf: 'stretch', display: 'flex', flexDirection: 'column' }}>
      <img src="/images/landing/class-assessment.png" alt="A teacher supervising secondary students sitting an assessment on laptops" style={{ display: 'block', width: '100%', flex: '1', minHeight: '360px', objectFit: 'cover', borderRadius: '14px' }} />
    </figure>
    <div>
      <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488' }}>Defensible decisions</span>
      <h2 style={{ margin: '14px 0 0', fontSize: '32px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', textWrap: 'balance', maxWidth: '20ch' }}>The call stays yours. The evidence is on the page.</h2>
      <div style={{ width: '56px', height: '3px', background: '#0D9488', marginTop: '18px', borderRadius: '2px' }}></div>
      <p style={{ margin: '22px 0 0', fontSize: '16.5px', lineHeight: '1.7', color: '#475569', textWrap: 'pretty', maxWidth: '56ch' }}>A readiness score is the evidence you take into a panel, a parent or staff meeting, with the scores and subskills to back it up.</p>
      <p style={{ margin: '22px 0 0', background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: '14px', padding: '16px 18px', fontSize: '15px', lineHeight: '1.6', color: '#0E2350' }}><strong style={{ fontWeight: '700' }}>What this means for you:</strong> a decision you can defend in the room, with the working shown.</p>
    </div>
    </div>
  
</section>

<section data-screen-label="Quote band" style={{ background: '#FFFFFF' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 32px 0' }}>
    <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', minHeight: '300px', display: 'flex', alignItems: 'flex-end' }}>
      <img src="/images/landing/photo-c.webp" alt="" style={{ position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(180deg,rgba(10,26,60,.22) 0%,rgba(10,26,60,.88) 100%)' }}></div>
      <blockquote style={{ position: 'relative', margin: '0', padding: '44px', maxWidth: '52ch' }}>
        <p style={{ margin: '0', fontSize: '27px', lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.02em', color: '#FFFFFF', textWrap: 'balance' }}>Teacher intuition plus SchoolTest empiricism. That is the difference.</p>
        <footer style={{ marginTop: '12px', fontSize: '14px', color: '#C7D6F2' }}>Readiness aggregated from 27 subskills</footer>
      </blockquote>
    </div>
  </div>
</section>

<section data-screen-label="Spacer" style={{ background: '#FFFFFF', height: '64px' }}></section>

<section data-screen-label="Next" style={{ background: '#F7F9FC', borderTop: '1px solid #E3E8F0', borderBottom: '1px solid #E3E8F0' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 32px' }}>
    <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488' }}>After the prediction</span>
    <h2 style={{ margin: '14px 0 0', fontSize: '30px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', maxWidth: '24ch' }}>One thing left to do.</h2>
    <ol style={{ listStyle: 'none', margin: '32px 0 0', padding: '0', background: '#FFFFFF', border: '1px solid #E3E8F0', borderRadius: '16px', overflow: 'hidden' }}>
      <li style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr) auto', gap: '28px', alignItems: 'center', padding: '26px 32px' }}>
        <span style={{ display: 'grid', placeItems: 'center', width: '56px', height: '56px', borderRadius: '14px', background: '#EFF5FF', color: '#2563EB', fontSize: '19px', fontWeight: '700' }}>05</span>
        <div>
          <div style={{ fontSize: '19px', fontWeight: '700', letterSpacing: '-0.015em', color: '#0E2350' }}>Report to everyone who needs it</div>
          <p style={{ margin: '7px 0 0', fontSize: '15.5px', lineHeight: '1.65', color: '#64748B', maxWidth: '70ch' }}>A tailored report for students, families, teachers and leaders.</p>
        </div>
        <a href="/report" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1D4ED8', whiteSpace: 'nowrap', textDecoration: 'none' }} data-predict-h="8">Report<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
      </li>
    </ol>
  </div>
</section>

<section data-screen-label="Register" style={{ background: '#0E2350' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '56px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: '40px', alignItems: 'center' }}>
    <div>
      <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#5EEAD4' }}>Founding schools</span>
      <h2 style={{ margin: '14px 0 0', fontSize: '30px', lineHeight: '1.18', fontWeight: '700', letterSpacing: '-0.022em', color: '#FFFFFF', textWrap: 'balance', maxWidth: '22ch' }}>We’re building this with founding schools.</h2>
      <p style={{ margin: '16px 0 0', fontSize: '15.5px', lineHeight: '1.7', color: '#A9BADC', maxWidth: '52ch' }}>Pilot testing in Term 4, 2026. Get early access, direct input into the report design, and founding terms at launch.</p>
    </div>
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      <a href="/#register" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: '#2563EB', color: '#FFFFFF', fontSize: '15px', fontWeight: '600', padding: '15px 26px', borderRadius: '12px', textDecoration: 'none' }} data-predict-h="9">Join the pilot<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
      <a href="/#evidence" style={{ display: 'inline-flex', alignItems: 'center', background: 'transparent', color: '#FFFFFF', border: '1.5px solid rgba(255,255,255,.5)', fontSize: '15px', fontWeight: '600', padding: '14px 24px', borderRadius: '12px', textDecoration: 'none' }} data-predict-h="10">Evidence base</a>
    </div>
  </div>
</section>

{aeo}
</main>

{footer}


    </div>
  );
}
