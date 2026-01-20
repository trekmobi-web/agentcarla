import Image from "next/image";

export default function ChatHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center gap-3 bg-[#075E54] px-4 text-white shadow-sm">
      <div className="h-9 w-9 overflow-hidden rounded-full bg-white/20">
        <Image
          src="/vercel.svg"
          alt="Carla"
          width={36}
          height={36}
          className="h-9 w-9 object-contain opacity-90"
        />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[15px] font-semibold leading-5">
          Carla
        </div>
        <div className="truncate text-[12px] leading-4 text-white/80">
          online
        </div>
      </div>
    </header>
  );
}
