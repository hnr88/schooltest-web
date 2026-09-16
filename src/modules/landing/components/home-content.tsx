'use client';

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';

import '../landing.css';

export function LandingHomeContent() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="st-landing">


<a href="#main" style={{ position: 'absolute', left: '-9999px', top: '0', background: '#0E2350', color: '#FFFFFF', padding: '12px 18px', zIndex: '100' }} data-index-f="0">Skip to main content</a>

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
      <a href="#programme" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#0E2350', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid #2563EB', textDecoration: 'none' }}>Overview</a>
      <a href="/diagnose" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-index-h="0">Diagnose</a>
      <a href="/teach" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-index-h="1">Teach</a>
      <a href="/track" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-index-h="2">Track</a>
      <a href="/predict" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-index-h="3">Predict</a>
      <a href="/report" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-index-h="4">Report</a>
    </nav>
    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px', flex: '0 0 auto' }}>
      <a href="/sign-in" style={{ fontSize: '14px', fontWeight: '600', color: '#16326E', textDecoration: 'none' }} data-index-h="5">Sign in</a>
      <a href="#register" style={{ background: '#2563EB', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', padding: '11px 20px', borderRadius: '10px', textDecoration: 'none' }} data-index-h="6">Join the pilot</a>
    </div>
  </div>
</header>

<main id="main">

<section data-screen-label="Hero" style={{ position: 'relative', background: '#0A1A3C' }}>
  <img src="/images/landing/hero-classroom-sunrise.png" alt="" style={{ position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover', opacity: '.55' }} />
  <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(96deg,rgba(10,26,60,.96) 0%,rgba(10,26,60,.86) 46%,rgba(10,26,60,.35) 100%)' }}></div>
  <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', padding: '96px 32px 104px', minHeight: '520px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    
    <div style={{ maxWidth: '640px' }}>
      <span style={{ display: 'inline-block', fontSize: '14px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#5EEAD4' }}>DESIGNED FOR AUSTRALIAN HIGH SCHOOLS</span>
      <h1 style={{ margin: '16px 0 0', fontSize: '62px', lineHeight: '1.06', fontWeight: '700', letterSpacing: '-0.03em', color: '#FFFFFF', textWrap: 'balance' }}>Diagnostic and progress testing for HSP</h1>
      <p style={{ margin: '20px 0 0', fontSize: '18px', lineHeight: '1.6', color: '#C7D6F2', textWrap: 'pretty', maxWidth: '54ch' }}>Pinpoint needs,&nbsp;&nbsp;personalize content, track progress, predict readiness - and create instant reports aligned to ACARA</p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '30px' }}>
        <a href="#register" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: '#2563EB', color: '#FFFFFF', fontSize: '15px', fontWeight: '600', padding: '15px 26px', borderRadius: '12px', textDecoration: 'none' }} data-index-h="7">Join the pilot<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
        <a href="#what-you-get" style={{ display: 'inline-flex', alignItems: 'center', background: 'transparent', color: '#FFFFFF', border: '1.5px solid rgba(255,255,255,.5)', fontSize: '15px', fontWeight: '600', padding: '14px 24px', borderRadius: '12px', textDecoration: 'none' }} data-index-h="8">See how it works</a>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(16px,2.5vw,34px)', flexWrap: 'wrap', marginTop: '44px', paddingTop: '26px', borderTop: '1px solid rgba(255,255,255,.16)' }}>
        <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.1em', textTransform: 'uppercase', color: '#8FA3C7', whiteSpace: 'nowrap' }}>Field testing with</span>
        <img src="/images/landing/logo-jpc.png" alt="John Paul College" style={{ height: '40px', width: 'auto', objectFit: 'contain', opacity: '.92' }} />
        <img src="/images/landing/logo-ivanhoe.webp" alt="Ivanhoe Grammar" style={{ height: '64px', width: 'auto', objectFit: 'contain', opacity: '.92' }} />
        <img src="/images/landing/logo-mbc.png" alt="Moreton Bay College" style={{ height: '44px', width: 'auto', objectFit: 'contain', opacity: '.92' }} />
      </div>
    </div>
  </div>
</section>

<section id="programme" data-screen-label="About the programme" style={{ background: '#FFFFFF', scrollMarginTop: '20px' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,400px),1fr))', gap: '56px', alignItems: 'start' }}>
    <div>
      <h2 style={{ margin: '0', fontSize: '32px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', textWrap: 'balance', maxWidth: '22ch' }}>English is so much more than four scores</h2>
      <div style={{ width: '56px', height: '3px', background: '#0D9488', marginTop: '18px', borderRadius: '2px' }}></div>
      <p style={{ margin: '22px 0 0', fontSize: '16.5px', lineHeight: '1.7', color: '#475569', textWrap: 'pretty', maxWidth: '58ch' }}>Placement test scores tell you next to nothing about what a student can actually do.</p>
      <ul style={{ listStyle: 'none', margin: '28px 0 0', padding: '0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <li style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px 0', borderTop: '1px solid #E3E8F0' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: '0 0 auto', marginTop: '2px' }}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          <div><span style={{ fontWeight: '700', color: '#0E2350' }}>A CEFR or a stanine can&apos;t be taught to.</span> <span style={{ color: '#475569' }}>27 subskills, on the other hand, tell you exactly what to teach on Monday.</span></div>
        </li>
        <li style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px 0', borderTop: '1px solid #E3E8F0' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: '0 0 auto', marginTop: '2px' }}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          <div><span style={{ fontWeight: '700', color: '#0E2350' }}>One score can mean very different things.</span> <span style={{ color: '#475569' }}>&quot;B1&quot; or &quot;5.5&quot; can hide very different linguistic abilities.</span></div>
        </li>
        <li style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px 0', borderTop: '1px solid #E3E8F0', borderBottom: '1px solid #E3E8F0' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: '0 0 auto', marginTop: '2px' }}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          <div><span style={{ fontWeight: '700', color: '#0E2350' }}>Placement tests require six more weeks to figure them out.</span> <span style={{ color: '#475569' }}>SchoolTest hands you diagnostic detail on day one.</span></div>
        </li>
      </ul>
    </div>
    <figure style={{ margin: '0', alignSelf: 'stretch', display: 'flex', flexDirection: 'column' }}>
      <img src="/images/landing/student-writing.png" alt="A secondary student writing in a workbook beside a laptop during class" style={{ display: 'block', width: '100%', flex: '1', minHeight: '420px', objectFit: 'cover', borderRadius: '14px' }} />
    </figure>
  </div>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px 72px' }}>
    <dl style={{ margin: '0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,180px),1fr))', gap: '1px', background: '#1A2A4E', border: '1px solid #1A2A4E', borderRadius: '14px', overflow: 'hidden' }}>
      <div style={{ background: '#0E2350', padding: '22px 24px' }}><dt style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>Skills</dt><dd style={{ margin: '8px 0 0', fontSize: '15.5px', fontWeight: '600', lineHeight: '1.45', color: '#FFFFFF' }}>All four skills</dd><dd style={{ margin: '2px 0 0', fontSize: '12.5px', fontWeight: '500', lineHeight: '1.4', color: '#8FA3C7' }}>Reading, listening, speaking, writing</dd></div>
      <div style={{ background: '#0E2350', padding: '22px 24px' }}><dt style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>Subskills</dt><dd style={{ margin: '8px 0 0', fontSize: '15.5px', fontWeight: '600', lineHeight: '1.45', color: '#FFFFFF' }}>27 subskills</dd><dd style={{ margin: '2px 0 0', fontSize: '12.5px', fontWeight: '500', lineHeight: '1.4', color: '#8FA3C7' }}>The detail behind each score</dd></div>
      <div style={{ background: '#0E2350', padding: '22px 24px' }}><dt style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>In-classroom</dt><dd style={{ margin: '8px 0 0', fontSize: '15.5px', fontWeight: '600', lineHeight: '1.45', color: '#FFFFFF' }}>40 min per skill</dd><dd style={{ margin: '2px 0 0', fontSize: '12.5px', fontWeight: '500', lineHeight: '1.4', color: '#8FA3C7' }}>In class, whenever you choose to test</dd></div>
      <div style={{ background: '#0E2350', padding: '22px 24px' }}><dt style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>Year levels</dt><dd style={{ margin: '8px 0 0', fontSize: '15.5px', fontWeight: '600', lineHeight: '1.45', color: '#FFFFFF' }}>Years 7–12</dd><dd style={{ margin: '2px 0 0', fontSize: '12.5px', fontWeight: '500', lineHeight: '1.4', color: '#8FA3C7' }}>Age-appropriate, Australian contexts</dd></div>
      <div style={{ background: '#0E2350', padding: '22px 24px' }}><dt style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>ALIGNED TO</dt><dd style={{ margin: '8px 0 0', fontSize: '15.5px', fontWeight: '600', lineHeight: '1.45', color: '#FFFFFF' }}>ACARA</dd><dd style={{ margin: '2px 0 0', fontSize: '12.5px', fontWeight: '500', lineHeight: '1.4', color: '#8FA3C7' }}>Based on the EAL/D learning progressions</dd></div>
    </dl>
  </div>
</section>

<section id="what-you-get" data-screen-label="Five programme components" style={{ background: '#FFFFFF', borderTop: '1px solid #E3E8F0', scrollMarginTop: '20px' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 32px 88px' }}>
    <div style={{ maxWidth: '680px' }}>
      <span style={{ display: 'inline-block', fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488', background: '#F0FDFA', border: '1px solid #CCFBF1', padding: '7px 14px', borderRadius: '999px' }}>HOW IT WORKS</span>
      <h2 style={{ margin: '18px 0 0', fontSize: '40px', lineHeight: '1.12', fontWeight: '700', letterSpacing: '-0.025em', color: '#0E2350', textWrap: 'balance' }}>A different type of English test</h2>
      <p style={{ margin: '16px 0 0', fontSize: '17px', lineHeight: '1.7', color: '#5F6B7A', maxWidth: '56ch' }}>Delivered in-class whenever you want: diagnose every skill, personalize content, track growth, predict readiness, and report to families and leadership before the kettle boils.</p>
    </div>

    <div style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: '20px' }}>
      {[
        { num: '01', tag: 'Diagnose', title: 'Diagnose strengths and weaknesses', desc: 'Four macro skills and 27 subskills. The detail that used to take weeks of watching, visible on day one.', href: '/diagnose', chipBg: '#EFF5FF', chipFg: '#2563EB', linkBg: '#EFF5FF', linkFg: '#1D4ED8' },
        { num: '02', tag: 'Teach', title: 'Plan and teach', desc: 'Drag and drop diagnostic data into your favourite LLM. Personalization and differentiation is no longer a Sunday night job.', href: '/teach', chipBg: '#F0FDFA', chipFg: '#0D9488', linkBg: '#F0FDFA', linkFg: '#0D9488' },
        { num: '03', tag: 'Track', title: 'Track progress over time', desc: 'Retest whenever you want and watch them grow on the ACARA scale. Make empirical teaching decisions that truly move the needle.', href: '/track', chipBg: '#EFF5FF', chipFg: '#2563EB', linkBg: '#EFF5FF', linkFg: '#1D4ED8' },
        { num: '04', tag: 'Predict', title: 'Predict mainstream readiness', desc: 'One readiness indicator across all four skills, aligned to ACARA. Exit calls you can defend.', href: '/predict', chipBg: '#F0FDFA', chipFg: '#0D9488', linkBg: '#F0FDFA', linkFg: '#0D9488' },
        { num: '05', tag: 'Report', title: 'Report to leadership and families', desc: 'A profile a family can read and evidence leadership can trust. Keep everyone informed.', href: '#evidence', chipBg: '#EFF5FF', chipFg: '#2563EB', linkBg: '#EFF5FF', linkFg: '#1D4ED8' },
      ].map((usp) => (
        <a
          key={usp.num}
          href={usp.href}
          className="st-gcard"
          style={{ display: 'flex', flexDirection: 'column', background: '#FFFFFF', border: '1px solid #E3E8F0', borderRadius: '28px', padding: '30px 28px 28px', textDecoration: 'none', transition: 'transform .22s ease, box-shadow .22s ease, border-color .22s ease' }}
        >
          <span style={{ display: 'grid', placeItems: 'center', width: '54px', height: '54px', borderRadius: '18px', background: usp.chipBg, color: usp.chipFg, fontSize: '17px', fontWeight: '800', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{usp.num}</span>
          <span style={{ marginTop: '22px', fontSize: '11px', fontWeight: '700', letterSpacing: '.13em', textTransform: 'uppercase', color: usp.chipFg }}>{usp.tag}</span>
          <span style={{ marginTop: '8px', fontSize: '21px', fontWeight: '700', letterSpacing: '-0.015em', lineHeight: '1.25', color: '#0E2350', textWrap: 'balance' }}>{usp.title}</span>
          <span style={{ marginTop: '10px', fontSize: '15px', lineHeight: '1.65', color: '#5F6B7A' }}>{usp.desc}</span>
          <span className="st-gcard-link" style={{ display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', gap: '8px', marginTop: 'auto', paddingTop: '22px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: usp.linkBg, color: usp.linkFg, fontSize: '13.5px', fontWeight: '700', padding: '9px 16px', borderRadius: '999px', transition: 'filter .18s ease' }}>
              See how
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </span>
          </span>
        </a>
      ))}

      <a
        href="#register"
        className="st-gcard st-gcard-dark"
        style={{ display: 'flex', flexDirection: 'column', background: '#0E2350', border: '1px solid #0E2350', borderRadius: '28px', padding: '30px 28px 28px', textDecoration: 'none', transition: 'transform .22s ease, box-shadow .22s ease' }}
      >
        <span style={{ display: 'grid', placeItems: 'center', width: '54px', height: '54px', borderRadius: '18px', background: 'rgba(94,234,212,.16)', color: '#5EEAD4', fontSize: '17px', fontWeight: '800', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>06</span>
        <span style={{ marginTop: '22px', fontSize: '11px', fontWeight: '700', letterSpacing: '.13em', textTransform: 'uppercase', color: '#5EEAD4' }}>Join the pilot</span>
        <span style={{ marginTop: '8px', fontSize: '21px', fontWeight: '700', letterSpacing: '-0.015em', lineHeight: '1.25', color: '#FFFFFF', textWrap: 'balance' }}>Bring SchoolTest to your school</span>
        <span style={{ marginTop: '10px', fontSize: '15px', lineHeight: '1.65', color: '#C7D6F2' }}>Pilot testing is open. Join the pilot now.</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', gap: '8px', marginTop: 'auto', paddingTop: '22px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: '#5EEAD4', color: '#0E2350', fontSize: '13.5px', fontWeight: '700', padding: '9px 16px', borderRadius: '999px', transition: 'filter .18s ease' }}>
            Join the pilot
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </span>
        </span>
      </a>
    </div>
  </div>
</section>

<section data-screen-label="Quote band" style={{ background: '#FFFFFF' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 32px 0' }}>
    <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', minHeight: '320px', display: 'flex', alignItems: 'flex-end' }}>
      <img src="/images/landing/photo-b.webp" alt="" style={{ position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(180deg,rgba(10,26,60,.22) 0%,rgba(10,26,60,.88) 100%)' }}></div>
      <blockquote style={{ position: 'relative', margin: '0', padding: '44px', maxWidth: '48ch' }}>
        <p style={{ margin: '0', fontSize: '27px', lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.02em', color: '#FFFFFF', textWrap: 'balance' }}>Assessment stops being a summary and starts being a map.</p>
        <footer style={{ marginTop: '12px', fontSize: '14px', color: '#C7D6F2' }}>Years 7–12 · Reading, listening, speaking and writing + 27 subskills</footer>
      </blockquote>
    </div>
  </div>
</section>

<section id="evidence" data-screen-label="Progress chart" style={{ background: '#FFFFFF', scrollMarginTop: '20px' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: '56px', alignItems: 'center' }}>
    <div>
      <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488' }}>DIAGNOSTIC TESTING</span>
      <h2 style={{ margin: '14px 0 0', fontSize: '32px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', textWrap: 'balance', maxWidth: '18ch' }}>See beneath the score</h2>
      <p style={{ margin: '20px 0 0', fontSize: '16.5px', lineHeight: '1.7', color: '#475569', textWrap: 'pretty', maxWidth: '52ch' }}>Reading, listening, speaking, writing - each score hides a spread of sub-skills underneath.</p>
      <p style={{ margin: '14px 0 0', fontSize: '16.5px', lineHeight: '1.7', color: '#475569', textWrap: 'pretty', maxWidth: '52ch' }}>See the sub-scores so you know precisely where to aim the next lesson.</p>
      <a href="/diagnose" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '22px', fontSize: '15px', fontWeight: '600', color: '#1D4ED8', textDecoration: 'none' }} className="st-usp-cta">How the diagnostic works<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
    </div>
    <figure style={{ margin: '0', border: '1px solid #E3E8F0', borderRadius: '16px', overflow: 'hidden', background: '#FFFFFF' }}>
      <figcaption style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', padding: '18px 24px', borderBottom: '1px solid #E3E8F0', background: '#F7F9FC' }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#0E2350' }}>READING: Score 58 / CEFR B1</span>
        <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '.08em', color: '#0D9488', background: '#CCFBF1', padding: '5px 10px', borderRadius: '6px' }}>SUBSKILL PROFILE</span>
      </figcaption>
      <div style={{ padding: '24px 20px 12px' }}>
        <svg viewBox="0 0 760 404" role="img" aria-label="Column chart ranking seven reading subskills by score on the ACARA phase scale, Decoding highest at 72" style={{ width: '100%', height: 'auto', display: 'block' }}>
          {[
            { v: 0, y: 320 },
            { v: 20, y: 264 },
            { v: 40, y: 208 },
            { v: 60, y: 152 },
            { v: 80, y: 96 },
            { v: 100, y: 40 },
          ].map((g) => (
            <g key={g.v}>
              {g.v > 0 ? (
                <line x1="70" y1={g.y} x2="730" y2={g.y} stroke="#EEF2F7" strokeWidth="1" strokeDasharray="4 4" />
              ) : (
                <line x1="70" y1={g.y} x2="730" y2={g.y} stroke="#CBD5E1" strokeWidth="1.5" />
              )}
              <text x="58" y={g.y + 4} textAnchor="end" fontSize="11" fill="#94A3B8" fontFamily="Google Sans, sans-serif">{g.v}</text>
            </g>
          ))}
          {[
            { name: ['Decoding'], phase: 'CONSOLIDATING', v: 72 },
            { name: ['Gist'], phase: 'DEVELOPING', v: 58 },
            { name: ['Grammar'], phase: 'DEVELOPING', v: 52 },
            { name: ['Detail'], phase: 'EMERGING', v: 32 },
            { name: ['Inference'], phase: 'EMERGING', v: 27 },
            { name: ['Vocabulary'], phase: 'BEGINNING', v: 14 },
            { name: ['Critical', 'reading'], phase: 'BEGINNING', v: 10 },
          ].map((d, i) => {
            const slot = 660 / 7;
            const cx = 70 + slot * (i + 0.5);
            const w = 44;
            const h = (d.v / 100) * 280;
            const y = 320 - h;
            const lead = i === 0;
            return (
              <g key={d.name.join(' ')}>
                <rect x={cx - w / 2} y={y} width={w} height={h} rx="4" fill={lead ? '#2563EB' : '#DBEAFE'} />
                <text x={cx} y={y - 10} textAnchor="middle" fontSize="14" fontWeight="700" fill={lead ? '#0E2350' : '#64748B'} fontFamily="Google Sans, sans-serif">{d.v}</text>
                {d.name.map((line, li) => (
                  <text key={line} x={cx} y={344 + li * 17} textAnchor="middle" fontSize="13" fontWeight="600" fill="#0E2350" fontFamily="Google Sans, sans-serif">{line}</text>
                ))}
                <text x={cx} y={344 + d.name.length * 17 + 1} textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="0.08em" fill="#94A3B8" fontFamily="Google Sans, sans-serif">{d.phase}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  </div>
</section>

<section data-screen-label="Evidence base" style={{ background: '#0E2350' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 32px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: '40px', alignItems: 'end' }}>
      <div>
        <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#5EEAD4' }}>Evidence base</span>
        <h2 style={{ margin: '14px 0 0', fontSize: '30px', lineHeight: '1.18', fontWeight: '700', letterSpacing: '-0.022em', color: '#FFFFFF', textWrap: 'balance', maxWidth: '24ch' }}>Built on 40+ years of psychometric research.</h2>
      </div>
      <p style={{ margin: '0', fontSize: '15.5px', lineHeight: '1.7', color: '#A9BADC', maxWidth: '46ch' }}>SchoolTest uses well-established psychometric modeling to pinpoint each student&apos;s strengths, weaknesses and progression.</p>
    </div>
    </div>
  
</section>

<section id="register" data-screen-label="Register" style={{ background: '#F7F9FC', borderBottom: '1px solid #E3E8F0', scrollMarginTop: '20px' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap: '48px', alignItems: 'stretch' }}>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488' }}>BECOME A FOUNDING SCHOOL</span>
      <h2 style={{ margin: '14px 0 0', fontSize: '32px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', textWrap: 'balance', maxWidth: '20ch' }}>We’re building this with founding schools.</h2>
      <p style={{ margin: '20px 0 0', maxWidth: '54ch', fontSize: '16.5px', lineHeight: '1.7', color: '#475569', textWrap: 'pretty' }}>We need schools willing to try SchoolTest with real students and provide us with feedback.</p>
      <ul style={{ listStyle: 'none', margin: '24px 0 0', padding: '0', maxWidth: '52ch', background: '#FFFFFF', border: '1px solid #E3E8F0', borderRadius: '14px', overflow: 'hidden' }}>
        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 20px', borderBottom: '1px solid #EEF2F7', fontSize: '15.5px', color: '#0E2350', fontWeight: '500' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Early access to the platform as it is built</li>
        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 20px', borderBottom: '1px solid #EEF2F7', fontSize: '15.5px', color: '#0E2350', fontWeight: '500' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Direct input into the report design</li>
        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 20px', fontSize: '15.5px', color: '#0E2350', fontWeight: '500' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Founding terms when the programme launches</li>
      </ul>
      <img src="/images/landing/photo-c.webp" alt="School grounds" style={{ display: 'block', width: '100%', flex: '1', minHeight: '220px', objectFit: 'cover', borderRadius: '14px', marginTop: '26px' }} />
    </div>

    <div style={{ background: '#FFFFFF', border: '1px solid #E3E8F0', borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '20px 30px', background: '#0E2350' }}><span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '.1em', textTransform: 'uppercase', color: '#FFFFFF' }}>Expression of interest</span></div>
      <div style={{ padding: '30px' }}>
      {!submitted && (<div id="eoi-form-wrap" hidden={submitted}>
        <div>
          <p style={{ margin: '0', fontSize: '15px', lineHeight: '1.6', color: '#64748B' }}>Complete the form and the programme team will be in touch within a week with a sample report.</p>
          <form id="eoi-form" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}><span style={{ fontSize: '13px', fontWeight: '600', color: '#0E2350' }}>Your name</span><input type="text" required placeholder="Jane Smith" style={{ height: '46px', padding: '0 14px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '15px', color: '#0E2350', background: '#FFFFFF' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}><span style={{ fontSize: '13px', fontWeight: '600', color: '#0E2350' }}>School</span><input type="text" required placeholder="School name" style={{ height: '46px', padding: '0 14px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '15px', color: '#0E2350', background: '#FFFFFF' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}><span style={{ fontSize: '13px', fontWeight: '600', color: '#0E2350' }}>Your role</span>
              <select required style={{ height: '46px', padding: '0 12px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '15px', color: '#0E2350', background: '#FFFFFF' }}><option value="">Select…</option><option>EAL/D coordinator</option><option>Head of department</option><option>Classroom teacher</option><option>Principal / leadership</option><option>Other</option></select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}><span style={{ fontSize: '13px', fontWeight: '600', color: '#0E2350' }}>Work email</span><input type="email" required placeholder="name@school.edu.au" style={{ height: '46px', padding: '0 14px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '15px', color: '#0E2350', background: '#FFFFFF' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}><span style={{ fontSize: '13px', fontWeight: '600', color: '#0E2350' }}>Number of students</span>
              <select required style={{ height: '46px', padding: '0 12px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '15px', color: '#0E2350', background: '#FFFFFF' }}><option value="">Select…</option><option>1–20</option><option>21–50</option><option>51–100</option><option>100+</option></select>
            </label>
            <button type="submit" style={{ marginTop: '4px', height: '50px', border: 'none', borderRadius: '12px', background: '#2563EB', color: '#FFFFFF', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }} data-index-h="16">Submit expression of interest</button>
          </form>
          <p style={{ margin: '16px 0 0', fontSize: '12.5px', lineHeight: '1.6', color: '#94A3B8' }}>Pseudonymised data handling. No student names appear in any export. Read the <a href="#register" style={{ color: '#1D4ED8' }}>privacy statement</a>.</p>
        </div>
      </div>)}
      {submitted && (<div id="eoi-success-wrap">
        <div role="status" style={{ padding: '10px 0' }}>
          <span style={{ display: 'inline-grid', placeItems: 'center', width: '44px', height: '44px', borderRadius: '50%', background: '#CCFBF1' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#0E2350', marginTop: '16px' }}>Expression of interest received</div>
          <div style={{ fontSize: '15px', lineHeight: '1.6', color: '#64748B', marginTop: '8px' }}>The programme team will be in touch within a week with a sample report.</div>
        </div>
      </div>)}
      </div>
    </div>
  </div>
</section>

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
        <a href="/diagnose" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-index-h="17">Diagnose</a>
        <a href="/teach" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-index-h="18">Teach</a>
        <a href="/track" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-index-h="19">Track</a>
        <a href="/predict" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-index-h="20">Predict</a>
        <a href="/report" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-index-h="21">Report</a>
      </div>
    </div>
    <div>
      <div style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>About</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginTop: '16px' }}>
        <a href="#register" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-index-h="22">Contact the programme team</a>
        <a href="#register" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-index-h="23">Privacy statement</a>
        <a href="#register" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-index-h="24">Accessibility</a>
        <a href="#register" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-index-h="25">Terms of use</a>
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
