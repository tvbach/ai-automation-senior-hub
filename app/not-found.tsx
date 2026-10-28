import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-center">
      <div>
        <p className="font-mono text-sm text-accent-soft">404 · locator not found</p>
        <h1 className="mt-2 text-2xl font-semibold">Trang này không tồn tại</h1>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent-strong"
        >
          Về Dashboard
        </Link>
      </div>
    </div>
  );
}
