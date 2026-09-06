import type { OpsActionDefinition, OpsActionTarget } from '@/modules/ops/actions';
import { fetchSchoolDetail } from '@/modules/ops/queries/use-school-detail.query';
import {
  archiveSchool,
  suspendSchool,
} from '@/modules/ops/queries/use-school-suspend.mutation';
import { fetchSchoolVersion } from '@/modules/ops/queries/use-school-version.query';

/**
 * Bulk Suspend / Archive for the schools directory (task 12 lifecycle, task 05
 * runner, task 07 selection). There is deliberately NO bulk endpoint: each
 * selected school goes through the SAME single-school lifecycle write the
 * detail panel uses — the server's one-transaction, FOR UPDATE-locked,
 * compare-and-swap path with the ledger audit row — so a bulk run inherits
 * exactly the guarantees (and the exact coded errors) of the single action.
 *
 * Honesty rules the runner enforces on top: every item is READ BACK through an
 * authorized detail read before it may count as success, an acknowledged write
 * that is not yet visible is `uncertain` (never success), and a school that is
 * already in the target state is INELIGIBLE rather than a fake win.
 */
async function currentStatus(documentId: string): Promise<string> {
  const detail = await fetchSchoolDetail(documentId);
  return detail.portal_status;
}

export const SUSPEND_SCHOOL_ACTION: OpsActionDefinition<OpsActionTarget> = {
  async perform(target) {
    const version = (await fetchSchoolVersion(target.documentId)).updatedAt;
    await suspendSchool({ schoolDocumentId: target.documentId, version });
  },
  async readBack(target) {
    return (await currentStatus(target.documentId)) === 'suspended';
  },
  async isEligible(target) {
    return (await currentStatus(target.documentId)) !== 'suspended';
  },
};

export const ARCHIVE_SCHOOL_ACTION: OpsActionDefinition<OpsActionTarget> = {
  async perform(target) {
    const version = (await fetchSchoolVersion(target.documentId)).updatedAt;
    await archiveSchool({ schoolDocumentId: target.documentId, version });
  },
  async readBack(target) {
    return (await currentStatus(target.documentId)) === 'archived';
  },
  async isEligible(target) {
    return (await currentStatus(target.documentId)) !== 'archived';
  },
};
