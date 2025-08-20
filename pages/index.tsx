import { useEffect, useMemo, useState } from 'react'

type BarrioResp = { ok?: boolean; barrio?: string | null; comuna?: string | null; fuente?: string; error?: string }
type PrecioResp = { ok?: boolean; usd_m2?: number; periodo?: string; fuente?: string; fuente_url?: string; pagina_indicador?: string; error?: string }

const USD = (n:number) => new Intl.NumberFormat('es-AR', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(n)

export default function Home(){
  const [direccion, setDireccion] = useState('Castex 3428')
  const [barrio, setBarrio] = useState<string>('')
  const [amb, setAmb] = useState(2)
  const [sup, setSup] = useState(60)
  const [ban, setBan] = useState(1)
  const [piso, setPiso] = useState(3)
  const [ant, setAnt] = useState(30)
  const [estado, setEstado] = useState(0)
  const [coch, setCoch] = useState(false)
  const [pile, setPile] = useState(false)
  const [seg, setSeg] = useState(false)
  const [subzonaPremium, setSubzonaPremium] = useState(false)
  const [valorM2, setValorM2] = useState<number | null>(null)
  const [periodo, setPeriodo] = useState<string | null>(null)
  const [loadingBarrio, setLoadingBarrio] = useState(false)
  const [loadingValor, setLoadingValor] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const whatsapp = '5491158107778'

  const detectarBarrio = async () => {
    setLoadingBarrio(true)
    try{
      const r = await fetch('/api/barrio?direccion=' + encodeURIComponent(direccion))
      const j: BarrioResp = await r.json()
      if(!j.ok || !j.barrio){ setErrorMsg(j.error || 'No se detectó barrio'); return }
      setBarrio(j.barrio)
    }catch(e:any){
      setErrorMsg(e?.message || 'Error geocodificando')
    }finally{
      setLoadingBarrio(false)
    }
  }

  const cargarValor = async () => {
    if(!barrio) return
    setLoadingValor(true)
    try{
      const r = await fetch(`/api/valor-m2?barrio=${encodeURIComponent(barrio)}&amb=${amb}`)
      const j: PrecioResp = await r.json()
      if(!j.ok || !j.usd_m2) { setErrorMsg(j.error || 'Sin valor para el barrio'); return }
      setValorM2(j.usd_m2)
      setPeriodo(j.periodo || null)
    }catch(e:any){
      setErrorMsg(e?.message || 'Error trayendo valor m²')
    }finally{
      setLoadingValor(false)
    }
  }

  useEffect(()=>{ setErrorMsg(null) }, [direccion, barrio, amb, sup, ban, piso, ant, estado, coch, pile, seg, subzonaPremium])

  useEffect(()=>{
    const txt = direccion.toLowerCase()
    const callesPremium = ['castex','san martin de tours','ortiz de ocampo','casares','cavia','paunero','figueroa alcorta','ombu','copernico']
    const tiene = callesPremium.some(c => txt.includes(c)) || txt.includes('barrio parque') || txt.includes('palermo chico')
    setSubzonaPremium(tiene)
  }, [direccion])

  useEffect(()=>{
    if(barrio) cargarValor()
  }, [barrio, amb])

  const factor = useMemo(()=>{
    let f = 1 + (estado/100)
    if (coch) f += 0.04
    if (pile) f += 0.03
    if (seg)  f += 0.03
    if (ant > 40) f -= 0.05; else if (ant > 20) f -= 0.02
    if (piso >= 7) f += 0.02
    if (amb >= 3 && ban >= 2) f += 0.015
    if (subzonaPremium) f += 0.18
    return f
  }, [estado, coch, pile, seg, ant, piso, amb, ban, subzonaPremium])

  const publicacion = (valorM2 || 0) * sup * factor
  const cierre = publicacion * (1 - 0.068)

  return (
    <div style={styles.wrap}>
      <main style={styles.container as any}>
        <section style={styles.left as any}>
          <div style={styles.header as any}>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <div style={styles.badge}>Tasación preliminar</div>
              <h1 style={{margin:0}}>Ferrari Bassi · Estimador de valor</h1>
            </div>
            <p style={{margin:'6px 0 0', color:'#b7c6dc'}}>Orientativo · basado en fuentes oficiales (IDECBA/GCBA + USIG). El valor final se confirma con visita profesional.</p>
          </div>

          <label style={styles.lbl as any}>Dirección (calle y altura) — CABA</label>
          <div style={{display:'flex',gap:8}}>
            <input value={direccion} onChange={e=>setDireccion(e.target.value)} placeholder="Ej: Castex 3428" style={styles.input as any}/>
            <button onClick={detectarBarrio} style={styles.btnSecondary as any}>{loadingBarrio?'Detectando…':'Detectar barrio'}</button>
          </div>
          <div style={{marginTop:6, color:'#9fb0c8'}}>
            Barrio: <b>{barrio || '—'}</b> {subzonaPremium && <span style={{marginLeft:8, color:'#6bd294'}}>· Subzona premium detectada (+18%)</span>}
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12}}>
            <div>
              <label style={styles.lbl as any}>Superficie (m²)</label>
              <input type="number" min={10} value={sup} onChange={e=>setSup(+e.target.value)} style={styles.input as any}/>
            </div>
            <div>
              <label style={styles.lbl as any}>Ambientes</label>
              <input type="number" min={1} max={3} value={amb} onChange={e=>setAmb(+e.target.value)} style={styles.input as any}/>
            </div>
            <div>
              <label style={styles.lbl as any}>Baños</label>
              <input type="number" min={1} value={ban} onChange={e=>setBan(+e.target.value)} style={styles.input as any}/>
            </div>
            <div>
              <label style={styles.lbl as any}>Piso</label>
              <input type="number" min={0} value={piso} onChange={e=>setPiso(+e.target.value)} style={styles.input as any}/>
            </div>
            <div>
              <label style={styles.lbl as any}>Antigüedad (años)</label>
              <input type="number" min={0} value={ant} onChange={e=>setAnt(+e.target.value)} style={styles.input as any}/>
            </div>
            <div>
              <label style={styles.lbl as any}>Estado</label>
              <select value={estado} onChange={e=>setEstado(parseFloat(e.target.value))} style={styles.input as any}>
                <option value={-12}>A reciclar (–12%)</option>
                <option value={-5}>Bueno (–5%)</option>
                <option value={0}>Muy bueno (0%)</option>
                <option value={6}>Excelente (+6%)</option>
              </select>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12, marginTop:8}}>
            <label style={styles.chk as any}><input type="checkbox" checked={coch} onChange={e=>setCoch(e.target.checked)}/> Cochera</label>
            <label style={styles.chk as any}><input type="checkbox" checked={pile} onChange={e=>setPile(e.target.checked)}/> Pileta</label>
            <label style={styles.chk as any}><input type="checkbox" checked={seg}  onChange={e=>setSeg(e.target.checked)}/> Seguridad 24/7</label>
          </div>

          <div style={{display:'flex',gap:12, marginTop:14, flexWrap:'wrap'}}>
            <button onClick={cargarValor} style={styles.btn as any}>{loadingValor?'Calculando…':'Calcular precio'}</button>
            <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola Nico, quiero coordinar una visita para tasación. Dirección: ${direccion}. Barrio: ${barrio||'—'}. Sup: ${sup} m². Estimador web: ${USD(publicacion)} (cierre ${USD(cierre)}).`)}`}
               target="_blank" rel="noopener"
               style={styles.btnWsp as any}>
              <img src="/whatsapp.svg" alt="" style={{width:20,height:20,marginRight:8}}/>
              Coordinar visita por WhatsApp
            </a>
          </div>

          {errorMsg && <div style={{marginTop:10, color:'#d26b6b', fontWeight:600}}>{errorMsg}</div>}

          <div style={{marginTop:16, fontSize:14, color:'#b7c6dc'}}>
            <div>Fuentes: IDECBA/GCBA (base Argenprop) — actual {periodo || 'último período'}, USIG para geocodificación. Este resultado es <b>preliminar</b> y orientativo.</div>
          </div>
        </section>

        <aside style={styles.right as any}>
          <div style={styles.card as any}>
            <h2 style={{margin:'0 0 6px'}}>Precio sugerido de publicación</h2>
            <div style={styles.price as any}>{valorM2 ? USD(publicacion) : '—'}</div>
            <div style={{color:'#9fb0c8', marginTop:4}}>Rango: {valorM2 ? `${USD(publicacion*0.95)} a ${USD(publicacion*1.05)}` : '—'}</div>

            <h3 style={{margin:'16px 0 6px'}}>Precio estimado de cierre (–6,8%)</h3>
            <div style={styles.price as any}>{valorM2 ? USD(cierre) : '—'}</div>

            <div style={{height:1, background:'#232d3a', margin:'16px 0'}}/>

            <div style={{fontSize:14, color:'#b7c6dc'}}>
              <div><b>Barrio:</b> {barrio || '—'}</div>
              <div><b>Base m² (IDECBA):</b> {valorM2 ? USD(valorM2) + '/m²' : '—'}</div>
              <div><b>Ajustes:</b> {( ( (publicacion / ((valorM2||0) * sup)) - 1 ) * 100 ).toFixed(1)}%</div>
              {subzonaPremium && <div style={{color:'#6bd294'}}>Subzona premium aplicada (+18%)</div>}
            </div>

            <div style={{marginTop:16, fontSize:13, color:'#9fb0c8'}}>
              <b>Aviso:</b> La tasación profesional se define con visita al inmueble, verificación de documentación, orientación, luminosidad, estado del edificio y comparables vigentes.
            </div>
          </div>
        </aside>
      </main>

      <footer style={{marginTop:18, color:'#9fb0c8', fontSize:13}}>
        © {new Date().getFullYear()} Ferrari Bassi. Estimador preliminar · CABA.
      </footer>

      <style jsx>{`
        @media (min-width: 960px){
          main { grid-template-columns: 1.2fr 0.8fr; }
        }
      `}</style>
    </div>
  )
}

const styles: Record<string, any> = {
  wrap: { minHeight:'100vh', background:'#0b0d10', color:'#e8eff7', display:'flex', flexDirection:'column', alignItems:'center', padding:'24px' },
  container: { width:'100%', maxWidth:1100, display:'grid', gap:18, gridTemplateColumns:'1fr', alignItems:'start' },
  left: { background:'#151a20', border:'1px solid #212934', borderRadius:16, padding:18, boxShadow:'0 8px 26px rgba(0,0,0,.25)' },
  right: { },
  header: { marginBottom:8 },
  badge: { background:'#0e1318', border:'1px solid #273140', color:'#cfe3ff', borderRadius:999, padding:'6px 10px', fontSize:12, fontWeight:700, letterSpacing:.2 },
  lbl: { display:'block', margin:'8px 0 6px', color:'#9fb0c8', fontSize:14 },
  input: { width:'100%', padding:'12px 12px', borderRadius:12, border:'1px solid #2a3442', background:'#0e1318', color:'#e8eff7', outline:'none' },
  chk: { display:'flex', gap:8, alignItems:'center', color:'#cfe3ff', fontSize:14 },
  btn: { background:'#3fb389', color:'#07120e', border:'none', borderRadius:12, padding:'12px 16px', fontWeight:800, cursor:'pointer' },
  btnSecondary: { background:'#263042', color:'#cfe3ff', border:'1px solid #36455b', borderRadius:12, padding:'12px 16px', fontWeight:700, cursor:'pointer' },
  btnWsp: { display:'inline-flex', alignItems:'center', textDecoration:'none', background:'#25D366', color:'white', padding:'12px 20px', borderRadius:40, fontWeight:800, boxShadow:'0 6px 14px rgba(0,0,0,.25)' },
  card: { background:'#151a20', border:'1px solid '#212934', borderRadius:16, padding:18, boxShadow:'0 8px 26px rgba(0,0,0,.25)'},
  price: { fontSize:34, fontWeight:900 },
}
