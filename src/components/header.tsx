import Image from "next/image";
import { LogoutButton } from "./logout-button";

export function Header() {
  return (
    <header className="border-b-2 border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="Turner's Thunderdome"
            width={200}
            height={50}
            className="h-12 w-auto"
            priority
          />
        </div>
        <div className="flex items-center gap-4">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
