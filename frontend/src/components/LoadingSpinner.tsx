import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  size?: number;
}

export default function LoadingSpinner({ text = 'Loading...', size = 32 }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="animate-spin text-primary-600 mb-3" size={size} />
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}
