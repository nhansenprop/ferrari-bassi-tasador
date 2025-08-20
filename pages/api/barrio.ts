import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const direccion = (req.query.direccion as string || '').trim();
    if (!direccion) return res.status(400).json({ error: 'Falta ?direccion=' });
    const m = direccion.match(/^(.*?)(\d{1,5})([^\d]*)$/);
    if (!m) return res.status(400).json({ error: 'Formato esperado: "Calle 1234"' });
    const calle = m[1].trim();
    const altura = m[2].trim();

    const url = `https://ws.usig.buenosaires.gob.ar/datos_utiles?calle=${encodeURIComponent(calle)}&altura=${encodeURIComponent(altura)}`;
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) throw new Error('USIG respondió con error');
    const json = await r.json();
    const barrio = json?.barrio || null;
    const comuna = json?.comuna || null;
    res.status(200).json({ ok: true, barrio, comuna, fuente: 'USIG GCBA' });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'error desconocido' });
  }
}
