'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { TransferConfirmation } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ListPagination, ListSearch } from '@/components/wedding/list-controls';
import { ExternalLink, Receipt } from 'lucide-react';

const TRANSFER_PAGE_SIZE = 5;

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
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['transfer-confirmations', weddingId],
    queryFn: async () => {
      const { data: res } = await api.get(`/weddings/${weddingId}/transfer-confirmations`);
      return res.data as TransferConfirmation[];
    },
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const all = data ?? [];
    if (!query) return all;
    return all.filter((item) =>
      [item.senderName, item.guestName, item.bankName, item.accountNumber, item.notes ?? '', String(item.amount ?? '')]
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / TRANSFER_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((currentPage - 1) * TRANSFER_PAGE_SIZE, currentPage * TRANSFER_PAGE_SIZE),
    [filtered, currentPage]
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length !== data.length
            ? `${filtered.length} dari ${data.length} konfirmasi transfer`
            : `${data.length} konfirmasi transfer diterima`}
        </p>
        <ListSearch
          value={search}
          onChange={handleSearchChange}
          placeholder="Cari pengirim, tamu, atau bank"
          label="Cari konfirmasi transfer"
          className="sm:w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-sm text-muted-foreground">
            <p>Tidak ada konfirmasi yang cocok dengan &ldquo;{search.trim()}&rdquo;.</p>
            <Button variant="outline" size="sm" onClick={() => handleSearchChange('')}>
              Hapus pencarian
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {paged.map((item) => (
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
      )}

      <ListPagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={TRANSFER_PAGE_SIZE}
        onPageChange={setPage}
        itemLabel="konfirmasi"
      />
    </div>
  );
}
