import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Shield, AlertCircle } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { signMessage } from '@/services/wallet';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { connect, isConnecting } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      const account = await connect();
      const message = `Welcome to CivicChain!\n\nSign this message to verify your wallet ownership.\n\nWallet: ${account}\nTimestamp: ${Date.now()}`;
      const signature = await signMessage(message);

      const res = await api.post('/auth/connect-wallet', {
        walletAddress: account,
        signature,
        message,
      });

      if (res.data.success) {
        localStorage.setItem('civicchain_token', res.data.data.token);
        toast.success('Wallet connected successfully!');
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to connect wallet';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="card max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="text-primary-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to CivicChain</h1>
          <p className="text-gray-500 mt-2">Connect your wallet to get started</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={loading || isConnecting}
          className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base"
        >
          <Wallet size={20} />
          {loading || isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-sm text-gray-700 mb-3">How it works:</h3>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary-600 min-w-[20px]">1.</span>
              Install MetaMask browser extension
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary-600 min-w-[20px]">2.</span>
              Create or import a wallet
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary-600 min-w-[20px]">3.</span>
              Click "Connect Wallet" and sign the message
            </li>
          </ol>
        </div>

        {!window.ethereum && (
          <div className="mt-4 flex items-start gap-2 bg-yellow-50 text-yellow-800 px-4 py-3 rounded-lg text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>MetaMask not detected. Please install the MetaMask browser extension to continue.</span>
          </div>
        )}
      </div>
    </div>
  );
}
