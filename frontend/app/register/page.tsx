import { RegisterForm } from "@/features/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--bg)] overflow-hidden">
      <RegisterForm />
    </main>
  );
}
