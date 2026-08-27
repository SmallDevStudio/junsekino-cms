function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.6 22v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V4.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.4V14h2.8v8h3.4Z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7.1 2h9.8A5.1 5.1 0 0 1 22 7.1v9.8a5.1 5.1 0 0 1-5.1 5.1H7.1A5.1 5.1 0 0 1 2 16.9V7.1A5.1 5.1 0 0 1 7.1 2Zm-.2 2A2.9 2.9 0 0 0 4 6.9v10.2A2.9 2.9 0 0 0 6.9 20h10.2a2.9 2.9 0 0 0 2.9-2.9V6.9A2.9 2.9 0 0 0 17.1 4H6.9Zm10.7 1.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
      />
    </svg>
  );
}

function PinterestIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-3.6 19.3c-.1-1.6 0-3.5.4-5.2l1.3-5.4s-.3-.7-.3-1.8c0-1.7 1-3 2.2-3 1 0 1.6.8 1.6 1.8 0 1.1-.7 2.7-1 4.1-.6 1.8.9 3.3 2.7 3.3 3.2 0 5.4-4.1 5.4-8.9 0-3.7-3-6.5-7.6-6.5-5.5 0-8.9 4.1-8.9 8.6 0 1.6.5 3.2 1.3 4.1.1.2.2.4.1.7l-.4 1.6c-.1.5-.5.6-.9.4-2.4-1-3.5-3.7-3.5-6.7C.8 4.8 4.9 0 12.7 0 19 0 23.2 4.6 23.2 9.5c0 6.5-3.6 11.4-8.9 11.4-1.8 0-3.5-1-4-2.1l-1.1 4.4c-.4 1.5-1.2 3-1.9 4.1.9.3 2 .5 3.1.5A10 10 0 1 0 12 2Z"
      />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M15.6 2c.4 2.4 1.8 3.8 4.4 4v3.1a8 8 0 0 1-4.4-1.3v6.4A7 7 0 1 1 9.5 7.3v3.2a3.9 3.9 0 1 0 2.9 3.7V2h3.2Z"
      />
    </svg>
  );
}

const SOCIALS = [
  {
    key: "facebook",
    label: "Facebook",
    Icon: FacebookIcon,
  },
  {
    key: "instagram",
    label: "Instagram",
    Icon: InstagramIcon,
  },
  {
    key: "pinterest",
    label: "Pinterest",
    Icon: PinterestIcon,
  },
  {
    key: "tiktok",
    label: "TikTok",
    Icon: TikTokIcon,
  },
];

export default function PublicSocialLinks({ social = {}, size = "default" }) {
  const items = SOCIALS.filter((item) => Boolean(social?.[item.key]));

  if (!items.length) {
    return null;
  }

  const buttonSize = size === "large" ? "h-10 w-10" : "h-8 w-8";

  const iconSize = size === "large" ? "h-[19px] w-[19px]" : "h-[16px] w-[16px]";

  return (
    <div className="flex items-center gap-2">
      {items.map(({ key, label, Icon }) => (
        <a
          key={key}
          href={social[key]}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className={`
            flex
            ${buttonSize}
            items-center
            justify-center
            rounded-full
            bg-[#3d403d]
            text-white
            transition-all
            duration-200
            hover:scale-105
            hover:opacity-70
          `}
        >
          <span className={iconSize}>
            <Icon />
          </span>
        </a>
      ))}
    </div>
  );
}
