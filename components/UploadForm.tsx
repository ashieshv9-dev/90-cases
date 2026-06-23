"use client";

import { FormEvent, useState } from "react";

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("Upload an Excel workbook to replace all case data.");
  const [isUploading, setIsUploading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setMessage("Choose an Excel file first.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    setIsUploading(true);
    setMessage("Uploading and replacing previous data...");

    const response = await fetch("/api/cases/upload", {
      method: "POST",
      body: formData
    });

    setIsUploading(false);

    if (response.status === 401) {
      window.location.assign("/login");
      return;
    }

    const payload = (await response.json()) as { imported?: number; error?: string };

    if (!response.ok) {
      setMessage(payload.error || "Upload failed.");
      return;
    }

    setMessage(`Imported ${payload.imported?.toLocaleString("en-IN") || "0"} rows. Previous data was replaced.`);
    setFile(null);
    event.currentTarget.reset();
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <div>
        <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-leaf bg-mist px-4 py-8 text-center">
          <span className="text-lg font-bold text-ink">{file ? file.name : "Choose Excel file"}</span>
          <span className="mt-2 text-sm font-semibold text-slate-600">.xlsx, .xls, or .xlsm</span>
          <input
            accept=".xlsx,.xls,.xlsm"
            className="sr-only"
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </label>
      </div>

      <p className="rounded-md bg-paper px-3 py-3 text-sm font-semibold text-slate-700">{message}</p>

      <button
        className="h-12 rounded-md bg-leaf px-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isUploading || !file}
        type="submit"
      >
        {isUploading ? "Uploading" : "Replace data"}
      </button>
    </form>
  );
}
