/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from 'react';

import '../landing.css';

export function LandingTrackContent({ aeo }: { aeo?: ReactNode }) {
  return (
    <div className="st-landing">


<a href="#main" style={{ position: 'absolute', left: '-9999px', top: '0', background: '#0E2350', color: '#FFFFFF', padding: '12px 18px', zIndex: '100' }} data-track-f="0">Skip to main content</a>

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
      <a href="/#programme" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-track-h="0">Overview</a>
      <a href="/diagnose" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-track-h="1">Diagnose</a>
      <a href="/teach" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-track-h="2">Teach</a>
      <a href="/track" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#0E2350', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid #2563EB', textDecoration: 'none' }}>Track</a>
      <a href="/predict" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-track-h="3">Predict</a>
      <a href="/report" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-track-h="4">Report</a>
    </nav>
    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px', flex: '0 0 auto' }}>
      <a href="/sign-in" style={{ fontSize: '14px', fontWeight: '600', color: '#16326E', textDecoration: 'none' }} data-track-h="5">Sign in</a>
      <a href="/#register" style={{ background: '#2563EB', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', padding: '11px 20px', borderRadius: '10px', textDecoration: 'none' }} data-track-h="6">Join the pilot</a>
    </div>
  </div>
</header>

<main id="main">

<section data-screen-label="Hero" style={{ position: 'relative', background: '#0A1A3C' }}>
  <img src="/images/landing/photo-c.webp" alt="" style={{ position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover', opacity: '.55' }} />
  <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(96deg,rgba(10,26,60,.96) 0%,rgba(10,26,60,.86) 46%,rgba(10,26,60,.35) 100%)' }}></div>
  <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', padding: '80px 32px 88px', minHeight: '440px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <div style={{ maxWidth: '660px' }}>
      <span style={{ display: 'inline-block', fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#5EEAD4' }}>03 · Track progress over time</span>
      <h1 style={{ margin: '16px 0 0', fontSize: '46px', lineHeight: '1.07', fontWeight: '700', letterSpacing: '-0.03em', color: '#FFFFFF', textWrap: 'balance' }}>Watch every subskill move every time you test.</h1>
      <p data-speakable="summary" style={{ margin: '20px 0 0', fontSize: '18px', lineHeight: '1.6', color: '#C7D6F2', textWrap: 'pretty', maxWidth: '56ch' }}>Retest at any point - 40 minutes each. Growth is visible skill by skill, subskill by subskill.</p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '30px' }}>
        <a href="/#register" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: '#2563EB', color: '#FFFFFF', fontSize: '15px', fontWeight: '600', padding: '15px 26px', borderRadius: '12px', textDecoration: 'none' }} data-track-h="7">Join the pilot<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
      </div>
    </div>
  </div>
  <div style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,.14)', background: 'rgba(10,26,60,.55)' }}>
    <dl style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(50%,180px),1fr))' }}>
      <div style={{ padding: '20px 24px 20px 0' }}><dt style={{ fontSize: '11.5px', fontWeight: '600', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>Retest cycle</dt><dd style={{ margin: '6px 0 0', fontSize: '22px', fontWeight: '700', color: '#FFFFFF' }}>As often as needed</dd></div>
      <div style={{ padding: '20px 24px', borderLeft: '1px solid rgba(255,255,255,.14)' }}><dt style={{ fontSize: '11.5px', fontWeight: '600', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>Scale</dt><dd style={{ margin: '6px 0 0', fontSize: '22px', fontWeight: '700', color: '#FFFFFF' }}>ACARA phases</dd></div>
      <div style={{ padding: '20px 24px', borderLeft: '1px solid rgba(255,255,255,.14)' }}><dt style={{ fontSize: '11.5px', fontWeight: '600', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>Comparable sittings</dt><dd style={{ margin: '6px 0 0', fontSize: '22px', fontWeight: '700', color: '#FFFFFF' }}>Every one</dd></div>
      <div style={{ padding: '20px 0 20px 24px', borderLeft: '1px solid rgba(255,255,255,.14)' }}><dt style={{ fontSize: '11.5px', fontWeight: '600', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>Single-skill retest</dt><dd style={{ margin: '6px 0 0', fontSize: '22px', fontWeight: '700', color: '#FFFFFF' }}>40 minutes</dd></div>
    </dl>
  </div>
</section>

<section data-screen-label="Evidence trail" style={{ background: '#FFFFFF' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,400px),1fr))', gap: '56px', alignItems: 'center' }}>
    <div>
      <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488' }}>Individual students</span>
      <h2 style={{ margin: '14px 0 0', fontSize: '32px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', textWrap: 'balance', maxWidth: '20ch' }}>Every student&apos;s own progress line.</h2>
      <div style={{ width: '56px', height: '3px', background: '#0D9488', marginTop: '18px', borderRadius: '2px' }}></div>
      <p style={{ margin: '22px 0 0', fontSize: '16.5px', lineHeight: '1.7', color: '#475569', textWrap: 'pretty', maxWidth: '56ch' }}>Every student&apos;s journey is their own. Track it subskill by subskill and watch their ACARA phase climb.</p>
      <p style={{ margin: '22px 0 0', background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: '14px', padding: '16px 18px', fontSize: '15px', lineHeight: '1.6', color: '#0E2350' }}><strong style={{ fontWeight: '700' }}>What this means for you:</strong> an evidence trail that holds up in a parent meeting and in a report to leadership.</p>
    </div>
    <div style={{ border: '1px solid #E3E8F0', borderRadius: '16px', overflow: 'hidden', background: '#FFFFFF' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 24px', borderBottom: '1px solid #E3E8F0', background: '#F7F9FC' }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#0E2350' }}>Reading</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '700', letterSpacing: '.08em', color: '#0D9488', background: '#CCFBF1', padding: '5px 10px', borderRadius: '6px' }}>CONSOLIDATING</span>
      </div>
      <ol style={{ listStyle: 'none', margin: '0', padding: '0' }}>
        <li style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '18px 24px', borderBottom: '1px solid #EEF2F7' }}><span style={{ fontSize: '12.5px', fontWeight: '700', color: '#94A3B8', width: '56px' }}>Term 1</span><span style={{ fontSize: '15.5px', fontWeight: '600', color: '#0E2350' }}>Emerging</span></li>
        <li style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '18px 24px', borderBottom: '1px solid #EEF2F7' }}><span style={{ fontSize: '12.5px', fontWeight: '700', color: '#94A3B8', width: '56px' }}>Term 2</span><span style={{ fontSize: '15.5px', fontWeight: '600', color: '#0E2350' }}>Emerging</span></li>
        <li style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '18px 24px', borderBottom: '1px solid #EEF2F7', background: '#F7FAFF' }}><span style={{ fontSize: '12.5px', fontWeight: '700', color: '#2563EB', width: '56px' }}>Term 3</span><span style={{ fontSize: '15.5px', fontWeight: '600', color: '#0E2350' }}>Developing</span></li>
        <li style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '18px 24px', background: '#0E2350' }}><span style={{ fontSize: '12.5px', fontWeight: '700', color: '#8FA3C7', width: '56px' }}>Term 4</span><span style={{ fontSize: '15.5px', fontWeight: '600', color: '#FFFFFF' }}>Consolidating</span></li>
      </ol>
      
    </div>
  </div>
</section>

<section data-screen-label="Progress chart" style={{ background: '#F7F9FC', borderTop: '1px solid #E3E8F0', borderBottom: '1px solid #E3E8F0' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: '56px', alignItems: 'center' }}>
    <div>
      <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488' }}>CLASS PROGRESSION</span>
      <h2 style={{ margin: '14px 0 0', fontSize: '32px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', textWrap: 'balance', maxWidth: '18ch' }}>Class progression you can point at.</h2>
      <p style={{ margin: '20px 0 0', fontSize: '16.5px', lineHeight: '1.7', color: '#475569', textWrap: 'pretty', maxWidth: '52ch' }}>Personalized and differentiated learning means everyone is on the right track. Now you have class-level analytics to how how quickly they&apos;re moving.</p>
      <p style={{ margin: '22px 0 0', background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: '14px', padding: '16px 18px', fontSize: '15px', lineHeight: '1.6', color: '#0E2350' }}><strong style={{ fontWeight: '700' }}>What this means for you:</strong> you can see the whole class moving, not just one student at a time.</p>
    </div>
    <figure style={{ margin: '0', border: '1px solid #E3E8F0', borderRadius: '16px', overflow: 'hidden', background: '#FFFFFF' }}>
      <figcaption style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', padding: '18px 24px', borderBottom: '1px solid #E3E8F0', background: '#F7F9FC' }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#0E2350' }}>Class level progress</span>
        
      </figcaption>
      <div style={{ padding: '22px 24px 8px' }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', padding: '0 0 16px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: '600', color: '#475569' }}><span style={{ width: '11px', height: '11px', borderRadius: '3px', background: '#DBEAFE' }}></span>Term 1</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: '600', color: '#475569' }}><span style={{ width: '11px', height: '11px', borderRadius: '3px', background: '#93C5FD' }}></span>Term 2</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: '600', color: '#475569' }}><span style={{ width: '11px', height: '11px', borderRadius: '3px', background: '#2563EB' }}></span>Term 3</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: '600', color: '#475569' }}><span style={{ width: '11px', height: '11px', borderRadius: '3px', background: '#0E2350' }}></span>Term 4</span>
        </div>
        <svg viewBox="0 0 760 350" role="img" aria-label="Grouped column chart showing four reading subskills measured across four school terms" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <g stroke="#EEF2F7" strokeWidth="1">
            <line x1="150" y1="20" x2="740" y2="20" />
            <line x1="150" y1="90" x2="740" y2="90" />
            <line x1="150" y1="160" x2="740" y2="160" />
            <line x1="150" y1="230" x2="740" y2="230" />
            <line x1="150" y1="300" x2="740" y2="300" />
          </g>
          <g fill="#94A3B8" fontSize="12" fontFamily="Google Sans, sans-serif" textAnchor="end">
            <text x="138" y="24">Independent</text>
            <text x="138" y="94">Consolidating</text>
            <text x="138" y="164">Developing</text>
            <text x="138" y="234">Emerging</text>
            <text x="138" y="304">Beginning</text>
          </g>
          <line x1="150" y1="300" x2="740" y2="300" stroke="#CBD5E1" strokeWidth="1.5" />
          <g>
            <rect x="155" y="233" width="29" height="67" rx="3" fill="#DBEAFE" />
            <rect x="191" y="182" width="29" height="118" rx="3" fill="#93C5FD" />
            <rect x="227" y="115" width="29" height="185" rx="3" fill="#2563EB" />
            <rect x="263" y="65" width="29" height="235" rx="3" fill="#0E2350" />
            <rect x="303" y="250" width="29" height="50" rx="3" fill="#DBEAFE" />
            <rect x="339" y="216" width="29" height="84" rx="3" fill="#93C5FD" />
            <rect x="375" y="154" width="29" height="146" rx="3" fill="#2563EB" />
            <rect x="411" y="98" width="29" height="202" rx="3" fill="#0E2350" />
            <rect x="450" y="199" width="29" height="101" rx="3" fill="#DBEAFE" />
            <rect x="486" y="177" width="29" height="123" rx="3" fill="#93C5FD" />
            <rect x="522" y="138" width="29" height="162" rx="3" fill="#2563EB" />
            <rect x="558" y="110" width="29" height="190" rx="3" fill="#0E2350" />
            <rect x="598" y="255" width="29" height="45" rx="3" fill="#DBEAFE" />
            <rect x="634" y="244" width="29" height="56" rx="3" fill="#93C5FD" />
            <rect x="670" y="227" width="29" height="73" rx="3" fill="#2563EB" />
            <rect x="706" y="205" width="29" height="95" rx="3" fill="#0E2350" />
          </g>
          <g fill="#64748B" fontSize="11.5" fontWeight="600" fontFamily="Google Sans, sans-serif" textAnchor="middle">
            <text x="169.5" y="225">24</text>
            <text x="205.5" y="174">42</text>
            <text x="241.5" y="107">66</text>
            <text x="277.5" y="57" fill="#0E2350">84</text>
            <text x="317.5" y="242">18</text>
            <text x="353.5" y="208">30</text>
            <text x="389.5" y="146">52</text>
            <text x="425.5" y="90" fill="#0E2350">72</text>
            <text x="464.5" y="191">36</text>
            <text x="500.5" y="169">44</text>
            <text x="536.5" y="130">58</text>
            <text x="572.5" y="102" fill="#0E2350">68</text>
            <text x="612.5" y="247">16</text>
            <text x="648.5" y="236">20</text>
            <text x="684.5" y="219">26</text>
            <text x="720.5" y="197" fill="#0E2350">34</text>
          </g>
          <g fill="#0E2350" fontSize="13" fontWeight="600" fontFamily="Google Sans, sans-serif" textAnchor="middle">
            <text x="224" y="325">Vocabulary</text>
            <text x="371" y="325">Inference</text>
            <text x="519" y="325">Grammar</text>
            <text x="666" y="325">Critical</text>
          </g>
        </svg>
      </div>
      
    </figure>
  </div>
</section>

<section data-screen-label="Teach empirically" style={{ background: '#FFFFFF' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,400px),1fr))', gap: '56px', alignItems: 'center' }}>
    <figure style={{ margin: '0', alignSelf: 'stretch', display: 'flex', flexDirection: 'column' }}>
      <img src="/images/landing/photo-d.webp" alt="A teacher working with a small group of secondary students" style={{ display: 'block', width: '100%', flex: '1', minHeight: '380px', objectFit: 'cover', borderRadius: '14px' }} />
      <figcaption style={{ marginTop: '10px', fontSize: '12.5px', lineHeight: '1.5', color: '#94A3B8' }}>Six weeks of vocabulary work, measured at the end of the six weeks.</figcaption>
    </figure>
    <div>
      <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488' }}>Feedback on your teaching</span>
      <h2 style={{ margin: '14px 0 0', fontSize: '32px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', textWrap: 'balance', maxWidth: '20ch' }}>Teach empirically</h2>
      <div style={{ width: '56px', height: '3px', background: '#0D9488', marginTop: '18px', borderRadius: '2px' }}></div>
      <p style={{ margin: '22px 0 0', fontSize: '16.5px', lineHeight: '1.7', color: '#475569', textWrap: 'pretty', maxWidth: '56ch' }}>Six weeks of targeted vocabulary work either shows up in the vocabulary line or it doesn&apos;t. You find out sooner rather than later.</p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '22px' }}>
        
        
      </div>
      <p style={{ margin: '22px 0 0', background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: '14px', padding: '16px 18px', fontSize: '15px', lineHeight: '1.6', color: '#0E2350' }}><strong style={{ fontWeight: '700' }}>What this means for you:</strong> feedback on your teaching, not just on your students.</p>
    </div>
  </div>
</section>

<section data-screen-label="Quote band" style={{ background: '#FFFFFF' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 32px 0' }}>
    <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', minHeight: '300px', display: 'flex', alignItems: 'flex-end' }}>
      <img src="/images/landing/photo-b.webp" alt="" style={{ position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(180deg,rgba(10,26,60,.22) 0%,rgba(10,26,60,.88) 100%)' }}></div>
      <blockquote style={{ position: 'relative', margin: '0', padding: '44px', maxWidth: '52ch' }}>
        <p style={{ margin: '0', fontSize: '27px', lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.02em', color: '#FFFFFF', textWrap: 'balance' }}>SchoolTest is a one of a kind English test that measures individual and class progress</p>
        <footer style={{ marginTop: '12px', fontSize: '14px', color: '#C7D6F2' }}>One ACARA scale, every student, every class</footer>
      </blockquote>
    </div>
  </div>
</section>

<section data-screen-label="Spacer" style={{ background: '#FFFFFF', height: '64px' }}></section>

<section data-screen-label="Next" style={{ background: '#F7F9FC', borderTop: '1px solid #E3E8F0', borderBottom: '1px solid #E3E8F0' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 32px' }}>
    <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488' }}>After tracking growth</span>
    <h2 style={{ margin: '14px 0 0', fontSize: '30px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', maxWidth: '24ch' }}>Make informed exit decisions</h2>
    <ol style={{ listStyle: 'none', margin: '32px 0 0', padding: '0', background: '#FFFFFF', border: '1px solid #E3E8F0', borderRadius: '16px', overflow: 'hidden' }}>
      <li style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr) auto', gap: '28px', alignItems: 'center', padding: '26px 32px', borderBottom: '1px solid #EEF2F7' }}>
        <span style={{ display: 'grid', placeItems: 'center', width: '56px', height: '56px', borderRadius: '14px', background: '#EFF5FF', color: '#2563EB', fontSize: '19px', fontWeight: '700' }}>04</span>
        <div>
          <div style={{ fontSize: '19px', fontWeight: '700', letterSpacing: '-0.015em', color: '#0E2350' }}>Predict mainstream readiness</div>
          <p style={{ margin: '7px 0 0', fontSize: '15.5px', lineHeight: '1.65', color: '#64748B', maxWidth: '70ch' }}>One readiness score, with the subskills behind it.</p>
        </div>
        <a href="/predict" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1D4ED8', whiteSpace: 'nowrap', textDecoration: 'none' }} data-track-h="8">Predict<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
      </li>
      <li style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr) auto', gap: '28px', alignItems: 'center', padding: '26px 32px' }}>
        <span style={{ display: 'grid', placeItems: 'center', width: '56px', height: '56px', borderRadius: '14px', background: '#EFF5FF', color: '#2563EB', fontSize: '19px', fontWeight: '700' }}>05</span>
        <div>
          <div style={{ fontSize: '19px', fontWeight: '700', letterSpacing: '-0.015em', color: '#0E2350' }}>Report to everyone who needs it</div>
          <p style={{ margin: '7px 0 0', fontSize: '15.5px', lineHeight: '1.65', color: '#64748B', maxWidth: '70ch' }}>A tailored report for students, families, teachers and leaders.</p>
        </div>
        <a href="/report" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1D4ED8', whiteSpace: 'nowrap', textDecoration: 'none' }} data-track-h="9">Report<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
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
      <a href="/#register" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: '#2563EB', color: '#FFFFFF', fontSize: '15px', fontWeight: '600', padding: '15px 26px', borderRadius: '12px', textDecoration: 'none' }} data-track-h="10">Join the pilot<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
      <a href="/#evidence" style={{ display: 'inline-flex', alignItems: 'center', background: 'transparent', color: '#FFFFFF', border: '1.5px solid rgba(255,255,255,.5)', fontSize: '15px', fontWeight: '600', padding: '14px 24px', borderRadius: '12px', textDecoration: 'none' }} data-track-h="11">Evidence base</a>
    </div>
  </div>
</section>

{aeo}
</main>

<footer data-screen-label="Footer" style={{ background: '#0A1A3C' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '56px 32px 0', display: 'flex', flexWrap: 'wrap', gap: '48px', justifyContent: 'space-between' }}>
    <div style={{ flex: '1 1 280px', maxWidth: '360px' }}>
      <img src="/images/landing/logo.png" alt="SchoolTest" style={{ height: '30px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
      <p style={{ margin: '14px 0 0', fontSize: '13.5px', lineHeight: '1.65', color: '#8FA3C7', maxWidth: '340px' }}>Diagnostic English assessment for Australian EAL/D classrooms. Years 7–12, reported on ACARA phases.</p>
    </div>
    <div style={{ display: 'flex', gap: 'clamp(40px,6vw,88px)', flexWrap: 'wrap' }}>
    <div>
      <div style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>SCHOOLTEST</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginTop: '16px' }}>
        <a href="/diagnose" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-track-h="12">Diagnose</a>
        <a href="/teach" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-track-h="13">Teach</a>
        <a href="/track" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-track-h="14">Track</a>
        <a href="/predict" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-track-h="15">Predict</a>
        <a href="/report" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-track-h="16">Report</a>
      </div>
    </div>
    <div>
      <div style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>About</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginTop: '16px' }}>
        <a href="/#register" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-track-h="17">Contact the programme team</a>
        <a href="/#register" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-track-h="18">Privacy statement</a>
        <a href="/#register" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-track-h="19">Accessibility</a>
        <a href="/#register" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-track-h="20">Terms of use</a>
      </div>
    </div>
    </div>
  </div>
  <div style={{ maxWidth: '1200px', margin: '44px auto 0', padding: '24px 32px', borderTop: '1px solid #1A2A4E' }}>
    <p style={{ margin: '0', fontSize: '13px', lineHeight: '1.7', color: '#8FA3C7', whiteSpace: 'nowrap' }}>SchoolTest acknowledges the Traditional Custodians of the lands on which Australian schools stand, and pays respect to Elders past and present.</p>
  </div>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px 32px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', rowGap: '8px' }}>
    <span style={{ fontSize: '12.5px', color: '#8FA3C7' }}>© 2026 SchoolTest</span>
    <span style={{ fontSize: '12.5px', color: '#8FA3C7' }}>Page last updated 31 August 2026</span>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', fontWeight: '600', color: '#5EEAD4', marginLeft: 'auto' }}><span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2DD4BF' }}></span>Piloting with founding schools</span>
  </div>
</footer>


    </div>
  );
}
