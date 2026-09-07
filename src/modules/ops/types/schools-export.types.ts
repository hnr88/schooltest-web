import type {
  OPS_SCHOOLS_EXPORT_SORTS,
  OPS_SCHOOL_SECTORS,
  OPS_SCHOOL_STATES,
  PORTAL_SCHOOL_PLANS,
  PORTAL_SCHOOL_STATUSES,
} from '@/modules/ops/constants/schools-export.constants';
import type { SchoolOnboardingStatus } from '@/modules/school-admin';

export type PortalSchoolStatus = (typeof PORTAL_SCHOOL_STATUSES)[number];
export type PortalSchoolPlan = (typeof PORTAL_SCHOOL_PLANS)[number];
export type OpsSchoolState = (typeof OPS_SCHOOL_STATES)[number];
export type OpsSchoolSector = (typeof OPS_SCHOOL_SECTORS)[number];
export type OpsSchoolsExportSort = (typeof OPS_SCHOOLS_EXPORT_SORTS)[number];

/**
 * C-OPS-PORTAL-009 request scope. Every key is optional: an absent key is an
 * absent filter, and `documentIds` is an EXPLICIT selection that is never sent
 * empty — an empty selection is a 400, never "export everything".
 */
export interface OpsSchoolsExportScope {
  q?: string;
  status?: PortalSchoolStatus;
  onboarding?: SchoolOnboardingStatus;
  state?: OpsSchoolState;
  sector?: OpsSchoolSector;
  plan?: PortalSchoolPlan;
  sort?: OpsSchoolsExportSort;
  documentIds?: string[];
}

/** The downloaded document plus the filename the server chose for the scope. */
export interface OpsSchoolsExportFile {
  filename: string;
  csv: string;
}

export interface OpsPortalExportsProps {
  /**
   * Rows an enclosing selection table has ticked. When present it REPLACES the
   * selection carried in the URL; an empty array means "nothing selected", so
   * the filter scope is exported instead of silently exporting every tenant.
   */
  selectedDocumentIds?: readonly string[];
}
