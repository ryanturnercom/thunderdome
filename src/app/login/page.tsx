import { LoginForm } from "@/components/login-form";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-8">
      <Image
        src="/logo.png"
        alt="Turner's Thunderdome"
        width={400}
        height={100}
        className="h-24 w-auto"
        priority
      />
      <LoginForm />
    </div>
  );
}
