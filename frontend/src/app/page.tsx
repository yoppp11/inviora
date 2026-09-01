import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InvioraLogo } from '@/components/brand/inviora-logo';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4">
          <InvioraLogo size="sm" className="sm:[&_span]:text-xl" />
          <Link href="/auth/login">
            <Button size="sm" className="sm:h-10">Sign In</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-2xl">
          <div className="flex justify-center mb-8">
            <InvioraLogo size="lg" className="scale-125 sm:scale-150" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Beautiful Wedding Invitations
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-8">
            Personalized digital wedding invitations for every guest. Manage templates,
            guests, and unique invitation links in one place.
          </p>
          <p className="text-sm text-muted-foreground">
            Access is provided by your administrator. Please sign in to continue.
          </p>
        </div>
      </main>
    </div>
  );
}
