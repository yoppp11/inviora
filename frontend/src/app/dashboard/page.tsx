'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { WeddingEvent, AdminUser } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Calendar, Users, ExternalLink, Trash2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EventOwnersPanel } from '@/components/wedding/event-owners-panel';

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Only lowercase letters, numbers, and hyphens'),
  groomName: z.string().min(1, 'Groom name is required'),
  brideName: z.string().min(1, 'Bride name is required'),
  weddingDate: z.string().min(1, 'Wedding date is required'),
  ceremonyTime: z.string().optional(),
  receptionTime: z.string().optional(),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  ownerUserId: z.string().min(1, 'Event owner is required'),
  isActive: z.boolean().optional(),
});

type CreateEventForm = z.infer<typeof createEventSchema>;

function EventsList({
  weddings,
  isAdmin,
  onCreateOpen,
  onDelete,
}: {
  weddings: WeddingEvent[];
  isAdmin: boolean;
  onCreateOpen: () => void;
  onDelete: (id: string) => void;
}) {
  if (weddings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <p className="text-muted-foreground mb-4">
            {isAdmin
              ? 'No wedding events yet. Create an event and assign it to an event owner.'
              : 'Your event is not active yet. Please contact your administrator to activate it.'}
          </p>
          {isAdmin && (
            <Button onClick={onCreateOpen} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {weddings.map((wedding) => (
        <Card key={wedding.id} className="group relative">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-lg truncate">{wedding.title}</CardTitle>
                <CardDescription className="truncate">
                  {wedding.groomName} & {wedding.brideName}
                </CardDescription>
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this event?')) {
                      onDelete(wedding.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isAdmin && wedding.user && (
              <p className="text-xs text-muted-foreground truncate">Owner: {wedding.user.name}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge variant={wedding.isActive ? 'default' : 'outline'}>
                {wedding.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="secondary" className="text-xs font-mono">
                /{wedding.slug}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {new Date(wedding.weddingDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 shrink-0" />
              {wedding._count?.guests || 0} guests
            </div>
            <Link href={`/dashboard/events/${wedding.id}`} className="block pt-1">
              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Manage
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isAdmin, isEventOwner } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: weddings, isLoading } = useQuery({
    queryKey: ['weddings'],
    queryFn: async () => {
      const { data } = await api.get('/weddings');
      return data.data as WeddingEvent[];
    },
  });

  const { data: eventOwners } = useQuery({
    queryKey: ['event-owners'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users', { params: { role: 'EVENT_OWNER' } });
      return data.data as AdminUser[];
    },
    enabled: isAdmin,
  });

  useEffect(() => {
    if (isEventOwner && weddings?.length === 1) {
      router.replace(`/dashboard/events/${weddings[0].id}`);
    }
  }, [isEventOwner, weddings, router]);

  const createMutation = useMutation({
    mutationFn: async (input: CreateEventForm) => {
      const { data } = await api.post('/weddings', input);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weddings'] });
      toast.success('Wedding event created!');
      setCreateOpen(false);
      reset();
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || 'Failed to create event');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/weddings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weddings'] });
      toast.success('Wedding event deleted');
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || 'Failed to delete event');
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { isActive: false },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  const eventsContent = (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex justify-end">
          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (!open) reset();
            }}
          >
            <DialogTrigger render={<Button className="w-full sm:w-auto" />}>
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Wedding Event</DialogTitle>
                <DialogDescription>
                  Assign this event to an event owner. Activate it when ready for the owner to access.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={handleSubmit((data) => createMutation.mutate(data))}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Event Owner</Label>
                  <Controller
                    control={control}
                    name="ownerUserId"
                    render={({ field }) => (
                      <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={field.value || ''}
                        onChange={field.onChange}
                      >
                        <option value="">Select event owner...</option>
                        {eventOwners?.map((owner) => (
                          <option key={owner.id} value={owner.id}>
                            {owner.name} ({owner.email})
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.ownerUserId && (
                    <p className="text-sm text-destructive">{errors.ownerUserId.message}</p>
                  )}
                  {eventOwners?.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Create an event owner in the &quot;Event Owners&quot; tab first.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <Input id="title" placeholder="John & Jane Wedding" {...register('title')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Event Slug (URL)</Label>
                  <Input id="slug" placeholder="john-and-jane" {...register('slug')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weddingDate">Wedding Date</Label>
                  <Input id="weddingDate" type="date" {...register('weddingDate')} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(field.value)}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <div>
                        <p className="text-sm font-medium">Activate event immediately</p>
                        <p className="text-xs text-muted-foreground">
                          Event owner can log in and manage this event when active.
                        </p>
                      </div>
                    </label>
                  )}
                />

                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Event'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <EventsList
        weddings={weddings || []}
        isAdmin={isAdmin}
        onCreateOpen={() => setCreateOpen(true)}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">
          {isAdmin ? 'Admin Dashboard' : 'My Wedding Event'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? 'Manage events and event owner accounts'
            : 'Manage your assigned wedding invitation'}
        </p>
      </div>

      {isAdmin ? (
        <Tabs defaultValue="events">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-max min-w-full sm:min-w-0">
              <TabsTrigger value="events" className="text-xs sm:text-sm">
                Events
              </TabsTrigger>
              <TabsTrigger value="owners" className="text-xs sm:text-sm">
                Event Owners
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="events" className="mt-4 sm:mt-6">
            {eventsContent}
          </TabsContent>
          <TabsContent value="owners" className="mt-4 sm:mt-6">
            <EventOwnersPanel />
          </TabsContent>
        </Tabs>
      ) : (
        eventsContent
      )}
    </div>
  );
}
