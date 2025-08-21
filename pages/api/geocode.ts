export default async function handler(req: any, res: any) {
  try {
    const dir = String(req.query.dir || "");
    if (!dir || !/\d+/.test(dir)) {
      return res.status(400).json({ error: "Formato: Calle 1234" });
    }

    // Partimos calle y altura para USIG "datos utiles"
    const m = dir.match(/^(.*?)(\d{1,5})([^\d]*)$/);
    const calle = (m?.[1] || "").trim();
    const altura = (m?.[2] || "").trim();

    const url = `https://ws.usig.buenosaires.gob.ar/datos_utiles?calle=${encodeURIComponent(
      calle
    )}&altura=${encodeURIComponent(altura)}`;

    const r = await fetch(url, { headers: { Accept: "application/json" } });
    const j = await r.json();

    const barrio: string | null = j?.barrio || null;

    const txt = dir.toLowerCase();
    const premium =
      /(palermo chico|barrio parque|castex|san martin de tours|ortiz de ocampo|cavia|casares|paunero|ombu|copernico)/.test(
        txt
      );

    return res.status(200).json({ barrio, premium });
  } catch (e) {
    return res.status(500).json({ error: "Error geocodificando" });
  }
}
