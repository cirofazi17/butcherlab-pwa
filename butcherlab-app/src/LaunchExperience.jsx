import { useEffect, useState } from 'react'
import logo from './assets/logo/logo.png'

// Metti false per disattivare la schermata iniziale senza eliminare il componente.
export const ENABLE_SPLASH_SCREEN = true

const SPLASH_DURATION_MS = 3000
const VISITOR_STORAGE_KEY = 'butcherlab-has-visited'
const LAST_PHRASE_STORAGE_KEY = 'butcherlab-last-launch-phrase'

const LAUNCH_PHRASES = [
  '🥩 Carni selezionate ogni giorno',
  '⭐ La qualità è la nostra tradizione',
  '🔥 Il gusto della vera carne',
  '👨‍🍳 Preparata con cura per te',
  '❤️ La tua macelleria di fiducia',
  '🇮🇹 Qualità e passione ogni giorno',
  '🥩 Solo il meglio arriva sulla tua tavola',
  '🛒 Ordina in un attimo, ritira quando vuoi',
  '🔪 Tagli preparati con esperienza',
  '🌟 Freschezza che fa la differenza',
  '🥩 Dal banco alla tua tavola',
  '🤝 Grazie per aver scelto BUTCHER LAB',
]

function getRandomLaunchPhrase() {
  try {
    const previousPhrase = localStorage.getItem(LAST_PHRASE_STORAGE_KEY)
    const availablePhrases = LAUNCH_PHRASES.filter((phrase) => phrase !== previousPhrase)
    const phrasePool = availablePhrases.length > 0 ? availablePhrases : LAUNCH_PHRASES
    const selectedPhrase = phrasePool[Math.floor(Math.random() * phrasePool.length)]

    localStorage.setItem(LAST_PHRASE_STORAGE_KEY, selectedPhrase)
    return selectedPhrase
  } catch {
    return LAUNCH_PHRASES[Math.floor(Math.random() * LAUNCH_PHRASES.length)]
  }
}

export default function LaunchExperience() {
  const [splashVisible, setSplashVisible] = useState(ENABLE_SPLASH_SCREEN)
  const [greeting, setGreeting] = useState('BENVENUTO')
  const [launchPhrase] = useState(() => getRandomLaunchPhrase())

  useEffect(() => {
    if (!ENABLE_SPLASH_SCREEN) return undefined

    try {
      const hasVisited = localStorage.getItem(VISITOR_STORAGE_KEY) === 'true'
      setGreeting(hasVisited ? 'BENTORNATO' : 'BENVENUTO')
      localStorage.setItem(VISITOR_STORAGE_KEY, 'true')
    } catch {
      // Se il browser blocca localStorage, mostra comunque il benvenuto.
      setGreeting('BENVENUTO')
    }

    const timer = window.setTimeout(() => {
      setSplashVisible(false)
    }, SPLASH_DURATION_MS)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!splashVisible) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [splashVisible])

  if (!splashVisible) return null

  return (
    <div
      className="launch-splash"
      role="status"
      aria-live="polite"
      aria-label={`${greeting} da BUTCHER LAB. ${launchPhrase}`}
    >
      <div className="launch-splash-inner">
        <img className="launch-splash-logo" src={logo} alt="BUTCHER LAB" />
        <p className="launch-greeting">{greeting}</p>
        <p className="launch-tagline">{launchPhrase}</p>
        <div className="launch-splash-line" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  )
}
