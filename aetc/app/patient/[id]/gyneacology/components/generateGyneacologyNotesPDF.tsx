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
// Define the interface for the component's exposed methods

export interface GyneacologyNotesPDFRef {
    generatePDF: () => void;
}

// Define props interface
interface GenerateGyneacologyNotesPDFProps {
    onPrintComplete?: () => void;
    showPreview?: boolean; // Add this new prop

}

export const GenerateGyneacologyNotesPDF = forwardRef<GyneacologyNotesPDFRef, GenerateGyneacologyNotesPDFProps>(
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

        const initialComplaintsInfo = {
            chiefComplaint: "",
            illnessHistory: "",
            lnmp: "",
            edd: "",
            //edd remaining
            gestationalAge: "",
            gravidity: "",
            parity: "",
            numberOfLivingChildren: "",
            menarche: "",
            menstralCycle: "",
            duration: "",
            prevAbortion: "",
            prevEctopic: "",
            abnormalVaginalDischarge: "",
            consistency: "",
            color: "",
            odour: "",
            amount: "",
            previousContraceptive: "",
            currentlyOnContraceptive: "",
            sideEffects: "",
            cancerScreening: "",
            historyOfStis: "",
            medicalHistory: [] as string[],
            habits: [] as string[],
            temperature: "",
            pulse: "",
            respiratory: "",
            bloodPressure: "",
            systolic: "", // Add this
            diastolic: "", // Add this        
            stats: "",
            rbs: "",
            weight: "",
            height: "",
            condition: "",
            pallor: "",
            chestExamination: "",
            abdomenExamination: "",
            vaginalInspection: "",
            vaginalExamination: "",
            extremities: "",
            impression: "",
            plan: "",
            immediateIntervention: "",
            admittingOfficer: "", // Default value
            completedDateTime: "",


        };
        const [complaintsInfo, setComplaintsInfo] = useState(initialComplaintsInfo);
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
                setComplaintsInfo(initialComplaintsInfo);
                return;
            }
            const gyneacologyEncounter = visitEncounters
                ?.filter(
                    (encounter) =>
                        encounter.encounter_type &&
                        encounter.encounter_type.uuid === encounters.GYNEACOLOGY_WARD
                )
                .sort(
                    (a, b) =>
                        new Date(b.encounter_datetime).getTime() -
                        new Date(a.encounter_datetime).getTime()
                )[0];

            if (gyneacologyEncounter && gyneacologyEncounter.obs) {
                const admittingOfficer = gyneacologyEncounter.created_by || "";
                const completedDateTime = gyneacologyEncounter.encounter_datetime || "";
                const newComplaintsInfo = {
                    chiefComplaint: "",
                    illnessHistory: "",
                    lnmp: "",
                    edd: "", // This can be removed if not needed
                    //edd remaining
                    gestationalAge: "",
                    gravidity: "",
                    parity: "",
                    numberOfLivingChildren: "",
                    menarche: "",
                    menstralCycle: "",
                    duration: "",
                    prevAbortion: "",
                    prevEctopic: "",
                    abnormalVaginalDischarge: "",
                    consistency: "",
                    color: "",
                    odour: "",
                    amount: "",
                    previousContraceptive: "",
                    currentlyOnContraceptive: "", // This can be removed if not needed
                    //currently on contracepptive
                    sideEffects: "",
                    cancerScreening: "",
                    historyOfStis: "",
                    medicalHistory: [] as string[],
                    habits: [] as string[],
                    temperature: "",
                    pulse: "",
                    respiratory: "",
                    systolic: "", // Add this
                    diastolic: "", // Add this                
                    bloodPressure: "",
                    stats: "",
                    rbs: "",
                    weight: "",
                    height: "",
                    condition: "",
                    pallor: "",
                    chestExamination: "",
                    abdomenExamination: "",
                    vaginalInspection: "",
                    vaginalExamination: "",
                    extremities: "",
                    impression: "",
                    plan: "",
                    immediateIntervention: "",
                    admittingOfficer: admittingOfficer, // Use the created_by field as the admitting officer
                    completedDateTime: completedDateTime,

                };

                const medicalHistoryConceptNames = [
                    "Family History Hypertension",
                    "Family History Diabetes Mellitus",
                    "Family History Tuberculosis",
                    "Family History Epilepsy",
                    "Family History Asthma",
                    "Mental illness",
                    "Blood transfusion",
                    "Drug Allergies"
                ];

                const habitsConceptNames = [
                    "Alcohol intake",
                    "Smoking history",
                    "Recreational drug",
                ];
                gyneacologyEncounter.obs.forEach(obs => {
                    const conceptName = obs.names && obs.names.length > 0 ? obs.names[0].name : null;
                    if (conceptName === "Chief complaint") {
                        newComplaintsInfo.chiefComplaint = obs.value || obs.value_text || "";
                    } else if (conceptName === "History of present illness") {
                        newComplaintsInfo.illnessHistory = obs.value || obs.value_text || "";
                    }
                    else if (conceptName === "LNMP") {
                        newComplaintsInfo.lnmp = obs.value || obs.value_text || "";
                    }
                    else if (conceptName === "EDD") {
                        newComplaintsInfo.edd = obs.value || obs.value_text || "";
                    }
                    else if (conceptName === "Gestational age") {
                        newComplaintsInfo.gestationalAge = obs.value || obs.value_text || "";
                    } else if (conceptName === "Gravidity") {
                        newComplaintsInfo.gravidity = obs.value || obs.value_text || "";
                    }
                    else if (conceptName === "Parity") {
                        newComplaintsInfo.parity = obs.value || obs.value_text || "";
                    }
                    else if (conceptName === "Number of living children") {
                        newComplaintsInfo.numberOfLivingChildren = obs.value || obs.value_text || "";
                    } else if (conceptName === "Menarche") {
                        newComplaintsInfo.menarche = obs.value || obs.value_text || "";
                    } else if (conceptName === "Menstrual cycle") {
                        newComplaintsInfo.menstralCycle = obs.value || obs.value_text || "";
                    } else if (conceptName === "Duration") {
                        newComplaintsInfo.duration = obs.value || obs.value_text || "";
                    } else if (conceptName === "Prev Abortion") {
                        newComplaintsInfo.prevAbortion = obs.value || obs.value_text || "";
                    } else if (conceptName === "Prev Ectopic") {
                        newComplaintsInfo.prevEctopic = obs.value || obs.value_text || "";
                    } else if (conceptName === "Abnormal Vaginal Discharge") {
                        newComplaintsInfo.abnormalVaginalDischarge = obs.value || obs.value_text || "";
                    } else if (conceptName === "Consistency") {
                        newComplaintsInfo.consistency = obs.value || obs.value_text || "";
                    } else if (conceptName === "Color") {
                        newComplaintsInfo.color = obs.value || obs.value_text || "";
                    } else if (conceptName === "Odour") {
                        newComplaintsInfo.odour = obs.value || obs.value_text || "";
                    } else if (conceptName === "Amount") {
                        newComplaintsInfo.amount = obs.value || obs.value_text || "";
                    } else if (conceptName === "Previous Contraceptive") {
                        newComplaintsInfo.previousContraceptive = obs.value || obs.value_text || "";
                    } else if (conceptName === "Currently On Contraceptive") {
                        newComplaintsInfo.currentlyOnContraceptive = obs.value || obs.value_text || "";
                    }


                    else if (
                        obs.names?.some((n: any) => n.name.toLowerCase() === "side effects")
                    ) {
                        newComplaintsInfo.sideEffects = obs.value || obs.value_text || "";
                    } else if (conceptName === "Cancer Screening") {
                        newComplaintsInfo.cancerScreening = obs.value || obs.value_text || "";
                    } else if (conceptName === "History of STIs") {
                        newComplaintsInfo.historyOfStis = obs.value || obs.value_text || "";
                    } else if (conceptName && medicalHistoryConceptNames.includes(conceptName)) {
                        const condition = obs.value || obs.value_text || "";
                        if (condition) {
                            newComplaintsInfo.medicalHistory.push(condition);
                        }
                    } else if (conceptName && habitsConceptNames.includes(conceptName)) {
                        const condition = obs.value || obs.value_text || "";
                        if (condition) {
                            newComplaintsInfo.habits.push(condition);
                        }

                    } else if (conceptName === "Temperature (c)") {
                        newComplaintsInfo.temperature = obs.value || obs.value_text || "";
                    } else if (conceptName === "Pulse Rate") {
                        newComplaintsInfo.pulse = obs.value || obs.value_text || "";
                    } else if (conceptName === "Respiratory rate") {
                        newComplaintsInfo.respiratory = obs.value || obs.value_text || "";
                    } else if (conceptName === "Blood Pressure Measured") {
                        newComplaintsInfo.bloodPressure = obs.value || obs.value_text || "";
                    }

                    else if (conceptName === "Systolic blood pressure") {
                        newComplaintsInfo.systolic = obs.value || obs.value_text || "";
                    }

                    else if (conceptName === "Diastolic blood pressure") {
                        newComplaintsInfo.diastolic = obs.value || obs.value_text || "";
                    }
                    else if (conceptName === "Stats") {
                        newComplaintsInfo.stats = obs.value || obs.value_text || "";
                    } else if (conceptName === "Random Blood Glucose (RBS)") {
                        newComplaintsInfo.rbs = obs.value || obs.value_text || "";
                    } else if (conceptName === "Weight (kg)") {
                        newComplaintsInfo.weight = obs.value || obs.value_text || "";
                    }
                    else if (conceptName === "Raised height") {
                        newComplaintsInfo.height = obs.value || obs.value_text || "";
                    }
                    else if (conceptName === "Condition") {
                        newComplaintsInfo.condition = obs.value || obs.value_text || "";
                    } else if (conceptName === "Pallor") {
                        newComplaintsInfo.pallor = obs.value || obs.value_text || "";
                    }
                    else if (conceptName === "Chest examination") {
                        newComplaintsInfo.chestExamination = obs.value || obs.value_text || "";
                    } else if (conceptName === "Abdominal examination") {
                        newComplaintsInfo.abdomenExamination = obs.value || obs.value_text || "";
                    } else if (conceptName === "Vaginal Inspection") {
                        newComplaintsInfo.vaginalInspection = obs.value || obs.value_text || "";
                    } else if (conceptName === "Vaginal examination") {
                        newComplaintsInfo.vaginalExamination = obs.value || obs.value_text || "";
                    } else if (conceptName === "Extremities") {
                        newComplaintsInfo.extremities = obs.value || obs.value_text || "";
                    } else if (conceptName === "Clinical impression comments") {
                        newComplaintsInfo.impression = obs.value || obs.value_text || "";
                    }
                    else if (conceptName === "Treatment plan other remarks") {
                        newComplaintsInfo.plan = obs.value || obs.value_text || "";
                    }
                    else if (conceptName === "Immediate Intervention") {
                        newComplaintsInfo.immediateIntervention = obs.value || obs.value_text || "";
                    }
                });
                setComplaintsInfo(newComplaintsInfo);
            }
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

        return (
            <div ref={contentRef} className="printable-content">
                <div className={showPreview ? "print-preview" : "print-only"}>
                    <PatientInfoTab />
                    {(complaintsInfo.admittingOfficer || complaintsInfo.completedDateTime) && (
                        <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
                                {complaintsInfo.admittingOfficer && (
                                    <p style={{ margin: "5px 0" }}>
                                        <strong>Admitting Officer: </strong>
                                        {complaintsInfo.admittingOfficer}
                                    </p>
                                )}
                                {complaintsInfo.completedDateTime && (
                                    <p style={{ margin: "5px 0" }}>
                                        <strong>Date & Time Completed: </strong>
                                        {formatDateTime(complaintsInfo.completedDateTime)}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Gyneacology Ward</h1>

                    {Object.values(complaintsInfo).every(
                        (val) => (typeof val === "string" ? !val.trim() : val.length === 0)
                    ) ? (
                        <p style={{ fontStyle: "italic", color: "gray" }}>
                            Gyneacology Ward not recorded.
                        </p>
                    ) : (
                        <div className="patient-examination-data">

                            {/* Complaints Section */}
                            {(complaintsInfo.chiefComplaint || complaintsInfo.illnessHistory) && (
                                <>
                                    <h2>Complaints</h2>
                                    {complaintsInfo.chiefComplaint && (
                                        <p><strong>Chief Complaints: </strong>{complaintsInfo.chiefComplaint}</p>
                                    )}
                                    {complaintsInfo.illnessHistory && (
                                        <p><strong>History of Present Illness: </strong>{complaintsInfo.illnessHistory}</p>
                                    )}
                                    <hr />
                                </>
                            )}

                            {/* Obstetric and Gyneacology History */}
                            {[
                                complaintsInfo.lnmp,
                                complaintsInfo.edd,
                                // complaintsInfo.edd,
                                complaintsInfo.gestationalAge,
                                complaintsInfo.gravidity,
                                complaintsInfo.parity,
                                complaintsInfo.numberOfLivingChildren,
                                complaintsInfo.menarche,
                                complaintsInfo.menstralCycle,
                                complaintsInfo.duration,
                                complaintsInfo.prevAbortion,
                                complaintsInfo.prevEctopic,
                                complaintsInfo.abnormalVaginalDischarge,
                                complaintsInfo.consistency,
                                complaintsInfo.color,
                                complaintsInfo.odour,
                                complaintsInfo.amount,
                                complaintsInfo.previousContraceptive,
                                complaintsInfo.currentlyOnContraceptive,
                                // complaintsInfo.contraceptiveUse,
                                complaintsInfo.sideEffects,
                                complaintsInfo.cancerScreening,
                                complaintsInfo.historyOfStis
                            ].some(Boolean) && (
                                    <>
                                        <h2>Obstetric and Gyneacology History</h2>
                                        <div style={{ display: "flex", gap: "20px", marginBottom: "10px", flexWrap: "wrap" }}>
                                            {complaintsInfo.lnmp && <p><strong>LNMP: </strong>{complaintsInfo.lnmp}</p>}
                                            {complaintsInfo.edd && <p><strong>EDD: </strong>{complaintsInfo.edd}</p>}
                                            {complaintsInfo.gestationalAge && <p><strong>Gestational Age: </strong>{complaintsInfo.gestationalAge}</p>}
                                            {complaintsInfo.gravidity && <p><strong>Gravidity: </strong>{complaintsInfo.gravidity}</p>}
                                            {complaintsInfo.parity && <p><strong>Parity: </strong>{complaintsInfo.parity}</p>}
                                            {complaintsInfo.numberOfLivingChildren && <p><strong>Number of Living Children: </strong>{complaintsInfo.numberOfLivingChildren}</p>}
                                            {complaintsInfo.menarche && <p><strong>Menarche: </strong>{complaintsInfo.menarche}</p>}
                                            {complaintsInfo.menstralCycle && <p><strong>Menstrual Cycle: </strong>{complaintsInfo.menstralCycle}</p>}
                                            {complaintsInfo.duration && <p><strong>Duration in Days: </strong>{complaintsInfo.duration}</p>}
                                            {complaintsInfo.prevAbortion && <p><strong>Prev Abortion: </strong>{complaintsInfo.prevAbortion}</p>}
                                            {complaintsInfo.prevEctopic && <p><strong>Prev Ectopic: </strong>{complaintsInfo.prevEctopic}</p>}
                                            {complaintsInfo.abnormalVaginalDischarge && <p><strong>Abnormal Vaginal Discharge: </strong>{complaintsInfo.abnormalVaginalDischarge}</p>}
                                            {complaintsInfo.consistency && <p><strong>Consistency: </strong>{complaintsInfo.consistency}</p>}
                                            {complaintsInfo.color && <p><strong>Color: </strong>{complaintsInfo.color}</p>}
                                            {complaintsInfo.odour && <p><strong>Odour: </strong>{complaintsInfo.odour}</p>}
                                            {complaintsInfo.amount && <p><strong>Amount: </strong>{complaintsInfo.amount}</p>}
                                            {complaintsInfo.previousContraceptive && <p><strong>Previous Contraceptive: </strong>{complaintsInfo.previousContraceptive}</p>}
                                            {complaintsInfo.currentlyOnContraceptive && <p><strong>Currently on Contraceptive: </strong>{complaintsInfo.currentlyOnContraceptive}</p>}
                                            {complaintsInfo.sideEffects && <p><strong>Side Effects: </strong>{complaintsInfo.sideEffects}</p>}
                                            {complaintsInfo.cancerScreening && <p><strong>Cancer Screening: </strong>{complaintsInfo.cancerScreening}</p>}
                                            {complaintsInfo.historyOfStis && <p><strong>History of STIs: </strong>{complaintsInfo.historyOfStis}</p>}
                                        </div>
                                        <hr />
                                    </>
                                )}

                            {/* Medical History */}
                            {(complaintsInfo.medicalHistory.length > 0 || complaintsInfo.habits.length > 0) && (
                                <>
                                    {complaintsInfo.medicalHistory.length > 0 && (
                                        <>
                                            <h2>Medical History</h2>
                                            <p>
                                                <strong>Condition: </strong>
                                                {complaintsInfo.medicalHistory.map((item, index) => `(${index + 1}) ${item}`).join(", ")}
                                            </p>
                                            <hr />
                                        </>
                                    )}
                                    {complaintsInfo.habits.length > 0 && (
                                        <>
                                            <h2>Habits</h2>
                                            <p>
                                                <strong>Condition: </strong>
                                                {complaintsInfo.habits.map((item, index) => `(${index + 1}) ${item}`).join(", ")}
                                            </p>
                                            <hr />
                                        </>
                                    )}
                                </>
                            )}

                            {/* Vital Signs */}
                            {[
                                complaintsInfo.temperature,
                                complaintsInfo.pulse,
                                complaintsInfo.respiratory,
                                // complaintsInfo.bloodPressure,
                                complaintsInfo.systolic,
                                complaintsInfo.diastolic,
                                complaintsInfo.stats,
                                complaintsInfo.rbs,
                                complaintsInfo.weight,
                                complaintsInfo.height

                            ].some(Boolean) && (
                                    <>
                                        <h2>Vital Signs</h2>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "10px" }}>
                                            {complaintsInfo.temperature && (
                                                <p>
                                                    <strong>Temperature: </strong>
                                                    {complaintsInfo.temperature} °C
                                                </p>
                                            )}

                                            {complaintsInfo.pulse && (
                                                <p>
                                                    <strong>Pulse: </strong>
                                                    {complaintsInfo.pulse} bpm
                                                </p>
                                            )}

                                            {complaintsInfo.respiratory && (
                                                <p>
                                                    <strong>Respiratory Rate: </strong>
                                                    {complaintsInfo.respiratory} breaths/min
                                                </p>
                                            )}

                                            {complaintsInfo.systolic && (
                                                <p>
                                                    <strong>Systolic Blood Pressure: </strong>
                                                    {complaintsInfo.systolic} mmHg
                                                </p>
                                            )}

                                            {complaintsInfo.diastolic && (
                                                <p>
                                                    <strong>Diastolic Blood Pressure: </strong>
                                                    {complaintsInfo.diastolic} mmHg
                                                </p>
                                            )}

                                            {complaintsInfo.stats && (
                                                <p>
                                                    <strong>O<sub>2</sub> Saturation: </strong>
                                                    {complaintsInfo.stats} %
                                                </p>
                                            )}

                                            {complaintsInfo.rbs && (
                                                <p>
                                                    <strong>RBS: </strong>
                                                    {complaintsInfo.rbs} mmol/L
                                                </p>
                                            )}

                                            {complaintsInfo.weight && (
                                                <p>
                                                    <strong>Weight: </strong>
                                                    {complaintsInfo.weight} kg
                                                </p>
                                            )}

                                            {complaintsInfo.height && (
                                                <p>
                                                    <strong>Height: </strong>
                                                    {complaintsInfo.height} cm
                                                </p>
                                            )}
                                        </div>
                                        <hr />
                                    </>
                                )}

                            {/* Examinations */}
                            {[
                                complaintsInfo.condition,
                                complaintsInfo.pallor,
                                complaintsInfo.chestExamination,
                                complaintsInfo.abdomenExamination,
                                complaintsInfo.vaginalInspection,
                                complaintsInfo.vaginalExamination,
                                complaintsInfo.extremities,
                                complaintsInfo.impression,
                                complaintsInfo.plan,
                                complaintsInfo.immediateIntervention,
                                complaintsInfo.admittingOfficer,


                            ].some(Boolean) && (
                                    <>
                                        <h2>General Examinations</h2>
                                        {complaintsInfo.condition && (
                                            <p><strong>Condition: </strong>{complaintsInfo.condition}</p>
                                        )}
                                        {complaintsInfo.pallor && (
                                            <p><strong>Pallor: </strong>{complaintsInfo.pallor}</p>
                                        )}
                                        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                                            <tbody>
                                                <tr>
                                                    {complaintsInfo.chestExamination && (
                                                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                            <p><strong>Chest Examination: </strong>{complaintsInfo.chestExamination}</p>
                                                        </td>

                                                    )}

                                                    {complaintsInfo.abdomenExamination && (
                                                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                            <p><strong>Abdominal Examination: </strong>{complaintsInfo.abdomenExamination}</p>
                                                        </td>

                                                    )}
                                                </tr>
                                                <tr>
                                                    {complaintsInfo.vaginalInspection && (
                                                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>

                                                            <p><strong>Vaginal Inspection: </strong>{complaintsInfo.vaginalInspection}</p>
                                                        </td>
                                                    )}
                                                    {complaintsInfo.vaginalExamination && (
                                                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>

                                                            <p><strong>Vaginal Examination: </strong>{complaintsInfo.vaginalExamination}</p>
                                                        </td>

                                                    )}
                                                </tr>
                                            </tbody>
                                        </table>


                                        {complaintsInfo.extremities && (
                                            <p><strong>Extremities: </strong>{complaintsInfo.extremities}</p>
                                        )}
                                        {complaintsInfo.impression && (
                                            <p><strong>Impression: </strong>{complaintsInfo.impression}</p>
                                        )}
                                        {complaintsInfo.plan && (
                                            <p><strong>Plan: </strong>{complaintsInfo.plan}</p>
                                        )}
                                        {complaintsInfo.immediateIntervention && (
                                            <p><strong>Immediate Intervention: </strong>{complaintsInfo.immediateIntervention}</p>
                                        )}
                                        <hr />
                                        {complaintsInfo.admittingOfficer && (
                                            <p><strong>Admitting Officer: </strong>{complaintsInfo.admittingOfficer}</p>
                                        )}

                                        {/* <div style={{ marginTop: "20px", fontWeight: "bold" }}>
                                            Admitting Officer: {complaintsInfo.admittingOfficer}
                                        </div> */}
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
