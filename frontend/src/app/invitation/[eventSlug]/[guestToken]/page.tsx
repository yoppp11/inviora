'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { InvitationData } from '@/types';
import { TemplateRenderer } from '@/components/wedding/template-renderer';

export default function InvitationPage() {
  const params = useParams();
  const eventSlug = params.eventSlug as string;
  const guestToken = params.guestToken as string;

  const [data, setData] = useState<InvitationData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    fetch(`${apiUrl}/public/invitations/${eventSlug}/${guestToken}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((json) => {
        setData({
          ...json.data,
          invitationMeta: { eventSlug, guestToken },
          hasTransferConfirmation: Boolean(json.data.hasTransferConfirmation),
        });
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [eventSlug, guestToken]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full mx-auto" />
          <p className="text-sm text-neutral-500 mt-4">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center px-6">
          <h1 className="text-2xl font-serif mb-2">Invitation Not Found</h1>
          <p className="text-neutral-500">
            The invitation you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return <TemplateRenderer data={data} />;
}
