'use client';

import { useState, useRef, useEffect } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) {
        alert('Image must be less than 10MB');
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        const mediaType = file.type as ImageAttachment['media_type'];

        setImages((prev) => [...prev, { data: base64, media_type: mediaType }]);
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-border-primary bg-bg-secondary p-4">
      {/* Image Previews */}
      {imagePreviews.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Upload ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg border border-border-primary"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-accent-red rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3">
        {/* Image Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || loading}
          className="flex-shrink-0 w-10 h-10 rounded-lg bg-bg-tertiary border border-border-primary text-text-secondary flex items-center justify-center hover:bg-bg-elevated hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Attach image"
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
            placeholder={images.length > 0 ? "Add a message about the image(s)..." : "Ask the council a question..."}
            disabled={disabled || loading}
            rows={1}
            className="w-full bg-bg-tertiary border border-border-primary rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}
