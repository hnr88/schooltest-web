'use client';

import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

import { Badge, Spinner } from '@/modules/design-system';
import { InviteAcceptForm } from '@/modules/invitation/components/InviteAcceptForm';
import { InviteStatusScreen } from '@/modules/invitation/components/InviteStatusScreen';
import { classifyInviteError } from '@/modules/invitation/lib/classify-invite-error';
import { useInvitationQuery } from '@/modules/invitation/queries/use-invitation.query';

interface InviteAcceptScreenProps {
  token: string;
}

// Guest entry point for the /invite/<token> link (spec section 6): the page
// shows who was invited, to which school and in which role, then collects a
// password and signs the new staff member in. Terminal link states render
// their own screens instead of the form.
export function InviteAcceptScreen({ token }: InviteAcceptScreenProps) {
  const t = useTranslations('Invite');
  const { data, error, isPending } = useInvitationQuery(token);

  return (
    <main
      data-slot="invite-accept"
      className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-10 sm:py-16"
    >
      <p className="text-lg font-semibold text-foreground">SchoolTest</p>
      <div className="mt-8 flex-1">
        {isPending ? (
          <div className="flex items-center gap-3 py-16 text-muted-foreground">
            <Spinner className="size-5" />
            <span className="text-body-sm">{t('loading')}</span>
          </div>
        ) : error ? (
          <InviteStatusScreen state={classifyInviteError(error)} />
        ) : data ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Badge variant="accent" className="self-start">
                {t(`roles.${data.role}`)}
              </Badge>
              <h1 className="text-2xl font-semibold text-foreground">
                {t('welcomeTitle', { school: data.school_name })}
              </h1>
              <p className="text-body-sm text-muted-foreground">
                {t('welcomeBody', { school: data.school_name, email: data.email })}
              </p>
              <p className="text-body-sm text-muted-foreground">
                {t('expires', {
                  date: format(new Date(data.expires_at), 'd MMMM yyyy'),
                })}
              </p>
            </div>
            <InviteAcceptForm
              token={token}
              defaultValues={{ first_name: data.first_name, last_name: data.last_name }}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}
