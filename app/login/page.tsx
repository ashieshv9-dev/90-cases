import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { hasSession } from "@/lib/auth";

export default async function LoginPage() {
  if (await hasSession()) {
    redirect("/");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <section className="w-full max-w-sm rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="mb-7">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-leaf">
            90+ Cases
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Secure login</h1>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
