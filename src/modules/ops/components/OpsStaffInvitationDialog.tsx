'use client';

import { useTranslations } from 'next-intl';
import { MailX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { staffUsersResponseSchema } from '@schooltest/ops-contracts';

import {
  Alert,
  Button,
  Dialog,
  Input,
  Label,
  SelectField,
  Textarea,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Skeleton,
} from '@/modules/design-system';
import { useDebouncedValue } from '@/modules/dashboard';
import { strapi } from '@/lib/axios/strapi';
import { OpsStaffInvitationFilters } from '@/modules/ops/components/OpsStaffInvitationFilters';
import { OpsStaffInvitationRowActions } from '@/modules/ops/components/OpsStaffInvitationRowActions';
import { OpsStaffInvitationTable } from '@/modules/ops/components/OpsStaffInvitationTable';
import { useStaffInvitationsFilter } from '@/modules/ops/hooks/use-staff-invitations-filter';
import { useSchoolDetailQuery } from '@/modules/ops/queries/use-school-detail.query';
import {
  useInviteStaffMutation,
  type InviteStaffInput,
} from '@/modules/ops/queries/use-invite-school-admin.mutation';
import { useStaffInvitationsQuery } from '@/modules/ops/queries/use-staff-invitations.query';

import type { OpsStaffInvitationDialogProps } from '@/modules/ops/types/staff-invitations.types';

const EXISTS_CHECK_DEBOUNCE_MS = 400;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Task 25 (D-12) — the design's single "Full name" field splits on the LAST
 * space into the two required wire columns. A single token (no space at all)
 * fills BOTH: `last_name` is a NOT-NULL column and this is honest about it
 * rather than inventing a surname. Distinct from `splitStaffDisplayName`
 * (`@schooltest/ops-contracts`), which is the ACCOUNT EDITOR's lossless
 * inverse and deliberately never guesses a split — the two functions serve
 * different contracts with different nullability rules.
 */
export function splitInviteFullName(fullName: string): { first_name: string; last_name: string } {
  const trimmed = fullName.trim().replace(/\s+/g, ' ');
  if (trimmed === '') return { first_name: '', last_name: '' };
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace === -1) return { first_name: trimmed, last_name: trimmed };
  return { first_name: trimmed.slice(0, lastSpace), last_name: trimmed.slice(lastSpace + 1) };
}

/** D-05 — the comparison host comes from the school's `contact_email`; none stored means no host. */
export function inviteDomainHost(contactEmail: string | null | undefined): string | null {
  if (!contactEmail) return null;
  const host = contactEmail.split('@')[1]?.trim().toLowerCase();
  return host && host.length > 0 ? host : null;
}

export type InviteEmailError = 'required' | 'invalid' | 'exists' | null;

export interface InviteFormRules {
  emailError: InviteEmailError;
  outsideDomain: boolean;
  noName: boolean;
}

/**
 * `logic.md#v-invite` — the design's five rules, as one pure function so the
 * unit test can cover them without mounting the form. `alreadyHasAccess` is
 * the caller's OWN async pre-check result; `isEdit` exempts editing an
 * existing person from the "already has access" error, because the person
 * being edited already has access by definition.
 */
export function evaluateInviteForm(input: {
  email: string;
  fullName: string;
  isEdit: boolean;
  alreadyHasAccess: boolean;
  domainHost: string | null;
}): InviteFormRules {
  const email = input.email.trim();
  let emailError: InviteEmailError = null;
  if (email === '') emailError = 'required';
  else if (!EMAIL_RE.test(email)) emailError = 'invalid';
  else if (!input.isEdit && input.alreadyHasAccess) emailError = 'exists';

  let outsideDomain = false;
  if (emailError === null && input.domainHost) {
    const host = email.split('@')[1]?.toLowerCase() ?? '';
    outsideDomain = host !== input.domainHost;
  }

  return { emailError, outsideDomain, noName: input.fullName.trim() === '' };
}

// C-OPS-PORTAL-016 — the school's staff invitations, read apart from the user
// directory so its totals are its own. The pending rows here are what the
// pictured Admins/Teachers tabs show alongside accepted staff accounts; an
// accepted invitation is history, never a second active person.
export function OpsStaffInvitationDialog({
  schoolDocumentId,
  open,
  onOpenChange,
}: OpsStaffInvitationDialogProps) {
  const t = useTranslations('Ops.staffInvitations');
  const filter = useStaffInvitationsFilter(schoolDocumentId);
  const invitations = useStaffInvitationsQuery(filter.params, open);
  const pagination = invitations.data?.meta.pagination;
  // GAP-1 (task 15): one shared resend cooldown for the whole dialog — the
  // server keys it by school and invitation kind, so two rows cannot dodge
  // each other's window. A tick counts it down; every Resend stays disabled
  // while it is open.
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => setCooldownSeconds((value) => Math.max(value - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="ops-staff-invitations-dialog" className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <StaffInviteForm schoolDocumentId={schoolDocumentId} />

        <OpsStaffInvitationFilters
          role={filter.role}
          status={filter.status}
          onRoleChange={filter.chooseRole}
          onStatusChange={filter.chooseStatus}
        />

        {invitations.isPending ? (
          <div className="flex flex-col gap-2" data-slot="ops-staff-invitations-loading">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        ) : invitations.isError ? (
          <Alert variant="error" title={t('errorTitle')}>
            {t('errorDescription')}
          </Alert>
        ) : invitations.data.data.length === 0 ? (
          <EmptyState
            icon={MailX}
            tone="brand"
            title={filter.isFiltered ? t('emptyFilteredTitle') : t('emptyTitle')}
            description={filter.isFiltered ? t('emptyFilteredDescription') : t('emptyDescription')}
          />
        ) : (
          <OpsStaffInvitationTable
            rows={invitations.data.data}
            // "As of the read" — the query's own receipt timestamp, so the row
            // ages are a pure function of the data, not of when React rendered.
            nowMs={invitations.dataUpdatedAt}
            renderActions={(row) => (
              <OpsStaffInvitationRowActions
                row={row}
                cooldownSeconds={cooldownSeconds}
                onCooldown={setCooldownSeconds}
              />
            )}
          />
        )}

        {pagination ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-meta text-muted-foreground" data-slot="ops-staff-invitations-total">
              {t('summary', { total: pagination.total })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => filter.goToPage(Math.max(1, pagination.page - 1))}
              >
                {t('previous')}
              </Button>
              <span className="text-meta text-muted-foreground">
                {t('page', { page: pagination.page, pageCount: pagination.pageCount })}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pagination.page >= pagination.pageCount}
                onClick={() => filter.goToPage(pagination.page + 1)}
              >
                {t('next')}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

const BLANK: Omit<InviteStaffInput, 'schoolDocumentId' | 'first_name' | 'last_name'> & {
  fullName: string;
} = {
  role: 'teacher',
  fullName: '',
  email: '',
  message: '',
};

/**
 * The invite modal's form (`logic.md#v-invite`, design `:618–660`): the
 * design's single Full name field, a work email, an optional message, and
 * the role — CREATE mode only (admin/teacher). The design also draws a third
 * "Edit access — <name>" mode over the same fields; nothing in this row's
 * write set opens this form against an existing person (`OpsStaffUsersTable`,
 * a different row's file, already ships its own real "Edit access" role
 * dialog), so `evaluateInviteForm`'s `isEdit` branch is exercised only by the
 * unit test, not by a mounted trigger here — see this row's proof for detail.
 *
 * The outcome banner is the point of this component. The server reports
 * `delivery: 'sent' | 'failed'` because an invitation persists before its mail
 * is attempted, and a `failed` send is shown as a WARNING naming the address —
 * never a success tick. Reporting a green result on an invitation nobody
 * received is the failure the whole delivery outcome exists to prevent, and it
 * would be worse than not checking at all.
 */
function StaffInviteForm({ schoolDocumentId }: { schoolDocumentId: string }) {
  const t = useTranslations('Ops.staffInvitations');
  const tv = useTranslations('Ops.onboard.validation');
  const [values, setValues] = useState(BLANK);
  const invite = useInviteStaffMutation();
  const school = useSchoolDetailQuery(schoolDocumentId, true);
  const domainHost = inviteDomainHost(school.data?.contact_email);
  const schoolName = school.data?.name ?? '';

  const set = <K extends keyof typeof BLANK>(key: K, value: (typeof BLANK)[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  const trimmedEmail = values.email.trim();
  const debouncedEmail = useDebouncedValue(trimmedEmail, EXISTS_CHECK_DEBOUNCE_MS);
  const emailLooksValid = EMAIL_RE.test(debouncedEmail);
  // logic.md#v-invite — "already a known person on this school", checked
  // against the staff directory (`GET /ops/users?school=`), which already
  // exists. The server's own 409 on genuine conflict still governs: this is a
  // pre-check, not the source of truth.
  const existsCheck = useQuery({
    queryKey: ['ops', 'users', 'exists', schoolDocumentId, debouncedEmail],
    queryFn: async () => {
      const res = await strapi.get<unknown>('/api/ops/users', {
        params: { school: schoolDocumentId, q: debouncedEmail, pageSize: 5 },
        opsPortalVersioned: true,
      });
      const parsed = staffUsersResponseSchema.parse(res.data);
      return parsed.data.some((row) => row.email?.toLowerCase() === debouncedEmail);
    },
    enabled: emailLooksValid,
    staleTime: 15_000,
  });

  const rules = evaluateInviteForm({
    email: values.email,
    fullName: values.fullName,
    isEdit: false,
    alreadyHasAccess: existsCheck.data === true,
    domainHost,
  });

  const [serverConflict, setServerConflict] = useState(false);

  const submit = async () => {
    setServerConflict(false);
    try {
      const { first_name, last_name } = splitInviteFullName(values.fullName);
      const result = await invite.mutateAsync({
        schoolDocumentId,
        role: values.role,
        first_name,
        last_name,
        email: values.email,
        message: values.message,
      });
      // The draft is cleared only once the invitation actually exists. A failed
      // SEND still created one, so the operator resends by id rather than
      // retyping — and never by inviting the same person twice.
      setValues(BLANK);
      return result;
    } catch (error) {
      // The client pre-check cannot see everything: the server's 409 is still
      // rendered even when the pre-check passed.
      if (isAxiosError(error) && error.response?.status === 409) setServerConflict(true);
      return null;
    }
  };

  const roleTitle = values.role === 'school_admin' ? t('formTitleAdmin') : t('formTitleTeacher');
  const roleNote = values.role === 'school_admin' ? t('roleNoteAdmin') : t('roleNoteTeacher');
  const blocked = rules.emailError !== null;

  return (
    <form
      data-slot="ops-staff-invite-form"
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div>
        <h3 className="text-sm font-semibold text-foreground">{roleTitle}</h3>
        <p className="text-meta text-muted-foreground">
          {t('formSubtitle', { school: schoolName })}
        </p>
      </div>
      <SelectField
        id="ops-invite-role"
        label={t('inviteRoleLabel')}
        placeholder={t('inviteRoleLabel')}
        options={[
          { value: 'teacher', label: t('roleTeacher') },
          { value: 'school_admin', label: t('roleAdmin') },
        ]}
        value={values.role}
        onValueChange={(value) => set('role', value === 'school_admin' ? 'school_admin' : 'teacher')}
      />
      <div className="flex flex-col gap-1">
        <Label htmlFor="ops-invite-name">{t('inviteNameLabel')}</Label>
        {/* One Full name field, as pictured; D-12 splits it on submit. */}
        <Input
          id="ops-invite-name"
          value={values.fullName}
          autoComplete="off"
          onChange={(event) => set('fullName', event.target.value)}
        />
        {rules.noName ? (
          <p className="text-meta text-warning" data-slot="ops-invite-name-warning">
            {t('noNameWarning')}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="ops-invite-email">{t('inviteEmailLabel')}</Label>
        <Input
          id="ops-invite-email"
          type="email"
          required
          value={values.email}
          onChange={(event) => {
            setServerConflict(false);
            set('email', event.target.value);
          }}
        />
        {rules.emailError === 'required' ? (
          <p className="text-meta text-destructive" data-slot="ops-invite-email-error">
            {tv('required')}
          </p>
        ) : rules.emailError === 'invalid' ? (
          <p className="text-meta text-destructive" data-slot="ops-invite-email-error">
            {tv('emailInvalid')}
          </p>
        ) : rules.emailError === 'exists' ? (
          <p className="text-meta text-destructive" data-slot="ops-invite-email-error">
            {t('alreadyHasAccessError', { school: schoolName })}
          </p>
        ) : rules.outsideDomain ? (
          <p className="text-meta text-warning" data-slot="ops-invite-email-warning">
            {t('outsideDomainWarning', { domain: domainHost ?? '' })}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="ops-invite-message">{t('inviteMessageLabel')}</Label>
        <Textarea
          id="ops-invite-message"
          rows={3}
          value={values.message}
          onChange={(event) => set('message', event.target.value)}
        />
      </div>
      <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-meta text-muted-foreground">
        {roleNote}
      </div>

      {invite.data?.delivery === 'sent' ? (
        <Alert variant="success" title={t('inviteSentTitle')}>
          {t('inviteSentBody', { email: invite.data.email })}
        </Alert>
      ) : null}
      {invite.data?.delivery === 'failed' ? (
        <Alert variant="warning" title={t('inviteNotSentTitle')}>
          {t('inviteNotSentBody', { email: invite.data.email })}
        </Alert>
      ) : null}
      {serverConflict ? (
        <Alert variant="error" title={t('inviteErrorTitle')}>
          {t('alreadyHasAccessError', { school: schoolName })}
        </Alert>
      ) : invite.isError ? (
        <Alert variant="error" title={t('inviteErrorTitle')}>
          {t('inviteErrorBody')}
        </Alert>
      ) : null}

      <div>
        <Button type="submit" loading={invite.isPending} disabled={blocked}>
          {t('inviteSubmit')}
        </Button>
      </div>
    </form>
  );
}
