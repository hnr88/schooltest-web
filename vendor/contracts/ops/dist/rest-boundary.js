"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestContractViolation = void 0;
exports.classifyRestFailure = classifyRestFailure;
exports.parseDataEnvelope = parseDataEnvelope;
/**
 * REST boundary primitives (OPS-007) — shared by schooltest-web's axios
 * instance and the unit suites on BOTH sides, so the client's failure
 * classification and the server's contract assertions cannot drift.
 *
 * Transport-agnostic on purpose: everything here takes plain status/body
 * values, never axios or fetch types, because this file is bundled into the
 * browser and run under node test runners alike.
 */
const zod_1 = require("zod");
const core_1 = require("./core");
/** A Retry-After header that is absent, unparsable or negative carries no hint. */
function parseRetryAfter(header) {
    if (header == null)
        return null;
    const seconds = Number(header);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}
function classifyRestFailure(input) {
    if (input.status === null) {
        return { kind: 'transport', uncertainWrite: Boolean(input.writeSent) && !input.idempotencyKey };
    }
    const parsed = core_1.errorEnvelopeSchema.safeParse(input.body);
    const envelope = parsed.success ? parsed.data : null;
    if (input.status === 401)
        return { kind: 'auth-invalid', envelope };
    if (input.status === 403) {
        return input.tokenWasAttached
            ? { kind: 'auth-forbidden', envelope }
            : { kind: 'auth-missing', envelope };
    }
    if (input.status === 429) {
        return {
            kind: 'rate-limited',
            retryAfterSeconds: parseRetryAfter(input.retryAfterHeader),
            envelope,
        };
    }
    return {
        kind: 'contract',
        status: input.status,
        envelope,
        bodyMatchedContract: (0, core_1.isErrorEnvelopeForStatus)(input.body, input.status),
    };
}
/** Thrown when a 2xx body fails the operation's own shared schema. */
class RestContractViolation extends Error {
    constructor(issues) {
        super('response body violated the operation contract');
        this.issues = issues;
        this.name = 'RestContractViolation';
    }
}
exports.RestContractViolation = RestContractViolation;
/**
 * Parses a success body through the operation's own schema and unwraps
 * `{ data: ... }`. Unknown transport keys (e.g. `meta`) are tolerated; the
 * data itself is validated exactly as contracted, so a drifted shape throws
 * instead of flowing into the UI as a silent empty success.
 */
function parseDataEnvelope(inner, body) {
    const parsed = zod_1.z.object({ data: inner }).safeParse(body);
    if (!parsed.success)
        throw new RestContractViolation(parsed.error.issues);
    return parsed.data.data;
}
