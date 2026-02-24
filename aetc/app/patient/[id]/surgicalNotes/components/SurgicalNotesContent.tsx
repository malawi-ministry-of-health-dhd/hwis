// components/surgicalNotes/SurgicalNotesContent.tsx
import React, { useEffect, useState } from "react";
import { PatientInfoTab } from "@/components";
import { LabOrderTable } from "@/app/patient/components/panels/labOrderTable";
import { BedsideResults } from "@/app/patient/components/panels/bedsideResults";
import { LabResultsTable } from "@/app/patient/components/panels/labResults";
import { PrescribedMedicationList } from "../../nursingChart/components/prescribedMedicationList";
import { Results } from "@/app/patient/components/panels";
import { getPatientsEncounters } from "@/hooks/encounter";
import { useParameters } from "@/hooks";
import { encounters } from "@/constants";

interface Props {
    presentingInfo: {
        complaints: Array<{ complaint: string, duration: string }>; // Change this line
        history: string;
        surgicalHistory: string;
        surgicalProcedure: string;
        familyHistory: string[];
        allergies: string;
        differentialDiagnosis: string;
        notes: string;
        smoking: {
            status: string;
            duration: string;
        };
        alcoholIntake: string;
        recreationalDrugs: string;
    };
    pastMedicalHistory: Array<{
        condition: string;
        onTreatment: string;
        medication: string;
        medicationDose: string;
        reasonForRequest: string;
        medicationDuration: string;
    }>;
    reviewOfSystems: {
        general: string[];
        ent: string[];
        endocrine: string[];
        cardiac: string[];
        respiratory: string[];
        gastrointestinal: string[];
        genitourinary: string[];
        musculoskeletal: string[];
        neurologic: string[];
        psychiatric: string[];
    };
    physicalExam: {
        generalCondition: string;
        temperature: string;
        pulseRate: string;
        bloodPressure: string;
        respiratoryRate: string;
        eyes: string;
        mouth: string;
        neck: string;
        chest: string;
        endocrine: string;
        abdominal: string;
        motorResponse: string;
        verbalResponse: string;
        eyeResponse: string;
        cranialNerves: string;
        grossMotor: string;
        sensation: string;
        pulsations: string;
        rectalExamination: string;
        extremities: string;
    };
    clerkInfo: {
        clerkName: string;
        designation: string;
        signature: string;
        additionalNotes: string;
    };
    admittingOfficer: string;
    completedDateTime: string;

    // Add gynae history prop
    gynaeHistory: {
        isPregnant: string;
        lnmp: string;
        gestationalAge: string;
        parity: string;
    };

    setRow?: (row: any) => void;
    showPatientInfo?: boolean; // Optional prop to control PatientInfoTab display
}

export const SurgicalNotesContent: React.FC<Props> = ({
    presentingInfo,
    pastMedicalHistory,
    reviewOfSystems,
    physicalExam,
    clerkInfo,
    admittingOfficer,
    completedDateTime,
    gynaeHistory,
    setRow,
    showPatientInfo = false
}) => {
    // State for bedside results
    const [bedsideResults, setBedsideResults] = useState<any[]>([]);
    const { params } = useParameters();
    const patientId = params.id as string;

    // Fetch bedside results
    const { data: BedSideResults, isLoading: bedsideLoading } = getPatientsEncounters(
        patientId,
        `encounter_type=${encounters.BED_SIDE_TEST}`
    );

    useEffect(() => {
        if (!bedsideLoading && BedSideResults) {
            setBedsideResults(BedSideResults?.[0]?.obs ?? []);
        }
    }, [BedSideResults, bedsideLoading]);

    const isEmpty = [
        ...presentingInfo.complaints,
        presentingInfo.history,
        presentingInfo.surgicalHistory,
        presentingInfo.surgicalProcedure,
        ...presentingInfo.familyHistory,
        presentingInfo.allergies,
        presentingInfo.differentialDiagnosis,
        presentingInfo.notes,
        presentingInfo.smoking.status,
        presentingInfo.smoking.duration,
        presentingInfo.alcoholIntake,
        presentingInfo.recreationalDrugs,
        ...pastMedicalHistory,
        ...Object.values(reviewOfSystems).flat(),
        ...Object.values(physicalExam),
        clerkInfo.additionalNotes,
        clerkInfo.clerkName,
        clerkInfo.designation,
        clerkInfo.signature
    ].every((val: any) => Array.isArray(val) ? val.length === 0 : typeof val === 'string' ? !val.trim() : false);

    if (isEmpty) {
        return (
            <>
                {showPatientInfo && <PatientInfoTab />}

                <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Surgical Notes</h1>
                <p style={{ fontStyle: "italic", color: "gray" }}>
                    Surgical Notes not recorded.
                </p>
            </>
        );
    }

    // Helper function to check if any gynae history data exists
    const hasGynaeHistory = () => {
        return gynaeHistory.isPregnant || gynaeHistory.lnmp || gynaeHistory.gestationalAge || gynaeHistory.parity;
    };

    // Helper function to check if any social history/review of systems data exists
    const hasSocialHistoryOrReviewOfSystems = () => {
        return presentingInfo.smoking.status ||
            presentingInfo.smoking.duration ||
            presentingInfo.alcoholIntake ||
            presentingInfo.recreationalDrugs ||
            Object.values(reviewOfSystems).some(system => system.length > 0);
    };

    // Helper function to check if any vital signs exist
    const hasVitalSigns = () => {
        return physicalExam.temperature ||
            physicalExam.pulseRate ||
            physicalExam.bloodPressure ||
            physicalExam.respiratoryRate;
    };

    // Helper function to check if any head/neck examination exists
    const hasHeadNeckExam = () => {
        return physicalExam.eyes || physicalExam.mouth || physicalExam.neck;
    };

    // Helper function to check if any system examinations exist
    const hasSystemExaminations = () => {
        return physicalExam.chest || physicalExam.endocrine || physicalExam.abdominal;
    };

    // Helper function to check if any GCS data exists
    const hasGCSData = () => {
        return physicalExam.motorResponse || physicalExam.verbalResponse || physicalExam.eyeResponse;
    };

    // Helper function to check if any additional examinations exist
    const hasAdditionalExaminations = () => {
        return physicalExam.cranialNerves ||
            physicalExam.grossMotor ||
            physicalExam.sensation ||
            physicalExam.pulsations ||
            physicalExam.rectalExamination ||
            physicalExam.extremities;
    };

    // Helper function to check if any clerk info exists
    const hasClerkInfo = () => {
        return clerkInfo.additionalNotes || clerkInfo.clerkName || clerkInfo.designation || clerkInfo.signature;
    };

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
        <div>
            {showPatientInfo && <PatientInfoTab />}

            {(admittingOfficer || completedDateTime) && (
                <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
                        {admittingOfficer && (
                            <p style={{ margin: "5px 0" }}>
                                <strong>Admitting Officer: </strong>
                                {admittingOfficer}
                            </p>
                        )}
                        {completedDateTime && (
                            <p style={{ margin: "5px 0" }}>
                                <strong>Date & Time Completed: </strong>
                                {formatDateTime(completedDateTime)}
                            </p>
                        )}
                    </div>
                </div>
            )}

            <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Surgical Notes</h1>

            {/* Presenting Complaints Section */}
            {(presentingInfo.complaints.length > 0 || presentingInfo.history) && (
                <>
                    {presentingInfo.complaints.length > 0 && (
                        <p><strong>Presenting Complaints:</strong> {
                            presentingInfo.complaints.map((item, index) =>
                                `(${index + 1}) ${item.complaint}${item.duration ? ` - Duration: ${item.duration}` : ''}`
                            ).join(", ")
                        }</p>
                    )}
                    {presentingInfo.history && (
                        <p><strong>History of Presenting Complaint:</strong> {presentingInfo.history}</p>
                    )}
                    <hr />
                </>
            )}

            {/* Past Medical History Section */}
            {pastMedicalHistory.length > 0 && (
                <>
                    <h2>Past Medical History</h2>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                        <thead>
                            <tr>
                                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Condition</th>
                                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>On Treatment</th>
                                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Medication</th>
                                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Medication Dose</th>
                                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Reason for Request</th>
                                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Medication Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pastMedicalHistory.map((history, index) => (
                                <tr key={index}>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{history.condition}</td>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{history.onTreatment}</td>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{history.medication}</td>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{history.medicationDose}</td>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{history.reasonForRequest}</td>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>{history.medicationDuration}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {/* Surgical History Section */}
            {(presentingInfo.surgicalHistory || presentingInfo.surgicalProcedure || presentingInfo.familyHistory.length > 0 || presentingInfo.allergies) && (
                <>
                    {presentingInfo.surgicalHistory && (
                        <p><strong>Surgical History:</strong> {presentingInfo.surgicalHistory}</p>
                    )}
                    {presentingInfo.surgicalProcedure && (
                        <p><strong>Surgical Procedure:</strong> {presentingInfo.surgicalProcedure}</p>
                    )}
                    {presentingInfo.familyHistory.length > 0 && (
                        <p><strong>Family History:</strong> {
                            presentingInfo.familyHistory.map((item, index) => `(${index + 1}) ${item}`).join(", ")
                        }</p>
                    )}
                    {presentingInfo.allergies && (
                        <p><strong>Allergies:</strong> {presentingInfo.allergies}</p>
                    )}
                    <hr />
                </>
            )}

            {/* Gynae History Section */}
            {hasGynaeHistory() && (
                <>
                    <h2>Gynae History</h2>
                    {gynaeHistory.isPregnant && (
                        <p><strong>Is Patient Pregnant:</strong> {gynaeHistory.isPregnant}</p>
                    )}
                    {gynaeHistory.lnmp && (
                        <p><strong>LNMP:</strong> {gynaeHistory.lnmp}</p>
                    )}
                    {gynaeHistory.gestationalAge && (
                        <p><strong>Gestational Age:</strong> {gynaeHistory.gestationalAge}</p>
                    )}
                    {gynaeHistory.parity && (
                        <p><strong>Parity:</strong> {gynaeHistory.parity}</p>
                    )}
                    <hr />
                </>
            )}

            {/* Social History & Review of Systems Section */}
            {hasSocialHistoryOrReviewOfSystems() && (
                <>
                    <h2>Social History & Review of Systems</h2>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                        <thead>
                            <tr>
                                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Social History</th>
                                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Review of Systems</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(presentingInfo.smoking.status || reviewOfSystems.general.length > 0) && (
                                <tr>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                        {presentingInfo.smoking.status && (
                                            <><strong>Smoking Status:</strong> {presentingInfo.smoking.status}</>
                                        )}
                                    </td>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                        {reviewOfSystems.general.length > 0 && (
                                            <><strong>General:</strong> {reviewOfSystems.general.map((item, index) => `(${index + 1}) ${item}`).join(", ")}</>
                                        )}
                                    </td>
                                </tr>
                            )}
                            {(presentingInfo.smoking.status === "Yes" && presentingInfo.smoking.duration) || reviewOfSystems.ent.length > 0 ? (
                                <tr>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                        {presentingInfo.smoking.status === "Yes" && presentingInfo.smoking.duration && (
                                            <><strong>Cigarettes per day:</strong> {presentingInfo.smoking.duration}</>
                                        )}
                                    </td>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                        {reviewOfSystems.ent.length > 0 && (
                                            <><strong>ENT:</strong> {reviewOfSystems.ent.map((item, index) => `(${index + 1}) ${item}`).join(", ")}</>
                                        )}
                                    </td>
                                </tr>
                            ) : null}
                            {(presentingInfo.alcoholIntake || reviewOfSystems.endocrine.length > 0) && (
                                <tr>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                        {presentingInfo.alcoholIntake && (
                                            <><strong>Alcohol Intake:</strong> {presentingInfo.alcoholIntake} units per day</>
                                        )}
                                    </td>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                        {reviewOfSystems.endocrine.length > 0 && (
                                            <><strong>Endocrine:</strong> {reviewOfSystems.endocrine.map((item, index) => `(${index + 1}) ${item}`).join(", ")}</>
                                        )}
                                    </td>
                                </tr>
                            )}
                            {(presentingInfo.recreationalDrugs || reviewOfSystems.cardiac.length > 0) && (
                                <tr>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                        {presentingInfo.recreationalDrugs && (
                                            <><strong>Recreational Drugs:</strong> {presentingInfo.recreationalDrugs}</>
                                        )}
                                    </td>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                        {reviewOfSystems.cardiac.length > 0 && (
                                            <><strong>Cardiac:</strong> {reviewOfSystems.cardiac.map((item, index) => `(${index + 1}) ${item}`).join(", ")}</>
                                        )}
                                    </td>
                                </tr>
                            )}
                            {reviewOfSystems.respiratory.length > 0 && (
                                <tr>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}></td>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                        <strong>Respiratory:</strong> {reviewOfSystems.respiratory.map((item, index) => `(${index + 1}) ${item}`).join(", ")}
                                    </td>
                                </tr>
                            )}
                            {reviewOfSystems.gastrointestinal.length > 0 && (
                                <tr>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}></td>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                        <strong>Gastrointestinal:</strong> {reviewOfSystems.gastrointestinal.map((item, index) => `(${index + 1}) ${item}`).join(", ")}
                                    </td>
                                </tr>
                            )}
                            {reviewOfSystems.genitourinary.length > 0 && (
                                <tr>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}></td>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                        <strong>Genitourinary:</strong> {reviewOfSystems.genitourinary.map((item, index) => `(${index + 1}) ${item}`).join(", ")}
                                    </td>
                                </tr>
                            )}
                            {reviewOfSystems.musculoskeletal.length > 0 && (
                                <tr>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}></td>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                        <strong>Musculoskeletal:</strong> {reviewOfSystems.musculoskeletal.map((item, index) => `(${index + 1}) ${item}`).join(", ")}
                                    </td>
                                </tr>
                            )}
                            {reviewOfSystems.neurologic.length > 0 && (
                                <tr>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}></td>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                        <strong>Neurologic:</strong> {reviewOfSystems.neurologic.map((item, index) => `(${index + 1}) ${item}`).join(", ")}
                                    </td>
                                </tr>
                            )}
                            {reviewOfSystems.psychiatric.length > 0 && (
                                <tr>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}></td>
                                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                        <strong>Psychiatric:</strong> {reviewOfSystems.psychiatric.map((item, index) => `(${index + 1}) ${item}`).join(", ")}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </>
            )}

            {/* Physical Examination Section */}
            {(physicalExam.generalCondition || hasVitalSigns() || hasHeadNeckExam() || hasSystemExaminations() || hasGCSData() || hasAdditionalExaminations()) && (
                <>
                    <h2>Physical Examination</h2>
                    {physicalExam.generalCondition && (
                        <p><strong>General Condition:</strong> {physicalExam.generalCondition}</p>
                    )}

                    {/* Vitals Section */}
                    {hasVitalSigns() && (
                        <>
                            <h3>Vitals</h3>
                            <div style={{ display: "flex", gap: "20px", marginBottom: "10px", flexWrap: "wrap" }}>
                                {physicalExam.temperature && (
                                    <p><strong>Temperature:</strong> {physicalExam.temperature}</p>
                                )}
                                {physicalExam.pulseRate && (
                                    <p><strong>Pulse Rate:</strong> {physicalExam.pulseRate} bpm</p>
                                )}
                                {physicalExam.bloodPressure && (
                                    <p><strong>Blood Pressure:</strong> {physicalExam.bloodPressure} mmHg</p>
                                )}
                                {physicalExam.respiratoryRate && (
                                    <p><strong>Respiratory Rate:</strong> {physicalExam.respiratoryRate} breaths/min</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Head and Neck Examination */}
                    {hasHeadNeckExam() && (
                        <div style={{ display: "flex", gap: "20px", marginBottom: "10px", flexWrap: "wrap" }}>
                            {physicalExam.eyes && (
                                <p><strong>Eyes:</strong> {physicalExam.eyes}</p>
                            )}
                            {physicalExam.mouth && (
                                <p><strong>Mouth:</strong> {physicalExam.mouth}</p>
                            )}
                            {physicalExam.neck && (
                                <p><strong>Neck:</strong> {physicalExam.neck}</p>
                            )}
                        </div>
                    )}

                    {/* System Examinations */}
                    {hasSystemExaminations() && (
                        <>
                            {physicalExam.chest && (
                                <p><strong>Chest Examination:</strong> {physicalExam.chest}</p>
                            )}
                            {physicalExam.endocrine && (
                                <p><strong>Endocrine Examination:</strong> {physicalExam.endocrine}</p>
                            )}
                            {physicalExam.abdominal && (
                                <p><strong>Abdominal Examination:</strong> {physicalExam.abdominal}</p>
                            )}
                        </>
                    )}

                    <hr />

                    {/* Glasgow Coma Scale */}
                    {hasGCSData() && (
                        <>
                            <h3>Glasgow Coma Scale (GCS)</h3>
                            {physicalExam.motorResponse && (
                                <p><strong>Motor Response:</strong> {physicalExam.motorResponse}</p>
                            )}
                            {physicalExam.verbalResponse && (
                                <p><strong>Verbal Response:</strong> {physicalExam.verbalResponse}</p>
                            )}
                            {physicalExam.eyeResponse && (
                                <p><strong>Eye Response:</strong> {physicalExam.eyeResponse}</p>
                            )}
                            <hr />
                        </>
                    )}

                    {/* Additional Examinations */}
                    {hasAdditionalExaminations() && (
                        <>
                            <h3>Additional Examinations & Extremities</h3>
                            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                                <thead>
                                    <tr>
                                        <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Additional Examinations</th>
                                        <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Extremities</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(physicalExam.cranialNerves || physicalExam.pulsations) && (
                                        <tr>
                                            <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                {physicalExam.cranialNerves && (
                                                    <><strong>Cranial Nerves:</strong> {physicalExam.cranialNerves}</>
                                                )}
                                            </td>
                                            <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                {physicalExam.pulsations && (
                                                    <><strong>Pulsations:</strong> {physicalExam.pulsations}</>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                    {(physicalExam.grossMotor || physicalExam.rectalExamination) && (
                                        <tr>
                                            <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                {physicalExam.grossMotor && (
                                                    <><strong>Gross Motor:</strong> {physicalExam.grossMotor}</>
                                                )}
                                            </td>
                                            <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                {physicalExam.rectalExamination && (
                                                    <><strong>Rectal Examination:</strong> {physicalExam.rectalExamination}</>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                    {(physicalExam.sensation || physicalExam.extremities) && (
                                        <tr>
                                            <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                {physicalExam.sensation && (
                                                    <><strong>Sensation:</strong> {physicalExam.sensation}</>
                                                )}
                                            </td>
                                            <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                                {physicalExam.extremities && (
                                                    <><strong>Extremities:</strong> {physicalExam.extremities}</>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </>
                    )}
                </>
            )}

            {/* Differential Diagnosis */}
            {presentingInfo.differentialDiagnosis && (
                <>
                    <hr />
                    <p><strong>Working Differential Diagnosis:</strong> {presentingInfo.differentialDiagnosis}</p>
                </>
            )}

            {/* Investigations Section - Always show as it contains dynamic components */}
            <hr />
            <h2>Investigations</h2>
            <h3>Bedside Results</h3>
            <BedsideResults data={bedsideResults} />
            <h3>Lab Results</h3>
            <LabResultsTable rows={[]} />
            {presentingInfo.notes && (
                <>
                    <hr />
                    <p><strong>Additional Investigation Notes:</strong> {presentingInfo.notes}</p>
                </>
            )}

            {/* Medications Section - Always show as it contains dynamic components */}
            <hr />
            <h2>Medications</h2>
            <PrescribedMedicationList setRow={setRow} showPrintButton={false} />

            {/* Clerking Details */}
            {hasClerkInfo() && (
                <>
                    <hr />
                    <h2>Clerking Details</h2>
                    {clerkInfo.additionalNotes && (
                        <p><strong>Additional Notes:</strong> {clerkInfo.additionalNotes}</p>
                    )}
                    <div style={{ display: "flex", gap: "20px", marginBottom: "10px", flexWrap: "wrap" }}>
                        {clerkInfo.clerkName && (
                            <p><strong>Clerk Name:</strong> {clerkInfo.clerkName}</p>
                        )}
                        {clerkInfo.designation && (
                            <p><strong>Designation:</strong> {clerkInfo.designation}</p>
                        )}
                        {clerkInfo.signature && (
                            <p><strong>Signature:</strong> {clerkInfo.signature}</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
