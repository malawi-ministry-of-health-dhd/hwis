import React from "react";
import { MainButton, PatientInfoTab, WrapperBox } from "@/components";
import { Panel } from ".";
import { FaPlus } from "react-icons/fa";

import { useState, useEffect, useMemo, useRef } from "react";
import MarkdownEditor from "@/components/markdownEditor";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
} from "@mui/material";
import { addEncounter, getPatientsEncounters } from "@/hooks/encounter";
import {
  getActivePatientDetails,
  useParameters,
  useSubmitEncounter,
} from "@/hooks";
import { encounters, concepts } from "@/constants";
import { getHumanReadableDateTime } from "@/helpers/dateTime";
import { useServerTime } from "@/contexts/serverTimeContext";
import { getObservations } from "@/helpers";
import { useClinicalNotes } from "@/hooks/useClinicalNotes";
import { useReactToPrint } from "react-to-print";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import { getPatientLabOrder } from "@/hooks/labOrder";
import { getAllObservations } from "@/hooks/obs";
import { InvestigationPlanNotes } from "../clinicalNotes/InvestigationPlan";
import { PrintClinicalNotes } from "./printClinicalNotes";
import {
  GenerateSurgicalNotesPDF,
  SurgicalNotesPDFRef,
} from "../../[id]/surgicalNotes/components/generateSurgicalNotesPDF";
import {
  GenerateGyneacologyNotesPDF,
  GyneacologyNotesPDFRef,
} from "../../[id]/gyneacology/components/generateGyneacologyNotesPDF";
import {
  GenerateMedicalInpatientlNotesPDF,
  MedicalInpatientNotesPDFRef,
} from "../../[id]/medicalInpatient/components/generateMedicalInpatientNotesPDF";

import { useVisitDates } from "@/contexts/visitDatesContext";
import { DisplayInformation } from "./displayInformation";
import {
  formatDiagnosisNotes,
  formatInvestigationPlans,
  formatPatientManagamentPlan,
  formatPresentingComplaints,
  formatPrimarySurvey,
  formatSoapierNotes,
  formatVitals,
  formatSecondarySurvey,
} from "./formatters";
import ResultsTable from "./tabularDisplayInformation";
import { MultiColumnNotes } from "./multiColumnDisplay";

import { PresentingComplaints } from "@/app/patient/components/clinicalNotes/updated-clinical-notes/presentingComplaints";
import {
  GenericNotes,
  NotesConfig,
} from "@/app/patient/components/clinicalNotes/updated-clinical-notes/genericNotes";

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

const PatientManagementPlanGrid = ({ data }: { data: any[] }) => {
  if (!Array.isArray(data) || data.length === 0) return null;

  return (
    <Box>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          width: "100%",
        }}
      >
        {data.map((section, index) => {
          const hasContent =
            Array.isArray(section?.children)
              ? section.children.length > 0
              : Boolean(section?.children);

          return (
            <div
              key={index}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "6px",
                padding: "10px",
                backgroundColor: "#fafafa",
                minHeight: "100px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h4
                style={{
                  fontWeight: "bold",
                  marginBottom: "6px",
                  marginTop: 0,
                  fontSize: "0.9rem",
                  borderBottom: "1px solid #ddd",
                  paddingBottom: "4px",
                }}
              >
                {section?.heading ?? "Untitled"}
              </h4>
              <div style={{ paddingLeft: "8px", fontSize: "0.85rem", flexGrow: 1 }}>
                {hasContent ? (
                  <RenderNotesChildren children={section.children as NotesChild[]} />
                ) : (
                  <div style={{ color: "#999", fontStyle: "italic", fontSize: "0.8rem" }}>
                    Notes not entered
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Box>
  );
};

type PanelData = {
  title: string;
  data: any;
  useValue?: boolean;
  removeObs?: string[]; // Add removeObs property to PanelData type
};

// New component for Laboratory or Radiology finding
const LaboratoryRadiologyFindings = ({ data }: any) => {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  // Ensure data is actually an array before processing
  const safeData = Array.isArray(data) ? data : [];

  // Group lab results by test type
  const groupedResults = safeData.reduce((acc, item) => {
    // Skip null or undefined items
    if (!item) return acc;

    const testName = item?.names?.[0]?.name || "Other";
    if (!acc[testName]) {
      acc[testName] = [];
    }
    acc[testName].push(item);
    return acc;
  }, {});

  return (
    <Box sx={{ padding: "10px 0" }}>
      {Object.entries(groupedResults).map(([testName, results], index) => (
        <Box
          key={`lab-group-${index}`}
          sx={{
            marginBottom: "20px",
            padding: "10px",
            backgroundColor: "#f9f9f9",
            borderRadius: "4px",
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: "#2c3e50",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "8px",
              marginBottom: "10px",
            }}
          >
            {testName}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {Array.isArray(results) &&
              results.map((result, idx) => (
                <Box
                  key={`result-${idx}`}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "4px 0",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {result.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#7f8c8d" }}>
                    {getHumanReadableDateTime(result.obs_datetime)}
                  </Typography>
                </Box>
              ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const filterObservationsByName = (observations: any, filterNames = []) => {
  if (!observations || !Array.isArray(observations)) return [];

  return observations.filter((obs) => {
    // Check if observation's name is in the filter list
    const obsName = obs?.names?.[0]?.name || "";
    const shouldKeep = !filterNames.some((filterName: any) =>
      obsName.toLowerCase().includes(filterName.toLowerCase())
    );

    // If observation has children, filter those too
    if (
      shouldKeep &&
      obs.children &&
      Array.isArray(obs.children) &&
      obs.children.length > 0
    ) {
      obs.children = filterObservationsByName(obs.children, filterNames);
    }

    return shouldKeep;
  });
};

export const ClinicalNotes = () => {
  const { selectedVisit } = useVisitDates();
  const [filterSoapierState, setFilterSoapierState] = useState(false);
  const [filterAETCState, setFilterAETCState] = useState(false);
  const [filterSurgicalState, setFilterSurgicalState] = useState(false); // New state for surgical notes
  const [filterGyneacologyState, setFilterGyneacologyState] = useState(false); // New state for gyneacology notes
  const [filterMedicalInpatientState, setFilterMedicalInpatientState] =
    useState(false);
  const [expanded, setExpanded] = useState<string | false>(false); // Changed to false initially
  const { handleSubmit } = useSubmitEncounter(
    encounters.CLINICAL_NOTES,
    () => ""
  );
  const { ServerTime } = useServerTime();
  const { params } = useParameters();
  const patientId = params.id as string;
  const { notes: clinicalNotes, refresh } = useClinicalNotes(patientId);
  const [printoutTitle, setPrintoutTitle] = useState("All");

  const contentRef = useRef<HTMLDivElement>(null);

  const pdfRef = useRef<SurgicalNotesPDFRef>(null);
  const gyneacologyRef = useRef<GyneacologyNotesPDFRef>(null);
  const medicalInpatientRef = useRef<MedicalInpatientNotesPDFRef>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Refresh clinical notes when component mounts
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  }, []);

  // Refresh encounter data when component mounts or filters change
  useEffect(() => {
    // Fetch data whenever component mounts
    refresh();
  }, [
    refresh,
    filterSoapierState,
    filterAETCState,
    filterSurgicalState,
    filterGyneacologyState,
    filterMedicalInpatientState,
  ]); // Added filterSurgicalState to dependencies

  const getEncountersByType = (encounterTypeUuid: any) => {
    const {
      data: patientHistory,
      isLoading: historyLoading,
    }: { data: any; isLoading: any } = getPatientsEncounters(
      patientId,
      `encounter_type=${encounterTypeUuid}&visit=${selectedVisit?.uuid}`
    );
    if (!patientHistory) return [];
    return patientHistory[0]?.obs || [];
  };

  const getLatestValue = (obsData: any) => {
    if (!obsData?.length) return null;
    const latestObsMap = new Map();

    // Find the most recent observation for each concept_id
    obsData.forEach((observation: any) => {
      const { concept_id, obs_datetime } = observation;
      const currentLatest = latestObsMap.get(concept_id);

      if (
        !currentLatest ||
        new Date(obs_datetime) > new Date(currentLatest.obs_datetime)
      ) {
        latestObsMap.set(concept_id, observation);
      }
    });

    // Get the full observation objects, not just the keys
    const latestObservations = Array.from(latestObsMap.values());

    return latestObservations;
  };

  const getObsByConceptName = (obsData: any) => {
    const { data: obs }: any = getAllObservations(
      patientId,
      obsData,
      selectedVisit?.id
    );
    return obs?.data || [];
  };

  const getNewVitalSigns = () => {
    const allObs: any = [
      ...getObsByConceptName(concepts.HEART_RATE),
      ...getObsByConceptName(concepts.RESPIRATORY_RATE),
      ...getObsByConceptName(concepts.BLOOD_OXYGEN_SATURATION),
      ...getObsByConceptName(concepts.TEMPERATURE),
      ...getObsByConceptName(concepts.GLUCOSE),
      ...getObsByConceptName(concepts.AVPU),
      ...getObsByConceptName(concepts.SYSTOLIC_BLOOD_PRESSURE),
      ...getObsByConceptName(concepts.DIASTOLIC_BLOOD_PRESSURE),
    ];
    return getLatestValue(allObs) || [];
  };

  // Generate base encounter data with all possible panels and their removeObs arrays
  const baseEncounterData: Record<string, PanelData> = {
    panel14: {
      title: "Continuation Notes",
      data: getEncountersByType(encounters.CLINICAL_NOTES),
      removeObs: ["image part", "image part 2"], // Example headings to remove
    },
    panel13: {
      title: "SOAPIER Notes",
      data: (
        <DisplayInformation
          title=""
          data={formatSoapierNotes(
            getEncountersByType(encounters.NURSING_CARE_NOTES)
          )}
        />
      ),
      // data: [
      //   ...getEncountersByType(encounters.NURSING_CARE_NOTES),
      //   ...getEncountersByType(encounters.PRESCRIPTIONS),
      //   ...getEncountersByType(encounters.DISPENSING),
      // ],
      removeObs: ["nursing chart", "medication chart"], // Example headings to remove
    },
    panel18: {
      title: "Surgical Notes",
      data: [...getEncountersByType(encounters.SURGICAL_NOTES_TEMPLATE_FORM)],
      removeObs: [],
    },
    panel16: {
      title: "Gyneacology",
      data: [...getEncountersByType(encounters.GYNEACOLOGY_WARD)],
      removeObs: [],
    },
    panel17: {
      title: "Medical Inpatient",
      data: [...getEncountersByType(encounters.MEDICAL_IN_PATIENT)],
      removeObs: [],
    },
    panel1: {
      title: "Triage",
      // data: <Button title="TEST" variant="contained"  />,
      data: (
        <DisplayInformation
          title=""
          data={[
            formatPresentingComplaints(
              getEncountersByType(encounters.PRESENTING_COMPLAINTS)
            ),
            ...formatVitals(getEncountersByType(encounters.VITALS)),
          ]}
        />
      ),
      // data: [
      //   ...getEncountersByType(encounters.TRIAGE_RESULT),
      //   ...getEncountersByType(encounters.PRESENTING_COMPLAINTS),
      // ],
      removeObs: [], // No specific headings to remove
    },
    panel2: {
      title: "History of presenting complain",
      data: [getEncountersByType(encounters.SURGICAL_NOTES_TEMPLATE_FORM)],
      removeObs: [], // No specific headings to remove
    },
    panel3: {
      title: "Vitals",
      data: getNewVitalSigns(),
      removeObs: [], // No specific headings to remove
    },
    panel4: {
      title: "Past Medical History",
      data: getEncountersByType(encounters.MEDICAL_IN_PATIENT),
      removeObs: [], // No specific headings to remove
    },
    panel5: {
      title: "Drug History",
      data: getEncountersByType(encounters.MEDICAL_IN_PATIENT),
      removeObs: [], // No specific headings to remove
    },
    panel7: {
      title: "Plan",
      data: (
        <ResultsTable
          title="Beside Tests"
          data={formatInvestigationPlans([
            ...getEncountersByType(encounters.BED_SIDE_TEST),
          ])}
        />
      ),
      //  [
      //   ...getEncountersByType(encounters.BEDSIDE_INVESTIGATION_PLAN),
      //   ...getEncountersByType(encounters.LAB_ORDERS_PLAN),
      // ],
      removeObs: [], // No specific headings to remove
    },
    // panel8: {
    //   title: "Primary Survey",
    //   data: [
    //     ...getEncountersByType(encounters.AIRWAY_ASSESSMENT),
    //     ...getEncountersByType(encounters.BREATHING_ASSESSMENT),
    //     ...getEncountersByType(encounters.CIRCULATION_ASSESSMENT),
    //     ...getEncountersByType(encounters.PRIMARY_DISABILITY_ASSESSMENT),
    //     ...getEncountersByType(encounters.EXPOSURE_ASSESSMENT),
    //   ],
    //   removeObs: ["Image Part Name"], // No specific headings to remove
    // },
    panel9: {
      title: "Secondary Survey",
      data: (
        <DisplayInformation
          title=""
          data={formatSecondarySurvey({
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
            extremitiesObs: getEncountersByType(
              encounters.EXTREMITIES_ASSESSMENT
            ),
            neurologicalObs: getEncountersByType(
              encounters.NEUROLOGICAL_EXAMINATION_ASSESSMENT
            ),
          })}
        />
      ),
      removeObs: [
        // "Image Part Name",
        // "Abnormalities",
        // "Clinician notes",
        // "Other",
      ], // No specific headings to remove
    },
    panel10: {
      title: "Diagnosis",
      data: (
        <DisplayInformation
          title=""
          data={formatDiagnosisNotes([
            ...getEncountersByType(encounters.OUTPATIENT_DIAGNOSIS),
            ...getEncountersByType(encounters.DIAGNOSIS),
          ])}
        />
      ),
      // [
      //   ...getEncountersByType(encounters.OUTPATIENT_DIAGNOSIS),
      //   ...getEncountersByType(encounters.DIAGNOSIS),
      // ],
      removeObs: [], // No specific headings to remove
    },
    panel11: {
      title: "Laboratory or Radiology finding",
      data: [
        ...getEncountersByType(encounters.BED_SIDE_TEST),
        ...getEncountersByType(encounters.LAB),
      ],
      removeObs: [], // No specific headings to remove
    },
    panel12: {
      title: "Outcome/Disposition",
      data: getEncountersByType(encounters.DISPOSITION),
      removeObs: [], // No specific headings to remove
    },
    panel20: {
      title: "Primary Survey",
      data: (
        <DisplayInformation
          title=""
          data={formatPrimarySurvey({
            airwayObs: getEncountersByType(encounters.AIRWAY_ASSESSMENT),
            breathingObs: getEncountersByType(encounters.BREATHING_ASSESSMENT),
            circulationObs: getEncountersByType(
              encounters.CIRCULATION_ASSESSMENT
            ),
            disabilityObs: getEncountersByType(
              encounters.PRIMARY_DISABILITY_ASSESSMENT
            ),
            exposureObs: getEncountersByType(encounters.EXPOSURE_ASSESSMENT),
          })}
        />
      ),
      removeObs: [], // No specific headings to remove
    },
    panel51: {
      title: "Patient Management Plan",
      data: (
        <PatientManagementPlanGrid
          data={formatPatientManagamentPlan({
            nonPharmalogical: getEncountersByType(
              encounters.NON_PHARMACOLOGICAL
            ),
            careAreaObs: getEncountersByType(encounters.PATIENT_CARE_AREA),
            medicationObs: getEncountersByType(encounters.PRESCRIPTIONS),
          })}
        />
      ),
      removeObs: [], // No specific headings to remove
    },
    panel15: {
      title: "Sample History",
      data: (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Presenting Complaints */}
          <GenericNotes
            data={getEncountersByType(encounters.PRESENTING_COMPLAINTS)}
            title="Presenting Complaints"
            config={NotesConfig.PRESENTING_COMPLAINTS}
          />

          {/* Allergies */}
          <GenericNotes
            data={getEncountersByType(encounters.ALLERGIES)}
            title="Allergies"
            config={NotesConfig.ALLERGIES}
          />

          {/* Medications */}
          <GenericNotes
            data={getEncountersByType(encounters.PRESCRIPTIONS)}
            title="Medications"
            config={NotesConfig.MEDICATIONS}
          />

          {/* Diagnosis */}
          <GenericNotes
            data={getEncountersByType(encounters.DIAGNOSIS)}
            title="Prior/existing conditions"
            config={NotesConfig.DIAGNOSIS}
          />

          {/* Surgical History */}
          <GenericNotes
            data={getEncountersByType(encounters.SURGICAL_HISTORY)}
            title="Surgical History"
            config={NotesConfig.SURGICAL_HISTORY}
          />

          {/* Previous Admissions */}
          <GenericNotes
            data={getEncountersByType(encounters.PATIENT_ADMISSIONS)}
            title="Previous Admissions"
            config={NotesConfig.ADMISSIONS}
          />

          <GenericNotes
            data={getEncountersByType(encounters.SUMMARY_ASSESSMENT)}
            title="Last Meal"
            config={NotesConfig.LAST_MEAL}
          />

          {/* Family Medical History */}
          {/* <GenericNotes
            data={getEncountersByType(encounters.FAMILY_MEDICAL_HISTORY)}
            title="Family Medical History"
            config={NotesConfig.FAMILY_HISTORY}
          /> */}
        </Box>
      ),
      removeObs: [],
    },
  };

  // Process encounter data based on filters and removeObs arrays
  const getFilteredEncounterData = (
    baseData: any,
    showSoapierOnly: any,
    showAETC: any,
    showSurgicalOnly: any, // New parameter for surgical notes filter
    showGyneacologyOnly: any,
    showMedicalInpatientOnly: any
  ) => {
    // Start with a copy of the base data
    const filteredData = { ...baseData };

    // Apply panel-specific filters to all panels based on removeObs property
    Object.keys(filteredData).forEach((panelId) => {
      const panel = filteredData[panelId];
      if (panel && Array.isArray(panel.data) && panel.data.length > 0) {
        // If panel has removeObs property, filter out those observation names
        if (
          panel.removeObs &&
          Array.isArray(panel.removeObs) &&
          panel.removeObs.length > 0
        ) {
          filteredData[panelId].data = filterObservationsByName(
            panel.data,
            panel.removeObs
          );
        }
      }
    });

    // Apply global filters
    if (showSoapierOnly) {
      // Only show SOAPIER Notes when filterSoapierState is true
      const result: any = {};
      if (filteredData.panel13) {
        result.panel13 = filteredData.panel13;
      }
      return result;
    } else if (showSurgicalOnly) {
      // Only show Surgical Notes when filterSurgicalState is true
      const result: any = {};
      if (filteredData.panel18) {
        result.panel18 = filteredData.panel18;
      }
      return result;
    } else if (showGyneacologyOnly) {
      // Only show Gyneacology Notes when filterGyneacolgyState is true
      const result: any = {};
      if (filteredData.panel16) {
        result.panel16 = filteredData.panel16;
      }
      return result;
    } else if (showMedicalInpatientOnly) {
      // Only show Medical Inpatient Notes when filterMedicalInpatientState is true
      const result: any = {};
      if (filteredData.panel17) {
        result.panel17 = filteredData.panel17;
      }
      return result;
    } else if (showAETC) {
      // Remove Clinical Notes, SOAPIER Notes, and Surgical Notes panels when filterAETCState is true
      delete filteredData.panel14;
      delete filteredData.panel13;
      delete filteredData.panel18;
      delete filteredData.panel16;
      delete filteredData.panel17;
    }

    return filteredData;
  };

  // Filter encounter data based on filter states and removeObs arrays
  const encounterData = useMemo(() => {
    return getFilteredEncounterData(
      baseEncounterData,
      filterSoapierState,
      filterAETCState,
      filterSurgicalState, // Added surgical filter parameter
      filterGyneacologyState,
      filterMedicalInpatientState
    );
  }, [
    baseEncounterData,
    filterSoapierState,
    filterAETCState,
    filterSurgicalState,
    filterGyneacologyState,
    filterMedicalInpatientState,
  ]); // Added filterSurgicalState to dependencies

  const addClinicalNote = (note: string) => {

    const data = { "Clinical notes construct": note };
    handleSubmit(getObservations(data, ServerTime.getServerTimeString())).then(
      () => refresh()
    );
  };

  // Handle accordion expansion
  const handleChange =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);

      // Refresh data when accordion is opened
      if (isExpanded) {
        refresh();
      }
    };

  // const handlePrint = useReactToPrint({
  //   contentRef: contentRef,
  // });
  const printFunction = useReactToPrint({
    contentRef: contentRef,
  });

  // 2. REPLACE your current handlePrint function with this:
  const handlePrint = () => {
    // Check if surgical notes filter is active
    if (filterSurgicalState && pdfRef.current) {
      pdfRef.current.generatePDF();
    } else if (filterGyneacologyState && gyneacologyRef.current) {
      gyneacologyRef.current.generatePDF();
    } else if (filterMedicalInpatientState && medicalInpatientRef.current) {
      medicalInpatientRef.current.generatePDF();
    } else {
      // Use regular print for other cases (All, AETC, SOAPIER)
      printFunction();
    }
  };

  const handleSurgicalPrintComplete = () => {
    console.log("Surgical notes PDF generated successfully!");
  };

  // Function to render grouped items by heading
  const renderGroupedItems = (data: any[]) => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    // First, separate items with children and those without
    let itemsWithChildren: any = [];
    itemsWithChildren = data.filter(
      (item) =>
        item &&
        Array.isArray(item.children) &&
        item.children.length > 0 &&
        !React.isValidElement(item)
    );

    const regularItems = data.filter(
      (item) =>
        (!item.children || item.children.length === 0) &&
        !React.isValidElement(item)
    );

    const componentItems = data
      .filter((item) => React.isValidElement(item))
      .map((item) => item);

    // Process items with children
    const parentElements = itemsWithChildren.map(
      (parentItem: any, index: number) => {
        // Add parent reference to children for use in renderChildrenByHeading
        const childrenWithParentRef = parentItem.children.map((child: any) => ({
          ...child,
          parent: {
            value: parentItem.value,
            names: parentItem.names,
          },
        }));

        return (
          <Box key={`parent-item-${index}`} sx={{ marginBottom: "24px" }}>
            {/* Render children with parent reference */}
            {renderChildrenByHeading(childrenWithParentRef)}
          </Box>
        );
      }
    );

    // Render regular items (without children)
    const regularItemsElement =
      regularItems.length > 0 ? renderRegularItems(regularItems, 0) : null;

    // Combine both types of elements
    return (
      <>
        {componentItems}
        {parentElements}
        {regularItemsElement}
      </>
    );
  };

  // Function to group and render children by their headings
  const renderChildrenByHeading = (children: any[]) => {
    // Ensure children is an array
    if (!children || !Array.isArray(children)) {
      return null;
    }

    // Group children by their parent value
    const groupedChildren: Record<string, any[]> = {};

    children.forEach((child) => {
      if (!child) return; // Skip null or undefined children
      const parentValue = child.parent?.value || "Other";
      if (!groupedChildren[parentValue]) {
        groupedChildren[parentValue] = [];
      }
      groupedChildren[parentValue].push(child);
    });

    // Render each parent value as a group
    return Object.entries(groupedChildren).map(
      ([parentValue, childItems], index) => (
        <Box
          key={`child-group-${index}`}
          className="clinical-note-group"
          sx={{
            marginBottom: "16px",
            borderBottom:
              index < Object.keys(groupedChildren).length - 1
                ? "1px solid #e0e0e0"
                : "none",
            paddingBottom: "16px",
            display: "flex",
          }}
        >
          {/* Left side: Parent Value */}
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: "#3a3a3a",
              width: "30%",
              paddingRight: "8px",
              display: "flex",
              alignItems: "center",
              height: "24px",
            }}
          >
            <Box component="span" sx={{ flexGrow: 1 }}>
              {parentValue}
            </Box>
          </Typography>

          {/* Center separator */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "24px",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "#777",
                fontWeight: 400,
                fontSize: "1.5rem",
                lineHeight: 1,
              }}
            >
              :
            </Typography>
          </Box>

          {/* Right side: Child names and values */}
          <Box sx={{ width: "calc(70% - 40px)" }}>
            {childItems.map((child, itemIndex) => {
              const childName =
                child.names && child.names[0]?.name ? child.names[0].name : "";
              return (
                <Box
                  key={`child-value-${index}-${itemIndex}`}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    marginBottom:
                      itemIndex < childItems.length - 1 ? "10px" : 0,
                    height: itemIndex === 0 ? "24px" : "auto",
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      minWidth: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#3f51b5",
                      marginRight: "10px",
                      marginTop: itemIndex === 0 ? "10px" : "8px",
                      display: childItems.length > 1 ? "block" : "none",
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#555",
                      textAlign: "left",
                      lineHeight: "1.5",
                      paddingTop: itemIndex === 0 ? "2px" : 0,
                      fontWeight: "600",
                      display: "inline",
                    }}
                  >
                    {childName}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      )
    );
  };

  // Helper function to handle regular items (without children)
  const renderRegularItems = (items: any[], groupIndex: number) => {
    // Group items by their heading
    const groupedItems: Record<string, any[]> = {};

    items.forEach((item) => {
      const headingName =
        item?.names && item.names[0]?.name ? item.names[0].name : "Other";
      if (!groupedItems[headingName]) {
        groupedItems[headingName] = [];
      }
      groupedItems[headingName].push(item);
    });

    // Render each group with heading appearing only once
    return Object.entries(groupedItems).map(
      ([heading, groupItems], subGroupIndex) => (
        <Box
          key={`group-${groupIndex}-${subGroupIndex}`}
          className="clinical-note-group"
          sx={{
            marginBottom: "16px",
            borderBottom:
              subGroupIndex < Object.keys(groupedItems).length - 1
                ? "1px solid #e0e0e0"
                : "none",
            paddingBottom: "16px",
            display: "flex",
          }}
        >
          {/* Left side: Heading appears only once */}
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: "#3a3a3a",
              width: "30%",
              paddingRight: "8px",
              display: "flex",
              alignItems: "center",
              height: "24px",
            }}
          >
            <Box component="span" sx={{ flexGrow: 1 }}>
              {heading}
            </Box>
          </Typography>

          {/* Center separator */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "24px",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "#777",
                fontWeight: 400,
                fontSize: "1.5rem",
                lineHeight: 1,
              }}
            >
              :
            </Typography>
          </Box>

          {/* Right side: Values */}
          <Box sx={{ width: "calc(70% - 40px)" }}>
            {groupItems.map((item, itemIndex) => (
              <Box
                key={`item-${groupIndex}-${itemIndex}`}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  marginBottom: itemIndex < groupItems.length - 1 ? "10px" : 0,
                  height: itemIndex === 0 ? "24px" : "auto",
                }}
              >
                <Box
                  component="span"
                  sx={{
                    minWidth: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#3f51b5",
                    marginRight: "10px",
                    marginTop: itemIndex === 0 ? "10px" : "8px",
                    display: groupItems.length > 1 ? "block" : "none",
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: "#555",
                    textAlign: "left",
                    lineHeight: "1.5",
                    paddingTop: itemIndex === 0 ? "2px" : 0,
                  }}
                >
                  {item?.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )
    );
  };

  const notesData = [
    {
      title: "Triage Information",
      content: [
        formatPresentingComplaints(
          getEncountersByType(encounters.PRESENTING_COMPLAINTS)
        ),
        ...formatVitals(getEncountersByType(encounters.VITALS)),
      ],
    },
    {
      title: "Soapier Notes",
      content: formatSoapierNotes(
        getEncountersByType(encounters.NURSING_CARE_NOTES)
      ),
    },
    {
      title: "Primary Survey",
      content: formatPrimarySurvey({
        airwayObs: getEncountersByType(encounters.AIRWAY_ASSESSMENT),
        breathingObs: getEncountersByType(encounters.BREATHING_ASSESSMENT),
        circulationObs: getEncountersByType(encounters.CIRCULATION_ASSESSMENT),
        disabilityObs: getEncountersByType(
          encounters.PRIMARY_DISABILITY_ASSESSMENT
        ),
        exposureObs: getEncountersByType(encounters.EXPOSURE_ASSESSMENT),
      }),
    },
    {
      title: "Secondary Survey",
      content: formatSecondarySurvey({
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
      }),
    },
    {
      title: "Patient Management Plan",
      content: (
        <PatientManagementPlanGrid
          data={formatPatientManagamentPlan({
            nonPharmalogical: getEncountersByType(encounters.NON_PHARMACOLOGICAL),
            careAreaObs: getEncountersByType(encounters.PATIENT_CARE_AREA),
            medicationObs: getEncountersByType(encounters.PRESCRIPTIONS),
          })}
        />
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
      title: " Laboratory or Radiology Findings",
      content: (
        <ResultsTable
          title="Beside Tests"
          data={formatInvestigationPlans([
            ...getEncountersByType(encounters.BED_SIDE_TEST),
          ])}
        />
      ),
    },
    {
      title: "Sample History",
      content: (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Presenting Complaints */}
          <GenericNotes
            data={getEncountersByType(encounters.PRESENTING_COMPLAINTS)}
            title="-Presenting Complaints"
            config={NotesConfig.PRESENTING_COMPLAINTS}
          />

          {/* Allergies */}
          <GenericNotes
            data={getEncountersByType(encounters.ALLERGIES)}
            title="-Allergies"
            config={NotesConfig.ALLERGIES}
          />

          {/* Medications */}
          <GenericNotes
            data={getEncountersByType(encounters.PRESCRIPTIONS)}
            title="-Medications"
            config={NotesConfig.MEDICATIONS}
          />

          {/* Diagnosis */}
          <GenericNotes
            data={getEncountersByType(encounters.DIAGNOSIS)}
            title="Prior/existing conditions"
            config={NotesConfig.DIAGNOSIS}
          />

          {/* Surgical History */}
          <GenericNotes
            data={getEncountersByType(encounters.SURGICAL_HISTORY)}
            title="-Surgical History"
            config={NotesConfig.SURGICAL_HISTORY}
          />

          {/* Previous Admissions */}
          <GenericNotes
            data={getEncountersByType(encounters.PATIENT_ADMISSIONS)}
            title="-Previous Admissions"
            config={NotesConfig.ADMISSIONS}
          />

          <GenericNotes
            data={getEncountersByType(encounters.SUMMARY_ASSESSMENT)}
            title="-Last Meal"
            config={NotesConfig.LAST_MEAL}
          />

          {/* Family Medical History */}
          {/* <GenericNotes
            data={getEncountersByType(encounters.FAMILY_MEDICAL_HISTORY)}
            title="-Family Medical History"
            config={NotesConfig.FAMILY_HISTORY}
          /> */}
        </Box>
      ),
    },
  ];

  return (
    <Panel title="">
      <WrapperBox display={"flex"} justifyContent={"space-between"}>
        <AddClinicalNotes
          onAddNote={addClinicalNote}
          filterSoapierState={filterSoapierState}
          filterAETCState={filterAETCState}
          filterSurgicalState={filterSurgicalState} // Pass surgical filter state
          filterGyneacologyState={filterGyneacologyState}
          filterMedicalInpatientState={filterMedicalInpatientState}
          setFilterSoapierState={setFilterSoapierState}
          setFilterAETCState={setFilterAETCState}
          setFilterSurgicalState={setFilterSurgicalState} // Pass surgical filter setter
          setFilterGyneacologyState={setFilterGyneacologyState}
          setFilterMedicalInpatientState={setFilterMedicalInpatientState}
          onDownload={handlePrint}
          surgicalData={encounterData.panel18?.data} // ADD THIS LINE
          gyneacologyData={encounterData.panel16?.data}
          medicalInpatientData={encounterData.panel17?.data}
          onClickFilterButton={setPrintoutTitle}
        />
      </WrapperBox>

      {!filterSurgicalState &&
        !filterGyneacologyState &&
        !filterMedicalInpatientState && (
          <div ref={contentRef}>
            <div>
              <PatientInfoTab />
              <div style={{ paddingTop: "10px" }}>
                <p
                  style={{
                    marginLeft: "10px",
                  }}
                >
                  Report type: {printoutTitle}
                </p>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "20px",
                    // marginTop: "10px",
                    textAlign: "center",
                  }}
                >
                  Clinical Notes
                </div>
              </div>
            </div>
            {/* <DownloadClinicalNotesPDF
              data={notesData}
            /> */}

            {/*<MultiColumnNotes
              columns={2}
              data={notesData}
            />
*/}
            <PrintClinicalNotes data={encounterData} />
          </div>
        )}

      {filterSurgicalState && (
        <GenerateSurgicalNotesPDF
          ref={pdfRef}
          onPrintComplete={handleSurgicalPrintComplete}
          showPreview={true} // Pass this prop to control preview visibility
        />
      )}
      {filterGyneacologyState && (
        <GenerateGyneacologyNotesPDF
          ref={gyneacologyRef}
          onPrintComplete={handleSurgicalPrintComplete}
          showPreview={true} // Pass this prop to control preview visibility
        />
      )}
      {filterMedicalInpatientState && (
        <GenerateMedicalInpatientlNotesPDF
          ref={medicalInpatientRef}
          onPrintComplete={handleSurgicalPrintComplete}
          showPreview={true} // Pass this prop to control preview visibility
        />
      )}
    </Panel>
  );
};

const AddClinicalNotes = ({
  onAddNote,
  filterSoapierState,
  filterAETCState,
  filterSurgicalState, // New prop for surgical filter state
  filterGyneacologyState,
  filterMedicalInpatientState,
  setFilterSoapierState,
  setFilterAETCState,
  setFilterSurgicalState, // New prop for surgical filter setter
  setFilterGyneacologyState,
  setFilterMedicalInpatientState,
  onDownload,
  surgicalData, // ADD THIS NEW PROP
  gyneacologyData,
  medicalInpatientData,

  onClickFilterButton,
}: {
  onAddNote: (value: any) => any;
  filterSoapierState: boolean;
  filterAETCState: boolean;
  filterSurgicalState: boolean; // New prop type
  filterGyneacologyState: boolean;
  filterMedicalInpatientState: boolean;
  setFilterSoapierState: (value: boolean) => void;
  setFilterAETCState: (value: boolean) => void;
  setFilterSurgicalState: (value: boolean) => void; // New prop type
  setFilterGyneacologyState: (value: boolean) => void;
  setFilterMedicalInpatientState: (value: boolean) => void;
  onDownload: () => void;
  surgicalData?: any; // ADD THIS NEW PROP TYPE
  gyneacologyData?: any;
  medicalInpatientData?: any;

  onClickFilterButton: (value: string) => void;
}) => {
  const { hasActiveVisit } = getActivePatientDetails();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  // Ref for printing
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const onSubmit = (values: any) => {
    setAnchorEl(null);
    onAddNote(values);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;
  const { gender } = getActivePatientDetails();
  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          width: "100%",
        }}
      >
        <Button
          aria-describedby={id}
          variant="contained"
          onClick={handleClick}
          startIcon={<FaPlus />}
          disabled={!hasActiveVisit}
          sx={{
            backgroundColor: "primary.main",
            color: "white",
            textTransform: "none",
            px: 3,
            py: 1,
            maxWidth: "calc(100% - 40px)",
            borderRadius: "8px",
            "& .MuiButton-startIcon": {
              marginRight: "8px",
              "& svg": {
                fontSize: "14px",
              },
            },
          }}
        >
          Add Notes
        </Button>

        <div>
          <Button
            onClick={onDownload}
            sx={{
              color: "white",
              backgroundColor: "primary.main",
              border: "1px solid currentColor",
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize: "14px",
              marginRight: "10px",
              flexGrow: 1,
              textTransform: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "110px",
              "&:hover": {
                backgroundColor: "rgb(0, 70, 0)",
              },
            }}
          >
            Download PDF
          </Button>
          <span
            style={{
              width: "10px",
              borderRight: "1px solid #000",
              marginRight: "10px",
              height: "30px",
              paddingTop: "5px",
              paddingBottom: "5px",
            }}
          ></span>
          {/* <Button
            onClick={() => {
              setFilterSoapierState(true);
              setFilterAETCState(false);
              setFilterSurgicalState(false); // Reset surgical filter
              setFilterGyneacologyState(false);
              setFilterMedicalInpatientState(false);

              onClickFilterButton("SOAPIER");
            }}
            sx={{
              backgroundColor: filterSoapierState ? "rgb(221, 238, 221)" : "",
              color: "rgb(0, 70, 0)",
              border: "1px solid currentColor",
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize: "14px",
              marginRight: "10px",
              flexGrow: 1,
              textTransform: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "120px",
              "&:hover": {
                backgroundColor: "rgb(197, 231, 197)",
              },
            }}
          >
            SOAPIER Notes
          </Button> */}
          {/* <Button
            onClick={() => {
              setFilterAETCState(true);
              setFilterSoapierState(false);
              setFilterSurgicalState(false); // Reset surgical filter
              setFilterGyneacologyState(false);
              setFilterMedicalInpatientState(false);

              onClickFilterButton("AETC");
            }}
            sx={{
              backgroundColor: filterAETCState ? "rgb(221, 238, 221)" : "",
              color: "rgb(0, 70, 0)",
              border: "1px solid currentColor",
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize: "14px",
              marginRight: "10px",
              flexGrow: 1,
              textTransform: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "110px",
              "&:hover": {
                backgroundColor: "rgb(197, 231, 197)",
              },
            }}
          >
            AETC
          </Button> */}
          {/* New Surgical Notes Button */}
          <Button
            onClick={() => {
              setFilterSurgicalState(true);
              setFilterSoapierState(false);
              setFilterAETCState(false); // Reset other filters
              setFilterGyneacologyState(false);
              setFilterMedicalInpatientState(false);
            }}
            sx={{
              backgroundColor: filterSurgicalState ? "rgb(221, 238, 221)" : "",
              color: "rgb(0, 70, 0)",
              border: "1px solid currentColor",
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize: "14px",
              marginRight: "10px",
              flexGrow: 1,
              textTransform: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "120px",
              "&:hover": {
                backgroundColor: "rgb(197, 231, 197)",
              },
            }}
          >
            Surgical Notes
          </Button>
          {/* New Gyneacology Button */}
          {gender === "Female" && (
            <Button
              onClick={() => {
                setFilterGyneacologyState(true);
                setFilterSurgicalState(false);
                setFilterMedicalInpatientState(false);
                setFilterSoapierState(false);
                setFilterAETCState(false); // Reset other filters
              }}
              sx={{
                backgroundColor: filterGyneacologyState
                  ? "rgb(221, 238, 221)"
                  : "",
                color: "rgb(0, 70, 0)",
                border: "1px solid currentColor",
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontSize: "14px",
                marginRight: "10px",
                flexGrow: 1,
                textTransform: "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "120px",
                "&:hover": {
                  backgroundColor: "rgb(197, 231, 197)",
                },
              }}
            >
              Gyneacology{" "}
            </Button>
          )}
          {/* New Medical Inpatient Button */}
          <Button
            onClick={() => {
              setFilterMedicalInpatientState(true);
              setFilterGyneacologyState(false);
              setFilterSurgicalState(false);
              setFilterSoapierState(false);
              setFilterAETCState(false); // Reset other filters
            }}
            sx={{
              backgroundColor: filterMedicalInpatientState
                ? "rgb(221, 238, 221)"
                : "",
              color: "rgb(0, 70, 0)",
              border: "1px solid currentColor",
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize: "14px",
              marginRight: "10px",
              flexGrow: 1,
              textTransform: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "120px",
              "&:hover": {
                backgroundColor: "rgb(197, 231, 197)",
              },
            }}
          >
            Medical Inpatient{" "}
          </Button>
          <Button
            onClick={() => {
              setFilterSoapierState(false);
              setFilterAETCState(false);
              setFilterSurgicalState(false); // Reset surgical filter
              setFilterGyneacologyState(false);
              setFilterMedicalInpatientState(false);

              onClickFilterButton("All");
            }}
            sx={{
              backgroundColor:
                !filterSoapierState &&
                  !filterAETCState &&
                  !filterSurgicalState &&
                  !filterGyneacologyState &&
                  !filterMedicalInpatientState
                  ? "rgb(221, 238, 221)"
                  : "",
              color: "rgb(0, 70, 0)",
              border: "1px solid currentColor",
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize: "14px",
              marginRight: "10px",
              flexGrow: 1,
              textTransform: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "110px",
              "&:hover": {
                backgroundColor: "rgb(197, 231, 197)",
              },
            }}
          >
            All
          </Button>
        </div>
      </Box>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <MarkdownEditor onSubmit={onSubmit} />
      </Popover>
    </>
  );
};
