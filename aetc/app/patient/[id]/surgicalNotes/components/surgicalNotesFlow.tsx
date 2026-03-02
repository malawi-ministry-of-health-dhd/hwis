// "use client";
// import React from "react";
// import { useState } from "react";
// import { NewStepperContainer } from "@/components";
// import { useNavigation } from "@/hooks";
// import { PresentingComplaintsForm } from "./PresentingComplaintsForm.tsx"
// import { encounters } from "@/constants";

// export const SurgicalNotesFlow = () => {
//     const [activeStep, setActiveStep] = useState<number>(0);
//     const { navigateBack } = useNavigation();


//     const steps = [
//         {
//             id: 1,
//             label: "Presenting Complaints",
//         },
//         {
//             id: 2,
//             label: "Past Medical history",
//         },
//         {
//             id: 3,
//             label: "Family History",
//         },
//         // {
//         //     id: 4,
//         //     label: "Allergies",
//         // },
//         // {
//         //     id: 5,
//         //     label: "Social History",
//         // },
//         // {
//         //     id: 6,
//         //     label: "Gynae/Obstetric History",
//         // },
//     ];
//     const handleAirwaySubmit = () => {
//         setActiveStep(1);
//     };
//     return (
//         <>
//             <NewStepperContainer
//                 setActive={setActiveStep}
//                 title="Surgical Notes"
//                 steps={steps}
//                 active={activeStep}
//                 onBack={() => navigateBack()}
//                 showSubmittedStatus children={[]}  >




//             </NewStepperContainer>
//         </>
//     )
// }




"use client";
import React, { useState, useEffect } from "react";
import { NewStepperContainer } from "@/components";
import { useNavigation } from "@/hooks";
import { Box, Button } from "@mui/material";

import { PresentingComplaintsForm } from "./PresentingComplaintsForm";
import { PastMedicalHistoryForm } from "./PastMedicalHistoryForm";
import { FamilyHistoryForm } from "./FamilyHistoryForm";
import { PastSurgicalHistoryForm } from "./PastSurgicalHistoryForm";
import { AllergiesForm } from "./AllergiesForm";
import { SocialHistoryForm } from "./SocialHistoryForm";
import { GynaeObstetricHistoryForm } from "./GynaeForm";
import { ReviewOfSystemsForm } from "./ReviewOfSystemsForm";
import { PhysicalExaminationForm } from "./PhysicalExaminationForm";
import { WorkingDifferentialDiagnosisForm } from "./WorkingDifferentialDiagnosisForm";
import { InvestigationsForm } from "./InvestigationsForm";
import { InitialManagementForm } from "./InitialManagementForm";
import { getActivePatientDetails } from "@/hooks";


export const SurgicalNotesFlow = () => {
    const { gender } = getActivePatientDetails();
    const [activeStep, setActiveStep] = useState<number>(0);
    const { navigateBack } = useNavigation();
    const hasGynaeHistory = gender === "Female";
    const reviewIndex = hasGynaeHistory ? 7 : 6;
    const physicalIndex = hasGynaeHistory ? 8 : 7;
    const workingDiffIndex = hasGynaeHistory ? 9 : 8;
    const investigationsIndex = hasGynaeHistory ? 10 : 9;
    const initialManagementIndex = hasGynaeHistory ? 11 : 10;

    const steps = [
        { id: 0, label: "Presenting Complaints" },
        { id: 1, label: "Past Medical History" },
        { id: 2, label: "Past Surgical History" },
        { id: 3, label: "Family History" },
        { id: 4, label: "Allergies" },
        { id: 5, label: "Social History" },
        ...(gender === "Female" ? [{ id: 6, label: "Gynae History" }] : []),
        { id: 7, label: "Review of Systems" },
        { id: 8, label: "Physical Examination" },
        { id: 9, label: "Working Differential Diagnosis" },
        { id: 10, label: "Investigations" },
        { id: 11, label: "Initial Management" },

    ];
    useEffect(() => {
        console.log(`Active step is now: ${activeStep}`);
    }, [activeStep]);


    const stepComponents = [

    ];

    return (
        <NewStepperContainer
            title="Surgical Notes"
            steps={steps}
            active={activeStep}
            setActive={setActiveStep}
            onBack={() => navigateBack()}


        >
            <>
                <PresentingComplaintsForm onSkip={() => { }} onSubmit={() => setActiveStep(1)} />
                {/* <StepButtons
                    onNext={() => setActiveStep(1)}
                /> */}
            </>

            <>
                <PastMedicalHistoryForm onSkip={() => { }} onSubmit={() => setActiveStep(2)} />
                {/* <StepButtons
                    onNext={() => setActiveStep(2)}
                /> */}
            </>

            <>
                <PastSurgicalHistoryForm onSkip={() => { }} onSubmit={() => setActiveStep(3)} />
                {/* <StepButtons
                    onNext={() => setActiveStep(3)}
                /> */}
            </>
            <>
                <FamilyHistoryForm onSkip={() => { }} onSubmit={() => setActiveStep(4)} />
                {/* <StepButtons
                    onNext={() => setActiveStep(4)}
                /> */}
            </>
            <>
                <AllergiesForm onSkip={() => { }} onSubmit={() => setActiveStep(5)} />
                {/* <StepButtons
                    onNext={() => setActiveStep(5)}
                /> */}
            </>

            <>
                <SocialHistoryForm onSkip={() => { }} onSubmit={() => setActiveStep(6)} />
                {/* <StepButtons
                    onNext={() => setActiveStep(6)}
                /> */}
            </>

            {gender === "Female" && (
                <>
                    <GynaeObstetricHistoryForm onSkip={() => { }} onSubmit={() => setActiveStep(reviewIndex)} />
                </>
            )}

            <>
                <ReviewOfSystemsForm onSkip={() => { }} onSubmit={() => setActiveStep(physicalIndex)} />
                {/* <StepButtons
                    onNext={() => setActiveStep(8)}
                /> */}
            </>
            <>
                <PhysicalExaminationForm onSkip={() => { }} onSubmit={() => setActiveStep(workingDiffIndex)} />
                {/* <StepButtons
                    onNext={() => setActiveStep(9)}
                /> */}
            </>
            <>
                <WorkingDifferentialDiagnosisForm onSkip={() => { }} onSubmit={() => setActiveStep(investigationsIndex)} />
                {/* <StepButtons
                    onNext={() => setActiveStep(10)}
                /> */}
            </>

            <>
                <InvestigationsForm onSkip={() => { }} onSubmit={() => setActiveStep(initialManagementIndex)} />
                {/* <StepButtons
                    onNext={() => setActiveStep(11)}
                /> */}
            </>
            <>
                <InitialManagementForm onSkip={() => { }} onSubmit={() => { }} />
                {/* <StepButtons
                    onNext={() => setActiveStep(11)}
                /> */}
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
                <Button size="small" variant="contained" color="inherit"
                    onClick={onNext}>
                    Next
                </Button>
            )}
        </Box>
    );
};
