import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-amber-500 mb-4">404</h1>
        <p className="text-amber-200 text-xl mb-8">Página no encontrada</p>
        <Link href="/" className="px-6 py-3 bg-amber-800 hover:bg-amber-700 text-white rounded-lg inline-block">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
