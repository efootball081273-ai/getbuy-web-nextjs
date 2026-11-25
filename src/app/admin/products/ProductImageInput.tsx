"use client";

import { useState } from "react";

export default function ProductImageInput({
  initialValue = "",
  required = false,
}: {
  initialValue?: string;
  required?: boolean;
}) {
  const [images, setImages] = useState(initialValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    const uploaded: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/admin/images", {
          method: "POST",
          body: formData,
        });
        const result = await response.json() as { url?: string; error?: string };
        if (!response.ok || !result.url) {
          throw new Error(result.error ?? "Image upload failed");
        }
        uploaded.push(result.url);
      }
      setImages((current) => [...current.split(/\r?\n/).filter(Boolean), ...uploaded].join("\n"));
    } catch (uploadError) {
      setImages((current) => [...current.split(/\r?\n/).filter(Boolean), ...uploaded].join("\n"));
      setError(uploadError instanceof Error ? uploadError.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        Upload product images (JPEG, PNG, or WebP; up to 4 MB each)
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={uploading}
          onChange={(event) => {
            void uploadFiles(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
          className="admin-input"
        />
      </label>
      <label className="block text-sm font-medium">
        Image URLs (one HTTPS Unsplash or Cloudinary URL per line)
        <textarea
          required={required}
          name="images"
          rows={2}
          value={images}
          onChange={(event) => setImages(event.target.value)}
          className="admin-input"
        />
      </label>
      <p aria-live="polite" className={`text-sm ${error ? "text-red-600" : "text-slate-500"}`}>
        {uploading ? "Uploading images…" : error || "Uploaded images will be added to the URL list."}
      </p>
    </div>
  );
}
