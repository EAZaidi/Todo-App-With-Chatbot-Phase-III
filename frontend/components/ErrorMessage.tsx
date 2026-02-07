interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, onRetry, onDismiss }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
      <div className="flex items-start gap-3">
        <svg className="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <p className="text-sm">{message}</p>
          <div className="mt-2 flex gap-3">
            {onRetry && (
              <button onClick={onRetry} className="text-sm font-medium text-red-600 hover:text-red-800 underline">
                Try again
              </button>
            )}
            {onDismiss && (
              <button onClick={onDismiss} className="text-sm font-medium text-red-600 hover:text-red-800 underline">
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
