'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button, Card, FieldShell, Input } from '@/modules/design-system';
import { useTestEmailMutation } from '@/modules/ops/queries/use-update-platform-settings.mutation';

// C-SET-04 — send a real message through the configured provider. A provider
// failure is surfaced with the server's own message; there is no fake success.
export function OpsTestEmailPanel() {
  const t = useTranslations('Ops.settings.testEmail');
  const [to, setTo] = useState('');
  const testEmail = useTestEmailMutation();

  const handleSend = async () => {
    try {
      const result = await testEmail.mutateAsync(to);
      toast.success(t('sentToast', { to: result.to, provider: result.provider }));
    } catch (error) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response
        ?.data?.error?.message;
      toast.error(message ?? t('errorToast'));
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="mt-1 text-sm text-body">{t('description')}</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <FieldShell id="test-email-to" label={t('label')} className="min-w-64 flex-1">
          <Input
            id="test-email-to"
            type="email"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            placeholder={t('placeholder')}
          />
        </FieldShell>
        <Button
          type="button"
          variant="outline"
          onClick={handleSend}
          disabled={to.trim().length === 0 || testEmail.isPending}
        >
          {testEmail.isPending ? t('sending') : t('send')}
        </Button>
      </div>
    </Card>
  );
}
