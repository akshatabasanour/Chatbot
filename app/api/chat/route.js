import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000', 
        'X-Title': 'Silver Query UI',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: messages,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API Error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ message: data.choices[0].message });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch response' },
      { status: 500 }
    );
  }
}
