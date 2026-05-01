import React from "react";
import { cn } from "../../lib/utils";

// ── SidebarGroup ─────────────────────────────────────────────────────────────
// Wraps a labeled section within the sidebar nav
export function SidebarGroup({ children, className }) {
  return <div className={cn("", className)}>{children}</div>;
}

// ── SidebarGroupLabel ────────────────────────────────────────────────────────
// Small all-caps section heading (e.g. "Services", "My Account")
export function SidebarGroupLabel({ children, className }) {
  return (
    <p
      className={cn(
        "px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest select-none",
        "text-[hsl(var(--sidebar-foreground)/0.45)]",
        className,
      )}>
      {children}
    </p>
  );
}

// ── SidebarMenu ──────────────────────────────────────────────────────────────
// Vertical list container for menu items
export function SidebarMenu({ children, className }) {
  return (
    <ul className={cn("m-0 list-none flex flex-col gap-0.5 p-0", className)}>
      {children}
    </ul>
  );
}

// ── SidebarMenuItem ──────────────────────────────────────────────────────────
// Single list item wrapper
export function SidebarMenuItem({ children, className }) {
  return <li className={cn("", className)}>{children}</li>;
}

// ── SidebarMenuButton ────────────────────────────────────────────────────────
// Clickable nav item — renders a <button> by default or an <a> when href is provided.
// Props:
//   isActive  — highlights the button as the current page
//   href      — renders as an anchor tag
//   external  — adds target="_blank" rel="noopener noreferrer" when using href
export function SidebarMenuButton({
  children,
  isActive,
  onClick,
  href,
  external,
  className,
  ...props
}) {
  const base = cn(
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium",
    "transition-all duration-150",
    "focus:outline-none focus-visible:ring-1 focus-visible:ring-white/25",
    "text-start",
    isActive
      ? "bg-[hsl(var(--sidebar-active))] text-white shadow-sm"
      : [
          "text-[hsl(var(--sidebar-foreground))]",
          "hover:bg-white/[0.07] hover:text-white",
        ],
    className,
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={base}
        {...props}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={base} {...props}>
      {children}
    </button>
  );
}

// ── SidebarMenuBadge ─────────────────────────────────────────────────────────
// Small count badge pinned to the end of a menu button (e.g. pending count)
// variant: "pending" (amber) | "info" (white/translucent)
export function SidebarMenuBadge({ children, variant = "pending", className }) {
  return (
    <span
      className={cn(
        "ms-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5",
        "text-[10px] font-bold tabular-nums leading-none",
        variant === "pending"
          ? "bg-amber-500/90 text-white"
          : "bg-white/20 text-white",
        className,
      )}>
      {children}
    </span>
  );
}

// ── SidebarSeparator ─────────────────────────────────────────────────────────
// Thin horizontal rule between sidebar groups
export function SidebarSeparator({ className }) {
  return (
    <div
      className={cn(
        "mx-3 my-1 h-px bg-[hsl(var(--sidebar-foreground)/0.12)]",
        className,
      )}
    />
  );
}
