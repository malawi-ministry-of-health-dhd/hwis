import { GenericDialog } from "@/components";
import { SelectPrinter } from "@/components/selectPrinter";
import { concepts, encounters } from "@/constants";
import { useVisitDates } from "@/contexts/visitDatesContext";
import { getObservationValue } from "@/helpers/emr";
import { getHumanReadableDateTime } from "@/helpers/dateTime";
import { generatePatientSummaryZPL } from "@/helpers/zpl";

import { useParameters } from "@/hooks";
import {
  getConceptFromCacheOrFetch,
  getPatientsEncounters,
} from "@/hooks/encounter";
import { getPatientLabOrder } from "@/hooks/labOrder";
import { Obs } from "@/interfaces";

import { Box, Button, Divider, Grid, Stack, Typography } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";

type Prop = {
  onClose: () => void;
  open: boolean;
  initialNotes?: any
};

export const PatientInfoPrintDialog = ({ onClose, open, initialNotes }: Prop) => {
  const { params } = useParameters();
  const [diagnosis, setDiagnosis] = useState<Obs[]>([]);
  const [presentingComplaints, setPresentingComplaints] = useState<Obs[]>([]);
  const [patientLabOrders, setPatientLabOrders] = useState<Array<any>>([]);
  const [printer, setPrinter] = useState("");
  const { selectedVisit } = useVisitDates();
  const [summaryMeta, setSummaryMeta] = useState<{
    createdBy: string;
    completedAt: string;
  }>({ createdBy: "", completedAt: "" });

  const [notes, setNotes] = useState<any>({
    dischargeNotes: "",
    dischargePlan: "",
    followUpDetails: "",
    followUpPlan: "",
    clinic: "",
    homeCareInstructions: "",
  });

  const { data: presentingComplaintsData } = getPatientsEncounters(
    params?.id as string,
    `encounter_type=${encounters.PRESENTING_COMPLAINTS}`
  );

  const { data } = getPatientsEncounters(
    params?.id as string,
    `encounter_type=${encounters.OUTPATIENT_DIAGNOSIS}`
  );
  const { data: disposition } = getPatientsEncounters(
    params?.id as string,
    `encounter_type=${encounters.DISPOSITION}`
  );

  const { data: ordersData } = getPatientLabOrder(params?.id as string);

  useEffect(() => {
    if (data) {
      const finalDiagnosis = data?.filter(d=>d.visit_id==selectedVisit.id)[0]?.obs?.filter((ob) =>
        ob.names.find((n) => n.name === concepts.FINAL_DIAGNOSIS)
      );
      setDiagnosis(finalDiagnosis);
    }
  }, [data, selectedVisit]);

  useEffect(() => {
    if (ordersData) {
      setPatientLabOrders(ordersData);
    }
  }, [ordersData]);

  useEffect(() => {
    if (presentingComplaintsData) {
      setPresentingComplaints(
        presentingComplaintsData.filter(
          (d) => d.visit_id == selectedVisit.id
        )[0]?.obs
      );
    }
  }, [presentingComplaintsData, selectedVisit]);


  useEffect(() => {
    if (initialNotes) {
      setNotes(initialNotes);
      // still allow summary meta to be set from disposition
    }
    if (disposition) {
      const visitDisposition = disposition
        .filter((d) => d.visit_id == selectedVisit.id)[0];
      const dischargedOb = visitDisposition
        ?.obs.find((d: Obs) =>
          d.names.find((n) => n.name == concepts.DISCHARGE_HOME)
        );
      const dischargeNotes = getObservationValue(
        dischargedOb?.children,
        concepts.DISCHARGE_NOTES
      );
      const dischargePlan = getObservationValue(
        dischargedOb?.children,
        concepts.DISCHARGE_PLAN
      );
      const followUpDetails = getObservationValue(
        dischargedOb?.children,
        concepts.FOLLOWUP_DETAILS
      );
      const followUpPlan = getObservationValue(
        dischargedOb?.children,
        concepts.FOLLOWUP_PLAN
      );
      const clinic = getObservationValue(
        dischargedOb?.children,
        concepts.SPECIALIST_CLINIC
      );
      const homeCareInstructions = getObservationValue(
        dischargedOb?.children,
        concepts.HOME_CARE_INSTRUCTIONS
      );

      (async () => {
        const clinicConcept = await getConceptFromCacheOrFetch(clinic);
        setNotes({
          dischargeNotes,
          dischargePlan,
          followUpDetails,
          followUpPlan,
          clinic: clinicConcept?.data[0]?.short_name,
          homeCareInstructions,
        });
      })();

      if (visitDisposition) {
        setSummaryMeta({
          createdBy: visitDisposition.created_by || "",
          completedAt: visitDisposition.encounter_datetime || "",
        });
      }
    }
  }, [disposition, selectedVisit]);

  const handleOnPrint = async () => {
    const zpl = generatePatientSummaryZPL({
      presentingComplaints,
      diagnosis,
      labOrders: patientLabOrders,
      dischargeNotes: notes.dischargeNotes,
      dischargePlan: notes.dischargePlan,
      followUpPlan: `${notes.followUpDetails} | ${notes.clinic}`,
      homeCareInstructions: notes.homeCareInstructions,

      // prescribedMedications: prescribedMedicationRows, // ✅ include this
    });

    await axios.post(`${printer}/print`, { zpl });

    onClose();
  };

  return (
    <GenericDialog
      title="Patient Summary-QECH AETC"
      onClose={() => {}}
      open={open}
    >
      <Stack spacing={3}>
        {(summaryMeta.createdBy || summaryMeta.completedAt) && (
          <Box>
            <Typography
              variant="body2"
              sx={{ fontStyle: "italic", color: "text.secondary" }}
            >
              {summaryMeta.createdBy && `${summaryMeta.createdBy} `}
              {summaryMeta.completedAt &&
                getHumanReadableDateTime(summaryMeta.completedAt)}
            </Typography>
          </Box>
        )}

        {/* Presenting Complaints */}
        {/* <Box>
          <Typography variant="h6">Presenting Complaints</Typography>
          <Stack spacing={1} mt={1}>
            {presentingComplaints?.map((d, index) => (
              <Typography key={`complaint-${index}`}>{d.value}</Typography>
            ))} 
          </Stack>
        </Box> */}

        <Divider />

        {/* Final Diagnosis */}
        <Box>
          <Typography variant="h6">Final Diagnosis</Typography>
          <Stack spacing={1} mt={1}>
            {diagnosis?.map((d, index) => (
              <Typography key={`diagnosis-${index}`}>
                {d.value_text || d.value}
              </Typography>
            ))}
          </Stack>
        </Box>

        <Divider />

        {/* Lab Investigations */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Lab Investigations
          </Typography>

          <Grid container spacing={2} sx={{ fontWeight: "bold", mb: 1 }}>
            <Grid item xs={4}>
              Specimen
            </Grid>
            <Grid item xs={4}>
              Test
            </Grid>
            <Grid item xs={4}>
              Result
            </Grid>
          </Grid>

          {patientLabOrders.map((order, orderIndex) =>
            order?.tests?.map((test: any, testIndex: number) => (
              <Grid
                container
                spacing={2}
                key={`order-${orderIndex}-test-${testIndex}`}
              >
                <Grid item xs={4}>
                  {order.specimen?.name || "N/A"}
                </Grid>
                <Grid item xs={4}>
                  {test.name}
                </Grid>
                <Grid item xs={4}>
                  {test.result || "Pending"}
                </Grid>
              </Grid>
            ))
          )}
        </Box>
        <Divider />

        {Boolean(notes.dischargeNotes) && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Discharge Notes
            </Typography>
            <Typography>{notes.dischargeNotes}</Typography>
          </Box>
        )}
        {Boolean(notes.dischargePlan) && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Discharge Plan
            </Typography>
            <Typography>{notes.dischargePlan}</Typography>
          </Box>
        )}
        {Boolean(notes.followUpPlan) && notes.followUpPlan == "Yes" && (
          <>
            <Box>
              <Typography variant="h6" gutterBottom>
                Follow up Plan
              </Typography>

              <Typography>
                {notes.followUpDetails} ~ {notes.clinic}
              </Typography>
            </Box>
          </>
        )}
        {Boolean(notes.homeCareInstructions) && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Home care instructions
            </Typography>
            <Typography>{notes.homeCareInstructions}</Typography>
          </Box>
        )}

        {/* <Box>
          <Typography variant="h6" gutterBottom>
            Prescribed Medication
          </Typography>
          <PrescribedMedicationList onDataChange={setPrescribedMedicationRows} />
        </Box> */}
        <SelectPrinter setPrinter={setPrinter} />
      </Stack>
      <br />
      <Button variant="contained" onClick={handleOnPrint}>
        Print
      </Button>
      <Button variant="text" onClick={onClose}>
        Cancel
      </Button>
    </GenericDialog>
  );
};
