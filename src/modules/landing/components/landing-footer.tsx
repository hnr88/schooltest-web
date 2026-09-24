/* eslint-disable @next/next/no-img-element */
import '../landing.css';

// The design's static footer. Public pages render the CMS Layout footer; this
// is its fallback when the CMS is unreachable or has no layout published.
export function LandingFooter() {
  return (
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
            <a href="/diagnose" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }}>Diagnose</a>
            <a href="/teach" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }}>Teach</a>
            <a href="/track" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }}>Track</a>
            <a href="/predict" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }}>Predict</a>
            <a href="/report" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }}>Report</a>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '.09em', textTransform: 'uppercase', color: '#8FA3C7' }}>About</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginTop: '16px' }}>
            <a href="/#register" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }}>Contact the programme team</a>
            <a href="/#register" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }}>Privacy statement</a>
            <a href="/#register" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }}>Accessibility</a>
            <a href="/#register" style={{ fontSize: '13.5px', color: '#C7D6F2', textDecoration: 'none' }}>Terms of use</a>
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
  );
}
