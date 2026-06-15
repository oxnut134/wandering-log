import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const { name, lat, lng } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Write a short description (around 200 characters) in English for tourists about the place called "${name}".`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    const description = textBlock?.type === 'text' ? textBlock.text : '';

    return NextResponse.json({ description });
  } catch (error) {
    console.error('Description generation error:', error);
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 });
  }
}
