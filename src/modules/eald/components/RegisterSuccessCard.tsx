import { Check } from 'lucide-react';

import type { RegisterCardProps } from '@/modules/eald/types/components.types';

function RegisterSuccessCard({ t }: RegisterCardProps) {
  return (
    <div className="flex rounded-3xl border border-border bg-background p-8 shadow-sm sm:p-10">
      <div className="my-auto" role="status">
        <span className="inline-grid size-11 place-items-center rounded-full bg-teal-50">
          <Check className="size-5 text-teal-700" strokeWidth={2.8} />
        </span>
        <p className="mt-4 text-2xl font-bold text-foreground">
          {t('home.register.successTitle')}
        </p>
        <p className="mt-2 text-body-md text-body">
          {t('home.register.successBody')}
        </p>
      </div>
    </div>
  );
}

export { RegisterSuccessCard };
