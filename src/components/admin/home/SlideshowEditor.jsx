"use client";

import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  LoaderCircle,
  Trash2,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import MediaPicker from "@/components/admin/media/MediaPicker";

function emptyLocalized() {
  return {
    th: "",
    en: "",
  };
}

function createSlide(media, index) {
  return {
    id: crypto.randomUUID(),

    mediaId: media.id,

    media,

    sortOrder: index * 10,

    alt: {
      th: media?.alt?.th || "",
      en: media?.alt?.en || "",
    },

    caption: {
      th: media?.caption?.th || "",
      en: media?.caption?.en || "",
    },

    link: {
      enabled: false,
      url: null,
      newTab: false,
    },

    enabled: true,
  };
}

function normalizeItem(item) {
  if (!item) {
    return {
      name: emptyLocalized(),

      description: emptyLocalized(),

      slides: [],
    };
  }

  return {
    name: {
      th: item?.name?.th || "",
      en: item?.name?.en || "",
    },

    description: {
      th: item?.description?.th || "",
      en: item?.description?.en || "",
    },

    slides: Array.isArray(item?.slides)
      ? [...item.slides]
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
          .map((slide) => ({
            ...slide,

            alt: {
              th: slide?.alt?.th || "",
              en: slide?.alt?.en || "",
            },

            caption: {
              th: slide?.caption?.th || "",
              en: slide?.caption?.en || "",
            },

            link: {
              enabled: slide?.link?.enabled === true,

              url: slide?.link?.url || null,

              newTab: slide?.link?.newTab === true,
            },

            enabled: slide?.enabled !== false,
          }))
      : [],
  };
}

function preparePayload(form) {
  return {
    name: form.name,

    description: form.description,

    slides: form.slides.map((slide, index) => ({
      id: slide.id,

      mediaId: slide.mediaId,

      sortOrder: index * 10,

      alt: slide.alt,

      caption: slide.caption,

      link: {
        enabled: slide.link?.enabled === true,

        url: slide.link?.enabled && slide.link?.url ? slide.link.url : null,

        newTab: slide.link?.enabled === true && slide.link?.newTab === true,
      },

      enabled: slide.enabled !== false,
    })),
  };
}

export default function SlideshowEditor({
  open,
  companyId,
  item,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(() => normalizeItem(item));

  const [saving, setSaving] = useState(false);

  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setForm(normalizeItem(item));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [open, item]);

  if (!open) {
    return null;
  }

  function updateLocalized(field, language, value) {
    setForm((current) => ({
      ...current,

      [field]: {
        ...current[field],
        [language]: value,
      },
    }));
  }

  function updateSlide(index, updater) {
    setForm((current) => ({
      ...current,

      slides: current.slides.map((slide, slideIndex) =>
        slideIndex === index ? updater(slide) : slide,
      ),
    }));
  }

  function removeSlide(index) {
    setForm((current) => ({
      ...current,

      slides: current.slides.filter((_, slideIndex) => slideIndex !== index),
    }));
  }

  function moveSlide(index, direction) {
    setForm((current) => {
      const target = index + direction;

      if (target < 0 || target >= current.slides.length) {
        return current;
      }

      const slides = [...current.slides];

      [slides[index], slides[target]] = [slides[target], slides[index]];

      return {
        ...current,
        slides,
      };
    });
  }

  function handleMediaSelected(mediaItems) {
    const selected = Array.isArray(mediaItems) ? mediaItems : [];

    setForm((current) => {
      const existing = new Set(current.slides.map((slide) => slide.mediaId));

      const additions = selected
        .filter((media) => !existing.has(media.id))
        .map((media, index) =>
          createSlide(media, current.slides.length + index),
        );

      return {
        ...current,

        slides: [...current.slides, ...additions],
      };
    });
  }

  async function handleSave() {
    if (!form.name.th.trim() && !form.name.en.trim()) {
      toast.error("Please enter a slideshow name.");

      return;
    }

    try {
      setSaving(true);

      const editing = Boolean(item?.id);

      const url = editing
        ? `/api/v1/companies/${companyId}/home-slideshows/${item.id}`
        : `/api/v1/companies/${companyId}/home-slideshows`;

      const response = await fetch(url, {
        method: editing ? "PATCH" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify(preparePayload(form)),
      });

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || "Unable to save slideshow.");
      }

      toast.success(editing ? "Slideshow updated." : "Slideshow created.");

      await onSaved?.(payload.data);
    } catch (error) {
      console.error("Save slideshow:", error);

      toast.error(error.message || "Unable to save slideshow.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[150] flex justify-end">
        <button
          type="button"
          aria-label="Close editor"
          onClick={onClose}
          className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
        />

        <div className="relative z-10 flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
          <header className="flex h-20 shrink-0 items-center justify-between border-b border-neutral-200 px-5 sm:px-8">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-neutral-950">
                {item ? "Edit Slideshow" : "New Slideshow"}
              </h2>

              <p className="mt-1 text-xs text-neutral-400">
                Homepage slideshow content
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition hover:bg-neutral-100"
            >
              <X size={18} />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
            <section>
              <h3 className="text-sm font-semibold text-neutral-950">
                Information
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="text-xs font-medium text-neutral-600">
                    Name — Thai
                  </span>

                  <input
                    value={form.name.th}
                    onChange={(event) =>
                      updateLocalized("name", "th", event.target.value)
                    }
                    className="mt-2 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none transition focus:border-neutral-400"
                  />
                </label>

                <label>
                  <span className="text-xs font-medium text-neutral-600">
                    Name — English
                  </span>

                  <input
                    value={form.name.en}
                    onChange={(event) =>
                      updateLocalized("name", "en", event.target.value)
                    }
                    className="mt-2 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none transition focus:border-neutral-400"
                  />
                </label>
              </div>
            </section>

            <section className="mt-10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-950">
                    Slides
                  </h3>

                  <p className="mt-1 text-xs text-neutral-400">
                    {form.slides.length} images
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMediaPickerOpen(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 px-4 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
                >
                  <ImagePlus size={15} />
                  Add Media
                </button>
              </div>

              {form.slides.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setMediaPickerOpen(true)}
                  className="mt-5 flex min-h-48 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 text-neutral-400 transition hover:border-neutral-400 hover:text-neutral-600"
                >
                  <ImagePlus size={22} />

                  <span className="mt-3 text-sm font-medium">Add images</span>
                </button>
              ) : (
                <div className="mt-5 space-y-4">
                  {form.slides.map((slide, index) => (
                    <div
                      key={slide.id}
                      className="rounded-2xl border border-neutral-200 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-xs font-semibold text-neutral-500">
                          Slide {index + 1}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveSlide(index, -1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-25"
                          >
                            <ArrowUp size={14} />
                          </button>

                          <button
                            type="button"
                            disabled={index === form.slides.length - 1}
                            onClick={() => moveSlide(index, 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-25"
                          >
                            <ArrowDown size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeSlide(index)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label>
                          <span className="text-[11px] text-neutral-500">
                            Alt — Thai
                          </span>

                          <input
                            value={slide.alt?.th || ""}
                            onChange={(event) =>
                              updateSlide(index, (current) => ({
                                ...current,
                                alt: {
                                  ...current.alt,
                                  th: event.target.value,
                                },
                              }))
                            }
                            className="mt-2 h-10 w-full rounded-xl border border-neutral-200 px-3 text-xs outline-none focus:border-neutral-400"
                          />
                        </label>

                        <label>
                          <span className="text-[11px] text-neutral-500">
                            Alt — English
                          </span>

                          <input
                            value={slide.alt?.en || ""}
                            onChange={(event) =>
                              updateSlide(index, (current) => ({
                                ...current,
                                alt: {
                                  ...current.alt,
                                  en: event.target.value,
                                },
                              }))
                            }
                            className="mt-2 h-10 w-full rounded-xl border border-neutral-200 px-3 text-xs outline-none focus:border-neutral-400"
                          />
                        </label>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label>
                          <span className="text-[11px] text-neutral-500">
                            Caption — Thai
                          </span>

                          <input
                            value={slide.caption?.th || ""}
                            onChange={(event) =>
                              updateSlide(index, (current) => ({
                                ...current,
                                caption: {
                                  ...current.caption,
                                  th: event.target.value,
                                },
                              }))
                            }
                            className="mt-2 h-10 w-full rounded-xl border border-neutral-200 px-3 text-xs outline-none focus:border-neutral-400"
                          />
                        </label>

                        <label>
                          <span className="text-[11px] text-neutral-500">
                            Caption — English
                          </span>

                          <input
                            value={slide.caption?.en || ""}
                            onChange={(event) =>
                              updateSlide(index, (current) => ({
                                ...current,
                                caption: {
                                  ...current.caption,
                                  en: event.target.value,
                                },
                              }))
                            }
                            className="mt-2 h-10 w-full rounded-xl border border-neutral-200 px-3 text-xs outline-none focus:border-neutral-400"
                          />
                        </label>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-5 border-t border-neutral-100 pt-4">
                        <label className="flex items-center gap-2 text-xs text-neutral-600">
                          <input
                            type="checkbox"
                            checked={slide.enabled !== false}
                            onChange={(event) =>
                              updateSlide(index, (current) => ({
                                ...current,
                                enabled: event.target.checked,
                              }))
                            }
                          />
                          Active
                        </label>

                        <label className="flex items-center gap-2 text-xs text-neutral-600">
                          <input
                            type="checkbox"
                            checked={slide.link?.enabled === true}
                            onChange={(event) =>
                              updateSlide(index, (current) => ({
                                ...current,
                                link: {
                                  ...current.link,
                                  enabled: event.target.checked,
                                },
                              }))
                            }
                          />
                          Link
                        </label>
                      </div>

                      {slide.link?.enabled && (
                        <div className="mt-4 rounded-xl bg-neutral-50 p-4">
                          <label>
                            <span className="text-[11px] text-neutral-500">
                              URL
                            </span>

                            <input
                              value={slide.link?.url || ""}
                              onChange={(event) =>
                                updateSlide(index, (current) => ({
                                  ...current,
                                  link: {
                                    ...current.link,
                                    url: event.target.value,
                                  },
                                }))
                              }
                              placeholder="https://..."
                              className="mt-2 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none focus:border-neutral-400"
                            />
                          </label>

                          <label className="mt-3 flex items-center gap-2 text-xs text-neutral-600">
                            <input
                              type="checkbox"
                              checked={slide.link?.newTab === true}
                              onChange={(event) =>
                                updateSlide(index, (current) => ({
                                  ...current,
                                  link: {
                                    ...current.link,
                                    newTab: event.target.checked,
                                  },
                                }))
                              }
                            />
                            Open in new tab
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 bg-white px-5 py-4 sm:px-8">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 rounded-xl px-4 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-10 min-w-24 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving && <LoaderCircle size={15} className="animate-spin" />}

              {saving ? "Saving..." : "Save"}
            </button>
          </footer>
        </div>
      </div>

      <MediaPicker
        open={mediaPickerOpen}
        companyId={companyId}
        multiple
        selectedIds={form.slides.map((slide) => slide.mediaId)}
        onClose={() => setMediaPickerOpen(false)}
        onConfirm={handleMediaSelected}
      />
    </>
  );
}
