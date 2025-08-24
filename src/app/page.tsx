import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome 👋</h1>
      <p className="text-muted-foreground">
        This starter includes shadcn/ui, theming, React Query, forms with RHF + Zod,
        linting, CI, analytics, and more.
      </p>
      <div className="flex gap-3">
        <Link href="/dashboard"><Button>Open Dashboard</Button></Link>
        <Link href="/forms"><Button variant="outline">Open Forms</Button></Link>
        <Link href="/theme"><Button variant="ghost">Open Theme</Button></Link>
      </div>
    </section>
  );
}
