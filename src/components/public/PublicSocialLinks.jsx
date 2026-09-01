import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPinterestP,
  FaYoutube,
} from "react-icons/fa";

import { FaTiktok, FaXTwitter } from "react-icons/fa6";

import { RiLineFill } from "react-icons/ri";

const DEFAULT_BACKGROUND = "#ADAEB3";
const ICON_COLOR = "#ffffff";

const SOCIALS = [
  {
    key: "facebook",
    label: "Facebook",
    Icon: FaFacebookF,
    hoverColor: "#1877F2",
  },
  {
    key: "instagram",
    label: "Instagram",
    Icon: FaInstagram,
    hoverColor: "#E4405F",
  },
  {
    key: "youtube",
    label: "YouTube",
    Icon: FaYoutube,
    hoverColor: "#FF0000",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    Icon: FaLinkedinIn,
    hoverColor: "#0A66C2",
  },
  {
    key: "tiktok",
    label: "TikTok",
    Icon: FaTiktok,
    hoverColor: "#000000",
  },
  {
    key: "x",
    label: "X",
    Icon: FaXTwitter,
    hoverColor: "#000000",
  },
  {
    key: "pinterest",
    label: "Pinterest",
    Icon: FaPinterestP,
    hoverColor: "#E60023",
  },
  {
    key: "line",
    label: "LINE",
    Icon: RiLineFill,
    hoverColor: "#06C755",
  },
];

function normalizeSocialUrl(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  try {
    const url = new URL(trimmedValue);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function resolveSocialItems(social) {
  return SOCIALS.map((item) => ({
    ...item,
    href: normalizeSocialUrl(social?.[item.key]),
  })).filter((item) => Boolean(item.href));
}

function applyHoverStyle(event, backgroundColor) {
  event.currentTarget.style.backgroundColor = backgroundColor;
  event.currentTarget.style.color = ICON_COLOR;
}

function applyDefaultStyle(event) {
  event.currentTarget.style.backgroundColor = DEFAULT_BACKGROUND;
  event.currentTarget.style.color = ICON_COLOR;
}

export default function PublicSocialLinks({ social = {}, size = "default" }) {
  const items = resolveSocialItems(social);

  if (!items.length) {
    return null;
  }

  const large = size === "large";

  const buttonSize = large
    ? "h-[50px] w-[50px]"
    : "h-[40px] w-[40px] xl:h-[44px] xl:w-[44px]";

  const iconSize = large ? 24 : 20;

  return (
    <div
      className="
        flex
        flex-wrap
        items-center
        justify-center
        gap-2
      "
      aria-label="Social media"
    >
      {items.map(({ key, label, Icon, href, hoverColor }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          onMouseEnter={(event) => {
            applyHoverStyle(event, hoverColor);
          }}
          onMouseLeave={applyDefaultStyle}
          onFocus={(event) => {
            applyHoverStyle(event, hoverColor);
          }}
          onBlur={applyDefaultStyle}
          className={`
              inline-flex
              ${buttonSize}

              shrink-0
              items-center
              justify-center

              rounded-full

              transition-all
              duration-200

              hover:scale-105

              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[var(--public-primary)]
              focus-visible:ring-offset-2
              focus-visible:ring-offset-[var(--public-background)]
            `}
          style={{
            backgroundColor: DEFAULT_BACKGROUND,
            color: ICON_COLOR,
          }}
        >
          <Icon
            size={iconSize}
            color="currentColor"
            aria-hidden="true"
            focusable="false"
          />
        </a>
      ))}
    </div>
  );
}
