/**
 * OPS-013 — C-OPS-PORTAL-003 POST /api/schools (versioned create).
 *
 * Runtime shapes quoted from mvp/tasks/ops/wave-02/OPS-013-school-create.md.
 * The legacy unversioned baseline (bare body, forced active/not_started/trial)
 * is NOT this schema — it stays in the server, untouched.
 *
 * This module reads ./index's earlier exports, so src/index.ts must re-export
 * it AFTER those definitions (the rest-boundary CJS-cycle pattern).
 */
import { z } from 'zod';
export declare const australianStateSchema: z.ZodEnum<{
    VIC: "VIC";
    NSW: "NSW";
    QLD: "QLD";
    SA: "SA";
    WA: "WA";
    TAS: "TAS";
    ACT: "ACT";
    NT: "NT";
}>;
export type AustralianState = z.infer<typeof australianStateSchema>;
export declare const sectorSchema: z.ZodEnum<{
    government: "government";
    "non-government": "non-government";
    catholic: "catholic";
}>;
export type Sector = z.infer<typeof sectorSchema>;
export declare const schoolTypeSchema: z.ZodEnum<{
    combined: "combined";
    primary: "primary";
    secondary: "secondary";
}>;
export type SchoolType = z.infer<typeof schoolTypeSchema>;
export declare const portalPlanSchema: z.ZodEnum<{
    pilot: "pilot";
    standard: "standard";
    enterprise: "enterprise";
}>;
export type PortalPlan = z.infer<typeof portalPlanSchema>;
/** Full lifecycle as reported in results; creates may only request the subset below. */
export declare const portalStatusSchema: z.ZodEnum<{
    active: "active";
    suspended: "suspended";
    pending_setup: "pending_setup";
    archived: "archived";
    trial: "trial";
}>;
export type PortalStatus = z.infer<typeof portalStatusSchema>;
export declare const schoolPlanSchema: z.ZodEnum<{
    trial: "trial";
    full_license: "full_license";
}>;
export type SchoolPlan = z.infer<typeof schoolPlanSchema>;
export declare const billingStatusSchema: z.ZodEnum<{
    active: "active";
    not_started: "not_started";
    stopped: "stopped";
}>;
export type BillingStatus = z.infer<typeof billingStatusSchema>;
/**
 * Versioned request body. Strict: a caller smuggling `account_status`,
 * legacy `plan`/`status` or an unknown key through the versioned route
 * fails here with 400 instead of being silently honoured.
 */
export declare const schoolCreateSchema: z.ZodObject<{
    name: z.ZodString;
    suburb: z.ZodString;
    state: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        VIC: "VIC";
        NSW: "NSW";
        QLD: "QLD";
        SA: "SA";
        WA: "WA";
        TAS: "TAS";
        ACT: "ACT";
        NT: "NT";
    }>>>;
    sector: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        government: "government";
        "non-government": "non-government";
        catholic: "catholic";
    }>>>;
    postcode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    schoolType: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
        combined: "combined";
        primary: "primary";
        secondary: "secondary";
    }>>>;
    contact_email: z.ZodPipe<z.ZodString, z.ZodEmail>;
    contact_first_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    contact_last_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    portal: z.ZodObject<{
        plan: z.ZodEnum<{
            pilot: "pilot";
            standard: "standard";
            enterprise: "enterprise";
        }>;
        status: z.ZodEnum<{
            active: "active";
            pending_setup: "pending_setup";
            trial: "trial";
        }>;
        send_owner_invitation: z.ZodBoolean;
    }, z.core.$strict>;
    contact_name: z.ZodString;
}, z.core.$strict>;
export type SchoolCreate = z.infer<typeof schoolCreateSchema>;
/**
 * What actually happened with the owner invitation, so the dialog can
 * distinguish school creation from the later invitation request. `failed`
 * after a committed create is a recoverable partial outcome, never a
 * "invitation sent" toast.
 */
export declare const onboardingDeliverySchema: z.ZodObject<{
    state: z.ZodEnum<{
        sent: "sent";
        failed: "failed";
        not_requested: "not_requested";
    }>;
    invitation_documentId: z.ZodNullable<z.ZodString>;
    error: z.ZodNullable<z.ZodObject<{
        data: z.ZodNull;
        error: z.ZodObject<{
            status: z.ZodNumber;
            name: z.ZodString;
            message: z.ZodString;
            details: z.ZodObject<{
                code: z.ZodOptional<z.ZodString>;
                errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    path: z.ZodString;
                    message: z.ZodString;
                }, z.core.$strict>>>;
            }, z.core.$strip>;
        }, z.core.$strict>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type OnboardingDelivery = z.infer<typeof onboardingDeliverySchema>;
export declare const schoolWriteResultSchema: z.ZodObject<{
    documentId: z.ZodString;
    name: z.ZodString;
    suburb: z.ZodNullable<z.ZodString>;
    state: z.ZodNullable<z.ZodEnum<{
        VIC: "VIC";
        NSW: "NSW";
        QLD: "QLD";
        SA: "SA";
        WA: "WA";
        TAS: "TAS";
        ACT: "ACT";
        NT: "NT";
    }>>;
    sector: z.ZodNullable<z.ZodEnum<{
        government: "government";
        "non-government": "non-government";
        catholic: "catholic";
    }>>;
    postcode: z.ZodNullable<z.ZodString>;
    schoolType: z.ZodNullable<z.ZodEnum<{
        combined: "combined";
        primary: "primary";
        secondary: "secondary";
    }>>;
    contact_email: z.ZodNullable<z.ZodPipe<z.ZodString, z.ZodEmail>>;
    contact_first_name: z.ZodNullable<z.ZodString>;
    contact_last_name: z.ZodNullable<z.ZodString>;
    phone: z.ZodNullable<z.ZodString>;
    account_status: z.ZodEnum<{
        prospect: "prospect";
        invited: "invited";
        invoiced: "invoiced";
        active: "active";
        suspended: "suspended";
        closed: "closed";
    }>;
    onboarding_status: z.ZodEnum<{
        not_started: "not_started";
        link_sent: "link_sent";
        in_progress: "in_progress";
        submitted: "submitted";
        complete: "complete";
    }>;
    plan: z.ZodEnum<{
        trial: "trial";
        full_license: "full_license";
    }>;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
    portal_plan: z.ZodEnum<{
        pilot: "pilot";
        standard: "standard";
        enterprise: "enterprise";
    }>;
    portal_status: z.ZodEnum<{
        active: "active";
        suspended: "suspended";
        pending_setup: "pending_setup";
        archived: "archived";
        trial: "trial";
    }>;
    trial_ends_at: z.ZodNullable<z.ZodISODateTime>;
    retention_until: z.ZodNullable<z.ZodISODateTime>;
    billing_status: z.ZodEnum<{
        active: "active";
        not_started: "not_started";
        stopped: "stopped";
    }>;
    contact_name: z.ZodNullable<z.ZodString>;
    onboarding_delivery: z.ZodObject<{
        state: z.ZodEnum<{
            sent: "sent";
            failed: "failed";
            not_requested: "not_requested";
        }>;
        invitation_documentId: z.ZodNullable<z.ZodString>;
        error: z.ZodNullable<z.ZodObject<{
            data: z.ZodNull;
            error: z.ZodObject<{
                status: z.ZodNumber;
                name: z.ZodString;
                message: z.ZodString;
                details: z.ZodObject<{
                    code: z.ZodOptional<z.ZodString>;
                    errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
                        path: z.ZodString;
                        message: z.ZodString;
                    }, z.core.$strict>>>;
                }, z.core.$strip>;
            }, z.core.$strict>;
        }, z.core.$strict>>;
    }, z.core.$strict>;
    portal_teacher_count: z.ZodNumber;
    suspended_at: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strict>;
export type SchoolWriteResult = z.infer<typeof schoolWriteResultSchema>;
/** C-OPS-PORTAL-003 — POST /api/schools */
export declare const SchoolCreateOperation: Readonly<{
    contractId: string;
    method: "POST";
    path: string;
    request: z.ZodObject<{
        name: z.ZodString;
        suburb: z.ZodString;
        state: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
            VIC: "VIC";
            NSW: "NSW";
            QLD: "QLD";
            SA: "SA";
            WA: "WA";
            TAS: "TAS";
            ACT: "ACT";
            NT: "NT";
        }>>>;
        sector: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
            government: "government";
            "non-government": "non-government";
            catholic: "catholic";
        }>>>;
        postcode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        schoolType: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
            combined: "combined";
            primary: "primary";
            secondary: "secondary";
        }>>>;
        contact_email: z.ZodPipe<z.ZodString, z.ZodEmail>;
        contact_first_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        contact_last_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        portal: z.ZodObject<{
            plan: z.ZodEnum<{
                pilot: "pilot";
                standard: "standard";
                enterprise: "enterprise";
            }>;
            status: z.ZodEnum<{
                active: "active";
                pending_setup: "pending_setup";
                trial: "trial";
            }>;
            send_owner_invitation: z.ZodBoolean;
        }, z.core.$strict>;
        contact_name: z.ZodString;
    }, z.core.$strict>;
    response: z.ZodObject<{
        data: z.ZodObject<{
            documentId: z.ZodString;
            name: z.ZodString;
            suburb: z.ZodNullable<z.ZodString>;
            state: z.ZodNullable<z.ZodEnum<{
                VIC: "VIC";
                NSW: "NSW";
                QLD: "QLD";
                SA: "SA";
                WA: "WA";
                TAS: "TAS";
                ACT: "ACT";
                NT: "NT";
            }>>;
            sector: z.ZodNullable<z.ZodEnum<{
                government: "government";
                "non-government": "non-government";
                catholic: "catholic";
            }>>;
            postcode: z.ZodNullable<z.ZodString>;
            schoolType: z.ZodNullable<z.ZodEnum<{
                combined: "combined";
                primary: "primary";
                secondary: "secondary";
            }>>;
            contact_email: z.ZodNullable<z.ZodPipe<z.ZodString, z.ZodEmail>>;
            contact_first_name: z.ZodNullable<z.ZodString>;
            contact_last_name: z.ZodNullable<z.ZodString>;
            phone: z.ZodNullable<z.ZodString>;
            account_status: z.ZodEnum<{
                prospect: "prospect";
                invited: "invited";
                invoiced: "invoiced";
                active: "active";
                suspended: "suspended";
                closed: "closed";
            }>;
            onboarding_status: z.ZodEnum<{
                not_started: "not_started";
                link_sent: "link_sent";
                in_progress: "in_progress";
                submitted: "submitted";
                complete: "complete";
            }>;
            plan: z.ZodEnum<{
                trial: "trial";
                full_license: "full_license";
            }>;
            createdAt: z.ZodISODateTime;
            updatedAt: z.ZodISODateTime;
            portal_plan: z.ZodEnum<{
                pilot: "pilot";
                standard: "standard";
                enterprise: "enterprise";
            }>;
            portal_status: z.ZodEnum<{
                active: "active";
                suspended: "suspended";
                pending_setup: "pending_setup";
                archived: "archived";
                trial: "trial";
            }>;
            trial_ends_at: z.ZodNullable<z.ZodISODateTime>;
            retention_until: z.ZodNullable<z.ZodISODateTime>;
            billing_status: z.ZodEnum<{
                active: "active";
                not_started: "not_started";
                stopped: "stopped";
            }>;
            contact_name: z.ZodNullable<z.ZodString>;
            onboarding_delivery: z.ZodObject<{
                state: z.ZodEnum<{
                    sent: "sent";
                    failed: "failed";
                    not_requested: "not_requested";
                }>;
                invitation_documentId: z.ZodNullable<z.ZodString>;
                error: z.ZodNullable<z.ZodObject<{
                    data: z.ZodNull;
                    error: z.ZodObject<{
                        status: z.ZodNumber;
                        name: z.ZodString;
                        message: z.ZodString;
                        details: z.ZodObject<{
                            code: z.ZodOptional<z.ZodString>;
                            errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
                                path: z.ZodString;
                                message: z.ZodString;
                            }, z.core.$strict>>>;
                        }, z.core.$strip>;
                    }, z.core.$strict>;
                }, z.core.$strict>>;
            }, z.core.$strict>;
            portal_teacher_count: z.ZodNumber;
            suspended_at: z.ZodNullable<z.ZodISODateTime>;
        }, z.core.$strict>;
    }, z.core.$strict>;
    success: number;
    errors: number[];
}>;
