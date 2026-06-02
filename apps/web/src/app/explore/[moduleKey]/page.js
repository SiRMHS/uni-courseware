import { DynamicAssetExplorer } from "@/components/DynamicAssetExplorer";

export async function generateMetadata({ params }) {
  const { moduleKey } = await params;
  return {
    title: `مرور محتوا — ${moduleKey}`,
  };
}

export default async function ExplorePage({ params }) {
  const { moduleKey } = await params;

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">مرور محتوا</h1>
        <p className="mt-2 text-muted-foreground">
          ماژول:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm" dir="ltr">
            {moduleKey}
          </code>
        </p>
      </header>

      <DynamicAssetExplorer moduleKey={moduleKey} />
    </main>
  );
}
