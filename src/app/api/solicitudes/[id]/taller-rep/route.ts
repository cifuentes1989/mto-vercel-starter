import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { saveDataUrl } from '@/lib/storage'

export async function POST(req:Request,{params}:{params:{id:string}}){
  const b = await req.json()
  const firma = await saveDataUrl('firmas', b.firmaReparacion)
  await prisma.solicitud.update({
    where:{ id: params.id },
    data:{
      inicioReparacion: b.inicio ? new Date(b.inicio) : null,
      finReparacion: b.fin ? new Date(b.fin) : null,
      actividades: b.actividades || null,
      repuestos: b.repuestos || null,
      responsableReparacion: b.responsable || null,
      horaSalidaTaller: b.salida ? new Date(b.salida) : new Date(),
      firmaReparacion: firma || undefined,
      estado: 'ENTREGA',
      ultimoEditor: b.user || 'taller@demo.com',
      historial: { create: [{ evento:'Taller pasó a ENTREGA', actor: b.user || 'taller@demo.com' }] }
    }
  })
  return NextResponse.json({ ok:true })
}
