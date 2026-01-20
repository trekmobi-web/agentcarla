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

  try {
    const response = await fetch(
      `https://api.openai.com/v1/chatkit/threads/${encodeURIComponent(threadId)}/items?limit=200&order=asc`,
      {
        headers: {
          "OpenAI-Beta": "chatkit_beta=v1",
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    const json = (await response.json()) as {
      data?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
      error?: unknown;
    };

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao listar itens da thread", details: json },
        { status: 500 },
      );
    }

    const userCount = (json.data || []).filter((it) => it.type === "user_message")
      .length;

    return NextResponse.json({ userCount });
  } catch (e) {
    return NextResponse.json(
      { error: "Falha na requisição", details: String(e) },
      { status: 500 },
    );
  }
}
