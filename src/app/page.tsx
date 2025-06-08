import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  return <LoginForm error={searchParams.error} />;
}
