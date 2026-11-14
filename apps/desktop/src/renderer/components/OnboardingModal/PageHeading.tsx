interface PageHeadingProps {
  title: string
  description?: string
}

export function PageHeading({ title, description }: PageHeadingProps) {
  return (
    <>
      <h1 className='m-0 text-[26px] font-bold leading-tight tracking-[-0.02em] text-text-primary'>
        {title}
      </h1>
      {description ? (
        <p className='m-0 mt-2 max-w-[440px] text-[15px] leading-[1.5] text-text-secondary'>
          {description}
        </p>
      ) : null}
    </>
  )
}
