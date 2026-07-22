export function Tooltip({ label }: { label: string }) {
  return (
    <span className="group relative inline-flex cursor-help items-center border-b border-dotted border-secondary text-secondary" tabIndex={0} aria-label={label}>
      ?
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 border border-hairline bg-background p-3 text-xs normal-case tracking-normal text-primary group-hover:block group-focus:block">
        {label}
      </span>
    </span>
  );
}
