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
    label: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    id: "content",
    label: "Content",
    items: [
      {
        id: "home",
        label: "Home",
        href: "/admin/home",
        icon: Home,
      },
      {
        id: "about",
        label: "About",
        href: "/admin/about",
        icon: Building2,
      },
      {
        id: "projects",
        label: "Projects",
        href: "/admin/projects",
        icon: FolderKanban,
      },
      {
        id: "awards",
        label: "Awards",
        href: "/admin/awards",
        icon: Award,
      },
      {
        id: "public",
        label: "Public",
        href: "/admin/public-contents",
        icon: Newspaper,
      },
      {
        id: "news",
        label: "News",
        href: "/admin/news",
        icon: FileText,
      },
      {
        id: "people",
        label: "People",
        href: "/admin/people",
        icon: Users,
      },
      {
        id: "contact",
        label: "Contact",
        href: "/admin/contact",
        icon: Contact,
      },
    ],
  },

  {
    id: "management",
    label: "Management",
    items: [
      {
        id: "media",
        label: "Media",
        href: "/admin/media",
        icon: Image,
      },
      {
        id: "forms",
        label: "Forms",
        href: "/admin/forms",
        icon: FormInput,
      },
      {
        id: "popups",
        label: "Popups",
        href: "/admin/popups",
        icon: Megaphone,
      },
      {
        id: "tags",
        label: "Tags",
        href: "/admin/tags",
        icon: Tags,
      },
      {
        id: "search",
        label: "Search",
        href: "/admin/search",
        icon: Search,
      },
      {
        id: "notifications",
        label: "Notifications",
        href: "/admin/notifications",
        icon: Bell,
      },
    ],
  },

  {
    id: "administration",
    label: "Administration",
    items: [
      {
        id: "company",
        label: "Company",
        href: "/admin/company",
        icon: BriefcaseBusiness,
      },
      {
        id: "members",
        label: "Members",
        href: "/admin/members",
        icon: Users,
        adminOnly: true,
      },
      {
        id: "settings",
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
        adminOnly: true,
      },
    ],
  },
];
