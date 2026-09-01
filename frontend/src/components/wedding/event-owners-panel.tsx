'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { AdminUser } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const createOwnerSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type CreateOwnerForm = z.infer<typeof createOwnerSchema>;

export function EventOwnersPanel() {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['event-owners'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users', { params: { role: 'EVENT_OWNER' } });
      return data.data as AdminUser[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateOwnerForm) => {
      const { data } = await api.post('/admin/users', {
        name: input.name,
        email: input.email,
        password: input.password,
        role: 'EVENT_OWNER',
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-owners'] });
      toast.success('Event owner account created');
      reset();
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || 'Failed to create account');
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateOwnerForm>({
    resolver: zodResolver(createOwnerSchema),
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-1">Add Event Owner</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Create a login account for an event owner using email and password.
          </p>
          <form
            onSubmit={handleSubmit((data) => createMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="ownerName">Full Name</Label>
              <Input id="ownerName" placeholder="John Doe" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Email</Label>
              <Input
                id="ownerEmail"
                type="email"
                placeholder="owner@example.com"
                autoComplete="off"
                {...register('email')}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerPassword">Password</Label>
              <Input
                id="ownerPassword"
                type="password"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerConfirmPassword">Confirm Password</Label>
              <Input
                id="ownerConfirmPassword"
                type="password"
                placeholder="Repeat password"
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Event Owner'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Registered Event Owners ({users?.length || 0})
        </h3>
        {users?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No event owners yet. Create one using the form.
            </CardContent>
          </Card>
        ) : (
          users?.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
                <Badge variant="secondary" className="w-fit shrink-0">
                  {user._count?.weddingEvents || 0} event(s)
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
