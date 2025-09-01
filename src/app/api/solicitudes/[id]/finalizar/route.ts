import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import PDFDocument from 'pdfkit'
import { savePdf } from '@/lib/storage'

export async function POST(req:Request,{params}:{params:{id:string}}){
  const d = await prisma.solicitud.findUnique({ where:{ id: params.id } })
  if(!d) return NextResponse.json({ok:false}, { status:404 })

  const doc = new PDFDocument({ margin: 28 })
  const bufs: Buffer[] = []
  doc.on('data', (c)=>bufs.push(c))

  doc.fontSize(16).text(`Solicitud de Mantenimiento – ${d.id}`, { underline:true })
  doc.moveDown().fontSize(10)
    .text(`Fecha: ${d.fechaSolicitud.toISOString()}`)
    .text(`Estado final: ${d.estado}`)
    .moveDown().fontSize(12).text('Datos de la solicitud', { underline:true })
  doc.fontSize(10)
    .text(`Conductor: ${d.conductorNombre} (${d.conductorId})`)
    .text(`Unidad/Placa: ${d.unidad} · ${d.placa}`)
    .text(`Necesidad: ${d.necesidad}`)
  doc.moveDown().fontSize(12).text('Taller', { underline:true })
  doc.fontSize(10)
    .text(`Ingreso: ${String(d.horaIngresoTaller || '')}`)
    .text(`Diagnóstico: ${d.diagnosticoTaller || ''}`)
    .text(`Salida: ${String(d.horaSalidaTaller || '')}`)
  doc.moveDown().fontSize(12).text('Coordinación', { underline:true })
  doc.fontSize(10).text(`Decisión: ${d.decisionCoord || ''} — Motivo: ${d.motivoRechazo || ''}`)
  doc.moveDown().fontSize(12).text('Entrega', { underline:true })
  doc.fontSize(10).text(`Satisfacción: ${d.entregaSatisfaccion || ''}`)
  doc.end()

  const buffer = await new Promise<Buffer>(res=>doc.on('end', ()=>res(Buffer.concat(bufs))))
  const url = await savePdf(d.id, buffer)

  await prisma.solicitud.update({
    where: { id: params.id },
    data: {
      estado: 'COMPLETADA',
      pdfUrl: url,
      ultimoEditor: 'coord@demo.com',
      historial: { create: [{ evento:'Coordinación finalizó y generó PDF', actor: 'coord@demo.com' }] }
    }
  })
  return NextResponse.json({ ok:true, pdfUrl: url })
}
