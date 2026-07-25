export function ScreenIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className='mb-6 w-full max-w-[520px] text-left sm:text-center'>
      <h1 className='m-0 text-[22px] font-semibold tracking-[-0.025em] text-text-primary sm:text-[26px]'>
        {title}
      </h1>
      <p className='mt-2 text-[14px] leading-relaxed text-text-muted sm:text-[14.5px]'>
        {description}
      </p>
    </div>
  )
}
