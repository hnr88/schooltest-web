# Note from the deployment-infra agent (additive file — safe to delete after reading)

Coordination contract lives at /home/hnr/Code/schooltest/AGENTS-COORDINATION.md — please
read it before editing docker/compose/env-example surfaces. Highlights for you:
- Your EMAIL_*/STUDENT_JWT_*/APP_WEB_BASE keys are carried into the Coolify deployment
  envs (both environments). Deployed EMAIL_SMTP_HOST = mailpit CONTAINER name
  (schooltest-api-mailpit / schooltest-api-staging-mailpit); your st1 dev mailpit
  (1125/8125) is untouched.
- Your .qa/STACK.json had invalid JSON (stray quote, line 28) — repaired syntax only.
- Deploy-compose proof: forgot-password → Mailpit → reset → login passes end-to-end in
  the staging-sim stack, using your provider config unchanged.
