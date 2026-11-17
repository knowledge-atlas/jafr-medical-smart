import { createHash } from 'node:crypto';
export const CryptoDigestAlgorithm = { SHA256: 'SHA-256' } as const;
export const digestStringAsync = async (_alg: string, s: string) =>
  createHash('sha256').update(s).digest('hex');
