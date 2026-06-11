export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-[120px] font-black leading-none tracking-tighter text-primary/10">404</p>
      <h1 className="mt-2 text-2xl font-bold text-primary">Хуудас олдсонгүй</h1>
      <p className="mt-3 max-w-md text-sm text-on-surface/60">
        Уучлаарай, таны хайсан хуудас устсан эсвэл шилжүүлэгдсэн байна.
      </p>
      <a
        href="/mn"
        className="mt-8 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary/90"
      >
        Нүүр хуудас руу буцах
      </a>
    </div>
  );
}
