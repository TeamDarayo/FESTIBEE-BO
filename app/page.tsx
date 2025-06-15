import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">DalS2bo Admin</h1>
        <p className="text-lg mb-8">Welcome to the admin dashboard</p>
        
        <div className="grid gap-4">
          <Link 
            href="/festivals" 
            className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Manage Festivals
          </Link>
          <Link 
            href="/artists" 
            className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Manage Artists
          </Link>
        </div>
      </div>
    </main>
  );
} 