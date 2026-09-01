'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { getSafeUrl } from '@/lib/safeUrl';
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
  backgroundImageUrl?: string;
  itemVariants: Variants;
  alreadySubmitted?: boolean;
};

export function TransferConfirmationForm({
  eventSlug,
  guestToken,
  guestName,
  accounts,
  title,
  description,
  successMessage,
  backgroundImageUrl,
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
        className="w-full max-w-[340px] mx-auto bg-white/10 backdrop-blur-md border border-white/15 rounded-sm p-6 text-center space-y-3"
      >
        <CheckCircle2 size={28} className="mx-auto opacity-90" />
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
      className="w-full max-w-[340px] mx-auto space-y-4 text-left"
    >
      {getSafeUrl(backgroundImageUrl) && (
        <img
          src={getSafeUrl(backgroundImageUrl)!}
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          aria-hidden
        />
      )}

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
            className="w-full bg-white/10 border border-white/15 rounded-sm px-3 py-2 text-[11px] outline-none focus:border-white/40"
          />
        </label>

        {accounts.length > 1 && (
          <label className="block space-y-1">
            <span className="text-[9px] uppercase tracking-[1px] opacity-70">Rekening Tujuan</span>
            <select
              value={selectedAccountIndex}
              onChange={(e) => setSelectedAccountIndex(e.target.value)}
              className="w-full bg-white/10 border border-white/15 rounded-sm px-3 py-2 text-[11px] outline-none"
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
              className="w-full bg-white/10 border border-white/15 rounded-sm px-3 py-2 text-[11px] outline-none"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[9px] uppercase tracking-[1px] opacity-70">Tanggal Transfer</span>
            <input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full bg-white/10 border border-white/15 rounded-sm px-3 py-2 text-[11px] outline-none"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-[9px] uppercase tracking-[1px] opacity-70">Catatan (opsional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-white/10 border border-white/15 rounded-sm px-3 py-2 text-[11px] outline-none resize-none"
          />
        </label>

        <div className="space-y-2">
          <span className="text-[9px] uppercase tracking-[1px] opacity-70 block">Bukti Transfer</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border border-dashed border-white/25 rounded-sm p-4 flex flex-col items-center gap-2 hover:bg-white/5 transition-colors"
          >
            {proofPreview ? (
              <img src={proofPreview} alt="Preview" className="max-h-32 rounded-sm object-contain" />
            ) : (
              <>
                <Upload size={18} className="opacity-70" />
                <span className="text-[10px] opacity-70">Ketuk untuk unggah gambar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && <p className="text-[10px] text-red-300 text-center">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-white/20 hover:bg-white/30 disabled:opacity-50 border border-white/20 rounded-sm py-2.5 text-[10px] uppercase tracking-[2px] font-bold flex items-center justify-center gap-2"
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
    </motion.form>
  );
}
