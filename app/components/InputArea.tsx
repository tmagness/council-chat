'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ImageAttachment } from '@/lib/types';

interface InputAreaProps {
  onSubmit: (message: string, images: ImageAttachment[]) => void;
  disabled: boolean;
  loading: boolean;
}

export default function InputArea({ onSubmit, disabled, loading }: InputAreaProps) {
  const [value, setValue] = useState('');
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
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

  const handleSubmit = () => {
    if ((!value.trim() && images.length === 0) || disabled || loading) return;
    onSubmit(value.trim(), images);
    setValue('');
    setImages([]);
    setImagePreviews([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setUploadProgress('No valid images found');
      setTimeout(() => setUploadProgress(null), 2000);
      return;
    }

    setUploadProgress(`Processing ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}...`);

    let processed = 0;
    const errors: string[] = [];

    for (const file of imageFiles) {
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: exceeds 10MB limit`);
        continue;
      }

      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        errors.push(`${file.name}: unsupported format`);
        continue;
      }

      try {
        const base64 = await readFileAsBase64(file);
        const mediaType = file.type as ImageAttachment['media_type'];

        setImages((prev) => [...prev, { data: base64, media_type: mediaType }]);
        setImagePreviews((prev) => [...prev, `data:${file.type};base64,${base64}`]);
        processed++;
        setUploadProgress(`Processed ${processed}/${imageFiles.length}...`);
      } catch (err) {
        errors.push(`${file.name}: failed to process`);
      }
    }

    if (errors.length > 0) {
      setUploadProgress(`Added ${processed} image${processed !== 1 ? 's' : ''}. ${errors.length} failed.`);
    } else {
      setUploadProgress(`Added ${processed} image${processed !== 1 ? 's' : ''}`);
    }

    setTimeout(() => setUploadProgress(null), 3000);
  }, []);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFiles(files);

    // Reset file input
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

  // Paste handler for images
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
      className="border-t border-border-primary bg-bg-secondary p-4 relative"
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
            <p className="text-accent-blue font-semibold text-lg">Drop images here</p>
            <p className="text-accent-blue/70 text-sm">JPEG, PNG, GIF, WebP up to 10MB</p>
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

      {/* Image Previews */}
      {imagePreviews.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group animate-scale-in">
              <img
                src={preview}
                alt={`Upload ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg border-2 border-border-primary hover:border-accent-blue transition-colors"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-accent-red rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
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
        </div>
      )}

      <div className="flex items-end gap-3">
        {/* Image Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || loading}
          className="flex-shrink-0 w-10 h-10 rounded-lg bg-bg-tertiary border-2 border-border-primary text-text-secondary flex items-center justify-center hover:bg-bg-elevated hover:text-accent-blue hover:border-accent-blue/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Attach image (or drag & drop, or paste)"
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
          accept="image/jpeg,image/png,image/gif,image/webp"
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
              images.length > 0
                ? "Add a message about the image(s)..."
                : "Ask the council a question... (drag & drop or paste images)"
            }
            disabled={disabled || loading}
            rows={1}
            className="w-full bg-bg-tertiary border-2 border-border-primary rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={(!value.trim() && images.length === 0) || disabled || loading}
          className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent-blue text-bg-primary flex items-center justify-center hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {/* Help text */}
      <div className="mt-2 text-xs text-text-muted text-center">
        Tip: Drag & drop images, paste from clipboard, or click the image icon
      </div>
    </div>
  );
}
