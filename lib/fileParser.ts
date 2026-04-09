export async function parseFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (['txt', 'md', 'text'].includes(ext)) {
    return readAsText(file)
  }

  if (ext === 'rtf') {
    const raw = await readAsText(file)
    return stripRtf(raw)
  }

  if (ext === 'docx') {
    return parseDocx(file)
  }

  if (ext === 'enex') {
    const raw = await readAsText(file)
    return parseEnex(raw)
  }

  if (ext === 'pdf') {
    return `[PDF file "${file.name}" uploaded.\n\nTo use with PromptCast, please:\n1. Open the PDF in Files or Preview\n2. Select all text (⌘A) and copy\n3. Create a new script and paste your text]`
  }

  // fallback: try plain text
  try {
    return await readAsText(file)
  } catch {
    return `[Could not read "${file.name}". Try saving as .txt and re-importing.]`
  }
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve((e.target?.result as string) ?? '')
    reader.onerror = reject
    reader.readAsText(file, 'utf-8')
  })
}

function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

function stripRtf(rtf: string): string {
  // Remove RTF control words and groups
  let text = rtf
    .replace(/\\([a-z]+)(-?\d+)? ?/g, '')
    .replace(/\{[^{}]*\}/g, '')
    .replace(/[{}\\]/g, '')
    .replace(/\r?\n/g, '\n')
    .trim()
  return text
}

async function parseDocx(file: File): Promise<string> {
  try {
    const mammoth = await import('mammoth')
    const buf = await readAsArrayBuffer(file)
    const result = await mammoth.extractRawText({ arrayBuffer: buf })
    return result.value.trim()
  } catch {
    return `[Could not parse "${file.name}". Try File → Save As → Plain Text in Word, then re-import.]`
  }
}

function parseEnex(xml: string): string {
  // Apple Notes exported as ENEX (Evernote format)
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    const contents = doc.querySelectorAll('content')
    const parts: string[] = []
    contents.forEach(content => {
      const cdata = content.textContent ?? ''
      // Strip HTML tags from the note content
      const stripped = cdata.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, '\n\n').trim()
      if (stripped) parts.push(stripped)
    })
    return parts.join('\n\n') || '[Empty note]'
  } catch {
    return '[Could not parse Apple Notes export file.]'
  }
}

export function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim()
}
