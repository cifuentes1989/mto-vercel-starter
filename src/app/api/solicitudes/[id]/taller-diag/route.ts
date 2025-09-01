import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { saveDataUrl } from '@/lib/storage'

export async function POST(req:Request,{params}:{params:{id:string}}){
  const b = await req.json()
  const firma = await saveDataUrl('firmas', b.firmaTaller)
  await prisma.solicitud.update({
    where: { id: params.id },
    data: {
      horaIngresoTaller: b.horaIngreso ? new Date(b.horaIngreso) : new Date(),
      diagnosticoTaller: b.diagnostico,
      firmaTallerDiag: firma || undefined,
      estado: 'APROBACION_COORD',
      ultimoEditor: b.user || 'taller@demo.com',
      historial: { create: [{ evento:'Taller envió diagnóstico a Coordinación', actor: b.user || 'taller@demo.com' }] }
    }
  })
  return NextResponse.json({ ok:true })
}
