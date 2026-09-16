/* eslint-disable @next/next/no-img-element */
import '../landing.css';

export function LandingReportContent() {
  return (
    <div className="st-landing">

<a href="#main" style={{ position: 'absolute', left: '-9999px', top: '0', background: '#0E2350', color: '#FFFFFF', padding: '12px 18px', zIndex: '100' }} data-report-f="0">Skip to main content</a>

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
      <a href="/#programme" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-report-h="0">Overview</a>
      <a href="/diagnose" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-report-h="1">Diagnose</a>
      <a href="/teach" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-report-h="2">Teach</a>
      <a href="/track" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-report-h="3">Track</a>
      <a href="/predict" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#16326E', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid transparent', textDecoration: 'none' }} data-report-h="4">Predict</a>
      <a href="/report" style={{ display: 'flex', alignItems: 'center', fontSize: '14.5px', fontWeight: '600', color: '#0E2350', padding: '22px 12px 19px', whiteSpace: 'nowrap', borderBottom: '3px solid #2563EB', textDecoration: 'none' }}>Report</a>
    </nav>
    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px', flex: '0 0 auto' }}>
      <a href="/sign-in" style={{ fontSize: '14px', fontWeight: '600', color: '#16326E', textDecoration: 'none' }} data-report-h="5">Sign in</a>
      <a href="/#register" style={{ background: '#2563EB', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', padding: '11px 20px', borderRadius: '10px', textDecoration: 'none' }} data-report-h="6">Join the pilot</a>
    </div>
  </div>
</header>

<main id="main">

<section data-screen-label="Hero" style={{ background: '#FFFFFF', borderBottom: '1px solid #E3E8F0' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '36px 32px 56px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,400px),1fr))', gap: '56px', alignItems: 'center' }}>
    <div>
      <span style={{ display: 'inline-block', fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488' }}>05 · Report to everyone who needs it</span>
      <h1 style={{ margin: '16px 0 0', fontSize: '46px', lineHeight: '1.07', fontWeight: '700', letterSpacing: '-0.03em', color: '#0E2350', textWrap: 'balance', maxWidth: '16ch' }}>Instant reporting in everyone&apos;s language.</h1>
      <div style={{ width: '56px', height: '3px', background: '#0D9488', marginTop: '20px', borderRadius: '2px' }}></div>
      <p style={{ margin: '22px 0 0', fontSize: '18px', lineHeight: '1.6', color: '#475569', textWrap: 'pretty', maxWidth: '54ch' }}>Send instant reports straight to students, parents, leaders and mainstream teachers.</p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '30px' }}>
        <a href="/#register" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: '#2563EB', color: '#FFFFFF', fontSize: '15px', fontWeight: '600', padding: '15px 26px', borderRadius: '12px', textDecoration: 'none' }} data-report-h="7">Join the pilot<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
      </div>
    </div>
    <img src="/images/landing/photo-a.webp" alt="A teacher reviewing a student report on a laptop" style={{ display: 'block', width: '100%', height: '100%', minHeight: '420px', objectFit: 'cover', borderRadius: '14px' }} />
  </div>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px 64px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))', gap: '1px', background: '#1A2A4E', border: '1px solid #1A2A4E', borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ background: '#0E2350', padding: '28px 26px' }}><div style={{ fontSize: '16.5px', fontWeight: '700', letterSpacing: '-0.01em', color: '#FFFFFF' }}>Students</div><p style={{ margin: '10px 0 0', fontSize: '14.5px', lineHeight: '1.6', color: '#A9BADC' }}>A plain-language snapshot with motivating progress.</p></div>
      <div style={{ background: '#0E2350', padding: '28px 26px' }}><div style={{ fontSize: '16.5px', fontWeight: '700', letterSpacing: '-0.01em', color: '#FFFFFF' }}>Parents &amp; carers</div><p style={{ margin: '10px 0 0', fontSize: '14.5px', lineHeight: '1.6', color: '#A9BADC' }}>A jargon-free summary, in their language.</p></div>
      <div style={{ background: '#0E2350', padding: '28px 26px' }}><div style={{ fontSize: '16.5px', fontWeight: '700', letterSpacing: '-0.01em', color: '#FFFFFF' }}>Principals &amp; leaders</div><p style={{ margin: '10px 0 0', fontSize: '14.5px', lineHeight: '1.6', color: '#A9BADC' }}>Individual and cohort views needed for funding decisions.</p></div>
      <div style={{ background: '#0E2350', padding: '28px 26px' }}><div style={{ fontSize: '16.5px', fontWeight: '700', letterSpacing: '-0.01em', color: '#FFFFFF' }}>Mainstream teachers</div><p style={{ margin: '10px 0 0', fontSize: '14.5px', lineHeight: '1.6', color: '#A9BADC' }}>Next steps for a student moving into their class.</p></div>
    </div>
  </div>
</section>

<section data-screen-label="USP instant reports" style={{ background: '#F7F9FC', borderTop: '1px solid #E3E8F0', borderBottom: '1px solid #E3E8F0' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,400px),1fr))', gap: '56px', alignItems: 'center' }}>
    <div>
      <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488' }}>Instant, shareable reports</span>
      <h2 style={{ margin: '14px 0 0', fontSize: '32px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', textWrap: 'balance', maxWidth: '20ch' }}>One click turns a sitting into a report.</h2>
      <div style={{ width: '56px', height: '3px', background: '#0D9488', marginTop: '18px', borderRadius: '2px' }}></div>
      <p style={{ margin: '22px 0 0', fontSize: '16.5px', lineHeight: '1.7', color: '#475569', textWrap: 'pretty', maxWidth: '56ch' }}>No marking, no formatting, no waiting. Download a report as a PDF or send it straight to the right inbox - a single student, a whole class, or the leadership team in one go.</p>
      <p style={{ margin: '22px 0 0', background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: '14px', padding: '16px 18px', fontSize: '15px', lineHeight: '1.6', color: '#0E2350' }}><strong style={{ fontWeight: '700' }}>What this means for you:</strong> the report-writing night before parent-teacher interviews disappears.</p>
    </div>
    <figure style={{ margin: '0', border: '1px solid #E3E8F0', borderRadius: '16px', overflow: 'hidden', background: '#FFFFFF' }}>
      <figcaption style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', padding: '18px 24px', borderBottom: '1px solid #E3E8F0', background: '#F7F9FC' }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#0E2350' }}>Send this report</span>
        <span style={{ fontSize: '12.5px', color: '#94A3B8' }}>Term 2 · Reading</span>
      </figcaption>
      <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', border: '1px solid #E3E8F0', borderRadius: '12px' }}>
          <span style={{ display: 'grid', placeItems: 'center', width: '38px', height: '38px', borderRadius: '10px', background: '#EFF5FF', color: '#2563EB', flex: '0 0 auto' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /></svg></span>
          <div style={{ flex: '1 1 auto', minWidth: '0' }}><div style={{ fontSize: '14.5px', fontWeight: '600', color: '#0E2350' }}>Student report</div><div style={{ fontSize: '12.5px', color: '#94A3B8' }}>Plain-language · 1 page</div></div>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#0D9488', whiteSpace: 'nowrap' }}>Download</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', border: '1px solid #E3E8F0', borderRadius: '12px' }}>
          <span style={{ display: 'grid', placeItems: 'center', width: '38px', height: '38px', borderRadius: '10px', background: '#EFF5FF', color: '#2563EB', flex: '0 0 auto' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 6l-10 7L2 6" /><rect x="2" y="4" width="20" height="16" rx="2" /></svg></span>
          <div style={{ flex: '1 1 auto', minWidth: '0' }}><div style={{ fontSize: '14.5px', fontWeight: '600', color: '#0E2350' }}>Parent summary</div><div style={{ fontSize: '12.5px', color: '#94A3B8' }}>Emailed to carer on file</div></div>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#0D9488', whiteSpace: 'nowrap' }}>Send</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', border: '1px solid #E3E8F0', borderRadius: '12px' }}>
          <span style={{ display: 'grid', placeItems: 'center', width: '38px', height: '38px', borderRadius: '10px', background: '#EFF5FF', color: '#2563EB', flex: '0 0 auto' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12" y="8" width="3" height="10" /><rect x="17" y="4" width="3" height="14" /></svg></span>
          <div style={{ flex: '1 1 auto', minWidth: '0' }}><div style={{ fontSize: '14.5px', fontWeight: '600', color: '#0E2350' }}>Leadership summary</div><div style={{ fontSize: '12.5px', color: '#94A3B8' }}>Whole cohort · band spread</div></div>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#0D9488', whiteSpace: 'nowrap' }}>Download</span>
        </div>
      </div>
    </figure>
  </div>
</section>

<section data-screen-label="USP families and control" style={{ background: '#FFFFFF' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,400px),1fr))', gap: '56px', alignItems: 'center' }}>
    <figure style={{ margin: '0', alignSelf: 'stretch', display: 'flex', flexDirection: 'column' }}>
      <img src="/images/landing/parents-report.png" alt="Two parents reading their child's report on a laptop at home" style={{ display: 'block', width: '100%', flex: '1', minHeight: '380px', objectFit: 'cover', borderRadius: '14px' }} />
    </figure>
    <div>
      <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488' }}>Reports students and families understand</span>
      <h2 style={{ margin: '14px 0 0', fontSize: '32px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', textWrap: 'balance', maxWidth: '20ch' }}>Not just for the staffroom.</h2>
      <div style={{ width: '56px', height: '3px', background: '#0D9488', marginTop: '18px', borderRadius: '2px' }}></div>
      <p style={{ margin: '22px 0 0', fontSize: '16.5px', lineHeight: '1.7', color: '#475569', textWrap: 'pretty', maxWidth: '56ch' }}>Students and parents get their own version - the strengths and next steps in plain English, or their native language, without the jargon.</p>
      <p style={{ margin: '22px 0 0', background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: '14px', padding: '16px 18px', fontSize: '15px', lineHeight: '1.6', color: '#0E2350' }}><strong style={{ fontWeight: '700' }}>What this means for you:</strong> families understand where their child is without a translator sitting beside them.</p>
    </div>
  </div>
</section>

<section data-screen-label="Teacher control" style={{ background: '#0E2350' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 32px' }}>
    <div style={{ maxWidth: '640px' }}>
      <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#5EEAD4' }}>You are in control</span>
      <h2 style={{ margin: '14px 0 0', fontSize: '32px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#FFFFFF', textWrap: 'balance', maxWidth: '22ch' }}>Nothing leaves your desk until you say so.</h2>
      <p style={{ margin: '16px 0 0', fontSize: '16.5px', lineHeight: '1.7', color: '#A9BADC', maxWidth: '56ch' }}>Reports are generated automatically, but never sent automatically. Student and parent versions stay in draft until you release them - you choose which report, which audience, and when.</p>
    </div>
  </div>
</section>

<section data-screen-label="Quote band" style={{ background: '#FFFFFF' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 32px 0' }}>
    <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', minHeight: '300px', display: 'flex', alignItems: 'flex-end' }}>
      <img src="/images/landing/photo-b.webp" alt="" style={{ position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: '0', background: 'linear-gradient(180deg,rgba(10,26,60,.22) 0%,rgba(10,26,60,.88) 100%)' }}></div>
      <blockquote style={{ position: 'relative', margin: '0', padding: '44px', maxWidth: '52ch' }}>
        <p style={{ margin: '0', fontSize: '27px', lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.02em', color: '#FFFFFF', textWrap: 'balance' }}>The same result, said four different ways - and only when you are ready to say it.</p>
        <footer style={{ marginTop: '12px', fontSize: '14px', color: '#C7D6F2' }}>Students · parents · teachers · leaders</footer>
      </blockquote>
    </div>
  </div>
</section>

<section data-screen-label="Spacer" style={{ background: '#FFFFFF', height: '64px' }}></section>

<section data-screen-label="Next" style={{ background: '#F7F9FC', borderTop: '1px solid #E3E8F0', borderBottom: '1px solid #E3E8F0' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 32px' }}>
    <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.14em', textTransform: 'uppercase', color: '#0D9488' }}>The whole story</span>
    <h2 style={{ margin: '14px 0 0', fontSize: '30px', lineHeight: '1.16', fontWeight: '700', letterSpacing: '-0.024em', color: '#0E2350', maxWidth: '26ch' }}>One sitting, start to finish.</h2>
    <p style={{ margin: '18px 0 0', fontSize: '16.5px', lineHeight: '1.7', color: '#475569', textWrap: 'pretty', maxWidth: '60ch' }}>Diagnose, teach, track, predict, report - every stage runs off on-demand 40-minute tests.</p>
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
      <a href="/#register" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: '#2563EB', color: '#FFFFFF', fontSize: '15px', fontWeight: '600', padding: '15px 26px', borderRadius: '12px', textDecoration: 'none' }} data-report-h="8">Join the pilot<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></a>
      
    </div>
  </div>
</section>

</main>

<footer data-screen-label="Footer" style={{ background: '#0A1A3C' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '56px 32px 0', display: 'flex', flexWrap: 'wrap', gap: '48px', justifyContent: 'space-between' }}>
    
    <div style={{ flex: '1 1 280px', maxWidth: '360px' }}>
      <img src="/images/landing/logo.png" alt="SchoolTest" style={{ height: '30px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
      <p style={{ margin: '14px 0 0', fontSize: '13.5px', lineHeight: '1.65', color: '#8FA3C7', maxWidth: '340px' }}>Diagnostic English assessment for Australian EAL/D classrooms. Years 7–12, reported on ACARA phases.</p>
    </div><div style={{ display: 'flex', gap: 'clamp(40px,6vw,88px)', flexWrap: 'wrap' }}>
    <div>
      <div style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>SCHOOLTEST</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginTop: '16px' }}>
        <a href="/diagnose" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-report-h="9">Diagnose</a>
        <a href="/teach" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-report-h="10">Teach</a>
        <a href="/track" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-report-h="11">Track</a>
        <a href="/predict" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-report-h="12">Predict</a>
        <a href="/report" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }} data-report-h="13">Report</a>
      </div>
    </div>
    <div>
      <div style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>About</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginTop: '16px' }}>
        <a href="/#register" className="scp4" style={{ fontSize: '13.5px', color: 'rgb(199, 214, 242)', textDecoration: 'none' }}>Contact</a>
        <a href="/#register" className="scp4" style={{ fontSize: '13.5px', color: 'rgb(199, 214, 242)', textDecoration: 'none' }}>Privacy statement</a>
        <a href="/#register" className="scp4" style={{ fontSize: '13.5px', color: 'rgb(199, 214, 242)', textDecoration: 'none' }}>Accessibility</a>
        <a href="/#register" className="scp4" style={{ fontSize: '13.5px', color: 'rgb(199, 214, 242)', textDecoration: 'none' }}>Terms of use</a>
      </div>
    </div>
    </div>
  </div>
  <div style={{ maxWidth: '1200px', margin: '44px auto 0', padding: '24px 32px', borderTop: '1px solid #1A2A4E' }}>
    <p style={{ margin: '0', fontSize: '13px', lineHeight: '1.7', color: '#8FA3C7', whiteSpace: 'nowrap' }}>SchoolTest acknowledges the Traditional Custodians of the lands on which Australian schools stand, and pays respect to Elders past and present.</p><span style={{ fontSize: '12.5px', color: '#8FA3C7' }}>© 2026 SchoolTest</span>
  </div>
  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px 32px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', rowGap: '8px' }}>
    
    
    
  </div>
</footer>

    </div>
  );
}
