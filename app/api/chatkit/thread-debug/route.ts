import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY não configurada" },
      { status: 500 },
    );
  }

  const url = new URL(req.url);
  const threadId = url.searchParams.get("threadId");

  if (!threadId) {
    return NextResponse.json({ error: "threadId é obrigatório" }, { status: 400 });
  }

  const upstreamUrl = `https://api.openai.com/v1/chatkit/threads/${encodeURIComponent(threadId)}/items?limit=50&order=asc`;

  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        "OpenAI-Beta": "chatkit_beta=v1",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const raw = await response.text();
    let json: any = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = null;
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Erro ao consultar thread",
          status: response.status,
          details: json ?? raw,
        },
        { status: response.status },
      );
    }

    const items: any[] = Array.isArray(json?.data) ? json.data : [];

    const compactItems = items.map((it) => {
      const type = it?.type;
      let text = "";
      const content = it?.content;
      if (Array.isArray(content)) {
        const first = content.find((c: any) => c?.text);
        if (first?.text) text = String(first.text);
      }
      return { id: it?.id, type, text };
    });

    const summary = compactItems.slice(0, 10);

    return NextResponse.json({
      count: compactItems.length,
      summary,
      items: compactItems,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Falha na requisição", details: String(e) },
      { status: 500 },
    );
  }
}
