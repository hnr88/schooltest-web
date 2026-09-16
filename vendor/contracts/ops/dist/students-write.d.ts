/**
 * C-OPS-STU-CREATE / C-OPS-STU-PATCH — the ops portal's write half of the
 * student record: POST /api/ops/schools/{documentId}/students (create) and
 * PATCH /api/ops/schools/{documentId}/students/{studentDocumentId} (partial
 * edit). ONE definition of the shapes, imported by the Strapi handlers, by the
 * typed web queries and by the HTTP assertions on both sides. Pure Zod +
 * TypeScript: nothing here may import Strapi, Next or node built-ins.
 *
 * Rules the module pins:
 *  - The ops portal must be able to CREATE and FULLY EDIT any field of any
 *    student (name, email, DOB, language, year level, ACARA phase, class,
 *    EALD fields), so a body is ANY SUBSET of the writable scalars: omitted
 *    means unchanged on a patch, null clears a nullable field.
 *  - A create requires `given_name`; a patch carrying NO recognised key at
 *    all is a client bug and a 400, never a silent no-op.
 *  - `student_status` is NOT writable here: active/archived moves flow ONLY
 *    through the deactivate/reactivate operations (C-OPS-PORTAL-014/015),
 *    where the seat and in-flight-session cascade live.
 *  - `class_documentId` is the class relation: on a create an optional
 *    string, on a patch a string or an explicit null (null unassigns). It
 *    must name a class of the school in the path.
 */
import { z } from 'zod';
import { type OpsOperation } from './core';
/**
 * The row both write operations return: the same detail family the school
 * admin's create/update answers (C-CHD-02/03), scoped to exactly the keys the
 * ops portal renders. `acara_phase`/`first_language` stay plain strings (the
 * stored values), while `student_status` is the stored
 * active|archived|enrolled enum shared with the roster row.
 */
export declare const opsStudentDetailSchema: z.ZodObject<{
    documentId: z.ZodString;
    given_name: z.ZodString;
    family_name: z.ZodNullable<z.ZodString>;
    email: z.ZodNullable<z.ZodString>;
    date_of_birth: z.ZodNullable<z.ZodString>;
    year_level: z.ZodNullable<z.ZodNumber>;
    first_language: z.ZodNullable<z.ZodString>;
    acara_phase: z.ZodNullable<z.ZodString>;
    student_status: z.ZodEnum<{
        active: "active";
        archived: "archived";
        enrolled: "enrolled";
    }>;
    class: z.ZodNullable<z.ZodObject<{
        documentId: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
    }, z.core.$strict>>;
    school: z.ZodNullable<z.ZodObject<{
        documentId: z.ZodString;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type OpsStudentDetail = z.infer<typeof opsStudentDetailSchema>;
/**
 * C-OPS-STU-CREATE body. `given_name` is the only required key — everything
 * else may be omitted (a student does not start with a class, email or EALD
 * data). `first_language` stays a plain string: the server's FIRST_LANGUAGES
 * enum is not exported from this package, and a hand-copied enum here could
 * drift from the one the server enforces. `email` likewise carries no pattern
 * — the package has no shared email pattern to reuse, and the server's own
 * email validation stays the single runtime enforcer.
 */
export declare const opsStudentCreateBodySchema: z.ZodObject<{
    given_name: z.ZodString;
    family_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    date_of_birth: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    year_level: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    first_language: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    acara_phase: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        emerging: "emerging";
        beginning: "beginning";
        developing: "developing";
        consolidating: "consolidating";
    }>>>;
    other_languages: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    l1_literate: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    prior_schooling_interrupted: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    time_learning_english_yrs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    time_in_australia_months: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    class_documentId: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type OpsStudentCreateBody = z.infer<typeof opsStudentCreateBodySchema>;
/**
 * C-OPS-STU-PATCH body — the create shape with EVERYTHING optional (a partial
 * edit: omitted = unchanged, null clears) and `class_documentId` nullable
 * (null unassigns the class). An EMPTY body is a client bug and a 400 on the
 * server, so the schema refuses it too rather than bless a silent no-op.
 */
export declare const opsStudentUpdateBodySchema: z.ZodObject<{
    given_name: z.ZodOptional<z.ZodString>;
    family_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    date_of_birth: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    year_level: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    first_language: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    acara_phase: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        emerging: "emerging";
        beginning: "beginning";
        developing: "developing";
        consolidating: "consolidating";
    }>>>;
    other_languages: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    l1_literate: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    prior_schooling_interrupted: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    time_learning_english_yrs: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    time_in_australia_months: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    class_documentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strict>;
export type OpsStudentUpdateBody = z.infer<typeof opsStudentUpdateBodySchema>;
export declare const opsStudentCreateResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        documentId: z.ZodString;
        given_name: z.ZodString;
        family_name: z.ZodNullable<z.ZodString>;
        email: z.ZodNullable<z.ZodString>;
        date_of_birth: z.ZodNullable<z.ZodString>;
        year_level: z.ZodNullable<z.ZodNumber>;
        first_language: z.ZodNullable<z.ZodString>;
        acara_phase: z.ZodNullable<z.ZodString>;
        student_status: z.ZodEnum<{
            active: "active";
            archived: "archived";
            enrolled: "enrolled";
        }>;
        class: z.ZodNullable<z.ZodObject<{
            documentId: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>>;
        school: z.ZodNullable<z.ZodObject<{
            documentId: z.ZodString;
        }, z.core.$strict>>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type OpsStudentCreateResponse = z.infer<typeof opsStudentCreateResponseSchema>;
export declare const opsStudentUpdateResponseSchema: z.ZodObject<{
    data: z.ZodObject<{
        documentId: z.ZodString;
        given_name: z.ZodString;
        family_name: z.ZodNullable<z.ZodString>;
        email: z.ZodNullable<z.ZodString>;
        date_of_birth: z.ZodNullable<z.ZodString>;
        year_level: z.ZodNullable<z.ZodNumber>;
        first_language: z.ZodNullable<z.ZodString>;
        acara_phase: z.ZodNullable<z.ZodString>;
        student_status: z.ZodEnum<{
            active: "active";
            archived: "archived";
            enrolled: "enrolled";
        }>;
        class: z.ZodNullable<z.ZodObject<{
            documentId: z.ZodString;
            name: z.ZodNullable<z.ZodString>;
        }, z.core.$strict>>;
        school: z.ZodNullable<z.ZodObject<{
            documentId: z.ZodString;
        }, z.core.$strict>>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type OpsStudentUpdateResponse = z.infer<typeof opsStudentUpdateResponseSchema>;
/** Single places that build the URLs, so no call site hand-concatenates them. */
export declare function opsStudentCreatePath(schoolDocumentId: string): string;
export declare function opsStudentUpdatePath(schoolDocumentId: string, studentDocumentId: string): string;
/** C-OPS-STU-CREATE — POST /api/ops/schools/{documentId}/students (ops). */
export declare const OpsStudentCreateOperation: OpsOperation<typeof opsStudentCreateBodySchema, typeof opsStudentCreateResponseSchema>;
/** C-OPS-STU-PATCH — PATCH /api/ops/schools/{documentId}/students/{studentDocumentId} (ops). */
export declare const OpsStudentUpdateOperation: OpsOperation<typeof opsStudentUpdateBodySchema, typeof opsStudentUpdateResponseSchema>;
