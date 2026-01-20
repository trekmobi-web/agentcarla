"use client";

import { useEffect, useId, useMemo } from "react";

type Props = {
  adIndex: number;
};

export default function AdCard({ adIndex }: Props) {
  const reactId = useId();
  const divId = useMemo(
    () => `div-gpt-ad-1768928325283-${adIndex}-${reactId.replaceAll(":", "")}`,
    [adIndex, reactId],
  );

  useEffect(() => {
    const w = window as unknown as {
      googletag?: {
        cmd?: Array<() => void>;
        defineSlot?: (
          path: string,
          size: number[][],
          divId: string,
        ) => { addService?: (s: unknown) => void } | undefined;
        pubads?: () => unknown;
        display?: (divId: string) => void;
      };
    };

    const g = w.googletag;
    if (!g?.cmd) return;

    g.cmd.push(function () {
      try {
        if (!g.defineSlot || !g.display) return;

        const slot = g.defineSlot(
          "/21812513503/domus.buzz/domus_bloco_01",
          [[250, 250], [300, 250], [250, 300], [336, 280]],
          divId,
        );

        if (slot?.addService && g.pubads) {
          slot.addService(g.pubads());
        }

        g.display(divId);
      } catch {
        return;
      }
    });
  }, [divId]);

  return (
    <div className="my-2 flex w-full justify-center">
      <div className="w-full max-w-[360px] rounded-2xl bg-white/90 p-3 shadow-sm ring-1 ring-black/5">
        <p className="text-center text-[13px] text-zinc-600">Publicidade</p>
        <div
          id={divId}
          style={{ minWidth: 250, minHeight: 250 }}
          className="mx-auto mt-2 flex items-center justify-center"
        />
      </div>
    </div>
  );
}
