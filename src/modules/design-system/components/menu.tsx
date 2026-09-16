import type { ComponentProps } from 'react';

import {
  DropdownMenuCheckboxItem as DropdownMenuCheckboxItemPrimitive,
  DropdownMenuContent as DropdownMenuContentPrimitive,
  DropdownMenuItem as DropdownMenuItemPrimitive,
  DropdownMenuRadioItem as DropdownMenuRadioItemPrimitive,
  DropdownMenuSubContent as DropdownMenuSubContentPrimitive,
  DropdownMenuSubTrigger as DropdownMenuSubTriggerPrimitive,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  CONTENT_CLASSES,
  DESTRUCTIVE_HOVER_CLASSES,
  ITEM_CLASSES,
} from '@/modules/design-system/constants/menu.constants';

// Spec (DS doc §11): container = white card, border #E3E8F0, radius 12, shadow-lg, 6px
// padding; items = 13.5/500 navy, slate icons, subtle #F1F5F9 (muted) hover — the
// spec never uses teal for menu highlights, so the vendored primitives were
// re-pointed from bg-accent to bg-muted at the source.
function DropdownMenuContent({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuContentPrimitive>) {
  return (
    <DropdownMenuContentPrimitive
      data-slot="dropdown-menu-content"
      className={cn(CONTENT_CLASSES, className)}
      {...props}
    />
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuSubContentPrimitive>) {
  return (
    <DropdownMenuSubContentPrimitive
      data-slot="dropdown-menu-sub-content"
      className={cn(CONTENT_CLASSES, className)}
      {...props}
    />
  );
}

function DropdownMenuItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuItemPrimitive>) {
  return (
    <DropdownMenuItemPrimitive
      data-slot="dropdown-menu-item"
      className={cn(ITEM_CLASSES, DESTRUCTIVE_HOVER_CLASSES, className)}
      {...props}
    >
      {typeof children === 'string' ? (
        <span className="min-w-0 truncate" title={children}>
          {children}
        </span>
      ) : (
        children
      )}
    </DropdownMenuItemPrimitive>
  );
}

function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuSubTriggerPrimitive>) {
  return (
    <DropdownMenuSubTriggerPrimitive
      data-slot="dropdown-menu-sub-trigger"
      className={cn(ITEM_CLASSES, className)}
      {...props}
    >
      {typeof children === 'string' ? (
        <span className="min-w-0 truncate" title={children}>
          {children}
        </span>
      ) : (
        children
      )}
    </DropdownMenuSubTriggerPrimitive>
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuCheckboxItemPrimitive>) {
  return (
    <DropdownMenuCheckboxItemPrimitive
      data-slot="dropdown-menu-checkbox-item"
      className={cn(ITEM_CLASSES, className)}
      {...props}
    >
      {typeof children === 'string' ? (
        <span className="min-w-0 truncate" title={children}>
          {children}
        </span>
      ) : (
        children
      )}
    </DropdownMenuCheckboxItemPrimitive>
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenuRadioItemPrimitive>) {
  return (
    <DropdownMenuRadioItemPrimitive
      data-slot="dropdown-menu-radio-item"
      className={cn(ITEM_CLASSES, className)}
      {...props}
    >
      {typeof children === 'string' ? (
        <span className="min-w-0 truncate" title={children}>
          {children}
        </span>
      ) : (
        children
      )}
    </DropdownMenuRadioItemPrimitive>
  );
}

export {
  DropdownMenuContent,
  DropdownMenuSubContent,
  DropdownMenuItem,
  DropdownMenuSubTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
};
