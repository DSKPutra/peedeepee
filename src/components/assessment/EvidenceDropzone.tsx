import { useRef, useState } from 'react';
import { FileText, Paperclip, X } from 'lucide-react';

interface EvidenceDropzoneProps {
  files: string[];
  onAdd: (fileName: string) => void;
  onRemove: (fileName: string) => void;
}

/**
 * Dropzone bukti dokumen (simulasi — hanya nama file yang disimpan
 * di localStorage, bukan konten file).
 */
export function EvidenceDropzone({ files, onAdd, onRemove }: EvidenceDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    Array.from(fileList).forEach((f) => {
      if (!files.includes(f.name)) onAdd(f.name);
    });
  };

  return (
    <div className="mt-4">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-text-muted">
        Evidence (opsional)
      </p>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-4 py-3 text-sm transition-colors ${
          dragging
            ? 'border-accent bg-accent/5 text-accent'
            : 'border-border text-text-muted hover:border-accent/50 hover:text-text-primary'
        }`}
      >
        <Paperclip className="h-4 w-4" />
        Tarik file ke sini atau klik untuk memilih dokumen bukti
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {files.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {files.map((file) => (
            <li
              key={file}
              className="flex items-center gap-2 rounded border border-border bg-background/50 px-3 py-1.5 text-xs text-text-primary"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="truncate">{file}</span>
              <button
                onClick={() => onRemove(file)}
                aria-label={`Hapus ${file}`}
                className="ml-auto rounded p-0.5 text-text-muted hover:text-danger"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
