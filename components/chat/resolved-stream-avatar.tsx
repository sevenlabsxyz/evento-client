'use client';

import { getChannelMemberUser } from '@/lib/utils/stream-chat-display';
import type { AvatarProps } from 'stream-chat-react';
import { Avatar as StreamAvatar, useChannelStateContext } from 'stream-chat-react';

export function ResolvedStreamAvatar(props: AvatarProps) {
  const { channel } = useChannelStateContext('ResolvedStreamAvatar');
  const resolvedUser = getChannelMemberUser(channel, props.user?.id);

  return (
    <StreamAvatar
      {...props}
      image={resolvedUser?.image ?? props.image}
      name={resolvedUser?.name || props.name}
      user={resolvedUser ?? props.user}
    />
  );
}
