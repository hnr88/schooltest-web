import { Check } from 'lucide-react';

import type { RegisterCardProps } from '@/modules/eald/types/components.types';

function RegisterSuccessCard({ t }: RegisterCardProps) {
  return (
    <div className="p-6 sm:p-7.5">
      <div className="py-2.5" role="status">
        <span className="inline-grid size-11 place-items-center rounded-full bg-teal-100">
          <Check aria-hidden="true" className="size-5 text-teal-700" strokeWidth={2.8} />
        </span>
        <p className="mt-4 text-h3 font-bold text-foreground">{t('home.register.successTitle')}</p>
        <p className="mt-2 text-body-md text-body">{t('home.register.successBody')}</p>
      </div>
    </div>
  );
}

export { RegisterSuccessCard };
