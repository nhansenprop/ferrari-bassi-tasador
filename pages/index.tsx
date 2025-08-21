import { useEffect, useMemo, useState } from "react";

const USD = (n?: number | null) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);

const norm = (s: string) =>
  String(s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

type BarrioInfo = { barrio: string; premium: boolean };

export default function Home() {
  const [dir, setDir] = useState("Castex 3428");
  const [infoBarrio, setInfoBarrio] = useState<BarrioInfo>({ barrio: "", premium: false });
  const [sup, setSup] = useState<number>(60);
  const [amb, setAmb] = useState<number>(2);
  const [ban, setBan] = useState<number>(1);
  const [piso, setPiso] = useState<number>(3);
  const [ant, setAnt] = useState<number>(30);
  const [estado, setEstado] = useState<number>(0); // %
  const [coch, setCoch] = useState<boolean>(false);
  const [pile, setPile] = useState<boolean>(false);
  const [seg, setSeg] = useState<boolean>(false);

  const [periodo, setPeriodo] = useState<string>("");
  const [valorM2, setValorM2] = useState<number | null>(null);
  const [pub, setPub] = useState<number | null>(null);
  const [cier, setCier] = useState<number | null>(null);
  const [rango, setRango] = useState<[number | null, number | null]>([null, null]);
  const [msg, setMsg] = useState<string>("");

  const wspHref = useMemo(() => {
    if (!pub) return "#";
    const t = `Hola Nico, quiero coordinar una visita para tasación.
Dirección: ${dir}
Barrio: ${infoBarrio.barrio || "—"}
Sup: ${sup} m²
Estimador web: ${USD(pub)} (cierre ${USD(cier)}).`;
    return `https://wa.me/5491158107778?text=${encodeURIComponent(t)}`;
  }, [pub, cier, dir, infoBarrio.barrio, sup]);

  async function detectarBarrio() {
    setMsg("");
    try {
      const r = await fetch(`/api/geocode?dir=${encodeURIComponent(dir)}`);
      const j = (await r.json()) as { barrio?: string; premium?: boolean; error?: string };
      if (j.error) throw new Error(j.error);
      setInfoBarrio({ barrio: j.barrio || "", premium: !!j.premium });
    } catch {
      setInfoBarrio({ barrio: "", premium: false });
      setMsg("No se pudo detectar el barrio (verificá la dirección).");
    }
  }

  async function calcular() {
    setMsg("");
    setPub(null);
    setCier(null);
    setValorM2(null);

    const b = norm(infoBarrio.barrio);
    if (!b) {
      setMsg("Detectá el barrio por dirección antes de calcular.");
      return;
    }
    if (sup <= 0) {
      setMsg("Ingresá una superficie válida.");
      return;
    }

    try {
      const r = await fetch(`/api/idecba?amb=${amb}`);
      const j = (await r.json()) as {
        periodo?: string;
        data?: Record<string, number>;
        fallback?: boolean;
      };

      setPeriodo(j.periodo || "");

      const base = j.data?.[b];
      if (!base) {
        setMsg(
          "No hay valor IDECBA para ese barrio/ambiente. Probá 1–3 ambientes o cambiá la dirección."
        );
        return;
      }

      let f = 1 + estado / 100;
      if (coch) f += 0.04;
      if (pile) f += 0.03;
      if (seg) f += 0.03;

      if (ant > 40) f -= 0.05;
      else if (ant > 20) f -= 0.02;

      if (piso >= 7) f += 0.02;
      if (amb >= 3 && ban >= 2) f += 0.015;

      if (infoBarrio.premium) f += 0.18; // Palermo Chico / Barrio Parque

      const publicacion = base * sup * f;
      const cierre = publicacion * (1 - 0.068);
      setValorM2(base);
      setPub(publicacion);
      setCier(cierre);
      setRango([publicacion * 0.95, publicacion * 1.05]);
    } catch {
      setMsg("Error obteniendo IDECBA. Probá nuevamente.");
    }
  }

  useEffect(() => {
    detectarBarrio();
  }, []);

  return (
    <>
      <style jsx global>{`
        :root {
          --bg: #0b0d10;
          --panel: #151a20;
          --muted: #9fb0c8;
          --text: #e8eff7;
          --brand: #3fb389;
          --ok: #6bd294;
          --border: #212934;
        }
        * {
          box-sizing: border-box;
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI",
            Roboto, Inter, "Helvetica Neue", Arial;
        }
        body {
          background: var(--bg);
          color: var(--text);
          margin: 0;
          padding: 24px;
        }
        .wrap {
          max-width: 1120px;
          margin: auto;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        h1 {
          margin: 0;
          letter-spacing: 0.2px;
          font-weight: 800;
        }
        .badge {
          display: inline-block;
          background: #0e1318;
          border: 1px solid #273140;
          color: #cfe3ff;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 700;
        }
        .muted {
          color: var(--muted);
        }
        .grid {
          display: grid;
          gap: 18px;
        }
        @media (min-width: 960px) {
          .grid {
            grid-template-columns: 1.2fr 0.8fr;
          }
        }
        .card {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 8px 26px rgba(0, 0, 0, 0.25);
        }
        label {
          display: block;
          margin: 0.5rem 0 0.25rem;
          color: var(--muted);
          font-size: 0.92rem;
        }
        input,
        select {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #2a3442;
          background: #0e1318;
          color: var(--text);
          outline: none;
        }
        input:focus,
        select:focus {
          border-color: #3b8fff;
        }
        .row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .row3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 800;
        }
        .btn.primary {
          background: var(--brand);
          color: #061410;
        }
        .btn.secondary {
          background: #263042;
          color: #cfe3ff;
          border: 1px solid #36455b;
        }
        .btn.wsp {
          background: #25d366;
          color: #fff;
          border: none;
          border-radius: 40px;
          padding: 12px 18px;
          text-decoration: none;
        }
        .price {
          font-size: 34px;
          font-weight: 900;
        }
        .hr {
          height: 1px;
          background: #232d3a;
          margin: 16px 0;
        }
        footer {
          color: #9fb0c8;
          font-size: 0.82rem;
          text-align: center;
          padding: 4px;
        }
        .ok {
          color: var(--ok);
        }
      `}</style>

      <div className="wrap">
        <div>
          <span className="badge">Tasación preliminar</span>
          <h1>Ferrari Bassi · Estimador de valor</h1>
          <p className="muted" style={{ margin: ".25rem 0 0" }}>
            Orientativo basado en fuentes oficiales (USIG + IDECBA/GCBA). La
            tasación final se confirma con visita profesional.
          </p>
        </div>

        <div className="grid">
          <section className="card">
            <label>Dirección (calle y altura) — CABA</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                value={dir}
                onChange={(e) => setDir(e.target.value)}
                placeholder="Ej: Castex 3428"
              />
              <button className="btn secondary" onClick={detectarBarrio}>
                Detectar barrio
              </button>
            </div>
            <div className="muted" style={{ marginTop: 6 }}>
              Barrio: <b>{infoBarrio.barrio || "—"}</b>{" "}
              {infoBarrio.premium ? (
                <span className="ok"> · Subzona premium (+18%)</span>
              ) : null}
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <div>
                <label>Superficie (m²)</label>
                <input
                  type="number"
                  min={10}
                  value={sup}
                  onChange={(e) => setSup(+e.target.value)}
                />
              </div>
              <div>
                <label>Ambientes</label>
                <input
                  type="number"
                  min={1}
                  max={3}
                  value={amb}
                  onChange={(e) => setAmb(+e.target.value)}
                />
              </div>
              <div>
                <label>Baños</label>
                <input
                  type="number"
                  min={1}
                  value={ban}
                  onChange={(e) => setBan(+e.target.value)}
                />
              </div>
              <div>
                <label>Piso</label>
                <input
                  type="number"
                  min={0}
                  value={piso}
                  onChange={(e) => setPiso(+e.target.value)}
                />
              </div>
              <div>
                <label>Antigüedad (años)</label>
                <input
                  type="number"
                  min={0}
                  value={ant}
                  onChange={(e) => setAnt(+e.target.value)}
                />
              </div>
              <div>
                <label>Estado</label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(parseFloat(e.target.value))}
                >
                  <option value={-12}>A reciclar (–12%)</option>
                  <option value={-5}>Bueno (–5%)</option>
                  <option value={0}>Muy bueno (0%)</option>
                  <option value={6}>Excelente (+6%)</option>
                </select>
              </div>
            </div>

            <div className="row3" style={{ marginTop: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={coch}
                  onChange={(e) => setCoch(e.target.checked)}
                />
                Cochera
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={pile}
                  onChange={(e) => setPile(e.target.checked)}
                />
                Pileta
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={seg}
                  onChange={(e) => setSeg(e.target.checked)}
                />
                Seguridad 24/7
              </label>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
              <button className="btn primary" onClick={calcular}>
                Calcular precio
              </button>
              <a className="btn wsp" href={wspHref} target="_blank" rel="noopener">
                💬 Coordinar visita por WhatsApp
              </a>
            </div>

            {msg ? (
              <div className="muted" style={{ marginTop: 10 }}>
                {msg}
              </div>
            ) : null}

            <div className="muted" style={{ marginTop: 14 }}>
              Fuentes: IDECBA/GCBA (base Argenprop) — <b>{periodo || "—"}</b>, USIG
              para geocodificación. Resultado <b>preliminar</b>.
            </div>
          </section>

          <aside className="card">
            <h3 style={{ margin: "0 0 6px" }}>Precio sugerido de publicación</h3>
            <div className="price">{pub ? USD(pub) : "—"}</div>
            <div className="muted" style={{ marginTop: 4 }}>
              {rango[0] ? `Rango: ${USD(rango[0])} a ${USD(rango[1])}` : "Rango: —"}
            </div>

            <h4 style={{ margin: "16px 0 6px" }}>Precio estimado de cierre (–6,8%)</h4>
            <div className="price">{cier ? USD(cier) : "—"}</div>

            <div className="hr" />

            <div className="muted">
              <div>
                <b>Barrio:</b> {infoBarrio.barrio || "—"}{" "}
                {infoBarrio.premium ? (
                  <span className="ok">· Subzona premium aplicada (+18%)</span>
                ) : null}
              </div>
              <div>
                <b>Base m² (IDECBA):</b> {valorM2 ? `${USD(valorM2)}/m²` : "—"}
              </div>
            </div>

            <div className="hr" />
            <div className="muted" style={{ fontSize: ".95rem" }}>
              <b>Aviso:</b> La tasación profesional se define con visita al inmueble,
              verificación documental, orientación, luminosidad, estado del edificio y
              comparables vigentes.
            </div>
          </aside>
        </div>

        <footer>© {new Date().getFullYear()} Ferrari Bassi. Estimador preliminar · CABA.</footer>
      </div>
    </>
  );
}
