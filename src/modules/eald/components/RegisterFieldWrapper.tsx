import type { RegisterFieldWrapperProps } from '@/modules/eald/types/components.types';

function RegisterFieldWrapper({ label, error, t, children }: RegisterFieldWrapperProps) {
  return (
    <label className="flex flex-col gap-1.75">
      <span className="text-body-sm font-semibold text-foreground">{label}</span>
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
