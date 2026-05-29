'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-amber-500 mb-4">Error</h1>
        <p className="text-amber-200 mb-8">{error.message || 'Algo salió mal'}</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-amber-800 hover:bg-amber-700 text-white rounded-lg"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
