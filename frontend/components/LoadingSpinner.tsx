interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  label?: string;
}

export function LoadingSpinner({ size = 'medium', label }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'h-5 w-5',
    medium: 'h-10 w-10',
    large: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center" role="status" aria-busy="true">
      {/* Animated spinner with gradient */}
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full border-4 border-slate-200 dark:border-slate-700`} />
        <div
          className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-4 border-transparent border-t-indigo-500 border-r-purple-500 animate-spin`}
        />
        {/* Inner glow */}
        <div className="absolute inset-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-sm animate-pulse" />
      </div>

      {label && (
        <span className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400 animate-pulse">
          {label}
        </span>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
