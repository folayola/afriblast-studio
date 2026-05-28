import { Metadata } from 'next';
import AfriBlastGlobalLandingPage from './LandingClient';

export const metadata: Metadata = {
  title: "AfriBlast | Broadcast Live Audio & Distribute Digital Assets",
  description: "High-performance live audio and digital commerce network for creators, ministries, and educators.",
};

export default function Home() {
  return <AfriBlastGlobalLandingPage />;
}