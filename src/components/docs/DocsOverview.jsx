"use client";

import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  FileText,
  FolderKanban,
  Gauge,
  Globe2,
  Image as ImageIcon,
  Languages,
  LayoutDashboard,
  LockKeyhole,
  Rocket,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";

import Link from "next/link";

import { useAdminTranslation } from "@/components/admin/i18n/AdminI18nProvider";

import { ADMIN_LOCALE } from "@/constants/admin-ui";

/*
 * =========================================================
 * CONTENT
 * =========================================================
 */

const CONTENT = {
  en: {
    eyebrow: "Junsekino CMS Documentation",

    title: "Manage every Junsekino website from one workspace",

    description:
      "A practical guide for managing company information, website content, media, members, privacy and publishing without editing source code.",

    start: "Start here",

    startDescription:
      "If this is your first time using the system, complete these guides in order.",

    capabilities: "Platform capabilities",

    capabilitiesDescription:
      "Junsekino CMS separates data by company while providing a consistent content management workflow.",

    workflow: "Recommended workflow",

    workflowDescription:
      "Follow the same sequence whenever creating or updating important public content.",

    roles: "Who uses the system",

    important: "Important before you begin",

    readGuide: "Read guide",

    steps: [
      "Select and verify the company.",
      "Complete content for enabled languages.",
      "Choose approved images from Media Library.",
      "Review the generated SEO information.",
      "Save and review the draft.",
      "Publish only after approval.",
      "Verify the result on desktop and mobile.",
    ],

    notices: [
      "Always verify the selected company before saving or publishing.",
      "English is currently the default public website language.",
      "Saving a draft does not publish it to the public website.",
      "Use only approved information and media with valid usage rights.",
      "Review important changes on both desktop and mobile.",
    ],
  },

  th: {
    eyebrow: "คู่มือ Junsekino CMS",

    title: "จัดการเว็บไซต์ Junsekino ทุกบริษัทจากพื้นที่ทำงานเดียว",

    description:
      "คู่มือสำหรับจัดการข้อมูลบริษัท เนื้อหาเว็บไซต์ รูปภาพ สมาชิก Privacy และการ Publish โดยไม่ต้องแก้ไข Source code",

    start: "เริ่มต้นจากตรงนี้",

    startDescription:
      "หากใช้งานระบบเป็นครั้งแรก แนะนำให้อ่านคู่มือตามลำดับต่อไปนี้",

    capabilities: "ความสามารถของระบบ",

    capabilitiesDescription:
      "Junsekino CMS แยกข้อมูลตามบริษัท แต่ใช้แนวทางจัดการเนื้อหาแบบเดียวกันทั้งระบบ",

    workflow: "ขั้นตอนการทำงานที่แนะนำ",

    workflowDescription:
      "ใช้ลำดับเดียวกันทุกครั้งเมื่อสร้างหรือแก้ไขเนื้อหาสำคัญบนเว็บไซต์ Public",

    roles: "ผู้ใช้งานระบบ",

    important: "สิ่งสำคัญก่อนเริ่มใช้งาน",

    readGuide: "เปิดคู่มือ",

    steps: [
      "เลือกและตรวจสอบบริษัท",
      "กรอกข้อมูลตามภาษาที่เปิดใช้งาน",
      "เลือกรูปที่ได้รับอนุมัติจาก Media Library",
      "ตรวจสอบข้อมูล SEO ที่ระบบสร้างให้",
      "Save และตรวจสอบ Draft",
      "Publish หลังได้รับการอนุมัติแล้วเท่านั้น",
      "ตรวจสอบผลบน Desktop และมือถือ",
    ],

    notices: [
      "ตรวจสอบบริษัทที่เลือกทุกครั้งก่อน Save หรือ Publish",
      "ปัจจุบันภาษาอังกฤษเป็นภาษาเริ่มต้นของเว็บไซต์ Public",
      "การ Save Draft ไม่ได้ทำให้ข้อมูลแสดงบนเว็บไซต์ทันที",
      "ใช้เฉพาะข้อมูลและสื่อที่ได้รับอนุมัติและมีสิทธิ์ใช้งาน",
      "ตรวจสอบการเปลี่ยนแปลงสำคัญทั้ง Desktop และมือถือ",
    ],
  },
};

const START_GUIDES = [
  {
    number: "01",

    icon: Rocket,

    href: "/docs/getting-started/quick-start",

    title: {
      en: "Quick Start",
      th: "เริ่มใช้งานอย่างรวดเร็ว",
    },

    description: {
      en: "Prepare a company workspace and publish the first website update.",
      th: "เตรียมพื้นที่ทำงานและ Publish ข้อมูลเว็บไซต์ครั้งแรก",
    },
  },

  {
    number: "02",

    icon: LayoutDashboard,

    href: "/docs/getting-started/interface",

    title: {
      en: "Admin Interface",
      th: "ส่วนประกอบหน้า Admin",
    },

    description: {
      en: "Understand the header, sidebar, company switcher and workspace.",
      th: "ทำความเข้าใจ Header, Sidebar, Company switcher และ Workspace",
    },
  },

  {
    number: "03",

    icon: Languages,

    href: "/docs/getting-started/localization",

    title: {
      en: "Languages and Localization",
      th: "ภาษาและ Localization",
    },

    description: {
      en: "Learn how English and Thai content fields are controlled.",
      th: "เรียนรู้วิธีควบคุมช่องกรอกข้อมูลภาษาอังกฤษและภาษาไทย",
    },
  },

  {
    number: "04",

    icon: ShieldCheck,

    href: "/docs/getting-started/roles-permissions",

    title: {
      en: "Roles and Permissions",
      th: "บทบาทและสิทธิ์",
    },

    description: {
      en: "Understand what each user role is allowed to manage.",
      th: "ทำความเข้าใจว่าแต่ละบทบาทสามารถจัดการอะไรได้บ้าง",
    },
  },
];

const CAPABILITIES = [
  {
    icon: Gauge,

    href: "/docs/workspace/dashboard",

    title: {
      en: "Dashboard",
      th: "Dashboard",
    },

    description: {
      en: "Website traffic, engagement, messages and recent activity.",
      th: "Traffic, Engagement, ข้อความ และกิจกรรมล่าสุด",
    },
  },

  {
    icon: Building2,

    href: "/docs/workspace/company",

    title: {
      en: "Company workspace",
      th: "ข้อมูลบริษัท",
    },

    description: {
      en: "Company profile, branding, themes, contact details and social links.",
      th: "ข้อมูลบริษัท Branding, Theme, ช่องทางติดต่อ และ Social Media",
    },
  },

  {
    icon: FolderKanban,

    href: "/docs/content/projects",

    title: {
      en: "Content management",
      th: "จัดการเนื้อหา",
    },

    description: {
      en: "Home, About, Projects, Awards, Public Content and Contact.",
      th: "Home, About, Projects, Awards, Public Content และ Contact",
    },
  },

  {
    icon: ImageIcon,

    href: "/docs/assets/media-library",

    title: {
      en: "Media Library",
      th: "Media Library",
    },

    description: {
      en: "Upload, optimize and reuse approved website images.",
      th: "อัปโหลด Optimize และนำรูปที่ได้รับอนุมัติกลับมาใช้ซ้ำ",
    },
  },

  {
    icon: Users,

    href: "/docs/workspace/members",

    title: {
      en: "Members",
      th: "สมาชิก",
    },

    description: {
      en: "Company membership, roles, permissions and account access.",
      th: "สมาชิกบริษัท บทบาท สิทธิ์ และการเข้าถึงบัญชี",
    },
  },

  {
    icon: Settings2,

    href: "/docs/configuration/localization",

    title: {
      en: "Configuration",
      th: "การตั้งค่า",
    },

    description: {
      en: "Localization, navigation, email, notifications and SEO.",
      th: "Localization, Navigation, Email, Notifications และ SEO",
    },
  },

  {
    icon: LockKeyhole,

    href: "/docs/configuration/privacy",

    title: {
      en: "Privacy and legal",
      th: "Privacy และกฎหมาย",
    },

    description: {
      en: "Cookie consent, retention and published legal documents.",
      th: "Cookie consent, การเก็บข้อมูล และเอกสารกฎหมาย",
    },
  },

  {
    icon: Globe2,

    href: "/docs/configuration/seo",

    title: {
      en: "Public website and SEO",
      th: "เว็บไซต์ Public และ SEO",
    },

    description: {
      en: "Metadata, Open Graph, sitemap and search engine visibility.",
      th: "Metadata, Open Graph, Sitemap และการแสดงใน Search Engine",
    },
  },
];

const ROLES = [
  {
    title: "Superadmin",

    description: {
      en: "Manages every company, user, membership and system-level configuration.",
      th: "จัดการได้ทุกบริษัท ผู้ใช้งาน Membership และการตั้งค่าระดับระบบ",
    },
  },

  {
    title: "Admin",

    description: {
      en: "Manages assigned company content, members and available settings.",
      th: "จัดการเนื้อหา สมาชิก และการตั้งค่าที่ได้รับอนุญาตภายในบริษัท",
    },
  },

  {
    title: "Editor",

    description: {
      en: "Creates and maintains content according to assigned permissions.",
      th: "สร้างและแก้ไขเนื้อหาตาม Permission ที่ได้รับมอบหมาย",
    },
  },
];

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function localized(value, locale) {
  return value?.[locale] || value?.en || "";
}

/*
 * =========================================================
 * OVERVIEW
 * =========================================================
 */

export default function DocsOverview() {
  const { locale } = useAdminTranslation();

  const safeLocale = locale === ADMIN_LOCALE.TH ? "th" : "en";

  const copy = CONTENT[safeLocale];

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[1280px]
      "
    >
      {/* =================================
          HERO
      ================================= */}

      <section
        className="
          overflow-hidden

          rounded-3xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]
        "
      >
        <div
          className="
            relative
            overflow-hidden

            px-6
            py-10

            sm:px-10
            sm:py-14

            xl:px-14
            xl:py-16
          "
        >
          <div
            aria-hidden="true"
            className="
              absolute
              -right-24
              -top-32

              h-80
              w-80

              rounded-full

              bg-[var(--company-primary-soft)]

              blur-2xl
            "
          />

          <div
            className="
              relative
              z-10
              max-w-[880px]
            "
          >
            <div
              className="
                inline-flex
                items-center
                gap-2

                rounded-full

                border
                border-[var(--company-primary)]

                bg-[var(--company-primary-soft)]

                px-3
                py-1.5

                admin-text-9
                font-semibold
                uppercase
                tracking-[0.14em]

                text-[var(--company-primary)]
              "
            >
              <BookOpen size={13} />

              {copy.eyebrow}
            </div>

            <h1
              className="
                mt-6

                max-w-[850px]

                admin-text-28
                font-semibold
                leading-[1.18]
                tracking-[-0.045em]

                text-[var(--admin-foreground)]
              "
            >
              {copy.title}
            </h1>

            <p
              className="
                mt-5
                max-w-[760px]

                admin-text-13
                leading-[1.85]

                text-[var(--admin-muted)]
              "
            >
              {copy.description}
            </p>

            <div
              className="
                mt-7
                flex
                flex-wrap
                gap-3
              "
            >
              <Link
                href="/docs/getting-started/quick-start"
                className="
                  inline-flex
                  min-h-11
                  items-center
                  justify-center
                  gap-2

                  rounded-xl

                  bg-[var(--company-primary)]

                  px-5

                  admin-text-11
                  font-semibold

                  !text-white

                  transition

                  hover:bg-[var(--company-primary-hover)]
                "
              >
                {safeLocale === "th" ? "เริ่มต้นใช้งาน" : "Get started"}

                <ArrowRight size={15} />
              </Link>

              <Link
                href="/docs/getting-started/content-workflow"
                className="
                  inline-flex
                  min-h-11
                  items-center
                  justify-center
                  gap-2

                  rounded-xl

                  border
                  border-[var(--admin-border)]

                  bg-white

                  px-5

                  admin-text-11
                  font-semibold

                  text-[var(--admin-foreground)]

                  transition

                  hover:bg-[var(--admin-hover)]
                "
              >
                {safeLocale === "th" ? "ดูขั้นตอนการทำงาน" : "View workflow"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =================================
          START HERE
      ================================= */}

      <section className="mt-10">
        <div>
          <h2
            className="
              admin-text-18
              font-semibold
              tracking-[-0.025em]

              text-[var(--admin-foreground)]
            "
          >
            {copy.start}
          </h2>

          <p
            className="
              mt-2

              admin-text-11
              leading-[1.7]

              text-[var(--admin-muted)]
            "
          >
            {copy.startDescription}
          </p>
        </div>

        <div
          className="
            mt-5
            grid
            gap-3

            md:grid-cols-2
          "
        >
          {START_GUIDES.map((guide) => {
            const Icon = guide.icon;

            return (
              <Link
                key={guide.href}
                href={guide.href}
                className="
                  group
                  flex
                  items-start
                  gap-4

                  rounded-2xl

                  border
                  border-[var(--admin-border)]

                  bg-[var(--admin-surface)]

                  p-5

                  transition

                  hover:-translate-y-0.5
                  hover:border-[var(--company-primary)]
                  hover:shadow-sm
                "
              >
                <span
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center

                    rounded-2xl

                    bg-[var(--company-primary-soft)]

                    text-[var(--company-primary)]
                  "
                >
                  <Icon size={18} />
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className="
                      admin-text-9
                      font-semibold
                      uppercase
                      tracking-[0.12em]

                      text-[var(--company-primary)]
                    "
                  >
                    {guide.number}
                  </span>

                  <span
                    className="
                      mt-1
                      block

                      admin-text-12
                      font-semibold

                      text-[var(--admin-foreground)]
                    "
                  >
                    {localized(
                      guide.title,

                      safeLocale,
                    )}
                  </span>

                  <span
                    className="
                      mt-2
                      block

                      admin-text-10
                      leading-[1.7]

                      text-[var(--admin-muted)]
                    "
                  >
                    {localized(
                      guide.description,

                      safeLocale,
                    )}
                  </span>
                </span>

                <ArrowRight
                  size={15}
                  className="
                    mt-1
                    shrink-0

                    text-[var(--admin-muted-light)]

                    transition

                    group-hover:translate-x-1
                    group-hover:text-[var(--company-primary)]
                  "
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* =================================
          CAPABILITIES
      ================================= */}

      <section className="mt-12">
        <h2
          className="
            admin-text-18
            font-semibold
            tracking-[-0.025em]

            text-[var(--admin-foreground)]
          "
        >
          {copy.capabilities}
        </h2>

        <p
          className="
            mt-2
            max-w-[760px]

            admin-text-11
            leading-[1.7]

            text-[var(--admin-muted)]
          "
        >
          {copy.capabilitiesDescription}
        </p>

        <div
          className="
            mt-5
            grid
            gap-3

            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          {CAPABILITIES.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="
                  group

                  rounded-2xl

                  border
                  border-[var(--admin-border)]

                  bg-[var(--admin-surface)]

                  p-5

                  transition

                  hover:border-[var(--company-primary)]
                  hover:shadow-sm
                "
              >
                <span
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center

                    rounded-xl

                    bg-[var(--company-primary-soft)]

                    text-[var(--company-primary)]
                  "
                >
                  <Icon size={17} />
                </span>

                <h3
                  className="
                    mt-4

                    admin-text-11
                    font-semibold

                    text-[var(--admin-foreground)]
                  "
                >
                  {localized(
                    item.title,

                    safeLocale,
                  )}
                </h3>

                <p
                  className="
                    mt-2

                    admin-text-10
                    leading-[1.7]

                    text-[var(--admin-muted)]
                  "
                >
                  {localized(
                    item.description,

                    safeLocale,
                  )}
                </p>

                <span
                  className="
                    mt-4
                    inline-flex
                    items-center
                    gap-1.5

                    admin-text-9
                    font-semibold

                    text-[var(--company-primary)]
                  "
                >
                  {copy.readGuide}

                  <ArrowRight
                    size={12}
                    className="
                      transition-transform

                      group-hover:translate-x-0.5
                    "
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* =================================
          WORKFLOW
      ================================= */}

      <section
        className="
          mt-12

          rounded-3xl

          border
          border-[var(--admin-border)]

          bg-[var(--admin-surface)]

          p-6

          sm:p-8
        "
      >
        <h2
          className="
            admin-text-18
            font-semibold
            tracking-[-0.025em]

            text-[var(--admin-foreground)]
          "
        >
          {copy.workflow}
        </h2>

        <p
          className="
            mt-2

            admin-text-11
            leading-[1.7]

            text-[var(--admin-muted)]
          "
        >
          {copy.workflowDescription}
        </p>

        <ol
          className="
            mt-6
            grid
            gap-3

            md:grid-cols-2
            xl:grid-cols-4
          "
        >
          {copy.steps.map((step, index) => (
            <li
              key={step}
              className="
                flex
                items-start
                gap-3

                rounded-xl

                bg-[var(--admin-background)]

                p-4
              "
            >
              <span
                className="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center

                  rounded-full

                  bg-[var(--company-primary)]

                  admin-text-9
                  font-semibold

                  !text-white
                "
              >
                {index + 1}
              </span>

              <span
                className="
                  pt-1

                  admin-text-10
                  leading-[1.65]

                  text-[var(--admin-foreground)]
                "
              >
                {step}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* =================================
          ROLES + IMPORTANT
      ================================= */}

      <div
        className="
          mt-12
          grid
          gap-5

          xl:grid-cols-2
        "
      >
        <section
          className="
            rounded-3xl

            border
            border-[var(--admin-border)]

            bg-[var(--admin-surface)]

            p-6

            sm:p-8
          "
        >
          <div className="flex items-center gap-3">
            <Users size={19} className="text-[var(--company-primary)]" />

            <h2
              className="
                admin-text-16
                font-semibold

                text-[var(--admin-foreground)]
              "
            >
              {copy.roles}
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {ROLES.map((role) => (
              <div
                key={role.title}
                className="
                  rounded-xl

                  border
                  border-[var(--admin-border)]

                  p-4
                "
              >
                <h3
                  className="
                    admin-text-11
                    font-semibold

                    text-[var(--admin-foreground)]
                  "
                >
                  {role.title}
                </h3>

                <p
                  className="
                    mt-1

                    admin-text-10
                    leading-[1.7]

                    text-[var(--admin-muted)]
                  "
                >
                  {localized(
                    role.description,

                    safeLocale,
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="
            rounded-3xl

            border
            border-amber-500/25

            bg-amber-500/[0.06]

            p-6

            sm:p-8
          "
        >
          <div className="flex items-center gap-3">
            <FileText size={19} className="text-amber-600" />

            <h2
              className="
                admin-text-16
                font-semibold

                text-[var(--admin-foreground)]
              "
            >
              {copy.important}
            </h2>
          </div>

          <ul className="mt-5 space-y-4">
            {copy.notices.map((notice) => (
              <li
                key={notice}
                className="
                  flex
                  items-start
                  gap-3
                "
              >
                <CheckCircle2
                  size={16}
                  className="
                    mt-0.5
                    shrink-0

                    text-amber-600
                  "
                />

                <span
                  className="
                    admin-text-10
                    leading-[1.7]

                    text-[var(--admin-foreground)]
                  "
                >
                  {notice}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
