"use client";
import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import { useReactToPrint } from "react-to-print";
import { PrescribedMedicationList } from "../../nursingChart/components/prescribedMedicationList";
import { LabOrderPlanTable } from "@/app/patient/components/panels/labOrderPlanTable";
import { BedsideResults } from "@/app/patient/components/panels/bedsideResults";
import { PatientInfoTab } from "@/components";
import { encounters } from "@/constants";
import { useParameters } from "@/hooks";
import { getPatientVisitTypes } from "@/hooks/patientReg";
import { getPatientsEncounters } from "@/hooks/encounter";
import { Visit } from "@/interfaces";
// Define the interface for the component's exposed methods
export interface MedicalInpatientNotesPDFRef {
    generatePDF: () => void;
}

// Define props interface
interface GenerateMedicalInpatientPDFProps {
    onPrintComplete?: () => void;
    showPreview?: boolean; // Add this new prop

}


export const GenerateMedicalInpatientlNotesPDF = forwardRef<MedicalInpatientNotesPDFRef, GenerateMedicalInpatientPDFProps>(
    ({ onPrintComplete, showPreview = false }, ref) => {
        const [row, setRow] = useState<any>(null);
        const { params } = useParameters();
        const { data: patientVisits } = getPatientVisitTypes(params.id as string);
        const [activeVisit, setActiveVisit] = useState<Visit | undefined>(undefined);
        const { data: encountersData } = getPatientsEncounters(
            params.id as string,
            activeVisit?.uuid ? `visit=${activeVisit.uuid}` : undefined
        );

        useEffect(() => {
            if (patientVisits) {
                const active = patientVisits.find((visit) => !visit.date_stopped);
                if (active) {
                    setActiveVisit(active as unknown as Visit);
                }
            }
        }, [patientVisits]);

        const initialMedicalInpatientInfo = {
            presentingComplaint: [] as Array<{ complaint: string, duration: string }>,
            presentingHistory: "",
            medication: [] as string[],        // 👈 was string
            hivProgram: "",
            onARV: "",
            drugGiven: "",
            date: "",
            healthCenter: "",
            other: "",
            surgicalHistory: "",
            socialHistory: "",
            familyHistory: "",
            allergicReaction: [] as string[],  // 👈 was string
            intoxication: [] as string[],
            general: "",
            systolicBloodpressure: "",
            diastolicBloodPressure: "",
            pulseRate: "",
            respiratoryRate: "",
            temperature: "",
            oxygen_saturation: "",
            pupilsSymmetrical: "",
            conjunctiva: "",
            oralKS: "",
            oralCandidiasis: "",
            jvpRaised: "",
            lymphadenopathy: "",
            // ✅ New Fields
            symmetricalExpansion: "",
            description: "",
            apexBeat: "",
            position: "",
            thrillHeaves: "",
            specify: "",
            auscultation: "",
            lungCondition: "",
            auscultationLung: "",
            edema: "",
            skinRash: "",
            herpesZosterScar: "",
            nuchalRigidity: "",
            motorResponse: "",
            verbalResponse: "",
            eyeOpeningResponse: "",
            pupil: "",
            visualFieldAcuity: "",
            eyeMovementsNystagmus: "",
            eyeMovementsSensation: "",
            hearing: "",
            tongueMovementTastes: "",
            coughGagReflex: "",
            power: "",
            tone: "",
            reflexes: "",
            plantars: "",
            sensation: "",
            coordination: "",
            gait: "",
            summary: "",
            generalReview: [] as string[],
            ent: [] as string[],
            endocrine: [] as string[],
            cardiac: [] as string[],
            respiratory: [] as string[],
            gastrointestinal: [] as string[],
            genitourinary: [] as string[],
            musculoskeletal: [] as string[],
            neurologic: [] as string[],
            psychiatric: [] as string[],
            integumentary: [] as string[],
            differentialDiagnosis: [] as string[],
            radiological: "",
            additionalNotes: "",
            managementPlan: "",
            admittingOfficer: "", // Default value
            completedDateTime: "", // ADD THIS LINE
            // ✅ New Abdomen Fields
            abdomenInspection: "",
            abdomenLightPalpation: "",
            abdomenDeepPalpation: "",
            abdomenAuscultation: "",
            abdomenShiftingDullness: "",
            abdomenFluidThrill: "",
            abdomenRegion: "",
            lungRegion: "",

        };
        const [medicalInpatientInfo, setMedicalInpatientInfo] = useState(initialMedicalInpatientInfo);

        // Ref for printing
        const contentRef = useRef<HTMLDivElement>(null);

        // Setup print function
        const reactToPrintFn = useReactToPrint({
            contentRef,
            onAfterPrint: onPrintComplete
        });

        // Expose the generatePDF method to parent components
        useImperativeHandle(ref, () => ({
            generatePDF: () => {
                reactToPrintFn();
            }
        }));

        const visitEncounters = React.useMemo(() => {
            if (!encountersData || !activeVisit?.uuid) return [];
            return encountersData.filter(
                (encounter: any) => encounter?.visit?.uuid === activeVisit.uuid
            );
        }, [encountersData, activeVisit?.uuid]);

        useEffect(() => {
            if (!activeVisit?.uuid || visitEncounters.length === 0) {
                setMedicalInpatientInfo(initialMedicalInpatientInfo);
                return;
            }
            const medicalInpatientEncounter = visitEncounters
                ?.filter(
                    (encounter) =>
                        encounter.encounter_type &&
                        encounter.encounter_type.uuid === encounters.MEDICAL_IN_PATIENT
                )
                .sort(
                    (a, b) =>
                        new Date(b.encounter_datetime).getTime() -
                        new Date(a.encounter_datetime).getTime()
                )[0];

            if (medicalInpatientEncounter && medicalInpatientEncounter.obs) {
                const admittingOfficer = medicalInpatientEncounter.created_by || "";
                const completedDateTime = medicalInpatientEncounter.encounter_datetime || ""; // ADD THIS LINE


                const inpatientInfo = {
                    presentingComplaint: [] as Array<{ complaint: string, duration: string }>,
                    presentingHistory: "",
                    medication: [] as string[],
                    hivProgram: "",
                    healthCenter: "",
                    onARV: "",
                    drugGiven: "",
                    date: "",
                    other: "",
                    surgicalHistory: "",
                    socialHistory: "",
                    familyHistory: "",
                    allergicReaction: [] as string[],
                    intoxication: [] as string[],
                    general: "",
                    systolicBloodpressure: "",
                    diastolicBloodPressure: "",
                    pulseRate: "",
                    respiratoryRate: "",
                    temperature: "",
                    oxygen_saturation: "",
                    pupilsSymmetrical: "",
                    conjunctiva: "",
                    oralKS: "",
                    oralCandidiasis: "",
                    jvpRaised: "",
                    lymphadenopathy: "",
                    // ✅ New Fields
                    symmetricalExpansion: "",
                    description: "",
                    apexBeat: "",
                    position: "",
                    thrillHeaves: "",
                    specify: "",
                    auscultation: "",
                    lungCondition: "",
                    auscultationLung: "",
                    edema: "",
                    skinRash: "",
                    herpesZosterScar: "",
                    nuchalRigidity: "",
                    motorResponse: "",
                    verbalResponse: "",
                    eyeOpeningResponse: "",
                    pupil: "",
                    visualFieldAcuity: "",
                    eyeMovementsNystagmus: "",
                    eyeMovementsSensation: "",
                    hearing: "",
                    tongueMovementTastes: "",
                    coughGagReflex: "",
                    power: "",
                    tone: "",
                    reflexes: "",
                    plantars: "",
                    sensation: "",
                    coordination: "",
                    gait: "",
                    summary: "",
                    generalReview: [] as string[],
                    ent: [] as string[],
                    endocrine: [] as string[],
                    cardiac: [] as string[],
                    respiratory: [] as string[],
                    gastrointestinal: [] as string[],
                    genitourinary: [] as string[],
                    musculoskeletal: [] as string[],
                    neurologic: [] as string[],
                    psychiatric: [] as string[],
                    integumentary: [] as string[],
                    differentialDiagnosis: [] as string[],
                    radiological: "",
                    additionalNotes: "",
                    managementPlan: "",
                    admittingOfficer: admittingOfficer, // Use the created_by field as the admitting officer
                    completedDateTime: completedDateTime, // ADD THIS LINE
                    // ✅ New Abdomen Fields
                    abdomenInspection: "",
                    abdomenLightPalpation: "",
                    abdomenDeepPalpation: "",
                    abdomenAuscultation: "",
                    abdomenShiftingDullness: "",
                    abdomenFluidThrill: "",
                    abdomenRegion: "",
                    lungRegion: "",



                };
                medicalInpatientEncounter.obs.forEach(obs => {
                    const conceptName = obs.names && obs.names.length > 0 ? obs.names[0].name : null;
                    if (conceptName === "Presenting Complaints") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childValue = child.names[0].name || "";
                                let duration = "";

                                // Check if this child has duration information
                                if (child.children && child.children.length > 0) {
                                    const durationChild = child.children.find(grandChild =>
                                        grandChild.names && grandChild.names.length > 0 &&
                                        grandChild.names[0].name === "Duration"
                                    );
                                    if (durationChild) {
                                        duration = durationChild.value || durationChild.value_text || "";
                                    }
                                }

                                if (childValue) {
                                    inpatientInfo.presentingComplaint.push({
                                        complaint: childValue,
                                        duration: duration
                                    });
                                }
                            });
                        }
                    }
                    // ✅ New: Extract Abdomen Data
                    else if (conceptName === "Site") {
                        const siteValue = obs.value || obs.value_text || "";

                        // Check if the site is "Abdomen"
                        if (siteValue === "Abdomen" && obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childConceptName = child.names && child.names.length > 0 ? child.names[0].name : null;

                                // Check if this child has nested "Image Part Name" (region)
                                if (childConceptName === "Image Part Name") {
                                    inpatientInfo.abdomenRegion = child.value || child.value_text || "";

                                    // Now extract the abdomen examination details from this child's children
                                    if (child.children && child.children.length > 0) {
                                        child.children.forEach(grandChild => {
                                            const grandChildName = grandChild.names && grandChild.names.length > 0 ? grandChild.names[0].name : null;

                                            if (grandChildName === "General inspection") {
                                                inpatientInfo.abdomenInspection = grandChild.value || grandChild.value_text || "";
                                            } else if (grandChildName === "Light palpation") {
                                                inpatientInfo.abdomenLightPalpation = grandChild.value || grandChild.value_text || "";
                                            } else if (grandChildName === "Deep palpation") {
                                                inpatientInfo.abdomenDeepPalpation = grandChild.value || grandChild.value_text || "";
                                            } else if (grandChildName === "Auscultation Lung") {
                                                inpatientInfo.abdomenAuscultation = grandChild.value || grandChild.value_text || "";
                                            } else if (grandChildName === "Shifting dullness") {
                                                inpatientInfo.abdomenShiftingDullness = grandChild.value || grandChild.value_text || "";
                                            } else if (grandChildName === "Fluid thrill") {
                                                inpatientInfo.abdomenFluidThrill = grandChild.value || grandChild.value_text || "";
                                            }
                                        });
                                    }
                                }
                            });
                        } else if (siteValue === "Lung Posterior" && obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childConceptName = child.names && child.names.length > 0 ? child.names[0].name : null;

                                // Check if this child has nested "Image Part Name" (region)
                                if (childConceptName === "Image Part Name") {
                                    inpatientInfo.lungRegion = child.value || child.value_text || "";


                                }
                            });

                        }
                    }

                    else if (conceptName === "Presenting history") {
                        inpatientInfo.presentingHistory = obs.value || obs.value_text || "";
                    } else if (conceptName === "Medication") {
                        if (obs.children && obs.children.length > 0) {
                            inpatientInfo.medication = obs.children
                                .map((child: any) => child.value_text || child.value || "")
                                .filter(Boolean);
                        } else {
                            inpatientInfo.medication = [(obs.value_text || obs.value || "")].filter(Boolean);
                        }
                    }
                    else if (conceptName === "HIV program") {
                        inpatientInfo.hivProgram = obs.value || obs.value_text || "";
                    } else if (conceptName === "On arv") {
                        inpatientInfo.onARV = obs.value || obs.value_text || "";
                    } else if (conceptName === "Drug Administration") {
                        inpatientInfo.drugGiven = obs.value || obs.value_text || "";
                    } else if (conceptName === "Historical drug start date") {
                        inpatientInfo.date = obs.value || obs.value_text || "";
                    } else if (conceptName === "Health center") {
                        inpatientInfo.healthCenter = obs.value || obs.value_text || "";
                    } else if (conceptName === "Other Medication") {
                        inpatientInfo.other = obs.value || obs.value_text || "";
                    } else if (conceptName === "Surgical History") {
                        inpatientInfo.surgicalHistory = obs.value || obs.value_text || "";
                    } else if (conceptName === "Social History") {
                        inpatientInfo.socialHistory = obs.value || obs.value_text || "";
                    } else if (conceptName === "Family History") {
                        inpatientInfo.familyHistory = obs.value || obs.value_text || "";
                    } else if (conceptName === "Allergic reaction") {
                        if (obs.children && obs.children.length > 0) {
                            const newAllergies = obs.children
                                .map((child: any) => child.value_text || child.value || "")
                                .filter(Boolean);
                            inpatientInfo.allergicReaction.push(...newAllergies);
                        } else {
                            const directValue = obs.value_text || obs.value || "";
                            if (directValue) {
                                inpatientInfo.allergicReaction.push(directValue);
                            }
                        }
                    } else if (conceptName === "Intoxication") {
                        const intoxicationValues = obs.children
                            ?.filter(
                                (child) =>
                                    child.names &&
                                    child.names.length > 0 &&
                                    child.names[0].name === "Intoxication"
                            )
                            .map((child) => child.value || child.value_text)
                            .filter(Boolean);

                        inpatientInfo.intoxication = intoxicationValues || "";
                    } else if (conceptName === "General") {
                        inpatientInfo.general = obs.value || obs.value_text || "";
                    } else if (conceptName === "Systolic blood pressure") {
                        inpatientInfo.systolicBloodpressure = obs.value || obs.value_text || "";
                    } else if (conceptName === "Diastolic blood pressure") {
                        inpatientInfo.diastolicBloodPressure = obs.value || obs.value_text || "";
                    } else if (conceptName === "Pulse Rate") {
                        inpatientInfo.pulseRate = obs.value || obs.value_text || "";
                    } else if (conceptName === "Respiratory rate") {
                        inpatientInfo.respiratoryRate = obs.value || obs.value_text || "";
                    } else if (conceptName === "Temperature (c)") {
                        inpatientInfo.temperature = obs.value || obs.value_text || "";
                    } else if (conceptName === "Oxygen Saturation") {
                        inpatientInfo.oxygen_saturation = obs.value || obs.value_text || "";
                    }
                    else if (conceptName === "Pupils symmetrical") {
                        inpatientInfo.pupilsSymmetrical = obs.value || obs.value_text || "";
                    } else if (conceptName === "Conjunctiva") {
                        inpatientInfo.conjunctiva = obs.value || obs.value_text || "";
                    } else if (conceptName === "Oral KS") {
                        inpatientInfo.oralKS = obs.value || obs.value_text || "";
                    } else if (conceptName === "Oral candidiasis") {
                        inpatientInfo.oralCandidiasis = obs.value || obs.value_text || "";
                    } else if (conceptName === "JVP raised") {
                        inpatientInfo.jvpRaised = obs.value || obs.value_text || "";
                    } else if (conceptName === "Lymphadenopathy") {
                        inpatientInfo.lymphadenopathy = obs.value || obs.value_text || "";
                    }
                    // ✅ New Fields
                    else if (conceptName === "Description") {
                        inpatientInfo.description = obs.value || obs.value_text || "";
                    } else if (conceptName === "symmetrical expansion") {
                        inpatientInfo.symmetricalExpansion = obs.value || obs.value_text || "";
                    } else if (conceptName === "Apex beat") {
                        inpatientInfo.apexBeat = obs.value || obs.value_text || "";
                    } else if (conceptName === "Positioning") {
                        inpatientInfo.position = obs.value || obs.value_text || "";
                    }
                    else if (conceptName === "thrill heaves") {
                        inpatientInfo.thrillHeaves = obs.value || obs.value_text || "";
                    } else if (conceptName === "Specify") {
                        inpatientInfo.specify = obs.value || obs.value_text || "";
                    } else if (conceptName === "Auscultation") {
                        inpatientInfo.auscultation = obs.value || obs.value_text || "";
                    } else if (conceptName === "Condition") {
                        inpatientInfo.lungCondition = obs.value || obs.value_text || "";
                    }
                    else if (conceptName === "Auscultation Lung") {
                        inpatientInfo.auscultationLung = obs.value || obs.value_text || "";
                    } else if (conceptName === "Edema") {
                        inpatientInfo.edema = obs.value || obs.value_text || "";
                    } else if (conceptName === "Skin rash") {
                        inpatientInfo.skinRash = obs.value || obs.value_text || "";
                    } else if (conceptName === "Herpes Zoster Scar") {
                        inpatientInfo.herpesZosterScar = obs.value || obs.value_text || "";
                    } else if (conceptName === "Nuchal rigidity") {
                        inpatientInfo.nuchalRigidity = obs.value || obs.value_text || "";
                    } else if (conceptName === "Motor response") {
                        inpatientInfo.motorResponse = obs.value || obs.value_text || "";
                    } else if (conceptName === "Verbal Response") {
                        inpatientInfo.verbalResponse = obs.value || obs.value_text || "";
                    } else if (conceptName === "Eye Opening response") {
                        inpatientInfo.eyeOpeningResponse = obs.value || obs.value_text || "";
                    } else if (conceptName === "Pupil") {
                        inpatientInfo.pupil = obs.value || obs.value_text || "";
                    } else if (conceptName === "Visual Field Acuity") {
                        inpatientInfo.visualFieldAcuity = obs.value || obs.value_text || "";
                    } else if (conceptName === "Eye Movements/Nystagmus") {
                        inpatientInfo.eyeMovementsNystagmus = obs.value || obs.value_text || "";
                    } else if (conceptName === "Eye Movements/Sensation") {
                        inpatientInfo.eyeMovementsSensation = obs.value || obs.value_text || "";
                    }
                    else if (conceptName === "Hearing") {
                        inpatientInfo.hearing = obs.value || obs.value_text || "";
                    } else if (conceptName === "Tongue Movement/Tastes") {
                        inpatientInfo.tongueMovementTastes = obs.value || obs.value_text || "";
                    } else if (conceptName === "Cough Gag Reflex") {
                        inpatientInfo.coughGagReflex = obs.value || obs.value_text || "";
                    } else if (conceptName === "Power") {
                        inpatientInfo.power = obs.value || obs.value_text || "";
                    } else if (conceptName === "Tone") {
                        inpatientInfo.tone = obs.value || obs.value_text || "";
                    } else if (conceptName === "Reflexes") {
                        inpatientInfo.reflexes = obs.value || obs.value_text || "";
                    } else if (conceptName === "Plantars") {
                        inpatientInfo.plantars = obs.value || obs.value_text || "";
                    } else if (conceptName === "Sensation") {
                        inpatientInfo.sensation = obs.value || obs.value_text || "";
                    } else if (conceptName === "Coordination") {
                        inpatientInfo.coordination = obs.value || obs.value_text || "";
                    } else if (conceptName === "gait") {
                        inpatientInfo.gait = obs.value || obs.value_text || "";
                    } else if (conceptName === "Summary") {
                        inpatientInfo.summary = obs.value || obs.value_text || "";
                    } else if (conceptName === "Assessment") {
                        inpatientInfo.radiological = obs.value || obs.value_text || "";
                    } else if (conceptName === "Additional Notes") {
                        inpatientInfo.additionalNotes = obs.value || obs.value_text || "";
                    } else if (conceptName === "Plan") {
                        inpatientInfo.managementPlan = obs.value || obs.value_text || "";
                    }
                    // Review of Systems mapping
                    else if (conceptName === "Review of systems, general") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                // Extract the value instead of the name
                                const childValue = child.value;
                                if (childValue) {
                                    inpatientInfo.generalReview.push(childValue);
                                }
                            });
                        }
                    }
                    // else if (conceptName === "Review of systems, general") {
                    //     if (obs.children && obs.children.length > 0) {
                    //         obs.children.forEach(child => {
                    //             const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                    //             if (childName) {
                    //                 inpatientInfo.generalReview.push(childName);
                    //             }
                    //         });
                    //     }
                    // }

                    else if (conceptName === "Review of systems ENT") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    inpatientInfo.ent.push(childName);
                                }
                            });
                        }
                    } else if (conceptName === "Review of systems  endocrine") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    inpatientInfo.endocrine.push(childName);
                                }
                            });
                        }
                    } else if (conceptName === "Review of systems cardiac") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    inpatientInfo.cardiac.push(childName);
                                }
                            });
                        }
                    } else if (conceptName === "Severe Respiratory") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    inpatientInfo.respiratory.push(childName);
                                }
                            });
                        }
                    } else if (conceptName === "Review Of Systems Gastrointestinal") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    inpatientInfo.gastrointestinal.push(childName);
                                }
                            });
                        }
                    } else if (conceptName === "Review Of Systems Genitourinary") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    inpatientInfo.genitourinary.push(childName);
                                }
                            });
                        }
                    } else if (conceptName === "Review of systems musculoskeletal") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    inpatientInfo.musculoskeletal.push(childName);
                                }
                            });
                        }
                    } else if (conceptName === "Review of systems neurologic") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    inpatientInfo.neurologic.push(childName);
                                }
                            });
                        }
                    } else if (conceptName === "Review of systems psychiatric") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    inpatientInfo.psychiatric.push(childName);
                                }
                            });
                        }
                    } else if (conceptName === "Skin Infection") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    inpatientInfo.integumentary.push(childName);
                                }
                            });
                        }
                    }

                    else if (conceptName === "Attempted/ Differential Diagnosis") {
                        const diffDiagnosisValues = obs.children
                            ?.filter(
                                (child) =>
                                    child.names &&
                                    child.names.length > 0 &&
                                    child.names[0].name === "Attempted/ Differential Diagnosis"
                            )
                            .map((child) => child.value || child.value_text)
                            .filter(Boolean);

                        inpatientInfo.differentialDiagnosis = diffDiagnosisValues || "";
                    }

                });
                setMedicalInpatientInfo(inpatientInfo);
            }
            // 3. Add a helper function to format the date (add this before the return statement)
            // const formatDateTime = (dateTimeString: string) => {
            //     if (!dateTimeString) return "";
            //     const date = new Date(dateTimeString);
            //     return date.toLocaleString('en-US', {
            //         year: 'numeric',
            //         month: 'long',
            //         day: 'numeric',
            //         hour: '2-digit',
            //         minute: '2-digit',
            //         hour12: true
            //     });
            // };

        }, [visitEncounters, activeVisit?.uuid]);

        const formatDateTime = (dateTimeString: string) => {
            if (!dateTimeString) return "";
            const date = new Date(dateTimeString);
            return date.toLocaleString('en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        };
        const formatDate = (dateString: string) => {
            if (!dateString) return "";
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }); // e.g., "20 Oct 2025"
        };

        const getGCSWeight = (value: string, responseType: 'motor' | 'verbal' | 'eye') => {
            const eyeOpeningResponses = [
                { label: "Spontaneous", value: "Spontaneous", weight: 4 },
                { label: "To Speech", value: "To Speech", weight: 3 },
                { label: "To Pain", value: "To Pain", weight: 2 },
                { label: "No Response", value: "No Response", weight: 1 },
            ];

            const motorResponses = [
                { label: "Obeying Commands", value: "Obeying Commands", weight: 6 },
                { label: "Localising", value: "Localising", weight: 5 },
                { label: "Withdraw", value: "Withdraw", weight: 4 },
                { label: "Normal Flexion", value: "Normal Flexion", weight: 3 },
                { label: "Extension", value: "Extension", weight: 2 },
                { label: "None", value: "None", weight: 1 },
            ];

            const verbalResponses = [
                { label: "Oriented", value: "Oriented", weight: 5 },
                { label: "Confused", value: "Confused", weight: 4 },
                { label: "Inappropriate Words", value: "Inappropriate Words", weight: 3 },
                { label: "Incomprehensible sounds", value: "Incomprehensible sounds", weight: 2 },
                { label: "None", value: "None", weight: 1 },
            ];

            let responseList;
            switch (responseType) {
                case 'motor':
                    responseList = motorResponses;
                    break;
                case 'verbal':
                    responseList = verbalResponses;
                    break;
                case 'eye':
                    responseList = eyeOpeningResponses;
                    break;
                default:
                    return 0;
            }

            const found = responseList.find((r) => r.value === value);
            return found ? found.weight : 0;
        };

        // Calculate GCS Total
        const motorScore = getGCSWeight(medicalInpatientInfo.motorResponse, 'motor');
        const verbalScore = getGCSWeight(medicalInpatientInfo.verbalResponse, 'verbal');
        const eyeScore = getGCSWeight(medicalInpatientInfo.eyeOpeningResponse, 'eye');
        const gcsTotal = motorScore + verbalScore + eyeScore;

        return (
            <div ref={contentRef} className="printable-content">
                <div className={showPreview ? "print-preview" : "print-only"}>
                    <PatientInfoTab />
                    <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
                            {medicalInpatientInfo.admittingOfficer && (
                                <p style={{ margin: "5px 0" }}>
                                    <strong>Admitting Officer: </strong>
                                    {medicalInpatientInfo.admittingOfficer}
                                </p>
                            )}
                            {medicalInpatientInfo.completedDateTime && (
                                <p style={{ margin: "5px 0" }}>
                                    <strong>Date & Time Completed: </strong>
                                    {formatDateTime(medicalInpatientInfo.completedDateTime)}
                                </p>
                            )}
                        </div>
                    </div>
                    <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
                        Medical Inpatient Admission Sheet                    </h1>

                    {Object.values(medicalInpatientInfo).every((val) => (typeof val === "string" ? !val.trim() : val.length === 0)
                    ) ? (
                        <p style={{ fontStyle: "italic", color: "gray" }}>
                            Medical Inpatient Admission Sheet not recorded.
                        </p>
                    ) : (
                        <div className="patient-examination-data">
                            {medicalInpatientInfo.presentingComplaint && (
                                <>
                                    <h2>Presenting Complaints</h2>
                                    <p>
                                        {medicalInpatientInfo.presentingComplaint.map((item, index) =>
                                            `(${index + 1}) ${item.complaint}${item.duration ? ` - Duration: ${item.duration}` : ''}`
                                        ).join(", ")}
                                    </p>
                                </>
                            )}

                            {medicalInpatientInfo.presentingHistory && (
                                <>
                                    <h2>History of Presenting Complaints</h2>
                                    <p>{medicalInpatientInfo.presentingHistory}</p>
                                </>
                            )}
                            <hr />


                            {(medicalInpatientInfo.medication ||
                                medicalInpatientInfo.hivProgram ||
                                medicalInpatientInfo.onARV ||
                                medicalInpatientInfo.drugGiven ||
                                medicalInpatientInfo.date ||
                                medicalInpatientInfo.healthCenter ||
                                medicalInpatientInfo.other ||
                                medicalInpatientInfo.surgicalHistory ||
                                medicalInpatientInfo.socialHistory ||
                                medicalInpatientInfo.familyHistory ||
                                medicalInpatientInfo.allergicReaction ||
                                medicalInpatientInfo.intoxication) && (
                                    <>
                                        <h2>Drug History</h2>
                                        {medicalInpatientInfo.medication.length > 0 && (
                                            <p>
                                                <strong>Drug: </strong>
                                                {medicalInpatientInfo.medication.map((item, index) => `(${index + 1}) ${item}`).join(", ")}
                                            </p>
                                        )}
                                        <hr />
                                        <h2>Past Medical History</h2>

                                        {medicalInpatientInfo.hivProgram && (
                                            <p>
                                                <strong>HIV Status: </strong>
                                                {medicalInpatientInfo.hivProgram}
                                            </p>
                                        )}
                                        {medicalInpatientInfo.onARV && (
                                            <p>
                                                <strong>On ARV: </strong>
                                                {medicalInpatientInfo.onARV}
                                            </p>
                                        )}
                                        {medicalInpatientInfo.drugGiven && (
                                            <p>
                                                <strong>ARV Given: </strong>
                                                {medicalInpatientInfo.drugGiven}
                                            </p>
                                        )}
                                        {medicalInpatientInfo.date && (
                                            <p>
                                                <strong>Since When: </strong>
                                                {/* {medicalInpatientInfo.date} */}
                                                {formatDate(medicalInpatientInfo.date)}

                                            </p>
                                        )}
                                        {medicalInpatientInfo.healthCenter && (
                                            <p>
                                                <strong>Clinic: </strong>
                                                {medicalInpatientInfo.healthCenter}
                                            </p>
                                        )}
                                        {medicalInpatientInfo.other && (
                                            <p>
                                                <strong>Other (Past Medical History): </strong>
                                                {medicalInpatientInfo.other}
                                            </p>
                                        )}
                                        <hr />

                                        {medicalInpatientInfo.surgicalHistory && (
                                            <>
                                                <h2>Surgical History</h2>
                                                <p>{medicalInpatientInfo.surgicalHistory}</p>
                                                <hr />
                                            </>
                                        )}
                                        <hr />

                                        {medicalInpatientInfo.socialHistory && (
                                            <>
                                                <h2>Social History</h2>
                                                <p>{medicalInpatientInfo.socialHistory}</p>
                                                <hr />
                                            </>
                                        )}
                                        <hr />

                                        {medicalInpatientInfo.familyHistory && (
                                            <>
                                                <h2>Family History</h2>
                                                <p>{medicalInpatientInfo.familyHistory}</p>
                                                <hr />
                                            </>
                                        )}
                                        <hr />

                                        {medicalInpatientInfo.allergicReaction.length > 0 && (
                                            <>
                                                <h2>Allergy</h2>
                                                <p>
                                                    {medicalInpatientInfo.allergicReaction.map((item, index) =>
                                                        `(${index + 1}) ${item}`
                                                    ).join(", ")}
                                                </p>
                                                <hr />
                                            </>
                                        )}
                                        <hr />

                                        {medicalInpatientInfo.intoxication.length > 0 && (
                                            <>
                                                <h2>Intoxication</h2>
                                                <p>
                                                    {medicalInpatientInfo.intoxication.map((item, index) =>
                                                        `(${index + 1}) ${item}`
                                                    ).join(", ")}
                                                </p>
                                            </>
                                        )}
                                    </>
                                )}
                            <hr />
                            {(medicalInpatientInfo.generalReview ||
                                medicalInpatientInfo.ent ||
                                medicalInpatientInfo.endocrine ||
                                medicalInpatientInfo.cardiac ||
                                medicalInpatientInfo.respiratory ||
                                medicalInpatientInfo.gastrointestinal ||
                                medicalInpatientInfo.genitourinary ||
                                medicalInpatientInfo.musculoskeletal ||
                                medicalInpatientInfo.neurologic ||
                                medicalInpatientInfo.psychiatric ||
                                medicalInpatientInfo.integumentary

                            ).length > 0 && (
                                    <>
                                        <h2>Review of Systems</h2>
                                        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                                            <tbody>
                                                <tr>
                                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                        {medicalInpatientInfo.generalReview.length > 0 && (
                                                            <>
                                                                <strong>General(Constitutional): </strong>
                                                                {/* {medicalInpatientInfo.generalReview} */}
                                                                {medicalInpatientInfo.generalReview.map((item, index) => `(${index + 1}) ${item}`).join(", ")}

                                                            </>
                                                        )}

                                                    </td>
                                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                        {medicalInpatientInfo.ent.length > 0 && (
                                                            <>
                                                                <strong>HEENT: </strong>
                                                                {/* {medicalInpatientInfo.ent} */}
                                                                {medicalInpatientInfo.ent.map((item, index) => `(${index + 1}) ${item}`).join(", ")}

                                                            </>
                                                        )}
                                                    </td>
                                                </tr>

                                                <tr>
                                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                        {medicalInpatientInfo.endocrine.length > 0 && (
                                                            <>
                                                                <strong>Endocrine: </strong>
                                                                {/* {medicalInpatientInfo.endocrine} */}
                                                                {medicalInpatientInfo.endocrine.map((item, index) => `(${index + 1}) ${item}`).join(", ")}


                                                            </>
                                                        )}</td>
                                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                        {medicalInpatientInfo.cardiac.length > 0 && (
                                                            <>
                                                                <strong>Cardiovascular: </strong>
                                                                {/* {medicalInpatientInfo.cardiac} */}
                                                                {medicalInpatientInfo.cardiac.map((item, index) => `(${index + 1}) ${item}`).join(", ")}

                                                            </>
                                                        )}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                        {medicalInpatientInfo.respiratory.length > 0 && (
                                                            <>
                                                                <strong>Respiratory: </strong>
                                                                {/* {medicalInpatientInfo.respiratory} */}
                                                                {medicalInpatientInfo.respiratory.map((item, index) => `(${index + 1}) ${item}`).join(", ")}

                                                            </>
                                                        )}</td>
                                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                        {medicalInpatientInfo.gastrointestinal.length > 0 && (
                                                            <>
                                                                <strong>Gastrointestinal: </strong>
                                                                {/* {medicalInpatientInfo.gastrointestinal} */}
                                                                {medicalInpatientInfo.gastrointestinal.map((item, index) => `(${index + 1}) ${item}`).join(", ")}

                                                            </>
                                                        )}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                        {medicalInpatientInfo.genitourinary.length > 0 && (
                                                            <>
                                                                <strong>Genitourinary: </strong>
                                                                {/* {medicalInpatientInfo.genitourinary} */}
                                                                {medicalInpatientInfo.genitourinary.map((item, index) => `(${index + 1}) ${item}`).join(", ")}

                                                            </>
                                                        )}</td>
                                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                        {medicalInpatientInfo.musculoskeletal.length > 0 && (
                                                            <>
                                                                <strong>Musculoskeletal: </strong>
                                                                {/* {medicalInpatientInfo.musculoskeletal} */}
                                                                {medicalInpatientInfo.musculoskeletal.map((item, index) => `(${index + 1}) ${item}`).join(", ")}

                                                            </>
                                                        )}</td>
                                                </tr>
                                                <tr>
                                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                        {medicalInpatientInfo.neurologic.length > 0 && (
                                                            <>
                                                                <strong>Neurological: </strong>
                                                                {/* {medicalInpatientInfo.neurologic} */}
                                                                {medicalInpatientInfo.neurologic.map((item, index) => `(${index + 1}) ${item}`).join(", ")}

                                                            </>
                                                        )}   </td>
                                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                        {medicalInpatientInfo.psychiatric.length > 0 && (
                                                            <>
                                                                <strong>Psychiatric: </strong>
                                                                {/* {medicalInpatientInfo.psychiatric} */}
                                                                {medicalInpatientInfo.psychiatric.map((item, index) => `(${index + 1}) ${item}`).join(", ")}

                                                            </>
                                                        )} </td>
                                                </tr>
                                                <tr>
                                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                        {medicalInpatientInfo.integumentary.length > 0 && (
                                                            <>
                                                                <strong>Integumentary(Skin): </strong>
                                                                {/* {medicalInpatientInfo.integumentary} */}
                                                                {medicalInpatientInfo.integumentary.map((item, index) => `(${index + 1}) ${item}`).join(", ")}

                                                            </>
                                                        )} </td>

                                                </tr>
                                            </tbody>
                                        </table>
                                        <hr />

                                    </>
                                )
                            }



                            {(medicalInpatientInfo.general ||
                                medicalInpatientInfo.systolicBloodpressure ||
                                medicalInpatientInfo.diastolicBloodPressure ||
                                medicalInpatientInfo.pulseRate ||
                                medicalInpatientInfo.respiratoryRate ||
                                medicalInpatientInfo.temperature ||
                                medicalInpatientInfo.oxygen_saturation ||
                                medicalInpatientInfo.pupilsSymmetrical ||
                                medicalInpatientInfo.conjunctiva ||
                                medicalInpatientInfo.oralKS ||
                                medicalInpatientInfo.oralCandidiasis ||
                                medicalInpatientInfo.jvpRaised ||
                                medicalInpatientInfo.lymphadenopathy ||
                                medicalInpatientInfo.symmetricalExpansion ||
                                medicalInpatientInfo.description ||
                                medicalInpatientInfo.apexBeat ||
                                medicalInpatientInfo.position ||
                                medicalInpatientInfo.thrillHeaves ||
                                medicalInpatientInfo.specify ||
                                medicalInpatientInfo.auscultation ||
                                medicalInpatientInfo.lungCondition ||
                                medicalInpatientInfo.lungRegion ||
                                medicalInpatientInfo.auscultationLung ||
                                medicalInpatientInfo.abdomenAuscultation ||
                                medicalInpatientInfo.abdomenDeepPalpation ||
                                medicalInpatientInfo.abdomenFluidThrill ||
                                medicalInpatientInfo.abdomenInspection ||
                                medicalInpatientInfo.abdomenLightPalpation ||
                                medicalInpatientInfo.abdomenRegion ||
                                medicalInpatientInfo.abdomenShiftingDullness ||
                                medicalInpatientInfo.edema ||
                                medicalInpatientInfo.skinRash ||
                                medicalInpatientInfo.herpesZosterScar ||
                                medicalInpatientInfo.nuchalRigidity ||
                                medicalInpatientInfo.motorResponse ||
                                medicalInpatientInfo.verbalResponse ||
                                medicalInpatientInfo.eyeOpeningResponse ||
                                medicalInpatientInfo.pupil ||
                                medicalInpatientInfo.visualFieldAcuity ||
                                medicalInpatientInfo.eyeMovementsNystagmus ||
                                medicalInpatientInfo.eyeMovementsSensation ||
                                medicalInpatientInfo.hearing ||
                                medicalInpatientInfo.tongueMovementTastes ||
                                medicalInpatientInfo.coughGagReflex ||
                                medicalInpatientInfo.power ||
                                medicalInpatientInfo.tone ||
                                medicalInpatientInfo.reflexes ||
                                medicalInpatientInfo.plantars ||
                                medicalInpatientInfo.sensation ||
                                medicalInpatientInfo.coordination ||
                                medicalInpatientInfo.gait ||
                                medicalInpatientInfo.summary ||
                                medicalInpatientInfo.differentialDiagnosis ||
                                medicalInpatientInfo.radiological ||
                                medicalInpatientInfo.additionalNotes ||
                                medicalInpatientInfo.managementPlan ||
                                medicalInpatientInfo.admittingOfficer

                            )
                                && (
                                    <>
                                        <h2>Physical Examination</h2>
                                        {medicalInpatientInfo.general && (
                                            <>
                                                <h3>General Impression</h3>
                                                <p>{medicalInpatientInfo.general}</p>
                                                <hr />
                                            </>
                                        )}

                                        <hr />

                                        <h3>Vital Signs</h3>

                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "10px" }}>


                                            {medicalInpatientInfo.systolicBloodpressure && (
                                                <p>
                                                    <strong>Systolic: </strong>
                                                    {medicalInpatientInfo.systolicBloodpressure} mmHg
                                                </p>
                                            )}
                                            {medicalInpatientInfo.diastolicBloodPressure && (
                                                <p>
                                                    <strong>Diastolic: </strong>
                                                    {medicalInpatientInfo.diastolicBloodPressure} mmHg
                                                </p>
                                            )}
                                            {medicalInpatientInfo.pulseRate && (
                                                <p>
                                                    <strong>Pulse Rate: </strong>
                                                    {medicalInpatientInfo.pulseRate} bpm
                                                </p>
                                            )}
                                            {medicalInpatientInfo.respiratoryRate && (
                                                <p>
                                                    <strong>Respiratory Rate: </strong>
                                                    {medicalInpatientInfo.respiratoryRate} breaths/min
                                                </p>
                                            )}
                                            {medicalInpatientInfo.temperature && (
                                                <p>
                                                    <strong>Temperature: </strong>
                                                    {medicalInpatientInfo.temperature} °C
                                                </p>
                                            )}
                                            {medicalInpatientInfo.oxygen_saturation && (
                                                <p>
                                                    <strong>Oxygen Saturation: </strong>
                                                    {medicalInpatientInfo.oxygen_saturation} °C
                                                </p>
                                            )}

                                        </div>
                                        <hr />


                                        <h3>Head and Neck</h3>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "10px" }}>




                                            {medicalInpatientInfo.pupilsSymmetrical && (
                                                <p>
                                                    <strong>Pupils Symmetrical: </strong>
                                                    {medicalInpatientInfo.pupilsSymmetrical}
                                                </p>
                                            )}
                                            {medicalInpatientInfo.conjunctiva && (
                                                <p>
                                                    <strong>Conjunctiva: </strong>
                                                    {medicalInpatientInfo.conjunctiva}
                                                </p>
                                            )}
                                            {medicalInpatientInfo.oralKS && (
                                                <p>
                                                    <strong>Oral KS: </strong>
                                                    {medicalInpatientInfo.oralKS}
                                                </p>
                                            )}
                                            {medicalInpatientInfo.oralCandidiasis && (
                                                <p>
                                                    <strong>Oral Candidiasis: </strong>
                                                    {medicalInpatientInfo.oralCandidiasis}
                                                </p>
                                            )}
                                            {medicalInpatientInfo.jvpRaised && (
                                                <p>
                                                    <strong>JVP raised: </strong>
                                                    {medicalInpatientInfo.jvpRaised}
                                                </p>
                                            )}
                                            {medicalInpatientInfo.lymphadenopathy && (
                                                <p>
                                                    <strong>Lymphadenopathy: </strong>
                                                    {medicalInpatientInfo.lymphadenopathy}
                                                </p>
                                            )}

                                        </div>
                                        <hr />

                                        <h3>Chest</h3>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "10px" }}>

                                            {medicalInpatientInfo.symmetricalExpansion && (
                                                <p>
                                                    <strong>Symmetrical Expansion: </strong>
                                                    {medicalInpatientInfo.symmetricalExpansion}
                                                </p>
                                            )}
                                            {medicalInpatientInfo.description && (
                                                <p>
                                                    <strong>Symmetrical Expansion Description: </strong>
                                                    {medicalInpatientInfo.description}
                                                </p>
                                            )}

                                        </div>

                                        <hr />

                                        <h3>Heart</h3>

                                        {medicalInpatientInfo.apexBeat && (
                                            <p>
                                                <strong>Apex Beat: </strong>
                                                {medicalInpatientInfo.apexBeat}
                                            </p>
                                        )}
                                        {medicalInpatientInfo.position && (
                                            <p>
                                                <strong>Displaced Position: </strong>
                                                {medicalInpatientInfo.position}
                                            </p>
                                        )}
                                        {medicalInpatientInfo.thrillHeaves && (
                                            <p>
                                                <strong>Thrill Heaves: </strong>
                                                {medicalInpatientInfo.thrillHeaves}
                                            </p>
                                        )}
                                        {medicalInpatientInfo.specify && (
                                            <p>
                                                <strong>Specify Thrill Heaves: </strong>
                                                {medicalInpatientInfo.specify}
                                            </p>
                                        )}

                                        {medicalInpatientInfo.auscultation && (
                                            <p>
                                                <strong>Auscultation (Heart): </strong>
                                                {medicalInpatientInfo.auscultation}
                                            </p>
                                        )}
                                        <hr />

                                        <h3>Lungs</h3>
                                        {medicalInpatientInfo.lungCondition && (
                                            <p>
                                                <strong>Lung Condition: </strong>
                                                {medicalInpatientInfo.lungCondition}
                                            </p>
                                        )}
                                        {medicalInpatientInfo.lungRegion && (
                                            <p>
                                                <strong>Lung Region: </strong>
                                                {medicalInpatientInfo.lungRegion}
                                            </p>
                                        )}
                                        {medicalInpatientInfo.auscultationLung && (
                                            <p>
                                                <strong>Auscultation Lung: </strong>
                                                {medicalInpatientInfo.auscultationLung}
                                            </p>
                                        )}
                                        <hr />
                                        <h3>Abdomen</h3>
                                        {medicalInpatientInfo.abdomenRegion && (
                                            <p>
                                                <strong>Region: </strong>
                                                {medicalInpatientInfo.abdomenRegion}
                                            </p>
                                        )}
                                        {medicalInpatientInfo.abdomenInspection && (
                                            <p>
                                                <strong>Inspection: </strong>
                                                {medicalInpatientInfo.abdomenInspection}
                                            </p>
                                        )}
                                        {medicalInpatientInfo.abdomenLightPalpation && (
                                            <p>
                                                <strong>Light Palpation: </strong>
                                                {medicalInpatientInfo.abdomenLightPalpation}
                                            </p>
                                        )}

                                        {medicalInpatientInfo.abdomenDeepPalpation && (
                                            <p>
                                                <strong>Deep Palpation: </strong>
                                                {medicalInpatientInfo.abdomenDeepPalpation}
                                            </p>
                                        )}
                                        {medicalInpatientInfo.abdomenAuscultation && (
                                            <p>
                                                <strong>Auscultation: </strong>
                                                {medicalInpatientInfo.abdomenAuscultation}
                                            </p>
                                        )}
                                        {medicalInpatientInfo.abdomenShiftingDullness && (
                                            <p>
                                                <strong>Shifting Dullness: </strong>
                                                {medicalInpatientInfo.abdomenShiftingDullness}
                                            </p>
                                        )}

                                        {medicalInpatientInfo.abdomenFluidThrill && (
                                            <p>
                                                <strong>Fluid Thrill: </strong>
                                                {medicalInpatientInfo.abdomenFluidThrill}
                                            </p>
                                        )}
                                        <hr />

                                        <h3>Extremities</h3>

                                        {medicalInpatientInfo.edema && (
                                            <p>
                                                <strong>Oedema: </strong>
                                                {medicalInpatientInfo.edema}
                                            </p>
                                        )}
                                        <hr />
                                        <h3>Skin</h3>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "10px" }}>

                                            {medicalInpatientInfo.skinRash && (
                                                <p>
                                                    <strong>Skin Rash: </strong>
                                                    {medicalInpatientInfo.skinRash}
                                                </p>
                                            )}
                                            {medicalInpatientInfo.herpesZosterScar && (
                                                <p>
                                                    <strong>Herpes Zoster Scar: </strong>
                                                    {medicalInpatientInfo.herpesZosterScar}
                                                </p>
                                            )}
                                        </div>
                                        <hr />

                                        <h3>Neurological Examination</h3>
                                        {medicalInpatientInfo.nuchalRigidity && (
                                            <p>
                                                <strong>Neck Stiffness: </strong>
                                                {medicalInpatientInfo.nuchalRigidity}
                                            </p>
                                        )}
                                        <br />

                                        <h3>Glasgow Coma Scale (GCS) : {gcsTotal}/15 </h3>

                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "10px" }}>
                                            {medicalInpatientInfo.eyeOpeningResponse && (
                                                <p>
                                                    <strong>Eye Opening Response: </strong>
                                                    {medicalInpatientInfo.eyeOpeningResponse} ({eyeScore})
                                                </p>
                                            )}

                                            {medicalInpatientInfo.verbalResponse && (
                                                <p>
                                                    <strong>Verbal Response: </strong>
                                                    {medicalInpatientInfo.verbalResponse} ({verbalScore})
                                                </p>
                                            )}

                                            {medicalInpatientInfo.motorResponse && (
                                                <p>
                                                    <strong>Motor Response: </strong>
                                                    {medicalInpatientInfo.motorResponse} ({motorScore})
                                                </p>
                                            )}
                                        </div>

                                        {/* Display GCS Total if any component is present */}
                                        {/* {(medicalInpatientInfo.motorResponse ||
                                            medicalInpatientInfo.verbalResponse ||
                                            medicalInpatientInfo.eyeOpeningResponse) && (
                                                <div style={{
                                                    marginTop: "10px",
                                                    padding: "10px",
                                                    backgroundColor: "#f0f8ff",
                                                    borderLeft: "4px solid #2196F3",
                                                    marginBottom: "15px"
                                                }}>
                                                    <p style={{ margin: 0, fontSize: "16px" }}>
                                                        <strong>GCS Total Score: {gcsTotal}/15</strong>
                                                    </p>
                                                </div>
                                            )} */}
                                        <br />
                                        <h3>Cranial and Peripheral Nerves</h3>

                                        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ border: "1px solid #ddd", padding: "8px", backgroundColor: "#f2f2f2", textAlign: "left" }}>
                                                        Cranial Nerves
                                                    </th>
                                                    <th style={{ border: "1px solid #ddd", padding: "8px", backgroundColor: "#f2f2f2", textAlign: "left" }}>
                                                        Peripheral Nerves
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td style={{ border: "1px solid #ddd", padding: "8px", verticalAlign: "top" }}>
                                                        {/* Cranial Nerves Column */}
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                            {medicalInpatientInfo.pupil && (
                                                                <p style={{ margin: 0 }}>
                                                                    <strong>Pupil: </strong>
                                                                    {medicalInpatientInfo.pupil}
                                                                </p>
                                                            )}

                                                            {medicalInpatientInfo.visualFieldAcuity && (
                                                                <p style={{ margin: 0 }}>
                                                                    <strong>Visual Field/Acuity: </strong>
                                                                    {medicalInpatientInfo.visualFieldAcuity}
                                                                </p>
                                                            )}

                                                            {medicalInpatientInfo.eyeMovementsNystagmus && (
                                                                <p style={{ margin: 0 }}>
                                                                    <strong>Eye Movements/Nystagmus: </strong>
                                                                    {medicalInpatientInfo.eyeMovementsNystagmus}
                                                                </p>
                                                            )}

                                                            {medicalInpatientInfo.eyeMovementsSensation && (
                                                                <p style={{ margin: 0 }}>
                                                                    <strong>Facial Movements/Sensation: </strong>
                                                                    {medicalInpatientInfo.eyeMovementsSensation}
                                                                </p>
                                                            )}

                                                            {medicalInpatientInfo.hearing && (
                                                                <p style={{ margin: 0 }}>
                                                                    <strong>Hearing: </strong>
                                                                    {medicalInpatientInfo.hearing}
                                                                </p>
                                                            )}

                                                            {medicalInpatientInfo.tongueMovementTastes && (
                                                                <p style={{ margin: 0 }}>
                                                                    <strong>Tongue Movement/Tastes: </strong>
                                                                    {medicalInpatientInfo.tongueMovementTastes}
                                                                </p>
                                                            )}

                                                            {medicalInpatientInfo.coughGagReflex && (
                                                                <p style={{ margin: 0 }}>
                                                                    <strong>Cough/Gag Reflex: </strong>
                                                                    {medicalInpatientInfo.coughGagReflex}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td style={{ border: "1px solid #ddd", padding: "8px", verticalAlign: "top" }}>
                                                        {/* Peripheral Nerves Column */}
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                            {medicalInpatientInfo.power && (
                                                                <p style={{ margin: 0 }}>
                                                                    <strong>Power: </strong>
                                                                    {medicalInpatientInfo.power}
                                                                </p>
                                                            )}

                                                            {medicalInpatientInfo.tone && (
                                                                <p style={{ margin: 0 }}>
                                                                    <strong>Tone: </strong>
                                                                    {medicalInpatientInfo.tone}
                                                                </p>
                                                            )}

                                                            {medicalInpatientInfo.reflexes && (
                                                                <p style={{ margin: 0 }}>
                                                                    <strong>Reflexes: </strong>
                                                                    {medicalInpatientInfo.reflexes}
                                                                </p>
                                                            )}

                                                            {medicalInpatientInfo.plantars && (
                                                                <p style={{ margin: 0 }}>
                                                                    <strong>Plantars: </strong>
                                                                    {medicalInpatientInfo.plantars}
                                                                </p>
                                                            )}

                                                            {medicalInpatientInfo.sensation && (
                                                                <p style={{ margin: 0 }}>
                                                                    <strong>Sensation: </strong>
                                                                    {medicalInpatientInfo.sensation}
                                                                </p>
                                                            )}

                                                            {medicalInpatientInfo.coordination && (
                                                                <p style={{ margin: 0 }}>
                                                                    <strong>Coordination: </strong>
                                                                    {medicalInpatientInfo.coordination}
                                                                </p>
                                                            )}

                                                            {medicalInpatientInfo.gait && (
                                                                <p style={{ margin: 0 }}>
                                                                    <strong>Gait: </strong>
                                                                    {medicalInpatientInfo.gait}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <hr />

                                        {medicalInpatientInfo.summary && (
                                            <>
                                                <h2>Summary</h2>
                                                <p>{medicalInpatientInfo.summary}</p>
                                                <hr />
                                            </>
                                        )}
                                        <hr />

                                        {medicalInpatientInfo.differentialDiagnosis.length > 0 && (
                                            <>
                                                <h2>Differential Diagnosis</h2>
                                                <p>
                                                    {medicalInpatientInfo.differentialDiagnosis.map((item, index) =>
                                                        ` ${item}`
                                                    ).join(", ")}
                                                </p>
                                                <hr />
                                            </>
                                        )}

                                        <hr />
                                        <h2>Investigation</h2>
                                        <h3>
                                            Bedside Results
                                        </h3>
                                        <BedsideResults data={[]} />

                                        <h3>Lab results</h3>
                                        <LabOrderPlanTable />
                                        {medicalInpatientInfo.radiological && (
                                            <p>
                                                <strong>Radiological: </strong>
                                                {medicalInpatientInfo.radiological}
                                            </p>
                                        )}
                                        {medicalInpatientInfo.additionalNotes && (
                                            <p>
                                                <strong>Other Tests: </strong>
                                                {medicalInpatientInfo.additionalNotes}
                                            </p>
                                        )}
                                        <hr />


                                        {medicalInpatientInfo.managementPlan && (
                                            <>
                                                <h2>Management Plan</h2>

                                                <p>
                                                    {/* <strong>Management Plan: </strong> */}
                                                    {medicalInpatientInfo.managementPlan}
                                                </p>
                                            </>

                                        )}

                                        <hr />
                                        {medicalInpatientInfo.admittingOfficer && (
                                            <p>
                                                <strong>Admitting Officer: </strong>
                                                {medicalInpatientInfo.admittingOfficer}
                                            </p>
                                        )}

                                    </>
                                )}
                        </div>
                    )}

                </div>
                {/* CSS for Print Handling */}
                <style jsx>{`
                @media print {
                    .print-only {
                        display: block !important; /* Ensure visibility in print */
                    }
                }
                .print-only {
                    display: none; /* Hide on screen */
                }
                        .print-preview {
            display: block; /* show on screen when preview is active */
            border: 1px solid #e0e0e0;
            margin: 20px 0;
            padding: 20px;
            background: white;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
            `}</style>


            </div>



        );
    }
);
