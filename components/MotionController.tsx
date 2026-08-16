"use client";
import { useEffect } from "react";
export default function MotionController() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("motion-ready");
    const targets = document.querySelectorAll(
      "main section:not(:first-child), .process-card, .bento-card, .audience-card, .lifecycle-step, .faq-card",
    );
    targets.forEach((el, i) => {
      el.setAttribute("data-reveal", "");
      if (el.parentElement)
        el.setAttribute(
          "style",
          `${el.getAttribute("style") || ""};--reveal-delay:${Math.min(i % 4, 3) * 80}ms`,
        );
    });
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -40px" },
    );
    targets.forEach((el) => observer.observe(el));
    const hero = document.querySelector<HTMLElement>(".hero-cyber");
    const move = (e: PointerEvent) => {
      if (!hero) return;
      const r = hero.getBoundingClientRect();
      hero.style.setProperty(
        "--mx",
        `${((e.clientX - r.left) / r.width - 0.5) * 18}px`,
      );
      hero.style.setProperty(
        "--my",
        `${((e.clientY - r.top) / r.height - 0.5) * 18}px`,
      );
    };
    hero?.addEventListener("pointermove", move);
    return () => {
      observer.disconnect();
      hero?.removeEventListener("pointermove", move);
      root.classList.remove("motion-ready");
    };
  }, []);
  return null;
}
