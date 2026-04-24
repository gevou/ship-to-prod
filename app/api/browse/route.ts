import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { url, goal } = await request.json();

  // TinyFish integration — wire up once key is available
  // const tinyfish = new TinyFish(process.env.TINYFISH_API_KEY);
  // const result = await tinyfish.browse({ url, goal });

  return NextResponse.json({
    success: true,
    url,
    goal,
    result: `[TinyFish placeholder] Would browse ${url} to accomplish: ${goal}`,
    mock: true,
  });
}
