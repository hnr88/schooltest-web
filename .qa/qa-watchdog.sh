#!/usr/bin/env bash
# qa-watchdog.sh — schooltest-web-ds
# Adapted (D10): the detected run path is Playwright's on-demand webServer — there are NO
# persistent servers/infra to restart. This watchdog runs ONLY the stuck-checker:
# it watches .qa/heartbeat and flips a DOING task to BLOCKED in STATE.json past HARD_STALL.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; QA="$ROOT/.qa"
CHECK_EVERY=600        # stuck-checker cadence (s) — 11-50 tasks band
STALL_LIMIT=600        # soft stall: warn when heartbeat is this old
HARD_STALL=1200        # hard stall: auto-unstick the in-flight task
log() { echo "$(date '+%F %T') $*" >> "$QA/watchdog.log"; }
stale_task() {
  node -e '
    const fs=require("fs"); const p=process.env.QA_DIR+"/STATE.json";
    if(!fs.existsSync(p)) process.exit(0);
    const s=JSON.parse(fs.readFileSync(p,"utf8"));
    const now=Date.now()/1000; let changed=false;
    (s.tasks||[]).forEach(t=>{
      if(t.status==="DOING" && t.started_at && (now - t.started_at) > HARD) {
        t.status="BLOCKED";
        t.evidence=(t.evidence||"")+" | auto-unstuck by watchdog: exceeded "+HARD+"s";
        changed=true;
      }
    });
    if(changed) fs.writeFileSync(p, JSON.stringify(s,null,2));
  ' 2>>"$QA/watchdog.log"
}
export QA_DIR="$QA"; export HARD="$HARD_STALL"
log "watchdog started (stuck-checker only; CHECK_EVERY=$CHECK_EVERY HARD_STALL=$HARD_STALL)"
while true; do
  if [ -f "$QA/heartbeat" ]; then
    last=$(stat -c %Y "$QA/heartbeat" 2>/dev/null || stat -f %m "$QA/heartbeat")
    age=$(( $(date +%s) - last ))
    if [ "$age" -gt "$HARD_STALL" ]; then
      log "HARD STALL: no heartbeat ${age}s — forcing unstick"; stale_task
    elif [ "$age" -gt "$STALL_LIMIT" ]; then
      log "SOFT STALL: no heartbeat ${age}s — agent likely stuck"
    fi
  fi
  sleep "$CHECK_EVERY"
done
