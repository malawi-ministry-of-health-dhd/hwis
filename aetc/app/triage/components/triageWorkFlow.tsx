"use client";
import { useEffect, useState } from "react";
import { GenericDialog, MainButton, NewStepperContainer } from "@/components";
import {
  AirwayAndBreathingForm,
  BloodCirculationForm,
  ConsciousnessForm,
  PersistentPainForm,
  PresentingComplaintsForm,
  TriageContainer,
} from ".";
import {
  VitalFormConfig,
  VitalsForm,
} from "@/app/vitals/components/vitalsForm";
import { useNavigation, useParameters } from "@/hooks";

import { concepts, encounters } from "@/constants";
import { getObservations } from "@/helpers";
import {
  fetchConceptAndCreateEncounter,
  getPatientsEncounters,
} from "@/hooks/encounter";
import { useFormLoading } from "@/hooks/formLoading";
import { CustomizedProgressBars } from "@/components/loader";
import { FormError } from "@/components/formError";
import { OperationSuccess } from "@/components/operationSuccess";
import { getHumanReadableDateTime } from "@/helpers/dateTime";
import { getPatientVisitTypes } from "@/hooks/patientReg";
import { ServiceAreaForm } from "./serviceAreaForm";
import { Encounter, TriageResult } from "@/interfaces";
import { Bounce, toast } from "react-toastify";
import { DisplayNone } from "@/components/displayNoneWrapper";
import { closeCurrentVisit } from "@/hooks/visit";

import { getObservationValue } from "@/helpers/emr";
import { PatientTriageBarcodePrinter } from "@/components/barcodePrinterDialogs";
import { useServerTime } from "@/contexts/serverTimeContext";
import { moveAetcVisitListPatient } from "@/services/aetcVisitList";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function TriageWorkFlow() {
  const { ServerTime } = useServerTime();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState<number>(0);
  const [formData, setFormData] = useState<any>({});
  const { params } = useParameters();
  const [triageResult, setTriageResult] = useState<TriageResult>("");
  const [continueTriage, setContinueTriage] = useState(false);
  const [conceptTriageResult, setConceptTriageResult] = useState<any>({});
  const [submittedSteps, setSubmittedSteps] = useState<Array<number>>([]);

  const [presentingComplaints, setPresentingComplaints] = useState<any>({});
  const [vitals, setVitals] = useState<any>({});
  const [airway, setAirway] = useState({});
  const [circulation, setCirculation] = useState({});
  const [consciousness, setConsciousness] = useState({});
  const [persistentPain, setPersistentPain] = useState({});
  const [showModal, setShowModal] = useState(false);

  const [triagePrintOpen, setTriagePrintOpen] = useState(false);
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
    mutate: createPresenting,
    isSuccess: presentingCreated,
    isPending: creatingPresenting,
    isError: presentingError,
    data: presentingComplaintsResponse,
  } = fetchConceptAndCreateEncounter();
  const {
    mutate: createVitals,
    isSuccess: vitalsCreated,
    isPending: creatingVitals,
    isError: vitalsError,
  } = fetchConceptAndCreateEncounter();
  const {
    mutate: createAirway,
    isSuccess: airwayCreated,
    isPending: creatingAirway,
    isError: airwayError,
  } = fetchConceptAndCreateEncounter();
  const {
    mutate: createBlood,
    isSuccess: bloodCreated,
    isPending: creatingBlood,
    isError: bloodError,
  } = fetchConceptAndCreateEncounter();
  const {
    mutate: createDisability,
    isSuccess: disabilityCreated,
    isPending: creatingDisability,
    isError: disabilityError,
  } = fetchConceptAndCreateEncounter();
  const {
    mutate: createPain,
    isSuccess: painCreated,
    isPending: creatingPain,
    isError: painError,
  } = fetchConceptAndCreateEncounter();

  const {
    mutate: createTriageResult,
    isSuccess: triageResultCreated,
    isPending: creatingTriageResult,
    isError: triageResultError,
  } = fetchConceptAndCreateEncounter();

  const { navigateTo, navigateBack } = useNavigation();

  const steps = [
    { id: 6, label: "Presenting Complaints" },
    { id: 5, label: "Vitals Signs" },
    { id: 1, label: "Airway/Breathing" },
    { id: 2, label: "Blood Circulation" },
    { id: 3, label: "Disability" },
    { id: 4, label: "Persistent Pain/Other Concerns" },
  ];
  const { data: patientVisits } = getPatientVisitTypes(params?.id as string);

  const activeVisit = patientVisits?.find((d) => !Boolean(d.date_stopped));

  const { mutate: closeVisit, isSuccess: visitClosed } = closeCurrentVisit();
  const {
    mutate: movePatientToAssessment,
    isSuccess: movedPatientToAssessment,
    isError: moveToAssessmentError,
  } = useMutation({
    mutationFn: (payload: any) => {
      const { patient_id: patientId, ...attributes } = payload;

      return moveAetcVisitListPatient(patientId, attributes).then(
        (response) => response.data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["triage"] });
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
  });

  const { data } = getPatientsEncounters(params?.id as string);
  const [referral, setReferral] = useState<Encounter>();
  const [initialRegistration, setInitialRegistration] = useState<Encounter>();

  const getEncounterActiveVisit = (encounterType: string) => {
    return data
      ?.filter((d) => d?.encounter_type.uuid == encounterType)
      .find((d) => d.visit_id == activeVisit?.visit_id);
  };

  useEffect(() => {
    setReferral(getEncounterActiveVisit(encounters.REFERRAL));
    setInitialRegistration(
      getEncounterActiveVisit(encounters.INITIAL_REGISTRATION)
    );
  }, [data]);

  const referralHealthFacility = getObservationValue(
    referral?.obs,
    concepts.REFERRED_FROM
  );

  useEffect(() => {
    if (presentingCreated) {
      setCompleted(1);
      setMessage("adding vitals...");
      const dateTime = ServerTime.getServerTimeString();

      createVitals({
        encounterType: encounters.VITALS,
        visit: activeVisit?.uuid,
        patient: params.id,
        encounterDatetime: dateTime,
        obs: getObservations(formData.vitals, dateTime),
      });
    }

    return;
  }, [presentingCreated]);

  useEffect(() => {
    if (vitalsCreated) {
      const dateTime = ServerTime.getServerTimeString();
      setCompleted(2);
      setMessage("adding airway...");
      createAirway({
        encounterType: encounters.AIRWAY_BREATHING,
        visit: activeVisit?.uuid,
        patient: params.id,
        encounterDatetime: dateTime,
        obs: formData.airway, //getObservations(formData.airway, dateTime),
      });
    }
  }, [vitalsCreated]);

  useEffect(() => {
    if (airwayCreated) {
      const dateTime = ServerTime.getServerTimeString();
      setCompleted(3);
      setMessage("adding blood circulation data...");
      createBlood({
        encounterType: encounters.BLOOD_CIRCULATION,
        visit: activeVisit?.uuid,
        patient: params.id,
        encounterDatetime: dateTime,
        obs: formData.bloodCirculation, // getObservations(formData.bloodCirculation, dateTime),
      });
    }
  }, [airwayCreated]);

  useEffect(() => {
    if (bloodCreated) {
      const dateTime = ServerTime.getServerTimeString();
      setCompleted(4);
      setMessage("adding disability...");

      createDisability({
        encounterType: encounters.DISABILITY_ASSESSMENT,
        visit: activeVisit?.uuid,
        patient: params.id,
        encounterDatetime: dateTime,
        obs: formData.disability, // getObservations(formData.disability, dateTime),
      });
    }
  }, [bloodCreated]);

  useEffect(() => {
    if (disabilityCreated) {
      setCompleted(5);
      const dateTime = ServerTime.getServerTimeString();
      setMessage("adding pain and persistent...");

      createPain({
        encounterType: encounters.PERSISTENT_PAIN,
        visit: activeVisit?.uuid,
        patient: params.id,
        encounterDatetime: dateTime,
        obs: formData.pain, // getObservations(formData.pain, dateTime),
      });
    }
  }, [disabilityCreated]);

  useEffect(() => {
    if (painCreated) {
      setCompleted(6);
      setMessage("finalizing...");

      const otherAETCArea =
        triageResult === "red"
          ? null
          : Object.entries(formData?.serviceArea ?? {}).find(
              ([key]) => key !== concepts.OTHER_AETC_SERVICE_AREA
            )?.[1];

      const dateTime = ServerTime.getServerTimeString();

      // console.log({
      //   concept: concepts.CARE_AREA,
      //   value:
      //     triageResult === "green" || triageResult === "yellow"
      //       ? formData.serviceArea || ""
      //       : "",
      //   obsDatetime: dateTime,
      // });

      createTriageResult({
        encounterType: encounters.TRIAGE_RESULT,
        visit: activeVisit?.uuid,
        patient: params.id,
        encounterDatetime: dateTime,
        obs: [
          {
            concept: concepts.TRIAGE_RESULT,
            value: triageResult,
            obsDatetime: dateTime,
          },
          {
            concept: concepts.CARE_AREA,
            value: formData?.serviceArea?.[concepts.CARE_AREA] || "",
            obsDatetime: dateTime,
          },
          {
            concept: concepts.OTHER_AETC_SERVICE_AREA,
            value: otherAETCArea ? otherAETCArea : "",
            obsDatetime: dateTime,
          },
        ],
      });
    }

    if (triageResult == "green") {
      const referredTo = formData?.serviceArea?.[concepts.CARE_AREA];

      if (
        referredTo?.toLowerCase() == concepts?.GYNAE_BENCH.toLowerCase() ||
        referredTo?.toLowerCase() == concepts?.MEDICAL_BENCH.toLowerCase() ||
        referredTo?.toLowerCase() == concepts?.SURGICAL_BENCH.toLowerCase()
      ) {
        return;
      }

      setMessage("closing visit...");
      closeVisit(activeVisit?.uuid as string);
    }
  }, [painCreated]);

  useEffect(() => {
    if (triageResultCreated) {
      const patientUuid = params.id as string;
      const selectedCareArea = formData?.serviceArea?.[concepts.CARE_AREA];
      const otherCareArea =
        formData?.serviceArea?.[concepts.OTHER_AETC_SERVICE_AREA];
      const patientCareArea =
        selectedCareArea?.toString()?.toLowerCase() === "other"
          ? otherCareArea || selectedCareArea
          : selectedCareArea || otherCareArea;

      if (!patientUuid) {
        setMessage("failed to move patient to assessment list");
        setError(true);
        setLoading(false);
        return;
      }

      setMessage("moving patient to assessment list...");
      const movePayload: any = {
        patient_id: patientUuid,
        category: "assessment",
        from_category: "triage",
        triage_result: triageResult,
      };

      if (patientCareArea) {
        movePayload.patient_care_area = patientCareArea;
      }

      movePatientToAssessment(movePayload);
    }
  }, [triageResultCreated]);

  useEffect(() => {
    if (movedPatientToAssessment) {
      setCompleted(7);
      setLoading(false);
    }
  }, [movedPatientToAssessment]);

  // useEffect(() => {
  //   if (painCreated) {
  //     setCompleted(6);
  //     setLoading(false);
  //   }
  // }, [painCreated]);

  useEffect(() => {
    const error =
      presentingError ||
      vitalsError ||
      airwayError ||
      bloodError ||
      disabilityError ||
      triageResultError ||
      painError ||
      moveToAssessmentError;
    setError(error);
  }, [
    presentingError,
    vitalsError,
    airwayError,
    bloodError,
    disabilityError,
    painError,
    triageResultError,
    moveToAssessmentError,
  ]);

  const handlePersistentPain = (values: any) => {
    formData["pain"] = values;
    setShowForm(false);
    setShowModal(true);
    // if (triageResult == "green" || triageResult == "yellow") {
    //   return;
    // }
    // triggerSubmission();
  };

  const handleVitalsSubmit = (values: any) => {
    const cloneValues = { ...values };
    if (
      cloneValues &&
      cloneValues[concepts.GLUCOSE] !== undefined &&
      cloneValues[concepts.ADDITIONAL_NOTES] !== undefined
    ) {
      cloneValues[concepts.GLUCOSE] =
        `${cloneValues[concepts.GLUCOSE]} ${cloneValues[concepts.ADDITIONAL_NOTES]}`;
    }

    formData["vitals"] = cloneValues;

    setActiveStep(2);
    setSubmittedSteps((steps) => [...steps, 1]);
  };

  const handleAirwaySubmit = (values: any) => {
    formData["airway"] = values;
    setActiveStep(3);
    setSubmittedSteps((steps) => [...steps, 2]);
  };
  const handleBloodCirculationSubmit = (values: any) => {
    formData["bloodCirculation"] = values;
    setActiveStep(4);
    setSubmittedSteps((steps) => [...steps, 3]);
  };
  const handleDisabilitySubmit = (values: any) => {
    formData["disability"] = values;
    setActiveStep(5);
    setSubmittedSteps((steps) => [...steps, 4]);
  };

  const handlePresentComplaints = (values: any) => {
    formData["presentingComplaints"] = values;
    setActiveStep(1);
    setSubmittedSteps((steps) => [...steps, 0]);
  };

  const handleServiceArea = (values: any) => {

    formData["serviceArea"] = values;
    setMessage("adding next service area...");

    triggerSubmission();
    setShowModal(false);
  };

  const triggerSubmission = () => {
    setLoading(true);
    const dateTime = ServerTime.getServerTimeString();
    setMessage("adding complaints...");
    createPresenting({
      encounterType: encounters.PRESENTING_COMPLAINTS,
      visit: activeVisit?.uuid,
      patient: params.id,
      encounterDatetime: dateTime,
      obs: formData.presentingComplaints,
    });
  };

  useEffect(() => {
    let tResult = "";
    const keys = Object.keys(conceptTriageResult);
    for (let i = 0; i < keys.length; i++) {
      if (conceptTriageResult[keys[i]] == "red") {
        tResult = "red";
        break;
      }
      if (conceptTriageResult[keys[i]] == "yellow") {
        tResult = "yellow";
      }

      if (tResult != "yellow") {
        tResult = "green";
      }
    }

    setTriageResult(tResult as TriageResult);
  }, [conceptTriageResult]);

  useEffect(() => {
    if (triageResult == "red") {
      toast.error("Triage Red", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });
    }
    if (triageResult == "yellow") {
      toast.warn("Triage Yellow", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });
    }
  }, [triageResult]);

  const checkTriageResult = (triage: TriageResult, name: string) => {
    setConceptTriageResult((concept: any) => {
      return { ...concept, [name]: triage };
    });
  };

  const handleClickAccordion = (activeStep: any) => {
    const found = submittedSteps.find((step) => step == activeStep);

    if (found != undefined) setActiveStep(activeStep);

    // TODO: send a message that you can't move
  };

  const closeModal = () => {
    setShowModal(false);
    navigateBack();
  };

  const handleOnCompleteTriage = () => {
    handlePresentComplaints(presentingComplaints);
    handleAirwaySubmit(airway);
    handleBloodCirculationSubmit(circulation);
    handleDisabilitySubmit(circulation);
    handleVitalsSubmit(vitals);
    handlePersistentPain(persistentPain);
  };

  return (
    <>
      <DisplayNone hidden={!showForm}>
        {triageResult && (
          <>
            <TriageContainer
              onCompleteTriage={handleOnCompleteTriage}
              result={triageResult}
              message={"Interventions"}
              setContinueTriage={setContinueTriage}
            />
            <br />
          </>
        )}
        <NewStepperContainer
          setActive={(value) => {
            setActiveStep(value);
          }}
          title="Triage"
          steps={steps}
          // onClickAccordion={handleClickAccordion}
          active={activeStep}
          onBack={() => navigateBack()}
          allowPanelActiveOnClick={false}
          backButtonProfileText="Back to triage list"
        >
          <PresentingComplaintsForm
            getFormValues={setPresentingComplaints}
            triageResult={triageResult}
            setTriageResult={checkTriageResult}
            onSubmit={handlePresentComplaints}
          />

          <VitalsForm
            previous={() => setActiveStep(0)}
            triageResult={triageResult}
            setTriageResult={checkTriageResult}
            initialValues={{}}
            onSubmit={handleVitalsSubmit}
            continueTriage={continueTriage}
            getFormValues={setVitals}
          />
          <AirwayAndBreathingForm
            getFormValues={setAirway}
            previous={() => setActiveStep(1)}
            continueTriage={continueTriage}
            triageResult={triageResult}
            setTriageResult={checkTriageResult}
            onSubmit={handleAirwaySubmit}
          />

          <BloodCirculationForm
            previous={() => setActiveStep(2)}
            getFormValues={setCirculation}
            continueTriage={continueTriage}
            triageResult={triageResult}
            setTriageResult={checkTriageResult}
            onSubmit={handleBloodCirculationSubmit}
          />

          <ConsciousnessForm
            getFormValues={setConsciousness}
            previous={() => setActiveStep(3)}
            continueTriage={continueTriage}
            triageResult={triageResult}
            setTriageResult={checkTriageResult}
            onSubmit={handleDisabilitySubmit}
          />
          <PersistentPainForm
            getFormValues={setPersistentPain}
            previous={() => setActiveStep(4)}
            continueTriage={continueTriage}
            setTriageResult={checkTriageResult}
            triageResult={triageResult}
            onSubmit={handlePersistentPain}
          />
        </NewStepperContainer>
      </DisplayNone>

      {completed == 7 && (
        <>
          <PatientTriageBarcodePrinter
            arrivalTime={getHumanReadableDateTime(
              initialRegistration?.encounter_datetime
            )}
            open={triagePrintOpen}
            onClose={() => setTriagePrintOpen(false)}
            presentingComplaints={presentingComplaints[
              concepts.PRESENTING_COMPLAINTS
            ].reduce((prev: any, current: any) => {
              return prev == "" ? current.label : prev + "," + current.label;
            }, "")}
            triageCategory={triageResult}
            date={getHumanReadableDateTime(ServerTime.getServerTimeString())}
            triagedBy={presentingComplaintsResponse?.created_by as string}
            referredFrom={referralHealthFacility}
            vitals={[
              {
                name: VitalFormConfig.saturationRate.short,
                value: vitals[VitalFormConfig.saturationRate.name],
              },
              {
                name: VitalFormConfig.heartRate.short,
                value: vitals[VitalFormConfig.heartRate.name],
              },
              {
                name: VitalFormConfig.bloodPressure.short,
                value: `${vitals[VitalFormConfig.bloodPressure.name]}/${
                  vitals[VitalFormConfig.bloodPressureDiastolic.name]
                }`,
              },
              {
                name: VitalFormConfig.respiratoryRate.short,
                value: vitals[VitalFormConfig.respiratoryRate.name],
              },
              {
                name: VitalFormConfig.temperature.short,
                value: vitals[VitalFormConfig.temperature.name],
              },
              {
                name: VitalFormConfig.avpu.label,
                value: vitals[VitalFormConfig.avpu.name],
              },
              {
                name: `${VitalFormConfig.glucose.label}(${
                  vitals[VitalFormConfig.units.name]
                })`,
                value: vitals[VitalFormConfig.glucose.name],
              },
            ]}
          />

          <OperationSuccess
            title="Patient Triaged Successfully"
            primaryActionText="Triage more patients"
            secondaryActionText="Go Home"
            printButton={
              <MainButton
                sx={{ mx: "2px" }}
                variant="secondary"
                title={"print"}
                onClick={() => setTriagePrintOpen(true)}
              />
            }
            onPrimaryAction={() => {
              setShowForm(true);
              setCompleted(0);
              navigateTo("/triage");
            }}
            onSecondaryAction={() => navigateTo("/dashboard")}
          />
        </>
      )}

      {error && (
        <FormError
          error={message}
          onPrimaryAction={() => {
            setError(false);
            setCompleted(0);
            setLoading(false);
            setShowForm(true);
          }}
          onSecondaryAction={() => {
            setCompleted(0);
            setShowForm(true);
            setLoading(false);
            setError(false);
          }}
        />
      )}
      {/* TODO: please revert the show modal */}
      <GenericDialog
        // open={true}
        open={showModal}
        onClose={closeModal}
        title="Triage Decision"
      >
        <p>
          Triage status is (
          {triageResult === "green" ? (
            <span style={{ color: "green" }}>{triageResult}</span>
          ) : triageResult === "red" ? (
            <span style={{ color: "red" }}>{triageResult}</span>
          ) : (
            <span style={{ color: "#cc9900" }}>{triageResult}</span>
          )}
          ). Where should this patient go next?
        </p>
        <ServiceAreaForm
          onSubmit={handleServiceArea}
          triageStatus={triageResult}
        />
      </GenericDialog>

      {loading && !error && (
        <>
          <br />
          <br />
          <CustomizedProgressBars
            message={message}
            progress={(completed / 7) * 100}
          />
        </>
      )}
    </>
  );
}
