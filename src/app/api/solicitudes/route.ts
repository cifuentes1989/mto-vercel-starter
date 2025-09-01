import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { saveDataUrl } from '@/lib/storage'
import { nextRadicado } from '@/lib/radicado'

export async function POST(req: Request){
  const b = await req.json()
  const count = await prisma.solicitud.count()
  const id = nextRadicado(count+1)
  const firma = await saveDataUrl('firmas', b.firmaConductor)

  const s = await prisma.solicitud.create({
    data: {
      id,
      estado: 'REVISION_TALLER',
      conductorId: b.conductorEmail || 'conductor@demo.com',
      conductorNombre: b.conductorNombre,
      unidad: b.unidad,
      placa: b.placa,
      necesidad: b.necesidad,
      firmaConductor: firma || undefined,
      creadoPor: b.conductorEmail || 'conductor@demo.com',
      ultimoEditor: b.conductorEmail || 'conductor@demo.com',
      historial: { create: [{ evento: 'SOLICITUD creada y enviada a Taller', actor: b.conductorEmail || 'conductor@demo.com' }] }
    }
  })
  return NextResponse.json({ ok:true, id: s.id })
}

export async function GET(){
  const items = await prisma.solicitud.findMany({ orderBy: { fechaSolicitud: 'desc' } })
  return NextResponse.json({ items })
}
