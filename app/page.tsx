"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AdCard from "./components/AdCard";
import ChatHeader from "./components/ChatHeader";
import MessageBubble from "./components/MessageBubble";
import TypingBubble from "./components/TypingBubble";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export default function Home() {
  const [status, setStatus] = useState<string>("");
  const [showStatus, setShowStatus] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  const userMessageCount = useMemo(() => {
    return messages.filter((m) => m.role === "user").length;
  }, [messages]);

  useEffect(() => {
    setSending(false);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    if (sending) return;
    const userMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      text,
    };

    setSending(true);
    setShowStatus(false);
    setStatus("");
    setMessages((prev) => [...prev, userMessage]);

    try {
      const controller = new AbortController();
      const t = window.setTimeout(() => controller.abort(), 10000);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [
            ...messagesRef.current.map((m) => ({
              role: m.role,
              content: m.text,
            })),
            { role: "user", content: text },
          ],
        }),
      });

      window.clearTimeout(t);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Falha ao chamar /api/chat");
      }

      const data = (await response.json()) as { message?: string };
      const assistantText = (data.message || "").trim();

      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}-assistant`,
          role: "assistant",
          text: assistantText,
        },
      ]);

      setInput("");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setStatus("Envio demorou demais e foi cancelado. Tente novamente.");
      } else {
        setStatus(`Falha ao enviar: ${String(e)}`);
      }
      setShowStatus(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#0B141A]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[520px] flex-col bg-[#ECE5DD]">
        <ChatHeader />

        <div
          ref={scrollRef}
          className="relative min-h-0 flex-1 overflow-y-auto px-3 py-3"
          style={{
            backgroundImage:
              "radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        >
          <div className="flex flex-col gap-2">
            {messages.map((m, idx) => {
              const userIndex = messages
                .slice(0, idx + 1)
                .filter((x) => x.role === "user").length;

              const shouldInsertAd = userIndex > 0 && userIndex % 3 === 0 && m.role === "user";

              const adIndex = Math.floor((userIndex - 1) / 3);

              return (
                <div key={m.id} className="flex flex-col gap-2">
                  <MessageBubble
                    side={m.role === "user" ? "right" : "left"}
                    text={m.text}
                  />
                  {shouldInsertAd ? <AdCard adIndex={adIndex} /> : null}
                </div>
              );
            })}

            {sending ? <TypingBubble /> : null}
          </div>

          {showStatus && status ? (
            <div className="pointer-events-none sticky top-2">
              <div className="rounded-xl bg-white/90 p-3 text-[13px] text-zinc-700 shadow-sm ring-1 ring-black/5">
                {status}
              </div>
            </div>
          ) : null}
        </div>

        <div className="bg-[#F0F2F5] px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Mensagem"
              rows={1}
              className="max-h-32 flex-1 resize-none rounded-3xl bg-white px-4 py-3 text-[15px] leading-5 text-zinc-900 outline-none ring-1 ring-black/5 placeholder:text-zinc-500"
            />

            <button
              type="button"
              onClick={() => void send()}
              aria-disabled={sending}
              className={`h-11 rounded-full bg-[#25D366] px-4 text-[15px] font-semibold text-white shadow-sm transition-opacity ${sending ? "opacity-50" : "opacity-100"}`}
            >
              Enviar
            </button>
          </div>

          <div className="px-2 pt-1 text-[11px] text-zinc-500">
            sending: {String(sending)} | msgs usuário: {userMessageCount}
          </div>
        </div>
      </div>
    </div>
  );
}
