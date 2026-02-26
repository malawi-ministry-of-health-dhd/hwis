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
import { getActivePatientDetails } from "@/hooks";

type Prop = {
  onClose: () => void;
  open: boolean;
  initialNotes?: any;
};

export const PatientInfoPrintDialog = ({
  onClose,
  open,
  initialNotes,
}: Prop) => {
  const { params } = useParameters();
  const [diagnosis, setDiagnosis] = useState<Obs[]>([]);
  const [presentingComplaints, setPresentingComplaints] = useState<Obs[]>([]);
  const [patientLabOrders, setPatientLabOrders] = useState<Array<any>>([]);
  const [printer, setPrinter] = useState("");
  const { selectedVisit } = useVisitDates();
  const { activeVisit, activeVisitId } = getActivePatientDetails();
  const [effectiveVisitId, setEffectiveVisitId] = useState<
    string | number | null
  >(null);
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

  const formatLabResult = (result: any): string => {
    if (result === null || result === undefined || result === "") {
      return "Pending";
    }

    if (typeof result === "string" || typeof result === "number") {
      return String(result);
    }

    if (Array.isArray(result)) {
      const values = result
        .map((item) => {
          if (item === null || item === undefined) return "";
          if (typeof item === "string" || typeof item === "number") {
            return String(item);
          }
          if (typeof item === "object") {
            if (item.value !== null && item.value !== undefined && item.value !== "") {
              return String(item.value);
            }
            if (
              item.result !== null &&
              item.result !== undefined &&
              item.result !== ""
            ) {
              return String(item.result);
            }
          }
          return "";
        })
        .filter(Boolean);

      return values.length ? values.join(", ") : "Pending";
    }

    if (typeof result === "object") {
      if (result.value !== null && result.value !== undefined && result.value !== "") {
        return String(result.value);
      }
      if (
        result.result !== null &&
        result.result !== undefined &&
        result.result !== ""
      ) {
        return String(result.result);
      }
      return "Pending";
    }

    return "Pending";
  };

  const { data: presentingComplaintsData } = getPatientsEncounters(
    params?.id as string,
    `encounter_type=${encounters.PRESENTING_COMPLAINTS}`,
  );

  const { data } = getPatientsEncounters(
    params?.id as string,
    `encounter_type=${encounters.OUTPATIENT_DIAGNOSIS}`,
  );
  const { data: disposition } = getPatientsEncounters(
    params?.id as string,
    `encounter_type=${encounters.DISPOSITION}`,
  );

  const { data: ordersData } = getPatientLabOrder(params?.id as string);

  useEffect(() => {
    if (selectedVisit?.id) {
      setEffectiveVisitId(selectedVisit.id);
      return;
    }
    const activeVisitObj = activeVisit as unknown as
      | { uuid?: string }
      | undefined;
    if (activeVisitObj?.uuid) {
      setEffectiveVisitId(activeVisitObj.uuid);
      return;
    }
    if (activeVisitId) {
      setEffectiveVisitId(activeVisitId);
      return;
    }
    setEffectiveVisitId(null);
  }, [selectedVisit, activeVisit, activeVisitId]);

  const matchesVisit = (encounter: any) => {
    if (!effectiveVisitId) return true;
    const visitIdString = String(effectiveVisitId);
    if (
      encounter?.visit?.uuid &&
      String(encounter.visit.uuid) === visitIdString
    )
      return true;
    if (encounter?.visit_id && String(encounter.visit_id) === visitIdString)
      return true;
    if (selectedVisit?.id && encounter?.visit_id === selectedVisit.id)
      return true;
    return false;
  };

  useEffect(() => {
    if (data) {
      const visitData = data?.filter((d: any) => matchesVisit(d));
      const finalDiagnosis = visitData?.[0]?.obs?.filter((ob) =>
        ob.names.find((n) => n.name === concepts.FINAL_DIAGNOSIS),
      );
      setDiagnosis(finalDiagnosis);
    }
  }, [data, selectedVisit, effectiveVisitId]);

  useEffect(() => {
    if (ordersData) {
      setPatientLabOrders(ordersData);
    }
  }, [ordersData]);

  useEffect(() => {
    if (presentingComplaintsData) {
      const visitData = presentingComplaintsData.filter((d: any) =>
        matchesVisit(d),
      );
      setPresentingComplaints(visitData?.[0]?.obs);
    }
  }, [presentingComplaintsData, selectedVisit, effectiveVisitId]);

  useEffect(() => {
    if (initialNotes) {
      setNotes(initialNotes);
      // still allow summary meta to be set from disposition
    }
    if (disposition) {
      const visitDisposition = disposition.filter((d: any) =>
        matchesVisit(d),
      )[0];
      const dischargedOb = visitDisposition?.obs.find((d: Obs) =>
        d.names.find((n) => n.name == concepts.DISCHARGE_HOME),
      );
      const dischargeNotes = getObservationValue(
        dischargedOb?.children,
        concepts.DISCHARGE_NOTES,
      );
      const dischargePlan = getObservationValue(
        dischargedOb?.children,
        concepts.DISCHARGE_PLAN,
      );
      const followUpDetails = getObservationValue(
        dischargedOb?.children,
        concepts.FOLLOWUP_DETAILS,
      );
      const followUpPlan = getObservationValue(
        dischargedOb?.children,
        concepts.FOLLOWUP_PLAN,
      );
      const clinic = getObservationValue(
        dischargedOb?.children,
        concepts.SPECIALIST_CLINIC,
      );
      const homeCareInstructions = getObservationValue(
        dischargedOb?.children,
        concepts.HOME_CARE_INSTRUCTIONS,
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
  }, [disposition, selectedVisit, effectiveVisitId]);

  const handleOnPrint = async () => {
    const printableLabOrders = patientLabOrders.map((order) => ({
      ...order,
      tests: (order?.tests || []).map((test: any) => ({
        ...test,
        result: formatLabResult(test?.result),
      })),
    }));

    const zpl = generatePatientSummaryZPL({
      presentingComplaints,
      diagnosis,
      labOrders: printableLabOrders,
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
                  {formatLabResult(test?.result)}
                </Grid>
              </Grid>
            )),
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
