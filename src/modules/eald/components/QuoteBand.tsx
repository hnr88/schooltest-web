import { Container } from '@/modules/design-system';
import type { QuoteBandProps } from '@/modules/eald/types/eald.types';

function QuoteBand({ quote }: QuoteBandProps) {
  return (
    <Container className="max-w-eald">
      <div className="rounded-4xl bg-navy-900 p-12 sm:p-16">
        <p className="mx-auto max-w-3xl text-center text-h2 font-bold text-white">
          {quote}
        </p>
      </div>
    </Container>
  );
}

export { QuoteBand };
