"use client";
import { PrescreeningForm } from "../components/preScreeningForm";
import { getActivePatientDetails, useNavigation } from "@/hooks";
import {
  RegistrationMainHeader,
  RegistrationDescriptionText,
  RegistrationCard,
} from "@/app/registration/components/common";

import { MainGrid } from "@/components";
import { fetchConceptAndCreateEncounter } from "@/hooks/encounter";
import { concepts, encounters } from "@/constants";
import { closeCurrentVisit } from "@/hooks/visit";
import { useFormLoading } from "@/hooks/formLoading";
import { OperationSuccess } from "@/components/operationSuccess";
import { FormError } from "@/components/formError";
import { CustomizedProgressBars } from "@/components/loader";
import { useEffect, useState } from "react";
import { Navigation } from "@/app/components/navigation";
import { useServerTime } from "@/contexts/serverTimeContext";
import { getOnePatient } from "@/hooks/patientReg";
import { moveAetcVisitListPatient } from "@/services/aetcVisitList";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function Prescreening() {
  const { ServerTime } = useServerTime();
  const { activeVisit, patientId } = getActivePatientDetails();
  const { navigateTo } = useNavigation();
  const queryClient = useQueryClient();
  const [shouldMoveToRegistration, setShouldMoveToRegistration] =
    useState(true);

  const { data: patient, isError: patientLookupError } = getOnePatient(
    patientId as string,
  );

  const {
    mutate: createEncounter,
    isSuccess,
    isError: encounterError,
  } = fetchConceptAndCreateEncounter();
  const { mutate: closeVisit, isError: closeVisitError } = closeCurrentVisit();
  const {
    mutate: movePatientToRegistration,
    isSuccess: patientMovedToRegistration,
    isError: movePatientError,
  } = useMutation({
    mutationFn: (payload: any) => {
      const { patient_id: listPatientId, ...attributes } = payload;

      return moveAetcVisitListPatient(listPatientId, attributes).then(
        (response) => response.data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["screening"] });
      queryClient.invalidateQueries({ queryKey: ["registration"] });
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
  });

  const listPatientId = patient?.patient_id;

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

  useEffect(() => {
    if (!isSuccess) return;

    if (!shouldMoveToRegistration) {
      setCompleted(1);
      setLoading(false);
      return;
    }

    if (patientLookupError) {
      setMessage("failed to move patient to registration list");
      setError(true);
      setLoading(false);
      return;
    }

    if (!listPatientId) return;

    setMessage("moving patient to registration list...");
    movePatientToRegistration({
      patient_id: listPatientId,
      category: "registration",
      from_category: "screening",
    });
  }, [
    isSuccess,
    shouldMoveToRegistration,
    patientLookupError,
    listPatientId,
    movePatientToRegistration,
  ]);

  useEffect(() => {
    if (patientMovedToRegistration) {
      setCompleted(1);
      setLoading(false);
    }
  }, [patientMovedToRegistration]);

  useEffect(() => {
    if (encounterError || movePatientError || closeVisitError) {
      setMessage("failed to complete screening");
      setError(true);
      setLoading(false);
    }
  }, [encounterError, movePatientError, closeVisitError]);

  const handleSubmit = (values: any) => {
    setShowForm(false);

    setLoading(true);
    setMessage("add Screening data... ");

    const dateTime = ServerTime.getServerTimeString();
    const referredToServiceArea = Boolean(values[concepts.PATIENT_REFERRED_TO]);
    setShouldMoveToRegistration(!referredToServiceArea);

    createEncounter({
      encounterType: encounters.SCREENING_ENCOUNTER,
      visit: activeVisit,
      patient: patientId,
      encounterDatetime: dateTime,
      obs: [
        {
          concept: concepts.IS_PATIENT_REFERRED,
          value: values[concepts.IS_PATIENT_REFERRED],
          obsDatetime: dateTime,
        },
        {
          concept: concepts.IS_SITUATION_URGENT,
          value: values[concepts.IS_SITUATION_URGENT],
          obsDatetime: dateTime,
        },
        {
          concept: concepts.PATIENT_REFERRED_TO,
          value: values[concepts.PATIENT_REFERRED_TO],
          obsDatetime: dateTime,
        },
      ],
    });

    if (referredToServiceArea) {
      closeVisit(activeVisit as string);
    }
  };
  return (
    <>
      <Navigation title="Prescreening" link="/initial-registration/list" />
      <MainGrid container>
        <MainGrid xs={1} lg={3} item></MainGrid>
        <MainGrid
          xs={10}
          lg={6}
          sx={{
            display: "flex",
            flexDirection: "column",
          }}
          item
        >
          <br />
          <br />
          <RegistrationMainHeader>Screening</RegistrationMainHeader>
          <RegistrationDescriptionText>
            This is a list of all patients that went through initial
            registration successfully and waiting for prescreening.
          </RegistrationDescriptionText>
          {showForm && (
            <RegistrationCard>
              <PrescreeningForm onSubmit={handleSubmit} />
            </RegistrationCard>
          )}
          {completed == 1 && (
            <OperationSuccess
              title="Patient Screened Successfully"
              primaryActionText="screen more"
              secondaryActionText="Go Home"
              onPrimaryAction={() => {
                navigateTo("/initial-registration/list");
                setShowForm(true);
                setCompleted(0);
              }}
              onSecondaryAction={() => {
                navigateTo("/dashboard");
              }}
            />
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

          {loading && !error && (
            <>
              <br />
              <br />
              <CustomizedProgressBars
                message={message}
                progress={(completed / 1) * 100}
              />
            </>
          )}
        </MainGrid>
        <MainGrid xs={1} lg={3} item></MainGrid>
      </MainGrid>
    </>
  );
}
