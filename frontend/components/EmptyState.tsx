interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="card-elevated p-12 text-center animate-fadeIn">
      {/* Illustration */}
      <div className="relative inline-block mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-2xl opacity-20 animate-pulse" />
        <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-3xl flex items-center justify-center">
          <svg className="w-12 h-12 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
      </div>

      {/* Text Content */}
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      {description && (
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{description}</p>
      )}

      {/* Decorative Elements */}
      <div className="mt-8 flex justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0s' }} />
        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
        <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
      </div>
    </div>
  );
}
