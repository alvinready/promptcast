// Shared read-time estimate so both the app header and the teleprompter
// toolbar compute the same number from the same inputs.
export function estimateReadTime(text: string, speed: number): string {
  const words = text.split(/\s+/).filter(Boolean).length
  if (words === 0) return ''
  const wpm = Math.round(140 * speed)
  const totalSecs = Math.round((words / wpm) * 60)
  if (totalSecs < 60) return `~${totalSecs}s`
  const m = Math.floor(totalSecs / 60)
  const s = totalSecs % 60
  return s === 0 ? `~${m}m` : `~${m}m ${s}s`
}
