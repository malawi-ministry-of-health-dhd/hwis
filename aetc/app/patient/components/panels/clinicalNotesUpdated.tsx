import { encounters } from "@/constants";

import { getPatientsEncounters } from "@/hooks/encounter";
import { useVisitDates } from "@/contexts/visitDatesContext";
import { useParameters, useSubmitEncounter } from "@/hooks";
import { MultiColumnNotes } from "./multiColumnDisplay";
import { SingleColumnNotes } from "./singleColumnDisplay";
import { PatientInfoTab, WrapperBox } from "@/components";
import { Panel } from "./panel";
import { formatClinicalNotesData } from "./formatters/formatClinicalNotes";
import { AddClinicalNotes } from "./addClinicalData";
import { getObservations } from "@/helpers";
import { useServerTime } from "@/contexts/serverTimeContext";
import { useClinicalNotes } from "@/hooks/useClinicalNotes";
import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import {
  GenerateGyneacologyNotesPDF,
  GyneacologyNotesPDFRef,
} from "../../[id]/gyneacology/components/generateGyneacologyNotesPDF";
import {
  GenerateMedicalInpatientlNotesPDF,
  MedicalInpatientNotesPDFRef,
} from "../../[id]/medicalInpatient/components/generateMedicalInpatientNotesPDF";
import {
  GenerateSurgicalNotesPDF,
  SurgicalNotesPDFRef,
} from "../../[id]/surgicalNotes/components/generateSurgicalNotesPDF";
import { TriageNotes } from "./notesComponents/triageNotes";

export const ClinicalNotesUpdated = () => {
  const { ServerTime } = useServerTime();
  const { params } = useParameters();
  const patientId = params.id as string;
  const { notes: clinicalNotes, refresh } = useClinicalNotes(patientId);
  const { selectedVisit } = useVisitDates();
  const [printoutTitle, setPrintoutTitle] = useState("All");
  const [filterSoapierState, setFilterSoapierState] = useState(false);
  const [filterAETCState, setFilterAETCState] = useState(false);
  const [filterSurgicalState, setFilterSurgicalState] = useState(false);
  const [filterGyneacologyState, setFilterGyneacologyState] = useState(false);
  const [filterMedicalInpatientState, setFilterMedicalInpatientState] =
    useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<SurgicalNotesPDFRef>(null);
  const gyneacologyRef = useRef<GyneacologyNotesPDFRef>(null);
  const medicalInpatientRef = useRef<MedicalInpatientNotesPDFRef>(null);

  const { handleSubmit } = useSubmitEncounter(
    encounters.CLINICAL_NOTES,
    () => ""
  );

  const printFunction = useReactToPrint({
    contentRef: contentRef,
  });

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

  const getEncounterRecordsByType = (encounterTypeUuid: any) => {
    const {
      data: patientHistory,
      isLoading: historyLoading,
    }: { data: any; isLoading: any } = getPatientsEncounters(
      patientId,
      `encounter_type=${encounterTypeUuid}&visit=${selectedVisit?.uuid}`
    );
    if (!Array.isArray(patientHistory)) return [];
    return patientHistory;
  };

  const getEncountersByType = (encounterTypeUuid: any) => {
    const records = getEncounterRecordsByType(encounterTypeUuid);
    return records[0]?.obs || [];
  };

  const getAllObservationsByType = (encounterTypeUuid: any) => {
    const records = getEncounterRecordsByType(encounterTypeUuid);
    return records.flatMap((record: any) =>
      Array.isArray(record?.obs) ? record.obs : []
    );
  };

  const addClinicalNote = (note: string) => {
    const data = { "Clinical notes construct": note };
    handleSubmit(getObservations(data, ServerTime.getServerTimeString())).then(
      () => refresh()
    );
  };

  const handleSurgicalPrintComplete = () => {
    console.log("PDF generated successfully!");
  };

  const notesData = formatClinicalNotesData(
    getEncountersByType,
    getAllObservationsByType
  );

  const filteredNotes = notesData.filter((notes) => {
    if (filterSoapierState) {
      return notes.title === "Soapier Notes";
    }
    if (filterAETCState) {
      return (
        notes.title === "Continuation Notes" ||
        notes.title === "Triage Information" ||
        notes.title === "Primary Survey" ||
        notes.title === "Secondary Survey" ||
        notes.title === "Patient Management Plan" ||
        notes.title === "Diagnosis" ||
        notes.title === "Investigation Plans" ||
        notes.title === "Laboratory or Radiology Findings"
      );
    }
    if (filterSurgicalState) {
      return notes.title === "Surgical Notes";
    }
    if (filterGyneacologyState) {
      return notes.title === "Gyneacology";
    }
    if (filterMedicalInpatientState) {
      return notes.title === "Medical Inpatient";
    }
    return true; // If no filters are active, include all notes
  });

  return (
    <Panel title="">

      <WrapperBox display={"flex"} justifyContent={"space-between"}>
        <AddClinicalNotes
          onAddNote={addClinicalNote}
          filterSoapierState={filterSoapierState}
          filterAETCState={filterAETCState}
          filterSurgicalState={filterSurgicalState}
          filterGyneacologyState={filterGyneacologyState}
          filterMedicalInpatientState={filterMedicalInpatientState}
          setFilterSoapierState={setFilterSoapierState}
          setFilterAETCState={setFilterAETCState}
          setFilterSurgicalState={setFilterSurgicalState}
          setFilterGyneacologyState={setFilterGyneacologyState}
          setFilterMedicalInpatientState={setFilterMedicalInpatientState}
          onDownload={handlePrint}
          surgicalData={{
            title: "Surgical Notes",
            data: [
              ...getEncountersByType(encounters.SURGICAL_NOTES_TEMPLATE_FORM),
            ],
            removeObs: [],
          }}
          gyneacologyData={{
            title: "Gyneacology",
            data: [...getEncountersByType(encounters.GYNEACOLOGY_WARD)],
            removeObs: [],
          }}
          medicalInpatientData={{
            title: "Medical Inpatient",
            data: [...getEncountersByType(encounters.MEDICAL_IN_PATIENT)],
            removeObs: [],
          }}
          onClickFilterButton={setPrintoutTitle}
        />
      </WrapperBox>

      {/* Conditional rendering based on filter states */}
      {!filterSurgicalState &&
        !filterGyneacologyState &&
        !filterMedicalInpatientState && (
          <div ref={contentRef}>
            <div>
              <PatientInfoTab />
              <div style={{ paddingTop: "10px" }}>
                <p style={{ marginLeft: "10px" }}>
                  Report type: {printoutTitle}
                </p>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "20px",
                    textAlign: "center",
                  }}
                >
                  Clinical Notes
                </div>
              </div>
            </div>
            <TriageNotes patientId={patientId} visitId={selectedVisit.uuid} />
            {/* <MultiColumnNotes columns={2} data={filteredNotes} /> */}
            <SingleColumnNotes data={filteredNotes} />

          </div>
        )}

      {/* Surgical Notes PDF Component */}
      {filterSurgicalState && (
        <GenerateSurgicalNotesPDF
          ref={pdfRef}
          onPrintComplete={handleSurgicalPrintComplete}
          showPreview={true}
        />
      )}

      {/* Gyneacology Notes PDF Component */}
      {filterGyneacologyState && (
        <GenerateGyneacologyNotesPDF
          ref={gyneacologyRef}
          onPrintComplete={handleSurgicalPrintComplete}
          showPreview={true}
        />
      )}

      {/* Medical Inpatient Notes PDF Component */}
      {filterMedicalInpatientState && (
        <GenerateMedicalInpatientlNotesPDF
          ref={medicalInpatientRef}
          onPrintComplete={handleSurgicalPrintComplete}
          showPreview={true}
        />
      )}
    </Panel>
  );
};
