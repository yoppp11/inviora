'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { WeddingEvent } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { EventDetails } from '@/components/wedding/event-details';
import { GuestManager } from '@/components/wedding/guest-manager';
import { TemplateEditor } from '@/components/wedding/template-editor';
import { TemplatePreview } from '@/components/wedding/template-preview';
import { TransferManager } from '@/components/wedding/transfer-manager';

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const { data: wedding, isLoading } = useQuery({
    queryKey: ['wedding', eventId],
    queryFn: async () => {
      const { data } = await api.get(`/weddings/${eventId}`);
      return data.data as WeddingEvent;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Wedding event not found</p>
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/dashboard" className="shrink-0 mt-0.5">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold truncate">{wedding.title}</h1>
          <p className="text-sm text-muted-foreground truncate">
            {wedding.groomName} & {wedding.brideName}
          </p>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max min-w-full sm:min-w-0 sm:w-full justify-start h-auto p-1">
            <TabsTrigger value="details" className="text-xs sm:text-sm px-3 py-2">
              Details
            </TabsTrigger>
            <TabsTrigger value="guests" className="text-xs sm:text-sm px-3 py-2">
              Guests
            </TabsTrigger>
            <TabsTrigger value="transfers" className="text-xs sm:text-sm px-3 py-2">
              Transfers
            </TabsTrigger>
            <TabsTrigger value="template" className="text-xs sm:text-sm px-3 py-2">
              Template
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs sm:text-sm px-3 py-2">
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="details" className="mt-4 sm:mt-6">
          <EventDetails wedding={wedding} />
        </TabsContent>

        <TabsContent value="guests" className="mt-4 sm:mt-6">
          <GuestManager weddingId={eventId} weddingSlug={wedding.slug} />
        </TabsContent>

        <TabsContent value="transfers" className="mt-4 sm:mt-6">
          <TransferManager weddingId={eventId} />
        </TabsContent>

        <TabsContent value="template" className="mt-4 sm:mt-6">
          <TemplateEditor weddingId={eventId} />
        </TabsContent>

        <TabsContent value="preview" className="mt-4 sm:mt-6">
          <TemplatePreview weddingId={eventId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
