'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ImageAttachment, DocumentAttachment, ClientDocument } from '@/lib/types';

interface InputAreaProps {
  onSubmit: (message: string, images: ImageAttachment[]) => void;
  disabled: boolean;
  loading: boolean;
  documents: ClientDocument[];
  onAddDocuments: (docs: DocumentAttachment[]) => void;
  onRemoveDocument: (id: string) => void;
}

const PER_FILE_LIMIT = 10 * 1024 * 1024; // 10MB
const TOTAL_LIMIT = 25 * 1024 * 1024; // 25MB

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPT_ATTR = [
  ...ACCEPTED_IMAGE_TYPES,
  '.docx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pdf',
  'application/pdf',
  '.txt',
  'text/plain',
].join(',');

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function classifyFile(file: File): 'image' | 'docx' | 'pdf' | 'txt' | null {
  if (ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'image';
  const name = file.name.toLowerCase();
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')) return 'docx';
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (file.type === 'text/plain' || name.endsWith('.txt')) return 'txt';
  return null;
}

export default function InputArea({
  onSubmit,
  disabled,
  loading,
  documents,
  onAddDocuments,
  onRemoveDocument,
}: InputAreaProps) {
  const [value, setValue] = useState('');
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  const hasAttachments = images.length > 0 || documents.length > 0;

  const handleSubmit = () => {
    if ((!value.trim() && !hasAttachments) || disabled || loading) return;
    onSubmit(value.trim(), images);
    setValue('');
    setImages([]);
    setImagePreviews([]);
    setErrorMessage(null);
    // documents are managed by the parent and persist across turns
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) ?? '');
      reader.onerror = () => reject(new Error('Failed to read text'));
      reader.readAsText(file);
    });
  };

  const extractDocxText = async (file: File): Promise<string> => {
    const mammoth = await import('mammoth');
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value || '';
  };

  const extractPdfText = async (file: File): Promise<string> => {
    const pdfjs: typeof import('pdfjs-dist') = await import('pdfjs-dist');
    if (!pdfjs.GlobalWorkerOptions.workerPort) {
      pdfjs.GlobalWorkerOptions.workerPort = new Worker(
        new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
        { type: 'module' }
      );
    }
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      text += pageText + '\n';
    }
    return text;
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setErrorMessage(null);
    const fileArray = Array.from(files);

    const currentTotal =
      images.reduce((acc, img) => acc + Math.floor(img.data.length * 0.75), 0) +
      documents.reduce((acc, doc) => acc + doc.size, 0);

    let pendingTotal = currentTotal;
    const errors: string[] = [];
    const accepted: { file: File; kind: 'image' | 'docx' | 'pdf' | 'txt' }[] = [];

    for (const file of fileArray) {
      const kind = classifyFile(file);
      if (!kind) {
        errors.push(`${file.name}: unsupported file type`);
        continue;
      }
      if (file.size > PER_FILE_LIMIT) {
        errors.push(`${file.name}: exceeds 10MB per-file limit`);
        continue;
      }
      if (pendingTotal + file.size > TOTAL_LIMIT) {
        errors.push(`${file.name}: would exceed 25MB total attachment limit`);
        continue;
      }
      pendingTotal += file.size;
      accepted.push({ file, kind });
    }

    if (accepted.length === 0) {
      if (errors.length > 0) setErrorMessage(errors.join(' • '));
      return;
    }

    setUploadProgress(`Processing ${accepted.length} file${accepted.length > 1 ? 's' : ''}...`);

    let processed = 0;
    const newDocs: DocumentAttachment[] = [];

    for (const { file, kind } of accepted) {
      try {
        if (kind === 'image') {
          const base64 = await readFileAsBase64(file);
          const mediaType = file.type as ImageAttachment['media_type'];
          setImages((prev) => [...prev, { data: base64, media_type: mediaType }]);
          setImagePreviews((prev) => [...prev, `data:${file.type};base64,${base64}`]);
        } else {
          let text = '';
          if (kind === 'docx') text = await extractDocxText(file);
          else if (kind === 'pdf') text = await extractPdfText(file);
          else if (kind === 'txt') text = await readFileAsText(file);
          newDocs.push({ filename: file.name, type: kind, size: file.size, text });
        }
        processed++;
        setUploadProgress(`Processed ${processed}/${accepted.length}...`);
      } catch (err) {
        errors.push(`${file.name}: failed to process`);
      }
    }

    if (newDocs.length > 0) onAddDocuments(newDocs);

    if (errors.length > 0) {
      setErrorMessage(errors.join(' • '));
      setUploadProgress(`Added ${processed} file${processed !== 1 ? 's' : ''}. ${errors.length} failed.`);
    } else {
      setUploadProgress(`Added ${processed} file${processed !== 1 ? 's' : ''}`);
    }

    setTimeout(() => setUploadProgress(null), 3000);
  }, [images, documents, onAddDocuments]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFiles(files);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;

    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;

    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    if (disabled || loading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
  }, [disabled, loading, processFiles]);

  // Paste handler — image-only by design (per planner constraint)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (disabled || loading) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItems: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageItems.push(file);
        }
      }

      if (imageItems.length > 0) {
        e.preventDefault();
        await processFiles(imageItems);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [disabled, loading, processFiles]);

  return (
    <div
      ref={dropZoneRef}
      className="border-t border-border-primary bg-bg-secondary p-2 sm:p-4 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-accent-blue/20 border-2 border-dashed border-accent-blue rounded-lg z-10 flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <svg
              className="w-12 h-12 text-accent-blue mx-auto mb-2 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-accent-blue font-semibold text-lg">Drop files here</p>
            <p className="text-accent-blue/70 text-sm">Images, .docx, .pdf, .txt up to 10MB each</p>
          </div>
        </div>
      )}

      {/* Upload Progress Notification */}
      {uploadProgress && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2">
          <div className="bg-bg-elevated border border-border-primary rounded-lg px-4 py-2 shadow-lg flex items-center gap-2 animate-fade-in">
            <svg
              className="w-4 h-4 text-accent-blue animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm text-text-primary font-medium">{uploadProgress}</span>
          </div>
        </div>
      )}

      {/* Inline error */}
      {errorMessage && (
        <div className="mb-2 px-3 py-2 rounded-lg bg-accent-red/10 border border-accent-red/40 text-xs text-accent-red flex items-start justify-between gap-2">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-accent-red/70 hover:text-accent-red flex-shrink-0"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Attachment chip row (above textarea) */}
      {hasAttachments && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {imagePreviews.map((preview, index) => (
            <div key={`img-${index}`} className="relative group animate-scale-in">
              <img
                src={preview}
                alt={`Upload ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg border-2 border-border-primary hover:border-accent-blue transition-colors"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-accent-red rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                aria-label="Remove image"
              >
                ×
              </button>
              <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-mono">
                  {Math.round(images[index]?.data.length * 0.75 / 1024)}KB
                </span>
              </div>
            </div>
          ))}
          {documents.map((doc) => {
            const lowText = doc.text.length < 50;
            const carried = !doc.isNew;
            const titleParts: string[] = [];
            if (carried) titleParts.push('carried from earlier turn');
            else titleParts.push('added this turn');
            titleParts.push(`${doc.text.length} chars extracted`);
            if (lowText) titleParts.push('low text extraction');
            return (
              <div
                key={doc.id}
                className={
                  'flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-tertiary border-2 border-border-primary hover:border-accent-blue transition-colors animate-scale-in ' +
                  (carried ? 'opacity-60' : '')
                }
                title={titleParts.join(' · ')}
              >
                {carried ? (
                  <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="carried from earlier turn">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                <div className="flex flex-col">
                  <span className="text-xs text-text-primary font-medium leading-tight max-w-[180px] truncate">
                    {doc.filename}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono leading-tight">
                    {doc.type.toUpperCase()} · {formatBytes(doc.size)}
                    {lowText && <span className="text-accent-red ml-1">· low text</span>}
                  </span>
                </div>
                <button
                  onClick={() => onRemoveDocument(doc.id)}
                  className="ml-1 w-5 h-5 rounded-full bg-bg-elevated hover:bg-accent-red hover:text-white text-text-muted flex items-center justify-center text-xs flex-shrink-0 transition-colors"
                  aria-label={`Remove ${doc.filename}`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-end gap-2 sm:gap-3">
        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || loading}
          className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-bg-tertiary border-2 border-border-primary text-text-secondary flex items-center justify-center hover:bg-bg-elevated hover:text-accent-blue hover:border-accent-blue/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Attach image or document (or drag & drop, or paste image)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasAttachments
                ? "Add a message..."
                : "Ask a question..."
            }
            disabled={disabled || loading}
            rows={1}
            className="w-full bg-bg-tertiary border-2 border-border-primary rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={(!value.trim() && !hasAttachments) || disabled || loading}
          className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-accent-blue text-bg-primary flex items-center justify-center hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Help text - hidden on mobile to save space */}
      <div className="hidden sm:block mt-2 text-xs text-text-muted text-center">
        Tip: Drag & drop images, paste from clipboard, or click the image icon
      </div>
    </div>
  );
}
