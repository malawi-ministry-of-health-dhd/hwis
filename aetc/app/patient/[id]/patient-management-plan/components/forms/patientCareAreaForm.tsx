"use client";

import React, { useState, useEffect } from "react";
import * as Yup from "yup";
import {
  FormikInit,
  FormFieldContainerLayout,
  FormValuesListener,
  RadioGroupInput,
  WrapperBox,
  MainButton,
  TextInputField,
} from "@/components";
import { toast } from "react-toastify";
import { useParameters } from "@/hooks";
import { getPatientVisitTypes } from "@/hooks/patientReg";
import {
  addEncounter,
  fetchConceptAndCreateEncounter,
} from "@/hooks/encounter";

import { concepts, encounters } from "@/constants";
import { Visit } from "@/interfaces";
import { useServerTime } from "@/contexts/serverTimeContext";
import { getConceptSet } from "@/hooks/getConceptSet";

type Prop = {
  onSubmit: (values: any) => void;
  onSkip: () => void;
};

const careAreaFormConfig: Record<
  | "gynaecological"
  | "surgical"
  | "medicalBench"
  | "shortStay"
  | "isolation"
  | "trauma"
  | "resuscitation"
  | "priority",
  { name: string; label: string }
> = {
  gynaecological: { name: concepts.GYNAE_BENCH, label: "Gynae Bench" },
  surgical: { name: concepts.SURGICAL_BENCH, label: "Surgical Bench" },
  medicalBench: { name: concepts.MEDICAL_BENCH, label: "Medical Bench" },
  shortStay: { name: concepts.SHORT_STAY, label: "Short Stay" },
  isolation: { name: concepts.ISOLATION, label: "Isolation Room" },
  trauma: { name: concepts.TRAUMA, label: "Trauma" },
  resuscitation: { name: concepts.RESUSCITATION, label: "Resuscitation" },
  priority: { name: concepts.PRIORITY, label: "Priority Area" },

  // other: { name: concepts.OTHER, label: "Other (Specify)" },
};
export const careAreaConfig = careAreaFormConfig;

const radioOptions = [
  { value: concepts.GYNAE_BENCH, label: concepts.GYNAE_BENCH },
  { value: concepts.SURGICAL_BENCH, label: concepts.SURGICAL_BENCH },
  { value: concepts.MEDICAL_BENCH, label: concepts.MEDICAL_BENCH },
  { value: concepts.SHORT_STAY, label: concepts.SHORT_STAY },
  { value: concepts.ISOLATION, label: concepts.ISOLATION },
  { value: concepts.TRAUMA, label: concepts.TRAUMA },
  { value: concepts.RESUSCITATION, label: concepts.RESUSCITATION },
  { value: concepts.PRIORITY, label: concepts.PRIORITY },
];

const schema = Yup.object().shape({
  careArea: Yup.string().required("Please select a patient care area."),
  // otherCareAreaSpecify: Yup.string().when("careArea", {
  //     is: (careArea: unknown) => careArea === "other",
  //     then: (schema) => schema.required("Please specify the other care area."),
  //     otherwise: (schema) => schema,
  // }),
});

export const PatientCareAreaForm = ({ onSubmit, onSkip }: Prop) => {
  const [formValues, setFormValues] = useState<any>({});

  const { params } = useParameters();
  const { mutate: submitEncounter } = fetchConceptAndCreateEncounter();
  const { data: patientVisits } = getPatientVisitTypes(params.id as string);
  const [activeVisit, setActiveVisit] = useState<Visit | undefined>(undefined);
  const { init, ServerTime } = useServerTime();
  const { data: aetcServiceAreas, isLoading: aetcServiceAreaLoading } =
    getConceptSet(concepts.AETC_SERVICE_AREAS);

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

    // Determine selected care area
    // let selectedCareArea = values.careArea;
    // careAreaFormConfig[values.careArea as keyof typeof careAreaFormConfig]
    //   ?.name;

    // If 'Other' is selected, use the specified other care area
    // if (values.careArea === "other") {
    //     selectedCareArea = values.otherCareAreaSpecify;
    // }

    const obs = [
      {
        concept: concepts.CARE_AREA, // UUID for care area
        value: values.careArea,
        obsDatetime: currentDateTime,
      },
    ];

    const payload = {
      encounterType: encounters.PATIENT_CARE_AREA, // UUID for encounter type
      visit: activeVisit?.uuid,
      patient: params.id,
      encounterDatetime: currentDateTime,
      obs,
    };

    try {
      await submitEncounter(payload);
      // toast.success("Patient Care Area submitted successfully!");
      onSubmit(values); //  This triggers navigation to the next step
    } catch (error) {
      console.error("Error submitting Patient Care Area: ", error);
      // toast.error("Failed to submit the form.");
    }
  };

  return (
    <FormikInit
      validationSchema={schema}
      initialValues={{ careArea: "", otherCareAreaSpecify: "" }}
      onSubmit={handleSubmit}
    >
      <FormValuesListener getValues={setFormValues} />
      <FormFieldContainerLayout title="Patient Care Area">
        <WrapperBox
          sx={{ bgcolor: "white", padding: "2ch", mb: "2ch", width: "100%" }}
        >
          <RadioGroupInput
            row
            options={aetcServiceAreas
              ?.map((area: any) => ({
                value: area?.name,
                label: area?.name,
              }))
              .filter((area: any) => area.label !== "Other")}
            name="careArea"
            label="Select Patient Care Area"
          />
          {/* Show input field for 'Other' option only when selected */}
          {/* {formValues.careArea === "other" && (
                        <WrapperBox>
                            <TextInputField
                                id="otherCareAreaSpecify"
                                label="Specify Other Care Area"
                                name="otherCareAreaSpecify"
                                placeholder="Specify the care area"
                            />
                        </WrapperBox>
                    )} */}
        </WrapperBox>
      </FormFieldContainerLayout>
    </FormikInit>
  );
};
