'use client';

/**
 * ops/14 — the design's tab-body header (`Ops Portal.dc.html:353-368`), the
 * kit's wrap of the `PanelHeaderRow` sibling: an `<h2>` title, a one-line
 * summary, and the two right-aligned buttons — the secondary (the design's
 * Export CSV, outline) and the optional contextual primary (solid). Buttons
 * are `DirectoryHeaderAction`-shaped so a `write: true` one is greyed and
 * refuses through task 03's gate, exactly like a row action.
 *
 * Rendered by `DirectoryTable` only when the consumer passes `header`; every
 * consumer that omits it renders byte-identically to before this file existed.
 */
import { Download, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, PanelHeaderRow } from '@/modules/design-system';
import { useOpsWriteGate } from '@/modules/ops/actions';

import type { DirectoryHeaderAction, DirectoryHeaderDef } from '../types/directory.types';

interface HeaderButtonProps {
  action: DirectoryHeaderAction;
  /** The design's outline secondary falls back to the kit's Export label; the primary to "Open". */
  fallbackLabel: string;
  /** The design's icons: a download glyph for the secondary, a plus for the primary. */
  fallbackIcon: typeof Download;
  variant: 'outline' | 'default';
}

function BaseHeaderButton({
  action,
  fallbackLabel,
  fallbackIcon: FallbackIcon,
  variant,
  disabled,
  refusedReason,
}: HeaderButtonProps & { disabled?: boolean; refusedReason?: string }) {
  const Label = action.label ?? fallbackLabel;
  const Icon = action.icon ?? FallbackIcon;
  // The design's card-header buttons (`Ops Portal.dc.html:359-367`): 40px,
  // radius 12, 13.5px/600 — the canonical Button's radius-10 `text-sm
  // font-medium` read as a different control family next to the ops tabs.
  const pill =
    variant === 'outline'
      ? 'h-10 rounded-[12px] border-[#D8DFEA] px-4 text-[13.5px] font-semibold'
      : 'h-10 rounded-[12px] px-[18px] text-[13.5px] font-semibold';
  return (
    <Button
      type="button"
      variant={variant}
      className={pill}
      disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
      title={refusedReason}
      onClick={() => {
        if (disabled) return;
        action.onSelect();
      }}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {Label}
    </Button>
  );
}

/**
 * The gated variant exists so `useOpsWriteGate` mounts ONLY when a consumer
 * actually declared a `write` button — a read surface must not grow a
 * capabilities query as a side effect of rendering a header.
 */
function GatedHeaderButton(props: HeaderButtonProps) {
  const gate = useOpsWriteGate();
  const reason = gate.blockedReason();
  return <BaseHeaderButton {...props} disabled={reason !== null} refusedReason={reason ?? undefined} />;
}

function HeaderButton(props: HeaderButtonProps) {
  if (props.action.write) return <GatedHeaderButton {...props} />;
  return <BaseHeaderButton {...props} />;
}

export function DirectoryHeader({ header }: { header: DirectoryHeaderDef }) {
  const t = useTranslations('DesignSystem.directory');
  return (
    <PanelHeaderRow
      as="h2"
      title={header.title}
      description={header.summary}
      className="pb-0 [&_h2]:text-[19px] [&_h2]:tracking-[-0.01em] [&_p]:text-[13px]"
      action={
        <>
          {header.secondary ? (
            <HeaderButton
              action={header.secondary}
              variant="outline"
              fallbackIcon={Download}
              fallbackLabel={t('exportCsv')}
            />
          ) : null}
          {header.primary ? (
            <HeaderButton
              action={header.primary}
              variant="default"
              fallbackIcon={Plus}
              fallbackLabel={t('primaryAction')}
            />
          ) : null}
        </>
      }
    />
  );
}
