type Props = {
  side: "left" | "right";
  text: string;
};

export default function MessageBubble({ side, text }: Props) {
  const isRight = side === "right";

  return (
    <div className={isRight ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isRight
            ? "max-w-[82%] rounded-2xl rounded-tr-md bg-[#DCF8C6] px-3 py-2 text-[15px] leading-6 text-zinc-900 shadow-sm"
            : "max-w-[82%] rounded-2xl rounded-tl-md bg-white px-3 py-2 text-[15px] leading-6 text-zinc-900 shadow-sm"
        }
      >
        <div className="whitespace-pre-wrap break-words">{text}</div>
      </div>
    </div>
  );
}
