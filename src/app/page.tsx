import { OnboardingForm } from "@/components/forms/OnboardingForm";
import { getSubmissions } from "@/lib/submissions/queries";

/**
 * Server Component entry point. It reads through the cached query
 * (tag: `submissions`), so a successful submission's revalidation
 * refreshes this list without any client-side fetching code.
 */
export default async function HomePage() {
  const submissions = await getSubmissions();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Form Management</h1>
        <p className="text-gray-600">
          A multi-step onboarding form with nested validation, dynamic field arrays,
          conditional organization fields, Server Actions and optimistic updates.
        </p>
      </header>
      <OnboardingForm initialSubmissions={submissions} />
    </main>
  );
}
