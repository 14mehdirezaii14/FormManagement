import type { Submission } from "@/lib/submissions/types";

/**
 * Server-rendered in spirit, client-rendered in practice: the page
 * passes the cached server list in, and this component renders the
 * optimistic list it receives, so a pending row appears instantly
 * above the confirmed rows without a separate loading spinner.
 */
export function SubmissionList({ submissions }: { submissions: Submission[] }) {
  if (submissions.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
        No submissions yet. Complete the form and your first entry will appear here.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="Form submissions">
      {submissions.map((submission) => (
        <li
          key={submission.id}
          className="rounded-md border border-gray-200 bg-white p-4 shadow-sm"
          aria-busy={submission.isOptimistic}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-gray-900">{submission.values.personal.fullName}</p>
            {submission.isOptimistic ? (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                Saving…
              </span>
            ) : (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                Saved
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{submission.values.personal.email}</p>
          <p className="mt-1 text-xs text-gray-500">
            {submission.values.addresses.length} address
            {submission.values.addresses.length === 1 ? "" : "es"} · {submission.values.team.length}{" "}
            team member{submission.values.team.length === 1 ? "" : "s"} ·{" "}
            {new Date(submission.createdAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
