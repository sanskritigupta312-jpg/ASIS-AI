import { useState, useRef } from 'react';

export default function UploadSection({ onUpload }) {
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState(null);
  const inputRef = useRef(null);

  const handle = (file) => {
    if (!file) return;
    setSelected(file);
    onUpload(file);
  };

  return (
    <div
      className={`upload-zone p-10 text-center cursor-pointer ${dragging ? 'drag-over' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handle(e.target.files[0])}
      />

      {selected ? (
        <div className="space-y-3">
          <div
            className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: '#f0fdf4', color: '#16a34a' }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 11l5 5 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{selected.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            {(selected.size / 1024).toFixed(1)} KB · Click to change
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: '#eff6ff', color: 'var(--accent)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 16V8M8 12l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 16.5A4.5 4.5 0 0016.5 12H15a5 5 0 10-9.9 1A4 4 0 004 21h12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-1)' }}>
              Drop your floor plan here
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
              or click to browse · PNG, JPG supported
            </p>
          </div>
          <span
            className="inline-block px-5 py-2 rounded-full text-sm font-semibold"
            style={{ background: 'var(--text-1)', color: '#fff' }}
          >
            Choose File
          </span>
        </div>
      )}
    </div>
  );
}
