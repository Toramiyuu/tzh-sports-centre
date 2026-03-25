"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import Link from "next/link";
import { X } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(CustomEase);
}

export interface KineticNavLink {
  label: string;
  href: string;
}

interface KineticNavOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  links: KineticNavLink[];
  footer?: React.ReactNode;
}

export function KineticNavOverlay({ isOpen, onClose, links, footer }: KineticNavOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Shape hover effects — run once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      CustomEase.create("main", "0.65, 0.01, 0.05, 0.99");
      gsap.defaults({ ease: "main", duration: 0.7 });
    } catch {
      gsap.defaults({ ease: "power2.out", duration: 0.7 });
    }

    const ctx = gsap.context(() => {
      const menuItems = containerRef.current!.querySelectorAll(".menu-list-item[data-shape]");
      const shapesContainer = containerRef.current!.querySelector(".ambient-background-shapes");

      menuItems.forEach((item) => {
        const shapeIndex = item.getAttribute("data-shape");
        const shape = shapesContainer?.querySelector(`.bg-shape-${shapeIndex}`);
        if (!shape) return;
        const shapeEls = shape.querySelectorAll(".shape-element");

        const onEnter = () => {
          shapesContainer?.querySelectorAll(".bg-shape").forEach((s) => s.classList.remove("active"));
          shape.classList.add("active");
          gsap.fromTo(
            shapeEls,
            { scale: 0.5, opacity: 0, rotation: -10 },
            { scale: 1, opacity: 1, rotation: 0, duration: 0.6, stagger: 0.08, ease: "back.out(1.7)", overwrite: "auto" }
          );
        };
        const onLeave = () => {
          gsap.to(shapeEls, {
            scale: 0.8, opacity: 0, duration: 0.3, ease: "power2.in",
            onComplete: () => shape.classList.remove("active"),
            overwrite: "auto",
          });
        };

        item.addEventListener("mouseenter", onEnter);
        item.addEventListener("mouseleave", onLeave);
        (item as Element & { _cleanup?: () => void })._cleanup = () => {
          item.removeEventListener("mouseenter", onEnter);
          item.removeEventListener("mouseleave", onLeave);
        };
      });
    }, containerRef);

    const container = containerRef.current;
    return () => {
      ctx.revert();
      container?.querySelectorAll(".menu-list-item[data-shape]").forEach((el) => {
        (el as Element & { _cleanup?: () => void })._cleanup?.();
      });
    };
  }, []);

  // Open / close animation
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  useEffect(() => {
    if (!containerRef.current) return;

    tlRef.current?.kill();

    const navWrap = containerRef.current.querySelector(".nav-overlay-wrapper");
    const overlay = containerRef.current.querySelector(".overlay");
    const bgPanels = containerRef.current.querySelectorAll(".backdrop-layer");
    const menuLinks = containerRef.current.querySelectorAll(".nav-link");
    const fadeTargets = containerRef.current.querySelectorAll("[data-menu-fade]");
    const tl = gsap.timeline();
    tlRef.current = tl;

    if (isOpen) {
      navWrap?.setAttribute("data-nav", "open");
      tl.set(navWrap, { display: "block" })
        .fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1 }, "<")
        .fromTo(bgPanels, { xPercent: 101 }, { xPercent: 0, stagger: 0.12, duration: 0.575 }, "<")
        .fromTo(menuLinks, { yPercent: 140, rotate: 10 }, { yPercent: 0, rotate: 0, stagger: 0.06 }, "<+=0.32");
      if (fadeTargets.length) {
        tl.fromTo(fadeTargets, { autoAlpha: 0, yPercent: 40 }, { autoAlpha: 1, yPercent: 0, stagger: 0.04, clearProps: "all" }, "<+=0.1");
      }
    } else {
      navWrap?.setAttribute("data-nav", "closed");
      tl.to(menuLinks, { yPercent: 140, rotate: 10, stagger: { each: 0.05, from: "end" }, duration: 0.4 });
      if (fadeTargets.length) {
        tl.to(fadeTargets, { autoAlpha: 0, yPercent: 20, duration: 0.25 }, "<");
      }
      tl.to(overlay, { autoAlpha: 0, duration: 0.35 }, "<+=0.1")
        .to(bgPanels, { xPercent: 101, stagger: { each: 0.1, from: "end" }, duration: 0.45 }, "<")
        .set(navWrap, { display: "none" });
    }

    return () => { tl.kill(); };
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <div ref={containerRef}>
      <div data-nav="closed" className="nav-overlay-wrapper">
        {/* Dark backdrop — clicking closes the menu */}
        <div className="overlay" onClick={onClose} />

        <nav className="menu-content">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-20 p-2 rounded-full text-foreground/50 hover:text-foreground hover:bg-foreground/8 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Animated background */}
          <div className="menu-bg">
            <div className="backdrop-layer first" />
            <div className="backdrop-layer second" />
            <div className="backdrop-layer" />

            <div className="ambient-background-shapes">
              {/* Shape 1: Floating circles */}
              <svg className="bg-shape bg-shape-1" viewBox="0 0 400 400" fill="none">
                <circle className="shape-element" cx="80" cy="120" r="40" fill="rgba(24,84,214,0.12)" />
                <circle className="shape-element" cx="300" cy="80" r="60" fill="rgba(24,84,214,0.07)" />
                <circle className="shape-element" cx="200" cy="300" r="80" fill="rgba(59,130,246,0.07)" />
                <circle className="shape-element" cx="350" cy="280" r="30" fill="rgba(24,84,214,0.10)" />
              </svg>

              {/* Shape 2: Wave */}
              <svg className="bg-shape bg-shape-2" viewBox="0 0 400 400" fill="none">
                <path className="shape-element" d="M0 200 Q100 100, 200 200 T 400 200" stroke="rgba(24,84,214,0.14)" strokeWidth="60" fill="none" />
                <path className="shape-element" d="M0 280 Q100 180, 200 280 T 400 280" stroke="rgba(59,130,246,0.09)" strokeWidth="40" fill="none" />
              </svg>

              {/* Shape 3: Grid dots */}
              <svg className="bg-shape bg-shape-3" viewBox="0 0 400 400" fill="none">
                {([50, 150, 250, 350] as number[]).flatMap((x) =>
                  ([50, 150, 250, 350] as number[]).map((y) => (
                    <circle key={`${x}-${y}`} className="shape-element" cx={x} cy={y} r="8" fill="rgba(24,84,214,0.18)" />
                  ))
                )}
              </svg>

              {/* Shape 4: Organic blobs */}
              <svg className="bg-shape bg-shape-4" viewBox="0 0 400 400" fill="none">
                <path className="shape-element" d="M100 100 Q150 50, 200 100 Q250 150, 200 200 Q150 250, 100 200 Q50 150, 100 100" fill="rgba(24,84,214,0.09)" />
                <path className="shape-element" d="M250 200 Q300 150, 350 200 Q400 250, 350 300 Q300 350, 250 300 Q200 250, 250 200" fill="rgba(59,130,246,0.07)" />
              </svg>

              {/* Shape 5: Diagonal lines */}
              <svg className="bg-shape bg-shape-5" viewBox="0 0 400 400" fill="none">
                <line className="shape-element" x1="0" y1="100" x2="300" y2="400" stroke="rgba(24,84,214,0.10)" strokeWidth="30" />
                <line className="shape-element" x1="100" y1="0" x2="400" y2="300" stroke="rgba(59,130,246,0.08)" strokeWidth="25" />
                <line className="shape-element" x1="200" y1="0" x2="400" y2="200" stroke="rgba(24,84,214,0.06)" strokeWidth="20" />
              </svg>
            </div>
          </div>

          {/* Nav links */}
          <div className="menu-content-wrapper">
            <ul className="menu-list">
              {links.map((link, i) => (
                <li key={link.href} className="menu-list-item" data-shape={String((i % 5) + 1)}>
                  <Link href={link.href} className="nav-link" onClick={onClose}>
                    <p className="nav-link-text">{link.label}</p>
                    <div className="nav-link-hover-bg" />
                  </Link>
                </li>
              ))}
            </ul>

            {footer && (
              <div data-menu-fade className="mt-10 pt-8 border-t border-foreground/10">
                {footer}
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
