import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'ANTHROPIC_API_KEY is not configured. Add it to your Vercel environment variables, then redeploy.',
      },
      { status: 500 }
    )
  }

  let text: string
  try {
    const body = await req.json()
    text = body.text
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!text?.trim()) {
    return NextResponse.json({ error: 'No script text provided' }, { status: 400 })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `You are a professional teleprompter coach. Transform this script into a keyword trigger guide that helps speakers deliver their content naturally and confidently.

For each paragraph in the script:
1. Write a SHORT bold header (3–5 words) that names the topic — wrap it in ** like **Header Text**
2. Add 3–5 bullet points. Each bullet is a SHORT trigger phrase (2–5 words) the speaker uses as a memory anchor.
3. Wrap the single most important word in each bullet in ** like **word** to bold it.
4. Leave a blank line between sections.

IMPORTANT: Keep everything extremely brief. The teleprompter reader sees these triggers and naturally expands on them. Do NOT copy full sentences.

Example output:
**Opening · Welcome**
• good evening, **honor**
• incredible people here
• something **special** tonight

**Rising to the Challenge**
• faced **hard obstacles**
• collaborated and **innovated**
• exceeded every expectation

**Closing · Thank You**
• celebration of **who we are**
• team makes it possible
• **thank you** all

Now transform this script:

${text}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Anthropic API error:', response.status, errText)
      return NextResponse.json(
        { error: `Anthropic API returned ${response.status}` },
        { status: 500 }
      )
    }

    const data = await response.json()
    const enhanced: string = data.content?.[0]?.text ?? ''
    return NextResponse.json({ enhanced })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Enhancement failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
