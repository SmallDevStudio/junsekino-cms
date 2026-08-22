# Junsekino CMS

Professional Multi-Company Content Management System and Corporate Website Platform for Junsekino.

ระบบนี้ถูกออกแบบใหม่ทั้งหมดเพื่อรองรับการจัดการเว็บไซต์ของหลายบริษัทภายใต้ Junsekino โดยใช้ CMS กลางเพียงระบบเดียว รองรับหลายภาษา การกำหนดสิทธิ์ผู้ใช้งาน การจัดการแบรนด์ SEO Media และ Content Publishing

---

## Overview

Junsekino CMS เป็น Web Application ที่รองรับทั้ง Desktop และ Mobile โดยแบ่งระบบหลักออกเป็น 2 ส่วน

### Public Website

สำหรับผู้เข้าชมเว็บไซต์

```text
Welcome Page
    ↓
Select Company
    ↓
Company Website
    ↓
Projects / News / People / About / Contact
```

รองรับหลายบริษัท เช่น

```text
Junsekino I+D
Junsekino D+I
Future Companies
```

แต่ละบริษัทสามารถกำหนด Branding ของตัวเองได้ เช่น

- Logo
- Primary Color
- Secondary Color
- Accent Color
- Background Color
- Font
- Social Media
- SEO Settings

---

### Admin CMS

สำหรับพนักงาน Junsekino

```text
/admin
```

ใช้สำหรับจัดการ

- Companies
- Projects
- News
- Pages
- People
- Media
- Users
- Branding
- SEO
- Social Media
- Publishing
- Audit Logs

---

# Technology Stack

โปรเจกต์พัฒนาด้วย

```text
Next.js
React
JavaScript
Tailwind CSS

Firebase Authentication
Cloud Firestore
Firebase Storage
Firebase Admin SDK

Vercel
```

Libraries หลัก

```text
firebase
firebase-admin
zod
clsx
tailwind-merge
lucide-react
sonner
next-intl
```

---

# Core Features

## Multi-Company CMS

ระบบรองรับหลายบริษัทโดยไม่ต้องแก้ source code เมื่อมีการเพิ่มบริษัทใหม่

ตัวอย่าง

```text
companies
├── Junsekino I+D
├── Junsekino D+I
└── Future Company
```

แต่ละบริษัทมี

```text
Branding
Content
Projects
News
People
Users
Media
SEO
Social
Settings
```

แยกออกจากกัน

---

# User Roles

ระบบเริ่มต้นด้วย 3 ระดับสิทธิ์

## SUPERADMIN

สามารถจัดการทุกบริษัทและทุกส่วนของระบบ

สิทธิ์หลัก

```text
Manage Companies
Manage All Users
Manage All Content
Manage Branding
Manage SEO
Manage Social
Manage System Settings
View Audit Logs
```

---

## ADMIN

ดูแลบริษัทของตัวเอง

สามารถ

```text
Manage Company Content
Manage Company Users
Manage Branding
Manage SEO
Manage Social
Manage Media
Publish Content
```

---

## EDITOR

ดูแล Content ของบริษัทที่ได้รับสิทธิ์

สามารถ

```text
Create Content
Edit Content
Delete Content
Manage Media
Publish Content
```

ไม่สามารถจัดการ User หรือ Company Settings

---

# Permission Architecture

ระบบไม่ได้ผูก Business Logic กับ Role โดยตรง

ใช้ Permission-Based Access Control เช่น

```text
company.view
company.update

user.view
user.create
user.update
user.delete

project.view
project.create
project.update
project.delete
project.publish

news.view
news.create
news.update
news.delete
news.publish

page.view
page.create
page.update
page.delete
page.publish

people.view
people.create
people.update
people.delete

media.view
media.upload
media.delete

branding.view
branding.update

seo.view
seo.update

social.view
social.update
```

ทำให้สามารถเพิ่ม Role ใหม่ได้ในอนาคต เช่น

```text
CONTENT_MANAGER
SEO_EDITOR
PUBLISHER
VIEWER
```

---

# Multi-Language

ระบบรองรับ

```text
Thai
English
```

Public URL

```text
/th/
/en/
```

ตัวอย่าง

```text
/th/junsekino-id

/en/junsekino-id
```

Project

```text
/th/junsekino-id/projects/project-name

/en/junsekino-id/projects/project-name
```

Admin CMS ไม่แยกภาษาใน URL

```text
/admin
```

แต่สามารถเลือกภาษา UI ภายในระบบได้

---

# Public Website Flow

```text
/
│
├── Welcome
│
├── /th/select
│
├── /en/select
│
│
├── /th/[company]
│   ├── about
│   ├── projects
│   ├── news
│   ├── people
│   └── contact
│
└── /en/[company]
    ├── about
    ├── projects
    ├── news
    ├── people
    └── contact
```

---

# Admin Routes

```text
/admin

/admin/login

/admin/dashboard

/admin/companies

/admin/projects

/admin/news

/admin/pages

/admin/people

/admin/media

/admin/users

/admin/settings
```

---

# Authentication Architecture

Admin Authentication ใช้

```text
Firebase Authentication
+
Firebase Admin SDK
+
HttpOnly Session Cookie
```

Flow

```text
Email + Password
        ↓
Firebase Authentication
        ↓
Firebase ID Token
        ↓
POST /api/v1/auth/session
        ↓
Firebase Admin
        ↓
Session Cookie
        ↓
Admin CMS
```

Session Cookie จะถูกกำหนดเป็น

```text
HttpOnly
Secure
SameSite
```

เพื่อลดความเสี่ยงจากการเข้าถึง session ผ่าน browser JavaScript

---

# Firestore Architecture

โครงสร้างหลัก

```text
users/
    {uid}


companies/
    {companyId}

        members/
            {uid}

        pages/
            {pageId}

        projects/
            {projectId}

        news/
            {newsId}

        people/
            {peopleId}

        categories/
            {categoryId}

        menus/
            {menuId}

        media/
            {mediaId}

        settings/
            general
            seo
            social


auditLogs/
    {logId}


system/
    configuration
```

---

# User Structure

```javascript
users / { uid };

{
  (email,
    displayName,
    userType,
    status,
    isSuperAdmin,
    defaultCompanyId,
    createdAt,
    updatedAt);
}
```

---

# Company Structure

```javascript
companies/{companyId}

{
  name,
  legalName,
  shortName,

  slug,

  status,

  defaultLocale,

  supportedLocales: [
    "th",
    "en"
  ],

  branding: {
    logoLight,
    logoDark,
    favicon,

    colors: {
      primary,
      secondary,
      accent,
      background,
      text
    }
  },

  social: {
    facebook,
    instagram,
    linkedin,
    youtube,
    x
  },

  createdAt,
  updatedAt
}
```

---

# Company Membership

```text
companies/{companyId}/members/{uid}
```

ตัวอย่าง

```javascript
{
  userId,

  role: "ADMIN",

  status: "active",

  permissions: [],

  createdAt,
  updatedAt
}
```

User หนึ่งคนสามารถอยู่หลายบริษัทได้

ตัวอย่าง

```text
User A

Junsekino I+D
Role: ADMIN

Junsekino D+I
Role: EDITOR
```

---

# Content Architecture

Content เช่น Project รองรับหลายภาษาใน Document เดียว

ตัวอย่าง

```javascript
{
  slug: "sukhumvit-residence",

  title: {
    th: "บ้านสุขุมวิท",
    en: "Sukhumvit Residence"
  },

  excerpt: {
    th: "",
    en: ""
  },

  content: {
    th: "",
    en: ""
  }
}
```

---

# Content Status

ทุก Content ใช้ Workflow มาตรฐาน

```text
draft
review
scheduled
published
archived
```

Flow

```text
Create
  ↓
Draft
  ↓
Review
  ↓
Preview
  ↓
Publish
```

รองรับ Scheduled Publishing ในอนาคต

---

# Soft Delete

Content จะไม่ถูกลบจาก Database ทันที

ใช้

```javascript
{
  deletedAt: null,
  deletedBy: null
}
```

เมื่อ Delete

```text
deletedAt
deletedBy
```

ทำให้สามารถรองรับ

```text
Restore
Recovery
Audit
```

ได้

---

# Audit Logs

ระบบจะเก็บ Activity ที่สำคัญ

ตัวอย่าง

```javascript
{
  (companyId, userId, action, resource, resourceId, before, after, timestamp);
}
```

ตัวอย่าง Action

```text
CONTENT_CREATE
CONTENT_UPDATE
CONTENT_DELETE
CONTENT_PUBLISH

USER_CREATE
USER_UPDATE

COMPANY_UPDATE

BRANDING_UPDATE
```

---

# SEO

รองรับ SEO แยกตามภาษา

```javascript
seo: {

  th: {
    title: "",
    description: "",
    keywords: [],
    ogTitle: "",
    ogDescription: "",
    ogImage: null
  },

  en: {
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

ระบบจะรองรับ

```text
Metadata
Canonical URL
Open Graph
Twitter/X Metadata
hreflang
Sitemap
robots.txt
Structured Data
```

---

# Social Media

แต่ละบริษัทสามารถกำหนด

```text
Facebook
Instagram
LinkedIn
YouTube
X
TikTok
Pinterest
```

Content สามารถ Share ผ่าน

```text
Facebook
X
LinkedIn
LINE
Copy Link
Native Mobile Share
```

รองรับ Social Publishing API ใน Phase ต่อไป

---

# Media Architecture

Media Library จะเป็นระบบกลางของแต่ละบริษัท

```text
companies/{companyId}/media
```

Media Metadata ตัวอย่าง

```javascript
{
  filename,
  originalFilename,

  width,
  height,

  mimeType,
  size,

  alt: {
    th: "",
    en: ""
  },

  caption: {
    th: "",
    en: ""
  },

  uploadedBy,
  createdAt
}
```

---

# Image Protection

เนื่องจาก Browser จำเป็นต้องได้รับข้อมูลภาพเพื่อแสดงผล จึงไม่สามารถป้องกันการ Save หรือ Screenshot ได้ 100%

ระบบจึงออกแบบให้

```text
Original Image
      ↓
Private Storage
      ↓
Optimized Image
      ↓
Public Website
```

Public Website จะไม่ส่งไฟล์ Original ความละเอียดสูงให้ผู้ชมโดยตรง

แนวทางเพิ่มเติม

```text
Responsive Image
WebP
AVIF
Image Optimization
Disable Drag
Disable Context Menu
Optional Watermark
```

---

# Performance Architecture

Public Website จะไม่ Query Firestore จาก Client โดยตรงทุกครั้ง

Architecture

```text
Browser
   ↓
Next.js Server
   ↓
Cache
   ↓
Firestore
```

Content ที่ Publish แล้วสามารถใช้

```text
Server Rendering
Caching
Revalidation
CDN
```

เพื่อลด Firestore Reads และเพิ่มความเร็วในการโหลดเว็บไซต์

---

# Theme Architecture

แต่ละบริษัทสามารถตั้ง Branding ได้จาก Admin

Public UI จะใช้ CSS Variables เช่น

```css
--brand-primary;
--brand-secondary;
--brand-accent;
--brand-background;
--brand-surface;
--brand-text;
```

จึงไม่ต้องเขียนเงื่อนไข Company ลงใน Component

ไม่ใช้แนวทาง

```javascript
if (company === "company-a") {
}
```

แต่ใช้

```text
Company
  ↓
Branding
  ↓
Theme Variables
  ↓
Components
```

---

# Project Structure

```text
junsekino-cms/
│
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── src/
│   │
│   ├── app/
│   │   │
│   │   ├── (public)/
│   │   │   └── [locale]/
│   │   │       ├── page.js
│   │   │       ├── select/
│   │   │       └── [company]/
│   │   │
│   │   ├── admin/
│   │   │   ├── (auth)/
│   │   │   └── (dashboard)/
│   │   │
│   │   ├── api/
│   │   │   └── v1/
│   │   │
│   │   ├── globals.css
│   │   ├── layout.js
│   │   ├── not-found.js
│   │   └── error.js
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── company/
│   │   ├── user/
│   │   ├── content/
│   │   ├── project/
│   │   ├── page/
│   │   ├── news/
│   │   ├── people/
│   │   ├── media/
│   │   ├── seo/
│   │   ├── social/
│   │   └── audit/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── common/
│   │   ├── public/
│   │   ├── admin/
│   │   ├── forms/
│   │   ├── tables/
│   │   ├── media/
│   │   └── editor/
│   │
│   ├── layouts/
│   │   ├── public/
│   │   └── admin/
│   │
│   ├── lib/
│   │   ├── firebase/
│   │   ├── auth/
│   │   ├── permissions/
│   │   ├── validation/
│   │   ├── cache/
│   │   └── logger/
│   │
│   ├── services/
│   ├── hooks/
│   ├── contexts/
│   ├── constants/
│   ├── utils/
│   └── i18n/
│
├── .env.local
├── .env.example
├── eslint.config.mjs
├── jsconfig.json
├── next.config.mjs
├── package.json
└── README.md
```

---

# Environment

ระบบแยก Firebase Environment ออกจากกัน

```text
Development
    ↓
junsekino-dev


Production
    ↓
junsekino-prod
```

Recommended Deployment

```text
Local Development
        ↓
Firebase DEV


Vercel Preview
        ↓
Firebase DEV


Vercel Production
        ↓
Firebase PROD
```

---

# Environment Variables

สร้าง

```text
.env.local
```

ตัวอย่าง

```env
NEXT_PUBLIC_APP_NAME=Junsekino
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

ห้าม Commit `.env.local`

Repository ต้องมีเฉพาะ

```text
.env.example
```

ที่ไม่มี Secret

---

# Installation

Clone Repository

```bash
git clone <repository-url>
```

เข้า Project

```bash
cd junsekino-cms
```

ติดตั้ง Dependencies

```bash
npm install
```

สร้าง

```text
.env.local
```

โดย Copy จาก

```text
.env.example
```

แล้วใส่ Firebase Configuration

---

# Development

เริ่ม Development Server

```bash
npm run dev
```

เปิด

```text
http://localhost:3000
```

---

# Build

ทดสอบ Production Build

```bash
npm run build
```

Run Production

```bash
npm start
```

---

# Lint

ตรวจสอบ Code

```bash
npm run lint
```

---

# Git Workflow

Branch หลัก

```text
main
develop
```

Development Flow

```text
feature/*
    ↓
develop
    ↓
main
```

ตัวอย่าง

```text
feature/auth
feature/company-management
feature/project-cms
feature/media-library
feature/seo
```

---

# Commit Convention

Recommended Commit Messages

```text
feat:
fix:
refactor:
style:
docs:
test:
chore:
```

ตัวอย่าง

```bash
git commit -m "feat: add admin authentication"
```

```bash
git commit -m "feat: add company management"
```

```bash
git commit -m "fix: resolve firebase session issue"
```

```bash
git commit -m "refactor: improve project service"
```

---

# Deployment

Production Deployment ใช้

```text
GitHub
  ↓
Vercel
  ↓
Next.js
  ↓
Firebase Production
```

Recommended Branch Mapping

```text
develop
   ↓
Vercel Preview


main
   ↓
Vercel Production
```

Environment Variables ต้องกำหนดใน Vercel แยกตาม Environment

```text
Development
Preview
Production
```

ห้ามใช้ Firebase Production สำหรับ Preview Deployment

---

# Security Principles

ระบบยึดหลัก

```text
Default Deny
Least Privilege
Server Authorization
Role-Based Access Control
Permission-Based Access Control
Tenant Isolation
Secure Session Cookie
Private Original Media
Audit Logging
Environment Separation
```

ทุก Sensitive Action ต้องผ่าน

```text
Authentication
      ↓
User Status
      ↓
Company Membership
      ↓
Role
      ↓
Permission
      ↓
Validation
      ↓
Service
      ↓
Database
```

การซ่อน Menu ใน Frontend ไม่ถือเป็น Security

---

# Development Principles

Junsekino CMS ใช้หลักการ

```text
Components != Business Logic
```

Component มีหน้าที่แสดงผลและ Interaction

```text
Component
   ↓
Module
   ↓
Service
   ↓
Repository
   ↓
Firebase
```

หลีกเลี่ยงการเรียก

```javascript
getDocs();
updateDoc();
deleteDoc();
```

โดยตรงกระจายอยู่ใน UI Components

---

# Roadmap

## Phase 1 — Foundation

```text
Next.js
Firebase
Environment
Architecture
Firestore Model
Project Structure
```

---

## Phase 2 — Authentication

```text
Login
Logout
Firebase Session Cookie
Current User
Auth Guard
RBAC
Permissions
Superadmin
```

---

## Phase 3 — Company Management

```text
Create Company
Edit Company
Company Status
Branding
Logo
Theme
Social
SEO
Company Members
```

---

## Phase 4 — Admin CMS

```text
Dashboard
Pages
Projects
News
People
Media
Users
Settings
```

---

## Phase 5 — Content Publishing

```text
Draft
Review
Preview
Publish
Schedule
Archive
Revision History
Audit Log
```

---

## Phase 6 — Public Website

```text
Welcome
Company Selection
Company Home
Projects
News
People
About
Contact
```

---

## Phase 7 — Internationalization

```text
Thai
English
hreflang
Localized Metadata
```

---

## Phase 8 — SEO

```text
Metadata
Open Graph
Canonical
Sitemap
robots.txt
Structured Data
SEO Management
```

---

## Phase 9 — Media Protection

```text
Private Originals
Optimized Web Images
Responsive Images
Image Transformation
CDN
Watermark Support
```

---

## Phase 10 — Advanced Features

```text
Social Publishing
Analytics
Content Calendar
Approval Workflow
AI Translation
AI SEO Suggestions
AI Alt Text
AI Content Assistant
Notifications
```

---

# Project Architecture Concept

Junsekino CMS ถูกออกแบบตามแนวคิด

```text
Company
   ↓
Brand
   ↓
Content
   ↓
Publish
```

แทนการสร้างเว็บไซต์แยกแต่ละบริษัท

```text
Website A
Website B
Website C
```

ทำให้สามารถเพิ่มบริษัทในอนาคตได้โดยไม่ต้องสร้างระบบใหม่

---

# Project Status

```text
Status: Active Development

Current Phase:
Phase 1 - Foundation
```

---

# License

This project is proprietary software developed for Junsekino.

All source code, content, images, media, designs and related materials are confidential and intended for authorized Junsekino use only.

Unauthorized copying, redistribution, modification or commercial use is prohibited.

---

© Junsekino. All rights reserved.
