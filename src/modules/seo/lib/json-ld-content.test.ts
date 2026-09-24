import { describe, expect, it } from 'vitest';

import {
  buildFaqQuestionNodes,
  buildHowToJsonLd,
  buildServiceJsonLd,
  buildSoftwareApplicationJsonLd,
} from '@/modules/seo/lib/json-ld-content';

const ROOT = 'http://localhost:3000/';

describe('buildFaqQuestionNodes', () => {
  it('turns each visible entry into a Question with an accepted Answer and a page-scoped @id', () => {
    const [question] = buildFaqQuestionNodes(
      [{ key: 'names', question: 'Are names shared?', answer: 'No.' }],
      '/teach',
      'ms',
    );
    expect(question).toEqual({
      '@type': 'Question',
      '@id': 'http://localhost:3000/ms/teach#faq-names',
      name: 'Are names shared?',
      inLanguage: 'ms',
      acceptedAnswer: { '@type': 'Answer', text: 'No.' },
    });
  });
});

describe('buildHowToJsonLd', () => {
  it('orders steps from 1 and anchors each to its visible <li>', () => {
    const howTo = buildHowToJsonLd({
      pathname: '/diagnose',
      locale: 'en',
      name: 'How does a school start a diagnostic?',
      description: 'Six steps.',
      steps: [
        { key: 'register', name: 'Register interest', text: 'Complete the form.' },
        { key: 'sit', name: 'Students sit the test', text: 'Enter the join code.' },
      ],
    });
    expect(howTo['@id']).toBe(`${ROOT}diagnose#howto`);
    expect(howTo.isPartOf).toEqual({ '@id': `${ROOT}diagnose#webpage` });
    expect(howTo.step.map((step) => [step.position, step.url])).toEqual([
      [1, `${ROOT}diagnose#step-register`],
      [2, `${ROOT}diagnose#step-sit`],
    ]);
  });
});

describe('buildServiceJsonLd', () => {
  it('is provided by the Organization to Australian educators', () => {
    const service = buildServiceJsonLd({
      pathname: '/predict',
      locale: 'en',
      name: 'SchoolTest Predict',
      description: 'Readiness.',
      serviceType: 'Mainstream readiness prediction',
    });
    expect(service.provider).toEqual({ '@id': `${ROOT}#organization` });
    expect(service.areaServed).toEqual({ '@type': 'Country', name: 'Australia' });
    expect(service.audience.every((audience) => audience['@type'] === 'EducationalAudience')).toBe(true);
    expect(service.isRelatedTo).toEqual({ '@id': `${ROOT}#software` });
  });
});

describe('buildSoftwareApplicationJsonLd', () => {
  const app = buildSoftwareApplicationJsonLd({
    siteName: 'SchoolTest',
    description: 'Assessment.',
    featureList: ['Diagnostic testing'],
  });

  it('is an EducationalApplication naming the desktop operating systems', () => {
    expect(app['@type']).toEqual(['SoftwareApplication', 'WebApplication']);
    expect(app.applicationCategory).toBe('EducationalApplication');
    expect(app.operatingSystem).toBe('macOS, Windows, Linux');
    expect(app.publisher).toEqual({ '@id': `${ROOT}#organization` });
  });

  it('never fabricates a price, rating or review', () => {
    for (const key of ['offers', 'aggregateRating', 'review']) {
      expect(key in app, key).toBe(false);
    }
  });
});
