# Junsekino CMS

Multi-company content management system and corporate website platform for Junsekino.

Junsekino CMS ใช้สำหรับจัดการเว็บไซต์ของหลายบริษัทจากระบบกลาง รองรับการแยกข้อมูลตามบริษัท การจัดการสิทธิ์ผู้ใช้งาน เนื้อหาสองภาษา Media, SEO, Social Media, Analytics, Privacy, Cookie consent และการเผยแพร่เนื้อหา

> Project status: Phase 1 feature-complete  
> Current work: Documentation, production verification and final delivery  
> Admin mobile-first improvements are planned for Phase 2

---

## Contents

- [System Overview](#system-overview)
- [Phase 1 Features](#phase-1-features)
- [Public Website](#public-website)
- [Admin CMS](#admin-cms)
- [Documentation](#documentation)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Authentication and Authorization](#authentication-and-authorization)
- [Localization](#localization)
- [Content Workflow](#content-workflow)
- [Media](#media)
- [SEO](#seo)
- [Analytics and Engagement](#analytics-and-engagement)
- [Privacy and Cookie Consent](#privacy-and-cookie-consent)
- [Email and Notifications](#email-and-notifications)
- [Scheduled Jobs](#scheduled-jobs)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Testing and Build](#testing-and-build)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Security Principles](#security-principles)
- [Phase 2 Roadmap](#phase-2-roadmap)
- [License](#license)

---

## System Overview

ระบบแบ่งออกเป็น 3 ส่วนหลัก

```text
Public Website
├── Welcome
├── Company Selection
└── Company Website

Admin CMS
├── Content Management
├── Company Management
├── Media
├── Members
├── Settings
└── Analytics

Documentation
├── Standalone Docs Layout
├── Search
├── Topic Navigation
└── Step-by-step Guides
```

ระบบรองรับหลายบริษัท เช่น:

```text
Junsekino I+D
Junsekino A+D
Future Companies
```

ข้อมูลของแต่ละบริษัทถูกแยกออกจากกัน ได้แก่:

- Company profile
- Branding and theme
- Website content
- Projects
- Awards
- Public content
- News
- Contact information
- Form submissions
- Media
- Navigation
- Members and permissions
- SEO
- Social media
- Privacy settings
- Analytics

---

## Phase 1 Features

### Public Website

- Welcome page
- Company selection
- Company-specific public website
- Company branding and theme
- Home slideshow
- About page
- Project listing
- Project category navigation
- Project detail and slideshow
- Awards
- Public content
- Publications
- Video and external media
- Contact page and contact form
- Desktop navigation and dropdown menus
- Mobile navigation and submenu flow
- Social media links
- Company switcher
- Content views, likes and shares
- Cookie banner and preference controls
- Privacy Notice, Cookie Policy and Terms of Use
- Google Analytics integration after consent
- Responsive image loading
- Page-specific skeleton loading
- SEO metadata and Open Graph information

### Admin CMS

- Dashboard
- Company workspace switching
- Company profile management
- Branding and theme management
- Home page management
- About page management
- Project management
- Project category management
- Award management
- Public content management
- News management
- Contact page management
- Contact message management
- Media Library
- Batch media upload
- Menu Management
- Member and permission management
- Admin interface localization
- Public website localization settings
- Email settings
- Notification settings
- Privacy settings
- Legal document versioning and publishing
- Analytics dashboard
- Documentation entry point

### Platform

- Multi-company data isolation
- Firebase Authentication
- HttpOnly session cookies
- Server-side permission checks
- Permission-based access control
- Soft delete
- Audit logs
- Firestore TTL support
- Privacy retention cleanup
- Scheduled publishing
- Vercel deployment
- Web App manifest and favicon assets

---

## Public Website

### Public flow

```text
/
↓
Welcome
↓
Select Company
↓
/{companySlug}
↓
Company Website
```

### Primary routes

```text
/

/{companySlug}
/{companySlug}/about
/{companySlug}/project
/{companySlug}/project/{projectSlug}
/{companySlug}/awards
/{companySlug}/public
/{companySlug}/public/publication
/{companySlug}/public/video
/{companySlug}/public/{contentSlug}
/{companySlug}/contact
```

Company slug history is preserved. When a company slug changes, supported old URLs redirect to the current canonical slug.

### Company-specific presentation

Each company can define its own:

- Logo
- Primary color
- Secondary color
- Accent color
- Background
- Surface color
- Text color
- Light theme
- Dark theme
- Social media links
- Default language
- Supported languages
- Global SEO

UI components consume company theme variables rather than hard-coded company conditions.

---

## Admin CMS

Admin entry point:

```text
/admin
```

Primary Admin routes:

```text
/admin/login
/admin/dashboard
/admin/home
/admin/about
/admin/projects
/admin/awards
/admin/public-contents
/admin/news
/admin/contact
/admin/messages
/admin/media
/admin/navigation
/admin/company
/admin/members
/admin/settings
```

The Sidebar displays only modules available in Phase 1. Future modules remain hidden until their workflows are complete.

### Admin support policy

Phase 1 focuses on:

- Desktop workflows
- Tablet usability
- Critical mobile usability
- No blocking overflow or broken actions

Complete mobile-first Admin UX and reusable responsive Admin components are planned for Phase 2.

---

## Documentation

Documentation is available separately from the Admin layout:

```text
/docs
```

The Docs system requires an authenticated session and opens in a new browser window from Admin so users can read instructions while continuing their work.

Planned documentation structure:

```text
/docs
/docs/getting-started
/docs/dashboard
/docs/company
/docs/projects
/docs/media
/docs/navigation
/docs/privacy
/docs/seo
/docs/publishing
/docs/troubleshooting
```

Documentation features:

- Independent Header
- Independent Sidebar
- Expandable categories and submenus
- Thai and English content
- Search
- Deep links
- Section anchors
- Previous and next navigation
- Screenshots
- Tips and warnings
- Privacy and copyright notices
- Links from Admin editors to relevant guides

---

## Technology Stack

### Application

```text
Next.js 16.3.2
React 19.2.8
JavaScript
Tailwind CSS 4
```

### Firebase

```text
Firebase Authentication
Cloud Firestore
Firebase Storage
Firebase Admin SDK
```

### Content and UI

```text
Tiptap
React Markdown
Remark GFM
Lucide React
React Icons
React Easy Crop
Sonner
Sharp
```

### Validation and utilities

```text
Zod
clsx
tailwind-merge
```

### Email

```text
Resend
Nodemailer
```

### Hosting

```text
GitHub
Vercel
Firebase
```

See [`package.json`](./package.json) for exact dependency versions.

---

## Architecture

The application follows a layered module structure:

```text
UI Component
↓
Route Handler
↓
Service
↓
Repository
↓
Firebase
```

Responsibilities:

| Layer      | Responsibility                                  |
| ---------- | ----------------------------------------------- |
| Component  | Presentation and user interaction               |
| Route      | Authentication, permission and request handling |
| Schema     | Input validation                                |
| Service    | Business rules                                  |
| Repository | Firestore and Storage operations                |
| Firebase   | Persistent data and authentication              |

Business logic should not be distributed directly across UI components.

Avoid calling Firestore write methods directly from presentation components unless the architecture explicitly requires it.

---

## Authentication and Authorization

Admin authentication uses:

```text
Firebase Authentication
+
Firebase Admin SDK
+
HttpOnly Session Cookie
```

Authentication flow:

```text
Email and Password
↓
Firebase Authentication
↓
Firebase ID Token
↓
POST /api/v1/auth/session
↓
Firebase Admin verification
↓
HttpOnly Session Cookie
↓
Protected Admin route
```

Session cookies use security options appropriate to the environment, including:

- `HttpOnly`
- `Secure` in production
- `SameSite`
- Controlled expiration

### Roles

The platform currently supports:

#### Superadmin

- Access all companies
- Create and manage companies
- Manage platform users
- Manage members across companies
- Access all authorized content and settings
- Cannot remove their own Superadmin access through restricted workflows

#### Admin

- Manage assigned company
- Manage authorized company members
- Manage company content
- Manage company settings
- Manage branding, SEO and social media
- Publish content when permitted

#### Editor

- Access assigned company content
- Create and edit permitted content
- Upload and select media
- Publish only when the required permission is assigned
- Cannot manage restricted company or member settings

### Permissions

The application uses permission-based authorization such as:

```text
company.view
company.create
company.update
company.delete

user.view
user.create
user.update
user.delete

page.view
page.create
page.update
page.delete
page.publish

project.view
project.create
project.update
project.delete
project.publish

projectCategory.view
projectCategory.create
projectCategory.update
projectCategory.delete

award.view
award.create
award.update
award.delete
award.publish

public.view
public.create
public.update
public.delete
public.publish

news.view
news.create
news.update
news.delete
news.publish

media.view
media.upload
media.update
media.delete

branding.view
branding.update

seo.view
seo.update

social.view
social.update

formSubmission.view
formSubmission.update

analytics.view
notification.view
notification.update
audit.view
```

Frontend menu visibility is not considered a security control. Sensitive actions must always be authorized on the server.

---

## Localization

The system separates two localization concerns.

### Admin interface language

Admin users can select:

```text
English
Thai
```

This changes labels, instructions, status messages and supported Admin content.

### Public content languages

Company Localization settings control which language fields appear in content editors.

Current behavior:

```text
English enabled
→
Display English content fields

English and Thai enabled
→
Display English and Thai content fields
```

English is the current primary and fallback content language.

Admin UI language does not automatically change the public website content language.

---

## Content Workflow

Content follows a controlled publishing workflow.

```text
Create
↓
Draft
↓
Edit
↓
Save
↓
Preview or Review
↓
Publish
```

Where supported:

```text
Published
↓
Unpublish
↓
Draft
```

Save and Publish are separate operations.

Before publishing:

- Complete required fields
- Complete every enabled language
- Verify names, dates and facts
- Verify media usage rights
- Check links
- Check SEO
- Check Open Graph image
- Preview the public result
- Confirm the selected company

### Soft delete

Supported content is not immediately removed from the database.

Example fields:

```js
{
  deletedAt: null,
  deletedBy: null
}
```

Soft delete supports future restoration, recovery and audit workflows.

---

## Media

Media is separated by company.

Typical path:

```text
companies/{companyId}/media/{mediaId}
```

Media features include:

- Media Library
- Single and batch upload
- Upload progress
- Image selection
- Image cropping where supported
- Image metadata
- Alternative text
- Cover images
- Gallery images
- Optimized image variants
- Private original file strategy

### Media rules

Only upload media that is:

- Owned by Junsekino
- Properly licensed
- Supplied with permission
- Approved for public use

Unauthorized copying, downloading, modification, reproduction or redistribution of protected images is prohibited.

Browser-delivered images cannot be protected from screenshots or saving with absolute certainty. Technical controls reduce casual misuse but do not replace copyright and legal protection.

---

## SEO

SEO can be configured globally for each company and individually for supported content.

Supported values include:

```js
seo: {
  en: {
    title: "",
    description: "",
    keywords: [],
    ogTitle: "",
    ogDescription: "",
    ogImage: null
  },

  th: {
    title: "",
    description: "",
    keywords: [],
    ogTitle: "",
    ogDescription: "",
    ogImage: null
  },

  index: true,
  follow: true
}
```

Automatic SEO behavior includes:

- Content title → SEO title
- Content title → Open Graph title
- Excerpt or description → SEO description
- Tags → SEO keywords
- Cover image → Open Graph image

When users manually edit generated SEO values, later source-field changes should not overwrite those manual values unexpectedly.

---

## Analytics and Engagement

Supported engagement includes:

- Views
- Unique visitors
- Likes
- Shares
- Share channels
- Top content
- Daily website traffic
- Recent activity
- Form submission summaries

Analytics data is displayed in the Admin Dashboard according to the selected reporting range.

Persistent Analytics visitor identification must not be created before Analytics consent where consent is required.

Raw visitor IDs are not stored directly. Supported identifiers are hashed and scoped to the relevant company to reduce cross-company correlation.

---

## Privacy and Cookie Consent

The platform includes:

- Cookie banner
- Cookie preferences
- Necessary cookies
- Analytics cookies
- Functional cookies
- Marketing cookies
- Accept All
- Necessary Only
- Consent versioning
- Consent records
- Privacy Notice
- Cookie Policy
- Terms of Use
- Data retention settings
- Data subject request information
- Technical data anonymization
- Policy change re-consent
- Retention cleanup

Optional cookie categories should remain disabled until the visitor provides valid consent unless another lawful basis is confirmed.

Legal documents and privacy settings must reflect the company's actual operations. They should be reviewed by qualified legal counsel before production use.

---

## Email and Notifications

The Admin Settings module supports:

- Sender configuration
- SMTP configuration
- Protected SMTP password storage
- Resend configuration
- Notification recipients
- Activity notifications
- Test email workflow

Sensitive email credentials must never be committed to GitHub, copied into documentation or shown in screenshots.

---

## Scheduled Jobs

Vercel scheduled jobs currently include:

### Scheduled publishing

```text
/api/cron/publish-scheduled
```

Schedule:

```text
*/5 * * * *
```

### Privacy retention cleanup

```text
/api/internal/cron/privacy-retention
```

Schedule:

```text
30 18 * * *
```

Cron routes must validate `CRON_SECRET`.

Firestore TTL may also be used for supported temporary or expiring records.

---

## Installation

Clone the repository:

```bash
git clone https://github.com/SmallDevStudio/junsekino-cms.git
```

Enter the project:

```bash
cd junsekino-cms
```

Install dependencies:

```bash
npm install
```

Copy the environment template:

### PowerShell

```powershell
Copy-Item ".env.example" ".env.local"
```

### macOS or Linux

```bash
cp .env.example .env.local
```

Complete the required environment variables before starting the application.

---

## Environment Variables

The repository contains `.env.example` without production secrets.

Main environment groups:

### Application

```env
NEXT_PUBLIC_APP_NAME=
NEXT_PUBLIC_APP_ENV=
NEXT_PUBLIC_APP_URL=
```

### Firebase Client

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Firebase Admin

```env
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_STORAGE_BUCKET=
```

### Security and scheduled jobs

```env
CRON_SECRET=
VISITOR_HASH_SECRET=
EMAIL_CREDENTIALS_ENCRYPTION_KEY=
```

### Email

```env
RESEND_API_KEY=
EMAIL_FROM=
```

### Analytics

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_GOOGLE_ANALYTICS=
```

### External media

```env
YOUTUBE_API_KEY=
```

Rules:

- Never commit `.env.local`
- Never commit Firebase Admin private keys
- Never expose encryption or visitor hashing secrets
- Use separate values for Development and Production
- Configure Vercel variables per environment
- Rotate any secret accidentally exposed

---

## Development

Start the development server:

```bash
npm run dev
```

Local URL:

```text
http://localhost:3000
```

Network URL depends on the development machine and local network.

---

## Testing and Build

Run lint:

```bash
npm run lint
```

Run the production build:

```bash
npm run build
```

Run the production server locally:

```bash
npm start
```

Before committing, run:

```bash
git diff --check
npm run lint
npm run build
```

### Phase 1 verification

At minimum, test:

- Admin login and logout
- Password change flow
- Company switching
- Dashboard ranges and metrics
- Company profile save
- Admin TH/EN
- Public content TH/EN
- Home slideshow
- About save and publish
- Project create, edit, save and publish
- Award create, edit, save and publish
- Public content create, edit, save and publish
- News create, edit, save and publish
- Contact page
- Contact form submission
- Admin Messages
- Media batch upload
- Menu ordering and submenu behavior
- Cookie banner in a new private session
- Consent preferences
- Legal document publishing
- Analytics after consent
- Desktop public navigation
- Mobile public navigation
- Documentation routes
- Favicons and Web App manifest

---

## Deployment

Deployment flow:

```text
Local Development
↓
GitHub master
↓
Vercel
↓
Firebase services
```

Push to GitHub:

```bash
git add -A
git commit -m "feat: complete phase 1"
git push origin master
```

Vercel deploys the connected branch automatically.

Before connecting the production domain:

1. Confirm the Vercel deployment is Ready.
2. Verify production environment variables.
3. Verify Firebase project selection.
4. Test public pages.
5. Test Admin authentication.
6. Test form submissions.
7. Test email delivery.
8. Test Cookie consent in a private browser.
9. Confirm legal documents are published.
10. Confirm scheduled jobs.
11. Confirm no secret appears in logs or source.
12. Confirm the production domain and canonical URLs.

### Firebase commands

Select the development project:

```bash
npm run firebase:dev
```

Deploy Firestore indexes:

```bash
npm run firebase:indexes
```

Deploy Firestore rules:

```bash
npm run firebase:rules
```

Deploy Storage rules:

```bash
npm run firebase:storage
```

Review the selected Firebase project before every deployment.

---

## Project Structure

Simplified current structure:

```text
junsekino-cms/
├── public/
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   ├── apple-touch-icon.png
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── site.webmanifest
│   └── docs/
│
├── src/
│   ├── app/
│   │   ├── (documentation)/
│   │   │   └── docs/
│   │   ├── [companySlug]/
│   │   ├── admin/
│   │   ├── api/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   └── layout.js
│   │
│   ├── components/
│   │   ├── admin/
│   │   ├── docs/
│   │   ├── privacy/
│   │   └── public/
│   │
│   ├── constants/
│   ├── i18n/
│   ├── lib/
│   ├── modules/
│   └── utils/
│
├── .env.example
├── eslint.config.mjs
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── jsconfig.json
├── next.config.mjs
├── package.json
├── storage.rules
├── vercel.json
└── README.md
```

---

## Security Principles

The application follows these principles:

```text
Default Deny
Least Privilege
Server-side Authorization
Permission-based Access Control
Company Data Isolation
Secure Session Cookies
Schema Validation
Private Original Media
Secret Separation
Audit Logging
Retention Controls
Consent Before Optional Analytics
```

Sensitive request flow:

```text
Authentication
↓
User status
↓
Company access
↓
Permission
↓
Schema validation
↓
Service rules
↓
Repository
↓
Firebase
```

Security requirements:

- Do not rely on hidden frontend menus as authorization
- Do not expose Firebase Admin credentials
- Do not store raw visitor IDs
- Do not enable optional Analytics before consent
- Do not expose form attachments publicly
- Do not log passwords or sensitive submission data
- Do not upload unapproved copyrighted media
- Do not bypass retention requirements

---

## Phase 2 Roadmap

### Admin Mobile Core

- Mobile-first Admin shell
- Reusable responsive page containers
- Mobile sidebar and navigation
- Responsive forms and editors
- Mobile tables converted to cards or lists
- Sticky Save and Publish actions
- Touch-friendly Media Picker
- Standard loading, error and empty states
- Reusable mobile module patterns

### Page Management

- User-created pages
- Single-page content
- Public route `/p/{pageSlug}`
- Page templates
- Page navigation integration
- Page permissions
- Page publishing workflow

### Form Management

- Form builder
- Custom fields
- Consent fields
- Validation management
- File upload settings
- Form publishing
- Submission workflow

### Workflow and Recovery

- Restore soft-deleted records
- Revision history
- Approval workflow
- Draft comparison
- Scheduled unpublishing
- Content locking or conflict detection

### Search and Discovery

- Admin content search
- Advanced filters
- Cross-module search
- Search suggestions

### Advanced Platform Features

- Popup management
- Tags management
- People management
- Content calendar
- Social publishing
- Advanced analytics
- Analytics aggregation
- Custom reports
- AI translation assistance
- AI SEO suggestions
- AI alternative text
- AI content assistance

### Documentation

- Detailed module guides
- Screenshots
- Search index
- Contextual help links
- Troubleshooting
- Glossary
- Role-specific learning paths
- Documentation feedback

---

## License

This project is proprietary software developed for Junsekino.

All source code, content, images, media, documents, visual designs, trademarks and related materials are confidential and intended only for authorized Junsekino use.

Unauthorized copying, downloading, reproduction, modification, adaptation, redistribution, sublicensing, publication or commercial use is prohibited unless written permission has been granted by the lawful rights holder.

Third-party libraries remain subject to their respective licenses.

---

© Junsekino. All rights reserved.
