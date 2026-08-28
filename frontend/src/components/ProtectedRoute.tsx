import { Navigate } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { account } = useWallet();

  if (!account) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
