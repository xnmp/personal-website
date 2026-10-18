"use client";

import { useLayoutEffect, useRef } from "react";
import { listEnterEdit } from "@/lib/studio/list-continuation";

/** A native control: the browser owns selection, clipboard, newlines and history. */
export function SourceTextarea({ value, label, readOnly, inline, onChange, onActiveChange }: {
  value: string; label: string; readOnly: boolean; inline?: boolean;
  onChange: (value: string) => void; onActiveChange: (active: boolean) => void;
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  const snapshot = useRef(value);
  useLayoutEffect(() => {
    const control = input.current;
    if (!control || CSS.supports("field-sizing", "content")) return;
    control.style.height = "auto";
    control.style.height = `${control.scrollHeight}px`;
  }, [value]);
  return <textarea ref={input} className="studio-input" aria-label={label} autoFocus
    value={value} readOnly={readOnly} rows={1} spellCheck
    onChange={event => onChange(event.currentTarget.value)}
    onFocus={() => { snapshot.current = value; onActiveChange(true); }}
    onBlur={() => onActiveChange(false)}
    onKeyDown={event => {
      if (event.defaultPrevented || event.nativeEvent.isComposing) return;
      if (event.key === "Escape") {
        event.preventDefault(); onChange(snapshot.current); event.currentTarget.blur();
      } else if (event.key === "Enter" && inline && !event.ctrlKey && !event.metaKey) {
        event.preventDefault(); event.currentTarget.blur();
      } else if (event.key === "Enter" && !readOnly && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
        const control = event.currentTarget;
        const { selectionStart, selectionEnd, selectionDirection } = control;
        const edit = listEnterEdit(control.value, selectionStart, selectionEnd);
        if (!edit) return;
        control.setSelectionRange(edit.start, edit.end);
        // Native commands preserve the browser's undo history and emit input events.
        // If unsupported, restore selection and let ordinary Enter proceed.
        if (control.ownerDocument.execCommand("insertText", false, edit.text)) event.preventDefault();
        else control.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
      }
    }} />;
}
