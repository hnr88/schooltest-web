# schooltest-web — frontend inventory (read-only intake)

Repo: `/home/hnr/Code/schooltest/schooltest-web`
Every claim below cites the file it was read from. Nothing here is inferred from naming alone.

Stack, read from `/home/hnr/Code/schooltest/schooltest-web/package.json`:
next 16.2.10, react/react-dom 19.2.7, tailwindcss ^4.3.2, next-intl ^4.13.1,
@tanstack/react-query ^5.101.2, zustand ^5.0.14, @base-ui/react ^1.6.0, shadcn ^4.13.0,
recharts 3.9.2, sonner ^2.0.7, lucide-react ^1.23.0, axios ^1.18.1, zod ^4.4.3,
react-hook-form ^7.81.0, leaflet ^1.9.4 + react-leaflet ^5.0.0 + react-leaflet-cluster ^4.1.3,
next-themes ^0.4.6, @t3-oss/env-nextjs ^0.13.11, @playwright/test ^1.61.1, @axe-core/playwright ^4.12.1.
shadcn style is `base-nova`, `rsc: true`, icon library `lucide` (`/home/hnr/Code/schooltest/schooltest-web/components.json`).

---

## 1. ROUTE MAP

Locale segment: `src/app/[locale]/…`. Locales `en, zh, ko, ms, vi, th`, default `en`,
`localePrefix: 'as-needed'`, `localeCookie: false`, `localeDetection: false`
(`/home/hnr/Code/schooltest/schooltest-web/src/i18n/routing.ts:3-9`).

### Root chrome
| File | What it does |
|---|---|
| `src/app/[locale]/layout.tsx:13-71` | `localFont` Google Sans (`../fonts/GoogleSans-Variable.ttf`, `GoogleSans-Italic-Variable.ttf`) → `--font-sans`; imports `../globals.css`; `NextIntlClientProvider` + `Providers` + `<Toaster/>` (`@/components/ui/sonner`); `notFound()` for a non-locale segment via `isLocale` |
| `src/components/providers.tsx:36-52` | `next-themes` `ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light"` (app is force-light), `QueryClientProvider` (staleTime 60s), `TooltipProvider`, `ReactQueryDevtools` |
| `src/app/[locale]/loading.tsx` | pulse skeleton |
| `src/app/[locale]/error.tsx` | client error boundary, uses `Button` from `@/modules/design-system`, `Common.*` messages |
| `src/app/[locale]/not-found.tsx` | 404 card, `Logo` + `Button` from design-system |
| `src/app/global-error.tsx` | replaces root layout on throw; plain English, raw `<img src="/brand/logo-mark.png">` |
| `src/app/robots.ts`, `src/app/sitemap.ts` | robots + sitemap for `''`, `/articles`, `/design-system` across all 6 locales |
| `src/app/service-worker/route.ts` | serves an inline push service-worker source (push + notificationclick handlers) |
| `src/proxy.ts` | `createMiddleware(routing)` from next-intl; matcher excludes `api|trpc|_next|_vercel|service-worker|*.*`. **This is the only middleware — it does no auth.** |

### Public routes
| Route | Component tree | Query hooks | Endpoints | Status |
|---|---|---|---|---|
| `/[locale]` (landing) | `src/app/[locale]/page.tsx:28-54` → `AnnouncementBar, LandingHeader, HeroSection, TrustedByStrip, FeaturesSection, FeatureDetailSection, StatsBand, HowItWorksSection, PricingSection, FaqSection, CtaSection, LandingFooter` (all `@/modules/landing`) | none | none | **STATIC** |
| `/[locale]/design-system` | `src/app/[locale]/design-system/page.tsx:33-56` → `Container` + `BrandSection, ButtonsSection, BadgesSection, AlertsSection, CardsSection, FormsSection, ChoicesSection, OverlaysSection, DataSection, RecordsSection, MediaSection, FeedbackSection` | none | none | **STATIC** |
| `/[locale]/articles` | `src/app/[locale]/articles/page.tsx:3-20` → `ArticleStatsCards, ArticlesList, CreateArticleForm` | `useArticleStatsQuery`, `useArticlesQuery`, `useCreateArticleMutation` | `GET /api/articles/stats`, `GET /api/articles`, `POST /api/articles` | **FUNCTIONAL** (self-described "example module wired end-to-end to the Strapi `article` API", page.tsx:9) |
| `/[locale]/sign-in` | `src/app/[locale]/sign-in/page.tsx:27-38` → `AuthSplitLayout` > `SignInCard` (`hasGoogleError`, `hasSessionExpired`, `showConfirmedBanner` from `?error=google\|session`, `?confirmed=1`) → `SignInForm` | `useLoginMutation` | `POST /api/auth/local` | **FUNCTIONAL** |
| `/[locale]/sign-up` | `src/app/[locale]/sign-up/page.tsx` → `AuthSplitLayout` > `SignUpCard` → `SignUpForm` / `SignUpConfirmState` | `useRegisterMutation`, `useResendConfirmationMutation` | `POST /api/auth/local/register`, `POST /api/auth/send-email-confirmation` | **FUNCTIONAL** |
| `/[locale]/forgot-password` | `AuthSplitLayout` > `ForgotPasswordCard` → `ForgotPasswordForm` / `ForgotPasswordSentState` | `useForgotPasswordMutation` | `POST /api/auth/forgot-password` | **FUNCTIONAL** |
| `/[locale]/reset-password?code=` | `AuthSplitLayout` > `ResetPasswordCard code={code}` → `ResetPasswordForm` | `useResetPasswordMutation` | `POST /api/auth/reset-password` | **FUNCTIONAL** |
| `/[locale]/auth/google/callback` | `src/app/[locale]/auth/google/callback/page.tsx:24-39` — server component rebuilds the verbatim query string, passes to `GoogleCallbackScreen` | `useGoogleCallbackMutation` (via `hooks/use-google-callback.ts`) | `GET /api/auth/google/callback?<query>` | **FUNCTIONAL** |

### Dashboard routes (all wrapped by `src/app/[locale]/dashboard/layout.tsx:20-39`)
Layout = `ParentGuard` > `SidebarProvider` (`--sidebar-width: 248px`) > `AppSidebar` + `SidebarInset` > `AppTopbar` + scroll container `bg-surface-well`.
`AppSidebar` itself calls `useStudentsQuery()`; `AppTopbar` mounts `NotificationBell` (calls `useNotificationsQuery`) and `UserMenu`.

| Route | Component tree | Query hooks | Endpoints | Status |
|---|---|---|---|---|
| `/[locale]/dashboard` | `DashboardScreen` → `DashboardSkeleton` \| `DashboardGreeting`, `DashboardFamilySummary`, `DashboardRecentProfiles`, `DashboardRecentActivity`, `DashboardPromo`, `DashboardChildSummaryCard`, `DashboardProfileRosterItem` | `useAuth` (→`useMeQuery`), `useDashboardOverviewStudentsQuery` | `GET /api/users/me`, `GET /api/my/students` (paged, all pages) | **FUNCTIONAL** |
| `/[locale]/dashboard/children` | `ChildrenScreen` → `ChildrenRosterSummary`, `ChildrenToolbar`, `ChildrenRoster` (`ChildRosterRow`, `ChildRosterFact`, `ChildrenRowActions`, `ArchiveConfirmDialog`), `ChildrenRosterPager`, `ChildrenRosterSkeleton`, `ChildrenEmptyState` | `useChildrenList` → `useStudentsQuery` ×2 (default + includeArchived), `useArchiveStudentMutation`, `useUnarchiveStudentMutation` | `GET /api/my/students`, `POST /api/students/:documentId/archive`, `POST /api/students/:documentId/unarchive` | **FUNCTIONAL** |
| `/[locale]/dashboard/children/new` | `WizardScreen` (`@/modules/student-wizard`) → `WizardStepper`, `StepPersonal/StepEducation/StepGuardian/StepMedia/StepReview`, `WizardNav` | `useUploadMediaMutation`, `useCreateStudentFullMutation` | `POST /api/upload` (multipart, part `files`), `POST /api/students` | **FUNCTIONAL** |
| `/[locale]/dashboard/children/[documentId]` | `ChildProfileScreen` → `ChildProfileHeader`, `ChildHeroCompletion`, `ChildProfileTabs` → `ChildRecordPanel`, `ChildResults`, `ChildSkillBreakdown`, `ChildProfileSkeleton`, `QueryErrorFallback`, `RecordCrumb` | `useChildProgressQuery`, `useStudentDetailQuery` | `GET /api/my/students/:documentId/progress`, `GET /api/my/students/:documentId` | **FUNCTIONAL** |
| `/[locale]/dashboard/children/[documentId]/edit` | `EditStudentScreen` → `WizardScreen mode="edit"` | `useEditStudent` → `useStudentDetailQuery` + `useUpdateStudentMutation` | `GET /api/my/students/:documentId`, `PUT /api/students/:documentId` | **FUNCTIONAL** |
| `/[locale]/dashboard/search` | `<Suspense>` > `UnifiedSearchScreen` → `SearchModeTabs`, `UnifiedSearchBar`, then `SchoolsPane` \| `AgentsPane` | `useSchoolSearchQuery` (via `use-school-search-pane.ts:57`), `useAgentSearchQuery` (`AgentsPane.tsx:33`) | `POST /api/search/schools`, `POST /api/search/agents` | **FUNCTIONAL** |
| `/[locale]/dashboard/search/schools` | `src/app/[locale]/dashboard/search/schools/page.tsx:8-10` — `permanentRedirect('/dashboard/search?mode=schools')` | — | — | **REDIRECT (308)** |
| `/[locale]/dashboard/search/agents` | `src/app/[locale]/dashboard/search/agents/page.tsx:8-10` — `permanentRedirect('/dashboard/search?mode=agents')` | — | — | **REDIRECT (308)** |
| `/[locale]/dashboard/settings` | `<Suspense>` > `SettingsScreen` → `SettingsTabs` + one of `AuthSettingsPanel` \| `SearchPreferencesForm` \| `NotificationPreferencesPanel` \| `ChildrenSettingsPanel` (tab from `?tab=`) | `useChangePasswordMutation`, `useSearchPreferencesQuery`+`useUpdateSearchPreferencesMutation`, `useNotificationPreferencesQuery`+`useUpdateNotificationPreferencesMutation`+`useVapidPublicKeyQuery`+`useSubscribePushMutation`+`useUnsubscribePushMutation`, `useStudentsQuery` | `POST /api/auth/change-password`; `GET|PUT /api/search-preferences/me`; `GET|PUT /api/notification-preferences/me`; `GET /api/push-subscriptions/vapid-public-key`, `POST /api/push-subscriptions`, `DELETE /api/push-subscriptions`; `GET /api/my/students` | **FUNCTIONAL** |
| `/[locale]/dashboard/notifications` | `NotificationsScreen` → `NotificationFeedList` (`NotificationFeedItem`, `NotificationDayHeading`, `NotificationCategoryIcon`), `NotificationFeedPagination` | `useNotificationsQuery`, `useNotificationActions` → `useMarkNotificationReadMutation`, `useMarkAllNotificationsReadMutation` | `GET /api/notifications`, `PUT /api/notifications/:documentId/read`, `POST /api/notifications/read-all` | **FUNCTIONAL** |

Sidebar nav is only four items — `/dashboard`, `/dashboard/children`, `/dashboard/search`, `/dashboard/settings`
(`src/modules/shell/constants/nav.constants.ts:9-32`); `/dashboard/notifications` is reachable from the topbar bell, not the rail.

---

## 2. MODULE MAP (`src/modules/**`)

16 modules. Public surface = `index.ts` barrel.

### `agent-search`
Barrel: schemas (`agentHitSchema, agentSearchPaginationSchema, agentSearchResponseSchema, agentServiceSchema, agentSortSchema, qeacValidationStatusSchema`), types (`AgentHit, AgentSearchFilters, AgentSearchPagination, AgentSearchRequest, AgentSearchResult, AgentServiceValue, AgentSortBy, QeacValidationStatus`), constants (`AGENT_SERVICES, COUNTRY_CHIPS, DEFAULT_SORT, LANGUAGE_CHIPS, PAGE_SIZE, SORT_OPTIONS`), `storeToRequest`, `useAgentSearchQuery`, `useAgentSearchStore`, components `AgentsPane, AgentCard, AgentCardMeta, AgentFilterRail, AgentSortMenu, AgentResults`.
Internal: `components/AgentFilterControls.tsx`, `lib/agent-card.helpers.ts`.

### `articles`
Barrel: `ArticlesList, ArticleStatsCards, CreateArticleForm`; `useArticlesQuery, useArticleQuery, useArticleStatsQuery, useCreateArticleMutation`; `useArticlesFiltersStore`; `ARTICLE_CATEGORIES, createArticleSchema, CreateArticleInput`; types `Article, ArticleAuthor, ArticleCategory, ArticleStats, ArticleListFilters, ArticleListResult`.
Internal: `constants/article.constants.ts`.

### `auth`
Barrel: hooks `useAuth, useRequireParent`; queries `useMeQuery, useLoginMutation, useRegisterMutation, useForgotPasswordMutation, useResetPasswordMutation, useResendConfirmationMutation, useChangePasswordMutation`; `useAuthStore`; components `AuthSplitLayout, SignInCard, SignInForm, SignUpConfirmState, ForgotPasswordCard, ForgotPasswordForm, ResetPasswordCard, ResetPasswordForm, ResendCountdownButton, SignUpCard, SignUpForm, ParentGuard, ChangePasswordForm, GoogleCallbackScreen`; `GOOGLE_ENABLED`; schemas `loginSchema, registerSchema, signInSchema, signUpSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema` + their input types; types `AuthUser, AuthResponse, RegisterResponse, ResendConfirmationResponse, …ErrorKey, StrapiErrorBody`.
Internal (NOT barrelled): `queries/use-google-callback.mutation.ts`, `hooks/use-google-callback.ts`, `hooks/use-change-password-form.ts`, `components/{ForgotPasswordSentState, GoogleButton, GoogleMark, PasswordField, TextField}.tsx`, `lib/classify-{change-password,forgot-password,resend-confirmation,reset-password,sign-in}-error.ts`, `lib/format-countdown.ts`.

### `children`
Barrel: **only three screens** — `ChildrenScreen, ChildProfileScreen, EditStudentScreen`.
Internal (20 components): `ArchiveConfirmDialog, ChildHeroCompletion, ChildProfileHeader, ChildProfileSkeleton, ChildProfileTabs, ChildRecordPanel, ChildrenEmptyState, ChildrenRoster, ChildrenRosterPager, ChildrenRosterSkeleton, ChildrenRosterSummary, ChildrenRowActions, ChildrenToolbar, ChildResults, ChildRosterFact, ChildRosterRow, ChildSkillBreakdown`; hooks `use-children-list, use-edit-student, use-roster-pagination`; lib `child-learning-progress, child-profile-display, child-profile-facts, child-profile-tab, child-results, child-skills, detail-to-initial-values, roster-facts, roster-pagination, student-display, year-level`; queries `use-archive-student.mutation, use-child-progress.query, use-student-detail.query, use-update-student.mutation`; schemas `child-progress.schema, student-detail.schema`; constants `child-metrics, child-profile`; `types/children.types.ts`.

### `dashboard`
Barrel: `DashboardScreen, DashboardSearch`; `useStudentsQuery, useSearchStudentsQuery`; schemas `studentSchema, studentListRowSchema, studentsResponseSchema, searchStudentsResponseSchema`; `useDashboardSearchStore`; `useDebouncedValue`; types `Student, StudentListRow, StudentsResponse, SearchStudentsResponse`.
NOT barrelled but used by `DashboardScreen`: `useDashboardOverviewStudentsQuery` (same file `queries/use-students.query.ts:60`).
Internal components: `DashboardChildSummaryCard, DashboardFamilySummary, DashboardGreeting, DashboardProfileRosterItem, DashboardPromo, DashboardRecentActivity, DashboardRecentProfiles, DashboardSearchResults, DashboardSkeleton`; `hooks/use-dashboard-search.ts`; `lib/dashboard-overview.ts`; `types/dashboard-overview.types.ts`.

### `design-system`
See §5. ~100 components + `primitives.ts` re-export surface + showcase.

### `i18n`
Barrel: `LocaleSwitcher`, `LOCALES, LOCALE_LABELS`.

### `landing`
Barrel: `AnnouncementBar, LandingHeader, HeroSection, HeroFlow, ScrollReveal, TrustedByStrip, FeaturesSection, FeatureDetailSection, StatsBand, HowItWorksSection, PricingSection, FaqSection, CtaSection, LandingFooter`.
Internal: `AiFeedbackCard, LandingIcons, MobileNav, PricingCard, SocialIcons, TestimonialCard`; `constants/landing.constants.ts`; `hooks/use-scroll-reveal.ts`; `types/scroll-reveal.types.ts`. **No API calls anywhere in this module.**

### `notifications`
Barrel: `NotificationBell, NotificationsScreen, NotificationPreferencesPanel` — three exports only.
Internal (15 more components): `NotificationCategoryIcon, NotificationDayHeading, NotificationDigestField, NotificationFeedItem, NotificationFeedList, NotificationFeedPagination, NotificationPreferenceFields, NotificationPreferenceLockedGroup, NotificationPreferencesForm, NotificationPreferenceToggle, NotificationPreferenceToggleGroup, NotificationPreviewItem, NotificationPreviewList, NotificationPreviewPanel, PushSubscriptionControl`; hooks `use-browser-push-subscription, use-notification-actions, use-notification-preference-form, use-switch-described-by`; lib `notification-display, notification-grouping, notification-preferences`; 7 queries; 3 schemas; 3 constants; 3 types files.

### `query-errors`
Barrel: `QueryErrorFallback`, `classifyQueryError`, types `QueryErrorCause, QueryErrorFallbackProps, QueryErrorState`. Internal: `hooks/useQueryErrorReport.ts`.

### `school-search`
Barrel: schemas (`schoolHitSchema, schoolCoverImageSchema, schoolSearchPaginationSchema, schoolSearchResponseSchema, schoolSectorSchema, schoolStateSchema, schoolTypeSchema`), types (`LevelValue, SchoolCoverImage, SchoolHit, SchoolSearchFilters, SchoolSearchPagination, SchoolSearchRequest, SchoolSearchResult, SchoolTypeValue, SectorValue, SortBy, StateCode`), constants (`DEFAULT_SORT_BY, FEE_MAX_BOUND, FEE_MIN_BOUND, FEE_STEP, LEVELS, PAGE_SIZE, SCHOOL_TYPES, SECTORS, SORT_OPTIONS, STATES`), `storeToRequest`, `countActiveSchoolFilters`, `useSchoolSearchQuery`, `useSchoolSearchStore`, components `SchoolsPane, SchoolFilterRail, SchoolSortMenu, SchoolCard, SchoolCardBadges`.
Internal: map layer `MapToggle, MapZoomControls, MobileMapSheet, SchoolMapClusterLayer, SchoolMapMarker, SchoolResultsMap, SchoolResultsMapPanel, ScrollWheelZoomHandler`, plus `SchoolCardCover, SchoolFeeRangeFilter, SchoolFilterControls, SchoolResults`; hooks `use-map-result-focus, use-school-search-pane`; lib `active-filter-count, fee-range, map-result-focus, school-card.helpers, school-map-utils, store-to-request`.

### `search-shared`
Barrel: `SearchPagination, SearchEmptyState, SearchCardSkeletonList, SearchResultsPanel, SearchSortMenu, SearchFilterSheet`; `getPaginationRange`; `chipVariants` + `ChipVariantProps`; types `PageToken, SearchCardSkeletonListProps, SearchEmptyStateProps, SearchFilterSheetProps, SearchPaginationProps, SearchResultsPanelProps, SearchSortMenuProps, SearchSortOption`.

### `settings`
Barrel: `SettingsScreen` only.
Internal: `AccountIdentityPanel, AccountSummaryPanel, AuthSettingsPanel, ChildrenSettingsPanel, ChildSettingsRow, SearchPreferenceChoiceField, SearchPreferenceDetailsFields, SearchPreferenceFeeFields, SearchPreferenceFields, SearchPreferencesForm, SettingsPanel, SettingsSelectField, SettingsTabs`; hooks `use-search-preference-form, use-settings-tab-sync`; lib `search-preferences, settings-tab`; `queries/use-search-preferences.query.ts`, `queries/use-update-search-preferences.mutation.ts`; `schemas/search-preferences.schema.ts`.

### `shell`
Barrel: `AppSidebar, AppTopbar, RecordCrumb, useRecordCrumb, NAV_ITEMS, SEARCH_HREF`, types `NavItem, NavLabelKey, RecordCrumbProps`.
Internal: `RailSectionLabel, SidebarLogoLink, SidebarNavItem, SidebarPromoPanel, TopbarBreadcrumb, UserMenu`; lib `nav-active, route-meta, user-initials`; `stores/use-record-crumb-store.ts`.

### `student-wizard`
Barrel: `WizardScreen, WizardStepper, WizardNav, StepPersonal, StepEducation, StepGuardian, StepMedia, StepReview, MediaUpload, NationalityCombobox, WizardChoiceField, WizardSelectField, WizardTextField`; `useUploadMediaMutation, useCreateStudentFullMutation`; `toAbsoluteMediaUrl, buildStudentPayload, classifyWizardError`; `useWizardMediaStore`; `createStudentResponseSchema`; media types; `COUNTRY_CODES, getCountryOptions, getCountryNames`; `useStudentWizard`; `createStudentWizardSchema, STEP_FIELDS, StudentWizardValues, StudentWizardOutput`; wizard constants (`CONTACT_CHANNELS, CONTACT_CHANNEL_VALUES, CURRENT_YEAR_LEVEL_VALUES, GENDER_VALUES, PHOTO_MAX_BYTES, PHOTO_MAX_MB, TARGET_ENTRY_YEARS, TERM_VALUES, VOICE_INTRO_MAX_BYTES, VOICE_INTRO_MAX_MB, WIZARD_STEP_COUNT, WIZARD_STEP_KEYS, YEAR_LEVEL_VALUES`); wizard types.
Internal: `MediaPreview, ReviewMedia, ReviewPanel`; hooks `use-media-field, use-review-model, use-wizard-submit`; `constants/wizard-control.constants.ts`; `schemas/upload.schema.ts`.

### `unified-search`
Barrel: `UnifiedSearchScreen, SearchModeTabs, UnifiedSearchBar`; `useSearchModeSync`; `SEARCH_MODES, SEARCH_MODE_PARAM`; type `UnifiedSearchMode`.
Internal: `hooks/use-unified-search-field.ts`.

---

## 3. DATA LAYER

### `src/lib/**`
| File | Contents |
|---|---|
| `src/lib/axios/index.ts` | `export * from './strapi'` — one line |
| `src/lib/axios/strapi.ts` | THE ONLY axios instance. `AUTH_TOKEN_KEY = 'app.auth.token'` (L5); `readClientToken()` / `writeClientToken()` over `window.localStorage` (L7-24); `strapi = axios.create({ baseURL: env.NEXT_PUBLIC_API_BASE_URL, withCredentials: false, timeout: 60_000 })` (L26-30); request interceptor injects `Authorization: Bearer <token>` (L32-43); response interceptor clears the token on 401 (L45-53); Strapi envelope types `StrapiEntity, StrapiPagination, StrapiCollectionResponse<T>, StrapiSingleResponse<T>` (L55-79) |
| `src/lib/env.ts` | `@t3-oss/env-nextjs`: server `API_BASE_URL` (default `http://localhost:1337`); client `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:1337`), `NEXT_PUBLIC_APP_URL` (default `http://localhost:3000`) |
| `src/lib/utils.ts` | `THEME_CLASS_GROUPS` (registers custom `@theme` tokens with tailwind-merge so `text-meta`/`rounded-panel` etc. survive `cn()`), `GROUP_TOKEN_PREFIX`, `cn()` built from `extendTailwindMerge` |
| `src/lib/strapi-media.ts` | `toAbsoluteStrapiMediaUrl()` — resolves relative upload paths against `strapi.defaults.baseURL` |
| `src/lib/student-name.ts` | `getStudentDisplayName()`, `getStudentInitials()` — the single place a student name is composed (mononym-safe) |

There is **no second axios instance and no server-side fetch layer** — every network call in the app goes through `strapi`.

### Every query / mutation hook

| Hook (file) | Method + path | Zod parse |
|---|---|---|
| `useAgentSearchQuery` (`agent-search/queries/use-agent-search.query.ts:15`) | `POST /api/search/agents` (body = `AgentSearchRequest`) | `agentSearchResponseSchema` |
| `useArticlesQuery` (`articles/queries/use-articles.query.ts:24`) | `GET /api/articles` (sort/filters/populate/pagination params) | none (typed `StrapiCollectionResponse<Article>`) |
| `useArticleQuery` (`articles/queries/use-article.query.ts:9`) | `GET /api/articles/:documentId` | none |
| `useArticleStatsQuery` (`articles/queries/use-article-stats.query.ts:9`) | `GET /api/articles/stats` | none |
| `useCreateArticleMutation` (`articles/queries/use-create-article.mutation.ts:10`) | `POST /api/articles` `{ data }` | none (input validated by `createArticleSchema` in the form) |
| `useMeQuery` (`auth/queries/use-me.query.ts:10`) | `GET /api/users/me` | none (typed `AuthUser`) |
| `useLoginMutation` (`auth/queries/use-login.mutation.ts:12-13`) | `POST /api/auth/local` | request via `loginSchema.parse` |
| `useRegisterMutation` (`auth/queries/use-register.mutation.ts:10-11`) | `POST /api/auth/local/register` | request via `registerSchema.parse` |
| `useForgotPasswordMutation` (`use-forgot-password.mutation.ts:14-15`) | `POST /api/auth/forgot-password` | request via `forgotPasswordSchema.parse` |
| `useResetPasswordMutation` (`use-reset-password.mutation.ts:15-16`) | `POST /api/auth/reset-password` `{code, …}` | request via `resetPasswordSchema.parse` |
| `useResendConfirmationMutation` (`use-resend-confirmation.mutation.ts:17-21`) | `POST /api/auth/send-email-confirmation` | request via `forgotPasswordSchema.parse` (shared `{email}` shape) |
| `useChangePasswordMutation` (`use-change-password.mutation.ts:17-18`) | `POST /api/auth/change-password` | request via `changePasswordSchema.parse` |
| `useGoogleCallbackMutation` (`use-google-callback.mutation.ts:14`) | `GET /api/auth/google/callback?<verbatim query>` | none |
| `useStudentsQuery` / `useDashboardOverviewStudentsQuery` (`dashboard/queries/use-students.query.ts:22-29,49,60`) | `GET /api/my/students` (`sort=createdAt:desc`, `pagination{page,pageSize:100}`, optional `filters[status][$in]=active,archived,enrolled`) | `studentsResponseSchema` |
| `useSearchStudentsQuery` (`dashboard/queries/use-search-students.query.ts:14-15`) | `GET /api/search/students?q=` | `searchStudentsResponseSchema` |
| `useStudentDetailQuery` (`children/queries/use-student-detail.query.ts:15-16`) | `GET /api/my/students/:documentId` | `studentDetailResponseSchema` |
| `useChildProgressQuery` (`children/queries/use-child-progress.query.ts:10-11`) | `GET /api/my/students/:documentId/progress` | `childProgressResponseSchema` |
| `useUpdateStudentMutation` (`children/queries/use-update-student.mutation.ts:20-21`) | `PUT /api/students/:documentId` `{ data }` (payload from `buildStudentPayload`) | none on response |
| `useArchiveStudentMutation` / `useUnarchiveStudentMutation` (`children/queries/use-archive-student.mutation.ts:13,17`) | `POST /api/students/:documentId/archive` · `POST /api/students/:documentId/unarchive` (no body) | none |
| `useCreateStudentFullMutation` (`student-wizard/queries/use-create-student-full.mutation.ts:20-21`) | `POST /api/students` `{ data }` | `createStudentResponseSchema` |
| `useUploadMediaMutation` (`student-wizard/queries/use-upload-media.mutation.ts:16-19`) | `POST /api/upload` multipart, part name `files`, one file (no forced Content-Type) | `uploadResponseSchema` |
| `useNotificationsQuery` (`notifications/queries/use-notifications.query.ts:18-21`) | `GET /api/notifications` (params) | request `notificationListParamsSchema`, response `notificationListResponseSchema` |
| `useMarkNotificationReadMutation` (`use-mark-notification-read.mutation.ts:14-18`) | `PUT /api/notifications/:documentId/read` | id `z.string().min(1)`, response `notificationReadResponseSchema` |
| `useMarkAllNotificationsReadMutation` (`use-mark-all-notifications-read.mutation.ts:11-13`) | `POST /api/notifications/read-all` | `notificationReadAllResponseSchema` |
| `useNotificationPreferencesQuery` (`use-notification-preferences.query.ts:12-13`) | `GET /api/notification-preferences/me` | `notificationPreferenceResponseSchema` |
| `useUpdateNotificationPreferencesMutation` (`use-update-notification-preferences.mutation.ts:19-23`) | `PUT /api/notification-preferences/me` | request `notificationPreferenceFormSchema`, response `notificationPreferenceResponseSchema` |
| `useVapidPublicKeyQuery` (`use-vapid-public-key.query.ts:11-12`) | `GET /api/push-subscriptions/vapid-public-key` | `pushVapidConfigResponseSchema` |
| `useSubscribePushMutation` (`use-subscribe-push.mutation.ts:18-22`) | `POST /api/push-subscriptions` | request `pushSubscriptionRequestSchema`, response `pushSubscriptionResponseSchema` |
| `useUnsubscribePushMutation` (`use-unsubscribe-push.mutation.ts:18-21`) | `DELETE /api/push-subscriptions` (body via axios `data`) | request `pushUnsubscribeRequestSchema`, response `pushUnsubscribeResponseSchema` |
| `useSchoolSearchQuery` (`school-search/queries/use-school-search.query.ts:15-16`) | `POST /api/search/schools` (body = `SchoolSearchRequest`) | `schoolSearchResponseSchema` |
| `useSearchPreferencesQuery` (`settings/queries/use-search-preferences.query.ts:12-13`) | `GET /api/search-preferences/me` | `searchPreferenceResponseSchema` |
| `useUpdateSearchPreferencesMutation` (`use-update-search-preferences.mutation.ts:19-21`) | `PUT /api/search-preferences/me` | request `searchPreferenceFormSchema`, response `searchPreferenceResponseSchema` |

Cache key conventions actually in use: `['auth','me']`, `['dashboard','students', {includeArchived}]` and `['dashboard','students',{scope:'overview'}]` and `['dashboard','students',documentId]` (student detail reuses the prefix), `['dashboard','search-students',q]`, `['children','progress',documentId]`, `['notifications', …]` (`NOTIFICATIONS_QUERY_KEY`), `NOTIFICATION_PREFERENCES_QUERY_KEY`, `SEARCH_PREFERENCES_QUERY_KEY`, `VAPID_PUBLIC_KEY_QUERY_KEY`, `['school-search', request]`, `['agent-search', request]`, `['articles', …]`.

---

## 4. AUTH

- **Token storage**: `localStorage` key `app.auth.token`, written/read only by `readClientToken` / `writeClientToken` (`src/lib/axios/strapi.ts:5-24`). No cookie, no session on the server.
- **Attachment**: axios *request* interceptor sets `Authorization: Bearer <token>` on every `strapi` call (`src/lib/axios/strapi.ts:32-43`).
- **Expiry**: axios *response* interceptor wipes the token on any `401` (`src/lib/axios/strapi.ts:45-53`).
- **Client state**: `useAuthStore` (zustand, no persist middleware) holds `token` + `hydrated`; `hydrate()` copies from localStorage (`src/modules/auth/stores/use-auth-store.ts:14-22`).
- **User identity is server state**: `useAuth()` hydrates the store on mount, then reads `useMeQuery(hydrated && Boolean(token))`; `logout()` clears the token, nulls + removes `['auth','me']`, and `router.refresh()` (`src/modules/auth/hooks/use-auth.ts:15-42`).
- **Route guarding is 100% client-side**: `useRequireParent()` hydrates then `router.replace('/sign-in')` once hydrated without a token (`src/modules/auth/hooks/use-require-parent.ts:11-26`); `ParentGuard` renders a `Skeleton` block while `!isReady` and `null` while redirecting (`src/modules/auth/components/ParentGuard.tsx:15-31`); it is mounted **once**, in `src/app/[locale]/dashboard/layout.tsx:22`, so every `/dashboard/*` route is guarded exactly once.
- **No middleware auth**: `src/proxy.ts` is next-intl locale middleware only — no token check, no redirect.
- **Google**: `/auth/google/callback` server page forwards the verbatim query to `GET /api/auth/google/callback`; the real JWT comes only from that response (documented in `src/app/[locale]/auth/google/callback/page.tsx:18-23`). `?error=google` / `?error=session` / `?confirmed=1` are handled by `SignInPage` (`src/app/[locale]/sign-in/page.tsx:19-36`).

---

## 5. DESIGN LAYER TODAY

### `src/app/globals.css` (663 lines)
Imports: `tailwindcss`, `tw-animate-css`, `shadcn/tailwind.css`, `leaflet/dist/leaflet.css` (L1-4). `@custom-variant dark (&:is(.dark *))` (L6).

**`@theme inline` (L8-205)** defines:
- Type scale `--text-*`: `display, h1..h4, flow, cta-title, quote, micro, caption, button, error-code, page-title, panel-title, lede, body-sm, meta, overline, stat-xl, stat-lg, stat-md, stat-sm` (many with `--line-height` / `--letter-spacing` companions).
- `--ease-out-expo`, `--tracking-eyebrow|overline|rail`.
- Semantic colour aliases `--color-*` mapped to the `:root` variables (background, foreground, card, popover, primary, secondary, muted, accent, destructive, success, warning, border, input, ring, chart-1..5, sidebar-*).
- **Contrast-system role tokens** (L96-126, comment references `.qa/CONTRAST-SPEC.md`): `--color-divider, --color-surface-hover, --color-success-soft/strong/ink, --color-warning-soft/strong/ink, --color-danger-soft/soft-2/strong/ink, --color-surface-well (#EEF2F7), --color-surface-inset (#F1F5F9), --color-body (#475569), --color-accent-on-dark, --color-accent-on-dark-hover, --color-navy-muted/body/label, --color-avatar-pink-bg/fg, --color-avatar-violet-bg/fg, --color-skeleton-base/sheen, --color-note-surface, --color-surface-glass`.
- Fonts `--font-sans` (from next/font), `--font-mono`, `--font-heading`.
- Gradients `--background-image-cta-gradient`, `--background-image-navy-promo`, `--background-image-hero-scrim`.
- Shadows `--shadow-sm|md|lg|xl`, `--shadow-primary-glow`, `--shadow-dark-lift`.
- Radii `--radius-sm|md|lg|tile(12px)|panel(16px)|segment(11px)|selection(13px)|xl|2xl|3xl|4xl`.
- Containers `--container-landing: 1200px`, `--container-hero: 1360px`.

**`:root` (L207-265)** — light palette in OKLCH incl. `--navy-950`, chart-1..5, `--radius: 0.625rem`, the eight `--sidebar-*` values (restored to a WHITE rail per the inline comment), and `--shadow-sm|md|lg|xl`.
**`.dark` (L267-304)** — full dark palette (present but unreachable: `Providers` sets `forcedTheme="light"`).

**`@layer base` (L306-316)**: `* { border-border outline-ring/50 }`, `body { bg-background text-foreground }`, `html { font-sans }`.

**Named grid tracks (`@utility`)**: `grid-cols-footer`, `grid-cols-roster-row`, `grid-cols-history-row`, `grid-cols-profile-row`, `grid-cols-score-row`, `grid-cols-skill-row`, `grid-cols-row-compact`, `grid-cols-overview-split`, `grid-cols-search-workspace` (15.5rem | 1fr | 1.2fr), `grid-cols-search-list` (15.5rem | 1fr).

**Motion / scroll utilities**: `@keyframes st-shimmer` + `@utility shimmer-sweep`, `@utility scrollbar-thin`, `@utility scroll-region`, `@utility scroll-region-x`, `@utility rail-viewport` (`calc(100svh - var(--rail-offset, 7rem))`).

**Leaflet skin (L~521-651, unlayered)**: `.leaflet-tile-pane` grayscale filter, `.school-map-cluster(__circle)`, `.school-map-marker(__pin/__inner/--active)`, `.schoolgo-map-popup*`, plus a `@media (prefers-reduced-motion: reduce)` block killing those transitions.

### `src/modules/design-system`
- `index.ts` — the app's canonical component surface. ~80 named components: `Button, Badge, StatusBadge, Tag, CountBadge, NavCountBadge, Logo, Eyebrow, Container, Section, Alert, ProgressBar, StatCard, MetricCard, MiniStatTile, TrendDelta, GaugeRing, InsightCallout, AvatarTint (+getAvatarTone), FeatureCard, EmptyState, PresenceAvatar, SegmentedControl, DataPanel, DataGridHeadRow, DataGridRow, StatusPill, StatStrip, FilterChipGroup, EmptyStateHero, IconButton, TopbarSearchTrigger, UnderlineTabs, ToggleRow, TimelineRow, SubjectProgressCard, PersonCell, ScoreText (+getScoreTone)`; choice family `FieldShell, describedBy, SelectionCardGroup, ChoicePillGroup, SegmentedChoice, SelectField, SelectRow`; media family `MediaCover, MediaCard, FilterRail, FilterRailSection, MapPanelFrame`; record family `PanelHeaderRow, KeyValueList, KeyValueRow, TintTile, NavyPanel, NavyPromoCard, GlassStatTile, BorderedCallout, ActivityFeedRow, DotActivityRow, RankRow, ScoreProgressRow, SkillBreakdownRow, NotesCard, CompletionCell, RowActionsCluster, AvatarStack, BarChart, Sparkline, SkeletonCard, UpcomingEventRow`; `getInitials`; all the `*.types` exports; then `export * from './primitives'` and `export * from './components/showcase'`.
- `primitives.ts` → `primitives/forms.ts` (Input, Textarea, Label, Checkbox, RadioGroup, Switch, Slider, Select*, NativeSelect*, Field*, InputGroup*, Combobox*), `primitives/surfaces.ts` (Card*, Progress*, Skeleton, Spinner, Avatar*, Dialog*, AlertDialog*, DropdownMenu*, Tooltip*, Popover*, Sheet*), `primitives/data.ts` (Tabs*, Table*, Pagination*, Breadcrumb*, Separator, Accordion*, Sidebar* + `useSidebar`).
  Two locally-restyled wrappers sit in front of the raw primitives: `components/menu.tsx` (DropdownMenuContent/Item/SubContent/SubTrigger/CheckboxItem/RadioItem) and `components/select-wrappers.tsx` (SelectContent/SelectItem).
- `lib/`: `button-variants.ts` (cva; variants `default, navy, accent, white, outline-white, outline, secondary, destructive`; sizes with `after:` pointer-target insets), `initials.ts`, `use-roving-radio.ts`.
- `constants/`: `metric-card.constants.ts` (tone maps quoting `.qa/CONTRAST-SPEC.md`), `showcase-table.constants.ts`.
- `types/`: `brand, button, choice, data-display, design-system, media, metrics, primitives, record`.
- `components/showcase/**` (29 files) — the `/design-system` gallery: `alerts, badges, brand, buttons, cards, choices, data, feedback, forms, media, overlays, primitives, records` sections plus interactive demos (`dialog-demo, dropdown-demo, popover-demo, segmented-demo, sheet-demo, tag-demo, alert-dismiss-demo, choice-cards-demo, choice-fields-demo, filter-rail-demo, scroll-affordance-demo, primitives-demo`) and `data-table, metric-cards-row, record-rows, record-charts, select-fields, choice-controls`.

### `src/components/ui` — 55 read-only shadcn (`base-nova`) primitives
`accordion, alert-dialog, alert, aspect-ratio, avatar, badge, breadcrumb, button-group, button, calendar, card, carousel, chart, checkbox, collapsible, combobox, command, context-menu, dialog, direction, drawer, dropdown-menu, empty, field, hover-card, input-group, input-otp, input, item, kbd, label, menubar, native-select, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, spinner, switch, table, tabs, textarea, toggle-group, toggle, tooltip`.
Note: only a subset is re-exported through `design-system/primitives` — `calendar, carousel, chart, command, context-menu, drawer, empty, hover-card, input-otp, item, kbd, menubar, navigation-menu, resizable, scroll-area, toggle, toggle-group, aspect-ratio, badge, button, alert, collapsible, direction, sonner` are present in `src/components/ui` but not surfaced by the design-system barrel.

---

## 6. UNCOMMITTED WORK

`git status --short`: **101 modified, 35 deleted, 77 untracked entries** (75 files + the untracked directories `.qa/design/` and `dashbaord-design/`).
`git diff --stat` totals: **136 files changed, 3340 insertions(+), 3321 deletions(-)**. Nothing is staged (`git diff --cached --stat` is empty).
HEAD is `3ad82d8 feat(ui): canonical contrast system, and fix the type scale that never rendered`.

### 6a. Design / presentation work (the bulk — replaceable)
**New untracked design-system components (28)**: `activity-feed-row, avatar-stack, bar-chart, bordered-callout, choice-pill-group, completion-cell, field-shell, filter-rail, filter-rail-section, glass-stat-tile, key-value-row, map-panel-frame, media-card, media-cover, navy-panel, navy-promo-card, notes-card, panel-header-row, rank-row, row-actions-cluster, score-progress-row, segmented-choice, select-field, select-row, selection-card, skeleton-card, skill-breakdown-row, sparkline, tint-tile, upcoming-event-row` + `lib/use-roving-radio.ts` + `types/{choice,media,record}.types.ts`, and 9 new showcase files (`choice-cards-demo, choice-fields-demo, choices-section, filter-rail-demo, media-section, record-charts, record-rows, records-section, scroll-affordance-demo`).
**Modified**: `src/app/globals.css` (+164, new tokens/utilities), `src/lib/utils.ts` (one line — registers `segment` + `selection` radii with tailwind-merge), `design-system/index.ts` (+82 exports), `design-system/components/segmented-control.tsx`, `design-system/components/showcase/index.ts`, `design-system/types/metrics.types.ts`, `src/app/[locale]/design-system/page.tsx` (mounts `ChoicesSection, RecordsSection, MediaSection`).
**All six i18n catalogs** `src/i18n/messages/{en,ko,ms,th,vi,zh}.json` gain ~170 lines each — copy for the new panels/controls.
Purely presentational rewrites of existing screens: `children/components/*` (profile split into `ChildProfileTabs` + `ChildRecordPanel` + `ChildHeroCompletion`), `dashboard/components/*` (metrics/readiness/explore panels deleted, `DashboardPromo` + `DashboardRecentActivity` added), `notifications/components/*` (preference form re-skinned, `NotificationCard` deleted), `school-search` + `agent-search` + `search-shared` (chips/panels/grids replaced by rails/menus/list surfaces), `settings/components/*`, `student-wizard/components/*`.

### 6b. Changes that touch functional wiring (must be preserved / re-checked)
Nothing under `src/lib/axios/**`, nothing under any `*/queries/**`, and **no file in `src/modules/auth`** is modified — the network layer, auth and all 33 query/mutation hooks are exactly as committed. The functional-adjacent edits are:
1. `src/modules/agent-search/stores/use-agent-search-store.ts` — `toggleCountry/toggleLanguage/toggleService` **replaced** by `setCountries/setLanguages/setServices` (whole-selection setters for `ChoicePillGroup`). Search request shape unchanged.
2. `src/modules/school-search/stores/use-school-search-store.ts` — `toggleState/toggleSector/toggleSchoolType/setToggle` **replaced** by `setStates/setSectors/setSchoolTypes/setToggles(keys)`; `ToggleKey` type dropped. Request shape unchanged.
3. `src/modules/dashboard/lib/dashboard-overview.ts` (+72) — new derived selectors `getPlanBoardStats`, activity-entry mapping (`ACTIVITY_ROWS_LIMIT`), avatar-stack mapping. Derived from `GET /api/my/students` rows only; no new endpoint.
4. `src/modules/children/lib/child-learning-progress.ts`, `children/types/children.types.ts`, `dashboard/types/dashboard-overview.types.ts`, `settings/types/settings.types.ts`, `search-shared/types/search-shared.types.ts`, `student-wizard/types/student-wizard.types.ts` — view-model type reshapes following the component rewrites.
5. Barrel churn: `agent-search/index.ts`, `school-search/index.ts`, `search-shared/index.ts`, `student-wizard/index.ts`, `design-system/index.ts` — exports added/removed to match the new/deleted components.
6. 10 e2e specs modified + 3 new (`053-wizard-controls.spec.ts`, `zz-hit.spec.ts`, `zz-probe.spec.ts`) — assertions retargeted at the new markup.

### 6c. Deleted files (35)
```
src/modules/agent-search/components/AgentCardSkeleton.tsx
src/modules/agent-search/components/AgentFilterPanel.tsx
src/modules/agent-search/components/AgentFilterSection.tsx
src/modules/agent-search/components/AgentResultsGrid.tsx
src/modules/agent-search/components/AgentSortChip.tsx
src/modules/children/components/ChildEnrolmentPanel.tsx
src/modules/children/components/ChildFactList.tsx
src/modules/children/components/ChildGuardianPanel.tsx
src/modules/children/components/ChildLearningSummary.tsx
src/modules/children/components/ChildMetrics.tsx
src/modules/children/components/ChildSkillPendingTile.tsx
src/modules/children/components/ChildSkillTile.tsx
src/modules/dashboard/components/DashboardActionLink.tsx
src/modules/dashboard/components/DashboardExploreOptions.tsx
src/modules/dashboard/components/DashboardMetrics.tsx
src/modules/dashboard/components/DashboardReadinessCard.tsx
src/modules/notifications/components/NotificationCard.tsx
src/modules/school-search/components/FeeRangeChip.tsx
src/modules/school-search/components/FilterChip.tsx
src/modules/school-search/components/SchoolCardSkeleton.tsx
src/modules/school-search/components/SchoolFilterPanel.tsx
src/modules/school-search/components/SchoolFilterSection.tsx
src/modules/school-search/components/SchoolResultsGrid.tsx
src/modules/school-search/components/SchoolsSplitLayout.tsx
src/modules/school-search/components/SortChip.tsx
src/modules/school-search/lib/chip-variants.ts
src/modules/school-search/lib/school-badge-variants.ts
src/modules/search-shared/components/SearchCardSkeletonGrid.tsx
src/modules/search-shared/components/SearchFilterChip.tsx
src/modules/settings/components/SearchSettingsPanel.tsx
src/modules/settings/components/SettingsCheckboxGroup.tsx
src/modules/settings/components/SettingsFactRow.tsx
src/modules/student-wizard/components/ContactChannelCards.tsx
src/modules/student-wizard/components/ReviewSection.tsx
src/modules/student-wizard/components/WizardField.tsx
```
Every deleted file is a presentation component or a class-variant helper. No query, schema, store, guard or axios file was deleted.

### 6d. Untracked non-source directories
- `/home/hnr/Code/schooltest/schooltest-web/dashbaord-design/` — an exported design bundle: `SchoolTest Design System.html/.dc.html`, `SchoolTest App Screens.dc.html`, `SchoolTest Landing.dc.html`, `Parent Portal.dc.html`, `Canvas.dc.html`, `export-src.dc.html`, `tokens.css`, `fonts/GoogleSans-*.ttf`, `assets/logo.png`, `assets/logo-mark.png`, `uploads/*.png`, `image-slot.js`, `support.js`.
- `/home/hnr/Code/schooltest/schooltest-web/.qa/design/` — `screens-index.json`, `split.mjs`, `split2.mjs`, and `screens/*.html` (per-screen canonical HTML: `app--404, app--add-child, app--admissions-profile, app--child-profile, app--all-results, app--billing, …`).

---

## 7. E2E (Playwright)

Config `/home/hnr/Code/schooltest/schooltest-web/playwright.config.ts`: `testDir ./tests/e2e`, chromium only, `fullyParallel`, html reporter, baseURL `http://localhost:3100` (override `E2E_BASE_URL`/`E2E_PORT`), `webServer` boots `pnpm exec next dev -p 3100` itself.

**56 spec files.** Coverage:

| Spec | Flow covered |
|---|---|
| `home.spec.ts` | home renders with the Schooltest title; `/articles` renders its heading |
| `landing.spec.ts` | every landing section renders from en.json and zh.json; section landmark order + single h1; in-page anchors incl. header Pricing → `#pricing` |
| `landing-aria.spec.ts` | nav landmark / socials / rating / score-bar aria labels from en.json and zh |
| `locale-routing.spec.ts` | `/en` canonicalizes unprefixed; unprefixed stays English despite browser prefs; locale selector preserves route; non-default prefixes survive deep links |
| `a11y-responsive.spec.ts` | axe on `/`, `/design-system`, `/zh`; no h-scroll + ≥44px targets at 375/1280; skip link first, Escape closes mobile menu |
| `design-system.spec.ts` | every showcase export renders with all variants; overlay/segmented/tag/alert/tabs interactions; `cn()` className merge; footer locale toggle en→zh→en |
| `design-system-zh.spec.ts` | `/zh/design-system` renders from zh.json |
| `design-tokens.spec.ts` | custom sizes/radii survive `cn()` in the real DOM (parity with `THEME_CLASS_GROUPS`) |
| `sign-in.spec.ts` | §14.1 split panel + axe; `?confirmed=1` banner; empty-submit validation with no api call; wrong password inline error; seeded login stores JWT → `/dashboard`; existing token redirects; `/zh/sign-in` |
| `sign-up.spec.ts` | card structure + axe; field validation; password mismatch client-side; taken email/username inline error; existing token redirect; `/zh/sign-up` |
| `sign-up-confirm.spec.ts` | register → check-email state → Mailpit link → `/sign-in?confirmed=1` → login; sign-in before confirming |
| `parent-auth.spec.ts` | real password login lands on `/dashboard` with both seeded students, network-verified; empty submit → zod errors, no api call |
| `parent-auth-errors.spec.ts` | wrong password / unknown email → same styled translated error, no Strapi leak, axe clean |
| `a11y-auth.spec.ts` | axe + responsive + focus order for sign-in, sign-up, google-callback error, authed dashboard, dashboard search panel; live Google consent round-trip |
| `auth-logo.spec.ts` | (no `test(` / `test.describe(` titles matched — see UNKNOWNS) |
| `forgot-reset.spec.ts` | wrong password → forgot → sent state + countdown; `/reset-password` without code; garbage `?code=`; full forgot → styled email → reset → auto-login → old password dead; 31-min expiry; zero stock strapi.io emails |
| `change-password.spec.ts` | settings change-password → toast → sign out → old password dead; garbage Bearer → token cleared → `/sign-in?error=session` |
| `google-callback.spec.ts` | Google button links on sign-in and sign-up cards; callback with no query → `?error=google`; callback query forwarded to the real api and rejected; existing token still redirects |
| `dashboard.spec.ts` | incognito `/dashboard` → `/sign-in` (real client guard); seeded session renders the guarded shell, axe clean; sign-out clears JWT; mobile overview routes to the children roster |
| `dashboard-search.spec.ts` / `dashboard-search-bar.spec.ts` | debounce to one settled request, filter/clear/no-results/Escape, axe; arrow-key navigation + Enter select |
| `students-list.spec.ts` | seeded parent sees Mia and Jonas as active cards, axe; fresh parent sees the real empty state |
| `dashboard-students.spec.ts` | archive → confirm → disappears; "Include archived" restores; unarchive (DB-proven); edit opens the wizard prefilled (passport empty) and Save PUTs |
| `children-profile.spec.ts` | child cards open a real persisted profile with metrics and an honest results state; mobile; a foreign child profile stays unavailable |
| `051-step-guardian.spec.ts` | wizard step 3 cards, default whatsapp, click/keyboard select, validation, advance; zh labels |
| `052-step-media.spec.ts` | wizard step 4 client gate, real upload preview, remove, voice; zh copy |
| `053-wizard-controls.spec.ts` (new) | gender is a real radiogroup (one tab stop, arrow keys, 44px targets); education selects show localized labels; term/channel radiogroups |
| `student-wizard-contrast.spec.ts` | wizard options stay readable; a selected student persists after reload |
| `unified-search.spec.ts` | sidebar nav → default corpus, one debounced request, chip filter, pagination; reset-desync guard; axe both modes; `/zh/dashboard/search`; 375px rail → Filters trigger |
| `unified-search-states.spec.ts` | mode persists to `?mode`; agents corpus (verified, no pagination); agents service-enum + `name_desc` sort; 308 redirects from the retired standalone routes; intercepted 500 → Alert + retry |
| `school-filter-panel.spec.ts` | grouped filter panel changes the real result request |
| `school-search-presentation.spec.ts` | persistent filters, real Strapi media, expanded desktop map |
| `school-map.spec.ts` | clusters at zoom 5 → de-cluster on zoom-in; card↔pin hover sync; Map/List toggle; 375px map sheet; axe; reduced-motion snap; SSR without a Leaflet window crash |
| `agent-search-polish.spec.ts` | a real agent query + grouped filters return polished verified cards |
| `settings-tabs.spec.ts` | tabs URL-addressable + keyboard-operable + real child management; search preferences write to the real API and survive reload; auth settings change/restore the seeded password |
| `notification-feed.spec.ts` | parent sees a real activity notification, marks it read, state persists; mobile |
| `notification-preferences.spec.ts` | endpoints refuse anonymous; settings save a real preference and persist; localized save error |
| `notification-preference-controls.spec.ts` | sms + push opt-outs round-trip; sms blocked-delivery helper linked to the switch; locked categories + unselectable deferred digests |
| `notification-mutation-error.spec.ts` | localized error when the real API refuses a mutation |
| `notification-dead-link.spec.ts` | deleted child → calm not-found; malformed link; non-parent message; every link shape reaches a usable page |
| `notification-api-security.spec.ts` | validation, authentication and ownership enforcement |
| `push-subscription.spec.ts` | config parent-only, never exposes the private VAPID key; subscriptions persist, owner-scoped, delete idempotently; same-origin worker + real permission state |
| `push-subscription-security.spec.ts` | a parent cannot claim another parent's endpoint; failed VAPID config leaves no enabled no-op control |
| `shell.spec.ts` | 248px sidebar with the 4 catalog-labelled links + solid active overview; icon-rail toggle and Ctrl+B; topbar breadcrumb/title; each nav link lands on its contract URL; user chip → Sign out clears the token; 375px Sheet nav + Escape |
| `shell-a11y.spec.ts` | axe on `/dashboard` at 1280 and at 375 (closed + Sheet-open) |
| `zz-hit.spec.ts` (new) | pointer hit areas |
| `zz-probe.spec.ts` (new) | probe density + clickability; probe controls geometry |

Helpers under `tests/e2e/helpers/`: `auth.ts` (`SEEDED_PARENT`, `loginAsParent`), `auth-db.ts` (direct SQL: `runSql`, `backdateResetIssuance`, `userResetToken`, `userRoleType`, …), `mailpit.ts` (Mailpit API at `http://127.0.0.1:8125/api/v1`, API base `http://localhost:5500`, reset/confirmation link regexes, styled-email assertions), `i18n.ts` (message-catalog loaders + landing key lists), `school-map.ts`, `sign-up-form.ts`, `student-cleanup.ts`, `throwaway-parent.ts`, `ui.ts` (`watchErrors`, `collectSmallTargets`, `waitForAnimationsSettled`).

---

## UNKNOWNS

- `tests/e2e/auth-logo.spec.ts` — my title extraction (`grep` for `test(` / `test.describe(`) returned nothing for this file, so I cannot state what it asserts without reading it; I did not read its body.
- Whether the Strapi API actually implements every endpoint listed in §3 (e.g. `/api/articles/stats`) is not determinable from this repo; the table records what the frontend calls, not what the server serves.
- `src/lib/env.ts` declares a server-side `API_BASE_URL`, but I found no file in `src/**` that imports it (only `NEXT_PUBLIC_API_BASE_URL` is used, by `src/lib/axios/strapi.ts:27`). Whether it is consumed at build/deploy time (Dockerfile, docker-compose) was outside the files I was asked to read.
- Route `FUNCTIONAL`/`STATIC` marks reflect whether the route's component tree calls a query/mutation hook. `/[locale]` and `/[locale]/design-system` render zero hooks, hence STATIC.
