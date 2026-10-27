import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { usePortal } from "../context/PortalContext";

export function Breadcrumb({ title, subtitle, items = [], actions }) {
  const { navigate } = usePortal();

  return (
    <div className="mb-6 space-y-2">
      {/* Breadcrumb row */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Home className="size-3.5" />
              <span>Dashboard</span>
            </button>
          </li>
          {items.map((item, idx) => (
            <li key={idx} className="flex items-center gap-1.5">
              <ChevronRight className="size-3.5 text-muted-foreground/60" />
              {item.href ? (
                <button
                  onClick={() => navigate(item.href)}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </button>
              ) : (
                <span className="text-foreground font-medium">{item.label}</span>
              )}
            </li>
          ))}
          {!items.length && (
            <li className="flex items-center gap-1.5">
              <ChevronRight className="size-3.5 text-muted-foreground/60" />
              <span className="text-foreground font-medium">{title}</span>
            </li>
          )}
        </ol>
      </nav>

      {/* Title & subtitle + actions row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
