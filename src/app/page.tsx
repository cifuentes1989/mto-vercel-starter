'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'

type Rol = 'CONDUCTOR'|'TALLER'|'COORDINACION'|'ADMIN'
type Estado = 'SOLICITUD'|'REVISION_TALLER'|'APROBACION_COORD'|'REPARACION_EN_CURSO'|'ENTREGA'|'COMPLETADA'

function useSig(){
  const ref = useRef<HTMLCanvasElement|null>(null)
  useEffect(()=>{
    const c = ref.current; if(!c) return
    const ctx = c.getContext('2d')!
    ctx.lineWidth = 2; ctx.lineCap='round'
    let d=false, x=0,y=0
    const pos = (e:any)=>{const r=c.getBoundingClientRect(); const t=e.touches?e.touches[0]:e; return {x:t.clientX-r.left,y:t.clientY-r.top}}
    const start=(e:any)=>{d=true; const p=pos(e); x=p.x; y=p.y}
    const move=(e:any)=>{if(!d)return; const p=pos(e); ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(p.x,p.y); ctx.stroke(); x=p.x;y=p.y}
    const end=()=>{d=false}
    c.addEventListener('mousedown',start); c.addEventListener('mousemove',move); window.addEventListener('mouseup',end)
    c.addEventListener('touchstart',start,{passive:false}); c.addEventListener('touchmove',move,{passive:false}); window.addEventListener('touchend',end)
    return ()=>{ c.removeEventListener('mousedown',start); c.removeEventListener('mousemove',move); window.removeEventListener('mouseup',end)
      c.removeEventListener('touchstart',start); c.removeEventListener('touchmove',move); window.removeEventListener('touchend',end) }
  },[])
  const clear=()=>{const c=ref.current; if(!c) return; c.getContext('2d')!.clearRect(0,0,c.width,c.height)}
  const data=()=>ref.current?.toDataURL('image/png')||''
  return { ref, clear, data }
}

export default function Page(){
  const [me,setMe]=useState<{email:string,rol:Rol,nombre:string}|null>(null)
  async function login(email:string, password:string){
    const r = await fetch('/api/login',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email,password})})
    if(!r.ok){ alert('Login inválido'); return }
    const { token } = await r.json()
    const me = JSON.parse(atob(token))
    setMe(me)
  }

  async function firstRun(){
    const r = await fetch('/api/first-run',{ method:'POST' })
    const j = await r.json()
    alert(j.message || 'Listo')
  }

  const [items,setItems]=useState<any[]>([])
  async function cargar(){ const r = await fetch('/api/solicitudes'); const j = await r.json(); setItems(j.items) }
  useEffect(()=>{ cargar() },[])

  const pendientes = useMemo(()=>{
    const rol = me?.rol as Rol|undefined
    if(!rol) return []
    const map:Record<Rol,Estado[]> = {
      CONDUCTOR:['ENTREGA','SOLICITUD'],
      TALLER:['REVISION_TALLER','REPARACION_EN_CURSO'],
      COORDINACION:['APROBACION_COORD','ENTREGA'],
      ADMIN:['SOLICITUD','REVISION_TALLER','APROBACION_COORD','REPARACION_EN_CURSO','ENTREGA','COMPLETADA']
    }
    return items.filter(i=>map[rol].includes(i.estado))
  },[items,me])

  const cPad = useSig()
  const [cNombre,setCNombre]=useState('Juan Conductor')
  const [cUnidad,setCUnidad]=useState('Ambulancia')
  const [cPlaca,setCPlaca]=useState('ABC123')
  const [cNec,setCNec]=useState('Ruido en frenos')
  async function crear(){
    const body = {
      conductorEmail: me?.email, conductorNombre: cNombre,
      unidad: cUnidad, placa: cPlaca.toUpperCase(), necesidad: cNec,
      firmaConductor: cPad.data()
    }
    const r = await fetch('/api/solicitudes',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)})
    if(!r.ok){ alert('Error creando solicitud'); return }
    cPad.clear(); setCNec('')
    await cargar(); alert('Enviada a Taller')
  }

  const [id,setId]=useState<string>(''); const sel = items.find(s=>s.id===id)

  const tPad = useSig(); const [tIng,setTIng]=useState(''); const [tDiag,setTDiag]=useState('')
  async function enviarDiag(){
    if(!sel) return; if(!tDiag) return alert('Ingresa diagnóstico')
    const r = await fetch(`/api/solicitudes/${sel.id}/taller-diag`,{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({horaIngreso:tIng, diagnostico:tDiag, firmaTaller:tPad.data(), user: me?.email})})
    if(!r.ok) return alert('Error')
    tPad.clear(); setTDiag(''); setTIng(''); await cargar(); alert('Enviado a Coordinación')
  }

  const cPadA = useSig(); const [dec,setDec]=useState<'APROBADO'|'RECHAZADO'|'ESPERA'>('APROBADO'); const [mot,setMot]=useState('')
  async function decidir(){
    if(!sel) return
    const r = await fetch(`/api/solicitudes/${sel.id}/coord-decision`,{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({decision:dec, motivo:mot, firmaCoord:cPadA.data(), user: me?.email})})
    if(!r.ok) return alert('Error')
    cPadA.clear(); setMot(''); await cargar(); alert('Decisión guardada')
  }

  const tPadR = useSig(); const [iRep,setIRep]=useState(''); const [fRep,setFRep]=useState(''); const [resp,setResp]=useState(''); const [acts,setActs]=useState(''); const [reps,setReps]=useState(''); const [sal,setSal]=useState('')
  async function finRep(){
    if(!sel) return; if(!fRep || !resp) return alert('Fin y Responsable obligatorios')
    const r = await fetch(`/api/solicitudes/${sel.id}/taller-rep`,{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({inicio:iRep, fin:fRep, actividades:acts, repuestos:reps, responsable:resp, salida:sal, firmaReparacion:tPadR.data(), user: me?.email})})
    if(!r.ok) return alert('Error')
    tPadR.clear(); await cargar(); alert('Pasado a ENTREGA')
  }

  const ePad = useSig(); const [sat,setSat]=useState<'OK'|'NO_CONFORME'>('OK')
  async function firmarEntrega(){
    if(!sel) return
    const r = await fetch(`/api/solicitudes/${sel.id}/entrega`,{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({satisfaccion:sat, firmaEntrega:ePad.data(), user: me?.email})})
    if(!r.ok) return alert('Error')
    ePad.clear(); await cargar(); alert('Entrega firmada')
  }

  async function finalizar(){
    if(!sel) return
    const r = await fetch(`/api/solicitudes/${sel.id}/finalizar`,{method:'POST'})
    const j = await r.json(); if(j.pdfUrl) window.open(j.pdfUrl,'_blank'); await cargar()
  }

  return (
    <div style={{maxWidth:1100, margin:'10px auto', padding:'10px'}}>
      <h1 style={{fontSize:18, fontWeight:700}}>🛠️ Sistema de Solicitud de Mantenimiento</h1>
      <button onClick={firstRun}>Primer uso (crear usuarios demo)</button>

      {!me && (
        <div style={{margin:'10px 0', padding:10, border:'1px solid #ddd', borderRadius:12}}>
          <b>Inicia sesión (demo):</b>
          <div style={{display:'flex', gap:8, marginTop:8, flexWrap:'wrap'}}>
            <button onClick={()=>login('conductor@demo.com','Conductor123*')}>Conductor</button>
            <button onClick={()=>login('taller@demo.com','Taller123*')}>Taller</button>
            <button onClick={()=>login('coord@demo.com','Coord123*')}>Coordinación</button>
            <button onClick={()=>login('admin@demo.com','Admin123*')}>Admin</button>
          </div>
        </div>
      )}

      {me && (
        <>
          <div style={{margin:'10px 0'}}>Usuario: <b>{me.nombre}</b> · Rol: <b>{me.rol}</b></div>

          {(me.rol==='CONDUCTOR' || me.rol==='ADMIN') && (
            <div style={{padding:10, border:'1px solid #ddd', borderRadius:12, margin:'12px 0', background:'#fff'}}>
              <b>1) Nueva Solicitud</b>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:8, marginTop:8}}>
                <label>Nombre<input value={cNombre} onChange={e=>setCNombre(e.target.value)} /></label>
                <label>Unidad<select value={cUnidad} onChange={e=>setCUnidad(e.target.value)}><option>Ambulancia</option><option>Movil</option></select></label>
                <label>Placa<input value={cPlaca} onChange={e=>setCPlaca(e.target.value.toUpperCase())} /></label>
              </div>
              <label>Necesidad<textarea value={cNec} onChange={e=>setCNec(e.target.value)} style={{width:'100%'}}/></label>
              <div style={{marginTop:6}}>Firma Conductor</div>
              <canvas ref={cPad.ref} width={520} height={120} style={{border:'1px solid #bbb', borderRadius:8, width:'100%'}}/>
              <div style={{display:'flex', gap:8, marginTop:8}}>
                <button onClick={cPad.clear}>Limpiar</button>
                <button onClick={crear}>Enviar a Taller</button>
              </div>
            </div>
          )}

          <div style={{padding:10, border:'1px solid #ddd', borderRadius:12, margin:'12px 0', background:'#fff'}}>
            <b>Bandeja ({me.rol})</b>
            <select value={id} onChange={e=>setId(e.target.value)} style={{marginLeft:8}}>
              <option value="">— Selecciona ID —</option>
              {pendientes.map(s=> <option key={s.id} value={s.id}>{s.id} · {s.placa} · {s.estado}</option>)}
            </select>
          </div>

          {sel && (
            <div style={{padding:10, border:'1px solid #ddd', borderRadius:12, background:'#fff'}}>
              <div><b>ID:</b> {sel.id} · <b>Estado:</b> {sel.estado} · <b>Placa:</b> {sel.placa} · <b>Unidad:</b> {sel.unidad}</div>

              {sel.estado==='REVISION_TALLER' && (me.rol==='TALLER'||me.rol==='ADMIN') && (
                <>
                  <h3>Diagnóstico Taller</h3>
                  <label>Hora ingreso ISO <input value={tIng} onChange={e=>setTIng(e.target.value)}/></label>
                  <label>Diagnóstico<textarea value={tDiag} onChange={e=>setTDiag(e.target.value)} style={{width:'100%'}}/></label>
                  <div>Firma Taller</div>
                  <canvas ref={tPad.ref} width={520} height={120} style={{border:'1px solid #bbb', borderRadius:8, width:'100%'}}/>
                  <div style={{display:'flex', gap:8, marginTop:8}}>
                    <button onClick={tPad.clear}>Limpiar</button>
                    <button onClick={enviarDiag}>Enviar a Coordinación</button>
                  </div>
                </>
              )}

              {sel.estado==='APROBACION_COORD' && (me.rol==='COORDINACION'||me.rol==='ADMIN') && (
                <>
                  <h3>Decisión de Coordinación</h3>
                  <label>Decisión
                    <select value={dec} onChange={e=>setDec(e.target.value as any)}>
                      <option>APROBADO</option><option>RECHAZADO</option><option>ESPERA</option>
                    </select>
                  </label>
                  <label>Motivo <input value={mot} onChange={e=>setMot(e.target.value)} style={{width:'100%'}}/></label>
                  <div>Firma Coordinación</div>
                  <canvas ref={cPadA.ref} width={520} height={120} style={{border:'1px solid #bbb', borderRadius:8, width:'100%'}}/>
                  <div style={{display:'flex', gap:8, marginTop:8}}>
                    <button onClick={cPadA.clear}>Limpiar</button>
                    <button onClick={decidir}>Guardar decisión</button>
                  </div>
                </>
              )}

              {sel.estado==='REPARACION_EN_CURSO' && (me.rol==='TALLER'||me.rol==='ADMIN') && (
                <>
                  <h3>Reparación</h3>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:8}}>
                    <label>Inicio <input value={iRep} onChange={e=>setIRep(e.target.value)} /></label>
                    <label>Fin <input value={fRep} onChange={e=>setFRep(e.target.value)} /></label>
                    <label>Responsable <input value={resp} onChange={e=>setResp(e.target.value)} /></label>
                    <label>Salida <input value={sal} onChange={e=>setSal(e.target.value)} /></label>
                  </div>
                  <label>Actividades<textarea value={acts} onChange={e=>setActs(e.target.value)} style={{width:'100%'}}/></label>
                  <label>Repuestos<textarea value={reps} onChange={e=>setReps(e.target.value)} style={{width:'100%'}}/></label>
                  <div>Firma Taller (reparación)</div>
                  <canvas ref={tPadR.ref} width={520} height={120} style={{border:'1px solid #bbb', borderRadius:8, width:'100%'}}/>
                  <div style={{display:'flex', gap:8, marginTop:8}}>
                    <button onClick={tPadR.clear}>Limpiar</button>
                    <button onClick={finRep}>Pasar a ENTREGA</button>
                  </div>
                </>
              )}

              {sel.estado==='ENTREGA' && (me.rol==='CONDUCTOR'||me.rol==='COORDINACION'||me.rol==='ADMIN') && (
                <>
                  <h3>Entrega (Conductor)</h3>
                  <label>Conformidad
                    <select value={sat} onChange={e=>setSat(e.target.value as any)}><option>OK</option><option>NO_CONFORME</option></select>
                  </label>
                  <div>Firma Conductor</div>
                  <canvas ref={ePad.ref} width={520} height={120} style={{border:'1px solid #bbb', borderRadius:8, width:'100%'}}/>
                  <div style={{display:'flex', gap:8, marginTop:8}}>
                    <button onClick={ePad.clear}>Limpiar</button>
                    <button onClick={firmarEntrega}>Firmar recepción</button>
                  </div>

                  {(me.rol==='COORDINACION'||me.rol==='ADMIN') && (
                    <div style={{marginTop:8}}>
                      <button onClick={finalizar}>Finalizar y generar PDF</button>
                    </div>
                  )}
                </>
              )}

              {sel.estado==='COMPLETADA' && (
                <div>
                  <h3>Completada</h3>
                  {sel.pdfUrl ? <a href={sel.pdfUrl} target="_blank">Abrir PDF</a> : 'PDF no generado'}
                </div>
              )}
            </div>
          )}

          <div style={{marginTop:12}}>
            <h3>Registros</h3>
            <ul>
              {items.map(s=>(<li key={s.id}>• {s.id} — {s.placa} — {s.estado} {s.pdfUrl? <a href={s.pdfUrl} target='_blank'>(PDF)</a>:''}</li>))}
              {items.length===0 && <li>No hay registros</li>}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
