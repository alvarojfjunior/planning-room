'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAbly } from './ably-provider';
import type * as Ably from 'ably';

type Vote = {
  userId: string;
  value: number;
};

type Issue = {
  id: string;
  title: string;
  votes: Vote[];
  revealed: boolean;
};

type User = {
  clientId: string;
  name: string;
  role: 'participant' | 'spectator';
};

type PresenceMember = Ably.Types.PresenceMessage & {
  data: User;
};

export function useRoom(user: User) {
  const { subscribe, publish, presence } = useAbly();
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!presence) return;

    presence.enter(user);

    presence.get((err, members) => {
      if (err || !members) return;
      setUsers(members.map((member) => member.data as User));
    });

    presence.subscribe('enter', (member) => {
      setUsers((prev) => [...prev, member.data as User]);
    });

    presence.subscribe('leave', (member) => {
      setUsers((prev) =>
        prev.filter((u) => u.clientId !== (member.data as User).clientId)
      );
    });

    presence.subscribe('update', (member) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.clientId === (member.data as User).clientId ? member.data as User : u
        )
      );
    });

    return () => {
      presence.leave();
    };
  }, [presence, user]);

  const vote = useCallback(
    (value: number) => {
      if (!currentIssue) return;
      publish('vote', { userId: user.clientId, value });
    },
    [currentIssue, publish, user.clientId]
  );

  const revealVotes = useCallback(() => {
    if (!currentIssue) return;
    publish('reveal', { issueId: currentIssue.id });
  }, [currentIssue, publish]);

  const resetVotes = useCallback(() => {
    if (!currentIssue) return;
    publish('reset', { issueId: currentIssue.id });
  }, [currentIssue, publish]);

  const createIssue = useCallback(
    (title: string) => {
      const issue: Issue = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        votes: [],
        revealed: false,
      };
      publish('issue:create', issue);
    },
    [publish]
  );

  useEffect(() => {
    const voteHandler = (message: Ably.Types.Message) => {
      setCurrentIssue((prev) => {
        if (!prev) return prev;
        const vote = message.data as Vote;
        const existingVoteIndex = prev.votes.findIndex(
          (v) => v.userId === vote.userId
        );

        if (existingVoteIndex > -1) {
          const newVotes = [...prev.votes];
          newVotes[existingVoteIndex] = vote;
          return { ...prev, votes: newVotes };
        }

        return { ...prev, votes: [...prev.votes, vote] };
      });
    };

    const revealHandler = () => {
      setCurrentIssue((prev) => (prev ? { ...prev, revealed: true } : prev));
    };

    const resetHandler = () => {
      setCurrentIssue((prev) =>
        prev ? { ...prev, votes: [], revealed: false } : prev
      );
    };

    const issueCreateHandler = (message: Ably.Types.Message) => {
      setCurrentIssue(message.data as Issue);
    };

    subscribe('vote', voteHandler);
    subscribe('reveal', revealHandler);
    subscribe('reset', resetHandler);
    subscribe('issue:create', issueCreateHandler);

    return () => {
      // Cleanup is handled by the AblyProvider
    };
  }, [subscribe]);

  return {
    users,
    currentIssue,
    vote,
    revealVotes,
    resetVotes,
    createIssue,
  };
}