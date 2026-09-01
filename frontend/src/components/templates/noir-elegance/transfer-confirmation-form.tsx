'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Upload, Loader2, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/api-config';

type GiftAccount = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

type TransferConfirmationFormProps = {
  eventSlug: string;
  guestToken: string;
  guestName: string;
  accounts: GiftAccount[];
  title: string;
  description: string;
  successMessage: string;
  itemVariants: Variants;
  alreadySubmitted?: boolean;
};

const inputClassName =
  'noir-transfer-input w-full rounded-sm px-3 py-2 text-[11px] outline-none transition-colors';

export function TransferConfirmationForm({
  eventSlug,
  guestToken,
  guestName,
  accounts,
  title,
  description,
  successMessage,
  itemVariants,
  alreadySubmitted = false,
}: TransferConfirmationFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [senderName, setSenderName] = useState(guestName);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState('0');
  const [amount, setAmount] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(alreadySubmitted);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHasSubmitted(alreadySubmitted);
  }, [alreadySubmitted]);

  const selectedAccount = accounts[Number(selectedAccountIndex)] || accounts[0];

  const handleFileChange = (file: File | null) => {
    setProofFile(file);
    setError(null);
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofPreview(file ? URL.createObjectURL(file) : null);
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
          setHasSubmitted(true);
          toast.info(json.message || 'Konfirmasi transfer sudah pernah dikirim.');
          return;
        }
        throw new Error(json.message || 'Gagal mengirim konfirmasi transfer.');
      }

      setHasSubmitted(true);
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
      <motion.div
        initial="visible"
        animate="visible"
        variants={itemVariants}
        className="noir-transfer-form-panel w-full max-w-[340px] mx-auto p-6 text-center space-y-3"
      >
        <CheckCircle2 size={28} className="mx-auto opacity-90 text-[#C9A962]" />
        <p className="text-[11px] leading-relaxed opacity-90">{successMessage}</p>
        <p className="text-[9px] uppercase tracking-[1.5px] opacity-60">
          Satu undangan cukup satu kali konfirmasi
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial="visible"
      animate="visible"
      variants={itemVariants}
      onSubmit={handleSubmit}
      className="noir-transfer-form w-full max-w-[340px] mx-auto"
    >
      <div className="noir-transfer-form-panel relative z-10 space-y-4 p-5 text-left">
        <div className="space-y-1 text-center">
          <h3 className="text-2xl tracking-[1px]">{title}</h3>
          <p className="text-[10px] opacity-80 leading-relaxed">{description}</p>
        </div>

        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-[9px] uppercase tracking-[1px] opacity-70">Nama Pengirim</span>
            <input
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              required
              className={inputClassName}
            />
          </label>

          {accounts.length > 1 && (
            <label className="block space-y-1">
              <span className="text-[9px] uppercase tracking-[1px] opacity-70">Rekening Tujuan</span>
              <select
                value={selectedAccountIndex}
                onChange={(e) => setSelectedAccountIndex(e.target.value)}
                className={inputClassName}
              >
                {accounts.map((acc, idx) => (
                  <option key={idx} value={String(idx)} className="text-black">
                    {acc.bankName} — {acc.accountNumber}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-[9px] uppercase tracking-[1px] opacity-70">Nominal</span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Rp"
                inputMode="numeric"
                className={inputClassName}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[9px] uppercase tracking-[1px] opacity-70">Tanggal Transfer</span>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className={inputClassName}
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-[9px] uppercase tracking-[1px] opacity-70">Catatan (opsional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={`${inputClassName} resize-none`}
            />
          </label>

          <div className="space-y-2">
            <span className="text-[9px] uppercase tracking-[1px] opacity-70 block">Bukti Transfer</span>
            <div className="noir-transfer-upload w-full rounded-sm p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
              {proofPreview ? (
                <div className="relative w-full space-y-3">
                  <img
                    src={proofPreview}
                    alt="Preview bukti transfer"
                    className="max-h-32 mx-auto rounded-sm object-contain"
                  />
                  <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="noir-transfer-touch-btn text-[10px] uppercase tracking-[1px] min-h-[44px] px-4 rounded-sm border border-white/15 bg-[#333] active:bg-[#9B4D6A] transition-colors"
                    >
                      Ganti Gambar
                    </button>
                    <button
                      type="button"
                      onClick={clearProofImage}
                      className="noir-transfer-touch-btn flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-[#1a1a1a] border border-white/25 text-white active:bg-[#9B4D6A] active:border-[#C9A962] transition-colors"
                      aria-label="Hapus gambar"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 py-2"
                >
                  <Upload size={18} className="opacity-70" />
                  <span className="text-[10px] opacity-70">Ketuk untuk unggah gambar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {error && <p className="text-[10px] text-red-300 text-center">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="noir-transfer-submit w-full rounded-sm py-2.5 text-[10px] uppercase tracking-[2px] font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Mengirim...
            </>
          ) : (
            'Kirim Konfirmasi'
          )}
        </button>
      </div>
    </motion.form>
  );
}
