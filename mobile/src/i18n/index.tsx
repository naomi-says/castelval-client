import React from 'react'
import { trText } from './dictionary'

export type Lang = 'fr' | 'en'
export { trText }

export const makeFormatters = (lang: Lang, hide: boolean) => {
  const loc = lang === 'en' ? 'en-GB' : 'fr-FR'
  const R = (n: number) => Number(n).toLocaleString(loc, { style: 'currency', currency: 'EUR' })
  const D = (d: string | number | Date) => new Date(d).toLocaleDateString(loc)
  const N = (n: number) => Number(n).toLocaleString(loc)
  /** Long date, e.g. "6 octobre 2026". */
  const DL = (d: string | number | Date) =>
    new Date(d).toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' })
  /** Amount, masked when the "hide amounts" switch is on (website: E()). */
  const E = (n: number) => (hide ? '••••• €' : R(n))
  /** Whole-euro amount with the masking rule used by the website for wealth totals. */
  const W = (n: number) => (hide ? '••••• €' : N(Math.round(n)) + ' €')
  return { R, D, N, DL, E, W, loc }
}

/** Translate a French source string when English is selected. */
export const translate = (lang: Lang, s: string) => (lang === 'en' ? trText(s) : s)

