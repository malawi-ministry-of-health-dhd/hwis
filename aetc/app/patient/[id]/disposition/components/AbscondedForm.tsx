"use client";

import {
  MainGrid,
  MainPaper,
  FormikInit,
  TextInputField,
  FormDatePicker,
  FormTimePicker,
} from "@/components";

import * as Yup from "yup";
import { concepts, encounters } from "@/constants";
import { useParameters } from "@/hooks";
import { fetchConceptAndCreateEncounter, getPatientsEncounters } from "@/hooks/encounter";
import { getPatientVisitTypes } from "@/hooks/patientReg";
import { useEffect, useState } from "react";
import { Visit } from "@/interfaces";
import { closeCurrentVisit } from "@/hooks/visit";
import { useNavigation } from "@/hooks";
import { useServerTime } from "@/contexts/serverTimeContext";
import { AccordionComponent } from "@/components/accordion";
import { getObservationValue } from "@/helpers/emr";
import dayjs from "dayjs";

const validationSchema = Yup.object({
  lastSeenLocation: Yup.string().required("Last Seen Location is required"),
  dateAbsconded: Yup.date().required("Date of Absconding is required"),
  timeAbsconded: Yup.string().required("Time of Absconding is required"),
});

type AbscondedFormValues = {
  lastSeenLocation: string;
  dateAbsconded: string;
  timeAbsconded: string;
};

const initialValues: AbscondedFormValues = {
  lastSeenLocation: "",
  dateAbsconded: "",
  timeAbsconded: "",
};

export default function AbscondedForm({
  openPatientSummary,
}: {
  openPatientSummary: () => void;
}) {
  const { params } = useParameters();
  const { mutate: submitEncounter } = fetchConceptAndCreateEncounter();
  const [activeVisit, setActiveVisit] = useState<Visit | undefined>(undefined);
  const { data: patientVisits } = getPatientVisitTypes(params.id as string);
  const { ServerTime } = useServerTime();
  const { data: careAreaEncounters } = getPatientsEncounters(
    params.id as string,
    activeVisit?.uuid
      ? `encounter_type=${encounters.PATIENT_CARE_AREA}&visit=${activeVisit.uuid}`
      : undefined
  );
  const { data: triageEncounters } = getPatientsEncounters(
    params.id as string,
    activeVisit?.uuid
      ? `encounter_type=${encounters.TRIAGE_RESULT}&visit=${activeVisit.uuid}`
      : undefined
  );
  const [formInitialValues, setFormInitialValues] =
    useState<AbscondedFormValues>(initialValues);

  useEffect(() => {
    if (patientVisits) {
      const active = patientVisits.find((visit) => !visit.date_stopped);
      if (active) {
        setActiveVisit(active as unknown as Visit);
      }
    }
  }, [patientVisits]);

  useEffect(() => {
    const serverTime = ServerTime.getServerTimeString();
    const dateAbsconded = dayjs(serverTime).format("YYYY-MM-DD");
    const timeAbsconded = dayjs(serverTime).format("HH:mm:ss");

    const latestCareAreaEncounter = careAreaEncounters
      ? [...careAreaEncounters].sort(
          (a: any, b: any) =>
            new Date(b.encounter_datetime).getTime() -
            new Date(a.encounter_datetime).getTime()
        )[0]
      : undefined;

    const careAreaFromCareAreaEncounter =
      getObservationValue(latestCareAreaEncounter?.obs, concepts.CARE_AREA) ||
      latestCareAreaEncounter?.obs?.[0]?.value_text ||
      latestCareAreaEncounter?.obs?.[0]?.value;

    const latestTriageEncounter = triageEncounters
      ? [...triageEncounters].sort(
          (a: any, b: any) =>
            new Date(b.encounter_datetime).getTime() -
            new Date(a.encounter_datetime).getTime()
        )[0]
      : undefined;

    const careAreaFromTriage =
      getObservationValue(latestTriageEncounter?.obs, concepts.CARE_AREA) ||
      latestTriageEncounter?.obs?.[0]?.value_text ||
      latestTriageEncounter?.obs?.[0]?.value;

    const careArea = careAreaFromCareAreaEncounter || careAreaFromTriage;

    setFormInitialValues({
      lastSeenLocation: careArea || "",
      dateAbsconded,
      timeAbsconded,
    });
  }, [ServerTime, careAreaEncounters, triageEncounters]);

  const handleSubmit = async (values: any) => {
    const currentDateTime = ServerTime.getServerTimeString();

    const obs = [
      {
        concept: concepts.ABSCONDED,
        value: concepts.ABSCONDED,
        obsDatetime: currentDateTime,
        groupMembers: [
          {
            concept: concepts.LAST_SEEN_LOCATION,
            value: values.lastSeenLocation,
            obsDatetime: currentDateTime,
          },
          {
            concept: concepts.DATE_OF_ABSCONDING,
            value: values.dateAbsconded,
            obsDatetime: currentDateTime,
          },
          {
            concept: concepts.TIME_OF_ABSCONDING,
            value: values.timeAbsconded,
            obsDatetime: currentDateTime,
          },
        ],
      },
    ];

    const payload = {
      encounterType: encounters.DISPOSITION,
      visit: activeVisit?.uuid,
      patient: params.id,
      encounterDatetime: currentDateTime,
      obs,
    };

    try {
      await submitEncounter(payload);
      openPatientSummary();
    } catch (error) {
      console.error("Error submitting Absconded information: ", error);
    }
  };

  const sections = [
    {
      id: "abscondedForm",
      title: <h2>Absconded Form</h2>,
      content: (
        <AbscondedFormContent
          handleSubmit={handleSubmit}
          initialValues={formInitialValues}
        />
      ),
    },
  
  ];

  return (
    <MainGrid container spacing={2}>
      <MainGrid item xs={12}>
      <h2>Absconded Form</h2>
        {/* <AccordionComponent sections={sections} /> */}
        <AbscondedFormContent
            handleSubmit={handleSubmit}
            initialValues={formInitialValues} />
      </MainGrid>
    </MainGrid>
  );
}

function AbscondedFormContent({
  handleSubmit,
  initialValues,
}: {
  handleSubmit: (values: AbscondedFormValues) => void;
  initialValues: AbscondedFormValues;
}) {
  return (
    <FormikInit
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      submitButtonText="Submit"
      enableReinitialize={true}
    >
      <MainPaper sx={{ p: 3 }}>
        <MainGrid container spacing={2}>
          <MainGrid item xs={12}>
            <TextInputField
              id="lastSeenLocation"
              name="lastSeenLocation"
              label="Last Seen Location"
              placeholder="Enter the last known location"
              sx={{ width: "100%" }}
            />
          </MainGrid>

          <MainGrid item xs={12} md={6}>
            <FormDatePicker
              name="dateAbsconded"
              label="Date of Absconding"
              format="DD/MM/YYYY"
              sx={{ width: "100%" }}
            />
          </MainGrid>

          <MainGrid item xs={12} md={6}>
            <FormTimePicker
              name="timeAbsconded"
              label="Time of Absconding"
              sx={{ width: "100%" }}
            />
          </MainGrid>
        </MainGrid>
      </MainPaper>
    </FormikInit>
  );
}
