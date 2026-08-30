import {
  Award,
  Bell,
  BriefcaseBusiness,
  Building2,
  Contact,
  FileText,
  FolderKanban,
  FormInput,
  Home,
  Image,
  LayoutDashboard,
  Mail,
  Megaphone,
  Newspaper,
  Search,
  Settings,
  Tags,
  Users,
} from "lucide-react";

export const ADMIN_NAVIGATION = [
  {
    id: "main",
    labelKey: "navigation.overview",

    items: [
      {
        id: "dashboard",
        labelKey: "navigation.dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    id: "content",
    labelKey: "navigation.content",

    items: [
      {
        id: "home",
        labelKey: "navigation.home",
        href: "/admin/home",
        icon: Home,
      },

      {
        id: "about",
        labelKey: "navigation.about",
        href: "/admin/about",
        icon: Building2,
      },

      {
        id: "projects",
        labelKey: "navigation.projects",
        href: "/admin/projects",
        icon: FolderKanban,
      },

      {
        id: "awards",
        labelKey: "navigation.awards",
        href: "/admin/awards",
        icon: Award,
      },

      {
        id: "public",
        labelKey: "navigation.publicContent",
        href: "/admin/public-contents",
        icon: Newspaper,
      },

      {
        id: "news",
        labelKey: "navigation.news",
        href: "/admin/news",
        icon: FileText,
      },

      {
        id: "people",
        labelKey: "navigation.people",
        href: "/admin/people",
        icon: Users,
      },

      {
        id: "contact",
        labelKey: "navigation.contact",
        href: "/admin/contact",
        icon: Contact,
      },
    ],
  },

  {
    id: "management",
    labelKey: "navigation.management",

    items: [
      {
        id: "messages",
        labelKey: "messages.title",
        href: "/admin/messages",
        icon: Mail,
      },

      {
        id: "media",
        labelKey: "navigation.media",
        href: "/admin/media",
        icon: Image,
      },

      {
        id: "forms",
        labelKey: "navigation.forms",
        href: "/admin/forms",
        icon: FormInput,
      },

      {
        id: "popups",
        labelKey: "navigation.popups",
        href: "/admin/popups",
        icon: Megaphone,
      },

      {
        id: "tags",
        labelKey: "navigation.tags",
        href: "/admin/tags",
        icon: Tags,
      },

      {
        id: "search",
        labelKey: "navigation.search",
        href: "/admin/search",
        icon: Search,
      },

      {
        id: "notifications",
        labelKey: "navigation.notifications",
        href: "/admin/notifications",
        icon: Bell,
      },
    ],
  },

  {
    id: "administration",
    labelKey: "navigation.administration",

    items: [
      {
        id: "company",
        labelKey: "navigation.company",
        href: "/admin/company",
        icon: BriefcaseBusiness,
      },

      {
        id: "members",
        labelKey: "navigation.members",
        href: "/admin/members",
        icon: Users,
        adminOnly: true,
      },

      {
        id: "settings",
        labelKey: "navigation.settings",
        href: "/admin/settings",
        icon: Settings,
        adminOnly: true,
      },
    ],
  },
];
