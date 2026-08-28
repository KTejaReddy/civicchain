import { ethers } from 'ethers';

export function verifySignature(
  message: string,
  signature: string,
  walletAddress: string
): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch {
    return false;
  }
}
