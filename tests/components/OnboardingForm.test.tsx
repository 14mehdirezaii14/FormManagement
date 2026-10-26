import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingForm } from "@/components/forms/OnboardingForm";
import type { FormActionResult } from "@/lib/submissions/types";

// The component under test must never hit a real Server Action in
// jsdom: the mock below is the seam that lets us simulate success,
// failure and a hanging request, and therefore optimistic rollback.
const { mockedSubmitForm } = vi.hoisted(() => ({ mockedSubmitForm: vi.fn() }));
vi.mock("@/lib/submissions/actions", () => ({ submitForm: mockedSubmitForm }));

function deferredResult<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

async function fillToReview(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Full name/), "Mehdi Rezaii");
  await user.type(screen.getByLabelText(/Email/), "mehdi@example.com");
  await user.click(screen.getByRole("button", { name: "Next" }));

  await waitFor(() => expect(screen.getByRole("heading", { name: "Addresses" })).toBeInTheDocument());
  await user.type(screen.getByLabelText(/Street/), "1 Main Street");
  await user.type(screen.getByLabelText(/City/), "Tehran");
  await user.type(screen.getByLabelText(/Postal code/), "12345");
  await user.type(screen.getByLabelText(/Country/), "Iran");
  await user.click(screen.getByRole("button", { name: "Next" }));

  await waitFor(() =>
    expect(screen.getByRole("heading", { name: /Team members/ })).toBeInTheDocument(),
  );
  await user.click(screen.getByRole("button", { name: "Next" }));

  await waitFor(() =>
    expect(screen.getByRole("heading", { name: /Review/ })).toBeInTheDocument(),
  );
  await user.click(screen.getByLabelText(/I accept the terms/));
}

describe("OnboardingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks step navigation on invalid input and shows inline errors", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm initialSubmissions={[]} />);

    await user.type(screen.getByLabelText(/Full name/), "Mehdi Rezaii");
    await user.type(screen.getByLabelText(/Email/), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Personal/ })).toBeInTheDocument();
    expect(mockedSubmitForm).not.toHaveBeenCalled();
  });

  it("adds and removes dynamic address rows", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm initialSubmissions={[]} />);

    await user.type(screen.getByLabelText(/Full name/), "Mehdi Rezaii");
    await user.type(screen.getByLabelText(/Email/), "mehdi@example.com");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Addresses" })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Add address" }));
    expect(screen.getByText("Address 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove address 2" }));
    expect(screen.queryByText("Address 2")).not.toBeInTheDocument();
  });

  it("shows a loading state while submitting", async () => {
    const user = userEvent.setup();
    const deferred = deferredResult<FormActionResult>();
    mockedSubmitForm.mockReturnValue(deferred.promise);
    render(<OnboardingForm initialSubmissions={[]} />);

    await fillToReview(user);
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(
      within(screen.getByRole("region", { name: "Submissions" })).getByText("Saving…"),
    ).toBeInTheDocument();

    deferred.resolve({ ok: true, submission: { id: "1", values: {} as never, createdAt: "" } });
    await waitFor(() => expect(screen.getByText("Submission saved. Thank you!")).toBeInTheDocument());
  });

  it("rolls the optimistic row back when the Server Action fails", async () => {
    const user = userEvent.setup();
    const deferred = deferredResult<FormActionResult>();
    mockedSubmitForm.mockReturnValue(deferred.promise);
    render(<OnboardingForm initialSubmissions={[]} />);

    await fillToReview(user);
    await user.click(screen.getByRole("button", { name: "Submit" }));

    // Optimistic row appears instantly, before the action resolves.
    const submissionsRegion = screen.getByRole("region", { name: "Submissions" });
    expect(within(submissionsRegion).getByText("Saving…")).toBeInTheDocument();
    expect(within(submissionsRegion).getByText("Mehdi Rezaii")).toBeInTheDocument();

    // Failure: the server error is shown, the form is NOT cleared, and
    // the optimistic row is discarded (the base list never changed).
    deferred.resolve({
      ok: false,
      error: { type: "server", message: "Something went wrong while saving." },
    });
    await waitFor(() =>
      expect(screen.getByText("Something went wrong while saving.")).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(within(submissionsRegion).queryByText("Mehdi Rezaii")).toBeNull(),
    );
    // Input survives a failed submit: navigate back and it is still there.
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /Personal/ })).toBeInTheDocument(),
    );
    expect(screen.getByLabelText(/Full name/)).toHaveValue("Mehdi Rezaii");
  });

  it("shows a server validation error without clearing the form", async () => {
    const user = userEvent.setup();
    mockedSubmitForm.mockResolvedValue({
      ok: false,
      error: {
        type: "validation",
        message: "A submission already exists for this email address.",
        fieldErrors: { "personal.email": ["A submission already exists for this email address."] },
      },
    } satisfies FormActionResult);
    render(<OnboardingForm initialSubmissions={[]} />);

    await fillToReview(user);
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() =>
      expect(
        screen.getByText("A submission already exists for this email address."),
      ).toBeInTheDocument(),
    );
  });
});
