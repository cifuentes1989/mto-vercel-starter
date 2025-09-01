import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { saveDataUrl } from '@/lib/storage'

export async function POST(req:Request,{params}:{params:{id:string}}){
  const b = await req.json()
  const firma = await saveDataUrl('firmas', b.firmaEntrega)
  await prisma.solicitud.update({
    where: { id: params.id },
    data: {
      entregaSatisfaccion: b.satisfaccion,
      firmaEntregaConductor: firma || undefined,
      ultimoEditor: b.user || 'conductor@demo.com',
      historial: { create: [{ evento:'Conductor firmó recepción', actor: b.user || 'conductor@demo.com' }] }
    }
  })
  return NextResponse.json({ ok:true })
}
