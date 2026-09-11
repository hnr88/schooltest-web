'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { CircleAlert, X } from 'lucide-react';

import { Button } from '@/modules/design-system/components/button';
import { cn } from '@/lib/utils';
import { errorId, helperId } from '@/modules/design-system/lib/field-ids';

// Ops modal chrome (`Ops Portal.dc.html:547-842`), built directly on
// @base-ui/react/dialog so the vendored `components/ui/dialog` stays untouched.
// Overlay rgba(14,35,80,.42) no blur; panel white radius 24 shadow
// 0 28px 56px rgba(0,0,0,.22), `om-rise` entrance, sticky header/footer.

function OpsDialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="ops-dialog" {...props} />;
}

function OpsDialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="ops-dialog-trigger" {...props} />;
}

function OpsDialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="ops-dialog-close" {...props} />;
}

function OpsDialogContent({ className, ...props }: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal data-slot="ops-dialog-portal">
      <DialogPrimitive.Backdrop
        data-slot="ops-dialog-backdrop"
        className="fixed inset-0 isolate z-50 bg-[rgba(14,35,80,0.42)]"
      />
      <DialogPrimitive.Popup
        data-slot="ops-dialog-content"
        className={cn(
          'fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 max-h-[88dvh] overflow-y-auto rounded-[24px] bg-white text-[#0E2350] shadow-[0_28px_56px_rgba(0,0,0,0.22)] outline-none animate-om-rise',
          className,
        )}
        {...props}
      />
    </DialogPrimitive.Portal>
  );
}

function OpsDialogHeader({
  title,
  sub,
  className,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations('Components');
  return (
    <div
      data-slot="ops-dialog-header"
      className={cn(
        'sticky top-0 z-10 flex items-center justify-between gap-4 rounded-t-[24px] border-b border-[#EEF1F6] bg-white px-7 py-[22px]',
        className,
      )}
    >
      <div className="min-w-0">
        <DialogPrimitive.Title className="text-lg leading-none font-semibold text-[#0E2350]">
          {title}
        </DialogPrimitive.Title>
        {sub ? (
          <DialogPrimitive.Description className="mt-1 text-[13px] leading-snug text-[#7C8698]">
            {sub}
          </DialogPrimitive.Description>
        ) : null}
      </div>
      <DialogPrimitive.Close
        aria-label={t('close')}
        className="grid size-[34px] shrink-0 cursor-pointer place-items-center rounded-full border-none bg-[#F4F6FA] text-[15px] text-[#0E2350] transition-colors hover:bg-[#E9EDF4]"
      >
        <X className="size-[15px]" aria-hidden="true" />
      </DialogPrimitive.Close>
    </div>
  );
}

function OpsDialogBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="ops-dialog-body"
      className={cn('flex flex-col gap-[18px] px-7 py-6', className)}
      {...props}
    />
  );
}

function OpsDialogError({ children }: { children?: React.ReactNode }) {
  if (children == null) return null;
  return (
    <div role="alert" className="flex items-center gap-2 text-[13px] font-semibold text-[#B42318]">
      <CircleAlert aria-hidden="true" className="size-[15px] shrink-0" />
      {children}
    </div>
  );
}

function OpsDialogFooter({
  error,
  children,
  className,
}: {
  /** Left error slot; collapses when empty. */
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="ops-dialog-footer"
      className={cn(
        'sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-b-[24px] border-t border-[#EEF1F6] bg-white px-7 py-[18px]',
        className,
      )}
    >
      <OpsDialogError>{error}</OpsDialogError>
      <div className="ml-auto flex items-center gap-2.5">{children}</div>
    </div>
  );
}

function OpsDialogCancel({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      className={cn(
        'h-11 rounded-full border-[#D8DFEA] bg-white px-5 text-sm font-semibold text-[#0E2350] hover:border-[#0E2350] hover:bg-white',
        className,
      )}
      {...props}
    />
  );
}

function OpsDialogCta({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        'h-11 rounded-full bg-[#0E2350] px-6 text-sm font-semibold text-white hover:bg-[#16326E]',
        className,
      )}
      {...props}
    />
  );
}

/** The import modal's mid-state dismissal (design `:1691`). */
function OpsDialogDangerCancel({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      className={cn(
        'h-11 rounded-full border-[#F3C6C1] bg-white px-5 text-sm font-semibold text-[#B42318] hover:bg-white',
        className,
      )}
      {...props}
    />
  );
}

/** Ops modal label stack: 12.5px/600 #0E2350, 7px to control, blue required marker. */
function OpsFieldShell({
  id,
  label,
  children,
  helperText,
  errorText,
  required,
  disabled,
  labelId,
  className,
  hideLabel,
}: {
  id?: string;
  label: React.ReactNode;
  children: React.ReactNode;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  disabled?: boolean;
  labelId?: string;
  className?: string;
  hideLabel?: boolean;
}) {
  const labelClass =
    'mb-[7px] block text-[12.5px] leading-none font-semibold ' +
    (disabled ? 'text-[#7C8698]' : 'text-[#0E2350]') +
    (hideLabel ? ' sr-only' : '');
  const marker = required ? <span className="text-[#2563EB]">*</span> : null;
  return (
    <div data-slot="ops-field-shell" data-invalid={errorText ? '' : undefined} className={className ?? ''}>
      {labelId ? (
        <span id={labelId} className={labelClass}>
          {label}
          {marker}
        </span>
      ) : (
        <label htmlFor={id} className={labelClass}>
          {label}
          {marker}
        </label>
      )}
      {children}
      {helperText && !errorText ? (
        <p id={id ? helperId(id) : undefined} className="mt-1.5 text-xs leading-relaxed text-[#7C8698]">
          {helperText}
        </p>
      ) : null}
      {errorText ? (
        <p
          id={id ? errorId(id) : undefined}
          className="mt-1.5 text-xs leading-relaxed font-medium text-[#B42318]"
        >
          {errorText}
        </p>
      ) : null}
    </div>
  );
}

/** 1.5px control border per the ops modal design. */
const OPS_CONTROL_CLASS =
  'border-[1.5px] border-[#D8DFEA] focus-visible:border-[#2563EB] focus-visible:ring-0';

function OpsDialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title className={cn('text-lg font-semibold text-[#0E2350]', className)} {...props} />;
}

function OpsDialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return <DialogPrimitive.Description className={cn('text-[13px] text-[#7C8698]', className)} {...props} />;
}

export {
  OpsDialog,
  OpsDialogTitle,
  OpsDialogDescription,
  OpsDialogTrigger,
  OpsDialogClose,
  OpsDialogContent,
  OpsDialogHeader,
  OpsDialogBody,
  OpsDialogFooter,
  OpsDialogError,
  OpsDialogCancel,
  OpsDialogCta,
  OpsDialogDangerCancel,
  OpsFieldShell,
  OPS_CONTROL_CLASS,
};
