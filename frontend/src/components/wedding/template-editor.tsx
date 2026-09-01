'use client';

import { useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { TemplateConfig, TemplateKey, Media, WeddingEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, X, ImageIcon, Check } from 'lucide-react';
import { WebsiteContentForm } from '@/components/wedding/website-content-form';
import { noirEleganceSchema } from '@/components/templates/noir-elegance/schema';
import { parseNoirContent } from '@/components/templates/noir-elegance/parse-noir-content';

const TEMPLATE_OPTIONS: { key: TemplateKey; label: string; description: string }[] = [
  { key: 'elegant', label: 'Elegant', description: 'Classic and sophisticated design' },
  { key: 'minimal', label: 'Minimal', description: 'Clean and modern simplicity' },
  { key: 'floral', label: 'Floral', description: 'Beautiful floral decorations' },
  {
    key: 'noir-elegance',
    label: 'Noir Elegance',
    description: 'Dark cinematic split-screen with scroll-snap sections',
  },
];

export function TemplateEditor({ weddingId }: { weddingId: string }) {
  const queryClient = useQueryClient();

  const { data: wedding } = useQuery({
    queryKey: ['wedding', weddingId],
    queryFn: async () => {
      const { data } = await api.get(`/weddings/${weddingId}`);
      return data.data as WeddingEvent;
    },
  });

  const { data: templateConfig, isLoading } = useQuery({
    queryKey: ['template', weddingId],
    queryFn: async () => {
      const { data } = await api.get(`/weddings/${weddingId}/template`);
      return data.data as TemplateConfig;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: { templateKey?: TemplateKey; config?: Record<string, unknown> }) => {
      const { data } = await api.patch(`/weddings/${weddingId}/template`, input);
      return data.data as TemplateConfig;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['template', weddingId], data);
      queryClient.invalidateQueries({ queryKey: ['template', weddingId] });
      toast.success('Template updated');
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || 'Failed to update template');
    },
  });

  const [uploading, setUploading] = useState<string | null>(null);

  const config = (templateConfig?.config || {}) as Record<string, unknown>;
  const isNoirElegance = templateConfig?.templateKey === 'noir-elegance';

  const noirContentDefaults = useMemo(() => {
    try {
      return parseNoirContent(config.noirContent || {});
    } catch {
      return parseNoirContent({});
    }
  }, [config.noirContent]);

  const handleImageUpload = async (category: string, file: File) => {
    setUploading(category);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('category', category);
      const { data } = await api.post(`/weddings/${weddingId}/media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploaded = data.data as Media;
      const latestConfig =
        (queryClient.getQueryData(['template', weddingId]) as TemplateConfig | undefined)?.config ||
        templateConfig?.config ||
        {};

      const currentConfig = latestConfig as Record<string, unknown>;

      if (category === 'gallery') {
        const gallery = (currentConfig.gallery as string[]) || [];
        await updateMutation.mutateAsync({
          config: { ...currentConfig, gallery: [...gallery, uploaded.secureUrl] },
        });
      } else {
        const configKey =
          category === 'hero'
            ? 'heroImage'
            : category === 'bride'
              ? 'bridePhoto'
              : category === 'groom'
                ? 'groomPhoto'
                : category === 'couple'
                  ? 'coupleImage'
                  : category === 'background'
                    ? 'backgroundImage'
                    : category;
        await updateMutation.mutateAsync({
          config: { ...currentConfig, [configKey]: uploaded.secureUrl },
        });
      }

      queryClient.invalidateQueries({ queryKey: ['media', weddingId] });
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleTemplateSelect = (key: TemplateKey) => {
    if (key === 'noir-elegance' && !config.noirContent) {
      const initialNoir = parseNoirContent({
        cover: {
          title: wedding ? `${wedding.groomName} & ${wedding.brideName}` : undefined,
          date: wedding
            ? new Date(wedding.weddingDate).toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : undefined,
        },
        couple: {
          groom: { name: wedding?.groomName },
          bride: { name: wedding?.brideName },
        },
        event: {
          countdownDate: wedding?.weddingDate,
          ceremony: {
            venue: wedding?.venueName,
            address: wedding?.venueAddress,
            time: wedding?.ceremonyTime,
          },
          reception: {
            time: wedding?.receptionTime,
          },
        },
      });
      updateMutation.mutate({
        templateKey: key,
        config: { ...config, noirContent: initialNoir },
      });
      return;
    }
    updateMutation.mutate({ templateKey: key });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Choose Template</CardTitle>
          <CardDescription>Select a design for your invitation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATE_OPTIONS.map((t) => (
              <button
                key={t.key}
                onClick={() => handleTemplateSelect(t.key)}
                className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                  templateConfig?.templateKey === t.key
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {templateConfig?.templateKey === t.key && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                )}
                <h3 className="font-semibold">{t.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isNoirElegance ? (
        <Card>
          <CardHeader>
            <CardTitle>Template Content</CardTitle>
            <CardDescription>
              Customize all sections of your Noir Elegance invitation. Music is configured below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WebsiteContentForm
              schema={noirEleganceSchema}
              defaultValues={noirContentDefaults as Record<string, unknown>}
              weddingId={weddingId}
              isSubmitting={updateMutation.isPending}
              onSubmit={async (noirContent) => {
                await updateMutation.mutateAsync({
                  config: { ...config, noirContent },
                });
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>Upload images for your invitation template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ImageUploadField
                label="Hero Image"
                currentUrl={config.heroImage as string}
                uploading={uploading === 'hero'}
                onUpload={(f) => handleImageUpload('hero', f)}
                onRemove={() =>
                  updateMutation.mutate({ config: { ...config, heroImage: null } })
                }
              />
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUploadField
                  label="Groom Photo"
                  currentUrl={config.groomPhoto as string}
                  uploading={uploading === 'groom'}
                  onUpload={(f) => handleImageUpload('groom', f)}
                  onRemove={() =>
                    updateMutation.mutate({ config: { ...config, groomPhoto: null } })
                  }
                />
                <ImageUploadField
                  label="Bride Photo"
                  currentUrl={config.bridePhoto as string}
                  uploading={uploading === 'bride'}
                  onUpload={(f) => handleImageUpload('bride', f)}
                  onRemove={() =>
                    updateMutation.mutate({ config: { ...config, bridePhoto: null } })
                  }
                />
              </div>
              <Separator />
              <ImageUploadField
                label="Couple Image"
                currentUrl={config.coupleImage as string}
                uploading={uploading === 'couple'}
                onUpload={(f) => handleImageUpload('couple', f)}
                onRemove={() =>
                  updateMutation.mutate({ config: { ...config, coupleImage: null } })
                }
              />
              <Separator />
              <GalleryUpload
                images={(config.gallery as string[]) || []}
                uploading={uploading === 'gallery'}
                onUpload={(f) => handleImageUpload('gallery', f)}
                onRemove={(url) => {
                  const gallery = ((config.gallery as string[]) || []).filter((u) => u !== url);
                  updateMutation.mutate({ config: { ...config, gallery } });
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Text Content</CardTitle>
              <CardDescription>Customize the text shown on your invitation</CardDescription>
            </CardHeader>
            <CardContent>
              <TextConfigForm
                config={config}
                onSave={(textConfig) =>
                  updateMutation.mutate({ config: { ...config, ...textConfig } })
                }
                isLoading={updateMutation.isPending}
              />
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Background Music</CardTitle>
          <CardDescription>
            Add background music to your invitation. Supports YouTube links and direct audio URLs
            (MP3).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MusicConfigForm
            config={config}
            onSave={(musicConfig) =>
              updateMutation.mutate({ config: { ...config, ...musicConfig } })
            }
            isLoading={updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ImageUploadField({
  label,
  currentUrl,
  uploading,
  onUpload,
  onRemove,
}: {
  label: string;
  currentUrl?: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {currentUrl ? (
        <div className="relative group w-fit">
          <img src={currentUrl} alt={label} className="h-32 w-48 object-cover rounded-lg border" />
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
              onClick={onRemove}
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
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function GalleryUpload({
  images,
  uploading,
  onUpload,
  onRemove,
}: {
  images: string[];
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label>Gallery</Label>
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={`${url}-${i}`} className="relative group">
            <img
              src={url}
              alt={`Gallery ${i + 1}`}
              className="h-24 w-24 object-cover rounded-lg border"
            />
            <button
              onClick={() => onRemove(url)}
              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className="h-24 w-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          {uploading ? (
            <p className="text-xs text-muted-foreground">...</p>
          ) : (
            <Upload className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function TextConfigForm({
  config,
  onSave,
  isLoading,
}: {
  config: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => void;
  isLoading: boolean;
}) {
  const [openingText, setOpeningText] = useState((config.openingText as string) || '');
  const [closingText, setClosingText] = useState((config.closingText as string) || '');
  const [primaryColor, setPrimaryColor] = useState((config.primaryColor as string) || '');
  const [secondaryColor, setSecondaryColor] = useState((config.secondaryColor as string) || '');

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Opening Text</Label>
        <Textarea
          rows={3}
          value={openingText}
          onChange={(e) => setOpeningText(e.target.value)}
          placeholder="We joyfully invite you to celebrate our wedding..."
        />
      </div>
      <div className="space-y-2">
        <Label>Closing Text</Label>
        <Textarea
          rows={3}
          value={closingText}
          onChange={(e) => setClosingText(e.target.value)}
          placeholder="We look forward to celebrating with you..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Primary Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={primaryColor || '#1a1a1a'}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-12 h-10 p-1"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#1a1a1a"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Secondary Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={secondaryColor || '#f5f5f5'}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="w-12 h-10 p-1"
            />
            <Input
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              placeholder="#f5f5f5"
            />
          </div>
        </div>
      </div>
      <Button
        onClick={() => onSave({ openingText, closingText, primaryColor, secondaryColor })}
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Save Text Settings'}
      </Button>
    </div>
  );
}

function MusicConfigForm({
  config,
  onSave,
  isLoading,
}: {
  config: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => void;
  isLoading: boolean;
}) {
  const [musicEnabled, setMusicEnabled] = useState(
    (config.musicEnabled as boolean) ||
      ((config.noirContent as Record<string, unknown>)?.music as Record<string, unknown>)
        ?.enabled as boolean ||
      false
  );
  const [musicUrl, setMusicUrl] = useState(
    (config.musicUrl as string) ||
      ((config.noirContent as Record<string, unknown>)?.music as Record<string, unknown>)
        ?.trackUrl as string ||
      ''
  );

  const getAudioType = (url: string): string => {
    if (!url) return '';
    const ytRegex = /^(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\//;
    if (ytRegex.test(url)) return 'YouTube';
    if (/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i.test(url)) return 'Direct Audio';
    if (/res\.cloudinary\.com/.test(url)) return 'Cloudinary Audio';
    return 'URL';
  };

  const audioType = getAudioType(musicUrl);

  const handleSave = () => {
    const musicData: Record<string, unknown> = {
      musicEnabled,
      musicUrl: musicUrl || null,
    };

    const noir = { ...((config.noirContent as Record<string, unknown>) || {}) };
    noir.music = { enabled: musicEnabled, trackUrl: musicUrl || undefined };
    musicData.noirContent = noir;

    onSave(musicData);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="musicEnabled"
          checked={musicEnabled}
          onChange={(e) => setMusicEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="musicEnabled">Enable background music</Label>
      </div>

      {musicEnabled && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Music URL</Label>
            <Input
              value={musicUrl}
              onChange={(e) => setMusicUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... or https://example.com/song.mp3"
            />
            <p className="text-xs text-muted-foreground">
              Paste a YouTube link or a direct audio file URL (MP3, WAV, OGG). YouTube Music links
              are also supported.
            </p>
          </div>

          {musicUrl && audioType && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {audioType}
              </Badge>
              {audioType === 'YouTube' && (
                <span className="text-xs text-muted-foreground">
                  Audio will play via YouTube in the background
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <Button onClick={handleSave} disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Music Settings'}
      </Button>
    </div>
  );
}
