export function yyyymm(d=new Date()){ return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}` }
export function nextRadicado(seq:number){ return `SM-${yyyymm()}-${String(seq).padStart(4,'0')}` }
