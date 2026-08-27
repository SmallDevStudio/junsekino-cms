"use client";

import { Check, Link2, Share2, X } from "lucide-react";

import { useEffect, useRef, useState } from "react";

export default function PublicProjectShare({ title }) {
  const [open, setOpen] = useState(false);

  const [copied, setCopied] = useState(false);

  const containerRef = useRef(null);

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

    document.addEventListener("pointerdown", handlePointerDown);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function getPageUrl() {
    return window.location.href;
  }

  function openShareUrl(url) {
    window.open(url, "_blank", "noopener,noreferrer,width=680,height=620");
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

  async function handleNativeShare() {
    if (!navigator.share) {
      return;
    }

    try {
      await navigator.share({
        title,
        url: getPageUrl(),
      });

      setOpen(false);
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Share error:", error);
      }
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getPageUrl());

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error("Copy link error:", error);
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
          flex
          h-9
          w-9
          items-center
          justify-center

          text-black/25

          transition-colors
          duration-200

          hover:text-black/65
        "
      >
        <Share2 size={17} strokeWidth={1.3} />
      </button>

      {open && (
        <div
          className="
            absolute
            right-0
            top-full
            z-[150]

            mt-2

            w-[210px]

            border
            border-black/[0.08]

            bg-[var(--public-background)]

            p-2

            shadow-[0_12px_35px_rgba(0,0,0,0.08)]
          "
        >
          <div
            className="
              flex
              items-center
              justify-between

              px-2
              pb-2
              pt-1
            "
          >
            <span
              className="
                text-[9px]
                uppercase
                tracking-[0.09em]
                text-black/35
              "
            >
              Share Project
            </span>

            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="
                text-black/20
                transition-colors
                hover:text-black/55
              "
            >
              <X size={13} strokeWidth={1.2} />
            </button>
          </div>

          <div
            className="
              border-t
              border-black/[0.06]
              pt-1
            "
          >
            {typeof navigator !== "undefined" && navigator.share && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="
                    flex
                    w-full
                    items-center

                    px-2
                    py-2.5

                    text-left
                    text-[11px]
                    text-black/45

                    transition-colors

                    hover:text-[var(--public-primary)]
                  "
              >
                Share...
              </button>
            )}

            <button
              type="button"
              onClick={handleFacebook}
              className="
                w-full
                px-2
                py-2.5

                text-left
                text-[11px]
                text-black/45

                transition-colors

                hover:text-[var(--public-primary)]
              "
            >
              Facebook
            </button>

            <button
              type="button"
              onClick={handleX}
              className="
                w-full
                px-2
                py-2.5

                text-left
                text-[11px]
                text-black/45

                transition-colors

                hover:text-[var(--public-primary)]
              "
            >
              X
            </button>

            <button
              type="button"
              onClick={handleLinkedIn}
              className="
                w-full
                px-2
                py-2.5

                text-left
                text-[11px]
                text-black/45

                transition-colors

                hover:text-[var(--public-primary)]
              "
            >
              LinkedIn
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="
                mt-1

                flex
                w-full
                items-center
                justify-between

                border-t
                border-black/[0.06]

                px-2
                pb-2
                pt-3

                text-[11px]
                text-black/45

                transition-colors

                hover:text-[var(--public-primary)]
              "
            >
              <span>{copied ? "Copied" : "Copy Link"}</span>

              {copied ? (
                <Check
                  size={13}
                  strokeWidth={1.3}
                  style={{
                    color: "var(--public-primary)",
                  }}
                />
              ) : (
                <Link2 size={13} strokeWidth={1.3} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
