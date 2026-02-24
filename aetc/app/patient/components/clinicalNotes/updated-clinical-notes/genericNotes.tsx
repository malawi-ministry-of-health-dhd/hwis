import React from "react";
import { Box, Typography } from "@mui/material";
import { getHumanReadableDateTime } from "@/helpers/dateTime";
import { config } from "winston";

interface Name {
    name: string;
    [key: string]: any;
}

interface Observation {
    obs_id: number;
    names: Name[];
    value: string;
    children?: Observation[];
    created_by?: string;
    obs_datetime?: string;
}

interface GenericNotesProps {
    data: Observation[];
    title: string;
    config: {
        rootConcept: string | string[];
        fields: {
            conceptName: string;
            displayName: string;
            format?: (value: string) => string;
            style?: React.CSSProperties;
        }[];
        groupBy?: string;
        itemRenderer?: (item: any) => React.ReactNode;
    };
}

// Helper function to format dates consistently as DD/MM/YYYY HH:MM
const formatDateTime = (dateString: string): string => {
    if (!dateString) return dateString;

    try {
        let date: Date;

        // Handle "16/12/2025, 00:00:00" format
        if (dateString.includes('/') && dateString.includes(',')) {
            const parts = dateString.split(',');
            const [day, month, year] = parts[0].trim().split('/');
            const timePart = parts[1]?.trim() || '00:00:00';
            const [hours, minutes] = timePart.split(':');
            date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
        }
        // Handle ISO format "2025-12-16T10:54:10.000+02:00"
        else if (dateString.includes('T')) {
            date = new Date(dateString);
        }
        // Handle "2025-12-16 00:00:00 +0200" format
        else if (dateString.includes('-') && dateString.includes(' ')) {
            date = new Date(dateString);
        }
        else {
            return dateString;
        }

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return dateString;
        }

        // Format to DD/MM/YYYY HH:MM
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
        return dateString;
    }
};

export const GenericNotes: React.FC<GenericNotesProps> = ({
    data,
    title,
    config
}) => {
    // Check if data is empty
    const hasNoData = !data || !Array.isArray(data) || data.length === 0;

    if (hasNoData && !title) {
        return null;
    }

    if (hasNoData && title) {
        return (
            <div style={{ marginBottom: "12px", fontFamily: "Arial, sans-serif", lineHeight: 1.6 }}>
                <h4 style={{ fontWeight: "bold", marginBottom: "4px" }}>{title}</h4>
                <div style={{ marginLeft: "20px", color: "#999", fontStyle: "italic" }}>
                    Notes not entered
                </div>
            </div>
        );
    }

    const renderTimestamp = (panelData: Observation[]) => {
        if (!panelData?.[0]?.created_by) return null;

        return (
            <div style={{
                color: "#7f8c8d",
                fontSize: "14px",
                letterSpacing: "0.2px",
                marginTop: "8px",
                fontStyle: 'italic'
            }}>
                ~ {panelData[0].created_by} - {getHumanReadableDateTime(panelData[0].obs_datetime || new Date())}
            </div>
        );
    };

    const isRootConcept = (obs: Observation): boolean => {
        if (Array.isArray(config.rootConcept)) {
            return config.rootConcept.some(concept => obs.names[0]?.name === concept);
        }
        return obs.names[0]?.name === config.rootConcept;
    };

    const extractNotesData = () => {
        const notes: any[] = [];

        data.forEach(obs => {
            if (isRootConcept(obs) && obs.value) {
                const note: any = {
                    ...obs,
                    timestamp: obs.obs_datetime || "",
                    created_by: obs.created_by,
                    rootValue: obs.value
                };

                // Extract all configured fields from children
                config.fields.forEach(field => {
                    const child = obs.children?.find(c =>
                        c.names[0]?.name === field.conceptName
                    );
                    if (child) {
                        note[field.conceptName] = field.format
                            ? field.format(child.value)
                            : child.value;
                    }
                });

                notes.push(note);
            }
        });

        return notes;
    };

    const notesData = extractNotesData();

    if (notesData.length === 0) {
        return (
            <div style={{ marginBottom: "12px", fontFamily: "Arial, sans-serif", lineHeight: 1.6 }}>
                {title && <h4 style={{ fontWeight: "bold", marginBottom: "4px" }}>{title}</h4>}
                <div style={{ marginLeft: "20px", color: "#999", fontStyle: "italic" }}>
                    Notes not entered
                </div>
            </div>
        );
    }

    // Group by timestamp or specified field
    const groupKey = config.groupBy || 'timestamp';
    const groupedData = notesData.reduce((groups, note) => {
        const key = note[groupKey]?.split?.('T')[0] || note[groupKey] || 'unknown';
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(note);
        return groups;
    }, {} as Record<string, any[]>);

    const defaultItemRenderer = (item: any) => (
        <div style={{ marginBottom: "6px" }}>
            {item.rootValue && (
                <div style={{ fontWeight: "100", marginBottom: "2px" }}>
                    - {formatDateTime(item.rootValue)}
                </div>
            )}
            <div style={{ paddingLeft: "16px" }}>
                {config.fields.map(
                    (field, fieldIndex) =>
                        item[field.conceptName] && (
                            <div
                                key={fieldIndex}
                                style={{
                                    marginBottom: "2px",
                                    ...(field.style || {}),
                                }}
                            >
                                - {field.displayName}: {item[field.conceptName]}
                            </div>
                        )
                )}
            </div>
        </div>
    );

    const renderItem = config.itemRenderer || defaultItemRenderer;

    return (
        <div style={{ marginBottom: "12px", fontFamily: "Arial, sans-serif", lineHeight: 1.6 }}>
            <h4 style={{ fontWeight: "bold", marginBottom: "4px" }}>{title}</h4>

            <div style={{ marginLeft: "20px" }}>
                {Object.entries(groupedData).map(([date, dateNotes]) => (
                    <div key={date} style={{ marginBottom: "8px" }}>
                        {(dateNotes as any[]).map((note, index) => (
                            <div key={index} style={{ marginBottom: "6px" }}>
                                {renderItem(note)}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {renderTimestamp(data)}
        </div>
    );
};

// Configuration presets for different clinical components
export const NotesConfig = {

    // Vitals Configuration
    VITALS: {
        rootConcept: "Triage Result",
        fields: [
            {
                conceptName: "Blood oxygen saturation",
                displayName: "O2 Sat",
                format: (value: any) => `${value}%`
            },
            {
                conceptName: "Pulse",
                displayName: "Pulse",
                format: (value: any) => `${value} bpm`
            },
            {
                conceptName: "Systolic blood pressure",
                displayName: "Systolic BP",
                format: (value: any) => `${value} mmHg`
            },
            {
                conceptName: "Diastolic blood pressure",
                displayName: "Diastolic BP",
                format: (value: any) => `${value} mmHg`
            },
            {
                conceptName: "Respiratory rate",
                displayName: "Respiratory Rate",
                format: (value: any) => `${value} bpm`
            },
            {
                conceptName: "Temperature (c)",
                displayName: "Temperature",
                format: (value: any) => `${value} Â°C`
            },
            {
                conceptName: "Serum glucose",
                displayName: "Blood Glucose"
            },
            {
                conceptName: "Urine Dipstick Ketones",
                displayName: "Urine Dipstick-Ketones"
            },
            {
                conceptName: "AVPU",
                displayName: "AVPU Scale"
            },
            {
                conceptName: "Peak Expiratory Flow Rate",
                displayName: "PEFR",
                format: (value: any) => `${value} L/min`
            },
        ],
    },

    // Procedures Done Configuration
    PROCEDURES_DONE: {
        rootConcept: [
            "Circulation Interventions",
            "Breathing Interventions",
            "Airway opening interventions",
            "Exposure interventions",
            "Disability interventions"
        ],
        fields: [],
        itemRenderer: (item: any) => {
            const categoryName = item.names?.[0]?.name || "";
            const displayCategory = categoryName
                .replace(" interventions", "")
                .replace(" opening", "")
                .replace("Airway", "Airway Intervention")
                .replace("Breathing", "Breathing Intervention")
                .replace("Circulation", "Circulation Intervention")
                .replace("Disability", "Disability Intervention")
                .replace("Exposure", "Exposure Intervention");

            return (
                <div style={{ marginBottom: "8px" }}>
                    <div style={{ marginBottom: "4px" }}>
                        - {displayCategory}
                    </div>
                    <div style={{ paddingLeft: "16px" }}>
                        {item.children?.map((child: any, index: number) => (
                            <div key={index} style={{ marginBottom: "2px" }}>
                                - {child.names?.[0]?.name}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
    },

    // Allergies Configuration
    ALLERGIES: {
        rootConcept: "Allergen Category",
        fields: [],
        itemRenderer: (item: any) => {
            // item.rootValue contains the category name (e.g., "Food Allergy", "Medication Allergy")
            const categoryName = item.rootValue;

            if (
                typeof categoryName === "string" &&
                categoryName.toLowerCase().includes("no known allergies")
            ) {
                return (
                    <div style={{ marginBottom: "8px" }}>
                        <div style={{ fontWeight: "100" }}>
                            {categoryName}
                        </div>
                    </div>
                );
            }

            // Get all allergens and their details from children
            const allergens: any[] = [];
            let allergyDetails = "";
            
            item.children?.forEach((child: any) => {
                const conceptName = child.names?.[0]?.name;
                
                // Handle regular allergens and "Other" allergens
                if (conceptName === "Allergen" || 
                    conceptName === "Other Food Allergy" ||
                    conceptName === "Other Medication Allergy" ||
                    conceptName === "Other Medical Substance Allergy" ||
                    conceptName === "Other Substance Allergy") {
                    allergens.push(child.value);
                } else if (conceptName === "Description") {
                    allergyDetails = child.value;
                }
            });
            
            if (allergens.length === 0 && !allergyDetails) {
                return null;
            }
            
            return (
                <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                        {categoryName}
                    </div>
                    <div style={{ paddingLeft: "16px" }}>
                        {allergens.map((allergen, index) => (
                            <div key={index} style={{ marginBottom: "2px" }}>
                                - {allergen}
                            </div>
                        ))}
                        {allergyDetails && (
                            <div style={{ 
                                marginTop: "4px", 
                                fontStyle: "italic", 
                                color: "#555" 
                            }}>
                                Notes: {allergyDetails}
                            </div>
                        )}
                    </div>
                </div>
            );
        }
    },

    // UPDATED: Medications Configuration - Now displays free text
    MEDICATIONS: {
        rootConcept: "Description",
        fields: [],
        itemRenderer: (item: any) => {
            return (
                <div style={{ marginBottom: "8px" }}>
                    <div style={{
                        fontWeight: "100",
                        marginBottom: "4px",
                        whiteSpace: "pre-wrap"
                    }}>
                        {item.rootValue}
                    </div>
                </div>
            );
        }
    },

    // Diagnosis Configuration
    DIAGNOSIS: {
        rootConcept: "Diagnosis date",
        fields: [
            {
                conceptName: "ICD11 Diagnosis",
                displayName: "Diagnosis",
                format: (value: any) => {
                    const parts = value.split(',');
                    return parts.length > 1 ? `${parts[1].trim()} (${parts[0].trim()})` : value;
                }
            },
            { conceptName: "On treatment", displayName: "On Treatment" },
            {
                conceptName: "Additional Diagnosis Details",
                displayName: "Details",
            }
        ]
    },

    // UPDATED: Surgical History Configuration - Now displays free text
    SURGICAL_HISTORY: {
        rootConcept: "Surgical Procedure",
        fields: [],
        itemRenderer: (item: any) => {
            return (
                <div style={{ marginBottom: "8px" }}>
                    <div style={{
                        fontWeight: "100",
                        marginBottom: "4px",
                        whiteSpace: "pre-wrap"
                    }}>
                        {item.rootValue}
                    </div>
                </div>
            );
        }
    },

    // UPDATED: Previous Admissions Configuration - Now displays free text
    ADMISSIONS: {
        rootConcept: "Admission date",
        fields: [],
        itemRenderer: (item: any) => {
            return (
                <div style={{ marginBottom: "8px" }}>
                    <div style={{
                        fontWeight: "100",
                        marginBottom: "4px",
                        whiteSpace: "pre-wrap"
                    }}>
                        {item.rootValue}
                    </div>
                </div>
            );
        }
    },

    // Last Meal Configuration
    LAST_MEAL: {
        rootConcept: "Time of last meal",
        fields: [
            {
                conceptName: "Description of last meal",
                displayName: "Meal Description",
            }
        ]
    },

    // Presenting Complaints Configuration
    PRESENTING_COMPLAINTS: {
        rootConcept: ["Presenting Complaints", "Current complaints or symptoms"],
        fields: [
            {
                conceptName: "Duration Of Symptoms Days",
                displayName: "Duration (days)"
            },
            {
                conceptName: "Duration Of Symptoms Hours",
                displayName: "Duration (hours)"
            },
            {
                conceptName: "Duration Of Symptoms Weeks",
                displayName: "Duration (weeks)"
            },
            {
                conceptName: "Duration Of Symptoms Months",
                displayName: "Duration (months)"
            },
            {
                conceptName: "Duration Of Symptoms Years",
                displayName: "Duration (years)"
            }
        ]
    },

    // NEW: History of Presenting Complaints Configuration
    HISTORY_OF_PRESENTING_COMPLAINTS: {
        rootConcept: "Presenting history",
        fields: [],
        itemRenderer: (item: any) => {
            // The value is stored in the first child's value
            const historyText = item.children?.[0]?.value || item.rootValue;
            return (
                <div style={{ marginBottom: "8px" }}>
                    <div style={{
                        fontWeight: "100",
                        marginBottom: "4px",
                        whiteSpace: "pre-wrap"
                    }}>
                        {historyText}
                    </div>
                </div>
            );
        }
    },

    // UPDATED: Trauma/Injury History Configuration
    TRAUMA_HISTORY: {
        rootConcept: "Review of systems, trauma",
        fields: [],
        itemRenderer: (item: any) => {
            if (
                typeof item.rootValue === "string" &&
                item.rootValue.toLowerCase().includes("not injured")
            ) {
                return (
                    <div style={{ marginBottom: "8px" }}>
                        <div style={{ fontWeight: "100" }}>
                            {item.rootValue}
                        </div>
                    </div>
                );
            }

            const mechanisms: any = {};
            const details: any = {};

            item.children?.forEach((child: any) => {
                const conceptName = child.names?.[0]?.name;
                const value = child.value;

                // Map mechanism concepts - store the actual values
                if (conceptName === "Assault") {
                    mechanisms.assault = value;
                }
                if (conceptName === "Road Traffic Accident" || conceptName === "Road Traffic Accidents, RTA") {
                    mechanisms.roadTraffic = value;
                }
                if (conceptName === "Fall") {
                    mechanisms.fall = value;
                }
                if (conceptName === "Bite") {
                    mechanisms.bite = value;
                }
                if (conceptName === "Gunshot") {
                    mechanisms.gunshot = value;
                }
                if (conceptName === "Building Collapse") {
                    mechanisms.collapse = value;
                }
                if (conceptName === "Self Harm") {
                    mechanisms.selfInflicted = value;
                }
                if (conceptName === "Burn Injury") {
                    mechanisms.burns = value;
                }
                if (conceptName === "Drowning") {
                    mechanisms.drowning = value;
                }
                if (conceptName === "Other") {
                    mechanisms.other = value;
                }

                // Map assault type
                if (conceptName === "Sexual Assault" && value === "true") {
                    details.assaultType = "Sexual";
                }
                if (conceptName === "Physical Assault" && value === "true") {
                    details.assaultType = "Physical";
                }

                // Map other details with date formatting
                if (conceptName === "Time Of Injury") {
                    details.timeOfInjury = formatDateTime(value);
                }
                // Handle both "Loss Of Consciousness" and "Fainting" concept names
                if (conceptName === "Loss Of Consciousness" || conceptName === "Fainting") {
                    details.lostConsciousness = value;
                    details.hasLostConsciousnessField = true;
                }
                if (conceptName === "Occupational Injury") {
                    details.occupationalInjury = value;
                    details.hasOccupationalInjuryField = true;
                }
            });

            // Set default "No" for fields that weren't found
            if (!details.hasLostConsciousnessField) {
                details.lostConsciousness = "No";
            }
            if (!details.hasOccupationalInjuryField) {
                details.occupationalInjury = "No";
            }

            // Check if there are any mechanisms to display (value exists and is not "false")
            const hasMechanisms = Object.values(mechanisms).some(val => val && val !== "" && val !== "false");

            if (!hasMechanisms && !details.timeOfInjury && !details.lostConsciousness && !details.occupationalInjury) {
                return null;
            }

            return (
                <div style={{ marginBottom: "12px" }}>
                    {hasMechanisms && (
                        <>
                            <div style={{ fontWeight: "500", marginBottom: "6px" }}>
                                Mechanism of Injury:
                            </div>
                            <div style={{ paddingLeft: "16px" }}>
                                {Object.entries(mechanisms).map(([key, value], index) => {
                                    if (!value || value === "false") return null;

                                    const labels: any = {
                                        assault: "Assault",
                                        roadTraffic: "Road Traffic Accident",
                                        fall: "Fall",
                                        bite: "Bite",
                                        gunshot: "Gunshot",
                                        collapse: "Building Collapse",
                                        selfInflicted: "Self-Inflicted",
                                        burns: "Burns",
                                        drowning: "Drowning",
                                        other: "Other"
                                    };

                                    return (
                                        <div key={index} style={{ marginBottom: "8px" }}>
                                            <div style={{ fontWeight: "100" }}>- {labels[key]}</div>
                                            {value !== "true" && value !== "" && (
                                                <div style={{
                                                    paddingLeft: "16px",
                                                    fontStyle: "italic",
                                                    color: "#555",
                                                    whiteSpace: "pre-wrap",
                                                    marginTop: "2px"
                                                }}>
                                                    {String(value)}
                                                </div>
                                            )}
                                            {key === "assault" && details.assaultType && (
                                                <div style={{
                                                    paddingLeft: "16px",
                                                    fontStyle: "italic",
                                                    color: "#555",
                                                    marginTop: "2px"
                                                }}>
                                                    Type: {details.assaultType}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {details.timeOfInjury && (
                        <div style={{ marginTop: "6px" }}>
                            <div style={{ fontWeight: "100" }}>
                                - Time of Injury: {details.timeOfInjury}
                            </div>
                        </div>
                    )}

                    {details.lostConsciousness && (
                        <div style={{ marginTop: "2px" }}>
                            <div style={{ fontWeight: "100" }}>
                                - Lost Consciousness: {details.lostConsciousness}
                            </div>
                        </div>
                    )}

                    {details.occupationalInjury && (
                        <div style={{ marginTop: "2px" }}>
                            <div style={{ fontWeight: "100" }}>
                                - Occupational Injury: {details.occupationalInjury}
                            </div>
                        </div>
                    )}
                </div>
            );
        }
    }
}
