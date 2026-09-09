/**
 * Ledger row 10 (msn-0da39441, D-008) — the ops legal-document editor's two
 * surfaces: `GET /api/legal-documents/:slug` (C-LEG-02, public read the editor
 * hydrates from) and `PUT /api/ops/legal-documents/:slug` (C-LEG-03, ops only).
 *
 * Shapes mirror the live wire byte-for-byte (verified against
 * schooltest-api/src/api/legal-document before writing): the update body is a
 * PARTIAL patch requiring at least one field, and BOTH responses carry the
 * FULL row including its sections. The write always lands on the canonical
 * `en` row — the service filters `locale_code = 'en'` itself — so the editor
 * sends no locale. `published` is a regular column the patch may carry, not
 * the draft/publish system.
 */
import { z } from 'zod';
/** The four documents the public site exposes (the api's own path enum). */
export declare const LEGAL_SLUGS: readonly ["privacy-policy", "terms-of-service", "cookie-policy", "gdpr"];
export declare const legalSlugSchema: z.ZodEnum<{
    "privacy-policy": "privacy-policy";
    "terms-of-service": "terms-of-service";
    "cookie-policy": "cookie-policy";
    gdpr: "gdpr";
}>;
export type LegalSlug = z.infer<typeof legalSlugSchema>;
export declare const legalSectionSchema: z.ZodObject<{
    id: z.ZodString;
    heading: z.ZodString;
    paragraphs: z.ZodArray<z.ZodString>;
    list: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type LegalSection = z.infer<typeof legalSectionSchema>;
export declare const legalDocumentRowSchema: z.ZodObject<{
    documentId: z.ZodString;
    slug: z.ZodString;
    title: z.ZodString;
    summary: z.ZodNullable<z.ZodString>;
    version: z.ZodString;
    effective_date: z.ZodString;
    locale_code: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$strip>;
export type LegalDocumentRow = z.infer<typeof legalDocumentRowSchema>;
export declare const legalDocumentDetailSchema: z.ZodObject<{
    documentId: z.ZodString;
    slug: z.ZodString;
    title: z.ZodString;
    summary: z.ZodNullable<z.ZodString>;
    version: z.ZodString;
    effective_date: z.ZodString;
    locale_code: z.ZodString;
    updatedAt: z.ZodString;
    sections: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        heading: z.ZodString;
        paragraphs: z.ZodArray<z.ZodString>;
        list: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type LegalDocumentDetail = z.infer<typeof legalDocumentDetailSchema>;
export declare const legalUpdateBodySchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sections: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        heading: z.ZodString;
        paragraphs: z.ZodArray<z.ZodString>;
        list: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
    version: z.ZodOptional<z.ZodString>;
    effective_date: z.ZodOptional<z.ZodString>;
    published: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export type LegalUpdateBody = z.infer<typeof legalUpdateBodySchema>;
export declare const legalDocumentResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        documentId: z.ZodString;
        slug: z.ZodString;
        title: z.ZodString;
        summary: z.ZodNullable<z.ZodString>;
        version: z.ZodString;
        effective_date: z.ZodString;
        locale_code: z.ZodString;
        updatedAt: z.ZodString;
        sections: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            heading: z.ZodString;
            paragraphs: z.ZodArray<z.ZodString>;
            list: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type LegalDocumentResponse = z.infer<typeof legalDocumentResponseSchema>;
export declare const legalUpdateResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        documentId: z.ZodString;
        slug: z.ZodString;
        title: z.ZodString;
        summary: z.ZodNullable<z.ZodString>;
        version: z.ZodString;
        effective_date: z.ZodString;
        locale_code: z.ZodString;
        updatedAt: z.ZodString;
        sections: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            heading: z.ZodString;
            paragraphs: z.ZodArray<z.ZodString>;
            list: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type LegalUpdateResponse = z.infer<typeof legalUpdateResponseSchema>;
export declare const LegalDocumentReadOperation: Readonly<{
    contractId: "C-LEG-02";
    method: "GET";
    path: "/api/legal-documents/:slug";
    request: z.ZodObject<{
        data: z.ZodObject<{}, z.core.$strip>;
    }, z.core.$strict>;
    response: z.ZodObject<{
        data: z.ZodObject<{
            documentId: z.ZodString;
            slug: z.ZodString;
            title: z.ZodString;
            summary: z.ZodNullable<z.ZodString>;
            version: z.ZodString;
            effective_date: z.ZodString;
            locale_code: z.ZodString;
            updatedAt: z.ZodString;
            sections: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                heading: z.ZodString;
                paragraphs: z.ZodArray<z.ZodString>;
                list: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    success: 200;
    errors: readonly [400, 401, 403, 404, 429, 500];
}>;
export declare const LegalUpdateOperation: Readonly<{
    contractId: "C-LEG-03";
    method: "PUT";
    path: "/api/ops/legal-documents/:slug";
    request: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        summary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        sections: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            heading: z.ZodString;
            paragraphs: z.ZodArray<z.ZodString>;
            list: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>>;
        version: z.ZodOptional<z.ZodString>;
        effective_date: z.ZodOptional<z.ZodString>;
        published: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strict>;
    response: z.ZodObject<{
        data: z.ZodObject<{
            documentId: z.ZodString;
            slug: z.ZodString;
            title: z.ZodString;
            summary: z.ZodNullable<z.ZodString>;
            version: z.ZodString;
            effective_date: z.ZodString;
            locale_code: z.ZodString;
            updatedAt: z.ZodString;
            sections: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                heading: z.ZodString;
                paragraphs: z.ZodArray<z.ZodString>;
                list: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    success: 200;
    errors: readonly [400, 401, 403, 404, 429, 500];
}>;
/** `:slug` substituted for the wire; the operations keep the contract shape. */
export declare function legalDocumentReadPath(slug: LegalSlug): string;
export declare function legalUpdatePath(slug: LegalSlug): string;
