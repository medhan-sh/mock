import { useEffect, useRef, useState } from 'react'
import dayImg from '../assets/day.png'
import nightImg from '../assets/night.png'
import ModelCTA from './ModelCTA.jsx'
import './HeroTransition.css'

function HeroTransition() {
  const sectionRef = useRef(null)
  const stickyRef = useRef(null)
  const dayImageRef = useRef(null)
  const ctaRef = useRef(null)
  const progressRef = useRef(0)
  const [createRoomMessage, setCreateRoomMessage] = useState('')

  const handleCreateRoom = () => {
    // The room-creation screen is deliberately outside this landing-page task.
    setCreateRoomMessage('Create Room selected — connect this to the room flow next.')
  }

  useEffect(() => {
    const section = sectionRef.current
    const sticky = stickyRef.current
    const dayImage = dayImageRef.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (!section || !sticky || !dayImage) {
      return undefined
    }

    if (reducedMotion.matches) {
      progressRef.current = 1
      sticky.style.setProperty('--transition-progress', '1')
      ctaRef.current?.classList.add('is-docked')
      return undefined
    }

    let animationFrameId = null

    const updateTransition = () => {
      animationFrameId = null

      const { top, height } = section.getBoundingClientRect()
      const scrollableDistance = Math.max(height - window.innerHeight, 1)
      const progress = Math.min(Math.max(-top / scrollableDistance, 0), 1)

      // Avoid a React render for every scroll frame.
      progressRef.current = progress
      dayImage.style.opacity = String(1 - progress)
      sticky.style.setProperty('--transition-progress', String(progress))
      ctaRef.current?.classList.toggle('is-docked', progress >= 0.96)
    }

    const requestUpdate = () => {
      if (animationFrameId === null) {
        animationFrameId = window.requestAnimationFrame(updateTransition)
      }
    }

    updateTransition()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId)
      }
    }
  }, [])

  return (
    <>
      <section className="hero-scroll" ref={sectionRef} aria-labelledby="hero-title">
        <div className="hero-sticky" ref={stickyRef}>
          <img
            className="hero-image hero-image--night"
            src={nightImg}
            alt="City skyline at night"
            loading="eager"
          />
          <img
            className="hero-image hero-image--day"
            ref={dayImageRef}
            src={dayImg}
            alt="City skyline in daylight"
            loading="eager"
          />

          <div className="hero-content">
            <p className="hero-kicker">A city in motion</p>
            <h1 id="hero-title">From sunlit streets to midnight glow.</h1>
            <p className="hero-subtext">Scroll to watch the skyline settle into the night.</p>
          </div>

          <ModelCTA ctaRef={ctaRef} progressRef={progressRef} onCreateRoom={handleCreateRoom} />
          <p className="hero-status" aria-live="polite">{createRoomMessage}</p>
        </div>
      </section>

    </>
  )
}

export default HeroTransition
