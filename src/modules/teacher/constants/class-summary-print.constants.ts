/**
 * The printed class reading report's stylesheet — the design's
 * `printClassReport` page (`Teacher Portal v2.dc.html` l.2072–2135), with the
 * portal's font stack. Printed through the browser's own dialog (Save as PDF).
 */
export const CLASS_SUMMARY_PRINT_CSS = [
  '@page{margin:22mm 20mm}*{box-sizing:border-box}',
  "body{font-family:'Google Sans',-apple-system,'Segoe UI',system-ui,sans-serif;color:#1C2430;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}",
  '.wrap{max-width:720px;margin:0 auto;padding:24px 4px}',
  '.head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #0E2350;padding-bottom:16px}',
  '.head h1{margin:0;font-size:24px;color:#0E2350;letter-spacing:-0.02em}.head .sub{font-size:13px;color:#6B7280;margin-top:4px}',
  '.head .brand{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9CA3AF}',
  '.kpis{display:flex;gap:14px;margin:22px 0}.kpi{flex:1;border:1px solid #ECEEF2;border-radius:10px;padding:14px 16px}',
  '.kpi .l{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#9CA3AF}.kpi .v{font-size:26px;color:#0E2350;margin-top:6px;font-weight:600}',
  'h2{font-size:13px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#0E2350;margin:26px 0 10px}',
  'table{width:100%;border-collapse:collapse;font-size:13.5px}',
  'th{text-align:left;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#9CA3AF;padding:0 0 8px;border-bottom:1px solid #ECEEF2}',
  'td{padding:10px 0;border-bottom:1px solid #F1F3F6}td.num{font-weight:600;color:#0E2350}',
  '.two{display:flex;gap:16px}.two .box{flex:1;border:1px solid #ECEEF2;border-radius:10px;padding:14px 16px}',
  '.two .l{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#9CA3AF}.two .v{font-size:15px;color:#0E2350;margin-top:6px;font-weight:600}',
  '.foot{margin-top:28px;font-size:11px;color:#9CA3AF;border-top:1px solid #ECEEF2;padding-top:12px}',
].join('');
