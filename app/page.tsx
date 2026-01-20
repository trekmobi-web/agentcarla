"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AdCard from "./components/AdCard";
import ChatHeader from "./components/ChatHeader";
import MessageBubble from "./components/MessageBubble";
import TypingBubble from "./components/TypingBubble";

type ChatItem =
  | { type: "message"; role: "user" | "assistant"; text: string; id: string }
  | { type: "ad"; id: string; adIndex: number };

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Home() {
  const [items, setItems] = useState<ChatItem[]>([
    {
      type: "message",
      role: "assistant",
      text: "Oi! Eu sou a Carla. Como posso te ajudar hoje?",
      id: uid(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const userMessageCount = useMemo(() => {
    return items.filter((i) => i.type === "message" && i.role === "user").length;
  }, [items]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [items, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);

    setItems((prev) => {
      const next: ChatItem[] = [
        ...prev,
        { type: "message", role: "user", text, id: uid() },
      ];

      const nextUserCount =
        prev.filter((i) => i.type === "message" && i.role === "user").length + 1;

      if (nextUserCount % 3 === 0) {
        const adIndex = Math.floor(nextUserCount / 3);
        next.push({ type: "ad", id: `ad-${adIndex}-${uid()}`, adIndex });
      }

      return next;
    });

    try {
      const messages = items
        .filter((i): i is Extract<ChatItem, { type: "message" }> =>
          i.type === "message",
        )
        .map((m) => ({
          role: m.role,
          content: m.text,
        }))
        .concat([{ role: "user" as const, content: text }]);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.error || "Erro ao responder");
      }

      setItems((prev) => [
        ...prev,
        {
          type: "message",
          role: "assistant",
          text: data.message || "",
          id: uid(),
        },
      ]);
    } catch {
      setItems((prev) => [
        ...prev,
        {
          type: "message",
          role: "assistant",
          text: "Tenta de novo rapidinho.",
          id: uid(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B141A]">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col bg-[#ECE5DD]">
        <ChatHeader />

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-3 py-3"
          style={{
            backgroundImage:
              "radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        >
          <div className="flex flex-col gap-2">
            {items.map((it) => {
              if (it.type === "ad") {
                return <AdCard key={it.id} adIndex={it.adIndex} />;
              }

              return (
                <MessageBubble
                  key={it.id}
                  side={it.role === "user" ? "right" : "left"}
                  text={it.text}
                />
              );
            })}

            {loading ? <TypingBubble /> : null}
          </div>
        </div>

        <div className="sticky bottom-0 w-full bg-[#F0F2F5] p-2">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Mensagem"
              rows={1}
              className="max-h-32 flex-1 resize-none rounded-3xl bg-white px-4 py-3 text-[15px] leading-5 text-zinc-900 outline-none ring-1 ring-black/5 placeholder:text-zinc-500"
            />

            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={loading || input.trim().length === 0}
              className="h-11 rounded-full bg-[#25D366] px-4 text-[15px] font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
            >
              Enviar
            </button>
          </div>

          <div className="px-2 pt-1 text-[11px] text-zinc-500">
            Mensagens do usuário: {userMessageCount}
          </div>
        </div>
      </div>
    </div>
  );
}
