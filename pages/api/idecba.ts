import * as cheerio from "cheerio";
import XLSX from "xlsx";

const PAGES: Record<number, string> = {
  1: "https://www.estadisticaciudad.gob.ar/eyc/?p=157955",
  2: "https://www.estadisticaciudad.gob.ar/eyc/?p=157927",
  3: "https://www.estadisticaciudad.gob.ar/eyc/?p=157931",
};

const FALLBACK = {
  periodo: "Último período (fallback)",
  data: {
    "palermo": { 1: 2900, 2: 3000, 3: 3100 },
    "recoleta": { 1: 2800, 2: 2900, 3: 3000 },
    "retiro": { 1: 3100, 2: 3250, 3: 3400 },
    "belgrano": { 1: 2600, 2: 2750, 3: 2900 },
    "caballito": { 1: 2200, 2: 2350, 3: 2450 },
    "villa urquiza": { 1: 2300, 2: 2400, 3: 2500 },
    "colegiales": { 1: 2500, 2: 2650, 3: 2800 },
    "nuñez": { 1: 2550, 2: 2700, 3: 2850 },
    "puerto madero": { 1: 5200, 2: 5500, 3: 5800 },
    "almagro": { 1: 2050, 2: 2200, 3: 2300 },
    "boedo": { 1: 1900, 2: 2050, 3: 2150 },
    "san nicolas": { 1: 2100, 2: 2250, 3: 2350 },
    "san telmo": { 1: 2100, 2: 2250, 3: 2350 }
  }
};

const norm = (s: string) =>
  String(s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

async function getXlsxUrl(pageUrl: string): Promise<string> {
  const html = await (await fetch(pageUrl)).text();
  const $ = cheerio.load(html);
  let href = $('a[href$=".xlsx"]').first().attr("href");
  if (!href) {
    const m = html.match(/href="([^"]+\.xlsx)"/i);
    href = m?.[1];
  }
  if (!href) throw new Error("No se encontró XLSX en IDECBA");
  if (!/^https?:\/\//i.test(href)) {
    const u = new URL(href, pageUrl);
    href = u.href;
  }
  return href;
}

export default async function handler(req: any, res: any) {
  const amb = Math.max(1, Math.min(3, parseInt(String(req.query.amb ?? "2"), 10)));
  try {
    const page = PAGES[amb] || PAGES[2];
    const xlsxUrl = await getXlsxUrl(page);

    const buf = await (await fetch(xlsxUrl)).arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    const header = rows[0] || [];
    let last = header.length - 1;
    while (last > 0 && typeof rows[1]?.[last] !== "number") last--;
    const periodo: string = header[last] || "Último período";

    const data: Record<string, number> = {};
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      const barrio = norm(row[0]);
      const val = Number(row[last]);
      if (barrio && val > 0) data[barrio] = val;
    }

    return res.status(200).json({ periodo, data });
  } catch (e) {
    const periodo = FALLBACK.periodo;
    const base: Record<string, number> = {};
    Object.entries(FALLBACK.data).forEach(([b, obj]) => {
      base[b] = (obj as any)[amb];
    });
    return res.status(200).json({ periodo, data: base, fallback: true });
  }
}
