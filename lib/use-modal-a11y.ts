"use client";

import { useEffect, useRef } from "react";

/**
 * Shared accessibility behaviour for dialogs.
 *
 * Every modal in the app is a plain `<div class="fixed inset-0">` overlay, which
 * sighted mouse users can operate but keyboard and screen-reader users cannot:
 * without this, Tab walks out of the dialog into the page behind it, Escape does
 * nothing, and focus is left wherever it was when the dialog closed.
 *
 * Attach the returned ref to the dialog's own container (the panel, not the
 * backdrop) and give that element `tabIndex={-1}`:
 *
 *   const dialogRef = useModalA11y(open, () => setOpen(false));
 *   <form ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" …>
 *
 * Behaviour: focus moves into the dialog on open, Tab and Shift+Tab cycle within
 * it, Escape closes, the page behind cannot scroll, and focus returns to the
 * control that opened it.
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useModalA11y<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  onClose: () => void,
) {
  const containerRef = useRef<T | null>(null);
  // The latest handler lives in a ref so a fresh inline arrow function from the
  // parent does NOT re-run the effect below — otherwise focus would be yanked
  // back to the first field on every keystroke.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    // Read the ref through a helper rather than capturing it: the keydown
    // handler is a hoisted declaration, so TypeScript cannot keep the
    // "already checked for null" narrowing across it.
    const dialog = () => containerRef.current;
    const node = dialog();
    if (!node) return;

    const previouslyFocused =
      typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;

    const focusable = (root: HTMLElement) =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null || element === root,
      );

    const first = focusable(node)[0];
    (first ?? node).focus();

    function onKeyDown(event: KeyboardEvent) {
      const root = dialog();
      if (!root) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusable(root);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      // Wrap at the ends, and pull focus back in if it has escaped the dialog.
      if (event.shiftKey && (active === firstItem || !root.contains(active))) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && (active === lastItem || !root.contains(active))) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  return containerRef;
}
