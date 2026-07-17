'use client';

import { useState } from 'react';

import { Alert } from '@/modules/design-system/components/alert';
import { Button } from '@/modules/design-system/components/button';

interface AlertDismissDemoProps {
  title: string;
  body: string;
  actionLabel: string;
  dismissLabel: string;
}

function AlertDismissDemo({ title, body, actionLabel, dismissLabel }: AlertDismissDemoProps) {
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible) {
    return null;
  }
  return (
    <Alert
      variant="warning"
      title={title}
      dismissLabel={dismissLabel}
      onDismiss={() => setIsVisible(false)}
      action={
        <Button variant="outline" size="sm">
          {actionLabel}
        </Button>
      }
    >
      {body}
    </Alert>
  );
}

export { AlertDismissDemo, type AlertDismissDemoProps };
