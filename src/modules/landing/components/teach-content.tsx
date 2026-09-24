/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from 'react';

import '../landing.css';

export function LandingTeachContent({ aeo, footer }: { aeo?: ReactNode; footer?: ReactNode }) {
  return (
    <div className="st-landing">



<a href="#main" style={{ position: 'absolute', left: '-9999px', top: '0', background: '#0E2350', color: '#FFFFFF', padding: '12px 18px', zIndex: '100' }} data-teach-f="0">Skip to main content</a>

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
      <a href="/#programme" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-teach-h="0">Overview</a>
      <a href="/diagnose" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-teach-h="1">Diagnose</a>
      <a href="/teach" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#0E2350', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid #2563EB', textDecoration: 'none' }}>Teach</a>
      <a href="/track" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-teach-h="2">Track</a>
      <a href="/predict" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-teach-h="3">Predict</a>
      <a href="/report" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-teach-h="4">Report</a>
    </nav>
    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px', flex: '0 0 auto' }}>
      <a href="/sign-in" style={{ fontSize: '14px', fontWeight: '600', color: '#16326E', textDecoration: 'none' }} data-teach-h="5">Sign in</a>
      <a href="/#register" style={{ background: '#2563EB', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', padding: '11px 20px', borderRadius: '10px', textDecoration: 'none' }} data-teach-h="6">Join the pilot</a>
    </div>
  </div>
</header>

<main id="main">

<section data-screen-label="Hero" style={{ background: '#FFFFFF' }}>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))' }}>
    <div style={{ background: '#0A1A3C', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
      <div style={{ maxWidth: '600px', padding: '56px 48px 56px 32px', width: '100%' }}>
        <span style={{ display: 'inline-block', fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#5EEAD4' }}>02 · Plan and teach</span>
        <h1 style={{ margin: '16px 0 0', fontSize: '44px', lineHeight: '1.08', fontWeight: '700', letterSpacing: '-0.03em', color: '#FFFFFF', textWrap: 'balance' }}>Paste the profile into AI. Get a week of teaching materials out.</h1>
        <p data-speakable="summary" style={{ margin: '20px 0 0', fontSize: '17.5px', lineHeight: '1.62', color: '#C7D6F2', textWrap: 'pretty', maxWidth: '50ch' }}>Export a privacy-safe class set and hand it to ChatGPT, Gemini or Claude. Real subskill data turns a generic prompt into materials your class can actually use.</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '30px' }}>
          <a href="/#register" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: '#2563EB', color: '#FFFFFF', fontSize: '15px', fontWeight: '600', padding: '15px 26px', borderRadius: '12px', textDecoration: 'none' }} data-teach-h="7">Join the pilot<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
          
        </div>
      </div>
    </div>
    <img src="/images/landing/photo-b.webp" alt="A teacher preparing lesson materials at a laptop" style={{ display: 'block', width: '100%', height: '100%', minHeight: '460px', objectFit: 'cover' }} />
  </div>
  <div style={{ background: '#F7F9FC', borderTop: '1px solid #E3E8F0', borderBottom: '1px solid #E3E8F0' }}>
    <dl style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(50%,190px),1fr))' }}>
      <div style={{ padding: '22px 24px 22px 0' }}><dt style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#64748B' }}>Class set export</dt><dd style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: '700', color: '#0E2350' }}>Pseudonymised</dd></div>
      <div style={{ padding: '22px 24px', borderLeft: '1px solid #E3E8F0' }}><dt style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#64748B' }}>Student names in export</dt><dd style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: '700', color: '#0E2350' }}>None</dd></div>
      <div style={{ padding: '22px 24px', borderLeft: '1px solid #E3E8F0' }}><dt style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#64748B' }}>Grouping views</dt><dd style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: '700', color: '#0E2350' }}>Built in</dd></div>
      <div style={{ padding: '22px 0 22px 24px', borderLeft: '1px solid #E3E8F0' }}><dt style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#64748B' }}>Works without AI</dt><dd style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: '700', color: '#0E2350' }}>Yes</dd></div>
    </dl>
  </div>
</section>

<section data-screen-label="Generate the materials" style={{ background: '#FFFFFF' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,400px),1fr))', gap: '56px', alignItems: 'center' }}>
    <div>
      <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0F766E' }}>Generate the materials</span>
      <h2 style={{ margin: '14px 0 0', fontSize: '32px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', textWrap: 'balance', maxWidth: '20ch' }}>Generate data-driven teaching materials</h2>
      <div style={{ width: '56px', height: '3px', background: '#0D9488', marginTop: '18px', borderRadius: '2px' }}></div>
      <p style={{ margin: '22px 0 0', fontSize: '16.5px', lineHeight: '1.7', color: '#475569', textWrap: 'pretty', maxWidth: '56ch' }}>Ask AI for a reading passage with question sets matched to each student’s area of need, and you’ll have it before the kettle boils.</p>
      <p style={{ margin: '22px 0 0', background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: '14px', padding: '16px 18px', fontSize: '15px', lineHeight: '1.6', color: '#0E2350' }}><strong style={{ fontWeight: '700' }}>What this means for you:</strong> differentiation stops being a Sunday night job.</p>
    </div>
    <div style={{ border: '1px solid #E3E8F0', borderRadius: '16px', overflow: 'hidden', background: '#FFFFFF' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 24px', borderBottom: '1px solid #E3E8F0', background: '#F7F9FC' }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#0E2350' }}>Class set · 22 profiles</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '700', letterSpacing: '.08em', color: '#0F766E', background: '#CCFBF1', padding: '5px 10px', borderRadius: '6px' }}>EXPORT</span>
      </div>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ background: '#F7F9FC', border: '1px solid #EEF2F7', borderRadius: '12px', padding: '16px 18px', fontSize: '14.5px', lineHeight: '1.6', color: '#475569' }}>“Write one passage at the class’s vocabulary band, with question sets matched to their gaps.”</div>
        <div style={{ border: '1px solid #E3E8F0', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#0E2350' }}>Reading passage + questions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
            <span style={{ height: '7px', borderRadius: '999px', background: '#EEF2F7', width: '100%', display: 'block' }}></span>
            <span style={{ height: '7px', borderRadius: '999px', background: '#EEF2F7', width: '88%', display: 'block' }}></span>
            <span style={{ height: '7px', borderRadius: '999px', background: '#EEF2F7', width: '62%', display: 'block' }}></span>
          </div>
          <span style={{ display: 'inline-block', marginTop: '16px', fontSize: '11.5px', fontWeight: '600', color: '#16326E', background: '#EFF5FF', border: '1px solid #DBEAFE', padding: '5px 11px', borderRadius: '6px' }}>Targets: inference, vocabulary</span>
        </div>
      </div>
      <div style={{ padding: '14px 24px', borderTop: '1px solid #E3E8F0', fontSize: '12.5px', color: '#64748B' }}>No student names appear in any export.</div>
    </div>
  </div>
</section>

<section data-screen-label="Classroom management" style={{ background: '#F7F9FC', borderTop: '1px solid #E3E8F0', borderBottom: '1px solid #E3E8F0' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 32px' }}>
    <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', minHeight: '420px', display: 'flex', alignItems: 'flex-end' }}>
      <img src="/images/landing/photo-c.webp" alt="" style={{ position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(180deg,rgba(10,26,60,.28) 0%,rgba(10,26,60,.90) 100%)' }}></div>
      <div style={{ position: 'relative', padding: '44px', maxWidth: '760px' }}>
        <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#5EEAD4' }}>Classroom management</span>
        <h2 style={{ margin: '14px 0 0', fontSize: '32px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#FFFFFF', textWrap: 'balance' }}>Who to pair with whom, and how to split the room.</h2>
        <p style={{ margin: '16px 0 0', maxWidth: '62ch', fontSize: '16.5px', lineHeight: '1.65', color: '#C7D6F2', textWrap: 'pretty' }}>Who to pair with whom, on which skill, and how to split the room into groups that each need something different. The data makes it defensible; the AI makes it fast.</p>
        <p style={{ margin: '18px 0 0', fontSize: '15.5px', lineHeight: '1.6', color: '#FFFFFF' }}><strong style={{ fontWeight: '700' }}>What this means for you:</strong> let the data do the planning so you can do the teaching.</p>
      </div>
    </div>
  </div>
</section>

<section data-screen-label="Ask AI" style={{ background: '#FFFFFF' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: '56px', alignItems: 'center' }}>
    <div>
      <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0F766E' }}>Ask AI</span>
      <h2 style={{ margin: '14px 0 0', fontSize: '32px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', textWrap: 'balance', maxWidth: '18ch' }}>Ask the data anything.</h2>
      <p style={{ margin: '20px 0 0', fontSize: '16.5px', lineHeight: '1.7', color: '#475569', textWrap: 'pretty', maxWidth: '52ch' }}>Every subskill score is loaded in, so you can query it in plain English - the full profile for one student, the shared gap across a group, or who to pull for a small-group lesson. You get a specific answer, not a spreadsheet to sift.</p>
      <p style={{ margin: '22px 0 0', background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: '14px', padding: '16px 18px', fontSize: '15px', lineHeight: '1.6', color: '#0E2350' }}><strong style={{ fontWeight: '700' }}>What this means for you:</strong> the analysis you would have done by hand, answered in an instant.</p>
    </div>
    <figure style={{ margin: '0', border: '1px solid #E3E8F0', borderRadius: '16px', overflow: 'hidden', background: '#FFFFFF' }}>
      <figcaption style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 22px', borderBottom: '1px solid #E3E8F0', background: '#F7F9FC' }}>
        <span style={{ display: 'grid', placeItems: 'center', width: '28px', height: '28px', borderRadius: '8px', background: '#0E2350', color: '#FFFFFF', fontSize: '14px', fontWeight: '700', flex: '0 0 auto' }}>S</span>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#0E2350' }}>Ask SchoolTest</span>
        <span style={{ marginLeft: 'auto', fontSize: '12.5px', color: '#64748B' }}>9 English · 22 students</span>
      </figcaption>
      <div style={{ padding: '22px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ alignSelf: 'flex-end', maxWidth: '82%', background: '#2563EB', color: '#FFFFFF', fontSize: '14.5px', lineHeight: '1.55', padding: '12px 16px', borderRadius: '14px 14px 4px 14px' }}>Which students need work on inference?</div>
        <div style={{ alignSelf: 'flex-start', maxWidth: '88%', background: '#F1F5F9', color: '#0E2350', fontSize: '14.5px', lineHeight: '1.6', padding: '14px 16px', borderRadius: '14px 14px 14px 4px' }}>
          Six students sit at Emerging or below on inference: Aisha, Mateo, Priya, Deng, Yuki and Sam. They can decode fluently but miss implied meaning - a good small group to start with.
        </div>
        <div style={{ alignSelf: 'flex-end', maxWidth: '82%', background: '#2563EB', color: '#FFFFFF', fontSize: '14.5px', lineHeight: '1.55', padding: '12px 16px', borderRadius: '14px 14px 4px 14px' }}>Draft a short passage with inference questions for them.</div>
        <div style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#F0FDFA', border: '1px solid #CCFBF1', color: '#0E2350', fontSize: '14px', fontWeight: '600', padding: '12px 16px', borderRadius: '14px 14px 14px 4px' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
          Inference passage · Year 9.docx
        </div>
      </div>
      <div style={{ padding: '14px 22px', borderTop: '1px solid #E3E8F0', fontSize: '12.5px', color: '#64748B' }}>Illustrative exchange. Names are sample data; the diagnostic data is exported de-identified.</div>
    </figure>
  </div>
</section>

<section data-screen-label="Quote band" style={{ background: '#FFFFFF' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 32px 0' }}>
    <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', minHeight: '300px', display: 'flex', alignItems: 'flex-end' }}>
      <img src="/images/landing/photo-a.webp" alt="" style={{ position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(180deg,rgba(10,26,60,.22) 0%,rgba(10,26,60,.88) 100%)' }}></div>
      <blockquote style={{ position: 'relative', margin: '0', padding: '44px', maxWidth: '52ch' }}>
        <p style={{ margin: '0', fontSize: '27px', lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.02em', color: '#FFFFFF', textWrap: 'balance' }}>A generic prompt gives you a worksheet. Real data gives you a lesson.</p>
        <footer style={{ marginTop: '12px', fontSize: '14px', color: '#C7D6F2' }}>Class set export · 22 profiles, no student names</footer>
      </blockquote>
    </div>
  </div>
</section>

<section data-screen-label="Spacer" style={{ background: '#FFFFFF', height: '64px' }}></section>

<section data-screen-label="Next" style={{ background: '#F7F9FC', borderTop: '1px solid #E3E8F0', borderBottom: '1px solid #E3E8F0' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 32px' }}>
    <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0F766E' }}>After teaching</span>
    <h2 style={{ margin: '14px 0 0', fontSize: '30px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', maxWidth: '24ch' }}>Then you watch it move.</h2>
    <ol style={{ listStyle: 'none', margin: '32px 0 0', padding: '0', background: '#FFFFFF', border: '1px solid #E3E8F0', borderRadius: '16px', overflow: 'hidden' }}>
      <li style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr) auto', gap: '28px', alignItems: 'center', padding: '26px 32px', borderBottom: '1px solid #EEF2F7' }}>
        <span style={{ display: 'grid', placeItems: 'center', width: '56px', height: '56px', borderRadius: '14px', background: '#EFF5FF', color: '#2563EB', fontSize: '19px', fontWeight: '700' }}>03</span>
        <div>
          <div style={{ fontSize: '19px', fontWeight: '700', letterSpacing: '-0.015em', color: '#0E2350' }}>Track progress over time</div>
          <p style={{ margin: '7px 0 0', fontSize: '15.5px', lineHeight: '1.65', color: '#64748B', maxWidth: '70ch' }}>Every result on the same ACARA scale, term after term.</p>
        </div>
        <a href="/track" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1D4ED8', whiteSpace: 'nowrap', textDecoration: 'none' }} data-teach-h="8">Track<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
      </li>
      <li style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr) auto', gap: '28px', alignItems: 'center', padding: '26px 32px', borderBottom: '1px solid #EEF2F7' }}>
        <span style={{ display: 'grid', placeItems: 'center', width: '56px', height: '56px', borderRadius: '14px', background: '#EFF5FF', color: '#2563EB', fontSize: '19px', fontWeight: '700' }}>04</span>
        <div>
          <div style={{ fontSize: '19px', fontWeight: '700', letterSpacing: '-0.015em', color: '#0E2350' }}>Predict mainstream readiness</div>
          <p style={{ margin: '7px 0 0', fontSize: '15.5px', lineHeight: '1.65', color: '#64748B', maxWidth: '70ch' }}>One readiness score, with the subskills behind it.</p>
        </div>
        <a href="/predict" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1D4ED8', whiteSpace: 'nowrap', textDecoration: 'none' }} data-teach-h="9">Predict<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
      </li>
      <li style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr) auto', gap: '28px', alignItems: 'center', padding: '26px 32px' }}>
        <span style={{ display: 'grid', placeItems: 'center', width: '56px', height: '56px', borderRadius: '14px', background: '#EFF5FF', color: '#2563EB', fontSize: '19px', fontWeight: '700' }}>05</span>
        <div>
          <div style={{ fontSize: '19px', fontWeight: '700', letterSpacing: '-0.015em', color: '#0E2350' }}>Report to everyone who needs it</div>
          <p style={{ margin: '7px 0 0', fontSize: '15.5px', lineHeight: '1.65', color: '#64748B', maxWidth: '70ch' }}>A tailored report for students, families, teachers and leaders.</p>
        </div>
        <a href="/report" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1D4ED8', whiteSpace: 'nowrap', textDecoration: 'none' }} data-teach-h="10">Report<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
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
      <a href="/#register" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: '#2563EB', color: '#FFFFFF', fontSize: '15px', fontWeight: '600', padding: '15px 26px', borderRadius: '12px', textDecoration: 'none' }} data-teach-h="11">Join the pilot<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
      <a href="/#evidence" style={{ display: 'inline-flex', alignItems: 'center', background: 'transparent', color: '#FFFFFF', border: '1.5px solid rgba(255,255,255,.5)', fontSize: '15px', fontWeight: '600', padding: '14px 24px', borderRadius: '12px', textDecoration: 'none' }} data-teach-h="12">Evidence base</a>
    </div>
  </div>
</section>

{aeo}
</main>

{footer}


    </div>
  );
}
