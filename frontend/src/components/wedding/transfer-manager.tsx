'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { TransferConfirmation } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Receipt } from 'lucide-react';

function formatAmount(amount: string | number | null | undefined) {
  if (amount === null || amount === undefined || amount === '') return '—';
  const num = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(num)) return '—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function TransferManager({ weddingId }: { weddingId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['transfer-confirmations', weddingId],
    queryFn: async () => {
      const { data: res } = await api.get(`/weddings/${weddingId}/transfer-confirmations`);
      return res.data as TransferConfirmation[];
    },
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!data?.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          <Receipt className="h-8 w-8 mx-auto mb-3 opacity-40" />
          Belum ada konfirmasi transfer dari tamu.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {data.length} konfirmasi transfer diterima
        </p>
      </div>

      <div className="space-y-3">
        {data.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.senderName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Tamu undangan: {item.guestName}
                  </p>
                </div>
                <Badge variant="secondary" className="w-fit shrink-0">
                  {formatAmount(item.amount)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Bank / Rekening</p>
                  <p>
                    {item.bankName} — {item.accountNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.accountHolder}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal Transfer</p>
                  <p>{formatDate(item.transferDate)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dikirim: {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>

              {item.notes && (
                <p className="text-sm text-muted-foreground border-l-2 pl-3">{item.notes}</p>
              )}

              <a
                href={item.proofImageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Lihat bukti transfer
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
