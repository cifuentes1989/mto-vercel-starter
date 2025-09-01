import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(req: Request){
  const { email, password } = await req.json()
  const u = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } })
  if(!u) return NextResponse.json({ok:false, error:'Usuario inválido'}, { status: 401 })
  const ok = await bcrypt.compare(String(password), u.passHash)
  if(!ok) return NextResponse.json({ok:false, error:'Contraseña inválida'}, { status: 401 })
  const token = Buffer.from(JSON.stringify({ email: u.email, rol: u.rol, nombre: u.nombre }), 'utf8').toString('base64')
  return NextResponse.json({ ok:true, token })
}
