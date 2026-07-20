'use client';

import { Check } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useRef } from 'react';

import { cn } from '@/lib/utils';
import { CONTACT_CHANNELS } from '@/modules/student-wizard/constants/student-wizard.constants';
import type { ContactChannel } from '@/modules/student-wizard/types/student-wizard.types';

interface ContactChannelCardsProps {
  value: ContactChannel;
  labels: Record<ContactChannel, string>;
  ariaLabel: string;
  onValueChange: (value: ContactChannel) => void;
}

// C-UI-STUDENT-WIZARD §5.12 selection cards for `preferred_contact_channel`.
// Roving-tabindex radiogroup (role="radio"/aria-checked); arrow keys move +
// select, Space/Enter select the focused card. Reused by onboarding 055.
export function ContactChannelCards({
  value,
  labels,
  ariaLabel,
  onValueChange,
}: ContactChannelCardsProps) {
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectAt = (index: number) => {
    const count = CONTACT_CHANNELS.length;
    const target = (index + count) % count;
    onValueChange(CONTACT_CHANNELS[target].value);
    cardRefs.current[target]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      selectAt(index + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      selectAt(index - 1);
    }
  };

  return (
    <div role="radiogroup" aria-label={ariaLabel} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CONTACT_CHANNELS.map(({ value: channel, icon: Icon }, index) => {
        const selected = channel === value;
        return (
          <button
            key={channel}
            ref={(node) => {
              cardRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(channel)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'group relative flex flex-col items-start gap-2 rounded-2xl border-2 bg-card p-4 text-left outline-none transition duration-150 ease-out hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none',
              selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-input',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity duration-150 ease-out motion-reduce:transition-none',
                selected ? 'opacity-100' : 'opacity-0',
              )}
            >
              <Check className="size-3" />
            </span>
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-4.25" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-foreground">{labels[channel]}</span>
          </button>
        );
      })}
    </div>
  );
}
