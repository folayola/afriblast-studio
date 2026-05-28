// src/app/auth/page.tsx (Server Component Entry)
import { Metadata } from 'next';
import AuthClientForm from './AuthClient';

export const metadata: Metadata = {
  title: "Sign In | AfriBlast Studio",
  description: "Access your ultra-low latency live audio transmission and digital marketplace console.",
};

export default function AuthPage() {
  return <AuthClientForm />;
}