"use client";
import React, { useEffect, useRef, useState } from "react";
import { NewStepperContainer, SubSteps } from "@/components";
import {
  ComplaintsForm,
  // SurgeriesForm,
  AllergiesForm,
  MedicationsForm,
  PriorConditionsForm,
  ObstetricsForm,
  FamilyHistoryForm,
  // AdmissionsForm,
  ReviewOfSystemsForm,
  LastMealForm,
} from ".";

import { concepts, encounters, durationOptions } from "@/constants";
import { useNavigation } from "@/hooks";
import { fetchConceptAndCreateEncounter } from "@/hooks/encounter";
import { useParameters } from "@/hooks";
import { getOnePatient, getPatientVisitTypes } from "@/hooks/patientReg";
import { getObservations } from "@/helpers";
import { useFormLoading } from "@/hooks/formLoading";
import { CustomizedProgressBars } from "@/components/loader";
import { date } from "yup";
import { getConceptSet } from "@/hooks/getConceptSet";
import { useServerTime } from "@/contexts/serverTimeContext";

type Complaint = {
  complaint: string;
  duration: string;
  duration_unit: string;
};

type InputObservation = {
  concept: string;
  value: Complaint[];
  obsDatetime: string;
};

type OutputObservation = {
  concept: string;
  value: string | boolean;
};

const convertObservations = (
  input: InputObservation[]
): OutputObservation[] => {
  return input.flatMap((observation) =>
    observation.value.flatMap((complaint) => [
      {
        concept: complaint.complaint,
        value: true,
      },
      {
        concept:
          complaint.duration_unit === durationOptions[0]
            ? concepts.DURATION_OF_SYMPTOMS_HOURS
            : complaint.duration_unit === durationOptions[1]
              ? concepts.DURATION_OF_SYMPTOMS_DAYS
              : complaint.duration_unit === durationOptions[2]
                ? concepts.DURATION_OF_SYMPTOMS_WEEKS
                : complaint.duration_unit === durationOptions[3]
                  ? concepts.DURATION_OF_SYMPTOMS_MONTHS
                  : concepts.DURATION_OF_SYMPTOMS_YEARS,
        value: complaint.duration,
      },
    ])
  );
};

const symptomDurationUnits: Record<string, string> = {
  [durationOptions[0].toString()]: concepts.DURATION_OF_SYMPTOMS_HOURS,
  [durationOptions[1].toString()]: concepts.DURATION_OF_SYMPTOMS_DAYS,
  [durationOptions[2].toString()]: concepts.DURATION_OF_SYMPTOMS_WEEKS,
  [durationOptions[3].toString()]: concepts.DURATION_OF_SYMPTOMS_MONTHS,
  [durationOptions[4].toString()]: concepts.DURATION_OF_SYMPTOMS_YEARS,
};

export const MedicalHistoryFlow = () => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [formData, setFormData] = useState<any>({});
  const { navigateBack, navigateBackToProfile, navigateTo } = useNavigation();
  const { params } = useParameters();
  const { data: patient, isLoading } = getOnePatient(params?.id as string);

  const { data: allergenCats } = getConceptSet("Allergen Category");
  // const surgeriesFormRef = useRef<HTMLDivElement | null>(null);
  // const admissionsFormRef = useRef<HTMLDivElement | null>(null);
  const conditionsFormRef = useRef<HTMLDivElement | null>(null);
  const familyHistoryFormRef = useRef<HTMLDivElement | null>(null);
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const { init, ServerTime } = useServerTime();
  let dateTime: string;

  useEffect(() => {
    if (readyToSubmit) {
      dateTime = ServerTime.getServerTimeString();
      handleSubmitAll(0);
      setReadyToSubmit(false);
    }
  }, [readyToSubmit]);

  const {
    loading,
    setLoading,
    completed,
    setCompleted,
    message,
    setMessage,
    showForm,
    setShowForm,
    error,
    setError,
  } = useFormLoading();

  const {
    data: encounterResponse,
    mutateAsync: createEncounter,
    isPending: creatingEncounter,
    isSuccess: encounterCreated,
    isError: encounterError,
    error: errorMessage,
  } = fetchConceptAndCreateEncounter();

  const { data: patientVisits, isSuccess } = getPatientVisitTypes(
    params?.id as string
  );
  const activeVisit = patientVisits?.find((d) => !Boolean(d.date_stopped));

  if (isLoading) {
    return <div>Loading patient data...</div>;
  }

  // Construct steps based on patient gender

  // Construct steps with Events in second position
  const steps = [
    {
      id: 1,
      label: "Symptoms - Presenting Complaints",
      encounter: encounters.SAMPLE_HISTORY_PRESENTING_COMPLAINTS,
    },
    {
      id: 2,
      label: "Events",
      encounter: encounters.REVIEW_OF_SYSTEMS,
    },
    { id: 3, label: "Allergies", encounter: encounters.ALLERGIES },
    { id: 4, label: "Medications", encounter: encounters.SAMPLE_HISTORY_MEDICATION },
    {
      id: 5,
      label: "Prior/Existing condition",
      encounter: encounters.DIAGNOSIS,
    },
    // ...(patient?.gender === "Female"
    //   ? [
    //     {
    //       id: 6,
    //       label: "Gynaecology and Obstetrics",
    //       encounter: encounters.OBSTETRIC_HISTORY,
    //     },
    //   ]
    //   : []),
    {
      // id: patient?.gender === "Female" ? 7 : 6,
      id: 6,
      label: "Last Meal",
      encounter: encounters.SUMMARY_ASSESSMENT,
    },
  ];

  const redirectToSecondarySurvey = () => {
    navigateTo(`/patient/${params.id}/secondary-assessment`);
  };
  const handleSkip = () => {
    const nextStep = activeStep + 1;

    if (nextStep < steps.length) {
      setActiveStep(nextStep);
    } else {
      redirectToSecondarySurvey();
    }
  };

  const handlePrevious = () => {
    const previousStep = activeStep - 1;
    setActiveStep(previousStep);
  };

  const handlePresentingComplaintsNext = (values: any) => {
    setFormData((prev: any) => ({ ...prev, presentingComplaints: values }));
    handleSkip();
  };

  const handlePresentingComplaintsSubmission = async (
    values: any
  ): Promise<any> => {
    const myobs = convertObservations(getObservations(values, dateTime));

    const presentingSymptoms: any[] = [];
    let lastSymptom: any = null;

    myobs.forEach((obs) => {
      if (obs.value === true) {
        lastSymptom = {
          concept: concepts.CURRENT_COMPLAINTS_OR_SYMPTOMS,
          value: obs.concept,
          obsDatetime: dateTime,
          groupMembers: [],
        };
        presentingSymptoms.push(lastSymptom);
      } else if (lastSymptom) {
        lastSymptom.groupMembers.push({
          concept: obs.concept,
          value: obs.value,
          obsDatetime: dateTime,
        });
      }
    });

    try {
      await createEncounter({
        encounterType: encounters.SAMPLE_HISTORY_PRESENTING_COMPLAINTS,
        visit: activeVisit?.uuid,
        patient: params.id,
        encounterDatetime: dateTime,
        obs: presentingSymptoms,
      });
    } catch (error: any) {
      throw error;
    }
  };

  const handleAllergiesNext = (values: any) => {
    setFormData((prev: any) => ({ ...prev, allergies: values }));
    handleSkip();
  };

  const handleAllergiesSubmission = async (values: any): Promise<any> => {
    if (values?.noAllergies) {
      try {
        await createEncounter({
          encounterType: encounters.ALLERGIES,
          visit: activeVisit?.uuid,
          patient: params.id,
          encounterDatetime: dateTime,
          obs: [
            {
              concept: concepts.ALLERGEN_CATEGORY,
              obsDatetime: dateTime,
              value: "Patient has no known allergies",
            },
          ],
        });
        console.log("No known allergies recorded");
      } catch (error: any) {
        throw error;
      }
      return;
    }

    const groupedAllergies = values[concepts.ALLERGY].reduce(
      (acc: any, allergy: any) => {
        if (!acc[allergy.group]) {
          acc[allergy.group] = [];
        }
        acc[allergy.group].push(allergy);
        return acc;
      },
      {}
    );

    const observationsPayload = Object.keys(groupedAllergies).map(
      (groupKey) => {
        const groupConcept = groupKey;
        const chunk = groupedAllergies[groupKey].map(
          (allergy: { value: any; label: string | string[] }) => {
            let conceptValue = concepts.ALLERGEN;
            let value = allergy.value;
            if (allergy.label.includes("Other Medical Substance Allergen")) {
              conceptValue = concepts.OTHER_MEDICAL_SUBSTANCE_ALLERGY;
              value = values[concepts.OTHER_MEDICAL_SUBSTANCE_ALLERGY];
            }

            if (allergy.label.includes("Other Substance Allergen")) {
              conceptValue = concepts.OTHER_SUBSTANCE_ALLERGY;
              value = values[concepts.OTHER_SUBSTANCE_ALLERGY];
            }

            if (allergy.label.includes("Other Medication Allergen")) {
              conceptValue = concepts.OTHER_MEDICATION_ALLERGY;
              value = values[concepts.OTHER_MEDICATION_ALLERGY];
            }

            if (allergy.label.includes("Other Food Allergen")) {
              conceptValue = concepts.OTHER_FOOD_ALLERGY;
              value = values[concepts.OTHER_FOOD_ALLERGY];
            }

            return {
              concept: conceptValue,
              value: value,
              obsDateTime: dateTime,
            };
          }
        );

        return {
          concept: concepts.ALLERGEN_CATEGORY,
          obsDatetime: dateTime,
          value: groupConcept,
          groupMembers: chunk,
        };
      }
    );

    const allergiesData: any[] = [];
    const medicationCatKey = allergenCats[0].uuid;
    const medicalSubstanceCatKey = allergenCats[1].uuid;
    const substanceCatKEy = allergenCats[2].uuid;
    const foodCatKey = allergenCats[3].uuid;

    observationsPayload.forEach(async (observation) => {
      const detailKeyMap = {
        [medicationCatKey as string]: "medication_Allergy_Details",
        [medicalSubstanceCatKey]: "medical_Substance_Allergy_Details",
        [substanceCatKEy]: "substance_Allergy_Details",
        [foodCatKey]: "food_Allergy_Details",
      };

      const allergyCategory = observation.value;
      const detailKey = detailKeyMap[allergyCategory];

      if (detailKey && values[detailKey]) {
        observation.groupMembers.push({
          concept: concepts.DESCRIPTION,
          value: values[detailKey],
          obsDatetime: dateTime,
        });
      }
      allergiesData.push(observation);
    });

    try {
      const response = await createEncounter({
        encounterType: encounters.ALLERGIES,
        visit: activeVisit?.uuid,
        patient: params.id,
        encounterDatetime: dateTime,
        obs: allergiesData,
      });
      console.log("Encounter successfully created:", response);
    } catch (error: any) {
      throw error;
    }
  };

  function handleMedicationsNext(values: any): void {
    setFormData((prev: any) => ({ ...prev, medications: values }));
    handleSkip();
  }

  async function handleMedicationsSubmission(values: any): Promise<any> {
    if (values?.none) {
      try {
        await createEncounter({
          encounterType: encounters.SAMPLE_HISTORY_MEDICATION,
          visit: activeVisit?.uuid,
          patient: params.id,
          encounterDatetime: dateTime,
          obs: [
            {
              concept: concepts.DESCRIPTION,
              obsDatetime: dateTime,
              value: "Patient was not prescribed any medication",
            },
          ],
        });
        console.log("No medications recorded");
      } catch (error: any) {
        throw error;
      }
      return;
    }

    // Check if medications is just a string (new format)
    if (typeof values.medications === 'string') {
      try {
        await createEncounter({
          encounterType: encounters.SAMPLE_HISTORY_MEDICATION,
          visit: activeVisit?.uuid,
          patient: params.id,
          encounterDatetime: dateTime,
          obs: [
            {
              concept: concepts.DESCRIPTION,
              obsDatetime: dateTime,
              value: values.medications,
            },
          ],
        });
        console.log("Medications encounter successfully created");
      } catch (error: any) {
        throw error;
      }
      return;
    }


    const observations = getObservations(values, dateTime);
    const medicationObs = observations[0]?.value || [];

    const durationUnits: Record<string, string> = {
      [durationOptions[0].toString()]: concepts.DURATION_ON_MEDICATION_HOURS,
      [durationOptions[1].toString()]: concepts.DURATION_ON_MEDICATION_DAYS,
      [durationOptions[2].toString()]: concepts.DURATION_ON_MEDICATION_WEEKS,
      [durationOptions[3].toString()]: concepts.DURATION_ON_MEDICATION_MONTHS,
      [durationOptions[4].toString()]: concepts.DURATION_ON_MEDICATION_YEARS,
    };

    const doseUnits: Record<string, string> = {
      "Milligrams (mg)": concepts.DOSE_IN_MILLIGRAMS,
      "Micrograms (µg)": concepts.DOSE_IN_MICROGRAMS,
      "Grams (g)": concepts.DOSE_IN_GRAMS,
      "International Units (IU)": concepts.DOSE_IN_IU,
      "Milliliters (ml)": concepts.DOSE_IN_MILLIMETER,
      "Millimoles (mmol)": concepts.DOSE_IN_MILLIMOLES,
    };

    const observationsPayload = medicationObs.map((medication: any) => {
      const unitconcept = doseUnits[medication.medication_dose_unit];
      const durationUnitConcept =
        durationUnits[medication.medication_duration_unit];
      return {
        concept: concepts.DRUG_GIVEN,
        obsDatetime: dateTime,
        value: medication.name,
        groupMembers: [
          {
            concept: concepts.MEDICATION_DATE_LAST_TAKEN,
            value: medication.medication_date_last_taken,
          },
          {
            concept: concepts.MEDICATION_DATE_OF_LAST_PRESCRIPTION,
            value: medication.medication_date_of_last_prescription,
          },
          {
            concept: concepts.MEDICATION_FREQUENCY,
            value: medication.medication_frequency,
          },
          {
            concept: unitconcept,
            value: medication.medication_dose,
          },
          {
            concept: durationUnitConcept,
            value: medication.medication_duration,
          },
          {
            concept: concepts.MEDICATION_FORMULATION,
            value: medication.formulation,
          },
          {
            concept: concepts.SELF_MEDICATED,
            value: medication.medication_self_medicated,
          },
        ] as OutputObservation[],
      };
    });

    try {
      const response = await createEncounter({
        encounterType: encounters.SAMPLE_HISTORY_MEDICATION,
        visit: activeVisit?.uuid,
        patient: params.id,
        encounterDatetime: dateTime,
        obs: observationsPayload,
      });
      console.log("Encounter successfully created:", response);
    } catch (error: any) {
      throw error;
    }
  }

  const scrollToDiv = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };


  function handleConditionsNext(values: any): void {
    setFormData((prev: any) => ({ ...prev, conditions: values }));
    handleSkip(); // Changed from scrollToDiv(surgeriesFormRef) to handleSkip()
  }


  async function handleConditionsSubmission(values: any): Promise<any> {
    if (values?.none) {
      try {
        await createEncounter({
          encounterType: encounters.DIAGNOSIS,
          visit: activeVisit?.uuid,
          patient: params.id,
          encounterDatetime: dateTime,
          obs: [
            {
              concept: concepts.DIAGNOSIS_DATE,
              obsDatetime: dateTime,
              value: "Patient has no prior/existing conditions",
            },
          ],
        });
        console.log("No prior/existing conditions recorded");
      } catch (error: any) {
        throw error;
      }
      return;
    }

    // Existing conditions submission logic
    const observationsPayload = values.conditions.map((condition: any) => {
      return {
        concept: concepts.DIAGNOSIS_DATE,
        obsDatetime: dateTime,
        value: condition.date,
        groupMembers: [
          { concept: concepts.ICD11_DIAGNOSIS, value: condition.name },
          { concept: concepts.ON_TREATMENT, value: condition.onTreatment },
          {
            concept: concepts.ADDITIONAL_DIAGNOSIS_DETAILS,
            value: condition.additionalDetails,
          },
        ] as OutputObservation[],
      };
    });

    try {
      await createEncounter({
        encounterType: encounters.DIAGNOSIS,
        visit: activeVisit?.uuid,
        patient: params.id,
        encounterDatetime: dateTime,
        obs: observationsPayload,
      });
      console.log("Conditions encounter successfully created");
    } catch (error: any) {
      throw error;
    }

    // NEW: Handle surgeries if provided
    if (values.surgeries && values.surgeries.trim() !== "") {
      try {
        await createEncounter({
          encounterType: encounters.SURGICAL_HISTORY,
          visit: activeVisit?.uuid,
          patient: params.id,
          encounterDatetime: dateTime,
          obs: [
            {
              concept: concepts.SURGICAL_PROCEDURE,
              obsDatetime: dateTime,
              value: values.surgeries,
            },
          ],
        });
        console.log("Surgeries encounter successfully created");
      } catch (error: any) {
        throw error;
      }
    }

    // NEW: Handle previous admissions if provided
    if (values.previousAdmissions && values.previousAdmissions.trim() !== "") {
      try {
        await createEncounter({
          encounterType: encounters.PATIENT_ADMISSIONS,
          visit: activeVisit?.uuid,
          patient: params.id,
          encounterDatetime: dateTime,
          obs: [
            {
              concept: concepts.ADMISSION_DATE,
              obsDatetime: dateTime,
              value: values.previousAdmissions,
            },
          ],
        });
        console.log("Admissions encounter successfully created");
      } catch (error: any) {
        throw error;
      }
    }
  }



  function handleObstetricsNext(values: any): void {
    setFormData((prev: any) => ({ ...prev, obstetrics: values }));
    handleSkip();
  }

  async function handleObstetricsSubmission(values: any): Promise<any> {
    const obstetricsObs = values;
    const contraceptives = obstetricsObs.contraceptive_history.map(
      (item: { id: any }) => ({
        concept: item.id,
        value: true,
      })
    );

    const myObs =
      obstetricsObs.pregnant === "Yes"
        ? [
          {
            concept: concepts.AGE_AT_MENARCHE,
            value: obstetricsObs.age_at_menarche,
          },
          {
            concept: concepts.DATE_OF_LAST_MENSTRUAL,
            value: obstetricsObs.last_menstral,
          },
          {
            concept: concepts.GESTATION_WEEKS,
            value: obstetricsObs.gestational_age,
          },
          {
            concept: concepts.PREVIOUS_PREGNANCIES,
            value: obstetricsObs.number_of_previous_pregnancies,
          },
        ]
        : [
          {
            concept: concepts.AGE_AT_MENARCHE,
            value: obstetricsObs.age_at_menarche,
          },
          {
            concept: concepts.DATE_OF_LAST_MENSTRUAL,
            value: obstetricsObs.last_menstral,
          },
          {
            concept: concepts.PREVIOUS_PREGNANCIES,
            value: obstetricsObs.number_of_previous_pregnancies,
          },
        ];

    myObs.push(...contraceptives);

    try {
      const response = await createEncounter({
        encounterType: encounters.OBSTETRIC_HISTORY,
        visit: activeVisit?.uuid,
        patient: params.id,
        encounterDatetime: dateTime,
        obs: myObs,
      });
      console.log("Encounter successfully created:", response);
    } catch (error: any) {
      throw error;
    }

    if (obstetricsObs.number_of_previous_pregnancies > 0) {
      const outcomes = obstetricsObs.previous_pregnancy_outcomes;
      const births = obstetricsObs.number_of_births;

      const observationsPayload = outcomes.map((outcome: any, index: any) => {
        if (outcome == concepts.LIVE_BIRTH) {
          return {
            person: params.id,
            concept: concepts.PREGENANCY_OUTCOME,
            obsDatetime: dateTime,
            value: true,
            groupMembers: [
              { concept: outcome, value: true },
              { concept: concepts.NUMBER_OF_BIRTHS, value: births[index] },
            ] as OutputObservation[],
          };
        }

        return {
          person: params.id,
          concept: concepts.PREGENANCY_OUTCOME,
          obsDatetime: dateTime,
          value: true,
          groupMembers: [
            { concept: outcome, value: true },
          ] as OutputObservation[],
        };
      });

      observationsPayload.forEach(async (observation: any) => {
        try {
          const response = await createEncounter({
            encounterType: encounters.OBSTETRIC_HISTORY,
            visit: activeVisit?.uuid,
            patient: params.id,
            encounterDatetime: dateTime,
            obs: [observation],
          });
          console.log("Encounter successfully created:", response);
        } catch (error: any) {
          throw error;
        }
      });
    }
  }

  function handleReviewNext(values: any): void {
    setFormData((prev: any) => ({ ...prev, review: values }));
    // scrollToDiv(familyHistoryFormRef);
    // setReadyToSubmit(true);
    handleSkip();


  }

  function handleLastMealNext(values: any): void {
    setFormData((prev: any) => ({ ...prev, lastMeal: values }));
    // handleSkip();
    setReadyToSubmit(true);

  }

  function handleLastMealSkip(): void {
    // When last meal is skipped (patient did not eat), we still need to trigger submission
    // Don't add lastMeal to formData, but trigger the submission of all other forms
    setReadyToSubmit(true);
  }

  async function handleLastMealSubmission(values: any): Promise<any> {
    if (values?.didNotEat) {
      try {
        await createEncounter({
          encounterType: encounters.SUMMARY_ASSESSMENT,
          visit: activeVisit?.uuid,
          patient: params.id,
          encounterDatetime: dateTime,
          obs: [
            {
              concept: concepts.TIME_OF_LAST_MEAL,
              obsDatetime: dateTime,
              value: "Patient did not eat",
            },
          ],
        });
        console.log("No last meal recorded");
      } catch (error: any) {
        throw error;
      }
      return;
    }

    const lastMealDate = values.dateOfMeal;
    const lastMealDescription = values.descriptionOfLastMeal;

    const lastMealObs = {
      concept: concepts.TIME_OF_LAST_MEAL,
      value: lastMealDate,
      obsDatetime: dateTime,
      groupMembers: [
        {
          concept: concepts.DESCRIPTION_OF_LAST_MEAL,
          value: lastMealDescription,
        },
      ],
    };

    try {
      const response = await createEncounter({
        encounterType: encounters.SUMMARY_ASSESSMENT,
        visit: activeVisit?.uuid,
        patient: params.id,
        encounterDatetime: dateTime,
        obs: [lastMealObs],
      });

      console.log("Encounter successfully created:", response);
    } catch (error: any) {
      throw error;
    }
  }


  // 4. The complete updated handleReviewSubmission should be:
  async function handleReviewSubmission(values: any): Promise<any> {
    // Handle History of Presenting Complaints
    const historyOfComplaints = values["historyOfPresentingComplaints"];

    if (historyOfComplaints) {
      const historyOfComplaintsObs = {
        concept: concepts.PRESENTING_HISTORY,
        value: historyOfComplaints,
      };

      try {
        await createEncounter({
          encounterType: encounters.SUMMARY_ASSESSMENT,
          visit: activeVisit?.uuid,
          patient: params.id,
          encounterDatetime: dateTime,
          obs: [
            {
              concept: concepts.PRESENTING_HISTORY,
              value: true,
              obsDatetime: dateTime,
              groupMembers: [historyOfComplaintsObs],
            },
          ],
        });
        console.log("History of presenting complaints submitted successfully");
      } catch (error: any) {
        throw error;
      }
    }

    // Handle Trauma/Injury History
    if (values["wasInjured"] === "No") {
      try {
        await createEncounter({
          encounterType: encounters.REVIEW_OF_SYSTEMS,
          visit: activeVisit?.uuid,
          patient: params.id,
          encounterDatetime: dateTime,
          obs: [
            {
              concept: concepts.REVIEW_OF_SYSTEMS_TRAUMA,
              value: "Patient was not injured",
              obsDatetime: dateTime,
            },
          ],
        });
        console.log("No injury recorded");
      } catch (error: any) {
        throw error;
      }
      return;
    }

    if (values["wasInjured"] === "Yes") {
      type InjuryMechanismList = {
        [key: string]: string;
      };
      const injuryMechanismList: InjuryMechanismList = {
        assault: concepts.ASSAULT,
        roadTraffic: concepts.ROAD_TRAFFIC_ACCIDENT,
        fall: concepts.FALL,
        bite: concepts.BITE,
        gunshot: concepts.GUNSHOT,
        collapse: concepts.BUILDING_COLLAPSE,
        selfInflicted: concepts.SELF_HARM,
        burns: concepts.BURN_INJURY,
        drowning: concepts.DROWNING,
        other: concepts.OTHER,
      };

      const mechanism = Object.keys(injuryMechanismList).filter(
        (key) => values[key] === true
      );

      const timeOfInjury = values["timeOfInjury"].$d.toLocaleString();

      const traumaObs = [];

      for (let key of mechanism) {
        const commentKey = `${key}Comment`;
        const injuryComment = values[commentKey];
        const injuryMechanismObs = {
          concept: injuryMechanismList[key],
          value: injuryComment,
        };
        traumaObs.push(injuryMechanismObs);
      }

      const timeOfInjuryObs = {
        concept: concepts.TIME_OF_INJURY,
        value: timeOfInjury,
      };

      const consciousnessObs = {
        concept: concepts.LOSS_OF_CONSCIOUSNESS,
        value: values["lostConsciousness"],
      };

      const occupationalObs = {
        concept: concepts.OCCUPATIONAL_INJURY,
        value: values["occupationalInjury"],
      };

      traumaObs.push(timeOfInjuryObs, consciousnessObs, occupationalObs);

      if (values["assaultType"]) {
        const assaultIndex = traumaObs.findIndex(
          (obs) => obs.concept === injuryMechanismList["assault"]
        );
        if (assaultIndex !== -1) {
          traumaObs[assaultIndex].concept = injuryMechanismList["assault"];
        }
        const assaultType = values["assaultType"];
        const assaultTypeObs = {
          concept:
            assaultType === "Sexual"
              ? concepts.SEXUAL_ASSAULT
              : concepts.PHYSICAL_ASSAULT,
          value: true,
        };
        traumaObs.push(assaultTypeObs);
      }

      try {
        await createEncounter({
          encounterType: encounters.REVIEW_OF_SYSTEMS,
          visit: activeVisit?.uuid,
          patient: params.id,
          encounterDatetime: dateTime,
          obs: [
            {
              concept: concepts.REVIEW_OF_SYSTEMS_TRAUMA,
              value: true,
              obsDatetime: dateTime,
              groupMembers: traumaObs,
            },
          ],
        });
        console.log("Trauma/injury encounter successfully created");
      } catch (error: any) {
        throw error;
      }
    }
  }


  function handleFamilyNext(values: any): void {
    if (Object.values(values).some((value) => value === true)) {
      setFormData((prev: any) => ({ ...prev, family: values }));
    }

    setReadyToSubmit(true);
  }

  // async function handleFamilyHistorySubmission(values: any): Promise<any> {
  //   const conditionConcepts: { [key: string]: string } = {
  //     asthma: concepts.FAMILY_HISTORY_ASTHMA,
  //     hypertension: concepts.FAMILY_HISTORY_HYPERTENSION,
  //     diabetes_mellitus: concepts.FAMILY_HISTORY_DIABETES_MELLITUS,
  //     epilepsy: concepts.FAMILY_HISTORY_EPILEPSY,
  //     cancer: concepts.FAMILY_HISTORY_CANCER,
  //     tuberculosis: concepts.FAMILY_HISTORY_TUBERCULOSIS,
  //     other: concepts.FAMILY_HISTORY_OTHER_CONDITION,
  //   };

  //   const observations: { concept: string; value: any }[] = [];

  //   Object.keys(values).forEach((key) => {
  //     const value = values[key];

  //     if (key.includes("Relationship")) {
  //       const conditionKey = key.replace("Relationship", "");
  //       const relationship = value;

  //       if (values[conditionKey + "Type"]) {
  //         const conditionType = values[conditionKey + "Type"];

  //         observations.push({
  //           concept: conditionConcepts[conditionKey],
  //           value: conditionType,
  //         });
  //       } else if (key === "otherRelationship" && values["otherSpecify"]) {
  //         observations.push({
  //           concept: conditionConcepts["other"],
  //           value: values["otherSpecify"],
  //         });
  //       } else {
  //         observations.push({
  //           concept: conditionConcepts[conditionKey],
  //           value: true,
  //         });
  //       }

  //       observations.push({
  //         concept: concepts.RELATIONSHIP_TO_PATIENT,
  //         value: relationship,
  //       });
  //     }

  //     if (
  //       key.includes("Type") &&
  //       !values[key.replace("Type", "Relationship")]
  //     ) {
  //       const conditionKey = key.replace("Type", "");
  //       const conditionType = value;

  //       observations.push({
  //         concept: conditionConcepts[conditionKey],
  //         value: conditionType,
  //       });
  //     }
  //   });

  //   const groupedObservations = [];
  //   for (let i = 0; i < observations.length; i += 2) {
  //     groupedObservations.push([observations[i], observations[i + 1]]);
  //   }

  //   const encounterPayload = groupedObservations.map(
  //     ([condition, relation]) => ({
  //       ...condition,
  //       groupMembers: [relation],
  //     })
  //   );

  //   try {
  //     const response = await createEncounter({
  //       encounterType: encounters.FAMILY_MEDICAL_HISTORY,
  //       visit: activeVisit?.uuid,
  //       patient: params.id,
  //       encounterDatetime: dateTime,
  //       obs: encounterPayload,
  //     });
  //     console.log("Encounter successfully created:", response);
  //   } catch (error: any) {
  //     throw error;
  //   }
  // }

  async function handleSubmitAll(index: number) {
    if (index >= Object.keys(formData).length) {
      setLoading(false);
      handleSkip();
      return;
    }

    setLoading(true);

    const submissionHandlers: Record<string, (value: any) => Promise<any>> = {
      presentingComplaints: handlePresentingComplaintsSubmission,
      review: handleReviewSubmission,
      allergies: handleAllergiesSubmission,
      medications: handleMedicationsSubmission,
      conditions: handleConditionsSubmission,
      // surgeries: handleSurgeriesSubmission,
      // obstetrics: handleObstetricsSubmission,
      lastMeal: handleLastMealSubmission,
      // admissions: handleAdmissionsSubmission,
      // family: handleFamilyHistorySubmission,
    };

    const key = Object.keys(formData)[index];
    const encounter = formData[key];

    try {
      await submissionHandlers[key](encounter);
      console.log("submitting", encounter);
      setMessage(`${key} submitted`);
      setCompleted(index + 1);
    } catch (error) {
      console.error(`Error submitting ${key}:`, error);
      setError(true);
      setMessage(`Error occurred when submitting ${key}`);
    }

    setTimeout(() => {
      handleSubmitAll(index + 1);
    }, 2000);
  }

  return (
    <>
      {loading && (
        <>
          <CustomizedProgressBars
            message={message}
            progress={(completed / Object.keys(formData).length) * 100}
          />
        </>
      )}
      {!loading && (
        <NewStepperContainer
          setActive={setActiveStep}
          title="Medical History"
          steps={steps}
          active={activeStep}
          onBack={() => navigateBackToProfile()}
          showSubmittedStatus
        >
          <ComplaintsForm onSubmit={handlePresentingComplaintsNext} />
          <ReviewOfSystemsForm
            onSubmit={handleReviewNext}
            onSkip={handleSkip}
            onPrevious={handlePrevious}
          />
          <AllergiesForm
            onSubmit={handleAllergiesNext}
            onSkip={handleSkip}
            onPrevious={handlePrevious}
          />
          <MedicationsForm
            onSubmit={handleMedicationsNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
          />

          <PriorConditionsForm
            onSubmit={handleConditionsNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
          />
          {/* </SubSteps> */}
          {/* {patient?.gender === "Female" && (
            <ObstetricsForm
              onSubmit={handleObstetricsNext}
              onSkip={handlePrevious}
            />
          )} */}
          <LastMealForm
            onSubmit={handleLastMealNext}
            onPrevious={handlePrevious}
            onSkip={handleLastMealSkip}
          />
          {/* <ReviewOfSystemsForm
            onSubmit={handleReviewNext}
            onSkip={handleSkip}
            onPrevious={handlePrevious}
          /> */}

          {/* <SubSteps parent={patient?.gender === "Female" ? 6 : 5}>
            <div ref={familyHistoryFormRef}>
              <FamilyHistoryForm
                onSubmit={handleFamilyNext}
                onSkip={handlePrevious}
              />
            </div>
          </SubSteps> */}
        </NewStepperContainer>
      )}
    </>
  );
};
