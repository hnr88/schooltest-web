/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from 'react';

import '../landing.css';

export function LandingDiagnoseContent({ aeo }: { aeo?: ReactNode }) {
  return (
    <div className="st-landing">

<a href="#main" style={{ position: 'absolute', left: '-9999px', top: '0', background: '#0E2350', color: '#FFFFFF', padding: '12px 18px', zIndex: '100' }} data-diagnose-f="0">Skip to main content</a>

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
      <a href="/#programme" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-diagnose-h="0">Overview</a>
      <a href="/diagnose" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#0E2350', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid #2563EB', textDecoration: 'none' }}>Diagnose</a>
      <a href="/teach" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-diagnose-h="1">Teach</a>
      <a href="/track" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-diagnose-h="2">Track</a>
      <a href="/predict" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-diagnose-h="3">Predict</a>
      <a href="/report" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-diagnose-h="4">Report</a>
    </nav>
    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px', flex: '0 0 auto' }}>
      <a href="/sign-in" style={{ fontSize: '14px', fontWeight: '600', color: '#16326E', textDecoration: 'none' }} data-diagnose-h="5">Sign in</a>
      <a href="/#register" style={{ background: '#2563EB', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', padding: '11px 20px', borderRadius: '10px', textDecoration: 'none' }} data-diagnose-h="6">Join the pilot</a>
    </div>
  </div>
</header>

<main id="main">

<section data-screen-label="Hero" style={{ background: '#FFFFFF', borderBottom: '1px solid #E3E8F0' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '36px 32px 56px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,400px),1fr))', gap: '56px', alignItems: 'center' }}>
    <div>
      <span style={{ display: 'inline-block', fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488' }}>01 · SEE STRENGTHS AND WEAKNESSES</span>
      <h1 style={{ margin: '16px 0 0', fontSize: '46px', lineHeight: '1.07', fontWeight: '700', letterSpacing: '-0.03em', color: '#0E2350', textWrap: 'balance', maxWidth: '16ch' }}>One 40-minute sitting. All is revealed.</h1>
      <div style={{ width: '56px', height: '3px', background: '#0D9488', marginTop: '20px', borderRadius: '2px' }}></div>
      <p data-speakable="summary" style={{ margin: '22px 0 0', fontSize: '18px', lineHeight: '1.6', color: '#475569', textWrap: 'pretty', maxWidth: '54ch' }}>SchoolTest breaks placement test scores into 27 subskill scores - so you know exactly what they need before you’ve even met them.</p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '30px' }}>
        <a href="/#register" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: '#2563EB', color: '#FFFFFF', fontSize: '15px', fontWeight: '600', padding: '15px 26px', borderRadius: '12px', textDecoration: 'none' }} data-diagnose-h="7">Join the pilot<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
      </div>
    </div>
    <img src="/images/landing/photo-d.webp" alt="A secondary student sitting an assessment on a laptop" style={{ display: 'block', width: '100%', height: '100%', minHeight: '420px', objectFit: 'cover', borderRadius: '14px' }} />
  </div>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px 64px' }}>
    <dl style={{ margin: '0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,190px),1fr))', gap: '1px', background: '#1A2A4E', border: '1px solid #1A2A4E', borderRadius: '14px', overflow: 'hidden' }}>
      <div style={{ background: '#0E2350', padding: '22px 24px' }}><dt style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>Subskills pinpointed</dt><dd style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: '700', lineHeight: '1.3', color: '#FFFFFF' }}>27</dd></div>
      <div style={{ background: '#0E2350', padding: '22px 24px' }}><dt style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>Diagnostic detail</dt><dd style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: '700', lineHeight: '1.3', color: '#FFFFFF' }}>Day one</dd></div>
      <div style={{ background: '#0E2350', padding: '22px 24px' }}><dt style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>Teacher marking</dt><dd style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: '700', lineHeight: '1.3', color: '#FFFFFF' }}>Zero</dd></div>
      <div style={{ background: '#0E2350', padding: '22px 24px' }}><dt style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>Skills covered</dt><dd style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: '700', lineHeight: '1.3', color: '#FFFFFF' }}>All 4</dd></div>
    </dl>
  </div>
</section>

<section data-screen-label="Unpack the placement score" style={{ background: '#FFFFFF' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,400px),1fr))', gap: '56px', alignItems: 'center' }}>
    <div>
      <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488' }}>Unpack the placement score</span>
      <h2 style={{ margin: '14px 0 0', fontSize: '32px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', textWrap: 'balance', maxWidth: '20ch' }}>Unpack placement test scores</h2>
      <div style={{ width: '56px', height: '3px', background: '#0D9488', marginTop: '18px', borderRadius: '2px' }}></div>
      <p style={{ margin: '22px 0 0', fontSize: '16.5px', lineHeight: '1.7', color: '#475569', textWrap: 'pretty', maxWidth: '56ch' }}>A placement score tells you roughly where a student sits and nothing about what’s underneath. SchoolTest reports each subskill on the ACARA phase scale, so the gaps are evident.</p>
      
      <p style={{ margin: '22px 0 0', background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: '14px', padding: '16px 18px', fontSize: '15px', lineHeight: '1.6', color: '#0E2350' }}><strong style={{ fontWeight: '700' }}>What this means for you:</strong> six weeks of trying to figure them out, done on day one.</p>
    </div>
    <figure style={{ margin: '0', border: '1px solid #E3E8F0', borderRadius: '16px', overflow: 'hidden', background: '#FFFFFF' }}>
      <figcaption style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', padding: '18px 24px', borderBottom: '1px solid #E3E8F0', background: '#F7F9FC' }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#0E2350' }}>SchoolTest Reading subskill profile</span>
        
      </figcaption>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '110px minmax(0,1fr) 108px', gap: '14px', alignItems: 'center' }}>
          <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0E2350', textAlign: 'right' }}>Decoding</span>
          <span style={{ height: '14px', borderRadius: '4px', background: '#F1F5F9', display: 'block' }}><span style={{ display: 'block', height: '100%', width: '72%', borderRadius: '4px', background: '#0E2350' }}></span></span>
          <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748B' }}>Consolidating</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '110px minmax(0,1fr) 108px', gap: '14px', alignItems: 'center' }}>
          <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0E2350', textAlign: 'right' }}>Vocabulary</span>
          <span style={{ height: '14px', borderRadius: '4px', background: '#F1F5F9', display: 'block' }}><span style={{ display: 'block', height: '100%', width: '14%', borderRadius: '4px', background: '#93C5FD' }}></span></span>
          <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748B' }}>Beginning</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '110px minmax(0,1fr) 108px', gap: '14px', alignItems: 'center' }}>
          <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0E2350', textAlign: 'right' }}>Grammar</span>
          <span style={{ height: '14px', borderRadius: '4px', background: '#F1F5F9', display: 'block' }}><span style={{ display: 'block', height: '100%', width: '52%', borderRadius: '4px', background: '#2563EB' }}></span></span>
          <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748B' }}>Developing</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '110px minmax(0,1fr) 108px', gap: '14px', alignItems: 'center' }}>
          <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0E2350', textAlign: 'right' }}>Gist</span>
          <span style={{ height: '14px', borderRadius: '4px', background: '#F1F5F9', display: 'block' }}><span style={{ display: 'block', height: '100%', width: '58%', borderRadius: '4px', background: '#2563EB' }}></span></span>
          <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748B' }}>Developing</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '110px minmax(0,1fr) 108px', gap: '14px', alignItems: 'center' }}>
          <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0E2350', textAlign: 'right' }}>Detail</span>
          <span style={{ height: '14px', borderRadius: '4px', background: '#F1F5F9', display: 'block' }}><span style={{ display: 'block', height: '100%', width: '32%', borderRadius: '4px', background: '#60A5FA' }}></span></span>
          <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748B' }}>Emerging</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '110px minmax(0,1fr) 108px', gap: '14px', alignItems: 'center' }}>
          <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0E2350', textAlign: 'right' }}>Inference</span>
          <span style={{ height: '14px', borderRadius: '4px', background: '#F1F5F9', display: 'block' }}><span style={{ display: 'block', height: '100%', width: '27%', borderRadius: '4px', background: '#60A5FA' }}></span></span>
          <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748B' }}>Emerging</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '110px minmax(0,1fr) 108px', gap: '14px', alignItems: 'center' }}>
          <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0E2350', textAlign: 'right' }}>Critical reading</span>
          <span style={{ height: '14px', borderRadius: '4px', background: '#F1F5F9', display: 'block' }}><span style={{ display: 'block', height: '100%', width: '10%', borderRadius: '4px', background: '#93C5FD' }}></span></span>
          <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748B' }}>Beginning</span>
        </div>
        <div style={{ display: 'flex', gap: '14px', padding: '12px 0 0 124px', borderTop: '1px solid #EEF2F7', marginTop: '6px' }}>
          
          
          
          
          
        </div>
      </div>
      
    </figure>
  </div>
</section>

<section data-screen-label="Same score different students" style={{ background: '#F7F9FC', borderTop: '1px solid #E3E8F0', borderBottom: '1px solid #E3E8F0' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,400px),1fr))', gap: '56px', alignItems: 'center' }}>
    <figure style={{ margin: '0', alignSelf: 'stretch', display: 'flex', flexDirection: 'column' }}>
      <img src="/images/landing/students-walking.png" alt="Four secondary students in uniform walking together at school" style={{ display: 'block', width: '100%', flex: '1', minHeight: '380px', objectFit: 'cover', borderRadius: '14px' }} />
      <figcaption style={{ marginTop: '10px', fontSize: '12.5px', lineHeight: '1.5', color: '#94A3B8' }}>Two students on the same band, sitting in the same class, needing different lessons.</figcaption>
    </figure>
    <div>
      <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488' }}>Two students, one score</span>
      <h2 style={{ margin: '14px 0 0', fontSize: '32px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', textWrap: 'balance', maxWidth: '20ch' }}>Same score. Different abilities.</h2>
      <div style={{ width: '56px', height: '3px', background: '#0D9488', marginTop: '18px', borderRadius: '2px' }}></div>
      <p style={{ margin: '22px 0 0', fontSize: '16.5px', lineHeight: '1.7', color: '#475569', textWrap: 'pretty', maxWidth: '56ch' }}>Two students arrive with the same CEFR B1. Are they the same? No. One is strong on decoding and lost on vocabulary; the other is the reverse. Each student has a unique linguistic profile - now you can see it.</p>
      <p style={{ margin: '22px 0 0', background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: '14px', padding: '16px 18px', fontSize: '15px', lineHeight: '1.6', color: '#0E2350' }}><strong style={{ fontWeight: '700' }}>What this means for you:</strong> two students you’d have taught together, taught personally.</p>
    </div>
  </div>
</section>

<section data-screen-label="Quote band" style={{ background: '#FFFFFF' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 32px 0' }}>
    <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', minHeight: '300px', display: 'flex', alignItems: 'flex-end' }}>
      <img src="/images/landing/photo-b.webp" alt="" style={{ position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(180deg,rgba(10,26,60,.22) 0%,rgba(10,26,60,.88) 100%)' }}></div>
      <blockquote style={{ position: 'relative', margin: '0', padding: '44px', maxWidth: '52ch' }}>
        <p style={{ margin: '0', fontSize: '27px', lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.02em', color: '#FFFFFF', textWrap: 'balance' }}>A score is a summary. A subskill profile is a map.</p>
        <footer style={{ marginTop: '12px', fontSize: '14px', color: '#C7D6F2' }}>27 subskills · reading, listening, speaking and writing</footer>
      </blockquote>
    </div>
  </div>
</section>

<section data-screen-label="Spacer" style={{ background: '#FFFFFF', height: '64px' }}></section>

<section data-screen-label="Next" style={{ background: '#F7F9FC', borderTop: '1px solid #E3E8F0', borderBottom: '1px solid #E3E8F0' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 32px' }}>
    <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488' }}>After the diagnostic</span>
    <h2 style={{ margin: '14px 0 0', fontSize: '30px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', maxWidth: '24ch' }}>Where the profile goes next.</h2>
    <ol style={{ listStyle: 'none', margin: '32px 0 0', padding: '0', background: '#FFFFFF', border: '1px solid #E3E8F0', borderRadius: '16px', overflow: 'hidden' }}>
      <li style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr) auto', gap: '28px', alignItems: 'center', padding: '26px 32px', borderBottom: '1px solid #EEF2F7' }}>
        <span style={{ display: 'grid', placeItems: 'center', width: '56px', height: '56px', borderRadius: '14px', background: '#EFF5FF', color: '#2563EB', fontSize: '19px', fontWeight: '700' }}>02</span>
        <div>
          <div style={{ fontSize: '19px', fontWeight: '700', letterSpacing: '-0.015em', color: '#0E2350' }}>Plan and teach from the results</div>
          <p style={{ margin: '7px 0 0', fontSize: '15.5px', lineHeight: '1.65', color: '#64748B', maxWidth: '70ch' }}>Turn the profile into targeted materials.</p>
        </div>
        <a href="/teach" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1D4ED8', whiteSpace: 'nowrap', textDecoration: 'none' }} data-diagnose-h="8">Teach<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
      </li>
      <li style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr) auto', gap: '28px', alignItems: 'center', padding: '26px 32px', borderBottom: '1px solid #EEF2F7' }}>
        <span style={{ display: 'grid', placeItems: 'center', width: '56px', height: '56px', borderRadius: '14px', background: '#EFF5FF', color: '#2563EB', fontSize: '19px', fontWeight: '700' }}>03</span>
        <div>
          <div style={{ fontSize: '19px', fontWeight: '700', letterSpacing: '-0.015em', color: '#0E2350' }}>Track progress over time</div>
          <p style={{ margin: '7px 0 0', fontSize: '15.5px', lineHeight: '1.65', color: '#64748B', maxWidth: '70ch' }}>Results reported on the ACARA scale.</p>
        </div>
        <a href="/track" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1D4ED8', whiteSpace: 'nowrap', textDecoration: 'none' }} data-diagnose-h="9">Track<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
      </li>
      <li style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr) auto', gap: '28px', alignItems: 'center', padding: '26px 32px', borderBottom: '1px solid #EEF2F7' }}>
        <span style={{ display: 'grid', placeItems: 'center', width: '56px', height: '56px', borderRadius: '14px', background: '#EFF5FF', color: '#2563EB', fontSize: '19px', fontWeight: '700' }}>04</span>
        <div>
          <div style={{ fontSize: '19px', fontWeight: '700', letterSpacing: '-0.015em', color: '#0E2350' }}>Predict mainstream readiness</div>
          <p style={{ margin: '7px 0 0', fontSize: '15.5px', lineHeight: '1.65', color: '#64748B', maxWidth: '70ch' }}>One readiness score, with the subskills behind it.</p>
        </div>
        <a href="/predict" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1D4ED8', whiteSpace: 'nowrap', textDecoration: 'none' }} data-diagnose-h="10">Predict<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
      </li>
      <li style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr) auto', gap: '28px', alignItems: 'center', padding: '26px 32px' }}>
        <span style={{ display: 'grid', placeItems: 'center', width: '56px', height: '56px', borderRadius: '14px', background: '#EFF5FF', color: '#2563EB', fontSize: '19px', fontWeight: '700' }}>05</span>
        <div>
          <div style={{ fontSize: '19px', fontWeight: '700', letterSpacing: '-0.015em', color: '#0E2350' }}>Report to everyone who needs it</div>
          <p style={{ margin: '7px 0 0', fontSize: '15.5px', lineHeight: '1.65', color: '#64748B', maxWidth: '70ch' }}>A tailored report for students, families, teachers and leaders.</p>
        </div>
        <a href="/report" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1D4ED8', whiteSpace: 'nowrap', textDecoration: 'none' }} data-diagnose-h="11">Report<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
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
      <a href="/#register" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: '#2563EB', color: '#FFFFFF', fontSize: '15px', fontWeight: '600', padding: '15px 26px', borderRadius: '12px', textDecoration: 'none' }} data-diagnose-h="12">Join the pilot<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
      
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
        <a href="/diagnose" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-diagnose-h="13">Diagnose</a>
        <a href="/teach" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-diagnose-h="14">Teach</a>
        <a href="/track" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-diagnose-h="15">Track</a>
        <a href="/predict" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-diagnose-h="16">Predict</a>
        <a href="/report" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-diagnose-h="17">Report</a>
      </div>
    </div>
    
    <div>
      <div style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>About</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginTop: '16px' }}>
        <a href="/#register" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-diagnose-h="18">Contact&nbsp;</a>
        <a href="/#register" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-diagnose-h="19">Privacy statement</a>
        <a href="/#register" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-diagnose-h="20">Accessibility</a>
        <a href="/#register" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-diagnose-h="21">Terms of use</a>
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
