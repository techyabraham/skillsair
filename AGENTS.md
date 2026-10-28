# SkillsAir Frontend Agent Guide

## Purpose and Scope

This repository is the SkillsAir customer-facing web application. It replaces the old WordPress-rendered frontend while continuing to use WordPress/Tutor LMS as the historical source of some legacy data during migration. The intended current architecture pairs this Next.js frontend with the Payload CMS API in the sibling repository at `C:\src\skillsair-backend`.

Use this file as the frontend repository's operating guide. Before changing backend behavior, read `C:\src\skillsair-backend\AGENTS.md` and implement the change in that repository. The frontend's API routes are mostly a same-origin backend-for-frontend (BFF), not the authoritative business/data layer.

Read AMBASSADORS.md before any ambassador work.

## Collaboration Rules

- Inspect `git status --short` before editing. Preserve existing user changes; do not reset, checkout, or overwrite unrelated work.
- Trace a feature end to end before changing it: page/component -> same-origin `/api/...` route -> `src/lib/backend-api.ts` -> Payload endpoint/collection -> any external provider.
- Keep business rules, authorization, enrollment/payment fulfillment, and persistence in the backend. The frontend may validate for usability, adapt response shapes, and render state, but must not become the source of truth.
- Prefer existing component, API proxy, and styling patterns. Keep TypeScript types explicit and avoid `any`.
- Do not put secrets in `NEXT_PUBLIC_*`, browser code, logs, documentation, or commits. Never copy values from `.env.local` into tracked files. Rotate credentials if exposed.
- Do not make real Paystack charges, send production emails, mutate live student records, or run production migrations without explicit authorization.
- Do not assume that two services in the same VPS/Coolify project can resolve each other; verify their configured network and health from the running services.
- The user has previously instructed agents not to run `npm run build` because it has not been reliable in their workflow. Respect that unless the user explicitly authorizes it again. A deployment build still runs through the Dockerfile.
- Avoid scope creep: preserve working login, course access, checkout, and learning flows when changing adjacent features.

## Product and Architecture

SkillsAir is an e-learning platform focused on affordable, job-ready technology courses for African learners. The frontend provides public course discovery and marketing pages, student account and learning experiences, and checkout. Course prices are presented in Nigerian naira (NGN).

```text
Browser
  -> Next.js App Router page/client component
  -> same-origin Next route handler under src/app/api (BFF)
  -> SKILLSAIR_BACKEND_URL + /api/... (Payload CMS backend)
  -> Payload collections/custom endpoints + PostgreSQL/storage/providers
```

The browser should normally call the frontend's same-origin `/api/...` routes. This keeps backend origin and credential handling server-side, avoids browser CORS coupling, and lets route handlers normalize the Payload API into the frontend's established response types. `src/lib/backend-api.ts` is the shared server-side transport; it forwards the `sa_backend_access` cookie as a bearer token, preserves media `Range` requests, disables caching for API calls, and validates the configured backend origin.

The sibling backend owns users and authorization, courses and curriculum, enrollments/progress, orders/subscriptions/certificates, payment verification/fulfillment, and media access. Its `AGENTS.md` is the source of truth for backend endpoints, schemas, migrations, security controls, and backend commands.

### Backend Configuration

- `SKILLSAIR_BACKEND_URL`: server-only **origin**, e.g. `https://kiwi.skillsair.com`; do not append `/api` or a path. The frontend adds `/api/` for resource calls.
- `BACKEND_API_URL`: legacy local-development fallback only. Production falls back to the SkillsAir backend host if `SKILLSAIR_BACKEND_URL` is absent, but deployments should set it explicitly.
- `NEXT_PUBLIC_SITE_URL`: canonical public site URL, used for links and health-check origin.
- `.env.example` lists the tracked frontend settings. `.env.local` is private and must not be read into generated documentation or committed.

`GET /api/health` checks the configured backend's `/health` and reports frontend/backend reachability. A reachable host is not proof that the required API routes, credentials, or data are correct; test the actual failing route as well.

## What Exists

### Pages and User-Facing Areas

- Public marketing: `src/app/(public)/page.tsx` (home) and `src/app/(public)/about/page.tsx` (about).
- Course discovery: `src/app/(public)/courses/page.tsx` and `src/app/(public)/courses/[slug]/page.tsx`.
- Account access: `/login`, `/register`, `/forgot-password`, and `/reset-password`.
- Student area: `/dashboard`, `/dashboard/courses`, `/dashboard/courses/[slug]/learn`, `/dashboard/certificates`, `/dashboard/subscription`, `/dashboard/orders`, and `/dashboard/profile` under the protected route group.
- Purchase flow: `/checkout`, `/payments/callback`, `/subscriptions/callback`, and `/order-confirmation/[id]`.

Protected pages use `src/app/(protected)/layout.tsx` and the auth guard/provider patterns. Route groups in parentheses organize code and do not appear in URLs.

### Reusable Components

- `src/components/layout`: site header/footer, dashboard navigation, newsletter form.
- `src/components/home`: hero, featured courses, categories, stats, testimonials, career-test banner, Why SkillsAir, What You Will Get, How It Works, CTA sections.
- `src/components/about`: about hero, vision/mission, stats counter.
- `src/components/course`: course cards/grid/filter sidebar, curriculum accordion, single-course presentation.
- `src/components/dashboard`: dashboard overview, enrolled courses, course player, certificates, orders, profile, subscription.
- `src/components/checkout`: checkout, payment callback, order confirmation.
- `src/components/auth`: login/register/reset forms and auth guard.
- `src/components/ui`: shared button, input, badge, avatar, modal, pagination, progress, skeleton, spinner, rating, toast, and logo primitives.

### Data, State, and Types

- `src/lib/backend-api.ts`: server-side Payload API origin, URL construction, auth forwarding, fetch, and response/error handling.
- `src/lib/api.ts`: compatibility facade (`tutorApi`/`wooApi`) plus backend API helpers. Legacy names may remain for callers; verify actual destination before adding behavior. Do not reintroduce WordPress/WooCommerce as the primary runtime backend.
- `src/lib/backend-course-mapper.ts`: converts Payload course/relationship responses into the frontend `Course` shape. Update it when the Payload response contract changes, and keep null/empty relationship cases safe.
- `src/lib/auth.ts`, `src/hooks/useAuth.ts`: auth/session helpers and client auth state. Session tokens are held in an HttpOnly cookie, not localStorage.
- `src/lib/server-course-catalog.ts`, `src/lib/tutor-curriculum.ts`: legacy/transition code; inspect callers before changing or deleting it.
- `src/hooks`: course and student data hooks.
- `src/types`: shared course, user, order, and barrel types. Keep API normalization at the boundary rather than weakening shared types.
- `src/app/providers.tsx`: client providers (including Apollo where used); `src/lib/apollo-client.ts` and GraphQL route are compatibility/integration support, not a reason to bypass the Payload BFF for ordinary app data.

### Next.js API Route Surface

Route handlers in `src/app/api` proxy/normalize backend requests and should remain thin:

- `auth/*`, `register`: login, registration, session refresh/current user/logout, forgot/reset password.
- `courses`, `courses/[slug]`, course `plans` and `reviews`, `categories`: public catalog and course details.
- `learning/*`: curriculum, enrollment, lesson progress, quiz listing/submission.
- `media/lesson/[lessonId]` and `media/tutor-video`: protected/legacy media streaming paths; preserve HTTP `Range` behavior for video seeking.
- `checkout`, `paystack/verify`, `orders/*`, `subscriptions/*`: purchase and account billing operations.
- `students/[id]/*`, `certificates/*`: student stats, enrolled courses, certificates.
- `profile/*`, `newsletter`, `graphql`, `health`: profile/avatar/password, newsletter subscription, GraphQL compatibility, and health check.

Before adding an endpoint, check whether the backend already exposes the operation and whether a frontend route already proxies it. Match the existing success/error response shape and status codes; do not convert backend failures into successful empty data or misleading `404 Course not found` responses.

## Important End-to-End Contracts

### Catalog and Curriculum

1. Catalog pages load through the frontend `/api/courses` route, backed by Payload courses.
2. Course slugs are the public URL contract; Payload IDs are used for enrollment and learning operations. Do not substitute one for the other without an explicit lookup.
3. Course relationship fields can be populated objects, IDs, or join records (`docs`); use the mapper and handle all valid forms.
4. The curriculum route is `GET /api/learning/courses/:id/curriculum` on the frontend. Its backend counterpart is `GET /api/courses/:courseId/curriculum`.
5. Distinguish a missing course from a missing curriculum capability or temporary API outage. Keep the course detail page renderable if curriculum is independently unavailable, and show a truthful learning error rather than a false course-not-found state.

### Authentication and Authorization

- Login/register/reset are performed through same-origin route handlers. Keep access tokens server-side in the HttpOnly `sa_backend_access` cookie; use the shared cookie options in `backend-api.ts` where applicable.
- Never rely only on hidden UI to protect course content. The backend must authorize the user and enrollment for protected lesson content, progress, certificates, orders, and account data.
- Do not accept a client-supplied student ID as proof of identity. Derive identity from the backend-validated session/token or verify ownership on the backend.

### Learning and Media

- Enrollment, course completion, lesson progress, and quiz results are backend-owned state. Refresh/render from the backend response rather than assuming a button click persisted.
- Private video and attachment requests must preserve authorization and streaming headers (especially `Range` and relevant content headers). Do not expose Google Drive service credentials or private file URLs to unauthenticated clients.
- Legacy Tutor LMS / Google Drive URLs may require backend resolution or stream proxying. Test a real authorized lesson, a non-enrolled user, and seeking in a video player when changing this flow.

### Payments, Orders, and Certificates

- The expected gateway is Paystack; the backend is authoritative for initialization, verification, webhook processing, order state, enrollment entitlement, renewals, refunds, and paid certificates.
- The frontend may redirect/open payment UI and display verified outcomes, but must not mark an order paid or enroll a student based only on a browser callback.
- Course enrollment/purchase and certificate purchase are distinct flows. Keep course and certificate pricing/fulfillment rules in sync with backend plans/endpoints; certificate access should only appear after the backend confirms course completion, and download/link actions require an issued certificate.
- Use test mode or mocked responses for development. Never use live payment credentials for verification work.

## Styling and UX Conventions

- Framework: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Framer Motion; SWR/Apollo are present where existing code uses them.
- Follow `tailwind.config.ts`, `src/app/globals.css`, existing components, and the rendered page before adding new tokens or styles. Keep the site mobile-first and maintain keyboard/focus/accessibility behavior.
- Reuse shared UI components, loading/empty/error states, and existing motion patterns. Avoid adding a second animation or component system without a concrete need.
- Preserve public marketing copy and existing homepage sections unless the task explicitly requests edits to them.
- Use `next/image` for images when supported by the current asset/remote-host configuration. Check `next.config.mjs` before introducing a new remote image host.

## Local Development and Verification

Prerequisites: Node.js 20 (matches the Docker image) and dependencies installed from the lockfile.

```powershell
npm ci
npm run dev
npx tsc --noEmit
npm run lint
```

There is currently no dedicated test script in `package.json`. Add focused automated tests when behavior warrants them, but do not claim a test suite passed when none exists. Do not run `npm run build` unless the user explicitly changes the standing instruction above. For app/runtime issues, prefer a local dev run, targeted route checks, and type/lint verification; production Docker builds execute the build command.

## Deployment Notes

- The application is a server-rendered Next.js service, not a static export. Use the included `Dockerfile` with Coolify's Dockerfile build pack (or the supplied Compose file if configuring it as a Compose resource). It listens on port `3000`.
- Set `SKILLSAIR_BACKEND_URL` to the backend origin and `NEXT_PUBLIC_SITE_URL` to the frontend's canonical HTTPS origin in the runtime environment. Keep all backend provider/database secrets in the backend service only.
- `docker-compose.yml` describes only the frontend service. It does not provision the backend, database, Redis, or shared networking.
- Review `next.config.mjs` standalone output and Docker packaging together. **Known packaging gap to verify/fix before relying on image assets:** the current Dockerfile copies `.next/standalone` and `.next/static`, but does not explicitly copy `/app/public`; assets stored under `public/` may therefore be absent from the runtime image.
- Ensure reverse proxy/ Coolify routes external HTTPS traffic to container port 3000. Configure backend CORS/origin policy for the frontend host as needed, while keeping server-to-server calls available on the chosen backend hostname/network.
- After deployment, check `/api/health`, then check actual catalog, course detail, curriculum, login, and authorized media routes. Health alone only establishes basic reachability.

## Known Integration History (Re-verify Before Acting)

These are dated observations, not guarantees about the current live deployment:

- On 2026-10-14, `https://kiwi.skillsair.com/health` responded, but `GET /api/courses/10/curriculum` and `/api/courses/12/curriculum` were observed returning 404 even though the corresponding custom curriculum endpoint existed in the checked-in backend source. This points to a deployment/version, route registration, or routing mismatch; compare live API behavior with `C:\src\skillsair-backend\src\endpoints\courses\curriculum.ts` and its deployment before changing frontend error handling.
- On that same check, the frontend health endpoint reported backend status 403. Re-test from the actual deployed frontend because host/WAF/CORS/security rules and deployment configuration can change.
- Some imported courses were observed with sections but no lessons linked (including the Graphics Design course), while another course had lessons. An empty curriculum can be valid backend data as well as an API defect; verify Payload relationships/admin data before concluding the frontend failed to load lessons.
- Course descriptions, thumbnails, category links, historical media URLs, and legacy enrollment records depend on migration/data quality. Reconcile source counts and spot-check real records before cutover or bulk edits. WordPress password hashes are not reusable as SkillsAir credentials; direct students through password reset.

When reporting any of these issues, record the exact URL, HTTP status, sanitized response shape, deployment revision, and timestamp. Never include tokens, credentials, or private student data in the report.

## Change Checklist

Before finishing a task, confirm:

1. The user-facing route and the same-origin API route are both understood.
2. The backend contract and access rules are verified in the sibling backend repository when relevant.
3. Loading, empty, error, and unauthorized states remain distinct and accurate.
4. Responsive and keyboard interactions are preserved for UI changes.
5. `git diff --check` and the appropriate allowed verification commands pass; summarize anything not run.
6. The final report names changed files, behavior, verification performed, and any deployment/backend action still required.
