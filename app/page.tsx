"use client";

import { createElement, useEffect, useMemo, useRef, useState } from "react";
import AdCard from "./components/AdCard";
import ChatHeader from "./components/ChatHeader";

type ChatKitElement = HTMLElement & {
  setOptions?: (opts: unknown) => void;
  addEventListener: HTMLElement["addEventListener"];
  removeEventListener: HTMLElement["removeEventListener"];
};

function getOrCreateDeviceId() {
  if (typeof window === "undefined") return "anonymous";
  const key = "carla_device_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(key, id);
  return id;
}

export default function Home() {
  const chatkitRef = useRef<ChatKitElement | null>(null);
  const [chatkitEl, setChatkitEl] = useState<ChatKitElement | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [status, setStatus] = useState<string>("Carregando chat...");

  const shouldShowAd = useMemo(() => {
    return userCount > 0 && userCount % 3 === 0;
  }, [userCount]);

  const adIndex = useMemo(() => {
    return Math.max(1, Math.floor(userCount / 3));
  }, [userCount]);

  useEffect(() => {
    if (!chatkitEl) return;

    const deviceId = getOrCreateDeviceId();
    let cancelled = false;
    const el = chatkitEl;

    async function init() {
      try {
        if ("customElements" in window && window.customElements?.whenDefined) {
          await window.customElements.whenDefined("openai-chatkit");
        }

        if (cancelled) return;
        if (!el.setOptions) {
          setStatus("Chat carregado, aguardando inicialização...");
          return;
        }

        el.setOptions({
          api: {
            async getClientSecret(existing: string | null) {
              if (existing) return existing;

              const res = await fetch("/api/chatkit/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deviceId }),
              });

              const data = (await res.json()) as {
                client_secret?: string;
                error?: string;
                details?: unknown;
              };

              if (!res.ok) {
                setStatus(
                  `Erro ao criar sessão: ${data.error || "falha"}. Verifique OPENAI_API_KEY e WORKFLOW_ID.`,
                );
                return "";
              }

              if (!data.client_secret) {
                setStatus(
                  "Sessão criada sem client_secret. Verifique permissões do workflow.",
                );
                return "";
              }

              setStatus("Pronto");
              return data.client_secret;
            },
          },
          locale: "pt-BR",
          header: { visible: false },
          frameTitle: "Carla",
        });
      } catch {
        setStatus("Falha ao inicializar o chat.");
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [chatkitEl]);

  useEffect(() => {
    const el = chatkitEl;
    if (!el) return;

    const onThreadChange = (event: Event) => {
      const e = event as CustomEvent<{ threadId: string | null }>;
      setThreadId(e.detail?.threadId ?? null);
    };

    const onResponseEnd = () => {
      return;
    };

    el.addEventListener("chatkit.thread.change", onThreadChange as EventListener);
    el.addEventListener("chatkit.response.end", onResponseEnd);

    return () => {
      el.removeEventListener(
        "chatkit.thread.change",
        onThreadChange as EventListener,
      );
      el.removeEventListener("chatkit.response.end", onResponseEnd);
    };
  }, [chatkitEl]);

  useEffect(() => {
    if (!threadId) return;

    let cancelled = false;

    async function refreshCount() {
      const res = await fetch(`/api/chatkit/thread-items?threadId=${threadId}`);
      const data = (await res.json()) as { userCount?: number };
      if (cancelled) return;
      if (typeof data.userCount === "number") setUserCount(data.userCount);
    }

    void refreshCount();
    const t = window.setInterval(refreshCount, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [threadId]);

  return (
    <div className="min-h-[100dvh] bg-[#0B141A]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[520px] flex-col bg-[#ECE5DD]">
        <ChatHeader />

        <div className="relative min-h-0 flex-1 overflow-hidden">
          {createElement("openai-chatkit", {
            ref: (node: unknown) => {
              const el = node as ChatKitElement | null;
              chatkitRef.current = el;
              setChatkitEl(el);
            },
            className: "block h-full w-full",
          })}

          {status !== "Pronto" ? (
            <div className="pointer-events-none absolute left-0 right-0 top-14 mx-auto max-w-[520px] px-3">
              <div className="rounded-xl bg-white/90 p-3 text-[13px] text-zinc-700 shadow-sm ring-1 ring-black/5">
                {status}
              </div>
            </div>
          ) : null}
        </div>

        <div
          className="bg-[#F0F2F5] pb-[max(8px,env(safe-area-inset-bottom))]"
          style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
        >
          {shouldShowAd ? <AdCard adIndex={adIndex} /> : null}
        </div>
      </div>
    </div>
  );
}
