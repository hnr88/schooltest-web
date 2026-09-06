'use client';

import { useTranslations } from 'next-intl';
import { MailX } from 'lucide-react';
import { useState } from 'react';

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
import { OpsStaffInvitationFilters } from '@/modules/ops/components/OpsStaffInvitationFilters';
import { OpsStaffInvitationTable } from '@/modules/ops/components/OpsStaffInvitationTable';
import { useStaffInvitationsFilter } from '@/modules/ops/hooks/use-staff-invitations-filter';
import {
  useInviteStaffMutation,
  type InviteStaffInput,
} from '@/modules/ops/queries/use-invite-school-admin.mutation';
import { useStaffInvitationsQuery } from '@/modules/ops/queries/use-staff-invitations.query';

import type { OpsStaffInvitationDialogProps } from '@/modules/ops/types/staff-invitations.types';

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

const BLANK: Omit<InviteStaffInput, 'schoolDocumentId'> = {
  role: 'teacher',
  display_name: '',
  email: '',
  message: '',
};

/**
 * The one invite modal's form: a SINGLE Name field, an email, an optional
 * message, and the role.
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
  const [values, setValues] = useState(BLANK);
  const invite = useInviteStaffMutation();

  const set = <K extends keyof typeof BLANK>(key: K, value: (typeof BLANK)[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  const submit = async () => {
    try {
      const result = await invite.mutateAsync({ schoolDocumentId, ...values });
      // The draft is cleared only once the invitation actually exists. A failed
      // SEND still created one, so the operator resends by id rather than
      // retyping — and never by inviting the same person twice.
      setValues(BLANK);
      return result;
    } catch {
      return null;
    }
  };

  return (
    <form
      data-slot="ops-staff-invite-form"
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
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
        {/* One Name field, as pictured. Blank is allowed: the email greets the
            mailbox rather than inventing a first and last name. */}
        <Input
          id="ops-invite-name"
          value={values.display_name}
          autoComplete="off"
          onChange={(event) => set('display_name', event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="ops-invite-email">{t('inviteEmailLabel')}</Label>
        <Input
          id="ops-invite-email"
          type="email"
          required
          value={values.email}
          onChange={(event) => set('email', event.target.value)}
        />
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
      {invite.isError ? (
        <Alert variant="error" title={t('inviteErrorTitle')}>
          {t('inviteErrorBody')}
        </Alert>
      ) : null}

      <div>
        <Button type="submit" loading={invite.isPending} disabled={values.email.trim() === ''}>
          {t('inviteSubmit')}
        </Button>
      </div>
    </form>
  );
}
