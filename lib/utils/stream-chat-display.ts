import type { Channel, UserResponse } from 'stream-chat';

export function getChannelMemberUser(
  channel: Channel | undefined,
  userId: string | undefined
): UserResponse | undefined {
  if (!channel || !userId) {
    return undefined;
  }

  const members = Object.values(channel.state.members || {});
  return members.find((member) => member.user?.id === userId)?.user;
}

export function getDirectMessagePartner(
  channel: Channel | undefined,
  currentUserId: string | undefined
): UserResponse | undefined {
  if (!channel || !currentUserId) {
    return undefined;
  }

  const members = Object.values(channel.state.members || {});
  if (members.length !== 2) {
    return undefined;
  }

  return members.find((member) => member.user?.id !== currentUserId)?.user;
}
