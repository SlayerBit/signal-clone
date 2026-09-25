import { LoginForm } from "@/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--bg)] overflow-hidden">
      <LoginForm />
    </main>
  );
}
