'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { pickContact, isContactPickerSupported, type PickedContact } from '@/lib/contact-picker';
import {
  buildInvitationUrl,
  buildInvitationWhatsAppMessage,
  buildWhatsAppDeepLink,
} from '@/lib/invitation-share';
import type { Guest, CsvImportResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Upload,
  Trash2,
  Pencil,
  Copy,
  Check,
  AlertCircle,
  FileSpreadsheet,
  MessageCircle,
} from 'lucide-react';

const guestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
});

type GuestForm = z.infer<typeof guestSchema>;

interface GuestManagerProps {
  weddingId: string;
  weddingSlug: string;
  groomName: string;
  brideName: string;
  weddingDate?: string | null;
  venueName?: string | null;
}

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
}

export function GuestManager({
  weddingId,
  weddingSlug,
  groomName,
  brideName,
  weddingDate,
  venueName,
}: GuestManagerProps) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false);
  const [whatsAppGuestContext, setWhatsAppGuestContext] = useState<Guest | undefined>();

  useEffect(() => {
    setIsMobile(isMobileViewport());
  }, []);

  const { data: guests, isLoading } = useQuery({
    queryKey: ['guests', weddingId],
    queryFn: async () => {
      const { data } = await api.get(`/weddings/${weddingId}/guests`);
      return data.data as Guest[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: GuestForm) => {
      const { data } = await api.post(`/weddings/${weddingId}/guests`, input);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['wedding', weddingId] });
      toast.success('Guest added');
      setAddOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add guest');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: GuestForm & { id: string }) => {
      const { data } = await api.patch(`/weddings/${weddingId}/guests/${id}`, input);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', weddingId] });
      toast.success('Guest updated');
      setEditGuest(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update guest');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (guestId: string) => {
      await api.delete(`/weddings/${weddingId}/guests/${guestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['wedding', weddingId] });
      toast.success('Guest removed');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to remove guest');
    },
  });

  const copyLink = (guest: Guest) => {
    const url = buildInvitationUrl(weddingSlug, guest.invitationToken);
    navigator.clipboard.writeText(url);
    setCopiedId(guest.id);
    toast.success('Invitation link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deliverWhatsAppInvitation = useCallback(
    async (contact: PickedContact, existingGuest?: Guest) => {
      let guest = existingGuest;
      if (!guest) {
        const matchedGuest = guests?.find(
          (g) => g.name.trim().toLowerCase() === contact.name.trim().toLowerCase()
        );
        if (matchedGuest) {
          guest = matchedGuest;
        } else {
          const { data } = await api.post(`/weddings/${weddingId}/guests`, {
            name: contact.name,
          });
          guest = data.data as Guest;
          queryClient.invalidateQueries({ queryKey: ['guests', weddingId] });
          queryClient.invalidateQueries({ queryKey: ['wedding', weddingId] });
        }
      }

      const invitationUrl = buildInvitationUrl(weddingSlug, guest.invitationToken);
      const message = buildInvitationWhatsAppMessage({
        guestName: contact.name,
        groomName,
        brideName,
        invitationUrl,
        weddingDate,
        venueName,
      });
      const whatsappUrl = buildWhatsAppDeepLink(contact.phone, message);

      window.location.href = whatsappUrl;
    },
    [guests, weddingId, weddingSlug, groomName, brideName, weddingDate, venueName, queryClient]
  );

  const sendViaWhatsApp = useCallback(
    async (existingGuest?: Guest) => {
      if (!isContactPickerSupported()) {
        setWhatsAppGuestContext(existingGuest);
        setWhatsAppDialogOpen(true);
        return;
      }

      setIsSendingWhatsApp(true);
      try {
        const contact = await pickContact();
        await deliverWhatsAppInvitation(contact, existingGuest);
      } catch (err) {
        if (err instanceof Error) {
          switch (err.message) {
            case 'CONTACT_PICKER_UNSUPPORTED':
              setWhatsAppGuestContext(existingGuest);
              setWhatsAppDialogOpen(true);
              break;
            case 'CONTACT_PICKER_CANCELLED':
              break;
            case 'CONTACT_NAME_MISSING':
              toast.error('Kontak harus memiliki nama.');
              break;
            case 'CONTACT_PHONE_MISSING':
              toast.error('Kontak harus memiliki nomor telepon.');
              break;
            case 'INVALID_PHONE':
              toast.error('Nomor telepon kontak tidak valid.');
              break;
            default:
              toast.error(err.message || 'Gagal mengirim undangan via WhatsApp.');
          }
        }
      } finally {
        setIsSendingWhatsApp(false);
      }
    },
    [deliverWhatsAppInvitation]
  );

  const handleWhatsAppManualSubmit = useCallback(
    async (contact: PickedContact) => {
      setIsSendingWhatsApp(true);
      try {
        await deliverWhatsAppInvitation(contact, whatsAppGuestContext);
        setWhatsAppDialogOpen(false);
        setWhatsAppGuestContext(undefined);
      } catch (err) {
        if (err instanceof Error && err.message === 'INVALID_PHONE') {
          toast.error('Nomor telepon tidak valid.');
        } else {
          toast.error(
            err instanceof Error ? err.message : 'Gagal mengirim undangan via WhatsApp.'
          );
        }
      } finally {
        setIsSendingWhatsApp(false);
      }
    },
    [deliverWhatsAppInvitation, whatsAppGuestContext]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Guest List</h2>
          <p className="text-sm text-muted-foreground">
            {guests?.length || 0} guests
          </p>
        </div>
        <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
          {isMobile && (
            <Button
              variant="outline"
              onClick={() => sendViaWhatsApp()}
              disabled={isSendingWhatsApp}
              className="w-full sm:w-auto border-green-600/40 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {isSendingWhatsApp ? 'Memproses...' : 'Kirim via WhatsApp'}
            </Button>
          )}
          <Button variant="outline" onClick={() => setImportOpen(true)} className="w-full sm:w-auto">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={() => setAddOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Guest
          </Button>
        </div>
      </div>

      {guests && guests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No guests added yet
            </p>
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              {isMobile && (
                <Button
                  variant="outline"
                  onClick={() => sendViaWhatsApp()}
                  disabled={isSendingWhatsApp}
                  className="border-green-600/40 text-green-700 dark:text-green-400"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Kirim via WhatsApp
                </Button>
              )}
              <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Guest
              </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden md:block">
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guests?.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell className="font-medium">{guest.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {guest.address || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyLink(guest)}
                              title="Copy invitation link"
                            >
                              {copiedId === guest.id ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditGuest(guest)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => {
                                if (confirm(`Remove ${guest.name}?`)) {
                                  deleteMutation.mutate(guest.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          <div className="md:hidden space-y-3">
            {guests?.map((guest) => (
              <Card key={guest.id}>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="font-medium">{guest.name}</p>
                    <p className="text-sm text-muted-foreground">{guest.address || 'No address'}</p>
                  </div>
                  <div className="flex gap-2">
                    {isMobile && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-green-600/40 text-green-700 dark:text-green-400"
                        onClick={() => sendViaWhatsApp(guest)}
                        disabled={isSendingWhatsApp}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Kirim WA
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className={isMobile ? '' : 'flex-1'}
                      onClick={() => copyLink(guest)}
                    >
                      {copiedId === guest.id ? (
                        <Check className="h-4 w-4 mr-1 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      Copy Link
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditGuest(guest)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`Remove ${guest.name}?`)) {
                          deleteMutation.mutate(guest.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Add Guest Dialog */}
      <GuestDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        title="Add Guest"
      />

      {/* Edit Guest Dialog */}
      <GuestDialog
        open={!!editGuest}
        onOpenChange={(open) => !open && setEditGuest(null)}
        onSubmit={(data) =>
          editGuest && updateMutation.mutate({ ...data, id: editGuest.id })
        }
        isLoading={updateMutation.isPending}
        title="Edit Guest"
        defaultValues={editGuest ? { name: editGuest.name, address: editGuest.address || '' } : undefined}
      />

      {/* CSV Import Dialog */}
      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        weddingId={weddingId}
      />

      <WhatsAppRecipientDialog
        open={whatsAppDialogOpen}
        onOpenChange={(open) => {
          setWhatsAppDialogOpen(open);
          if (!open) setWhatsAppGuestContext(undefined);
        }}
        defaultName={whatsAppGuestContext?.name}
        isLoading={isSendingWhatsApp}
        onSubmit={handleWhatsAppManualSubmit}
      />
    </div>
  );
}

const whatsAppRecipientSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  phone: z.string().min(8, 'Nomor WhatsApp wajib diisi'),
});

type WhatsAppRecipientForm = z.infer<typeof whatsAppRecipientSchema>;

function WhatsAppRecipientDialog({
  open,
  onOpenChange,
  defaultName,
  isLoading,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName?: string;
  isLoading: boolean;
  onSubmit: (contact: PickedContact) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WhatsAppRecipientForm>({
    resolver: zodResolver(whatsAppRecipientSchema),
    defaultValues: { name: defaultName || '', phone: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ name: defaultName || '', phone: '' });
    }
  }, [open, defaultName, reset]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset({ name: '', phone: '' });
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kirim Undangan via WhatsApp</DialogTitle>
          <DialogDescription>
            Safari tidak mendukung import kontak langsung. Isi nama dan nomor WhatsApp penerima
            undangan, lalu pesan siap kirim akan dibuka di WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((data) => {
            onSubmit({ name: data.name.trim(), phone: data.phone.trim() });
            reset({ name: '', phone: '' });
          })}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="waRecipientName">Nama Penerima</Label>
            <Input
              id="waRecipientName"
              autoComplete="name"
              placeholder="Contoh: Budi Santoso"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="waRecipientPhone">Nomor WhatsApp</Label>
            <Input
              id="waRecipientPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Contoh: 081234567890"
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Memproses...' : 'Buka WhatsApp'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GuestDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  title,
  defaultValues,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GuestForm) => void;
  isLoading: boolean;
  title: string;
  defaultValues?: GuestForm;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GuestForm>({
    resolver: zodResolver(guestSchema),
    defaultValues: defaultValues || { name: '', address: '' },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((data) => {
            onSubmit(data);
            reset();
          })}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="guestName">Name</Label>
            <Input id="guestName" {...register('name')} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="guestAddress">Address</Label>
            <Input id="guestAddress" {...register('address')} />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Saving...' : title === 'Add Guest' ? 'Add Guest' : 'Save Changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CsvImportDialog({
  open,
  onOpenChange,
  weddingId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weddingId: string;
}) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<CsvImportResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const { data } = await api.post(
        `/weddings/${weddingId}/guests/import/preview`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setPreview(data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to parse CSV');
      setPreview(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post(
        `/weddings/${weddingId}/guests/import`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      toast.success(`Imported ${data.data.imported} guests`);
      queryClient.invalidateQueries({ queryKey: ['guests', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['wedding', weddingId] });
      onOpenChange(false);
      setPreview(null);
      setFile(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setPreview(null);
          setFile(null);
        }
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Guests from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import guests in bulk.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
          <p className="font-medium">Format CSV yang didukung:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>
              Kolom wajib: <code>name</code> (nama tamu)
            </li>
            <li>
              Kolom opsional: <code>address</code> (alamat tamu)
            </li>
            <li>Baris pertama harus berisi header kolom</li>
            <li>File harus berformat <code>.csv</code> (maks. 2MB)</li>
          </ul>
          <pre className="mt-2 rounded bg-background p-3 text-xs overflow-x-auto">
{`name,address
Budi Santoso,Jl. Melati No. 10 Jakarta
Ani Wijaya,Jl. Mawar No. 5 Bandung
Charles & Family,`}
          </pre>
          <p className="text-xs text-muted-foreground">
            Nama kolom tidak case-sensitive (<code>Name</code> dan <code>name</code> sama).
            Kolom <code>address</code> boleh dikosongkan.
          </p>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              {file ? file.name : 'Select a CSV file'}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFile}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={isParsing}
            >
              {isParsing ? 'Parsing...' : 'Choose File'}
            </Button>
          </div>

          {preview && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <Badge variant="secondary">
                  {preview.validRows} valid
                </Badge>
                {preview.invalidRows > 0 && (
                  <Badge variant="destructive">
                    {preview.invalidRows} invalid
                  </Badge>
                )}
              </div>

              {preview.errors.length > 0 && (
                <Card className="border-destructive/50">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      Validation Errors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-0 pb-3">
                    <ul className="text-sm space-y-1">
                      {preview.errors.map((err, i) => (
                        <li key={i} className="text-muted-foreground">
                          Row {err.row}: {err.message}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {preview.guests && preview.guests.length > 0 && (
                <div className="max-h-48 overflow-y-auto border rounded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.guests.slice(0, 20).map((g, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{g.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {g.address || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {preview.guests.length > 20 && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                            ...and {preview.guests.length - 20} more
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleImport}
                disabled={isImporting || preview.validRows === 0}
              >
                {isImporting
                  ? 'Importing...'
                  : `Import ${preview.validRows} Guests`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
