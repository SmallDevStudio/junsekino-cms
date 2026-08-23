import "server-only";

import crypto from "node:crypto";

import sharp from "sharp";

import { MEDIA_VARIANTS } from "@/constants/media";

import { getMediaBucket } from "@/lib/firebase/storage";

function calculateSha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function createWebpVariant({
  originalBuffer,
  companyId,
  mediaId,
  variant,
}) {
  const outputBuffer = await sharp(originalBuffer)
    .rotate()
    .resize({
      width: variant.width,

      withoutEnlargement: true,

      fit: "inside",
    })
    .webp({
      quality: variant.quality,

      effort: 4,
    })
    .toBuffer();

  const metadata = await sharp(outputBuffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("MEDIA_VARIANT_PROCESSING_FAILED");
  }

  const storagePath = `companies/${companyId}/derivatives/${mediaId}/${variant.key}.webp`;

  const bucket = getMediaBucket();

  const file = bucket.file(storagePath);

  await file.save(outputBuffer, {
    resumable: false,

    metadata: {
      contentType: "image/webp",

      cacheControl: "public,max-age=31536000,immutable",

      metadata: {
        mediaId,

        companyId,

        variant: variant.key,
      },
    },
  });

  const [storageMetadata] = await file.getMetadata();

  return {
    key: variant.key,

    width: metadata.width,

    height: metadata.height,

    size: outputBuffer.length,

    mimeType: "image/webp",

    format: "webp",

    storagePath,

    checksum: calculateSha256(outputBuffer),

    storageGeneration: storageMetadata.generation || null,
  };
}

export async function processMediaImage({
  companyId,
  mediaId,
  originalBuffer,
}) {
  const image = sharp(originalBuffer);

  const originalMetadata = await image.metadata();

  if (!originalMetadata.width || !originalMetadata.height) {
    throw new Error("MEDIA_INVALID_IMAGE");
  }

  const variants = {};

  for (const variant of Object.values(MEDIA_VARIANTS)) {
    const processed = await createWebpVariant({
      originalBuffer,
      companyId,
      mediaId,
      variant,
    });

    variants[variant.key] = processed;
  }

  return {
    original: {
      width: originalMetadata.width,

      height: originalMetadata.height,

      format: originalMetadata.format || null,

      orientation: originalMetadata.orientation || null,
    },

    variants,
  };
}
