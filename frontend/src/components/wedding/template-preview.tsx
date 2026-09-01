'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { WeddingEvent, TemplateConfig, Media, InvitationData, TemplateKey } from '@/types';
import { TemplateRenderer } from '@/components/wedding/template-renderer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Monitor, Smartphone } from 'lucide-react';

type PreviewMode = 'mobile' | 'desktop';

const SAMPLE_GUEST = { name: 'Nama Tamu', address: 'Alamat Tamu' };

export function TemplatePreview({ weddingId }: { weddingId: string }) {
  const [mode, setMode] = useState<PreviewMode>('mobile');

  const { data: wedding, isLoading: weddingLoading } = useQuery({
    queryKey: ['wedding', weddingId],
    queryFn: async () => {
      const { data } = await api.get(`/weddings/${weddingId}`);
      return data.data as WeddingEvent;
    },
  });

  const { data: templateConfig, isLoading: templateLoading } = useQuery({
    queryKey: ['template', weddingId],
    queryFn: async () => {
      const { data } = await api.get(`/weddings/${weddingId}/template`);
      return data.data as TemplateConfig;
    },
  });

  const { data: media } = useQuery({
    queryKey: ['media', weddingId],
    queryFn: async () => {
      const { data } = await api.get(`/weddings/${weddingId}/media`);
      return data.data as Media[];
    },
  });

  if (weddingLoading || templateLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!wedding) return null;

  const invitationData: InvitationData = {
    event: {
      title: wedding.title,
      slug: wedding.slug,
      groomName: wedding.groomName,
      brideName: wedding.brideName,
      weddingDate: wedding.weddingDate,
      ceremonyTime: wedding.ceremonyTime,
      receptionTime: wedding.receptionTime,
      venueName: wedding.venueName,
      venueAddress: wedding.venueAddress,
      mapUrl: wedding.mapUrl,
      openingText: wedding.openingText,
      closingText: wedding.closingText,
    },
    guest: SAMPLE_GUEST,
    template: {
      key: (templateConfig?.templateKey as TemplateKey) || 'elegant',
      config: (templateConfig?.config as InvitationData['template']['config']) || {},
    },
    media: (media || []).map((m) => ({
      id: m.id,
      secureUrl: m.secureUrl,
      category: m.category,
      width: m.width,
      height: m.height,
    })),
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Invitation Preview</h2>
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant={mode === 'mobile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('mobile')}
          >
            <Smartphone className="h-4 w-4 mr-1" />
            Mobile
          </Button>
          <Button
            variant={mode === 'desktop' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('desktop')}
          >
            <Monitor className="h-4 w-4 mr-1" />
            Desktop
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div
          className={`mx-auto transition-all duration-300 ${
            mode === 'mobile'
              ? 'max-w-[390px] border-x shadow-inner'
              : 'w-full'
          }`}
        >
          <div className="overflow-y-auto max-h-[80vh]">
            <TemplateRenderer
              key={`${templateConfig?.templateKey}-${JSON.stringify(templateConfig?.config)}`}
              data={invitationData}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
