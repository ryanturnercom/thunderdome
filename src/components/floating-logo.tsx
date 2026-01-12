"use client";

import Image from "next/image";

function playWelcomeSound() {
  const audio = new Audio("/welcome.wav");
  audio.play().catch(() => {});
}

export function MainLogo() {
  return (
    <div className="flex justify-center py-8">
      <Image
        src="/logo.png"
        alt="Turner's Thunderdome"
        width={800}
        height={200}
        className="h-80 w-auto cursor-pointer"
        priority
        onClick={playWelcomeSound}
      />
    </div>
  );
}
