"use client";

import type { ComponentProps } from "react";

// Panel con la Popover API nativa (abre con <button popoverTarget={id}>, cierra con Esc o clic afuera).
// Única lógica en JS: cerrarse al navegar, porque la navegación de Next no recarga la página.
export function Popover({ id, ...props }: ComponentProps<"div"> & { id: string }) {
  return (
    <div
      id={id}
      popover="auto"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) e.currentTarget.hidePopover();
      }}
      onSubmit={(e) => e.currentTarget.hidePopover()}
      {...props}
    />
  );
}
