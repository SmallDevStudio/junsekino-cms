"use client";

import { useEffect, useRef, useState } from "react";

import { CiFacebook, CiLinkedin, CiLink } from "react-icons/ci";

import { FaFacebook, FaLinkedin, FaLink } from "react-icons/fa";

import { RiTwitterXFill, RiTwitterXLine } from "react-icons/ri";

import { Check, Share2, X } from "lucide-react";

import { getPublicVisitorId } from "@/utils/public-visitor";

/*
 * =========================================================
 * TOOLTIP
 * =========================================================
 */

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

        whitespace-nowrap

        bg-black/80

        px-2.5
        py-1.5

        text-[9px]
        tracking-[0.04em]
        text-white

        opacity-0

        shadow-[0_5px_16px_rgba(0,0,0,0.10)]

        transition-all
        duration-200

        translate-y-1

        group-hover:translate-y-0
        group-hover:opacity-100
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

/*
 * =========================================================
 * SOCIAL BUTTON
 * =========================================================
 */

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
        h-9
        w-9

        items-center
        justify-center
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

            text-black/25

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

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function PublicContentShare({ companySlug, slug, title }) {
  const [open, setOpen] = useState(false);

  const [copied, setCopied] = useState(false);

  const containerRef = useRef(null);

  const timeoutRef = useRef(null);

  useEffect(() => {
    function handleOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutside);

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutside);

      document.removeEventListener("keydown", handleEscape);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function pageUrl() {
    return window.location.href;
  }

  function endpoint() {
    return `/api/public/v1/companies/${encodeURIComponent(
      companySlug,
    )}/public-contents/${encodeURIComponent(slug)}/engagement`;
  }

  /*
   * Share analytics must never block
   * the actual share action.
   */
  function recordShare(channel) {
    const visitorId = getPublicVisitorId();

    if (!visitorId || !companySlug || !slug) {
      return;
    }

    fetch(endpoint(), {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        action: "share",

        visitorId,

        channel,
      }),

      cache: "no-store",

      keepalive: true,
    }).catch((error) => {
      console.error("Public content share metric error:", error);
    });
  }

  function openShare(url, channel) {
    /*
     * Open immediately inside the click
     * event so browsers do not block it.
     */
    window.open(url, "_blank", "noopener,noreferrer,width=680,height=620");

    recordShare(channel);
  }

  function facebook() {
    openShare(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        pageUrl(),
      )}`,

      "facebook",
    );
  }

  function twitter() {
    openShare(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        pageUrl(),
      )}&text=${encodeURIComponent(title || "")}`,

      "x",
    );
  }

  function linkedin() {
    openShare(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        pageUrl(),
      )}`,

      "linkedin",
    );
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl());

      recordShare("copy");

      setCopied(true);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error("Copy link error:", error);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* SHARE */}

      <button
        type="button"
        aria-label="Share content"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="
          group
          relative

          flex
          h-8
          w-8

          items-center
          justify-center

          text-black/25

          transition-colors

          hover:text-[var(--public-primary)]
        "
      >
        <Share2 size={16} strokeWidth={1.15} />

        {!open && <Tooltip label="Share" />}
      </button>

      {/* POPOVER */}

      {open && (
        <div
          className="
            absolute
            right-0
            top-full
            z-[160]

            mt-2

            min-w-[205px]

            border
            border-black/[0.06]

            bg-[var(--public-background)]

            px-3
            py-3

            shadow-[0_14px_40px_rgba(0,0,0,0.08)]
          "
        >
          <div
            className="
              mb-2

              flex
              items-center
              justify-between
            "
          >
            <span
              className="
                text-[9px]
                uppercase
                tracking-[0.12em]

                text-black/30
              "
            >
              Share
            </span>

            <button
              type="button"
              aria-label="Close share"
              onClick={() => setOpen(false)}
              className="
                text-black/20

                transition-colors

                hover:text-black/60
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

              border-t
              border-black/[0.05]

              pt-2
            "
          >
            <SocialButton
              label="Facebook"
              onClick={facebook}
              outlineIcon={<CiFacebook size={23} />}
              filledIcon={<FaFacebook size={20} />}
              hoverColor="#1877F2"
            />

            <SocialButton
              label="Share on X"
              onClick={twitter}
              outlineIcon={<RiTwitterXLine size={18} />}
              filledIcon={<RiTwitterXFill size={17} />}
              hoverColor="#000000"
            />

            <SocialButton
              label="LinkedIn"
              onClick={linkedin}
              outlineIcon={<CiLinkedin size={23} />}
              filledIcon={<FaLinkedin size={20} />}
              hoverColor="#0A66C2"
            />

            <SocialButton
              label={copied ? "Copied!" : "Copy link"}
              onClick={copyLink}
              active={copied}
              outlineIcon={<CiLink size={23} />}
              filledIcon={
                copied ? (
                  <Check size={18} strokeWidth={1.4} />
                ) : (
                  <FaLink size={15} />
                )
              }
              hoverColor="var(--public-primary)"
            />
          </div>

          {copied && (
            <div
              className="
                mt-2

                border-t
                border-black/[0.05]

                pt-2

                text-center

                text-[9px]
                uppercase
                tracking-[0.08em]

                text-[var(--public-primary)]
              "
            >
              Link copied
            </div>
          )}
        </div>
      )}
    </div>
  );
}
