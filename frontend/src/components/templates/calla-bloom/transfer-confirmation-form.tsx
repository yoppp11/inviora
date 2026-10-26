'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/api-config';
import type { CallaBloomContent } from './schema';

type GiftAccount = CallaBloomContent['gift']['accounts'][number];

type TransferConfirmationFormProps = {
  eventSlug: string;
  guestToken: string;
  guestName: string;
  accounts: GiftAccount[];
  title: string;
  description: string;
  successMessage: string;
  alreadySubmitted?: boolean;
};

const PROOF_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

export function TransferConfirmationForm({
  eventSlug,
  guestToken,
  guestName,
  accounts,
  title,
  description,
  successMessage,
  alreadySubmitted = false,
}: TransferConfirmationFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [senderName, setSenderName] = useState(guestName);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState('0');
  const [amount, setAmount] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSubmitted = alreadySubmitted || justSubmitted;

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const selectedAccount = accounts[Number(selectedAccountIndex)] || accounts[0];

  const handleFileChange = (file: File | null) => {
    setProofFile(file);
    setError(null);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = file ? URL.createObjectURL(file) : null;
    setProofPreview(previewUrlRef.current);
  };

  const clearProofImage = () => {
    handleFileChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetForm = () => {
    setSenderName(guestName);
    setAmount('');
    setTransferDate('');
    setNotes('');
    handleFileChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasSubmitted) {
      toast.info('Anda sudah mengirim konfirmasi transfer untuk undangan ini.');
      return;
    }

    if (!proofFile) {
      setError('Mohon unggah bukti transfer.');
      return;
    }
    if (!selectedAccount) {
      setError('Rekening tujuan belum tersedia.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const apiUrl = getApiBaseUrl();
      const formData = new FormData();
      formData.append('senderName', senderName.trim());
      formData.append('bankName', selectedAccount.bankName);
      formData.append('accountNumber', selectedAccount.accountNumber);
      formData.append('accountHolder', selectedAccount.accountHolder);
      if (amount.trim()) formData.append('amount', amount.trim());
      if (transferDate) formData.append('transferDate', transferDate);
      if (notes.trim()) formData.append('notes', notes.trim());
      formData.append('proof', proofFile);

      const response = await fetch(
        `${apiUrl}/public/invitations/${eventSlug}/${guestToken}/transfer-confirmations`,
        { method: 'POST', body: formData }
      );

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 409) {
          setJustSubmitted(true);
          toast.info(json.message || 'Konfirmasi transfer sudah pernah dikirim.');
          return;
        }
        throw new Error(json.message || 'Gagal mengirim konfirmasi transfer.');
      }

      setJustSubmitted(true);
      resetForm();
      toast.success(successMessage);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal mengirim konfirmasi transfer.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubmitted) {
    return (
      <div className="cb-transfer-success">
        <CheckCircle2 className="cb-transfer-success-icon" aria-hidden="true" />
        <p className="cb-transfer-success-text">{successMessage}</p>
        <p className="cb-transfer-success-note">Satu undangan cukup satu kali konfirmasi</p>
      </div>
    );
  }

  return (
    <form className="cb-transfer-form" onSubmit={handleSubmit}>
      <div className="cb-transfer-head">
        <h2 className="cb-transfer-title">{title}</h2>
        <p className="cb-transfer-desc">{description}</p>
      </div>

      <div className="cb-transfer-fields">
        <label className="cb-transfer-field">
          <span className="cb-transfer-label">Nama Pengirim</span>
          <input
            className="cb-transfer-input"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            required
          />
        </label>

        {accounts.length > 1 && (
          <label className="cb-transfer-field">
            <span className="cb-transfer-label">Rekening Tujuan</span>
            <select
              className="cb-transfer-input cb-transfer-select"
              value={selectedAccountIndex}
              onChange={(e) => setSelectedAccountIndex(e.target.value)}
            >
              {accounts.map((acc, idx) => (
                <option key={idx} value={String(idx)}>
                  {acc.bankName} — {acc.accountNumber}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="cb-transfer-row">
          <label className="cb-transfer-field">
            <span className="cb-transfer-label">Nominal</span>
            <input
              className="cb-transfer-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Rp"
              inputMode="numeric"
            />
          </label>
          <label className="cb-transfer-field">
            <span className="cb-transfer-label">Tanggal Transfer</span>
            <input
              className="cb-transfer-input cb-transfer-date"
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
            />
          </label>
        </div>

        <label className="cb-transfer-field">
          <span className="cb-transfer-label">Catatan (opsional)</span>
          <textarea
            className="cb-transfer-input cb-transfer-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </label>

        <div className="cb-transfer-field">
          <span className="cb-transfer-label">Bukti Transfer</span>
          <input
            ref={fileInputRef}
            type="file"
            accept={PROOF_ACCEPT}
            className="cb-transfer-file"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />
          {proofPreview ? (
            <div className="cb-transfer-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={proofPreview} alt="Pratinjau bukti transfer" />
              <div className="cb-transfer-preview-actions">
                <button
                  type="button"
                  className="cb-transfer-ghost"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Ganti Gambar
                </button>
                <button
                  type="button"
                  className="cb-transfer-remove"
                  onClick={clearProofImage}
                  aria-label="Hapus gambar"
                >
                  <X aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="cb-transfer-upload"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload aria-hidden="true" />
              <span>Ketuk untuk unggah gambar</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="cb-transfer-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="cb-transfer-submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="cb-transfer-spin" aria-hidden="true" />
            Mengirim...
          </>
        ) : (
          'Kirim Konfirmasi'
        )}
      </button>
    </form>
  );
}
