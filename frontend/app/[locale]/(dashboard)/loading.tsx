export default function DashboardLoading() {
  return (
    <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-bounce rounded-xl bg-primary/20 p-2 text-primary shadow-ambient">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <p className="font-headline text-sm font-bold text-surface-500 animate-pulse">
          Түр хүлээнэ үү...
        </p>
      </div>
    </div>
  );
}
