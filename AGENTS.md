# AGENTS.md — Junsekino CMS

This file defines the engineering rules, architecture conventions, and AI-assisted development workflow for the Junsekino CMS project.

All AI coding assistants working with this repository should read and follow this file before proposing or modifying code.

---

# 1. Project Overview

Junsekino CMS is a multi-company content management platform for the Junsekino group.

The system consists of:

- Public website
- Admin CMS
- Multi-company workspace
- Company-specific branding
- Thai and English content
- Media management
- Project management
- Award management
- Public / media content
- News
- Homepage slideshow
- SEO
- Publishing workflow
- Role and permission management
- Audit logging

The architecture should remain extensible so additional companies and content modules can be added without duplicating infrastructure.

---

# 2. Technology Stack

Current primary stack:

- Next.js 16
- App Router
- React 19
- JavaScript
- Tailwind CSS 4
- Firebase Authentication
- Cloud Firestore
- Firebase Storage / Google Cloud Storage
- Firebase Admin SDK
- Zod
- Sonner
- Lucide React
- Vercel

Do not introduce another major framework or state-management system unless there is a clear architectural reason.

---

# 3. Language Rules

Use JavaScript.

Do not convert the project to TypeScript unless explicitly requested.

Preferred extensions:

```text
.js
.jsx
```

Do not introduce `.ts` or `.tsx` files into existing JavaScript modules without explicit approval.

---

# 4. Source of Truth

During active development:

```text
Local VS Code
    ↓
lint
    ↓
build
    ↓
runtime test
    ↓
Git commit
    ↓
GitHub
```

The local working copy is the source of truth until changes are committed and pushed.

After a checkpoint has been pushed, GitHub becomes the latest stable baseline.

AI assistants must not assume GitHub contains uncommitted local changes.

When current local code has been supplied in the conversation, prefer it over an older GitHub version.

---

# 5. AI Development Workflow

Before proposing changes to an existing module:

1. Read the latest relevant source files.
2. Understand the existing architecture.
3. Search for existing implementations before creating new ones.
4. Identify dependencies between UI, API, service, repository, schema, permissions, audit logs, and Firestore.
5. Reuse existing infrastructure whenever possible.
6. Only then propose code changes.

Do not create duplicate systems simply because the existing implementation was not inspected.

Examples:

Before creating a media picker:

- Check whether MediaPicker already exists.

Before creating company state:

- Check CompanyWorkspaceProvider.

Before creating publishing logic:

- Check existing publish/unpublish APIs and services.

Before creating permissions:

- Check the existing PERMISSIONS constants and company guards.

Before creating Firestore helpers:

- Check existing repositories and utilities.

---

# 6. Code Delivery Rule

When modifying an existing source file, prefer providing the COMPLETE updated file.

Do not provide scattered snippets for large or important changes unless specifically requested.

This reduces:

- duplicate code
- incorrect insertion points
- missing imports
- conflicting handlers
- stale logic
- accidental architecture drift

For a new file, provide the complete file and its exact path.

Example:

```text
src/components/admin/project/ProjectPublishDialog.jsx
```

Then provide the complete contents.

For a very small and unambiguous change, a precise replacement may be acceptable, but full-file replacement is preferred for core modules.

---

# 7. Do Not Modify Repository Automatically

The normal development workflow is:

```text
AI reads source
       ↓
AI proposes complete code
       ↓
Developer edits in VS Code
       ↓
Developer runs tests
       ↓
Developer reports result
```

Do not automatically edit, commit, push, merge, or rewrite repository files unless explicitly requested.

Repository access should primarily be used to inspect current source and architecture.

---

# 8. Required Validation

After completing a meaningful change, run:

```bash
npm run lint
```

Then:

```bash
npm run build
```

Both should pass before considering a module complete.

Runtime behavior must also be tested where applicable.

Examples:

- Create
- Edit
- Delete
- Publish
- Unpublish
- Schedule
- Upload
- Media selection
- Company switching
- Permission enforcement

Do not consider `lint` alone sufficient for important features.

---

# 9. Architecture Layers

Backend modules should generally follow:

```text
Route
  ↓
Schema
  ↓
Service
  ↓
Repository
  ↓
Firestore / Storage
```

Responsibilities:

## Route

Responsible for:

- HTTP request handling
- authentication
- permissions
- trusted-origin validation
- parsing request body
- schema validation
- HTTP status mapping
- response formatting

Avoid putting business logic directly in route files.

## Schema

Responsible for:

- input shape
- field validation
- constraints
- enum validation
- normalization where appropriate

Use Zod.

## Service

Responsible for:

- business rules
- cross-resource validation
- lifecycle rules
- authorization-independent domain logic
- audit orchestration

## Repository

Responsible for:

- Firestore access
- queries
- transactions
- persistence
- document retrieval

Avoid UI/business logic in repositories.

---

# 10. Multi-Company Architecture

All company-owned content must remain isolated by company.

Typical structure:

```text
companies/{companyId}/...
```

Never query or mutate company-owned content without resolving the correct `companyId`.

Admin UI should use the existing company workspace infrastructure.

Use:

```text
CompanyWorkspaceProvider
useCompanyWorkspace()
```

Do not create another global active-company implementation.

The selected company should consistently drive:

- Projects
- Awards
- Media
- News
- Public content
- Homepage content
- Categories
- Branding
- Settings

---

# 11. Company Workspace

The existing workspace provider is the canonical source for:

```text
companies
activeCompany
activeCompanyId
loading
error
selectCompany
refreshCompanies
```

Do not read the active company directly from localStorage inside individual modules.

localStorage persistence belongs to the workspace provider.

Components should consume:

```js
const { activeCompany, activeCompanyId } = useCompanyWorkspace();
```

---

# 12. Permissions

Every protected operation must use the existing permission system.

Do not rely on UI visibility for security.

Example flow:

```text
Request
   ↓
Authentication
   ↓
Company membership
   ↓
Permission
   ↓
Service
```

API routes must enforce permissions even if buttons are hidden in the UI.

Reuse:

```text
PERMISSIONS
getCompanyPermission()
```

Do not invent permission strings inside components or routes if an equivalent permission already exists.

---

# 13. Trusted Origin

Mutating API requests should continue using trusted-origin protection where currently required.

Examples:

```text
POST
PATCH
DELETE
publish
unpublish
```

Reuse:

```js
isTrustedOrigin(request);
```

Do not remove origin validation simply to make an API request work.

---

# 14. Audit Logging

Important content mutations should produce audit logs.

Examples:

```text
CREATE
UPDATE
DELETE
PUBLISH
UNPUBLISH
RESTORE
```

Audit logs should contain where appropriate:

```text
userId
companyId
action
resource
resourceId
before
after
```

Use the existing audit service.

Do not create module-specific audit systems.

---

# 15. Soft Delete

Content should generally use soft delete unless permanent deletion is explicitly required.

Typical fields:

```text
deletedAt
deletedBy
```

Deleted content should normally be excluded from active queries.

Do not permanently delete Firestore records without considering:

- references
- audit history
- SEO
- media relationships
- restore capability

---

# 16. Media Architecture

The Media Library is the canonical media source.

Do not upload separate copies of the same image independently inside Project, Award, News, etc.

Content modules should reference media by:

```text
mediaId
```

The media pipeline may contain:

```text
original
thumbnail
medium
large
```

and other derivatives.

Prefer generated derivatives for frontend display instead of always serving the original image.

---

# 17. Media Lifecycle

Expected lifecycle:

```text
Create media record
       ↓
Signed upload URL
       ↓
Upload to Storage
       ↓
Finalize / process
       ↓
Generate variants
       ↓
status = ready
```

Content modules should normally only use media that is ready.

Do not bypass media validation to work around upload problems.

---

# 18. Project Module

Projects currently support concepts including:

```text
slug
title
excerpt
content
categoryId
subCategoryId
projectInfo
tags
featuredImage
gallery
featured
status
scheduledAt
seo
```

Project information includes:

```text
location
designYear
completionYear
area
client
credits
```

Credits include:

```text
architecture
interior
landscape
consultant
```

Credits support multiple localized entries.

---

# 19. Project Categories

Project categories support hierarchy.

Conceptually:

```text
Category
   └── Sub-category
```

A sub-category must belong to the selected parent category.

Do not allow invalid parent-child combinations.

Category creation from inside the Project Editor may be supported, but it should reuse the canonical Project Category APIs and services.

Do not create Project-only local category records.

---

# 20. Project Media

Project media uses the central Media Library.

A project may contain:

```text
featuredImage
gallery[]
```

Each media reference may include:

```text
mediaId
alt
caption
```

Do not store binary image data or direct uploaded files inside Project documents.

---

# 21. Publishing Workflow

Content lifecycle should remain explicit.

Project statuses currently include concepts such as:

```text
draft
review
scheduled
published
archived
```

Publishing actions should use dedicated backend operations.

Expected workflow:

```text
Draft
  ↓
Publish Now
  ↓
Published
```

or:

```text
Draft
  ↓
Schedule
  ↓
Scheduled
  ↓
Published
```

and:

```text
Published
  ↓
Unpublish
  ↓
Draft
```

Do not simulate publishing by directly changing `status` from the UI.

Use the canonical publish/unpublish service and API routes.

---

# 22. Publish Validation

Before publishing, validate required public content.

Examples:

- title exists
- content exists
- category relationship is valid
- sub-category belongs to category
- referenced media exists and is ready where required
- scheduled time is valid
- scheduled time is in the future

Publish validation belongs primarily in the service layer.

The UI may provide early feedback but must not replace server validation.

---

# 23. Scheduled Publishing

Store scheduled dates in a timezone-safe format.

Browser input may use local time:

```text
datetime-local
```

Before sending to the API, convert it to an ISO timestamp.

Example:

```js
new Date(value).toISOString();
```

Do not store ambiguous local datetime strings as the canonical server value.

---

# 24. SEO

SEO should be treated as structured content, not arbitrary HTML.

Localized SEO may include:

```text
title
description
keywords
ogTitle
ogDescription
ogImage
```

Global controls may include:

```text
index
follow
```

SEO should eventually support:

- canonical URLs
- Open Graph
- Twitter/X cards where appropriate
- sitemap
- robots directives
- structured data
- project metadata

Do not duplicate visible content purely for SEO when it can be derived safely.

---

# 25. Tags

Tags should support content discovery and related-content systems.

Tags may be used by:

- Projects
- Awards
- News
- Public content

Avoid uncontrolled duplicate tags such as:

```text
Architecture
architecture
ARCHITECTURE
```

A canonical tag engine / normalized tag system may be introduced as the content platform matures.

Autocomplete should eventually use canonical tags rather than only local component state.

Do not prematurely create separate tag systems per module.

---

# 26. Search

Search should evolve in stages.

Initial stage:

```text
client-side filtering
```

Later:

```text
normalized search fields
tag search
category filtering
```

Future scale may justify:

```text
Algolia
Typesense
Meilisearch
Elasticsearch
```

Do not introduce an external search engine until content volume and requirements justify it.

---

# 27. Awards

Awards should reuse Project relationships where appropriate.

Do not duplicate entire Project records inside Award documents.

Prefer references such as:

```text
projectId
```

Award-specific information belongs to the Award module.

Shared project information should remain canonical in Project.

---

# 28. Public Content and News

Public content and News should reuse common infrastructure where appropriate:

- Media Library
- localized fields
- publishing workflow
- SEO
- tags
- audit logs
- permissions
- soft delete

Do not copy entire Project implementations simply to create another content type.

Extract shared components/services only when reuse is clear and stable.

---

# 29. Homepage Slideshow

Homepage slideshow references Media Library assets.

A slideshow should validate referenced media before publishing.

Only valid/ready media should be publicly rendered.

Publishing a homepage slideshow should preserve the existing single-active/published behavior unless requirements change.

---

# 30. Firestore

Avoid unnecessary Firestore reads.

Prefer:

- targeted document reads
- indexed queries
- batched reads
- transactions for consistency-sensitive operations

Use transactions where multiple documents must change atomically.

Avoid client-side access to privileged Firestore operations that belong on the server.

---

# 31. Firebase Storage

Do not expose privileged Firebase Admin credentials to the browser.

Browser uploads should use approved mechanisms such as signed upload URLs or controlled Firebase client operations.

CORS must be configured correctly for browser uploads.

Do not weaken Storage security rules simply to bypass CORS or authorization problems.

---

# 32. Server and Client Components

Default to Server Components when client behavior is unnecessary.

Use:

```js
"use client";
```

only when required for:

- state
- effects
- event handlers
- browser APIs
- interactive UI

Do not turn large server trees into Client Components unnecessarily.

---

# 33. React 19 Rules

Avoid unnecessary effects.

Do not use `useEffect` merely to derive state that can be calculated directly.

Avoid synchronous `setState()` inside effects when another structure can solve the problem.

When asynchronous initialization inside an effect is necessary, follow the existing project pattern carefully.

Avoid unnecessary manual memoization.

React Compiler may infer dependencies more broadly than manually specified `useCallback` or `useMemo` dependencies.

Do not add memoization without a measurable or architectural reason.

---

# 34. Hydration

Server and client HTML must remain deterministic.

Avoid during SSR:

```js
Date.now()
Math.random()
browser-only branches that alter markup
locale-dependent output without stable locale
```

Browser extensions may inject attributes such as:

```text
webcrx
webcrx-bridged
```

These extension-generated hydration warnings are not application bugs unless reproduced without the extension.

---

# 35. Images

For public-facing website images, prefer Next.js Image where appropriate.

Admin previews may use alternative rendering where signed URLs or dynamic media behavior make it more practical.

Always consider:

- aspect ratio
- responsive loading
- image derivative size
- alt text
- LCP
- bandwidth

Do not automatically serve original full-resolution media everywhere.

---

# 36. UI Design Principles

Admin UI should remain:

- minimal
- professional
- architectural
- neutral
- content-focused
- responsive
- consistent

Reuse CSS variables such as:

```text
--admin-surface
--admin-border
--admin-hover
--admin-muted
--admin-foreground
--company-primary
--company-primary-soft
--company-primary-foreground
```

Company branding should influence accents without compromising admin usability.

---

# 37. Responsive Design

All Admin features must remain usable on:

```text
Desktop
Tablet
Mobile
```

Do not design functionality that requires hover.

Dialogs, editors, media pickers, tables, navigation, and forms should remain usable on touch devices.

---

# 38. Error Handling

API errors should use predictable machine-readable error codes where possible.

Example:

```text
PROJECT_NOT_FOUND
PROJECT_SLUG_EXISTS
PROJECT_CATEGORY_NOT_FOUND
PROJECT_CONTENT_REQUIRED
```

Routes should map domain errors to appropriate HTTP statuses.

Typical mapping:

```text
400 validation/business rule
401 unauthenticated
403 unauthorized
404 not found
409 conflict
500 unexpected server error
```

Do not expose internal stack traces to public API clients.

---

# 39. Naming

Prefer domain-specific names.

Good:

```text
ProjectMediaSection
ProjectCreditsSection
ProjectPublishDialog
CompanyWorkspaceProvider
```

Avoid vague names such as:

```text
Helper2
CommonThing
ManagerNew
TempComponent
```

Do not append `New`, `Final`, `Latest`, `Fixed`, or version numbers to production source filenames.

Replace/refactor the canonical implementation instead.

---

# 40. Avoid Duplicate Utilities

Before adding a utility, search:

```text
src/utils
src/lib
src/components
src/modules
```

Examples:

Before adding:

```text
cn()
slugify()
Firestore serialization
date formatter
permission helper
media URL helper
```

check whether an equivalent already exists.

One canonical implementation is preferred.

---

# 41. Imports

Use the configured project alias:

```js
@/
```

where appropriate.

Example:

```js
import { cn } from "@/utils/cn";
```

Do not guess utility paths.

Verify the actual file location before importing.

---

# 42. Comments

Comments should explain architectural intent or non-obvious business rules.

Good:

```js
/*
 * Published slideshow replacement must be atomic
 * so only one slideshow remains publicly active.
 */
```

Avoid comments that merely repeat the next line of code.

Keep source files UTF-8 and avoid corrupted text/encoding.

---

# 43. Security

Never trust:

- companyId from UI alone
- user role from browser state
- hidden buttons as authorization
- media IDs without validation
- client-provided ownership fields

Server APIs must verify:

```text
authentication
company access
permission
resource ownership / relationship
input schema
```

Never expose:

- Firebase Admin credentials
- service account private keys
- server secrets
- unrestricted signed URLs with excessive lifetime

---

# 44. Performance

Avoid premature optimization, but protect obvious high-cost areas.

Watch for:

- repeated Firestore queries
- full-size original images
- unnecessary Client Components
- excessive rerenders
- large unpaginated content lists
- duplicated API calls

Pagination should be introduced before content lists become large.

---

# 45. Accessibility

Interactive controls should include appropriate:

- button semantics
- labels
- aria-label where necessary
- keyboard support
- focus states

Do not make important functionality mouse-only.

---

# 46. Future Professional Features

The architecture should remain compatible with future additions including:

- revision history
- content preview
- scheduled publishing worker
- canonical tag engine
- advanced search
- content relationships
- related projects
- SEO analysis
- sitemap automation
- structured data
- redirect management
- broken-link detection
- media usage tracking
- media deduplication
- focal point / crop management
- audit viewer
- activity dashboard
- content approval workflow
- notifications
- analytics
- cache invalidation / revalidation
- CDN optimization
- API rate limiting

Do not implement all of these prematurely.

Introduce them when the relevant module and requirements justify them.

---

# 47. Definition of Done

A feature is not complete merely because the UI renders.

A module or feature should normally satisfy:

```text
Architecture reviewed
        ↓
Schema correct
        ↓
Permissions correct
        ↓
API correct
        ↓
Service rules correct
        ↓
Repository correct
        ↓
Audit logging correct
        ↓
UI connected
        ↓
Error states handled
        ↓
Responsive behavior checked
        ↓
npm run lint
        ↓
npm run build
        ↓
Runtime CRUD/workflow test
        ↓
Git checkpoint
```

Only after these checks should the feature be considered stable.

---

# 48. Git Checkpoints

Create meaningful checkpoints after completing a stable module or major feature.

Example commit messages:

```text
feat(project): add media management
feat(project): add project credits
feat(project): add publishing workflow
feat(media): complete storage processing
feat(home): complete slideshow management
fix(project): validate category relationships
refactor(admin): consolidate company workspace
```

Avoid checkpoint commits while lint/build is known to be broken unless the commit is explicitly marked as work in progress.

---

# 49. Current Development Priority

Current priority is to complete the Admin CMS architecture before polishing the public website.

Current Project module sequence:

```text
Project CRUD
    ✓

Category / Sub-category
    ✓

Media
    ✓

Project Credits
    ✓

Publishing Workflow
    ↓

SEO
    ↓

Tags / Search improvements
    ↓

Project module checkpoint
```

After Project becomes stable, continue applying the same architectural standards to:

```text
Awards
Public Content
News
Homepage
Public Website
```

---

# 50. Core Principle

The primary engineering principle of Junsekino CMS is:

> Extend the platform. Do not duplicate the platform.

Before adding code, understand what already exists.

Prefer a small number of well-designed reusable systems over many module-specific implementations.

The codebase should remain understandable, predictable, maintainable, and professional as the CMS grows.
