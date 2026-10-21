"use client";

import { useState, type ReactNode } from "react";

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  variant?: "tabs" | "boxed-tabs" | "pills" | "link-tabs";
  defaultTabId?: string;
}

/** Replacement for data-tw-toggle="pill". */
export function Tabs({ tabs, variant = "tabs", defaultTabId }: TabsProps) {
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]?.id);
  const navClass = variant === "link-tabs" ? "nav-link-tabs" : `nav-${variant}`;
  return (
    <>
      <ul className={`nav ${navClass}`} role="tablist">
        {tabs.map((tab) => (
          <li key={tab.id} className="nav-item flex-1" role="presentation">
            <button
              type="button"
              id={`${tab.id}-tab`}
              className={`nav-link w-full py-2${activeId === tab.id ? " active" : ""}`}
              role="tab"
              aria-selected={activeId === tab.id}
              aria-controls={`${tab.id}-panel`}
              onClick={() => setActiveId(tab.id)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="tab-content mt-5">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`${tab.id}-panel`}
            className={`tab-pane leading-relaxed${activeId === tab.id ? " active" : ""}`}
            role="tabpanel"
            aria-labelledby={`${tab.id}-tab`}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </>
  );
}
