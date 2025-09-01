import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { saveDataUrl } from '@/lib/storage'

export async function POST(req:Request,{params}:{params:{id:string}}){
  const b = await req.json()
  const firma = await saveDataUrl('firmas', b.firmaCoord)
  const nuevoEstado = b.decision==='APROBADO' ? 'REPARACION_EN_CURSO' : b.decision==='RECHAZADO' ? 'COMPLETADA' : 'APROBACION_COORD'
  await prisma.solicitud.update({
    where: { id: params.id },
    data: {
      decisionCoord: b.decision,
      motivoRechazo: b.motivo || null,
      firmaCoordAprob: firma || undefined,
      estado: nuevoEstado,
      ultimoEditor: b.user || 'coord@demo.com',
      historial: { create: [{ evento:`Coordinación decidió: ${b.decision}`, actor: b.user || 'coord@demo.com' }] }
    }
  })
  return NextResponse.json({ ok:true, nuevoEstado })
}
