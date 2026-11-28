// app/404.tsx
import Link from "next/link";

export default function Custom404() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-orange-50 text-orange-900">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl mb-6">Oops! The page you are looking for does not exist.</p>
      <Link
        href="/pages/home"
        className="px-6 py-3 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
      >
        Go Back Home
      </Link>
    </div>
  );
}
