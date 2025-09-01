export const metadata = { title: 'Mantenimiento Vehículos' }
export default function RootLayout({ children }:{ children: React.ReactNode }){
  return (
    <html lang="es">
      <body style={{fontFamily:'system-ui', background:'#f7f7fb'}}>{children}</body>
    </html>
  )
}
