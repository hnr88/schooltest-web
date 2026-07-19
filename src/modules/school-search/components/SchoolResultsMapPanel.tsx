'use client';

import dynamic from 'next/dynamic';

import type { SchoolHit } from '@/modules/school-search/types/school-search.types';

// SSR guard: Leaflet touches `window`, so the map leaf loads client-only via
// next/dynamic(ssr:false). SchoolsPane imports THIS wrapper DIRECTLY — it MUST
// NOT be re-exported through the module barrel (a barrel re-export defeats
// ssr:false and SSR-crashes the page).
const SchoolResultsMap = dynamic(
  () => import('@/modules/school-search/components/SchoolResultsMap'),
  { ssr: false },
);

function SchoolResultsMapPanel({ hits }: { hits: SchoolHit[] }) {
  return <SchoolResultsMap hits={hits} />;
}

export { SchoolResultsMapPanel };
