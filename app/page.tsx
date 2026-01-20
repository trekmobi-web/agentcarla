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
  const [threadId, setThreadId] = useState<string | null>(null);
  const [userCount, setUserCount] = useState(0);

  const shouldShowAd = useMemo(() => {
    return userCount > 0 && userCount % 3 === 0;
  }, [userCount]);

  const adIndex = useMemo(() => {
    return Math.max(1, Math.floor(userCount / 3));
  }, [userCount]);

  useEffect(() => {
    const el = chatkitRef.current;
    if (!el?.setOptions) return;

    const deviceId = getOrCreateDeviceId();

    el.setOptions({
      api: {
        async getClientSecret(existing: string | null) {
          if (existing) return existing;
          const res = await fetch("/api/chatkit/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceId }),
          });
          const data = (await res.json()) as { client_secret?: string };
          return data.client_secret || "";
        },
      },
      locale: "pt-BR",
      header: { visible: false },
      frameTitle: "Carla",
    });
  }, []);

  useEffect(() => {
    const el = chatkitRef.current;
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
  }, []);

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

        <div className="flex-1 overflow-hidden">
          {createElement("openai-chatkit", {
            ref: chatkitRef as unknown as never,
            className: "block h-full w-full",
          })}
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
