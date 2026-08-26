import "server-only";

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

function normalizeHost(hostname) {
  return String(hostname || "")
    .trim()
    .toLowerCase();
}

function createUrl(value) {
  try {
    return new URL(String(value || "").trim());
  } catch {
    return null;
  }
}

export function detectExternalMediaProvider(sourceUrl) {
  const url = createUrl(sourceUrl);

  if (!url) {
    return null;
  }

  const host = normalizeHost(url.hostname);

  if (YOUTUBE_HOSTS.has(host)) {
    return "youtube";
  }

  if (host === "vimeo.com" || host.endsWith(".vimeo.com")) {
    return "vimeo";
  }

  if (
    host === "facebook.com" ||
    host.endsWith(".facebook.com") ||
    host === "fb.watch"
  ) {
    return "facebook";
  }

  if (host === "instagram.com" || host.endsWith(".instagram.com")) {
    return "instagram";
  }

  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    return "tiktok";
  }

  return "other";
}

export function parseYouTubeVideoId(sourceUrl) {
  const url = createUrl(sourceUrl);

  if (!url) {
    return null;
  }

  const host = normalizeHost(url.hostname);

  let videoId = null;

  if (host === "youtu.be" || host === "www.youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] || null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    videoId = url.searchParams.get("v");

    if (!videoId) {
      const parts = url.pathname.split("/").filter(Boolean);

      const knownPrefixes = new Set(["shorts", "embed", "live"]);

      if (knownPrefixes.has(parts[0])) {
        videoId = parts[1] || null;
      }
    }
  }

  if (!videoId) {
    return null;
  }

  const normalizedId = String(videoId)
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "");

  if (normalizedId.length < 6 || normalizedId.length > 30) {
    return null;
  }

  return normalizedId;
}

function getYouTubeThumbnail(snippet) {
  const thumbnails = snippet?.thumbnails || {};

  return (
    thumbnails.maxres ||
    thumbnails.standard ||
    thumbnails.high ||
    thumbnails.medium ||
    thumbnails.default ||
    null
  );
}

async function fetchYouTubeOEmbed({ canonicalUrl }) {
  const endpoint = new URL("https://www.youtube.com/oembed");

  endpoint.searchParams.set("url", canonicalUrl);

  endpoint.searchParams.set("format", "json");

  const response = await fetch(endpoint.toString(), {
    headers: {
      Accept: "application/json",
    },

    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("EXTERNAL_MEDIA_NOT_FOUND");
    }

    throw new Error("EXTERNAL_MEDIA_FETCH_FAILED");
  }

  return response.json();
}

async function fetchYouTubeDataApi({ videoId }) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return null;
  }

  const endpoint = new URL("https://www.googleapis.com/youtube/v3/videos");

  endpoint.searchParams.set("part", "snippet,contentDetails");

  endpoint.searchParams.set("id", videoId);

  endpoint.searchParams.set("key", apiKey);

  const response = await fetch(endpoint.toString(), {
    headers: {
      Accept: "application/json",
    },

    cache: "no-store",
  });

  if (!response.ok) {
    console.error(
      "YouTube Data API error:",
      response.status,
      await response.text().catch(() => ""),
    );

    return null;
  }

  const payload = await response.json();

  return payload?.items?.[0] || null;
}

async function resolveYouTube(sourceUrl) {
  const videoId = parseYouTubeVideoId(sourceUrl);

  if (!videoId) {
    throw new Error("INVALID_YOUTUBE_URL");
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  const oEmbed = await fetchYouTubeOEmbed({
    canonicalUrl,
  });

  const apiData = await fetchYouTubeDataApi({
    videoId,
  });

  const snippet = apiData?.snippet || null;

  const contentDetails = apiData?.contentDetails || null;

  const apiThumbnail = getYouTubeThumbnail(snippet);

  return {
    provider: "youtube",

    externalId: videoId,

    canonicalUrl,

    embedUrl,

    metadata: {
      title: snippet?.title || oEmbed?.title || "",

      description: snippet?.description || "",

      authorName: snippet?.channelTitle || oEmbed?.author_name || "",

      authorUrl: oEmbed?.author_url || null,

      thumbnailUrl:
        apiThumbnail?.url ||
        oEmbed?.thumbnail_url ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,

      thumbnailWidth: apiThumbnail?.width || oEmbed?.thumbnail_width || null,

      thumbnailHeight: apiThumbnail?.height || oEmbed?.thumbnail_height || null,

      publishedAt: snippet?.publishedAt || null,

      duration: contentDetails?.duration || null,
    },
  };
}

export async function resolveExternalMedia({ sourceUrl }) {
  const url = createUrl(sourceUrl);

  if (!url || !["http:", "https:"].includes(url.protocol)) {
    throw new Error("INVALID_EXTERNAL_MEDIA_URL");
  }

  const provider = detectExternalMediaProvider(sourceUrl);

  if (provider === "youtube") {
    return resolveYouTube(sourceUrl);
  }

  throw new Error("EXTERNAL_MEDIA_PROVIDER_NOT_SUPPORTED");
}
