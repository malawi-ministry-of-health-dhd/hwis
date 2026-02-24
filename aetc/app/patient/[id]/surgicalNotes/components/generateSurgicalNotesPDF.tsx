"use client";
import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import { useReactToPrint } from "react-to-print";
import { PrescribedMedicationList } from "../../nursingChart/components/prescribedMedicationList";
import { PatientInfoTab } from "@/components";
import { encounters } from "@/constants";
import { useParameters } from "@/hooks";
import { getPatientVisitTypes } from "@/hooks/patientReg";
import { getPatientsEncounters } from "@/hooks/encounter";
import { Visit } from "@/interfaces";
import { LabOrderTable } from "@/app/patient/components/panels/labOrderTable";
import { SurgicalNotesContent } from "./SurgicalNotesContent";
// Define the interface for the component's exposed methods
export interface SurgicalNotesPDFRef {
    generatePDF: () => void;
}

// Define props interface
interface GenerateSurgicalNotesPDFProps {
    onPrintComplete?: () => void;
    showPreview?: boolean; // Add this new prop

}

export const GenerateSurgicalNotesPDF = forwardRef<SurgicalNotesPDFRef, GenerateSurgicalNotesPDFProps>(
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

        const initialClerkInfo = {
            clerkName: "",
            designation: "",
            signature: "",
            additionalNotes: "",
        };
        const [clerkInfo, setClerkInfo] = useState(initialClerkInfo);

        const initialPresentingInfo = {
            complaints: [] as Array<{ complaint: string, duration: string }>, // Change this line
            history: "",
            surgicalHistory: "",
            surgicalProcedure: "",
            familyHistory: [] as string[],
            allergies: "",
            differentialDiagnosis: "",
            notes: "",
            smoking: {
                status: "",
                duration: ""
            },
            alcoholIntake: "",
            recreationalDrugs: "",
        };
        const [presentingInfo, setPresentingInfo] = useState(initialPresentingInfo);

        // Add gynae history state
        const initialGynaeHistory = {
            isPregnant: "",
            lnmp: "",
            gestationalAge: "",
            parity: "",
        };
        const [gynaeHistory, setGynaeHistory] = useState(initialGynaeHistory);

        const initialReviewOfSystems = {
            general: [] as string[],
            ent: [] as string[],
            endocrine: [] as string[],
            cardiac: [] as string[],
            respiratory: [] as string[],
            gastrointestinal: [] as string[],
            genitourinary: [] as string[],
            musculoskeletal: [] as string[],
            neurologic: [] as string[],
            psychiatric: [] as string[],
        };
        const [reviewOfSystems, setReviewOfSystems] = useState(initialReviewOfSystems);

        const initialPhysicalExam = {
            generalCondition: "",
            temperature: "",
            pulseRate: "",
            bloodPressure: "",
            respiratoryRate: "",
            eyes: "",
            mouth: "",
            neck: "",
            chest: "",
            endocrine: "",
            abdominal: "",
            motorResponse: "",
            verbalResponse: "",
            eyeResponse: "",
            cranialNerves: "",
            grossMotor: "",
            sensation: "",
            pulsations: "",
            rectalExamination: "",
            extremities: "",
        };
        const [physicalExam, setPhysicalExam] = useState(initialPhysicalExam);

        const [pastMedicalHistory, setPastMedicalHistory] = useState<Array<{
            condition: string;
            onTreatment: string;
            medication: string;
            medicationDose: string;
            reasonForRequest: string;
            medicationDuration: string;
        }>>([]);
        const [surgicalMeta, setSurgicalMeta] = useState<{
            admittingOfficer: string;
            completedDateTime: string;
        }>({
            admittingOfficer: "",
            completedDateTime: "",
        });

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
                setClerkInfo(initialClerkInfo);
                setPresentingInfo(initialPresentingInfo);
                setGynaeHistory(initialGynaeHistory);
                setReviewOfSystems(initialReviewOfSystems);
                setPhysicalExam(initialPhysicalExam);
                setPastMedicalHistory([]);
                setSurgicalMeta({ admittingOfficer: "", completedDateTime: "" });
                return;
            }

            const surgicalEncounter = visitEncounters
                ?.filter((encounter) => encounter.encounter_type &&
                    encounter.encounter_type.uuid === encounters.SURGICAL_NOTES_TEMPLATE_FORM)
                .sort((a, b) => new Date(b.encounter_datetime).getTime() - new Date(a.encounter_datetime).getTime())[0];

            if (surgicalEncounter && surgicalEncounter.obs) {
                setSurgicalMeta({
                    admittingOfficer: surgicalEncounter.created_by || "",
                    completedDateTime: surgicalEncounter.encounter_datetime || "",
                });
                // Initialize with default values
                const newClerkInfo = {
                    clerkName: "",
                    designation: "",
                    signature: "",
                    additionalNotes: "",
                };
                const newPresentingInfo = {
                    complaints: [] as Array<{ complaint: string, duration: string }>, // Change this line
                    history: "",
                    surgicalHistory: "",
                    surgicalProcedure: "",
                    familyHistory: [] as string[],
                    allergies: "",
                    differentialDiagnosis: "",
                    notes: "",
                    smoking: {
                        status: "",
                        duration: ""
                    },
                    alcoholIntake: "",
                    recreationalDrugs: "",
                };


                // Initialize gynae history
                const newGynaeHistory = {
                    isPregnant: "",
                    lnmp: "",
                    gestationalAge: "",
                    parity: "",
                };


                const newReviewOfSystems = {
                    general: [] as string[],
                    ent: [] as string[],
                    endocrine: [] as string[],
                    cardiac: [] as string[],
                    respiratory: [] as string[],
                    gastrointestinal: [] as string[],
                    genitourinary: [] as string[],
                    musculoskeletal: [] as string[],
                    neurologic: [] as string[],
                    psychiatric: [] as string[],
                };

                const newPhysicalExam = {
                    generalCondition: "",
                    temperature: "",
                    pulseRate: "",
                    bloodPressure: "",
                    respiratoryRate: "",
                    eyes: "",
                    mouth: "",
                    neck: "",
                    chest: "",
                    endocrine: "",
                    abdominal: "",
                    motorResponse: "",
                    verbalResponse: "",
                    eyeResponse: "",
                    cranialNerves: "",
                    grossMotor: "",
                    sensation: "",
                    pulsations: "",
                    rectalExamination: "",
                    extremities: "",
                };
                // Loop through all observations to find our target concepts
                surgicalEncounter.obs.forEach(obs => {
                    const conceptName = obs.names && obs.names.length > 0 ? obs.names[0].name : null;

                    if (conceptName === "Clerk name") {
                        newClerkInfo.clerkName = obs.value || obs.value_text || "";
                    } else if (conceptName === "Designation") {
                        newClerkInfo.designation = obs.value || obs.value_text || "";
                    } else if (conceptName === "Signature") {
                        newClerkInfo.signature = obs.value || obs.value_text || "";
                    } else if (conceptName === "Additional Notes") {
                        newClerkInfo.additionalNotes = obs.value || obs.value_text || "";
                    }
                    // Gynae History mapping
                    else if (conceptName === "B-HCG") {
                        newGynaeHistory.isPregnant = obs.value || obs.value_text || "";
                    } else if (conceptName === "LNMP") {
                        newGynaeHistory.lnmp = obs.value || obs.value_text || "";
                    } else if (conceptName === "Gestational age") {
                        newGynaeHistory.gestationalAge = obs.value || obs.value_text || "";
                    } else if (conceptName === "Parity") {
                        newGynaeHistory.parity = obs.value || obs.value_text || "";
                    }


                    // In your useEffect where you process the surgical encounter observations:
                    else if (conceptName === "Presenting Complaints") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childValue = child.value || child.value_text || "";
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
                                    newPresentingInfo.complaints.push({
                                        complaint: childValue,
                                        duration: duration
                                    });
                                }
                            });
                        }
                    }
                    else if (conceptName === "Presenting history") {
                        newPresentingInfo.history = obs.value || obs.value_text || "";
                    } else if (conceptName === "Surgical Procedure") {
                        newPresentingInfo.surgicalHistory = obs.value || obs.value_text || "";
                    } else if (conceptName === "Procedures") {
                        newPresentingInfo.surgicalProcedure = obs.value || obs.value_text || "";
                    } else if (conceptName?.startsWith("Family History")) {
                        const condition = obs.value || obs.value_text || "";
                        if (condition) {
                            newPresentingInfo.familyHistory.push(condition);
                        }
                    } else if (conceptName === "Allergic reaction") {
                        newPresentingInfo.allergies = obs.value || obs.value_text || "";
                    } else if (conceptName === "Attempted/ Differential Diagnosis") {
                        newPresentingInfo.differentialDiagnosis = obs.value || obs.value_text || "";
                    } else if (conceptName === "Clinician notes") {
                        newPresentingInfo.notes = obs.value || obs.value_text || "";
                    }
                    else if (conceptName === "Patient smokes") {
                        newPresentingInfo.smoking.status = obs.value || obs.value_text || "";
                        if (obs.children && obs.children.length > 0) {
                            const durationChild = obs.children.find(child =>
                                child.names && child.names.length > 0 &&
                                child.names[0].name === "Expected Duration"
                            );
                            if (durationChild) {
                                newPresentingInfo.smoking.duration = durationChild.value || durationChild.value_text || "";
                            }
                        }
                    } else if (conceptName === "Alcohol intake") {
                        newPresentingInfo.alcoholIntake = obs.value || obs.value_text || "";
                    } else if (conceptName === "Recreational drug") {
                        newPresentingInfo.recreationalDrugs = obs.value || obs.value_text || "";
                    }
                    // Review of Systems mapping
                    else if (conceptName === "Review of systems, general") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    newReviewOfSystems.general.push(childName);
                                }
                            });
                        }
                    } else if (conceptName === "Review of systems ENT") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    newReviewOfSystems.ent.push(childName);
                                }
                            });
                        }
                    } else if (conceptName === "Review of systems  endocrine") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    newReviewOfSystems.endocrine.push(childName);
                                }
                            });
                        }
                    } else if (conceptName === "Review of systems cardiac") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    newReviewOfSystems.cardiac.push(childName);
                                }
                            });
                        }
                    } else if (conceptName === "Severe Respiratory") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    newReviewOfSystems.respiratory.push(childName);
                                }
                            });
                        }
                    } else if (conceptName === "Review Of Systems Gastrointestinal") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    newReviewOfSystems.gastrointestinal.push(childName);
                                }
                            });
                        }
                    } else if (conceptName === "Review Of Systems Genitourinary") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    newReviewOfSystems.genitourinary.push(childName);
                                }
                            });
                        }
                    } else if (conceptName === "Review of systems musculoskeletal") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    newReviewOfSystems.musculoskeletal.push(childName);
                                }
                            });
                        }
                    } else if (conceptName === "Review of systems neurologic") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    newReviewOfSystems.neurologic.push(childName);
                                }
                            });
                        }
                    } else if (conceptName === "Review of systems psychiatric") {
                        if (obs.children && obs.children.length > 0) {
                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName) {
                                    newReviewOfSystems.psychiatric.push(childName);
                                }
                            });
                        }
                    }
                    // Physical examination mapping
                    else if (conceptName === "General condition") {
                        newPhysicalExam.generalCondition = obs.value || "";
                    } else if (conceptName === "Temperature (c)") {
                        newPhysicalExam.temperature = obs.value_numeric ? `${obs.value_numeric}°C` : obs.value || "";
                    } else if (conceptName === "Pulse Rate") {
                        newPhysicalExam.pulseRate = obs.value_text || obs.value || "";
                    } else if (conceptName === "Blood Pressure Measured") {
                        newPhysicalExam.bloodPressure = obs.value_text || obs.value || "";
                    } else if (conceptName === "Respiratory rate") {
                        newPhysicalExam.respiratoryRate = obs.value_text || obs.value || "";
                    } else if (conceptName === "Eyes") {
                        newPhysicalExam.eyes = obs.value_text || obs.value || "";
                    } else if (conceptName === "Mouth") {
                        newPhysicalExam.mouth = obs.value_text || obs.value || "";
                    } else if (conceptName === "Neck") {
                        newPhysicalExam.neck = obs.value_text || obs.value || "";
                    } else if (conceptName === "Chest examination") {
                        newPhysicalExam.chest = obs.value_text || obs.value || "";
                    } else if (conceptName === "Endocrine examination") {
                        newPhysicalExam.endocrine = obs.value_text || obs.value || "";
                    } else if (conceptName === "Abdominal examination") {
                        newPhysicalExam.abdominal = obs.value_text || obs.value || "";
                    } else if (conceptName === "Motor response") {
                        newPhysicalExam.motorResponse = obs.value_text || obs.value || "";
                    } else if (conceptName === "Verbal Response") {
                        newPhysicalExam.verbalResponse = obs.value_text || obs.value || "";
                    } else if (conceptName === "Eye Opening response") {
                        newPhysicalExam.eyeResponse = obs.value_text || obs.value || "";
                    } else if (conceptName === "Cranial erves") {
                        newPhysicalExam.cranialNerves = obs.value_text || obs.value || "";
                    } else if (conceptName === "Gross motor") {
                        newPhysicalExam.grossMotor = obs.value_text || obs.value || "";
                    } else if (conceptName === "Sensation") {
                        newPhysicalExam.sensation = obs.value_text || obs.value || "";
                    } else if (conceptName === "Pulsations") {
                        newPhysicalExam.pulsations = obs.value_text || obs.value || "";
                    } else if (conceptName === "Rectal examination") {
                        newPhysicalExam.rectalExamination = obs.value_text || obs.value || "";
                    } else if (conceptName === "Extremities") {
                        newPhysicalExam.extremities = obs.value_text || obs.value || "";
                    }
                });

                // If clerk name is still empty, use the created_by field as fallback
                if (!newClerkInfo.clerkName && surgicalEncounter.created_by) {
                    newClerkInfo.clerkName = surgicalEncounter.created_by;
                }

                setClerkInfo(newClerkInfo);
                setPresentingInfo(newPresentingInfo);
                setGynaeHistory(newGynaeHistory); // Set the gynae history state
                setReviewOfSystems(newReviewOfSystems);
                setPhysicalExam(newPhysicalExam);
            }

            // Find and process past medical history data from all encounters
            const pastMedicalHistoryData: Array<{
                condition: string;
                onTreatment: string;
                medication: string;
                medicationDose: string;
                reasonForRequest: string;
                medicationDuration: string;
            }> = [];

            visitEncounters.forEach(encounter => {
                if (encounter.obs) {
                    encounter.obs.forEach(obs => {
                        const conceptName = obs.names && obs.names.length > 0 ? obs.names[0].name : null;
                        if (conceptName === "Condition" && obs.children && obs.children.length > 0) {
                            const conditionEntry = {
                                condition: obs.value || obs.value_text || "",
                                onTreatment: "",
                                medication: "",
                                medicationDose: "",
                                reasonForRequest: "",
                                medicationDuration: ""
                            };

                            obs.children.forEach(child => {
                                const childName = child.names && child.names.length > 0 ? child.names[0].name : null;
                                if (childName === "On treatment") {
                                    conditionEntry.onTreatment = child.value || child.value_text || "";
                                } else if (childName === "Medication") {
                                    conditionEntry.medication = child.value || child.value_text || "";
                                } else if (childName === "Medication Dose") {
                                    conditionEntry.medicationDose = child.value || child.value_text || "";
                                } else if (childName === "Reason for request") {
                                    conditionEntry.reasonForRequest = child.value || child.value_text || "";
                                } else if (childName === "Medication Duration") {
                                    conditionEntry.medicationDuration = child.value || child.value_text || "";
                                }
                            });

                            pastMedicalHistoryData.push(conditionEntry);
                        }
                    });
                }
            });

            setPastMedicalHistory(pastMedicalHistoryData);
        }, [encountersData]);

        return (
            <div ref={contentRef} className="print-only-wrapper">
                <div className={showPreview ? "print-preview" : "print-only"}>
                    <SurgicalNotesContent
                        presentingInfo={presentingInfo}
                        pastMedicalHistory={pastMedicalHistory}
                        reviewOfSystems={reviewOfSystems}
                        physicalExam={physicalExam}
                        clerkInfo={clerkInfo}
                        admittingOfficer={surgicalMeta.admittingOfficer}
                        completedDateTime={surgicalMeta.completedDateTime}
                        gynaeHistory={gynaeHistory} // Pass gynae history to the content component
                        setRow={setRow}
                        showPatientInfo={true}
                    />
                </div>

                {/* CSS for Print Handling */}
                <style jsx>{`
                @media print {
                    .print-only {
                        display: block !important;
                    }
                }
                .print-only {
                    display: none; /* hide on screen but still mounted */
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

        // return (
        //     <div ref={contentRef} className="printable-content" >
        //         <div className="print-only">
        //             <PatientInfoTab />

        //             <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Surgical Notes</h1>

        //             <p><strong>Presenting Complaints:</strong> {presentingInfo.complaints.length > 0 ?
        //                 presentingInfo.complaints.map((item, index) => `(${index + 1}) ${item}`).join(", ")
        //                 : "None"}</p>
        //             <p><strong>Additonal Complaints:</strong> {presentingInfo.history}</p>
        //             <hr />
        //             <h2>Past Medical History</h2>
        //             {pastMedicalHistory.length > 0 ? (
        //                 <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
        //                     <thead>
        //                         <tr>
        //                             <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Condition</th>
        //                             <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>On Treatment</th>
        //                             <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Medication</th>
        //                             <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Medication Dose</th>
        //                             <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Reason for Request</th>
        //                             <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Medication Duration</th>
        //                         </tr>
        //                     </thead>
        //                     <tbody>
        //                         {pastMedicalHistory.map((history, index) => (
        //                             <tr key={index}>
        //                                 <td style={{ border: "1px solid #ddd", padding: "8px" }}>{history.condition}</td>
        //                                 <td style={{ border: "1px solid #ddd", padding: "8px" }}>{history.onTreatment}</td>
        //                                 <td style={{ border: "1px solid #ddd", padding: "8px" }}>{history.medication}</td>
        //                                 <td style={{ border: "1px solid #ddd", padding: "8px" }}>{history.medicationDose}</td>
        //                                 <td style={{ border: "1px solid #ddd", padding: "8px" }}>{history.reasonForRequest}</td>
        //                                 <td style={{ border: "1px solid #ddd", padding: "8px" }}>{history.medicationDuration}</td>
        //                             </tr>
        //                         ))}
        //                     </tbody>
        //                 </table>
        //             ) : (
        //                 <p>No past medical history recorded.</p>
        //             )}
        //             <p><strong>Surgical History:</strong> {presentingInfo.surgicalHistory}</p>
        //             <p><strong>Surgical Procedure:</strong> {presentingInfo.surgicalProcedure}</p>

        //             <p><strong>Family History:</strong> {presentingInfo.familyHistory.length > 0 ?
        //                 presentingInfo.familyHistory.map((item, index) => `(${index + 1}) ${item}`).join(", ")
        //                 : "None"}                </p>
        //             <p><strong>Allergies:</strong> {presentingInfo.allergies || "None"}</p>
        //             <hr />

        //             <h2>Social History & Review of Systems</h2>
        //             <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
        //                 <thead>
        //                     <tr>
        //                         <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Social History</th>
        //                         <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Review of Systems</th>
        //                     </tr>
        //                 </thead>
        //                 <tbody>
        //                     <tr>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                             <strong>Smoking Status:</strong> {presentingInfo.smoking.status || "Unknown"}
        //                         </td>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                             <strong>General:</strong> {reviewOfSystems.general.length > 0 ? reviewOfSystems.general.map((item, index) => `(${index + 1}) ${item}`).join(", ")
        //                                 : "None"}
        //                         </td>
        //                     </tr>
        //                     {presentingInfo.smoking.status === "Yes" && (
        //                         <tr>
        //                             <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                                 <strong>Cigarettes per day:</strong> {presentingInfo.smoking.duration || "Unknown"}
        //                             </td>
        //                             <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                                 <strong>ENT:</strong>{" "}
        //                                 {reviewOfSystems.ent.length > 0
        //                                     ? reviewOfSystems.ent.map((item, index) => `(${index + 1}) ${item}`).join(", ")
        //                                     : "None"}                                    </td>
        //                         </tr>
        //                     )}
        //                     <tr>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                             <strong>Alcohol Intake:</strong> {presentingInfo.alcoholIntake ? `${presentingInfo.alcoholIntake} units per day` : "None"}
        //                         </td>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                             <strong>Endocrine:</strong> {reviewOfSystems.endocrine.length > 0 ? reviewOfSystems.endocrine.join(", ") : "None"}
        //                         </td>
        //                     </tr>
        //                     <tr>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                             <strong>Recreational Drugs:</strong> {presentingInfo.recreationalDrugs || "None"}
        //                         </td>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                             <strong>Cardiac:</strong> {reviewOfSystems.cardiac.length > 0 ? reviewOfSystems.cardiac.map((item, index) => `(${index + 1}) ${item}`).join(", ")
        //                                 : "None"}
        //                         </td>
        //                     </tr>
        //                     <tr>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}></td>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                             <strong>Respiratory:</strong> {reviewOfSystems.respiratory.length > 0 ? reviewOfSystems.respiratory.map((item, index) => `(${index + 1}) ${item}`).join(", ")
        //                                 : "None"}
        //                         </td>
        //                     </tr>
        //                     <tr>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}></td>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                             <strong>Gastrointestinal:</strong> {reviewOfSystems.gastrointestinal.length > 0 ? reviewOfSystems.gastrointestinal.map((item, index) => `(${index + 1}) ${item}`).join(", ")
        //                                 : "None"}
        //                         </td>
        //                     </tr>
        //                     <tr>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}></td>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                             <strong>Genitourinary:</strong> {reviewOfSystems.genitourinary.length > 0 ? reviewOfSystems.genitourinary.map((item, index) => `(${index + 1}) ${item}`).join(", ")
        //                                 : "None"}
        //                         </td>
        //                     </tr>
        //                     <tr>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}></td>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                             <strong>Musculoskeletal:</strong> {reviewOfSystems.musculoskeletal.length > 0 ? reviewOfSystems.musculoskeletal.join(", ") : "None"}
        //                         </td>
        //                     </tr>
        //                     <tr>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}></td>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                             <strong>Neurologic:</strong> {reviewOfSystems.neurologic.length > 0 ? reviewOfSystems.neurologic.map((item, index) => `(${index + 1}) ${item}`).join(", ")
        //                                 : "None"}
        //                         </td>
        //                     </tr>
        //                     <tr>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}></td>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                             <strong>Psychiatric:</strong> {reviewOfSystems.psychiatric.length > 0 ? reviewOfSystems.psychiatric.map((item, index) => `(${index + 1}) ${item}`).join(", ")
        //                                 : "None"}
        //                         </td>
        //                     </tr>
        //                 </tbody>
        //             </table>
        //             <h2>Physical Examination</h2>
        //             <p><strong>General Condition:</strong> {physicalExam.generalCondition || "Not recorded"}</p>

        //             <h3>Vitals</h3>
        //             <div style={{ display: "flex", gap: "20px", marginBottom: "10px" }}>
        //                 <p><strong>Temperature:</strong> {physicalExam.temperature || "Not recorded"}</p>
        //                 <p><strong>Pulse Rate:</strong> {physicalExam.pulseRate || "Not recorded"} bpm</p>
        //                 <p><strong>Blood Pressure:</strong> {physicalExam.bloodPressure || "Not recorded"} mmHg</p>
        //                 <p><strong>Respiratory Rate:</strong> {physicalExam.respiratoryRate || "Not recorded"} breaths/min</p>
        //             </div>
        //             <div style={{ display: "flex", gap: "20px", marginBottom: "10px" }}>
        //                 <p><strong>Eyes:</strong> {physicalExam.eyes || "Not recorded"}</p>
        //                 <p><strong>Mouth:</strong> {physicalExam.mouth || "Not recorded"}</p>
        //                 <p><strong>Neck:</strong> {physicalExam.neck || "Not recorded"}</p>
        //             </div>

        //             <p><strong>Chest Examination:</strong> {physicalExam.chest || "Not recorded"}</p>
        //             <p><strong>Endocrine Examination:</strong> {physicalExam.endocrine || "Not recorded"}</p>
        //             <p><strong>Abdominal Examination:</strong> {physicalExam.abdominal || "Not recorded"}</p>
        //             <hr />

        //             <h3>Glasgow Coma Scale (GCS)</h3>

        //             <p><strong>Motor Response:</strong> {physicalExam.motorResponse || "Not recorded"}</p>
        //             <p><strong>Verbal Response:</strong> {physicalExam.verbalResponse || "Not recorded"}</p>
        //             <p><strong>Eye Response:</strong> {physicalExam.eyeResponse || "Not recorded"}</p>
        //             <hr />
        //             <h3>Additional Examinations & Extremities</h3>
        //             <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
        //                 <thead>
        //                     <tr>
        //                         <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Additional Examinations</th>
        //                         <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Extremities</th>
        //                     </tr>
        //                 </thead>
        //                 <tbody>
        //                     <tr>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                             <strong>Cranial Nerves:</strong> {physicalExam.cranialNerves || "Not recorded"}
        //                         </td>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                             <strong>Pulsations:</strong> {physicalExam.pulsations || "Not recorded"}
        //                         </td>
        //                     </tr>
        //                     <tr>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                             <strong>Gross Motor:</strong> {physicalExam.grossMotor || "Not recorded"}
        //                         </td>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                             <strong>Rectal Examination:</strong> {physicalExam.rectalExamination || "Not recorded"}
        //                         </td>
        //                     </tr>
        //                     <tr>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                             <strong>Sensation:</strong> {physicalExam.sensation || "Not recorded"}
        //                         </td>
        //                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
        //                             <strong>Extremities:</strong> {physicalExam.extremities || "Not recorded"}
        //                         </td>
        //                     </tr>
        //                 </tbody>
        //             </table>

        //             <hr />
        //             <p><strong>Working Differential Diagnosis:</strong> {presentingInfo.differentialDiagnosis || "None"}</p>
        //             <hr />

        //             <h2>Investigations</h2>
        //             <LabOrderTable />
        //             <hr />

        //             <h2>Medications</h2>
        //             <PrescribedMedicationList setRow={setRow} />
        //             <hr />
        //             <h2>Clerking Details</h2>
        //             <p><strong>Additional Notes:</strong> {clerkInfo.additionalNotes}</p>
        //             <div style={{ display: "flex", gap: "20px", marginBottom: "10px" }}>

        //                 <p><strong>Clerk Name:</strong> {clerkInfo.clerkName}</p>
        //                 <p><strong>Designation:</strong> {clerkInfo.designation}</p>
        //                 <p><strong>Signature:</strong> {clerkInfo.signature}</p>
        //             </div>

        //         </div>
        //         {/* CSS for Print Handling */}
        //         <style jsx>{`
        //         @media print {
        //             .print-only {
        //                 display: block !important; /* Ensure visibility in print */
        //             }
        //         }
        //         .print-only {
        //             display: none; /* Hide on screen */
        //         }
        //     `}</style>
        //     </div>
        // );
    }
);
