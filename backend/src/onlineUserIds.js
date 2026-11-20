import mongoose from 'mongoose';

export function getOnlineObjectIds(socketMap, currentUserId) {
  const currentId = String(currentUserId).toLowerCase();
  return [...new Set(
    [...socketMap.entries()]
      .filter(([id, sockets]) => (
        mongoose.isObjectIdOrHexString(String(id))
        && String(id).toLowerCase() !== currentId
        && sockets?.size > 0
      ))
      .map(([id]) => String(id))
  )];
}
