"use client";

import {
  MainGrid,
  MainPaper,
  FormikInit,
  TextInputField,
  FormDatePicker,
  RadioGroupInput,
} from "@/components";

import * as Yup from "yup";
import { concepts, encounters } from "@/constants";
import { useParameters } from "@/hooks";
import { fetchConceptAndCreateEncounter } from "@/hooks/encounter";
import { getPatientVisitTypes } from "@/hooks/patientReg";
import { useEffect, useState } from "react";
import { Visit } from "@/interfaces";
import { AccordionWithMedication } from "./AccordionWithMedication";
import { useServerTime } from "@/contexts/serverTimeContext";
import { AccordionComponent } from "@/components/accordion";

const validationSchema = Yup.object({
  reasonForRefusal: Yup.string().required("Reason for refusal is required"),
  plansToReturn: Yup.string().required(
    "Please select plans to return for treatment"
  ),
  dateOfRefusal: Yup.date().required("Date of refusal is required"),
  witnessName: Yup.string().required("Witness name is required"),
});

const initialValues = {
  reasonForRefusal: "",
  plansToReturn: "",
  dateOfRefusal: "",
  witnessName: "",
};

export default function RefusedTreatmentForm({
  openPatientSummary,
}: {
  openPatientSummary: () => void;
}) {
  const { params } = useParameters();
  const { mutate: submitEncounter } = fetchConceptAndCreateEncounter();
  const [activeVisit, setActiveVisit] = useState<Visit | undefined>(undefined);
  const { data: patientVisits } = getPatientVisitTypes(params.id as string);
  const { ServerTime } = useServerTime();

  useEffect(() => {
    if (patientVisits) {
      const active = patientVisits.find((visit) => !visit.date_stopped);
      if (active) {
        setActiveVisit(active as unknown as Visit);
      }
    }
  }, [patientVisits]);

  const handleSubmit = async (values: any) => {
    const currentDateTime = ServerTime.getServerTimeString();

    const obs = [
      {
        concept: concepts.REFUSED_HOSPITAL_TREATMENT,
        value: concepts.REFUSED_HOSPITAL_TREATMENT,
        obsDatetime: currentDateTime,
        groupMembers: [
          {
            concept: concepts.REASON_FOR_REFUSAL,
            value: values.reasonForRefusal,
            obsDatetime: currentDateTime,
          },
          {
            concept: concepts.PLANS_TO_RETURN_FOR_TREATMENT,
            value: values.plansToReturn,
            obsDatetime: currentDateTime,
          },
          {
            concept: concepts.DATE_OF_REFUSAL,
            value: values.dateOfRefusal,
            obsDatetime: currentDateTime,
          },
          {
            concept: concepts.WITNESS_NAME,
            value: values.witnessName,
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
      console.error("Error submitting Refused Treatment information: ", error);
    }
  };

  const sections = [
    {
      id: "medication",
      title: <h2>Prescribe Medications</h2>,
      content: <AccordionWithMedication />,
    },
    {
      id: "refusedForm",
      title: <h2>Refused Treatment Form</h2>,
      content: <RefusedTreatmentFormContent handleSubmit={handleSubmit} />,
    },
  
  ];

  return (
    <MainGrid container spacing={2}>
      <MainGrid item xs={12}>
        <AccordionComponent sections={sections} />
      </MainGrid>
    </MainGrid>
  );
}

function RefusedTreatmentFormContent({
  handleSubmit,
}: {
  handleSubmit: (values: any) => void;
}) {
  return (
    <FormikInit
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      submitButtonText="Submit"
    >
      <MainPaper sx={{ p: 3 }}>
        <MainGrid container spacing={2}>
          <TextInputField
            id="reasonForRefusal"
            name="reasonForRefusal"
            label="Reason for Refusal"
            placeholder="Enter the reason for refusal"
            multiline
            rows={3}
            sx={{ width: "100%" }}
          />

          <RadioGroupInput
            name="plansToReturn"
            label="Plans to Return for Treatment"
            options={[
              { value: concepts.YES, label: "Yes" },
              { value: concepts.NO, label: "No" },
            ]}
            sx={{ width: "100%" }}
          />

          <FormDatePicker
            name="dateOfRefusal"
            label="Date of Refusal"
            width={"100%"}
            sx={{ my: "1rem" }}
          />

          <TextInputField
            id="witnessName"
            name="witnessName"
            label="Witness Name"
            placeholder="Enter name of witness"
            sx={{ width: "100%" }}
          />
        </MainGrid>
      </MainPaper>
    </FormikInit>
  );
}
