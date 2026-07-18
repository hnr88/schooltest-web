#!/usr/bin/env bash
# qa-watchdog.sh — schooltest-m2-auth
# Keeps the api (:5500) + web (:3100) alive via their detected run paths, and runs the
# stuck-checker on .qa/STATE.json (11-50 tasks band: 600/600/1200).
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; QA="$ROOT/.qa"
API_DIR="$ROOT/../schooltest-api";   API_CMD="pnpm dev"
WEB_DIR="$ROOT";                     WEB_CMD="pnpm exec next dev -p 3100"
INTERVAL=60; CHECK_EVERY=600; STALL_LIMIT=600; HARD_STALL=1200
up()  { curl -sf -o /dev/null --max-time 5 "http://localhost:$1/api/health" 2>/dev/null || curl -sf -o /dev/null --max-time 5 "http://localhost:$1" 2>/dev/null; }
log() { echo "$(date '+%F %T') $*" >> "$QA/watchdog.log"; }
start(){ ( cd "$2" && nohup bash -lc "$3" >> "$QA/$4" 2>&1 & ); log "restarted $1"; }
stale_task() {
  QA_DIR="$QA" HARD="$HARD_STALL" node -e '
    const fs=require("fs"); const p=process.env.QA_DIR+"/STATE.json";
    if(!fs.existsSync(p)) process.exit(0);
    const s=JSON.parse(fs.readFileSync(p,"utf8"));
    const now=Date.now()/1000; let changed=false;
    (s.tasks||[]).forEach(t=>{
      if(t.status==="DOING" && t.started_at && (now - t.started_at) > HARD) {
        t.status="BLOCKED";
        t.evidence=(t.evidence||"")+" | auto-unstuck by watchdog";
        changed=true;
      }
    });
    if(changed) fs.writeFileSync(p, JSON.stringify(s,null,2));
  ' 2>>"$QA/watchdog.log"
}
log "watchdog started"
while true; do
  curl -sf -o /dev/null --max-time 5 "http://localhost:5500/api/health" || start api "$API_DIR" "$API_CMD" api.log
  curl -sf -o /dev/null --max-time 5 "http://localhost:3100" || start web "$WEB_DIR" "$WEB_CMD" frontend.log
  since_check=$(( ${since_check:-0} + INTERVAL ))
  if [ "$since_check" -ge "$CHECK_EVERY" ]; then
    since_check=0
    if [ -f "$QA/heartbeat" ]; then
      last=$(stat -c %Y "$QA/heartbeat" 2>/dev/null || stat -f %m "$QA/heartbeat")
      age=$(( $(date +%s) - last ))
      if [ "$age" -gt "$HARD_STALL" ]; then
        log "HARD STALL: no heartbeat ${age}s — forcing unstick"; stale_task
      elif [ "$age" -gt "$STALL_LIMIT" ]; then
        log "SOFT STALL: no heartbeat ${age}s"
      fi
    fi
  fi
  sleep "$INTERVAL"
done
