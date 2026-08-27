"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CiSearch } from "react-icons/ci";
import { IoCloseOutline } from "react-icons/io5";

export default function PublicProjectSearch({
  companySlug,
  initialQuery = "",
}) {
  const router = useRouter();
  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open]);

  function closeSearch() {
    setValue(initialQuery);
    setOpen(false);
  }

  function submitSearch(event) {
    event.preventDefault();

    const query = value.trim();

    setOpen(false);

    if (!query) {
      router.push(`/${companySlug}/project`);
      return;
    }

    router.push(
      `/${companySlug}/project?q=${encodeURIComponent(query)}`,
    );
  }

  function clearSearch() {
    setValue("");
    setOpen(false);
    router.push(`/${companySlug}/project`);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      closeSearch();
    }
  }

  if (!open) {
    return (
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          aria-label="Search projects"
          title="Search projects"
          onClick={() => setOpen(true)}
          className="
            inline-flex
            h-8
            w-8
            items-center
            justify-center

            text-black/30

            transition-colors
            duration-300

            hover:text-[var(--public-primary)]
            focus-visible:text-[var(--public-primary)]
            focus-visible:outline-none
          "
        >
          <CiSearch
            aria-hidden="true"
            className="h-[22px] w-[22px]"
          />
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submitSearch}
      className="
        flex
        min-w-0
        flex-1
        items-center
        justify-end

        sm:flex-none
      "
    >
      <div
        className="
          flex
          w-full
          max-w-[250px]
          items-center
          gap-2

          border-b
          border-black/15

          transition-colors
          duration-300

          focus-within:border-[var(--public-primary)]

          sm:w-[250px]
          lg:w-[290px]
          lg:max-w-[290px]
        "
      >
        <CiSearch
          aria-hidden="true"
          className="h-[19px] w-[19px] shrink-0 text-black/25"
        />

        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search projects"
          aria-label="Search projects"
          className="
            min-w-0
            flex-1
            bg-transparent
            py-1.5

            text-[10px]
            font-normal
            tracking-[0.04em]
            text-black/70

            outline-none

            placeholder:text-black/25

            sm:text-[11px]
          "
        />

        <button
          type="button"
          aria-label="Close search"
          title="Close search"
          onClick={closeSearch}
          className="
            inline-flex
            h-7
            w-7
            shrink-0
            items-center
            justify-center

            text-black/25

            transition-colors
            duration-300

            hover:text-[var(--public-primary)]
            focus-visible:text-[var(--public-primary)]
            focus-visible:outline-none
          "
        >
          <IoCloseOutline
            aria-hidden="true"
            className="h-[18px] w-[18px]"
          />
        </button>
      </div>

      {initialQuery ? (
        <button
          type="button"
          onClick={clearSearch}
          className="sr-only"
        >
          Clear current search
        </button>
      ) : null}
    </form>
  );
}
