'use client';

import { useRef, useState } from 'react';
import { ImageIcon, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Media } from '@/types';
import { Label } from '@/components/ui/label';

interface ContentImageFieldProps {
  weddingId: string;
  label: string;
  description?: string;
  value?: string;
  onChange: (url: string | undefined) => void;
}

export function ContentImageField({
  weddingId,
  label,
  description,
  value,
  onChange,
}: ContentImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('category', 'content');
      const { data } = await api.post(`/weddings/${weddingId}/media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploaded = data.data as Media;
      onChange(uploaded.secureUrl);
      toast.success('Image uploaded');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {value ? (
        <div className="relative group w-fit">
          <img
            src={value}
            alt={label}
            className="h-32 w-48 object-cover rounded-lg border"
            key={value}
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-lg">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white text-black rounded-full p-2"
              disabled={uploading}
            >
              <Upload className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="bg-destructive text-destructive-foreground rounded-full p-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className="h-32 w-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          {uploading ? (
            <p className="text-xs text-muted-foreground">Uploading...</p>
          ) : (
            <>
              <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Click to upload</p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
