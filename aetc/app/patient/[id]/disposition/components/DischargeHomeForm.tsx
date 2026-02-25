"use client";
import React, { useRef, useEffect, useState, useMemo } from "react";
import { useReactToPrint } from "react-to-print";
import {
  MainGrid,
  MainPaper,
  FormikInit,
  TextInputField,
  SearchComboBox,
  RadioGroupInput,
  PatientInfoTab,
  MainButton,
} from "@/components";
import { concepts, encounters } from "@/constants";
import { useParameters, getFacilities } from "@/hooks";
import {
  addEncounter,
  fetchConceptAndCreateEncounter,
  getPatientsEncounters,
} from "@/hooks/encounter";
import { getPatientVisitTypes } from "@/hooks/patientReg";
import * as Yup from "yup";
import { Visit } from "@/interfaces";
import { closeCurrentVisit } from "@/hooks/visit";
import { useNavigation } from "@/hooks";
import { MedicationsForm } from "../../consultation/components/medication";
import { AccordionComponent } from "@/components/accordion";
import { FaPlus } from "react-icons/fa";
import { Panel } from "../../../../patient/components/panels";
import { AccordionWithMedication } from "./AccordionWithMedication";
import { getConceptSet } from "@/hooks/getConceptSet";
import { useServerTime } from "@/contexts/serverTimeContext";
import { getServiceAreas } from "@/hooks/getServiceAreas";
import { toast } from "react-toastify";
import { Box, Typography } from "@mui/material";

export const dispositionFormConfig = {
  dischargeHome: {
    name: concepts.DISCHARGE_HOME,
    label: "Discharge home",
    groupMembersWithLabel: true,
    type: "string",
    children: [
      { concept: concepts.DISCHARGE_PLAN, label: "Discharge Plan" },
      {
        concept: concepts.FOLLOWUP_PLAN,
        label: "Follow-Up Plan",
        children: [
          { concept: concepts.FOLLOWUP_DETAILS, label: "Follow-Up Facility" },
          {
            concept: concepts.SPECIALIST_CLINIC,
            label: "Clinics",
          },
        ],
      },
      {
        concept: concepts.HOME_CARE_INSTRUCTIONS,
        label: "Home Care Instructions",
      },
      { concept: concepts.DISCHARGE_NOTES, label: "Discharge Notes" },

      // { concept: concepts.OTHER_SERVICE_AREA,
      //   label:"Other Service Area"
      // }
    ],
  },
  deathOutcome: {
    name: concepts.DEATH,
    label: "Death",
    groupMembersWithLabel: true,
    type: "string",
    children: [
      {
        concept: concepts.CAUSE_OF_DEATH,
        label: "Cause of Death",
      },
      {
        concept: concepts.FAMILY_INFORMED,
        label: "Family Informed",
      },
      {
        concept: concepts.RELATIONSHIP_TO_DECEASED,
        label: "Relationship to Deceased",
      },
      {
        concept: concepts.MORTUARY,
        label: "Mortuary",
      },
      {
        concept: concepts.LAST_OFFICE_CONDUCTED,
        label: "Last Office Conducted",
      },
      {
        concept: concepts.NAME_OF_HEALTH_WORKER_WHO_CONDUCTED_LAST_OFFICE,
        label: "Name of Health Worker Who Conducted Last Office",
      },
      {
        concept: concepts.DATE_OF_LAST_OFFICE,
        label: "Date of Last Office",
      },
    ],
  },
  absconded: {
    name: concepts.ABSCONDED,
    label: "Absconded",
    groupMembersWithLabel: true,
    type: "string",
    children: [
      {
        concept: concepts.LAST_SEEN_LOCATION,
        label: "Last Seen Location",
      },
      {
        concept: concepts.DATE_OF_ABSCONDING,
        label: "Date of Absconding",
      },
      {
        concept: concepts.TIME_OF_ABSCONDING,
        label: "Time of Absconding",
      },
    ],
  },
  admission: {
    name: concepts.ADMISSION,
    groupMembersWithLabel: true,
    label: "Admission",
    type: "string",
    children: [
      {
        concept: concepts.WARD,
        label: "Ward",
      },
      {
        concept: concepts.BED_NUMBER,
        label: "Bed number",
      },
      {
        concept: concepts.REASON_FOR_ADMISSION,
        label: "reason for admission",
      },
      {
        concept: concepts.SPECIALITY_DEPARTMENT,
        label: "Speciality Department",
      },
    ],
  },
  awaitingSpeciaty: {
    name: concepts.AWAITING_SPECIALITY_REVIEW,
    label: "Awaiting specialty review",
    groupMembersWithLabel: true,
    useLatestGroupMember: true,
    groupMembersOnly: true,
    type: "string",
    children: [
      {
        concept: concepts.SPECIALITY_DEPARTMENT,
        label: "Speciality Department",
      },
      {
        concept: concepts.REASON_FOR_REQUEST,
        label: "Reason for Request",
      },
      {
        concept: concepts.DATE_OF_ABSCONDING,
        label: "Date for Review",
        format: "date",
      },
    ],
  },
  refusedTreatment: {
    name: concepts.REFUSED_HOSPITAL_TREATMENT,
    label: "Refused Hospital Treatment",
    type: "string",
    groupMembersWithLabel: true,
    children: [
      {
        concept: concepts.REASON_FOR_REFUSAL,
        label: "Reason for refusal",
      },
      {
        concept: concepts.PLANS_TO_RETURN_FOR_TREATMENT,
        label: "Plans to return for treatment",
      },
      {
        concept: concepts.DATE_OF_REFUSAL,

        label: "Date of refusal",
      },
      {
        concept: concepts.WITNESS_NAME,
        label: "Witness name",
      },
    ],
  },
  transferOut: {
    name: concepts.TRANSFER_OUT,
    label: " Transfer Out",
    groupMembersWithLabel: true,
    children: [
      { concept: concepts.FACILITY_NAME, label: "Facility Name" },
      { concept: concepts.REASON_FOR_TRANSFER, label: "Reason for Transfer" },
      // { concept: concepts.TRANSFER_NOTES, label: "Transfer Notes" },
    ],
  },
};

export const mapDischargeHomeToPayload = (values: any, ServerTime: any) => {
  const currentDateTime = ServerTime.getServerTimeString();

  return {
    encounterType: encounters.DISPOSITION,
    encounterDatetime: currentDateTime,
    obs: {
      concept: concepts.DISCHARGE_HOME,
      value: concepts.DISCHARGE_HOME,
      obsDatetime: currentDateTime,
      groupMembers: [
        {
          concept: concepts.DISCHARGE_PLAN,
          value: values.dischargePlan,
          obsDatetime: currentDateTime,
        },
        {
          concept: concepts.FOLLOWUP_PLAN,
          value: values.followUpPlan,
          obsDatetime: currentDateTime,
        },
        {
          concept: concepts.HOME_CARE_INSTRUCTIONS,
          value: values.homeCareInstructions,
          obsDatetime: currentDateTime,
        },
        {
          concept: concepts.FOLLOWUP_DETAILS,
          value: values.followUpDetails,
          obsDatetime: currentDateTime,
        },
        {
          concept: concepts.DISCHARGE_NOTES,
          value: values.dischargeNotes,
          obsDatetime: currentDateTime,
        },
        {
          concept: concepts.SPECIALIST_CLINIC,
          value: values.specialistClinic || "",
          obsDatetime: currentDateTime,
        },
      ],
    },
  };
};

export const mapDeathToPayload = (values: any, ServerTime: any) => {
  const currentDateTime = ServerTime.getServerTimeString();

  return {
    encounterType: encounters.DISPOSITION,
    encounterDatetime: currentDateTime,
    obs: {
      concept: concepts.DEATH,
      value: concepts.DEATH,
      obsDatetime: currentDateTime,
      groupMembers: [
        {
          concept: concepts.CAUSE_OF_DEATH,
          value: values.causeOfDeath,
          obsDatetime: currentDateTime,
        },
        {
          concept: concepts.MORTUARY,
          value: values.mortuary,
          obsDatetime: currentDateTime,
        },
        {
          concept: concepts.LAST_OFFICE_CONDUCTED,
          value: values.lastOfficeConducted,
          obsDatetime: currentDateTime,
        },
        {
          concept: concepts.NAME_OF_HEALTH_WORKER_WHO_CONDUCTED_LAST_OFFICE,
          value: values.healthWorkerName,
          obsDatetime: currentDateTime,
        },
        {
          concept: concepts.DATE_OF_LAST_OFFICE,
          value: values.lastOfficeDate,
          obsDatetime: currentDateTime,
        },
      ],
    },
  };
};

// Define validationSchema outside the component
const validationSchema = Yup.object({
  specialistClinic: Yup.string().when("followUpPlan", {
    is: (followUpPlan: string) => followUpPlan === concepts.YES,
    then: (schema) => schema,
    otherwise: (schema) => schema.optional(),
  }),
});

const initialValues = {
  dischargePlan: "",
  followUpPlan: "",
  homeCareInstructions: "",
  followUpDetails: "",
  dischargeNotes: "",
  specialistClinic: "",
  otherServiceArea: "",
};

export default function DischargeHomeForm({
  openPatientSummary,
  setInitialNotes,
}: {
  openPatientSummary: () => void;
  setInitialNotes: (notes: any) => void;
}) {
  const { params } = useParameters();
  const { mutate: submitEncounter } = fetchConceptAndCreateEncounter();
  const [activeVisit, setActiveVisit] = useState<Visit | undefined>(undefined);
  const { data: patientVisits } = getPatientVisitTypes(params.id as string);
  const { data: diagnosisEncounters } = getPatientsEncounters(
    params.id as string,
    activeVisit?.uuid
      ? `encounter_type=${encounters.OUTPATIENT_DIAGNOSIS}&visit=${activeVisit.uuid}`
      : undefined
  );
  const isFinalDiagnosisReady = useMemo(
    () =>
      (diagnosisEncounters ?? []).some((encounter: any) =>
        (encounter?.obs ?? []).some(
          (ob: any) =>
            ob?.names?.some((n: any) => n?.name === concepts.FINAL_DIAGNOSIS) &&
            (ob?.value_text ?? ob?.value)
        )
      ),
    [diagnosisEncounters]
  );

  const { init, ServerTime } = useServerTime();

  const [otherId, setOtherId] = useState<string | null>(null);

  // Get service areas from concept set

  // Ref for printing
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Finds the active visit for the patient from their visit history
    if (patientVisits) {
      const active = patientVisits.find((visit) => !visit.date_stopped);
      if (active) {
        setActiveVisit(active as unknown as Visit);
      }
    }
  }, [patientVisits]);

  // Setup service areas - simplified

  const handleSubmit = async (values: any, serviceAreas: any) => {
    const currentDateTime = ServerTime.getServerTimeString();

    const hasFinalDiagnosis = (diagnosisEncounters ?? []).some(
      (encounter: any) =>
        (encounter?.obs ?? []).some(
          (ob: any) =>
            ob?.names?.some((n: any) => n?.name === concepts.FINAL_DIAGNOSIS) &&
            (ob?.value_text ?? ob?.value)
        )
    );

    if (!hasFinalDiagnosis) {
      toast.error("Final Diagnosis is required before submitting disposition.");
      return;
    }

    // Prepare service area information
    let serviceAreaValue = values.specialistClinic;
    if (values.specialistClinic === otherId && values.otherServiceArea) {
      serviceAreaValue = values.otherServiceArea;
    }

    setInitialNotes({
      dischargeNotes: values.dischargeNotes,
      dischargePlan: values.dischargePlan,
      followUpDetails: values.followUpDetails,
      followUpPlan: values.followUpPlan,
      clinic:
        serviceAreas.find(
          (service: any) => service.id === values.specialistClinic
        )?.label || values.specialistClinic,
      homeCareInstructions: values.homeCareInstructions,
    });

    const obs = [
      {
        concept: concepts.DISCHARGE_HOME,
        value: concepts.DISCHARGE_HOME,
        obsDatetime: currentDateTime,
        groupMembers: [
          {
            concept: concepts.DISCHARGE_PLAN,
            value: values.dischargePlan,
            obsDatetime: currentDateTime,
          },
          {
            concept: concepts.FOLLOWUP_PLAN,
            value: values.followUpPlan,
            obsDatetime: currentDateTime,
          },
          {
            concept: concepts.HOME_CARE_INSTRUCTIONS,
            value: values.homeCareInstructions,
            obsDatetime: currentDateTime,
          },
          {
            concept: concepts.FOLLOWUP_DETAILS,
            value: values.followUpDetails,
            obsDatetime: currentDateTime,
          },
          {
            concept: concepts.DISCHARGE_NOTES,
            value: values.dischargeNotes,
            obsDatetime: currentDateTime,
          },
          {
            concept: concepts.SPECIALIST_CLINIC,
            value: serviceAreaValue || "",
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
      // navigateTo("/dispositions");
      openPatientSummary();
    } catch (error) {
      console.error("Error submitting Discharge Home information: ", error);
    }
  };

  // Updated Print function using the new syntax
  const reactToPrintFn = useReactToPrint({ contentRef });

  const sections = [
    {
      id: "medications",
      title: <h2>Prescribe Medications</h2>,
      content: <AccordionWithMedication />,
    },
    {
      id: "DischargeHome",
      title: <h2>Discharge Home</h2>,
      content: (
        <DischargeForm
          handleSubmit={handleSubmit}
          setOtherId={setOtherId}
          otherId={otherId}
          contentRef={contentRef}
          isFinalDiagnosisReady={isFinalDiagnosisReady}
        />
      ),
    },
  
  ];

  return (
    <MainGrid container spacing={2}>
      <MainGrid item xs={12} lg={12}>
        <AccordionComponent sections={sections} />
      </MainGrid>
    </MainGrid>
  );
}

const DischargeForm = ({
  handleSubmit,
  contentRef,
  setOtherId,
  otherId,
  isFinalDiagnosisReady,
}: {
  handleSubmit: (values: any, serviceAreas: any) => void;
  contentRef: React.RefObject<HTMLDivElement>;
  setOtherId: (id: string | null) => void;
  otherId: string | null;
  isFinalDiagnosisReady: boolean;
}) => {
  const { data: facilities } = getFacilities();
  // Service Areas state
  const { serviceAreaOptions } = getServiceAreas();

  const [showOther, setShowOther] = useState(false);

  // Create dynamic validation schema including otherServiceArea validation
  useEffect(() => {
    if (serviceAreaOptions) {
      // Find the "Other" option if it exists
      const otherOption = serviceAreaOptions.find(
        (option: { id: string; label: string }) => option.label === "Other"
      );
      setOtherId(otherOption ? otherOption.id : null);
    }
  }, [serviceAreaOptions]);

  const getValidationSchema = () => {
    const schema = validationSchema.clone();

    if (otherId) {
      return schema.shape({
        otherServiceArea: Yup.string().when("specialistClinic", {
          is: (specialistClinic: string) => specialistClinic === otherId,
          then: (schema) => schema.required("Other Service Area is required"),
          otherwise: (schema) => schema.optional(),
        }),
      });
    }

    return schema;
  };
  return (
    <>
      <FormikInit
        initialValues={initialValues}
        validationSchema={getValidationSchema()}
        onSubmit={(values) => handleSubmit(values, serviceAreaOptions)}
        submitButton={isFinalDiagnosisReady}
      >
        {({ values, setFieldValue }) => {
          // Handle specialistClinic change for "Other" option
          useEffect(() => {
            if (values.specialistClinic === otherId) {
              setShowOther(true);
            } else {
              setShowOther(false);
              setFieldValue("otherServiceArea", "");
            }
          }, [values.specialistClinic, otherId, setFieldValue]);

          return (
            <>
              {!isFinalDiagnosisReady && (
                <Box
                  sx={{
                    mb: 2,
                    p: 1.5,
                    bgcolor: "#fff3cd",
                    border: "1px solid #ffeeba",
                    borderRadius: "4px",
                  }}
                >
                  <Typography variant="body2" color="text.primary">
                    Final Diagnosis is required before submitting disposition.
                  </Typography>
                </Box>
              )}
              <div ref={contentRef} className="printable-content">
                <div className="print-only">
                  <PatientInfoTab />
                  <p>
                    <strong>Discharge Plan:</strong> {values.dischargePlan}
                  </p>
                  <p>
                    <strong>Followup Plan:</strong> {values.followUpPlan}
                  </p>
                  <p>
                    <strong>Home care Instructions:</strong>{" "}
                    {values.homeCareInstructions}
                  </p>

                  {/* Conditionally render Follow-Up Details */}
                  {values.followUpPlan === concepts.YES && (
                    <>
                      <p>
                        <strong>Follow up details:</strong>{" "}
                        {values.followUpDetails}
                      </p>

                      <p>
                        <strong>Service Area:</strong>{" "}
                        {values.specialistClinic === otherId
                          ? values.otherServiceArea
                          : serviceAreaOptions.find(
                              (option) => option.id === values.specialistClinic
                            )?.label || values.specialistClinic}
                      </p>
                    </>
                  )}

                  <p>
                    <strong>Discharge notes:</strong> {values.dischargeNotes}
                  </p>
                </div>
              </div>

              <MainGrid container spacing={2}>
                {/* LEFT COLUMN - Discharge Information */}
                <MainGrid item xs={12} md={6}>
                  {/* Discharge Notes */}
                  <MainGrid item xs={12} sx={{ mb: 2 }}>
                    <TextInputField
                      id="dischargeNotes"
                      name="dischargeNotes"
                      label="Discharge Notes"
                      sx={{ width: "100%" }}
                      multiline
                      rows={3}
                      placeholder="Write discharge notes"
                      disabled={!isFinalDiagnosisReady}
                    />
                  </MainGrid>

                  {/* Discharge Plan */}
                  <MainGrid item xs={12} sx={{ mb: 2 }}>
                    <TextInputField
                      id="dischargePlan"
                      name="dischargePlan"
                      label="Discharge Plan (apart from the medications)"
                      sx={{ width: "100%" }}
                      multiline
                      rows={3}
                      placeholder="Write the discharge plan"
                      disabled={!isFinalDiagnosisReady}
                    />
                  </MainGrid>

                  {/* Home Care Instructions */}
                  <MainGrid item xs={12}>
                    <TextInputField
                      id="homeCareInstructions"
                      name="homeCareInstructions"
                      label="Home Care Instructions"
                      sx={{ width: "100%" }}
                      multiline
                      rows={3}
                      placeholder="Write specific home care instructions"
                      disabled={!isFinalDiagnosisReady}
                    />
                  </MainGrid>
                </MainGrid>

                {/* RIGHT COLUMN - Follow-up Information */}
                <MainGrid item xs={12} md={6}>
                  {/* Follow-Up Plan */}
                  <MainGrid item xs={12} sx={{ mb: 2 }}>
                    <RadioGroupInput
                      name="followUpPlan"
                      label="Follow-Up Plan"
                      options={[
                        { value: concepts.YES, label: "Yes" },
                        { value: concepts.NO, label: "No" },
                      ]}
                      disabled={!isFinalDiagnosisReady}
                    />
                  </MainGrid>

                  {/* Conditionally render Follow-Up Details and Service Area fields */}
                  {values.followUpPlan === concepts.YES && (
                    <>
                      {/* Follow-Up Details */}
                      <MainGrid item xs={12} sx={{ mb: 2 }}>
                        <SearchComboBox
                          name="followUpDetails"
                          label="Follow-Up Facility"
                          options={
                            facilities
                              ? facilities.map((f: any) => ({
                                  id: f.facility_name,
                                  label: f.facility_name,
                                }))
                              : []
                          }
                          multiple={false}
                          disabled={!isFinalDiagnosisReady}
                        />
                      </MainGrid>
                      {/* Clinics (If applicable) */}
                      <MainGrid item xs={12}>
                        <SearchComboBox
                          name="specialistClinic"
                          label="Clinics (If applicable)"
                          options={serviceAreaOptions}
                          multiple={false}
                          disabled={!isFinalDiagnosisReady}
                        />

                        {/* Only show "Other Service Area" field if "Other" is selected */}
                        {showOther && (
                          <TextInputField
                            id="otherServiceArea"
                            name="otherServiceArea"
                            label="Other Service Area"
                            sx={{ mt: 2, width: "100%" }}
                            disabled={!isFinalDiagnosisReady}
                          />
                        )}
                      </MainGrid>
                    </>
                  )}
                </MainGrid>
              </MainGrid>
              {!isFinalDiagnosisReady && (
                <MainButton
                  sx={{ mt: 3 }}
                  title="Submit"
                  type="submit"
                  disabled
                  onClick={() => {}}
                />
              )}
            </>
          );
        }}
      </FormikInit>
      {/* CSS for Print Handling */}
      <style jsx>{`
        @media print {
          .print-only {
            display: block !important; /* Ensure visibility in print */
          }
        }
        .print-only {
          display: none; /* Hide on screen */
        }
      `}</style>
    </>
  );
};
