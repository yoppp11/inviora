type InvitationMessageParams = {
  guestName: string;
  groomName: string;
  brideName: string;
  invitationUrl: string;
  weddingDate?: string | null;
  venueName?: string | null;
};

function formatWeddingDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  try {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return null;
  }
}

export function buildInvitationUrl(slug: string, invitationToken: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/invitation/${slug}/${invitationToken}`;
}

export function buildInvitationWhatsAppMessage({
  guestName,
  groomName,
  brideName,
  invitationUrl,
  weddingDate,
  venueName,
}: InvitationMessageParams): string {
  const formattedDate = formatWeddingDate(weddingDate);
  const eventLines: string[] = [];
  if (formattedDate) {
    eventLines.push(`Acara pernikahan akan diselenggarakan pada *${formattedDate}*.`);
  }
  if (venueName?.trim()) {
    eventLines.push(`Lokasi acara: *${venueName.trim()}*.`);
  }
  const eventSection = eventLines.length > 0 ? ['', ...eventLines] : [];

  return [
    `Assalamu'alaikum Warahmatullahi Wabarakatuh`,
    `Salam sejahtera untuk kita semua.`,
    '',
    `Yth. Bapak/Ibu/Saudara/i`,
    `*${guestName}*`,
    '',
    `Dengan penuh rasa syukur dan kebahagiaan, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada pernikahan putra-putri kami:`,
    '',
    `*${groomName}*`,
    `&`,
    `*${brideName}*`,
    ...eventSection,
    '',
    `Kehadiran dan doa restu Bapak/Ibu/Saudara/i merupakan kehormatan dan kebahagiaan bagi kami sekeluarga.`,
    '',
    `Untuk melihat detail lengkap acara, lokasi, serta konfirmasi kehadiran, silakan buka undangan digital kami melalui tautan berikut:`,
    '',
    invitationUrl,
    '',
    `Mohon kesediaannya untuk membuka link di atas dan mengisi konfirmasi kehadiran apabila berkenan hadir.`,
    '',
    `Atas perhatian dan doa restunya, kami ucapkan terima kasih.`,
    '',
    `Wassalamu'alaikum Warahmatullahi Wabarakatuh`,
    '',
    `Kami yang berbahagia,`,
    `Keluarga *${groomName}* & *${brideName}*`,
  ].join('\n');
}

export function formatPhoneForWhatsApp(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('0')) {
    digits = `62${digits.slice(1)}`;
  }

  return digits;
}

export function buildWhatsAppDeepLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  if (!formattedPhone) {
    throw new Error('INVALID_PHONE');
  }

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
