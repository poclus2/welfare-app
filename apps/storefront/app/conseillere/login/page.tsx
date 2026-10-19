import { LoginForm } from "@/components/advisor/login-form";

export default async function AdvisorLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <LoginForm next={next || "/conseillere"} />;
}
