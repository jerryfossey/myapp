import { accentCssVars } from "@/lib/areaColors";

export default function SiloDot({ areaId, className = "" }: { areaId: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`silo-accent silo-dot inline-block h-2 w-2 shrink-0 rounded-full ${className}`}
      style={accentCssVars(areaId) as React.CSSProperties}
    />
  );
}
