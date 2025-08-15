import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Palette } from 'lucide-react'

type Theme = 'slate' | 'mint' | 'rose'

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('slate')

  useEffect(() => {
    // Get saved theme from localStorage or default to slate
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'slate'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  const cycleTheme = () => {
    const themes: Theme[] = ['slate', 'mint', 'rose']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    const nextTheme = themes[nextIndex]
    
    setTheme(nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    localStorage.setItem('theme', nextTheme)
  }

  const getThemeDisplay = (theme: Theme) => {
    switch (theme) {
      case 'slate': return '🪨 Slate'
      case 'mint': return '🌿 Mint'
      case 'rose': return '🌸 Rose'
    }
  }

  return (
    <Button
      onClick={cycleTheme}
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-50 gap-2 shadow-lg"
      title={`Current theme: ${getThemeDisplay(theme)}. Click to cycle themes.`}
    >
      <Palette className="h-4 w-4" />
      {getThemeDisplay(theme)}
    </Button>
  )
}
