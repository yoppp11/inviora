'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { WeddingEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock } from 'lucide-react';

const updateEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  groomName: z.string().min(1),
  brideName: z.string().min(1),
  weddingDate: z.string().min(1),
  ceremonyTime: z.string().optional().nullable(),
  receptionTime: z.string().optional().nullable(),
  venueName: z.string().optional().nullable(),
  venueAddress: z.string().optional().nullable(),
  mapUrl: z.string().optional().nullable(),
  openingText: z.string().optional().nullable(),
  closingText: z.string().optional().nullable(),
});

type UpdateEventForm = z.infer<typeof updateEventSchema>;

export function EventDetails({ wedding }: { wedding: WeddingEvent }) {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateEventForm>({
    resolver: zodResolver(updateEventSchema),
    defaultValues: {
      title: wedding.title,
      slug: wedding.slug,
      groomName: wedding.groomName,
      brideName: wedding.brideName,
      weddingDate: wedding.weddingDate.split('T')[0],
      ceremonyTime: wedding.ceremonyTime || '',
      receptionTime: wedding.receptionTime || '',
      venueName: wedding.venueName || '',
      venueAddress: wedding.venueAddress || '',
      mapUrl: wedding.mapUrl || '',
      openingText: wedding.openingText || '',
      closingText: wedding.closingText || '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: UpdateEventForm) => {
      const { data: res } = await api.patch(`/weddings/${wedding.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wedding', wedding.id] });
      queryClient.invalidateQueries({ queryKey: ['weddings'] });
      toast.success('Event updated successfully');
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || 'Failed to update event');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      const { data } = await api.patch(`/weddings/${wedding.id}`, { isActive });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wedding', wedding.id] });
      queryClient.invalidateQueries({ queryKey: ['weddings'] });
      toast.success('Event status updated');
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || 'Failed to update status');
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Event Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="groomName">Groom Name</Label>
                  <Input id="groomName" {...register('groomName')} />
                  {errors.groomName && (
                    <p className="text-sm text-destructive">{errors.groomName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brideName">Bride Name</Label>
                  <Input id="brideName" {...register('brideName')} />
                  {errors.brideName && (
                    <p className="text-sm text-destructive">{errors.brideName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input id="title" {...register('title')} />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" {...register('slug')} />
                {errors.slug && (
                  <p className="text-sm text-destructive">{errors.slug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weddingDate">Wedding Date</Label>
                <Input id="weddingDate" type="date" {...register('weddingDate')} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ceremonyTime">Ceremony Time</Label>
                  <Input id="ceremonyTime" {...register('ceremonyTime')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receptionTime">Reception Time</Label>
                  <Input id="receptionTime" {...register('receptionTime')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venueName">Venue Name</Label>
                <Input id="venueName" {...register('venueName')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venueAddress">Venue Address</Label>
                <Input id="venueAddress" {...register('venueAddress')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mapUrl">Map URL</Label>
                <Input id="mapUrl" type="url" {...register('mapUrl')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="openingText">Opening Text</Label>
                <Textarea id="openingText" rows={3} {...register('openingText')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closingText">Closing Text</Label>
                <Textarea id="closingText" rows={3} {...register('closingText')} />
              </div>

              <Button type="submit" disabled={mutation.isPending || !isDirty}>
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {new Date(wedding.weddingDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            {wedding.ceremonyTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Ceremony: {wedding.ceremonyTime}
              </div>
            )}
            {wedding.venueName && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {wedding.venueName}
              </div>
            )}
            <div>
              <Badge variant={wedding.isActive ? 'default' : 'outline'}>
                {wedding.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <Badge variant="secondary" className="font-mono text-xs">
                /{wedding.slug}
              </Badge>
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={toggleActiveMutation.isPending}
                onClick={() => toggleActiveMutation.mutate(!wedding.isActive)}
              >
                {wedding.isActive ? 'Deactivate Event' : 'Activate Event'}
              </Button>
            )}
            {!wedding.isActive && !isAdmin && (
              <p className="text-xs text-muted-foreground">
                This event is not active. Contact your administrator for access.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
