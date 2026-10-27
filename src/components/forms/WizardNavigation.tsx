interface WizardNavigationProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  isPending: boolean;
  onBack: () => void;
  onNext: () => void;
}

/**
 * Back / Next / Submit controls, extracted so the orchestrator reads
 * as "which step is shown + how do we move", not as button markup.
 * The submit button stays `type="submit"` on the last step; on every
 * other step "Next" is a plain button that validates the step first.
 */
export function WizardNavigation({
  isFirstStep,
  isLastStep,
  isPending,
  onBack,
  onNext,
}: WizardNavigationProps) {
  return (
    <div className="mt-6 flex justify-between gap-3">
      <button
        type="button"
        disabled={isFirstStep}
        onClick={onBack}
        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        Back
      </button>
      {!isLastStep ? (
        <button
          type="button"
          onClick={onNext}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Next
        </button>
      ) : (
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Submit"}
        </button>
      )}
    </div>
  );
}
