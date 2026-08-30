"use client";

import { useEffect, useRef, useState } from "react";

import { Eye, Heart } from "lucide-react";

import PublicContentShare from "./PublicContentShare";

import { getPublicVisitorId } from "@/utils/public-visitor";

function normalizeCount(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return Math.floor(number);
}

function formatNumber(value) {
  const number = normalizeCount(value);

  return new Intl.NumberFormat("en-US", {
    notation: number >= 10000 ? "compact" : "standard",

    maximumFractionDigits: 1,
  }).format(number);
}

export default function PublicContentEngagement({
  companySlug,
  slug,
  title,

  initialViews = 0,
  initialLikes = 0,

  trackView = false,
  interactiveLike = false,

  showShare = true,
}) {
  const [engagement, setEngagement] = useState({
    views: normalizeCount(initialViews),

    likes: normalizeCount(initialLikes),
  });

  const [liked, setLiked] = useState(false);

  const [likeLoading, setLikeLoading] = useState(false);

  const visitorRef = useRef(null);

  const viewRequestedRef = useRef(false);

  function resolveVisitor() {
    if (visitorRef.current) {
      return visitorRef.current;
    }

    const visitorId = getPublicVisitorId();

    visitorRef.current = visitorId;

    return visitorId;
  }

  function engagementEndpoint() {
    return `/api/public/v1/companies/${encodeURIComponent(
      companySlug,
    )}/public-contents/${encodeURIComponent(slug)}/engagement`;
  }

  /*
   * =======================================================
   * VIEW TRACKING
   * =======================================================
   */

  useEffect(() => {
    if (!trackView || viewRequestedRef.current) {
      return;
    }

    viewRequestedRef.current = true;

    const visitorId = getPublicVisitorId();

    visitorRef.current = visitorId;

    if (!visitorId) {
      return;
    }

    let active = true;

    fetch(
      `/api/public/v1/companies/${encodeURIComponent(
        companySlug,
      )}/public-contents/${encodeURIComponent(slug)}/engagement`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          action: "view",

          visitorId,
        }),

        cache: "no-store",
      },
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("VIEW_REQUEST_FAILED");
        }

        return response.json();
      })
      .then((payload) => {
        if (!active || !payload?.success || !payload?.data) {
          return;
        }

        const data = payload.data;

        setEngagement({
          views: normalizeCount(data.engagement?.views),

          likes: normalizeCount(data.engagement?.likes),
        });

        setLiked(data.liked === true);
      })
      .catch((error) => {
        console.error("Public content view error:", error);
      });

    return () => {
      active = false;
    };
  }, [companySlug, slug, trackView]);

  /*
   * =======================================================
   * LIKE
   * =======================================================
   */

  async function handleLike() {
    if (!interactiveLike || likeLoading) {
      return;
    }

    const visitorId = resolveVisitor();

    if (!visitorId) {
      return;
    }

    setLikeLoading(true);

    try {
      const response = await fetch(engagementEndpoint(), {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          action: "like",

          visitorId,
        }),

        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("LIKE_REQUEST_FAILED");
      }

      const payload = await response.json();

      if (!payload?.success || !payload?.data) {
        return;
      }

      const data = payload.data;

      setEngagement({
        views: normalizeCount(data.engagement?.views),

        likes: normalizeCount(data.engagement?.likes),
      });

      setLiked(data.liked === true);
    } catch (error) {
      console.error("Public content like error:", error);
    } finally {
      setLikeLoading(false);
    }
  }

  return (
    <div
      className="
        flex
        flex-wrap
        items-center
        gap-2
      "
    >
      {/* LIKE */}

      {interactiveLike ? (
        <button
          type="button"
          aria-label={liked ? "Unlike content" : "Like content"}
          aria-pressed={liked}
          disabled={likeLoading}
          onClick={handleLike}
          className="
            group
            inline-flex
            h-8
            items-center
            gap-1.5

            rounded-full
            border
            border-black/10
            bg-white

            px-3

            text-[10px]
            font-medium
            text-black/55

            shadow-[0_1px_2px_rgba(0,0,0,0.04)]

            transition-all
            duration-200

            hover:border-[var(--public-primary)]
            hover:text-[var(--public-primary)]

            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-[var(--public-primary)]

            disabled:cursor-wait
            disabled:opacity-50
          "
        >
          <Heart
            size={15}
            strokeWidth={1.25}
            fill={liked ? "currentColor" : "none"}
            className="
              text-[var(--public-primary)]

              transition-transform
              duration-200

              group-hover:scale-110
            "
          />

          <span>{formatNumber(engagement.likes)}</span>
        </button>
      ) : (
        <div
          className="
            inline-flex
            h-8
            items-center
            gap-1.5

            rounded-full
            border
            border-black/10
            bg-white

            px-3

            text-[10px]
            font-medium
            text-black/55

            shadow-[0_1px_2px_rgba(0,0,0,0.04)]
          "
        >
          <Heart
            size={15}
            strokeWidth={1.25}
            className="text-[var(--public-primary)]"
          />

          <span>{formatNumber(engagement.likes)}</span>
        </div>
      )}

      {/* VIEW */}

      <div
        className="
          inline-flex
          h-8
          items-center
          gap-1.5

          rounded-full
          border
          border-black/10
          bg-white

          px-3

          text-[10px]
          font-medium
          text-black/55

          shadow-[0_1px_2px_rgba(0,0,0,0.04)]
        "
      >
        <Eye
          size={15}
          strokeWidth={1.25}
          className="text-[var(--public-primary)]"
        />

        <span>{formatNumber(engagement.views)} views</span>
      </div>

      {/* SHARE */}

      {showShare && (
        <PublicContentShare
          companySlug={companySlug}
          slug={slug}
          title={title}
        />
      )}
    </div>
  );
}
