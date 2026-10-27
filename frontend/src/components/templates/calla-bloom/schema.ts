import { z } from 'zod';

/**
 * Editable content for the "Calla Bloom" template.
 *
 * Empty strings mean "derive from the wedding event" (names, date, times, venue, map),
 * so no guest or event information is hardcoded in the template.
 * Field names intentionally avoid the words "audio" / "music" (music is configured
 * through the shared Background Music form via templateConfig.musicEnabled / musicUrl).
 */
export const callaBloomSchema = z.object({
  cover: z
    .object({
      subtitle: z.string().default('The Wedding Of'),
      title: z.string().default('').describe('Leave empty to use the couple names'),
      dateLabel: z
        .string()
        .default('')
        .describe('Leave empty to format the wedding date as a long Indonesian date'),
      greeting: z.string().default('Dear,'),
      openLabel: z.string().default('Open Invitation'),
      autoPlaySong: z
        .boolean()
        .default(true)
        .describe(
          'Start the background song as soon as the cover is opened. Turn off to require the guest to tap the music button.'
        ),
      coverImageUrl: z
        .string()
        .optional()
        .describe('Optional photo shown behind the cover; the text stays readable on top of it'),
    })
    .default({}),

  hero: z
    .object({
      titleLine1: z.string().default('These Kids'),
      titleLine2: z.string().default('are Getting'),
      titleLine3: z.string().default('Married'),
      dateLabel: z
        .string()
        .default('')
        .describe('Leave empty to use the wedding date formatted as DD.MM.YY'),
      hintLine1: z.string().default('Tap to'),
      hintLine2: z.string().default('Play Music'),
    })
    .default({}),

  couple: z
    .object({
      headingLine1: z.string().default('Celebrating'),
      headingLine2: z.string().default('The Wedding of'),
      brideName: z.string().default('').describe('Leave empty to use the bride name of the wedding'),
      brideParents: z.string().default('Putri Kedua dari Bapak & Ibu'),
      brideOrigin: z.string().default(''),
      groomName: z.string().default('').describe('Leave empty to use the groom name of the wedding'),
      groomParents: z.string().default('Putra Pertama dari Bapak & Ibu'),
      groomOrigin: z.string().default(''),
      brideFaceImageUrl: z
        .string()
        .optional()
        .describe('Optional replacement for the illustrated bride portrait'),
      groomFaceImageUrl: z
        .string()
        .optional()
        .describe('Optional replacement for the illustrated groom portrait'),
      tagsImageUrl: z
        .string()
        .optional()
        .describe('Optional replacement for the illustrated corduroy tags'),
    })
    .default({}),

  countdown: z
    .object({
      heading: z.string().default('Our Big Day Awaits'),
      targetDate: z
        .string()
        .default('')
        .describe('Countdown target (ISO format). Leave empty to use the wedding date'),
      daysLabel: z.string().default('DAYS'),
      hoursLabel: z.string().default('HOURS'),
      minutesLabel: z.string().default('MINUTES'),
      secondsLabel: z.string().default('SECONDS'),
    })
    .default({}),

  schedule: z
    .object({
      akadTitle: z.string().default('AKAD'),
      akadDateLabel: z.string().default('').describe('Leave empty to format the wedding date'),
      akadTimeLabel: z.string().default('').describe('Leave empty to use the ceremony time'),
      receptionTitle: z.string().default('RESEPSI'),
      receptionDateLabel: z.string().default('').describe('Leave empty to format the wedding date'),
      receptionTimeLabel: z.string().default('').describe('Leave empty to use the reception time'),
    })
    .default({}),

  location: z
    .object({
      title: z.string().default('LOKASI'),
      venueName: z.string().default('').describe('Leave empty to use the venue of the wedding'),
      mapEmbedUrl: z
        .string()
        .default('')
        .describe('Optional Google Maps embed URL. Leave empty to build it from the venue'),
    })
    .default({}),

  gift: z
    .object({
      titleLine1: z.string().default('Wedding'),
      titleLine2: z.string().default('Gift'),
      description: z
        .string()
        .default(
          'Doa restu anda merupakan karunia yang sangat berarti bagi kami. Dan jika memberi adalah ungkapan tanda kasih, anda dapat memberi melalui dibawah ini:'
        ),
      accounts: z
        .array(
          z.object({
            bankName: z.string(),
            accountNumber: z.string(),
            accountHolder: z.string(),
          })
        )
        .default([]),
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
    })
    .default({}),

  verse: z
    .object({
      text: z
        .string()
        .default(
          'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.'
        ),
    })
    .default({}),

  closing: z
    .object({
      titleLine1: z.string().default('See You at ..'),
      titleLine2: z.string().default('Our Wedding Day'),
      signOff: z.string().default('With Love,'),
    })
    .default({}),
});

export type CallaBloomContent = z.infer<typeof callaBloomSchema>;
