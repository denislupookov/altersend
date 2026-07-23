export function ScreenIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className='mb-6 max-w-[520px] text-center'>
      <h1 className='m-0 text-[26px] font-semibold tracking-[-0.025em] text-text-primary'>
        {title}
      </h1>
      <p className='mt-2 text-[14.5px] leading-relaxed text-text-muted'>{description}</p>
    </div>
  )
}
