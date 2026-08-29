import React from "react";

/**
 * EthicX (EIX) logo mark — the brand icon used to represent EIX,
 * replacing the generic coin symbol.
 */
export function EixLogo({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}images/eix-logo.png`}
      alt="EthicX"
      style={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }}
      className={className}
    />
  );
}
