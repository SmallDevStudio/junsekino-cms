"use client";

function isImageTarget(target) {
  return target instanceof Element && Boolean(target.closest("img"));
}

export default function PublicImageProtection({ children }) {
  function handleContextMenu(event) {
    if (isImageTarget(event.target)) {
      event.preventDefault();
    }
  }

  function handleDragStart(event) {
    if (isImageTarget(event.target)) {
      event.preventDefault();
    }
  }

  return (
    <div
      onContextMenuCapture={handleContextMenu}
      onDragStartCapture={handleDragStart}
      className="
        contents

        [&_img]:select-none
        [&_img]:[-webkit-touch-callout:none]
        [&_img]:[-webkit-user-drag:none]
      "
    >
      {children}
    </div>
  );
}
