"use client";

import { useCallback, useState } from "react";

/**
 * Step state for the wizard, kept separate from react-hook-form so the
 * form component stays about fields and submission, not index maths.
 * Steps are zero-based; `canGoBack`/`canGoNext` are derived, never
 * stored, so they cannot drift out of sync with `totalSteps`.
 */
export function useMultiStepForm(totalSteps: number) {
  const [currentStep, setCurrentStep] = useState(0);

  const goNext = useCallback(() => {
    setCurrentStep((step) => Math.min(step + 1, totalSteps - 1));
  }, [totalSteps]);

  const goBack = useCallback(() => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) setCurrentStep(step);
    },
    [totalSteps],
  );

  return {
    currentStep,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1,
    goNext,
    goBack,
    goToStep,
  };
}
