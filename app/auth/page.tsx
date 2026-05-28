// src/app/auth/page.tsx
import { Metadata } from 'next';
import AuthClientForm from './AuthClient';

// This line forces Next.js to skip static generation and evaluate this page purely at runtime!
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Sign In | AfriBlast Studio",
  description: "Access your ultra-low latency live audio transmission and digital marketplace console.",
};

export default function AuthPage() {
  return <AuthClientForm />;
}