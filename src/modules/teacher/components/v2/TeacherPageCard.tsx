import { cn } from '@/lib/utils';
import { PAGE_CARD_VARIANTS } from '@/modules/teacher/constants/teacher-kit.constants';
import type { TeacherPageCardProps } from '@/modules/teacher/types/teacher-kit.types';

/**
 * Teacher Portal v2 — the white card every teacher page sits in
 * (`Teacher Portal v2.dc.html:58`, `:219`, `:160`): 1px #ECEEF2 hairline,
 * radius 14, full width, top-aligned in the scroll column. `flush` is the list
 * card (its sections carry the 32px gutters); `padded` is the class/student
 * card (26/30/30, gap 20). Extra props (`data-surface`, `data-status`…) land
 * on the root, where the specs read them.
 */
function TeacherPageCard({
  variant = 'flush',
  scroll = false,
  className,
  children,
  ...rest
}: TeacherPageCardProps) {
  return (
    <div
      data-slot="teacher-page-card"
      className={cn(
        'w-full min-w-0 flex-none self-start rounded-[14px] border border-[#ECEEF2] bg-white text-[#4B5563]',
        PAGE_CARD_VARIANTS[variant],
        scroll && 'max-h-full min-h-0 overflow-y-auto',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export { TeacherPageCard };
