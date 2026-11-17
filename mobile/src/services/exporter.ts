import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { Platform } from 'react-native'
import { Lang, makeFormatters, translate } from '../i18n'

/* The website only shows toasts ("Relevé en cours de génération (démonstration)").
   On the phone the same buttons really produce a PDF and open the system share sheet
   (save to Files, mail, print…). */

const esc = (s: unknown) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export interface PdfTable {
  head: string[]
  rows: (string | number)[][]
}
export interface PdfDoc {
  title: string
  subtitle?: string
  facts?: [string, string][]
  tables?: { title?: string; table: PdfTable }[]
  note?: string
}

export function buildHtml(doc: PdfDoc, lang: Lang): string {
  const t = (s: string) => esc(translate(lang, s))
  const facts = (doc.facts || [])
    .map(([k, v]) => `<tr><td class="k">${t(k)}</td><td>${esc(v)}</td></tr>`)
    .join('')
  const tables = (doc.tables || [])
    .map(
      ({ title, table }) => `
      ${title ? `<h2>${t(title)}</h2>` : ''}
      <table class="grid"><thead><tr>${table.head.map(h => `<th>${t(h)}</th>`).join('')}</tr></thead>
      <tbody>${
        table.rows.length
          ? table.rows.map(r => `<tr>${r.map((c, i) => `<td${i === r.length - 1 ? ' class="num"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('')
          : `<tr><td colspan="${table.head.length}">${t('Aucune donnée.')}</td></tr>`
      }</tbody></table>`
    )
    .join('')
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#1b2433;margin:32px}
    .brand{letter-spacing:.18em;font-weight:700;color:#0f2a4d;font-size:13px;border-bottom:2px solid #c9a227;padding-bottom:8px;margin-bottom:22px}
    h1{font-family:Georgia,serif;color:#163965;font-size:26px;margin:0 0 4px} h2{font-family:Georgia,serif;color:#163965;font-size:18px;margin:22px 0 8px}
    .sub{color:#66728a;margin:0 0 16px;font-size:13px} td,th{padding:7px 8px;font-size:12.5px;text-align:left;border-bottom:1px solid #dfe4ee}
    th{background:#f3f5f9;color:#163965} td.k{color:#66728a;width:38%} td.num{text-align:right;white-space:nowrap} table{width:100%;border-collapse:collapse}
    .note{margin-top:22px;color:#66728a;font-size:11.5px}
  </style></head><body>
  <div class="brand">CASTELVAL · FINANCE</div>
  <h1>${t(doc.title)}</h1>${doc.subtitle ? `<p class="sub">${esc(doc.subtitle)}</p>` : ''}
  ${facts ? `<table>${facts}</table>` : ''}${tables}
  ${doc.note ? `<p class="note">${t(doc.note)}</p>` : ''}</body></html>`
}

/** Render the document to a PDF file and hand it to the OS share sheet (or print dialog on web). */
export async function exportPdf(doc: PdfDoc, lang: Lang): Promise<'shared' | 'printed' | 'saved'> {
  const html = buildHtml(doc, lang)
  if (Platform.OS === 'web') {
    await Print.printAsync({ html })
    return 'printed'
  }
  const { uri } = await Print.printToFileAsync({ html })
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: translate(lang, doc.title) })
    return 'shared'
  }
  return 'saved'
}

export const money = (n: number, lang: Lang) => makeFormatters(lang, false).R(n)

/** Open the document in the native print/preview sheet without saving a file ("Consulter"). */
export async function previewPdf(doc: PdfDoc, lang: Lang) {
  await Print.printAsync({ html: buildHtml(doc, lang) })
}
