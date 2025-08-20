import type { NextApiRequest, NextApiResponse } from 'next'
import * as cheerio from 'cheerio'
import * as XLSX from 'xlsx'

const PAGE_BY_AMB: Record<number, string> = {
  1: 'https://www.estadisticaciudad.gob.ar/eyc/?p=157955', // 1 amb usados por barrio
  2: 'https://www.estadisticaciudad.gob.ar/eyc/?p=157927', // 2 amb usados por barrio
  3: 'https://www.estadisticaciudad.gob.ar/eyc/?p=157931', // 3 amb usados por barrio
};

function normalizeBarrio(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g,' ').trim().toLowerCase();
}

async function fetchExcelUrl(pageUrl: string): Promise<string> {
  const html = await (await fetch(pageUrl)).text();
  const $ = cheerio.load(html);
  const href = $('a').map((_, a) => ($(a).attr('href')||'')).get().find(h => h.toLowerCase().endsWith('.xlsx'));
  if (!href) throw new Error('No se encontró XLSX en la página IDECBA');
  return href;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const barrioRaw = (req.query.barrio as string || '').trim();
    const amb = Math.max(1, Math.min(3, parseInt(String(req.query.amb||'2'), 10) || 2));
    if (!barrioRaw) return res.status(400).json({ error: 'Falta ?barrio=' });

    const pageUrl = PAGE_BY_AMB[amb];
    const xlsxUrl = await fetchExcelUrl(pageUrl);
    const buf = await (await fetch(xlsxUrl)).arrayBuffer();
    const wb = XLSX.read(Buffer.from(buf));
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const header = rows[0] as string[];
    const barrioColIdx = header.findIndex(h => normalizeBarrio(String(h)).includes('barrio'));

    const target = normalizeBarrio(barrioRaw);
    let foundVal: number | null = null;
    let periodo: string | null = null;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[barrioColIdx]) continue;
      const b = normalizeBarrio(String(row[barrioColIdx]));
      if (b === target || b.includes(target) || target.includes(b)) {
        for (let c = header.length - 1; c >= 0; c--) {
          const v = row[c];
          if (typeof v === 'number') { foundVal = v; periodo = String(header[c]); break; }
        }
        if (foundVal) break;
      }
    }
    if (!foundVal) throw new Error(`No se encontró valor para el barrio "${barrioRaw}"`);

    res.status(200).json({ ok: true, usd_m2: foundVal, periodo, fuente: 'IDECBA (GCBA) sobre base Argenprop', fuente_url: xlsxUrl, pagina_indicador: pageUrl });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'error desconocido' });
  }
}
