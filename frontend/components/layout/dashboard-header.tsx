"use client";

export function DashboardTopHeader({
  userName,
  roleLabel = "User",
  searchPlaceholder = "Хайх...",
}: {
  userName: string;
  roleLabel?: string;
  searchPlaceholder?: string;
}) {
  return (
    <header className="sticky top-0 z-20 flex flex-col gap-4 rounded-none bg-surface/80 px-5 py-4 shadow-sm backdrop-blur-md md:flex-row md:items-center md:justify-between md:px-8">
      <div className="relative max-w-md flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]"><circle cx="11" cy="11" r="6" /><path d="m20 20-4-4" /></svg>
        </span>
        <input
          className="h-11 w-full rounded-full border-none bg-surface-container-low pl-10 pr-4 text-sm text-on-surface focus:ring-0 focus:bg-surface-container-lowest focus:shadow-ambient transition-all"
          placeholder={searchPlaceholder}
          type="text"
          aria-label={searchPlaceholder}
        />
      </div>
      <div className="flex items-center gap-4 self-end md:self-auto">
        <button className="text-sm font-medium text-surface-500 transition-colors hover:text-secondary">MN/EN</button>
        <button className="text-surface-500 transition-colors hover:text-secondary" aria-label="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[18px] w-[18px]"><path d="M12 3a5 5 0 0 0-5 5v3.8L5.5 14a1 1 0 0 0 .7 1.7h11.6a1 1 0 0 0 .7-1.7L17 11.8V8a5 5 0 0 0-5-5Z" /><path d="M10 18a2 2 0 0 0 4 0" /></svg>
        </button>
        <div className="flex items-center gap-3 border-l border-outline-variant/30 pl-4">
          <div className="text-right">
            <p className="text-sm font-bold text-on-surface font-headline">{userName}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-surface-500">{roleLabel}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface-container-lowest bg-primary-fixed text-xs font-bold text-primary shadow-sm">
            {userName.slice(0, 1).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
