"use client";

import { FormEvent, useState } from "react";

export function LoginForm() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ pin })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("Incorrect PIN. Try again.");
      setPin("");
      return;
    }

    window.location.assign("/");
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <label className="flex flex-col gap-2 text-sm font-semibold text-ink" htmlFor="pin">
        4-digit PIN
        <input
          autoComplete="current-password"
          autoFocus
          className="h-14 rounded-md border border-line bg-paper px-4 text-center text-2xl font-bold tracking-[0.4em] text-ink"
          id="pin"
          inputMode="numeric"
          maxLength={4}
          name="pin"
          pattern="[0-9]{4}"
          required
          type="password"
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
        />
      </label>

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <button
        className="h-12 rounded-md bg-leaf px-4 font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting || pin.length !== 4}
        type="submit"
      >
        {isSubmitting ? "Checking" : "Unlock"}
      </button>
    </form>
  );
}
