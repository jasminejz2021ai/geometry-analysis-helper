import { useRef, useState } from "react";

type Props = {
  onSubmit: (file: File) => void;
  loading: boolean;
};

export default function ImageUpload({ onSubmit, loading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function pick(f: File | null) {
    if (!f) return;
    setFile(f);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(f);
    });
  }

  function clear() {
    setFile(null);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-2xl bg-white/80 p-6 shadow-lg shadow-brand-900/5 ring-1 ring-white/60 backdrop-blur-sm">
      <p className="block text-sm font-medium text-slate-700">
        Or upload a photo of a problem
      </p>

      {!preview && (
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pick(e.dataTransfer.files?.[0] ?? null);
          }}
          className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-4 py-8 text-center transition hover:border-brand-400 hover:bg-brand-50/50"
        >
          <svg
            className="h-8 w-8 text-brand-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M3 16.5V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2.5" />
            <path d="M12 3v13M7 8l5-5 5 5" />
          </svg>
          <span className="text-sm text-slate-600">
            Tap to take a photo or choose an image
          </span>
          <span className="text-xs text-slate-400">PNG or JPG, up to 10 MB</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
        </label>
      )}

      {preview && (
        <div className="mt-2">
          <img
            src={preview}
            alt="Problem preview"
            className="max-h-64 w-full rounded-xl object-contain ring-1 ring-slate-200"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => file && onSubmit(file)}
              disabled={loading || !file}
              className="rounded-xl bg-brand-600 px-5 py-2 font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Reading photo..." : "Solve from photo"}
            </button>
            <button
              onClick={clear}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Choose a different photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
