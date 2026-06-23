import Link from "next/link";
import { redirect } from "next/navigation";
import { UploadForm } from "@/components/UploadForm";
import { hasSession } from "@/lib/auth";

export default async function AdminPage() {
  if (!(await hasSession())) {
    redirect("/login");
  }

  return (
    <main className="min-h-dvh px-4 py-5 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-leaf">
              Admin
            </p>
            <h1 className="text-3xl font-bold text-ink">Upload cases</h1>
          </div>
          <Link
            href="/"
            className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm"
          >
            Dashboard
          </Link>
        </header>

        <section className="rounded-lg border border-line bg-white p-4 shadow-soft sm:p-6">
          <UploadForm />
        </section>
      </div>
    </main>
  );
}
