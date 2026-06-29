import { useState } from 'react'

export function usePressState() {
  const [isPressed, setIsPressed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const press = () => setIsPressed(true)
  const release = () => setIsPressed(false)
  const hoverIn = () => setIsHovered(true)
  const hoverOut = () => {
    setIsHovered(false)
    setIsPressed(false)
  }

  return {
    isPressed,
    isHovered,
    pressHandlers: {
      onPointerEnter: hoverIn,
      onPointerLeave: hoverOut,
      onPointerDown: press,
      onPointerUp: release,
      onPointerCancel: release,
      onTouchStart: press,
      onTouchEnd: release,
      onTouchCancel: release
    }
  }
}
