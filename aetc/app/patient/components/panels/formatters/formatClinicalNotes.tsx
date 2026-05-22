// utils/formatNotesData.tsx
import { encounters } from "@/constants";
import { Box } from "@mui/material";
import {
  formatPresentingComplaints,
  formatVitals,
  formatSoapierNotes,
  formatPrimarySurvey,
  formatSecondarySurvey,
  formatPatientManagamentPlan,
  formatDiagnosisNotes,
  formatInvestigationPlans,
  formatRadiologyInvestigationPlans,
  formatDisposition,
} from ".";
import {
  NotesConfig,
  GenericNotes,
} from "../../clinicalNotes/updated-clinical-notes/genericNotes";
import ResultsTable from "../tabularDisplayInformation";
import { ContinuationNotes } from "../continuationNotes";
import { MonitoringCharts } from "@/app/patient/components/clinicalNotes/monitoringCharts";

type NotesChild = {
  item: string | { [key: string]: string } | null | undefined;
  bold?: boolean;
  children?: NotesChild | NotesChild[] | null | undefined;
};

const RenderNotesChildren: React.FC<{
  children?: NotesChild | NotesChild[] | null | undefined;
  level?: number;
}> = ({ children, level = 1 }) => {
  const normalizedChildren: NotesChild[] = Array.isArray(children)
    ? children
    : children
      ? [children]
      : [];

  if (!normalizedChildren.length) return null;

  return (
    <div style={{ paddingLeft: `${level * 12}px` }}>
      {normalizedChildren.map((child, index) => {
        let itemText: React.ReactNode = null;

        if (typeof child?.item === "string") {
          itemText = child.bold ? <strong>{child.item}</strong> : child.item;
        } else if (child?.item && typeof child.item === "object") {
          itemText = (
            <>
              {Object.entries(child.item).map(([key, value], i, arr) => (
                <span key={i}>
                  {child.bold ? <strong>{key}</strong> : key}: {value}
                  {i < arr.length - 1 && ", "}
                </span>
              ))}
            </>
          );
        }

        return (
          <div key={index} style={{ marginBottom: "4px" }}>
            {itemText && <div>- {itemText}</div>}
            {child?.children && (
              <RenderNotesChildren children={child.children} level={level + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const hasValueMatch = (obs: any[], needle: string): boolean => {
  if (!Array.isArray(obs) || !needle) return false;
  const target = needle.toLowerCase();
  const stack = [...obs];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const value = String(current.value ?? "").toLowerCase();
    if (value.includes(target)) return true;
    if (Array.isArray(current.children)) {
      stack.push(...current.children);
    }
  }
  return false;
};

export const formatClinicalNotesData = (
  getEncountersByType: (type: string) => any[],
  getAllObservationsByType?: (type: string) => any[]
) => {
  const getInvestigationObservationsByType = (type: string) =>
    typeof getAllObservationsByType === "function"
      ? getAllObservationsByType(type)
      : getEncountersByType(type);

  const primarySurveyData = formatPrimarySurvey({
    airwayObs: getEncountersByType(encounters.AIRWAY_ASSESSMENT),
    breathingObs: getEncountersByType(encounters.BREATHING_ASSESSMENT),
    circulationObs: getEncountersByType(encounters.CIRCULATION_ASSESSMENT),
    disabilityObs: getEncountersByType(encounters.PRIMARY_DISABILITY_ASSESSMENT),
    exposureObs: getEncountersByType(encounters.EXPOSURE_ASSESSMENT),
  });
  const secondarySurveyData = formatSecondarySurvey({
    generalInformationObs: getEncountersByType(
      encounters.GENERAL_INFORMATION_ASSESSMENT
    ),
    headAndNeckObs: getEncountersByType(
      encounters.HEAD_AND_NECK_ASSESSMENT
    ),
    chestObs: getEncountersByType(encounters.CHEST_ASSESSMENT),
    abdomenAndPelvisObs: getEncountersByType(
      encounters.ABDOMEN_AND_PELVIS_ASSESSMENT
    ),
    extremitiesObs: getEncountersByType(encounters.EXTREMITIES_ASSESSMENT),
    neurologicalObs: getEncountersByType(
      encounters.NEUROLOGICAL_EXAMINATION_ASSESSMENT
    ),
  });

  return [

    {
      title: "Soapier Notes",
      content: formatSoapierNotes(
        getEncountersByType(encounters.NURSING_CARE_NOTES)
      ),
    },
    {
      title: "Monitoring Charts",
      content: <MonitoringCharts />,
    },

    {
      title: "Primary Survey",
      content: (
        <Box>
          <style>
            {`
              .primary-survey-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
                width: 100%;
              }

              .primary-survey-item {
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                padding: 10px;
                background-color: #fafafa;
                min-height: 100px;
                display: flex;
                flex-direction: column;
              }

              .primary-survey-title {
                font-weight: bold;
                margin-bottom: 6px;
                margin-top: 0;
                font-size: 0.9rem;
                border-bottom: 1px solid #ddd;
                padding-bottom: 4px;
              }

              .primary-survey-content {
                padding-left: 8px;
                font-size: 0.85rem;
                flex-grow: 1;
              }

              .primary-survey-empty {
                color: #999;
                font-style: italic;
                font-size: 0.8rem;
              }

              @media print {
                .primary-survey-grid {
                  gap: 8px;
                }

                .primary-survey-item {
                  padding: 6px;
                  min-height: auto;
                  page-break-inside: avoid;
                  break-inside: avoid;
                }

                .primary-survey-title {
                  font-size: 0.8rem;
                  margin-bottom: 4px;
                }

                .primary-survey-content {
                  font-size: 0.75rem;
                  padding-left: 4px;
                }
              }
            `}
          </style>

          <div className="primary-survey-grid">
            {primarySurveyData.map((section, index) => {
              const hasContent =
                Array.isArray(section?.children)
                  ? section.children.length > 0
                  : Boolean(section?.children);

              return (
                <div key={index} className="primary-survey-item">
                  <h4 className="primary-survey-title">
                    {section.heading ?? "Untitled"}
                  </h4>
                  <div className="primary-survey-content">
                    {hasContent ? (
                      <RenderNotesChildren children={section.children as NotesChild[]} />
                    ) : (
                      <div className="primary-survey-empty">Notes not entered</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Box>
      ),
    },
    {
      title: "Sample History",
      content: (
        <Box>
          <style>
            {`
              .sample-history-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
                width: 100%;
              }

              .sample-history-item {
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                padding: 10px;
                background-color: #fafafa;
                min-height: 100px;
                display: flex;
                flex-direction: column;
              }

              .sample-history-title {
                font-weight: bold;
                margin-bottom: 6px;
                margin-top: 0;
                font-size: 0.9rem;
                border-bottom: 1px solid #ddd;
                padding-bottom: 4px;
              }

              .sample-history-content {
                padding-left: 8px;
                font-size: 0.85rem;
                flex-grow: 1;
              }

              .sample-history-empty {
                color: #999;
                font-style: italic;
                font-size: 0.8rem;
              }

              @media print {
                .sample-history-grid {
                  gap: 8px;
                }

                .sample-history-item {
                  padding: 6px;
                  min-height: auto;
                  page-break-inside: avoid;
                  break-inside: avoid;
                }

                .sample-history-title {
                  font-size: 0.8rem;
                  margin-bottom: 4px;
                }

                .sample-history-content {
                  font-size: 0.75rem;
                  padding-left: 4px;
                }
              }
            `}
          </style>

          <div className="sample-history-grid">
            {/* Row 1, Column 1: Symptoms - Presenting Complaints */}
            <div className="sample-history-item">
              <div className="sample-history-content">
                <GenericNotes
                  data={getEncountersByType(encounters.SAMPLE_HISTORY_PRESENTING_COMPLAINTS)}
                  title="Symptoms - Presenting Complaints"
                  config={NotesConfig.PRESENTING_COMPLAINTS}
                />
              </div>
            </div>

            {/* Row 1, Column 2: Events */}
            <div className="sample-history-item">
              <h4 className="sample-history-title">Events</h4>
              <div className="sample-history-content">
                {(() => {
                  const historyData = getEncountersByType(encounters.SUMMARY_ASSESSMENT);
                  const traumaData = getEncountersByType(encounters.REVIEW_OF_SYSTEMS);
                  const hasHistory = historyData && historyData.length > 0;
                  const hasTrauma = traumaData && traumaData.length > 0;

                  if (!hasHistory && !hasTrauma) {
                    return <div className="sample-history-empty">Notes not entered</div>;
                  }

                  return (
                    <>
                      <GenericNotes
                        data={historyData}
                        title="History of Presenting Complaints"
                        config={NotesConfig.HISTORY_OF_PRESENTING_COMPLAINTS}
                      />
                      <GenericNotes
                        data={traumaData}
                        title="Trauma/Injury History"
                        config={NotesConfig.TRAUMA_HISTORY}
                      />
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Row 1, Column 3: Allergies */}
            <div className="sample-history-item">
              <h4 className="sample-history-title">Allergies</h4>
              <div className="sample-history-content">
                {(() => {
                  const allergiesData = getEncountersByType(encounters.ALLERGIES);
                  const hasAllergies = allergiesData && allergiesData.length > 0;
                  const noKnownAllergies = hasValueMatch(
                    allergiesData,
                    "no known allergies"
                  );

                  if (noKnownAllergies) {
                    return (
                      <div className="sample-history-empty">
                        Patient has no known allergies
                      </div>
                    );
                  }

                  if (!hasAllergies) {
                    return <div className="sample-history-empty">Notes not entered</div>;
                  }

                  return (
                    <GenericNotes
                      data={allergiesData}
                      title=""
                      config={NotesConfig.ALLERGIES}
                    />
                  );
                })()}
              </div>
            </div>

            {/* Row 2, Column 1: Medications */}
            <div className="sample-history-item">
              <h4 className="sample-history-title">Medications</h4>
              <div className="sample-history-content">
                {(() => {
                  const medicationsData = getEncountersByType(encounters.SAMPLE_HISTORY_MEDICATION);
                  const hasMedications = medicationsData && medicationsData.length > 0;

                  if (!hasMedications) {
                    return <div className="sample-history-empty">Notes not entered</div>;
                  }

                  return (
                    <GenericNotes
                      data={medicationsData}
                      title=""
                      config={NotesConfig.MEDICATIONS}
                    />
                  );
                })()}
              </div>
            </div>

            {/* Row 2, Column 2: Prior/Existing Conditions */}
            <div className="sample-history-item">
              <h4 className="sample-history-title">Prior/Existing Conditions</h4>
              <div className="sample-history-content">
                {(() => {
                  const conditionsData = getEncountersByType(encounters.DIAGNOSIS);
                  const surgeryData = getEncountersByType(encounters.SURGICAL_HISTORY);
                  const admissionsData = getEncountersByType(encounters.PATIENT_ADMISSIONS);
                  const hasConditions = conditionsData && conditionsData.length > 0;
                  const hasSurgery = surgeryData && surgeryData.length > 0;
                  const hasAdmissions = admissionsData && admissionsData.length > 0;
                  const noConditions = hasValueMatch(
                    conditionsData,
                    "no prior/existing conditions"
                  );

                  if (noConditions) {
                    return (
                      <div className="sample-history-empty">
                        Patient has no prior/existing conditions
                      </div>
                    );
                  }

                  if (!hasConditions && !hasSurgery && !hasAdmissions) {
                    return <div className="sample-history-empty">Notes not entered</div>;
                  }

                  return (
                    <>
                      <GenericNotes
                        data={conditionsData}
                        title="Conditions"
                        config={NotesConfig.DIAGNOSIS}
                      />
                      <GenericNotes
                        data={surgeryData}
                        title="Surgical History"
                        config={NotesConfig.SURGICAL_HISTORY}
                      />
                      <GenericNotes
                        data={admissionsData}
                        title="Previous Admissions"
                        config={NotesConfig.ADMISSIONS}
                      />
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Row 2, Column 3: Last Meal */}
            <div className="sample-history-item">
              <h4 className="sample-history-title">Last Meal</h4>
              <div className="sample-history-content">
                {(() => {
                  const lastMealData = getEncountersByType(encounters.SUMMARY_ASSESSMENT);
                  const hasLastMeal = lastMealData && lastMealData.length > 0;

                  if (!hasLastMeal) {
                    return <div className="sample-history-empty">Notes not entered</div>;
                  }

                  return (
                    <GenericNotes
                      data={lastMealData}
                      title=""
                      config={NotesConfig.LAST_MEAL}
                    />
                  );
                })()}
              </div>
            </div>
          </div>
        </Box>
      ),
    },
    {
      title: "Secondary Survey",
      content: (
        <Box>
          <style>
            {`
              .secondary-survey-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
                width: 100%;
              }

              .secondary-survey-item {
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                padding: 10px;
                background-color: #fafafa;
                min-height: 100px;
                display: flex;
                flex-direction: column;
              }

              .secondary-survey-title {
                font-weight: bold;
                margin-bottom: 6px;
                margin-top: 0;
                font-size: 0.9rem;
                border-bottom: 1px solid #ddd;
                padding-bottom: 4px;
              }

              .secondary-survey-content {
                padding-left: 8px;
                font-size: 0.85rem;
                flex-grow: 1;
              }

              .secondary-survey-empty {
                color: #999;
                font-style: italic;
                font-size: 0.8rem;
              }

              @media print {
                .secondary-survey-grid {
                  gap: 8px;
                }

                .secondary-survey-item {
                  padding: 6px;
                  min-height: auto;
                  page-break-inside: avoid;
                  break-inside: avoid;
                }

                .secondary-survey-title {
                  font-size: 0.8rem;
                  margin-bottom: 4px;
                }

                .secondary-survey-content {
                  font-size: 0.75rem;
                  padding-left: 4px;
                }
              }
            `}
          </style>

          <div className="secondary-survey-grid">
            {secondarySurveyData.map((section, index) => {
              const hasContent =
                Array.isArray(section?.children)
                  ? section.children.length > 0
                  : Boolean(section?.children);

              return (
                <div key={index} className="secondary-survey-item">
                  <h4 className="secondary-survey-title">
                    {section.heading ?? "Untitled"}
                  </h4>
                  <div className="secondary-survey-content">
                    {hasContent ? (
                      <RenderNotesChildren children={section.children as NotesChild[]} />
                    ) : (
                      <div className="secondary-survey-empty">Notes not entered</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Box>
      ),
    },
    {
      title: "Diagnosis",
      content: formatDiagnosisNotes([
        ...getEncountersByType(encounters.OUTPATIENT_DIAGNOSIS),
        ...getEncountersByType(encounters.DIAGNOSIS),
      ]),
    },
    {
      title: "Laboratory or Radiology Findings",
      content: (() => {
        const bedSideFindings = formatInvestigationPlans(
          getInvestigationObservationsByType(encounters.BED_SIDE_TEST)
        );
        const radiologyFindings = formatRadiologyInvestigationPlans(
          getInvestigationObservationsByType(encounters.RADIOLOGY_EXAMINATON)
        );

        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {bedSideFindings.length > 0 && (
              <ResultsTable title="Beside Tests" data={bedSideFindings} />
            )}
            {radiologyFindings.length > 0 && (
              <ResultsTable
                title="Radiology Examinations"
                data={radiologyFindings}
              />
            )}
            {bedSideFindings.length === 0 && radiologyFindings.length === 0 && (
              <Box>No findings recorded.</Box>
            )}
          </Box>
        );
      })(),
    },
    {
      title: "Patient Management Plan",
      content: (() => {
        const patientManagementData = formatPatientManagamentPlan({
          nonPharmalogical: getEncountersByType(encounters.NON_PHARMACOLOGICAL),
          careAreaObs: getEncountersByType(encounters.PATIENT_CARE_AREA),
          medicationObs: getEncountersByType(encounters.PRESCRIPTIONS),
        });

        return (
          <Box>
            <style>
              {`
                .patient-management-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 12px;
                  width: 100%;
                }

                .patient-management-item {
                  border: 1px solid #e0e0e0;
                  border-radius: 6px;
                  padding: 10px;
                  background-color: #fafafa;
                  min-height: 100px;
                  display: flex;
                  flex-direction: column;
                }

                .patient-management-title {
                  font-weight: bold;
                  margin-bottom: 6px;
                  margin-top: 0;
                  font-size: 0.9rem;
                  border-bottom: 1px solid #ddd;
                  padding-bottom: 4px;
                }

                .patient-management-content {
                  padding-left: 8px;
                  font-size: 0.85rem;
                  flex-grow: 1;
                }

                .patient-management-empty {
                  color: #999;
                  font-style: italic;
                  font-size: 0.8rem;
                }

                @media print {
                  .patient-management-grid {
                    gap: 8px;
                  }

                  .patient-management-item {
                    padding: 6px;
                    min-height: auto;
                    page-break-inside: avoid;
                    break-inside: avoid;
                  }

                  .patient-management-title {
                    font-size: 0.8rem;
                    margin-bottom: 4px;
                  }

                  .patient-management-content {
                    font-size: 0.75rem;
                    padding-left: 4px;
                  }
                }
              `}
            </style>

            <div className="patient-management-grid">
              {patientManagementData.map((section, index) => {
                const hasContent =
                  Array.isArray(section?.children)
                    ? section.children.length > 0
                    : Boolean(section?.children);

                return (
                  <div key={index} className="patient-management-item">
                    <h4 className="patient-management-title">
                      {section.heading ?? "Untitled"}
                    </h4>
                    <div className="patient-management-content">
                      {hasContent ? (
                        <RenderNotesChildren children={section.children as NotesChild[]} />
                      ) : (
                        <div className="patient-management-empty">Notes not entered</div>
                      )}
                    </div>
                    {section.user && (
                      <div
                        style={{
                          color: "#7f8c8d",
                          fontSize: "14px",
                          letterSpacing: "0.2px",
                          marginTop: "8px",
                          fontStyle: "italic",
                          textAlign: "right",
                        }}
                      >
                        {section.user}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Box>
        );
      })(),
    },
    {
      title: "Continuation Notes",
      content: (
        <ContinuationNotes
          obs={getEncountersByType(encounters.CLINICAL_NOTES)}
        />
      ),
    },

    {
      title: "Disposition Notes",
      content: (() => {
        const dispositionData = formatDisposition(
          [
            ...getEncountersByType(encounters.AWAITING_SPECIALTY),
            ...getEncountersByType(encounters.DISPOSITION),
          ]
        );

        return (
          <Box>
            <style>
              {`
                .disposition-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 12px;
                  width: 100%;
                }

                .disposition-item {
                  border: 1px solid #e0e0e0;
                  border-radius: 6px;
                  padding: 10px;
                  background-color: #fafafa;
                  min-height: 100px;
                  display: flex;
                  flex-direction: column;
                }

                .disposition-title {
                  font-weight: bold;
                  margin-bottom: 6px;
                  margin-top: 0;
                  font-size: 0.9rem;
                  border-bottom: 1px solid #ddd;
                  padding-bottom: 4px;
                }

                .disposition-content {
                  padding-left: 8px;
                  font-size: 0.85rem;
                  flex-grow: 1;
                }

                .disposition-empty {
                  color: #999;
                  font-style: italic;
                  font-size: 0.8rem;
                }

                @media print {
                  .disposition-grid {
                    gap: 8px;
                  }

                  .disposition-item {
                    padding: 6px;
                    min-height: auto;
                    page-break-inside: avoid;
                    break-inside: avoid;
                  }

                  .disposition-title {
                    font-size: 0.8rem;
                    margin-bottom: 4px;
                  }

                  .disposition-content {
                    font-size: 0.75rem;
                    padding-left: 4px;
                  }
                }
              `}
            </style>

            <div className="disposition-grid">
              {dispositionData.map((section, index) => {
                const hasContent =
                  Array.isArray(section?.children)
                    ? section.children.length > 0
                    : Boolean(section?.children);

                return (
                  <div key={index} className="disposition-item">
                    <h4 className="disposition-title">
                      {section.heading ?? "Untitled"}
                    </h4>
                    <div className="disposition-content">
                      {hasContent ? (
                        <RenderNotesChildren children={section.children as NotesChild[]} />
                      ) : (
                        <div className="disposition-empty">Notes not entered</div>
                      )}
                    </div>
                    {section.user && (
                      <div
                        style={{
                          color: "#7f8c8d",
                          fontSize: "14px",
                          letterSpacing: "0.2px",
                          marginTop: "8px",
                          fontStyle: "italic",
                          textAlign: "right",
                        }}
                      >
                        {section.user}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Box>
        );
      })(),
    },
  ];
};
