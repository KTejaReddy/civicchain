import { BrowserProvider, JsonRpcSigner, formatEther } from 'ethers';

let provider: BrowserProvider | null = null;
let signer: JsonRpcSigner | null = null;

declare global {
  interface Window {
    ethereum?: any;
  }
}

function getProvider(): BrowserProvider {
  if (!provider) {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }
    provider = new BrowserProvider(window.ethereum);
  }
  return provider;
}

export async function connectWallet(): Promise<string> {
  const p = getProvider();
  const accounts = await p.send('eth_requestAccounts', []);
  signer = await p.getSigner();
  return accounts[0];
}

export async function signMessage(message: string): Promise<string> {
  if (!signer) {
    const p = getProvider();
    signer = await p.getSigner();
  }
  return signer.signMessage(message);
}

export function getSigner(): JsonRpcSigner | null {
  return signer;
}

export function getProviderInstance(): BrowserProvider | null {
  return provider;
}

export async function getBalance(): Promise<string> {
  const p = getProvider();
  const accounts = await p.send('eth_accounts', []);
  if (accounts.length === 0) throw new Error('No accounts found');
  const balance = await p.getBalance(accounts[0]);
  return formatEther(balance);
}
