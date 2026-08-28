import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Wallet, Shield, MenuIcon, User } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

const navLinks = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/campaigns', label: 'Campaigns' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/governance', label: 'Governance' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { account, isConnected, connect, disconnect } = useWallet();

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="text-primary-600" size={28} />
            <span className="text-xl font-bold text-gray-900">CivicChain</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <User size={14} />
                  <span className="font-mono">{truncateAddress(account!)}</span>
                </Link>
                <button
                  onClick={disconnect}
                  className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button onClick={connect} className="btn-primary flex items-center gap-2 text-sm">
                <Wallet size={16} />
                Connect Wallet
              </button>
            )}
          </div>

          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(link.path)
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2" />
            {isConnected ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span className="font-mono">{truncateAddress(account!)}</span>
                </Link>
                <button
                  onClick={() => { disconnect(); setMobileOpen(false); }}
                  className="block w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={() => { connect(); setMobileOpen(false); }}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Wallet size={16} />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
