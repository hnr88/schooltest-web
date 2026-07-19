// m:ss formatting for the resend countdown (C-UI-AUTH-PAGES "Resend email (m:ss)").
export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}
