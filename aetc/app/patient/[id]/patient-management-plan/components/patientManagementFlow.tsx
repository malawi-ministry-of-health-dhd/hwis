"use client";
import React, { useState, useEffect } from "react";
import { NewStepperContainer } from "@/components";
import { Box, Button } from "@mui/material";
import { MedicationForm } from "./forms/medicationForm";
import { MedicationsForm } from "../../consultation/components/medication"; // Import the MedicationsForm
import { NonPharmacologicalForm } from "./forms/nonPharmacologicalForm";
import { PatientCareAreaForm } from "./forms/patientCareAreaForm";
import { useNavigation } from "@/hooks";
export const PatientManagementFlow = () => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const { navigateBackToProfile, navigateBack } = useNavigation();

  const steps = [
    { id: 1, label: "Non-Pharmacological" },
    { id: 2, label: "Patient Care Area" },
    { id: 3, label: "Medication" },
  ];

  useEffect(() => {
    console.log(`Active step is now: ${activeStep}`);
  }, [activeStep]);

  return (
    <NewStepperContainer
      title="Patient Management Plan"
      steps={steps}
      active={activeStep}
      setActive={setActiveStep}
      onBack={() => navigateBackToProfile()}
    >
      {/* Non-Pharmacological Form */}
      <>
        <NonPharmacologicalForm
          onSkip={() => {}}
          onSubmit={() => setActiveStep(1)} //  Moves to Patient Care Area Form
        />
        {/* <StepButtons onNext={() => setActiveStep(1)} /> */}
      </>

      {/* Patient Care Area Form */}
      <>
        <PatientCareAreaForm
          onSkip={() => {}}
          onSubmit={() => setActiveStep(2)}
        />
        {/* <StepButtons onNext={() => setActiveStep(2)} onPrevious={() => setActiveStep(0)} /> */}
      </>

      {/* Medication Form */}
      <>
        <MedicationsForm
          onSubmissionSuccess={navigateBack}
          onSkip={() => {}}
          onSubmit={() => {}}
        />
        {/* <StepButtons onPrevious={() => setActiveStep(1)} /> */}
      </>
    </NewStepperContainer>
  );
};
const StepButtons = ({
  onPrevious,
  onNext,
}: {
  onPrevious?: () => void;
  onNext?: () => void;
}) => {
  return (
    <Box sx={{ mt: "1ch" }}>
      {onPrevious && (
        <Button
          sx={{ mr: "0.5ch" }}
          size="small"
          variant="contained"
          color="inherit"
          onClick={onPrevious}
        >
          Previous
        </Button>
      )}
      {onNext && (
        <Button
          size="small"
          variant="contained"
          color="inherit"
          onClick={onNext}
        >
          Next
        </Button>
      )}
    </Box>
  );
};
