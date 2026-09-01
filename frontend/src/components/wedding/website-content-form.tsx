'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray, Controller, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ContentImageField } from '@/components/wedding/content-image-field';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Media } from '@/types';

const AUDIO_FIELD_RE = /music|audio/i;

interface WebsiteContentFormProps {
  schema: z.ZodObject<z.ZodRawShape>;
  defaultValues: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  isSubmitting?: boolean;
  weddingId: string;
}

function unwrapZodType(value: z.ZodTypeAny): z.ZodTypeAny {
  let unwrapped = value;
  if (unwrapped instanceof z.ZodDefault) unwrapped = unwrapped._def.innerType;
  if (unwrapped instanceof z.ZodOptional) unwrapped = unwrapped._def.innerType;
  return unwrapped;
}

function getDescription(value: z.ZodTypeAny): string | undefined {
  const unwrapped = unwrapZodType(value);
  return unwrapped._def?.description as string | undefined;
}

function isTextareaField(key: string): boolean {
  return /bio|text|story|message|quote|description|apology/i.test(key);
}

export function WebsiteContentForm({
  schema,
  defaultValues,
  onSubmit,
  isSubmitting,
  weddingId,
}: WebsiteContentFormProps) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const renderFields = (shape: z.ZodRawShape, pathPrefix = '') => {
    return Object.entries(shape).map(([key, value]) => {
      const fieldName = pathPrefix ? `${pathPrefix}.${key}` : key;
      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

      if (AUDIO_FIELD_RE.test(fieldName)) return null;

      const unwrapped = unwrapZodType(value);
      const description = getDescription(value);

      if (unwrapped instanceof z.ZodObject) {
        return (
          <div key={fieldName} className="border p-4 rounded-lg mb-4 bg-muted/30">
            <h3 className="font-semibold mb-4">{label}</h3>
            <div className="space-y-4">{renderFields(unwrapped.shape, fieldName)}</div>
          </div>
        );
      }

      if (unwrapped instanceof z.ZodBoolean) {
        return (
          <Controller
            key={fieldName}
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>{label}</Label>
                  {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(field.value)}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
            )}
          />
        );
      }

      if (unwrapped instanceof z.ZodArray) {
        const element = unwrapZodType(unwrapped.element);
        const isStringArray = element instanceof z.ZodString;
        const isImageArray = isStringArray && key.toLowerCase().includes('images');

        if (isImageArray) {
          return (
            <GalleryField
              key={fieldName}
              name={fieldName}
              label={label}
              description={description}
              form={form}
              weddingId={weddingId}
            />
          );
        }

        if (element instanceof z.ZodObject) {
          return (
            <ArrayObjectField
              key={fieldName}
              name={fieldName}
              label={label}
              shape={element.shape}
              form={form}
            />
          );
        }
      }

      const isImageField =
        (key.toLowerCase().includes('image') || key.toLowerCase().includes('photo')) &&
        unwrapped instanceof z.ZodString;

      if (isImageField) {
        return (
          <Controller
            key={fieldName}
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <ContentImageField
                weddingId={weddingId}
                label={label}
                description={description}
                value={field.value as string | undefined}
                onChange={field.onChange}
              />
            )}
          />
        );
      }

      return (
        <Controller
          key={fieldName}
          control={form.control}
          name={fieldName}
          render={({ field }) => (
            <div className="space-y-2">
              <Label>{label}</Label>
              {isTextareaField(key) ? (
                <Textarea rows={4} value={String(field.value ?? '')} onChange={field.onChange} />
              ) : (
                <Input value={String(field.value ?? '')} onChange={field.onChange} />
              )}
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
          )}
        />
      );
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(async (data) => {
        try {
          await onSubmit(data as Record<string, unknown>);
        } catch {
          toast.error('Failed to save content');
        }
      })}
      className="space-y-6"
    >
      {renderFields(schema.shape)}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Content'}
      </Button>
    </form>
  );
}

function GalleryField({
  name,
  label,
  description,
  form,
  weddingId,
}: {
  name: string;
  label: string;
  description?: string;
  form: UseFormReturn<Record<string, unknown>>;
  weddingId: string;
}) {
  const { append, remove } = useFieldArray({
    control: form.control,
    name: name as never,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const images = form.watch(name) as string[] | undefined;

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('category', 'gallery');
      const { data } = await api.post(`/weddings/${weddingId}/media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploaded = data.data as Media;
      append(uploaded.secureUrl as never);
      toast.success('Image added to gallery');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className="flex flex-wrap gap-3">
        {(images || []).map((url, i) => (
          <div key={`${url}-${i}`} className="relative group">
            <img src={url} alt={`${label} ${i + 1}`} className="h-24 w-24 object-cover rounded-lg border" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className="h-24 w-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50"
        >
          {uploading ? <span className="text-xs">...</span> : <Upload className="h-5 w-5 text-muted-foreground" />}
        </div>
      </div>
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

function ArrayObjectField({
  name,
  label,
  shape,
  form,
}: {
  name: string;
  label: string;
  shape: z.ZodRawShape;
  form: UseFormReturn<Record<string, unknown>>;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: name as never,
  });

  const handleAdd = () => {
    const empty: Record<string, unknown> = {};
    Object.entries(shape).forEach(([k, v]) => {
      const t = unwrapZodType(v);
      if (t instanceof z.ZodBoolean) empty[k] = false;
      else empty[k] = '';
    });
    append(empty as never);
  };

  return (
    <div className="border p-4 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">{label}</h4>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          + Add
        </Button>
      </div>
      {fields.map((item, index) => (
        <div key={item.id} className="border rounded-lg p-4 space-y-3 relative">
          <button
            type="button"
            onClick={() => remove(index)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
          {Object.entries(shape).map(([key, value]) => {
            const fieldPath = `${name}.${index}.${key}`;
            const fieldLabel = key.charAt(0).toUpperCase() + key.slice(1);
            const unwrapped = unwrapZodType(value);
            const description = getDescription(value);

            if (unwrapped instanceof z.ZodString) {
              return (
                <Controller
                  key={fieldPath}
                  control={form.control}
                  name={fieldPath}
                  render={({ field }) => (
                    <div className="space-y-1">
                      <Label className="text-xs">{fieldLabel}</Label>
                      {isTextareaField(key) ? (
                        <Textarea rows={2} value={String(field.value ?? '')} onChange={field.onChange} />
                      ) : (
                        <Input value={String(field.value ?? '')} onChange={field.onChange} />
                      )}
                      {description && <p className="text-xs text-muted-foreground">{description}</p>}
                    </div>
                  )}
                />
              );
            }
            return null;
          })}
        </div>
      ))}
    </div>
  );
}
