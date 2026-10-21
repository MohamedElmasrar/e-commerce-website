"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

interface AccordionItemProps {
  title: ReactNode;
  children: ReactNode;
  open: boolean;
  onToggle: () => void;
  id: string;
}

function AccordionItem({ title, children, open, onToggle, id }: AccordionItemProps) {
  return (
    <div className="accordion-item">
      <div className="accordion-header" id={`${id}-header`}>
        <button
          type="button"
          className={`accordion-button${open ? "" : " collapsed"}`}
          aria-expanded={open}
          aria-controls={`${id}-body`}
          onClick={onToggle}
        >
          {title}
        </button>
      </div>
      <div id={`${id}-body`} className={`accordion-collapse collapse${open ? " show" : ""}`} aria-labelledby={`${id}-header`}>
        <div className="accordion-body leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export interface AccordionEntry {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

/** Replacement for data-tw-toggle="collapse" with data-tw-parent (single open item). */
export function Accordion({ items, defaultOpenId }: { items: AccordionEntry[]; defaultOpenId?: string }) {
  const [openId, setOpenId] = useState<string | undefined>(defaultOpenId);
  return (
    <div className="accordion">
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          id={item.id}
          title={item.title}
          open={openId === item.id}
          onToggle={() => setOpenId(openId === item.id ? undefined : item.id)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}

/** Single collapsible region with its own toggle. */
export function Collapse({ title, children, defaultOpen = false }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button type="button" className="flex items-center w-full" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="mr-auto text-left">{title}</span>
        <ChevronDown className={`w-4 h-4 transform${open ? " rotate-180" : ""}`} />
      </button>
      {open ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}
