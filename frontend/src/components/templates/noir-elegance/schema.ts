import { z } from 'zod';

export const noirEleganceSchema = z.object({
  cover: z
    .object({
      title: z.string().default('Norman & Ayumi'),
      subtitle: z.string().default('THE WEDDING OF'),
      date: z.string().default('Saturday, 25th October 2025'),
      coverImageUrl: z.string().optional(),
      slideshowImages: z.array(z.string()).default([]),
    })
    .default({}),

  verse: z
    .object({
      enabled: z.boolean().default(true),
      sectionLabel: z.string().default('Islam'),
      quote: z
        .string()
        .default(
          '"Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang."'
        ),
      source: z.string().default('QS. Ar-Rum : 21'),
      backgroundImageUrl: z.string().optional(),
    })
    .default({}),

  couple: z
    .object({
      groom: z
        .object({
          name: z.string().default('Norman Utojo'),
          label: z.string().default('THE GROOM'),
          parentDescription: z.string().default('The youngest & only son of'),
          parentNames: z.string().default('Robert Utojo & Lenny Kasim'),
          profileImageUrl: z.string().optional(),
        })
        .default({}),
      bride: z
        .object({
          name: z.string().default('Judee Ayumi Yoshino'),
          label: z.string().default('THE BRIDE'),
          parentDescription: z.string().default('The first & only daughter of'),
          parentNames: z.string().default('Gertrudeis Yoshino & Masato Yoshino'),
          profileImageUrl: z.string().optional(),
        })
        .default({}),
    })
    .default({}),

  story: z
    .object({
      enabled: z.boolean().default(true),
      title: z.string().default('Our Story'),
      backgroundImageUrl: z.string().optional(),
      milestones: z
        .array(
          z.object({
            date: z.string(),
            description: z.string(),
          })
        )
        .default([
          {
            date: '2024',
            description:
              'We met in 2024 — a simple encounter that slowly grew into something meaningful.',
          },
          {
            date: '2024–2025',
            description:
              'Through everyday moments, we built trust, laughter, and a love we chose again and again.',
          },
          {
            date: '2026',
            description:
              'In 2026, we chose to take the next step together — toward marriage and a life we will build side by side.',
          },
        ]),
    })
    .default({}),

  event: z
    .object({
      countdownDate: z.string().default('2027-10-25T13:00:00').describe('Countdown target date (ISO format)'),
      countdownBackgroundImageUrl: z.string().optional().describe('Countdown section background'),
      ceremony: z
        .object({
          title: z.string().default('Holy Matrimony'),
          time: z.string().default('13:00 - 15:00'),
          venue: z.string().default('St. John Church'),
          address: z.string().default('Jl. Melawai Raya, Jakarta Selatan'),
          mapUrl: z.string().optional().describe('Google Maps link'),
        })
        .default({}),
      reception: z
        .object({
          title: z.string().default('Wedding Reception'),
          time: z.string().default('19:00 - 22:00'),
          venue: z.string().default('Grand Ballroom'),
          address: z.string().default('Jl. Sudirman, Jakarta Pusat'),
          mapUrl: z.string().optional().describe('Google Maps link'),
        })
        .default({}),
      backgroundImageUrl: z.string().optional().describe('Event section background'),
    })
    .default({}),

  dressCode: z
    .object({
      enabled: z.boolean().default(true),
      description: z
        .string()
        .default(
          'We kindly encourage our guests to wear formal attire in the suggested color palette, if possible.'
        ),
      colors: z.array(z.string()).default(['#F1F1F1', '#97948D', '#646C57', '#1B1E17']),
      backgroundImageUrl: z.string().optional(),
    })
    .default({}),

  gift: z
    .object({
      enabled: z.boolean().default(true),
      title: z.string().default('Wedding Gift'),
      description: z
        .string()
        .default('To our honored guests wishing to give a token of love, please use the account number below.'),
      thumbnailImageUrl: z.string().optional(),
      backgroundImageUrl: z.string().optional(),
      accounts: z
        .array(
          z.object({
            bankName: z.string(),
            accountNumber: z.string(),
            accountHolder: z.string(),
          })
        )
        .default([
          { bankName: 'Bank BCA', accountNumber: '1234567890', accountHolder: 'Norman Utojo' },
        ]),
    })
    .default({}),

  transferConfirmation: z
    .object({
      enabled: z.boolean().default(true),
      title: z.string().default('Konfirmasi Transfer'),
      description: z
        .string()
        .default(
          'Setelah melakukan transfer, mohon isi formulir di bawah dan unggah bukti transfer agar kami dapat mencatatnya dengan baik.'
        ),
      successMessage: z
        .string()
        .default('Terima kasih! Konfirmasi transfer Anda telah kami terima.'),
      backgroundImageUrl: z.string().optional(),
    })
    .default({}),

  music: z
    .object({
      enabled: z.boolean().default(false),
      trackUrl: z.string().optional(),
    })
    .default({}),

  gallery: z
    .object({
      title: z.string().default('OUR PRE-WEDDING CELEBRATION'),
      images: z.array(z.string()).default([]),
    })
    .default({}),

  closing: z
    .object({
      title: z.string().default('Thank you!'),
      text: z.string().default('We would be honored to have you join us for this special moment.'),
      backgroundImageUrl: z.string().optional(),
      instagramUrl: z
        .string()
        .default(
          'https://www.instagram.com/yfiiinn?igsi=MTF1cGo1bDdudnhkcg%3D%3D&utm_source=qr'
        )
        .describe('Instagram profile link'),
    })
    .default({}),
});

export type NoirEleganceContent = z.infer<typeof noirEleganceSchema>;
