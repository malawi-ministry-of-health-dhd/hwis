import { Box, List, ListItem } from "@mui/material";
import { concepts, encounters } from "@/constants";
import { getObservationValue } from "@/helpers/emr";
import { getPatientsEncounters } from "@/hooks/encounter";
import { Obs } from "@/interfaces";
import { getHumanReadableDateTime } from "@/helpers/dateTime";

interface TriageNotesProps {
  visitId: string;
  patientId: string;
}

export const TriageNotes = ({ visitId, patientId }: TriageNotesProps) => {
  const { data: presentingComplaintsData }: { data: any } =
    getPatientsEncounters(
      patientId,
      `encounter_type=${encounters.PRESENTING_COMPLAINTS}&visit=${visitId}`
    );

  const { data: vitalsDetailsData }: { data: any } = getPatientsEncounters(
    patientId,
    `encounter_type=${encounters.VITALS}&visit=${visitId}`
  );
  const { data: triageCategory }: { data: any } = getPatientsEncounters(
    patientId,
    `encounter_type=${encounters.TRIAGE_RESULT}&visit=${visitId}`
  );
  // Filter presenting complaints
  const presentingComplaints: Obs[] =
    presentingComplaintsData?.[0]?.obs?.filter((ob: Obs) =>
      ob.names.some((n: any) => n.name === concepts.PRESENTING_COMPLAINTS)
    ) ?? [];

  // Get vital signs
  const temp = getObservationValue(
    vitalsDetailsData?.[0]?.obs,
    concepts.TEMPERATURE
  );
  const pulse = getObservationValue(
    vitalsDetailsData?.[0]?.obs,
    concepts.PULSE_RATE
  ) || getObservationValue(vitalsDetailsData?.[0]?.obs, "Pulse");
  const heart = getObservationValue(
    vitalsDetailsData?.[0]?.obs,
    concepts.HEART_RATE
  );
  const systolic = getObservationValue(
    vitalsDetailsData?.[0]?.obs,
    concepts.SYSTOLIC_BLOOD_PRESSURE
  );
  const diastolic = getObservationValue(
    vitalsDetailsData?.[0]?.obs,
    concepts.DIASTOLIC_BLOOD_PRESSURE
  );
  const respiratoryRate = getObservationValue(
    vitalsDetailsData?.[0]?.obs,
    concepts.RESPIRATORY_RATE
  );
  const oxygenSaturation = getObservationValue(
    vitalsDetailsData?.[0]?.obs,
    concepts.PULSE_OXIMETRY
  ) ||
    getObservationValue(
      vitalsDetailsData?.[0]?.obs,
      concepts.BLOOD_OXYGEN_SATURATION
    ) ||
    getObservationValue(vitalsDetailsData?.[0]?.obs, "Blood oxygen saturation");
  const glucose = getObservationValue(
    vitalsDetailsData?.[0]?.obs,
    concepts.GLUCOSE
  );
  const avpu = getObservationValue(vitalsDetailsData?.[0]?.obs, concepts.AVPU);

  const vitalSigns = [
    `Temperature: ${temp || " - "} °C`,
    `Pulse: ${pulse || " - "} bpm`,
    `Heart: ${heart || " - "} bpm`,
    `BP: ${systolic || " - "}/${diastolic || " - "} mmHg`,
    `Respiratory: ${respiratoryRate || " - "} breaths/min`,
    `Oxygen: ${oxygenSaturation || " - "} %`,
    `Glucose: ${glucose || " - "}`,
    `AVPU: ${avpu || " - "}`,
  ].join("   "); // All in one line separated by "|"




  const triageCategoryValue = getObservationValue(
    triageCategory?.[0]?.obs,
    concepts.TRIAGE_RESULT
  );
  const patientCareArea = getObservationValue(
    triageCategory?.[0]?.obs,
    concepts.CARE_AREA
  );

  return (
    <Box>
      <h3>Triage Information</h3>

      <List
        component="ol"
        sx={{
          listStyleType: "upper-alpha", // A, B, C...
          pl: 4,
        }}
      >
        {/* Presenting Complaints */}
        <ListItem sx={{ display: "list-item" }}>
          <span>Presenting Complaints:</span>{" "}
          {presentingComplaints.length > 0
            ? presentingComplaints
                .map((obs, index) => ` (${index + 1}). ` + obs.value)
                .join(", ")
            : "None recorded"}
        </ListItem>

        {/* Vital Signs */}
        <ListItem sx={{ display: "list-item" }}>
          <span>Vital Signs:</span> {vitalSigns}
        </ListItem>
        <ListItem sx={{ display: "list-item" }}>
          <span>Triage Category:</span> {triageCategoryValue}
        </ListItem>
        <ListItem sx={{ display: "list-item" }}>
          <span>Patient Care Area:</span> {patientCareArea}
        </ListItem>
      </List>
      <Box
        style={{
          color: "#7f8c8d",
          fontSize: "14px",
          letterSpacing: "0.2px",
          marginTop: "8px",
          fontStyle: "italic",
        }}
      >
        created by {vitalsDetailsData?.[0]?.created_by || "Unknown User"} on{" "}
        {getHumanReadableDateTime(vitalsDetailsData?.[0]?.encounter_datetime)}
      </Box>
    </Box>
  );
};
