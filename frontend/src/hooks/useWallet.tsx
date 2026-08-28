import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { connectWallet, signMessage, getSigner, getProviderInstance, getBalance } from '@/services/wallet';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

interface WalletState {
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string;
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  connect: () => Promise<string>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState>({
  account: null,
  isConnected: false,
  isConnecting: false,
  balance: '0',
  signer: null,
  provider: null,
  connect: async () => { return ''; },
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(() => localStorage.getItem('civicchain_wallet'));
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState('0');
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  const updateBalance = useCallback(async (addr: string) => {
    try {
      const bal = await getBalance();
      setBalance(bal);
    } catch {
      setBalance('0');
    }
  }, []);

  useEffect(() => {
    if (account && window.ethereum) {
      (async () => {
        try {
          const p = getProviderInstance() || new BrowserProvider(window.ethereum);
          setProvider(p);
          const s = await p.getSigner();
          setSigner(s);
          await updateBalance(account);
        } catch {
          // silently fail
        }
      })();
    }
  }, [account, updateBalance]);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAccount(accounts[0]);
          localStorage.setItem('civicchain_wallet', accounts[0]);
          updateBalance(accounts[0]);
        }
      };
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [updateBalance]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const addr = await connectWallet();
      setAccount(addr);
      localStorage.setItem('civicchain_wallet', addr);
      const p = getProviderInstance();
      setProvider(p);
      const s = getSigner();
      setSigner(s);
      await updateBalance(addr);
      return addr;
    } catch (err: any) {
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [updateBalance]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setProvider(null);
    setBalance('0');
    localStorage.removeItem('civicchain_wallet');
    localStorage.removeItem('civicchain_token');
  }, []);

  return (
    <WalletContext.Provider
      value={{
        account,
        isConnected: !!account,
        isConnecting,
        balance,
        signer,
        provider,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
