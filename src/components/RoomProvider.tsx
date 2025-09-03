'use client';

import { AblyProvider } from '@/lib/ably-provider';
import { useParams } from 'next/navigation';

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const roomId = params.roomId as string;

  if (!roomId) {
    return children;
  }

  return <AblyProvider roomId={roomId}>{children}</AblyProvider>;
}