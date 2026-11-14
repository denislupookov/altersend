interface DemoVideoProps {
  poster: string
  video: string
}

export function DemoVideo({ poster, video }: DemoVideoProps) {
  return (
    <video
      src={video}
      poster={poster}
      autoPlay
      loop
      muted
      playsInline
      className='absolute inset-0 h-full w-full object-cover'
    />
  )
}
