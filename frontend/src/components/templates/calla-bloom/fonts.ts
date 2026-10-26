import { Poppins, Single_Day } from 'next/font/google';

/** Handwritten display face used by the reference (headings, names, calendar month). */
export const callaHandFont = Single_Day({
  weight: '400',
  display: 'swap',
  variable: '--cb-font-hand',
});

/** Geometric sans used for body copy, calendar digits and the countdown. */
export const callaSansFont = Poppins({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--cb-font-sans',
});
