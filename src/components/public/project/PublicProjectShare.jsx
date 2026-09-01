"use client";

import { useEffect, useRef, useState } from "react";

import { CiFacebook, CiLinkedin, CiLink } from "react-icons/ci";

import { FaFacebook, FaLinkedin, FaLink } from "react-icons/fa";

import { RiTwitterXFill, RiTwitterXLine } from "react-icons/ri";

import { Check, Share2, X } from "lucide-react";

function Tooltip({ label }) {
  return (
    <span
      className="
        pointer-events-none
        absolute
        bottom-full
        left-1/2
        z-[200]
        mb-2.5
        -translate-x-1/2
        translate-y-1
        whitespace-nowrap
        bg-black/80
        px-2.5
        py-1.5
        text-[9px]
        font-normal
        tracking-[0.04em]
        text-white
        opacity-0
        shadow-[0_5px_16px_rgba(0,0,0,0.10)]
        transition-all
        duration-200
        group-hover:translate-y-0
        group-hover:opacity-100
        group-focus-visible:translate-y-0
        group-focus-visible:opacity-100
      "
    >
      {label}

      <span
        className="
          absolute
          left-1/2
          top-full
          -translate-x-1/2
          border-x-[4px]
          border-t-[4px]
          border-x-transparent
          border-t-black/80
        "
      />
    </span>
  );
}

function SocialButton({
  label,

  onClick,

  outlineIcon,

  filledIcon,

  hoverColor,

  active = false,
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="
        group
        relative
        flex
        h-10
        w-10
        items-center
        justify-center
        focus-visible:outline-none
      "
    >
      <span
        className="
          relative
          flex
          h-6
          w-6
          items-center
          justify-center
        "
      >
        <span
          className={`
            absolute
            inset-0
            flex
            items-center
            justify-center
            text-[var(--public-muted-foreground)]
            transition-all
            duration-200

            ${
              active
                ? "scale-75 opacity-0"
                : "scale-100 opacity-100 group-hover:scale-75 group-hover:opacity-0"
            }
          `}
        >
          {outlineIcon}
        </span>

        <span
          className={`
            absolute
            inset-0
            flex
            items-center
            justify-center
            transition-all
            duration-200

            ${
              active
                ? "scale-100 opacity-100"
                : "scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100"
            }
          `}
          style={{
            color: active ? "var(--public-primary)" : hoverColor,
          }}
        >
          {filledIcon}
        </span>
      </span>

      <Tooltip label={label} />
    </button>
  );
}

export default function PublicProjectShare({ title }) {
  const [open, setOpen] = useState(false);

  const [copied, setCopied] = useState(false);

  const containerRef = useRef(null);

  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",

      handlePointerDown,
    );

    document.addEventListener(
      "keydown",

      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",

        handlePointerDown,
      );

      document.removeEventListener(
        "keydown",

        handleKeyDown,
      );

      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  function getPageUrl() {
    return window.location.href;
  }

  function openShareUrl(url) {
    window.open(
      url,

      "_blank",

      "noopener,noreferrer,width=680,height=620",
    );
  }

  function handleFacebook() {
    const url = encodeURIComponent(getPageUrl());

    openShareUrl(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
  }

  function handleX() {
    const url = encodeURIComponent(getPageUrl());

    const text = encodeURIComponent(title || "");

    openShareUrl(`https://twitter.com/intent/tweet?url=${url}&text=${text}`);
  }

  function handleLinkedIn() {
    const url = encodeURIComponent(getPageUrl());

    openShareUrl(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getPageUrl());

      setCopied(true);

      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (copyError) {
      console.error(
        "Copy link error:",

        copyError,
      );
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Share project"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="
          group
          flex
          h-9
          w-9
          items-center
          justify-center
          text-[var(--public-muted-foreground)]
          transition-all
          duration-200
          hover:text-[var(--public-primary)]
          focus-visible:outline-none
        "
      >
        <Share2
          size={17}
          strokeWidth={1.15}
          className="
            transition-transform
            duration-200
            group-hover:scale-110
          "
        />
      </button>

      {open && (
        <div
          className="
            absolute
            right-0
            top-full
            z-[160]
            mt-2
            min-w-[210px]
            border
            border-[var(--public-border)]
            bg-[var(--public-surface)]
            px-3
            py-3
            text-[var(--public-foreground)]
            shadow-[0_14px_40px_rgba(0,0,0,0.12)]
          "
        >
          <div
            className="
              mb-2
              flex
              items-center
              justify-between
              px-1
            "
          >
            <span
              className="
                text-[9px]
                uppercase
                tracking-[0.12em]
                text-[var(--public-muted-foreground)]
              "
            >
              Share
            </span>

            <button
              type="button"
              aria-label="Close share menu"
              onClick={() => setOpen(false)}
              className="
                flex
                h-5
                w-5
                items-center
                justify-center
                text-[var(--public-muted-foreground)]
                transition-colors
                duration-200
                hover:text-[var(--public-foreground)]
                focus-visible:outline-none
              "
            >
              <X size={12} strokeWidth={1.2} />
            </button>
          </div>

          <div
            className="
              flex
              items-center
              justify-center
              gap-1
              border-t
              border-[var(--public-border)]
              pt-2
            "
          >
            <SocialButton
              label="Facebook"
              onClick={handleFacebook}
              outlineIcon={<CiFacebook size={23} />}
              filledIcon={<FaFacebook size={20} />}
              hoverColor="#1877F2"
            />

            <SocialButton
              label="Share on X"
              onClick={handleX}
              outlineIcon={<RiTwitterXLine size={19} />}
              filledIcon={<RiTwitterXFill size={18} />}
              hoverColor="var(--public-foreground)"
            />

            <SocialButton
              label="LinkedIn"
              onClick={handleLinkedIn}
              outlineIcon={<CiLinkedin size={23} />}
              filledIcon={<FaLinkedin size={20} />}
              hoverColor="#0A66C2"
            />

            <SocialButton
              label={copied ? "Copied!" : "Copy link"}
              onClick={handleCopy}
              active={copied}
              outlineIcon={<CiLink size={23} />}
              filledIcon={
                copied ? (
                  <Check size={19} strokeWidth={1.5} />
                ) : (
                  <FaLink size={16} />
                )
              }
              hoverColor="var(--public-primary)"
            />
          </div>

          <div
            className={`
              overflow-hidden
              text-center
              transition-all
              duration-300

              ${copied ? "mt-2 max-h-8 opacity-100" : "mt-0 max-h-0 opacity-0"}
            `}
          >
            <div
              className="
                border-t
                border-[var(--public-border)]
                pt-2
                text-[9px]
                uppercase
                tracking-[0.08em]
                text-[var(--public-primary)]
              "
            >
              Link copied
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
