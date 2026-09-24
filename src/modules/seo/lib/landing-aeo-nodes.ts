import { SITE_NAME } from '@/modules/seo/constants/seo.constants';
import {
  getAeoService,
  getDiagnosticHowTo,
  getSoftwareContent,
} from '@/modules/seo/lib/aeo-content';
import {
  buildHowToJsonLd,
  buildServiceJsonLd,
  buildSoftwareApplicationJsonLd,
} from '@/modules/seo/lib/json-ld-content';
import type { AeoHowToContent, AeoPage } from '@/modules/seo/types/aeo.types';
import type { GraphNode } from '@/modules/seo/types/json-ld.types';

interface LandingAeoNodes {
  readonly nodes: GraphNode[];
  readonly aboutId: string;
  readonly howTo: AeoHowToContent | null;
}

/**
 * Page-specific nodes for a landing page: the SoftwareApplication on the home
 * page, a Service on each product page, and the HowTo on /diagnose (the one
 * page that shows the step flow).
 */
export async function getLandingAeoNodes(
  page: AeoPage,
  pathname: string,
  locale: string,
  description: string,
): Promise<LandingAeoNodes> {
  const software = await getSoftwareContent(locale);
  const softwareNode = buildSoftwareApplicationJsonLd({
    siteName: SITE_NAME,
    description: software.description,
    featureList: software.featureList,
  });
  if (page === 'home') return { nodes: [softwareNode], aboutId: softwareNode['@id'], howTo: null };

  const service = await getAeoService(locale, page);
  const serviceNode = buildServiceJsonLd({
    pathname,
    locale,
    name: service.name,
    description,
    serviceType: service.serviceType,
  });
  const nodes: GraphNode[] = [serviceNode, softwareNode];
  if (page !== 'diagnose') return { nodes, aboutId: serviceNode['@id'], howTo: null };

  const howTo = await getDiagnosticHowTo(locale);
  nodes.push(
    buildHowToJsonLd({
      pathname,
      locale,
      name: howTo.heading,
      description: howTo.intro,
      steps: howTo.steps,
    }),
  );
  return { nodes, aboutId: serviceNode['@id'], howTo };
}
