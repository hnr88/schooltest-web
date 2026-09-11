/**
 * seed-demo-school.mjs — seed ONE fully-populated demo school PLUS four state
 * probe schools into the LIVE dev API (no restarts, no DB writes, TypeScript
 * API routes only), so every ops + school-admin UI flow — including the ops
 * schools-list state/sector/plan/status/onboarding filter pills — has data.
 *
 * Run:  node scripts/seed-demo-school.mjs
 * Env:  SEED_API_URL (default http://localhost:5500)
 *       SEED_MAILPIT_URL (default http://127.0.0.1:8125)
 *       SEED_OPS_EMAIL / SEED_OPS_PASSWORD (default admin@schooltest.local / Admin1234!)
 *       SEED_STAFF_PASSWORD (default Demo!Passw0rd) — every created account
 *       SEED_SCHOOL_NAME / SEED_PROBE_PREFIX — name overrides
 *
 * IDEMPOTENT: any school whose exact name already exists ("Seeded Demo School
 * <yyyymmdd>", "State Probe <yyyymmdd> — <STATE>") is skipped individually, so
 * a partial run resumes without duplicating anything.
 *
 * DEMO SCHOOL ORDER (dependencies matter):
 *   1. school        POST /api/schools              (versioned create, standard/active)
 *   2. seats         PUT  /api/schools/:id/entitlement { seats_total }
 *   3. admin #2      ops admin-invitation -> Mailpit token -> invitation accept
 *                    (MUST precede the wizard: invitation accept refuses a
 *                    second active school_admin with 409 once one exists)
 *   4. onboarding    onboarding-link -> POST /api/school-onboarding/:token/complete
 *                    (creates school admin #1 the way the wizard does; flips
 *                    onboarding_status to 'submitted' — the furthest ANY API
 *                    route reaches; nothing writes 'complete')
 *   5. teachers x4   teacher-invitations -> Mailpit accept
 *                    (fallback: register + ops confirm/role/school)
 *   6. classes x3    POST /api/ops/schools/:id/classes + assign-teacher
 *   7. students x12  versioned CSV import per class (preview -> commit)
 *   8. result window (best-effort): POST result-windows bound to the classes
 *
 * STATUS REACHABILITY (derived portal_status the pills actually show):
 *   pending_setup  default after any create (onboarding not_started)
 *   suspended      POST /api/ops/schools/:id/suspend      (reversible: activate)
 *   archived       POST /api/ops/schools/:id/archive      (reversible: restore;
 *                  body { expected_updated_at } from the school detail)
 *   active/trial   UNREACHABLE — derivation demands onboarding_status 'complete'
 *                  and NO API route writes it (the wizard writes 'submitted').
 * Stored portal_status/portal_plan ARE settable at create, but the directory
 * derives status and only trusts stored portal_plan for the tier.
 */

const API = process.env.SEED_API_URL ?? 'http://localhost:5500';
const MAILPIT = process.env.SEED_MAILPIT_URL ?? 'http://127.0.0.1:8125';
const OPS_EMAIL = process.env.SEED_OPS_EMAIL ?? 'admin@schooltest.local';
const OPS_PASSWORD = process.env.SEED_OPS_PASSWORD ?? 'Admin1234!';
const STAFF_PASSWORD = process.env.SEED_STAFF_PASSWORD ?? 'Demo!Passw0rd';

const VERSION_HEADER = 'X-Ops-Portal-Version';
const VERSION = '1';

const today = new Date();
const stamp = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, '0'),
  String(today.getDate()).padStart(2, '0'),
].join('');
const SCHOOL_NAME = process.env.SEED_SCHOOL_NAME ?? `Seeded Demo School ${stamp}`;
const PROBE_PREFIX = process.env.SEED_PROBE_PREFIX ?? `State Probe ${stamp}`;

const log = (...a) => console.log(...a);
const die = (msg) => {
  console.error(`[seed] FATAL: ${msg}`);
  process.exit(1);
};

/** fetch + JSON envelope unwrap; non-2xx throws with the response body quoted. */
async function call(method, path, { token, body, headers = {}, raw = false, versioned = true } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(versioned ? { [VERSION_HEADER]: VERSION } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} -> HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  if (raw) return { status: res.status, text, headers: res.headers };
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${method} ${path}: expected JSON, got: ${text.slice(0, 200)}`);
  }
}

const data = (json) => (json && typeof json === 'object' && 'data' in json ? json.data : json);

async function login(email, password) {
  const json = await call('POST', '/api/auth/local', {
    body: { identifier: email, password },
    headers: {}, // no version header on the auth route
  });
  if (!json.jwt) throw new Error(`login ${email}: no jwt in response`);
  return json.jwt;
}

/* ------------------------------------------------------------------ *
 * Mailpit probe: real invite emails, read back over the HTTP API.     *
 * ------------------------------------------------------------------ */
const MAILPIT_API = `${MAILPIT}/api/v1`;

async function mailpitReachable() {
  try {
    const res = await fetch(`${MAILPIT_API}/messages?limit=1`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Poll Mailpit for the invite email to <email> and return its /invite/<token>. */
async function pollInviteToken(email, attempts = 20, delayMs = 500) {
  for (let i = 0; i < attempts; i += 1) {
    await new Promise((r) => setTimeout(r, delayMs));
    const search = await (await fetch(
      `${MAILPIT_API}/search?query=${encodeURIComponent(`to:${email}`)}&limit=10`,
    )).json();
    for (const hit of search.messages ?? []) {
      const msg = await (await fetch(`${MAILPIT_API}/message/${hit.ID}`)).json();
      const match = /\/(?:en\/)?invite\/([0-9a-f]{16,128})/i.exec(
        `${msg.HTML ?? ''}\n${msg.Text ?? ''}`,
      );
      if (match) return match[1];
    }
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * School + staff primitives                                           *
 * ------------------------------------------------------------------ */

async function listSchoolsByName(opsJwt, query) {
  const json = await call(
    'GET',
    `/api/ops/schools?pageSize=200&q=${encodeURIComponent(query)}`,
    { token: opsJwt },
  );
  return Array.isArray(json.data) ? json.data : [];
}

async function findSchoolByName(opsJwt, name) {
  const rows = await listSchoolsByName(opsJwt, name);
  return rows.find((row) => row.name === name) ?? null;
}

/** Versioned school create — the ONE entry point for demo + probe schools. */
async function createSchoolRecord(opsJwt, opts) {
  const json = await call('POST', '/api/schools', {
    token: opsJwt,
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    body: {
      name: opts.name,
      suburb: opts.suburb,
      state: opts.state,
      postcode: opts.postcode,
      sector: opts.sector,
      schoolType: 'secondary',
      contact_email: opts.contactEmail,
      contact_first_name: opts.contactFirstName,
      contact_last_name: opts.contactLastName,
      contact_name: `${opts.contactFirstName} ${opts.contactLastName}`,
      portal: { plan: opts.plan, status: opts.portalStatus ?? 'active', send_owner_invitation: false },
    },
  });
  const school = data(json);
  log(
    `[school] created: ${school.name} (${school.documentId}) state=${opts.state} plan=${opts.plan}`,
  );
  return school;
}

async function grantSeats(opsJwt, schoolDocumentId, seats = 500) {
  await call('PUT', `/api/schools/${schoolDocumentId}/entitlement`, {
    token: opsJwt,
    body: { seats_total: seats },
  });
}

/** Register + ops confirm + ops setRole + ops setSchool. Register mints an
 * UNCONFIRMED account and NO jwt (D-AUTH-1). Used as the fallback when the
 * Mailpit invitation path is unavailable. */
async function createStaffAccountDirect(opsJwt, person) {
  let userDocumentId = null;
  const reg = await fetch(`${API}/api/auth/local/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: person.email,
      email: person.email,
      password: person.password,
    }),
  });
  if (reg.ok) {
    const regJson = await reg.json();
    userDocumentId = regJson?.user?.documentId ?? null;
    if (!userDocumentId) throw new Error(`register ${person.email}: no user.documentId`);
    // register leaves confirmed=false -> every login would 400 until confirmed.
    await call('POST', `/api/ops/users/${userDocumentId}/confirm`, { token: opsJwt });
  } else {
    // Already seeded by an earlier partial run: converge on the existing row.
    const body = await reg.text();
    if (!/exist|confirmed/i.test(body)) {
      throw new Error(`register ${person.email} -> ${reg.status}: ${body.slice(0, 300)}`);
    }
    const found = await call('GET', `/api/ops/users?q=${encodeURIComponent(person.email)}&pageSize=5`, {
      token: opsJwt,
    });
    userDocumentId = (found.data ?? []).find((u) => u.email === person.email)?.documentId ?? null;
    if (!userDocumentId) throw new Error(`register ${person.email} failed and no existing user found`);
  }

  await call('POST', `/api/ops/users/${userDocumentId}/role`, {
    token: opsJwt,
    body: { role: person.role },
  });
  await call('POST', `/api/ops/users/${userDocumentId}/school`, {
    token: opsJwt,
    body: { schoolDocumentId: person.schoolDocumentId },
  });
  const jwt = await login(person.email, person.password);
  // PUT /api/users/me is granted to the parent role only; a 403 here means the
  // account keeps null names (still fully usable for login).
  await call('PUT', '/api/users/me', {
    token: jwt,
    body: { first_name: person.first_name, last_name: person.last_name },
  }).catch(() => {
    log(`    note: PUT /users/me refused for ${person.email} (grant is parent-only); names left null`);
  });
  return userDocumentId;
}

/** Invite one teacher/admin through the ops invitation route, then accept the
 * real invite link out of Mailpit. Returns the created user's documentId. */
async function createStaffViaInvitation(opsJwt, schoolDocumentId, person) {
  const kind = person.role === 'school_admin' ? 'admin-invitations' : 'teacher-invitations';
  const invitation = data(
    await call('POST', `/api/ops/schools/${schoolDocumentId}/${kind}`, {
      token: opsJwt,
      body: {
        first_name: person.first_name,
        last_name: person.last_name,
        email: person.email,
        message: 'Seeded demo staff account — ignore.',
      },
    }),
  );
  const token = await pollInviteToken(person.email);
  if (!token) throw new Error(`no invite email found in Mailpit for ${person.email}`);
  await call('POST', `/api/invitations/${token}/accept`, {
    body: {
      password: person.password,
      first_name: person.first_name,
      last_name: person.last_name,
    },
    headers: {}, // guest route; token in path is the credential
  });
  // The accept body's shape varies; the ops users list is the stable lookup.
  const found = await call(
    'GET',
    `/api/ops/users?q=${encodeURIComponent(person.email)}&pageSize=5`,
    { token: opsJwt },
  );
  const userDocumentId =
    (found.data ?? []).find((u) => u.email === person.email)?.documentId ?? null;
  log(
    `    invited+accepted ${person.role} ${person.first_name} ${person.last_name} ` +
      `(invitation ${invitation.documentId}, user ${userDocumentId ?? 'NOT FOUND'})`,
  );
  return userDocumentId;
}

async function createStaffMember(opsJwt, schoolDocumentId, person) {
  if (await mailpitReachable()) {
    try {
      return await createStaffViaInvitation(opsJwt, schoolDocumentId, person);
    } catch (err) {
      log(`    invitation path failed for ${person.email} (${err.message}); direct create`);
    }
  }
  return createStaffAccountDirect(opsJwt, person);
}

/* ------------------------------------------------------------------ *
 * Demo school                                                         *
 * ------------------------------------------------------------------ */

async function completeOnboarding(opsJwt, school, admin, address) {
  const link = data(
    await call('POST', `/api/schools/${school.documentId}/onboarding-link`, {
      token: opsJwt,
      body: {
        first_name: admin.first_name,
        last_name: admin.last_name,
        contact_email: admin.email,
      },
    }),
  );
  if (!link?.token) throw new Error('onboarding-link returned no token');
  const completed = await call('POST', `/api/school-onboarding/${link.token}/complete`, {
    body: {
      // The wizard allow-lists these school keys and PATCHES them onto the
      // school — they must be THIS school's facts, or a WA probe turns NSW.
      payload: { school: { name: school.name, ...address } },
      provenance: { seeded_by: 'schooltest-web/scripts/seed-demo-school.mjs' },
      admin: {
        first_name: admin.first_name,
        last_name: admin.last_name,
        email: admin.email,
        password: admin.password,
      },
      teachers: [],
    },
    headers: {}, // guest route; token in path is the credential
  });
  log(
    `[3] onboarding completed via wizard API: admin ${admin.first_name} ${admin.last_name} <${admin.email}> (onboarding_status now submitted)`,
  );
  return data(completed);
}

async function seedDemoSchool(opsJwt) {
  let school = await findSchoolByName(opsJwt, SCHOOL_NAME);
  const credentials = [];
  if (school) {
    log(`[seed] school "${SCHOOL_NAME}" already exists (${school.documentId}) — skipping creation`);
  } else {
    school = await createSchoolRecord(opsJwt, {
      name: SCHOOL_NAME,
      suburb: 'Marrickville',
      state: 'NSW',
      postcode: '2204',
      sector: 'government',
      plan: 'standard',
      portalStatus: 'active',
      contactEmail: `seed-owner-${stamp}@demo.schooltest.local`,
      contactFirstName: 'Ada',
      contactLastName: 'Nguyen',
    });
    await grantSeats(opsJwt, school.documentId, 500);
    log('[2] entitlement: seats_total=500');

    // Admin #2 FIRST (invitation accept), then the wizard's admin #1 — the
    // accept-time gate refuses a second active school_admin, so order matters.
    const adminB = {
      role: 'school_admin',
      kind: 'school_admin',
      first_name: 'Hugo',
      last_name: 'Marsh',
      email: `seed-admin-b-${stamp}@demo.schooltest.local`,
      password: STAFF_PASSWORD,
    };
    adminB.documentId = await createStaffMember(opsJwt, school.documentId, adminB);
    log('[3a] admin #2 ready: Hugo Marsh');
    credentials.push(adminB);

    const adminA = {
      role: 'school_admin',
      kind: 'school_admin',
      first_name: 'Ada',
      last_name: 'Nguyen',
      email: `seed-admin-a-${stamp}@demo.schooltest.local`,
      password: STAFF_PASSWORD,
    };
    await completeOnboarding(opsJwt, school, adminA, {
      suburb: 'Marrickville',
      state: 'NSW',
      postcode: '2204',
      sector: 'government',
    });
    credentials.push(adminA);

    // The onboarding-link send flips account_status to 'invited'; every student
    // write is gated on account_status 'active' (SCHOOL_INACTIVE 403). Patch it
    // back through the UNVERSIONED school patch — the versioned one rejects
    // lifecycle keys by contract (PATCH_REJECTED_LIFECYCLE_KEYS).
    await call('PATCH', `/api/schools/${school.documentId}`, {
      token: opsJwt,
      body: { account_status: 'active' },
      versioned: false,
    });
    log('[3b] account_status patched back to active (student seat gate requires it)');

    const teacherRoster = [
      { first: 'Tara', last: 'Okonkwo' },
      { first: 'Daniel', last: 'Whitfield' },
      { first: 'Mei-Ling', last: 'Chen' },
      { first: 'Sam', last: 'Patel' },
    ];
    for (const t of teacherRoster) {
      const person = {
        role: 'teacher',
        kind: 'teacher',
        first_name: t.first,
        last_name: t.last,
        email: `seed-${t.first.toLowerCase().replace(/[^a-z]/g, '')}-${stamp}@demo.schooltest.local`,
        password: STAFF_PASSWORD,
        schoolDocumentId: school.documentId,
      };
      const userDocumentId = await createStaffMember(opsJwt, school.documentId, person);
      if (userDocumentId) person.documentId = userDocumentId;
      credentials.push(person);
    }
    await seedClassesStudentsWindow(opsJwt, school);
  }

  const counts = await schoolCounts(opsJwt, school.documentId);
  return { school, credentials, counts };
}

/* ------------------------------------------------------------------ *
 * Classes / students / result window for the demo school              *
 * ------------------------------------------------------------------ */

async function seedClassesStudentsWindow(opsJwt, school) {
  const teachers = await call(
    'GET',
    `/api/ops/users?school=${school.documentId}&role=teacher&pageSize=200`,
    { token: opsJwt },
  );
  const teacherRows = (teachers.data ?? []).slice(0, 3);
  if (teacherRows.length < 3) die('need at least 3 teacher accounts to staff 3 classes');

  const plans = [
    { name: `7A ${stamp}`, year_band: 'Year 7', year: 7, teacher: teacherRows[0] },
    { name: `8B ${stamp}`, year_band: 'Year 8', year: 8, teacher: teacherRows[1] },
    { name: `9C ${stamp}`, year_band: 'Year 9', year: 9, teacher: teacherRows[2] },
  ];
  const classes = [];
  for (const plan of plans) {
    const created = data(
      await call('POST', `/api/ops/schools/${school.documentId}/classes`, {
        token: opsJwt,
        body: { name: plan.name, year_band: plan.year_band },
      }),
    );
    await call('POST', `/api/ops/classes/${created.documentId}/assign-teacher`, {
      token: opsJwt,
      body: { teacher_documentIds: [plan.teacher.documentId] },
    });
    log(`[5] class ${plan.name} created, primary teacher ${plan.teacher.first_name ?? plan.teacher.email}`);
    classes.push({ ...created, year: plan.year });
  }

  const STUDENT_FIRST = [
    'Amara', 'Billy', 'Chi', 'Dara', 'Ethan', 'Fatima',
    'Gus', 'Hana', 'Igor', 'Jade', 'Kofi', 'Linh',
  ];
  const STUDENT_LAST = [
    'Okafor', 'Reeve', 'Tran', 'Sharma', 'Kowalski', 'Haddad',
    'Bergman', 'Sato', 'Petrov', 'Ngata', 'Mensah', 'Vo',
  ];
  const LANGUAGES = [
    'english', 'arabic', 'vietnamese', 'mandarin',
    'english', 'other', 'english', 'arabic',
    'vietnamese', 'english', 'other', 'english',
  ];
  const header = 'given name,family name,date of birth,year level,home language';
  let imported = 0;

  for (const [index, klass] of classes.entries()) {
    const firsts = STUDENT_FIRST.slice(index * 4, index * 4 + 4);
    const lasts = STUDENT_LAST.slice(index * 4, index * 4 + 4);
    const langs = LANGUAGES.slice(index * 4, index * 4 + 4);
    // Birth years for the class's year level: year 7 in 2026 -> ~12yo -> 2014.
    const birthYear = today.getFullYear() - (klass.year + 5);
    const dobs = firsts.map((_, i) => `${birthYear}-0${(i % 9) + 1}-1${(i % 2) + 4}`);
    const csv = [
      header,
      ...firsts.map((g, i) => `${g},${lasts[i]},${dobs[i]},${klass.year},${langs[i]}`),
    ].join('\n');

    // Preview first (contract: the only place rejection reasons are cheap).
    const preview = data(
      await call('POST', `/api/ops/schools/${school.documentId}/import-students/preview`, {
        token: opsJwt,
        body: { csv, class_documentId: klass.documentId },
      }),
    );
    log(
      `[6] preview ${klass.name}: would create=${Array.isArray(preview?.create) ? preview.create.length : '?'} ` +
        `reject=${JSON.stringify(preview?.reject ?? [])}`,
    );

    const commit = data(
      await call('POST', `/api/ops/schools/${school.documentId}/import-students/commit`, {
        token: opsJwt,
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: { csv, class_documentId: klass.documentId },
      }),
    );
    const createdCount = Array.isArray(commit?.created) ? commit.created.length : commit?.created;
    log(
      `[6] import into ${klass.name}: created=${createdCount ?? '?'} ` +
        `rejected=${JSON.stringify(commit?.rejected ?? [])}`,
    );
    imported += typeof createdCount === 'number' ? createdCount : 0;
  }
  log(`[seed] students imported: ${imported}`);

  // Best-effort result window bound to all three classes. Seeded forms can
  // carry submitted sessions (409), so walk candidates until one schedules.
  try {
    const formsJson = await call('GET', '/api/forms?pagination[pageSize]=100', { token: opsJwt });
    const forms = (Array.isArray(formsJson.data) ? formsJson.data : []).map((f) => f.attributes ?? f);
    const byPreference = (f) =>
      ((f.skill === 'reading' ? 0 : 1) * 10 + (f.mode === 'progress' ? 0 : 1));
    const candidates = [...forms].sort((a, b) => byPreference(a) - byPreference(b));
    if (candidates.length === 0) throw new Error('no seeded forms found to bind');
    const opens = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const closes = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    let windowRow = null;
    let lastError = 'no candidates';
    for (const form of candidates) {
      try {
        windowRow = data(
          await call('POST', `/api/ops/schools/${school.documentId}/result-windows`, {
            token: opsJwt,
            body: {
              title: `Seeded window ${stamp}`,
              class_documentIds: classes.map((c) => c.documentId),
              forms: [{ skill: form.skill ?? 'reading', form_documentId: form.documentId }],
              opens_at: opens,
              closes_at: closes,
              // The server validates via new Intl.DateTimeFormat(tz) — a LOCALE
              // parse, so real zone names like 'Australia/Sydney' 400; the
              // API's own specs use 'UTC'.
              timezone: 'UTC',
            },
          }),
        );
        log(`[7] result window "${windowRow.documentId}" created across ${classes.length} classes (form ${form.form_code ?? form.documentId})`);
        break;
      } catch (err) {
        lastError = err.message;
        if (!/409|submitted sessions/.test(err.message)) throw err;
      }
    }
    if (!windowRow) log(`[7] result window SKIPPED: ${lastError}`);
  } catch (err) {
    log(`[7] result window SKIPPED: ${err.message}`);
  }
}

/* ------------------------------------------------------------------ *
 * State probe schools — food for the ops list filter pills            *
 * ------------------------------------------------------------------ */

const PROBE_BLUEPRINTS = [
  { state: 'NSW', sector: 'government',     plan: 'pilot',    endgame: null },
  { state: 'VIC', sector: 'catholic',       plan: 'standard', endgame: 'suspend' },
  { state: 'QLD', sector: 'non-government', plan: 'pilot',    endgame: 'archive' },
  { state: 'WA',  sector: 'government',     plan: 'standard', endgame: 'complete' },
];

/** If-Match wants an ETag-style QUOTED timestamp, e.g. "2026-09-05T09:00:00.000Z". */
const quoted = (value) => JSON.stringify(value);

async function suspendSchool(opsJwt, schoolDocumentId) {
  const detail = data(await call('GET', `/api/ops/schools/${schoolDocumentId}`, { token: opsJwt }));
  await call('POST', `/api/ops/schools/${schoolDocumentId}/suspend`, {
    token: opsJwt,
    body: {},
    headers: { 'If-Match': quoted(detail.updatedAt) },
  });
  log(`[probe] ${detail.name} SUSPENDED (status pill: suspended; undo = activate)`);
}

/** Archive demands optimistic concurrency: the school's current updatedAt,
 * quoted twice — If-Match header AND expected_updated_at body. */
async function archiveSchool(opsJwt, schoolDocumentId) {
  const detail = data(await call('GET', `/api/ops/schools/${schoolDocumentId}`, { token: opsJwt }));
  await call('POST', `/api/ops/schools/${schoolDocumentId}/archive`, {
    token: opsJwt,
    body: { expected_updated_at: detail.updatedAt },
    headers: { 'If-Match': quoted(detail.updatedAt) },
  });
  log(`[probe] ${detail.name} ARCHIVED (status pill: archived; undo = restore)`);
}

async function seedProbeSchools(opsJwt) {
  const probes = [];
  for (const bp of PROBE_BLUEPRINTS) {
    const name = `${PROBE_PREFIX} — ${bp.state}`;
    let school = await findSchoolByName(opsJwt, name);
    if (school) {
      log(`[probe] "${name}" already exists (${school.documentId}) — skipping creation`);
      // Converge a partial run: an endgame that failed after creation is applied
      // here, guarded by the status the directory actually derives.
      const current = data(await call('GET', `/api/ops/schools/${school.documentId}`, { token: opsJwt }));
      if (bp.endgame === 'suspend' && current.portal_status !== 'suspended') {
        await suspendSchool(opsJwt, school.documentId);
      }
      if (bp.endgame === 'archive' && current.portal_status !== 'archived') {
        await archiveSchool(opsJwt, school.documentId);
      }
    } else {
      school = await createSchoolRecord(opsJwt, {
        name,
        suburb: `Probe ${bp.state}`,
        state: bp.state,
        postcode: '0000',
        sector: bp.sector,
        plan: bp.plan,
        portalStatus: 'active',
        contactEmail: `seed-probe-${bp.state.toLowerCase()}-${stamp}@demo.schooltest.local`,
        contactFirstName: 'Probe',
        contactLastName: bp.state,
      });

      if (bp.endgame === 'complete') {
        // WA: straight to the wizard's final state — onboarding 'submitted',
        // and the admin comes from the wizard itself (named + confirmed).
        const admin = {
          first_name: 'Quinn',
          last_name: `Allan`,
          email: `seed-probe-wa-admin-${stamp}@demo.schooltest.local`,
          password: STAFF_PASSWORD,
        };
        await completeOnboarding(opsJwt, school, admin, {
          suburb: `Probe ${bp.state}`,
          state: bp.state,
          postcode: '0000',
          sector: bp.sector,
        });
      } else {
        const person = {
          role: 'school_admin',
          first_name: 'Probe',
          last_name: `Admin ${bp.state}`,
          email: `seed-probe-${bp.state.toLowerCase()}-admin-${stamp}@demo.schooltest.local`,
          password: STAFF_PASSWORD,
          schoolDocumentId: school.documentId,
        };
        await createStaffMember(opsJwt, school.documentId, person);

        if (bp.endgame === 'suspend') {
          await suspendSchool(opsJwt, school.documentId);
        }
        if (bp.endgame === 'archive') {
          await archiveSchool(opsJwt, school.documentId);
        }
      }
    }
    probes.push({ blueprint: bp, name, school });
  }
  return probes;
}

/* ------------------------------------------------------------------ *
 * Report — per-school facts + live filter-pill verification           *
 * ------------------------------------------------------------------ */

async function schoolCounts(opsJwt, schoolDocumentId) {
  const [detail, admins, teachers, classes, students] = await Promise.all([
    call('GET', `/api/ops/schools/${schoolDocumentId}`, { token: opsJwt }),
    call('GET', `/api/ops/users?school=${schoolDocumentId}&role=school_admin&pageSize=200`, { token: opsJwt }),
    call('GET', `/api/ops/users?school=${schoolDocumentId}&role=teacher&pageSize=200`, { token: opsJwt }),
    call('GET', `/api/ops/schools/${schoolDocumentId}/classes?pageSize=200`, { token: opsJwt }),
    call('GET', `/api/ops/schools/${schoolDocumentId}/students?pageSize=200`, { token: opsJwt }),
  ]);
  const s = data(detail);
  return {
    detail: s,
    admins: admins?.meta?.pagination?.total ?? (admins.data ?? []).length,
    teachers: teachers?.meta?.pagination?.total ?? (teachers.data ?? []).length,
    classes: classes?.meta?.pagination?.total ?? (classes.data ?? []).length,
    students: students?.meta?.pagination?.total ?? (students.data ?? []).length,
  };
}

async function filteredCount(opsJwt, query) {
  const json = await call('GET', `/api/ops/schools?${query}&pageSize=200`, { token: opsJwt });
  return json?.meta?.pagination?.total ?? (json.data ?? []).length;
}

async function printReport(opsJwt, demo, probes) {
  const d = demo.counts.detail;
  log('\n===================== SEEDED SCHOOL SUMMARY =====================');
  log('  DEMO SCHOOL (fully populated)');
  log(`  name            : ${d.name}`);
  log(`  documentId      : ${d.documentId}`);
  log(`  state/sector    : ${d.state ?? 'NSW'} / ${d.sector ?? 'government'}`);
  log(`  plan            : ${d.portal_plan ?? d.plan}`);
  log(`  derived status  : ${d.portal_status}  (account=${d.account_status}, onboarding=${d.onboarding_status})`);
  log(`  admins/teachers : ${demo.counts.admins} / ${demo.counts.teachers}`);
  log(`  classes/students: ${demo.counts.classes} / ${demo.counts.students}`);
  log('\n  Credentials created (all use the same password):');
  log('  ----------------------------------------------------------------');
  log('  role         | name              | email');
  log('  ----------------------------------------------------------------');
  for (const cred of demo.credentials) {
    log(
      `  ${cred.kind.padEnd(12)} | ${(cred.first_name + ' ' + cred.last_name).padEnd(17)} | ${cred.email}`,
    );
  }
  log('  ----------------------------------------------------------------');
  log(`  password      : ${STAFF_PASSWORD}`);
  log(`  ops login     : ${OPS_EMAIL} / (existing ops credential)`);

  log('\n  STATE PROBE SCHOOLS (filter-pill food; clearly named for cleanup)');
  log('  ---------------------------------------------------------------------------------------');
  log('  school                                 | state | sector         | plan     | status        | admins');
  log('  ---------------------------------------------------------------------------------------');
  for (const probe of probes) {
    const counts = await schoolCounts(opsJwt, probe.school.documentId);
    const s = counts.detail;
    log(
      `  ${s.name.slice(0, 38).padEnd(38)} | ${String(s.state ?? probe.blueprint.state).padEnd(5)} | ` +
        `${String(s.sector ?? probe.blueprint.sector).padEnd(14)} | ${String(s.portal_plan ?? probe.blueprint.plan).padEnd(8)} | ` +
        `${String(s.portal_status).padEnd(13)} | ${counts.admins}`,
    );
  }
  log('  ---------------------------------------------------------------------------------------');

  log('\n  OPS SCHOOLS-LIST FILTER CHECK (live counts, X-Ops-Portal-Version: 1)');
  const filters = [
    ['state=NSW', 'state=NSW'],
    ['state=VIC', 'state=VIC'],
    ['state=QLD', 'state=QLD'],
    ['state=WA', 'state=WA'],
    ['plan=pilot', 'plan=pilot'],
    ['plan=standard', 'plan=standard'],
    ['status=pending_setup', 'status=pending_setup'],
    ['status=suspended', 'status=suspended'],
    ['status=archived', 'status=archived'],
    ['status=active', 'status=active'],
    ['onboarding=submitted', 'onboarding=submitted'],
    ['onboarding=complete', 'onboarding=complete'],
  ];
  for (const [label, query] of filters) {
    try {
      log(`    ?${label.padEnd(24)} -> ${await filteredCount(opsJwt, query)} school(s)`);
    } catch (err) {
      log(`    ?${label.padEnd(24)} -> ERROR: ${err.message.slice(0, 120)}`);
    }
  }
  log('=================================================================\n');
}

/** The accounts this seeder mints for today's stamp. Emails are deterministic,
 * so a SKIP run can still print the full credentials table. */
function expectedCredentials() {
  const rows = [
    ['school_admin', 'Ada Nguyen', `seed-admin-a-${stamp}@demo.schooltest.local`],
    ['school_admin', 'Hugo Marsh', `seed-admin-b-${stamp}@demo.schooltest.local`],
    ['teacher', 'Tara Okonkwo', `seed-tara-${stamp}@demo.schooltest.local`],
    ['teacher', 'Daniel Whitfield', `seed-daniel-${stamp}@demo.schooltest.local`],
    ['teacher', 'Mei-Ling Chen', `seed-meiling-${stamp}@demo.schooltest.local`],
    ['teacher', 'Sam Patel', `seed-sam-${stamp}@demo.schooltest.local`],
    ['school_admin', 'Probe Admin NSW', `seed-probe-nsw-admin-${stamp}@demo.schooltest.local`],
    ['school_admin', 'Probe Admin VIC', `seed-probe-vic-admin-${stamp}@demo.schooltest.local`],
    ['school_admin', 'Probe Admin QLD', `seed-probe-qld-admin-${stamp}@demo.schooltest.local`],
    ['school_admin', 'Quinn Allan (WA probe)', `seed-probe-wa-admin-${stamp}@demo.schooltest.local`],
  ];
  return rows.map(([kind, name, email]) => ({
    kind,
    first_name: name,
    last_name: '',
    email,
  }));
}

async function main() {
  log(`[seed] API=${API}  Mailpit=${MAILPIT}`);
  log(`[seed] demo school="${SCHOOL_NAME}"  probes="${PROBE_PREFIX} — <NSW|VIC|QLD|WA>"`);
  const opsJwt = await login(OPS_EMAIL, OPS_PASSWORD);
  log('[seed] ops login OK');

  const demo = await seedDemoSchool(opsJwt);
  const probes = await seedProbeSchools(opsJwt);
  if (demo.credentials.length === 0) demo.credentials = expectedCredentials();
  await printReport(opsJwt, demo, probes);
}

main().catch((err) => {
  console.error('[seed] FAILED:', err?.message ?? err);
  process.exit(1);
});
