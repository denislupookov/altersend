import { useEffect } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { VideoView, useVideoPlayer } from 'expo-video'

interface ScreenVideoProps {
  source: number
  playing: boolean
  style: StyleProp<ViewStyle>
}

export function ScreenVideo({ source, playing, style }: ScreenVideoProps) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true
    p.muted = true
  })

  useEffect(() => {
    if (playing) player.play()
    else player.pause()
  }, [player, playing])

  return <VideoView player={player} style={style} contentFit='cover' nativeControls={false} />
}
