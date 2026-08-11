import { expect, type APIRequestContext } from '@playwright/test';

import { runSql } from './auth-db';
import { API_BASE } from './teacher-auth-rail';
import { closeSession } from './teacher-past-sessions-api';

// Task 037 — the join half of the live-monitoring harness (C-SJ-1 + C-2), split
// from teacher-live-monitor-api.ts for the 200-line file rule. Everything here
// drives the REAL student endpoints: a tile only reaches `joined`/`in_progress`
// because a student really joined and really answered.

/** Roster emails for a class, straight out of Postgres (student row or linked user). */
export function rosterEmails(classDocumentId: string): string[] {
  const rows = runSql(
    `select coalesce(s.email, u.email) from students s
       join students_class_lnk scl on scl.student_id = s.id
       join classes c on c.id = scl.class_id
       left join students_user_lnk sul on sul.student_id = s.id
       left join up_users u on u.id = sul.user_id
      where c.document_id = '${classDocumentId}' and s.status = 'active'
      order by s.family_name`,
  );
  return rows
    .split('\n')
    .map((row) => row.trim())
    .filter((row) => row.length > 0);
}

export interface JoinedStudent {
  studentJwt: string;
  sessionDocumentId: string;
  studentDocumentId: string;
  displayName: string;
}

interface JoinBody {
  jwt?: string;
  student?: { documentId: string; firstName: string; lastName: string };
  session?: { document_id: string };
  error?: { status: number; details?: { sessions?: { document_id: string }[] } };
}

async function postJoin(
  request: APIRequestContext,
  code: string,
  email: string,
): Promise<{ status: number; body: JoinBody }> {
  const response = await request.post(`${API_BASE}/api/sittings/join-by-email`, {
    data: { code, email },
  });
  return { status: response.status(), body: (await response.json()) as JoinBody };
}

/** The open sitting that holds a session, so a 409 can be cleared the real way. */
function sittingHoldingSession(sessionDocumentId: string): string {
  return runSql(
    `select si.document_id from sittings si
       join sittings_sessions_lnk l on l.sitting_id = si.id
       join sessions s on s.id = l.session_id
      where s.document_id = '${sessionDocumentId}'`,
  ).trim();
}

/**
 * C-SJ-1 — a REAL join, the same call the desktop app makes. A student who still
 * holds a session on an earlier sitting answers the documented
 * 409 `active session exists`; that is cleared by CLOSING that earlier sitting
 * through C-TS-4 (which terminates its in-flight sessions) and re-joining — never
 * by editing a row. Returns the student's own JWT so the spec can drive a real
 * response afterwards.
 */
export async function joinAsStudent(
  request: APIRequestContext,
  teacherJwt: string,
  code: string,
  email: string,
): Promise<JoinedStudent> {
  let attempt = await postJoin(request, code, email);
  if (attempt.status === 409) {
    const held = attempt.body.error?.details?.sessions?.[0]?.document_id;
    expect(held, '409 without the blocking session in details').toBeTruthy();
    await closeSession(request, teacherJwt, sittingHoldingSession(held ?? ''));
    attempt = await postJoin(request, code, email);
  }
  expect(attempt.status, `POST /api/sittings/join-by-email ${email}`).toBe(200);
  const { jwt, student, session } = attempt.body;
  expect(jwt && session && student, 'join 200 without jwt/session/student').toBeTruthy();
  return {
    studentJwt: jwt ?? '',
    sessionDocumentId: session?.document_id ?? '',
    studentDocumentId: student?.documentId ?? '',
    displayName: `${student?.firstName ?? ''} ${(student?.lastName ?? '').slice(0, 1)}.`,
  };
}

interface SessionState {
  next?: {
    item_code: string;
    stimulus?: { options?: { id: string }[] };
  };
}

/**
 * One real answer through the student's own delivery endpoints (C-2), which is
 * what moves a tile from `joined` to `in_progress`: the state derives from real
 * `responses` rows, so the spec creates one instead of faking a state.
 */
export async function answerFirstItem(
  request: APIRequestContext,
  student: JoinedStudent,
): Promise<void> {
  const headers = { Authorization: `Bearer ${student.studentJwt}` };
  const stateResponse = await request.get(
    `${API_BASE}/api/sessions/${student.sessionDocumentId}`,
    { headers },
  );
  expect(stateResponse.status(), 'GET /api/sessions/:documentId').toBe(200);
  const next = ((await stateResponse.json()) as SessionState).next;
  const optionId = next?.stimulus?.options?.[0]?.id;
  expect(next?.item_code && optionId, 'no mc item served to the joined student').toBeTruthy();

  const presentedAt = new Date(Date.now() - 20_000).toISOString();
  const answer = await request.post(
    `${API_BASE}/api/sessions/${student.sessionDocumentId}/responses`,
    {
      headers,
      data: {
        item_code: next?.item_code,
        raw_response: { option_id: optionId },
        presented_at: presentedAt,
        responded_at: new Date().toISOString(),
      },
    },
  );
  expect(answer.status(), 'POST /api/sessions/:documentId/responses').toBe(200);
}
