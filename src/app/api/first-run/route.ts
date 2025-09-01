import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(){
  const count = await prisma.user.count()
  if(count>0) return NextResponse.json({ ok:true, message: 'Usuarios ya existen' })
  async function up(email:string, nombre:string, rol:any, pass:string){
    const passHash = await bcrypt.hash(pass, 10)
    await prisma.user.upsert({ where: { email }, update: {}, create: { email, nombre, rol, passHash } })
  }
  await up('admin@demo.com','Admin','ADMIN','Admin123*')
  await up('conductor@demo.com','Conductor','CONDUCTOR','Conductor123*')
  await up('taller@demo.com','Taller','TALLER','Taller123*')
  await up('coord@demo.com','Coordinación','COORDINACION','Coord123*')
  return NextResponse.json({ ok:true, message:'Usuarios demo creados' })
}
