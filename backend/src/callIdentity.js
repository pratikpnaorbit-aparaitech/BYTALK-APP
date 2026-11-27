import mongoose from 'mongoose';

export function canonicalCallUserId(user, fallback) {
  const candidate = user?._id ?? user?.id ?? fallback;
  const id = candidate == null ? '' : String(candidate);
  return mongoose.isObjectIdOrHexString(id) ? id : null;
}
