export interface Script {
  id: string
  title: string
  text: string
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'promptcast_scripts'

export function loadScripts(): Script[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultScripts()
    return JSON.parse(raw)
  } catch {
    return getDefaultScripts()
  }
}

export function saveScripts(scripts: Script[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts))
}

export function createScript(title: string, text: string): Script {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    text,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function updateScript(scripts: Script[], id: string, updates: Partial<Script>): Script[] {
  return scripts.map(s =>
    s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
  )
}

export function deleteScript(scripts: Script[], id: string): Script[] {
  return scripts.filter(s => s.id !== id)
}

function getDefaultScripts(): Script[] {
  return [
    createScript(
      'Welcome Speech Sample',
      `Good evening, everyone.

Thank you for being here tonight. It is truly an honor to stand before such an incredible group of people.

We have gathered here to celebrate something special — the hard work, dedication, and passion that each and every one of you has brought to this project.

Over the past year, our team has faced challenges that seemed insurmountable. But time and again, you rose to the occasion. You collaborated, you innovated, and you delivered results that exceeded every expectation.

Tonight is not just a celebration of what we have achieved — it is a celebration of who we are as a team.

Thank you all so much.`
    ),
    createScript(
      'Product Launch Script',
      `Today is a day we have been working toward for over two years.

What we're about to show you is not just a product — it is a vision made real.

This journey started with a simple question: what if technology could truly adapt to the way people work, rather than forcing people to adapt to technology?

The answer is what you see before you today.

We believe this changes everything. And we can't wait to show you why.

Ladies and gentlemen — introducing the future.`
    ),
  ]
}
