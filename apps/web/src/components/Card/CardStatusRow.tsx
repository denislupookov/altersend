import type { ReactNode } from 'react'

export function CardStatusRow({ status, meta }: { status: ReactNode; meta: ReactNode }) {
  return (
    <div className='mb-5 flex items-center justify-between'>
      {status}
      {meta}
    </div>
  )
}
