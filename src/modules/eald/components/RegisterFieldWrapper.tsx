import type { RegisterFieldWrapperProps } from '@/modules/eald/types/components.types';

function RegisterFieldWrapper({ label, error, t, children }: RegisterFieldWrapperProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold tracking-eyebrow text-slate-400 uppercase">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-red-500" role="alert">
          {t(`home.register.${error}`)}
        </span>
      ) : null}
    </label>
  );
}

export { RegisterFieldWrapper };
