'use client';

import Ably from 'ably';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type AblyContextType = {
  client: Ably.Realtime | null;
  channel: Ably.Types.RealtimeChannelPromise | null;
  presence: Ably.Types.RealtimePresencePromise | null;
  subscribe: (event: string, callback: (message: Ably.Types.Message) => void) => void;
  publish: (event: string, data: any) => void;
  enterPresence: (data: any) => void;
  updatePresence: (data: any) => void;
};

const AblyContext = createContext<AblyContextType>({
  client: null,
  channel: null,
  presence: null,
  subscribe: () => {},
  publish: () => {},
  enterPresence: () => {},
  updatePresence: () => {},
});

export function useAbly() {
  return useContext(AblyContext);
}

export function AblyProvider({ children, roomId }: { children: React.ReactNode; roomId: string }) {
  const [client, setClient] = useState<Ably.Realtime | null>(null);
  const [channel, setChannel] = useState<Ably.Types.RealtimeChannelPromise | null>(null);
  const [presence, setPresence] = useState<Ably.Types.RealtimePresencePromise | null>(null);

  useEffect(() => {
    const ablyClient = new Ably.Realtime({
      authUrl: '/api/ably/token',
      clientId: `user-${Math.random().toString(36).substr(2, 9)}`,
    });

    const channelInstance = ablyClient.channels.get(`[?rewind=20]room:${roomId}`);
    const presenceInstance = channelInstance.presence;

    setClient(ablyClient);
    setChannel(channelInstance);
    setPresence(presenceInstance);

    return () => {
      channelInstance.detach();
      ablyClient.close();
    };
  }, [roomId]);

  const subscribe = useCallback(
    (event: string, callback: (message: Ably.Types.Message) => void) => {
      if (!channel) return;
      channel.subscribe(event, callback);
    },
    [channel]
  );

  const publish = useCallback(
    (event: string, data: any) => {
      if (!channel) return;
      channel.publish(event, data);
    },
    [channel]
  );

  const enterPresence = useCallback(
    (data: any) => {
      if (!presence) return;
      presence.enter(data);
    },
    [presence]
  );

  const updatePresence = useCallback(
    (data: any) => {
      if (!presence) return;
      presence.update(data);
    },
    [presence]
  );

  return (
    <AblyContext.Provider
      value={{
        client,
        channel,
        presence,
        subscribe,
        publish,
        enterPresence,
        updatePresence,
      }}
    >
      {children}
    </AblyContext.Provider>
  );
}