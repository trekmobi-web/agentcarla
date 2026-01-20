import { NextResponse } from "next/server";

type Body = {
  deviceId?: string;
};

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const workflowId = process.env.WORKFLOW_ID;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY não configurada" },
      { status: 500 },
    );
  }

  if (!workflowId) {
    return NextResponse.json(
      { error: "WORKFLOW_ID não configurado" },
      { status: 500 },
    );
  }

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const deviceId =
    typeof body.deviceId === "string" && body.deviceId.trim()
      ? body.deviceId.trim()
      : "anonymous";

  try {
    const response = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "OpenAI-Beta": "chatkit_beta=v1",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        workflow: { id: workflowId },
        user: deviceId,
      }),
    });

    const json = (await response.json()) as unknown;

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao criar sessão ChatKit", details: json },
        { status: 500 },
      );
    }

    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json(
      { error: "Falha na requisição", details: String(e) },
      { status: 500 },
    );
  }
}
