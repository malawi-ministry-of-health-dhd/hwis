"use client";

import { InitialRegistrationForm } from "./components";
import {
  initialPatientRegistration,
  searchDDEPatientByNpid,
} from "@/hooks/patientReg";

import { MainGrid, MainTypography, WrapperBox } from "@/components";
import {
  RegistrationCard,
  RegistrationDescriptionText,
  RegistrationMainHeader,
} from "../registration/components/common";
import { addVisit } from "@/hooks/visit";
import { useEffect, useState } from "react";
import { AETC_VISIT_TYPE, concepts, encounters, roles } from "@/constants";
import {
  addEncounter,
  fetchConceptAndCreateEncounter,
} from "@/hooks/encounter";
import { useNavigation } from "@/hooks";
import { getVisitNum } from "@/hooks/visitNumber";
import { CustomizedProgressBars } from "@/components/loader";
import { OperationSuccess } from "@/components/operationSuccess";
import { useFormLoading } from "@/hooks/formLoading";
import { FormError } from "@/components/formError";
import { Navigation } from "../components/navigation";
import AuthGuard from "@/helpers/authguard";
import { BarcodeDialog } from "./components/barcodeScanner";
import { FaBarcode } from "react-icons/fa6";
import { PatientSearchResultsDialog } from "./components/patientsSearch";
import { DDESearch } from "@/interfaces";
import { useServerTime } from "@/contexts/serverTimeContext";
import { addPatientToAetcVisitList } from "@/hooks/aetcVisitList";

function InitialRegistration() {
  const { init, ServerTime } = useServerTime();
  const [showDialog, setShowDialog] = useState(false);
  const [npid, setNpid] = useState("");
  const { refresh, navigateTo } = useNavigation();
  const [initialValues, setInitialValues] = useState({
    firstName: "",
    lastName: "",
  });

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
    mutate: createPatient,
    isPending,
    data: createdUser,
    isSuccess,
    isError: patientError,
  } = initialPatientRegistration();

  const {
    mutate: createVisit,
    isPending: creatingVisit,
    isSuccess: visitCreated,
    data: visit,
    isError: visitError,
  } = addVisit();

  const {
    mutate: createEncounter,
    isPending: creatingEncounter,
    isSuccess: encounterCreated,
    isError: encounterError,
  } = fetchConceptAndCreateEncounter();

  const {
    mutate: createAetcVisitList,
    isSuccess: aetcVisitListCreated,
    isError: aetcVisitListError,
  } = addPatientToAetcVisitList();

  const {
    data: visitNumberResponse,
    isSuccess: visitNumberGenerated,
    isPending: generatingVisitNumber,
    refetch: generateVisitNumber,
    isFetching: fetchingVisitNumber,
    isError: visitNumberError,
  } = getVisitNum();

  const {
    refetch,
    isRefetching,
    data: foundPatients,
    isSuccess: patientSearchSuccess,
  } = searchDDEPatientByNpid(npid);
  const [showSearchResultDialog, setShowSearchResultDialog] = useState(false);

  // useEffect(() => {
  //   setNpid('8UN1U3')
  // }, [])

  //handle scan data
  useEffect(() => {
    if (npid == "") return;
    refetch();
  }, [npid]);

  useEffect(() => {
    if (patientSearchSuccess) {
      setShowSearchResultDialog(true);
    }
  }, [patientSearchSuccess]);

  // after patient registration create a visit
  useEffect(() => {
    if (isSuccess) {
      setCompleted(1);
      setMessage("creating visit");
      const dateTime = ServerTime.getServerTimeString();

      const uuid = createdUser?.uuid;
      createVisit({
        patient: uuid,
        visitType: AETC_VISIT_TYPE,
        startDatetime: dateTime,
      });
    }
  }, [isPending]);

  useEffect(() => {
    if (!visitCreated) return;
    setCompleted(2);
    setMessage("generating visit number...");
    generateVisitNumber();
  }, [creatingVisit]);

  // after creating a visit create an encounter
  useEffect(() => {
    if (!visit) return;
    if (!visitNumberGenerated) return;

    setCompleted(3);
    setMessage("creating an encounter...");

    const dateTime = ServerTime.getServerTimeString();

    createEncounter({
      encounterType: encounters.INITIAL_REGISTRATION,
      visit: visit?.uuid,
      patient: createdUser?.uuid,
      encounterDatetime: dateTime,
      obs: [
        {
          concept: concepts.VISIT_NUMBER,
          value: visitNumberResponse?.next_visit_number,
          obsDatetime: dateTime,
        },
      ],
      includeAll: true,
    });
  }, [fetchingVisitNumber]);

  useEffect(() => {
    if (encounterCreated) {
      setCompleted(4);
      setMessage("adding patient to waiting list...");

      const patientId = createdUser?.uuid;
      const visitNumber = visitNumberResponse?.next_visit_number;

      if (!patientId || !visitNumber) {
        setMessage("failed to add patient to waiting list");
        setError(true);
        setLoading(false);
        return;
      }

      createAetcVisitList({
        patient_id: patientId,
        aetc_visit_number: visitNumber,
        arrival_time:
          visit?.date_started ||
          visit?.start_datetime ||
          visit?.startDatetime ||
          ServerTime.getServerTimeString(),
        given_name:
          createdUser?.given_name ||
          createdUser?.person?.names?.[0]?.given_name ||
          initialValues.firstName,
        family_name:
          createdUser?.family_name ||
          createdUser?.person?.names?.[0]?.family_name ||
          initialValues.lastName,
        gender: createdUser?.gender || createdUser?.person?.gender || "N/A",
        category: "screening",
      });
    }
  }, [encounterCreated]);

  useEffect(() => {
    if (aetcVisitListCreated) {
      setCompleted(5);
      setLoading(false);
      setMessage("done");
    }
  }, [aetcVisitListCreated]);

  useEffect(() => {
    const error =
      patientError ||
      visitError ||
      visitNumberError ||
      encounterError ||
      aetcVisitListError;

    setError(error);
  }, [
    patientError,
    visitError,
    visitNumberError,
    encounterError,
    aetcVisitListError,
  ]);

  const secureLink =
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost";

  const handleSubmit = async (values: any, options: any) => {
    setMessage("creating patient");
    setShowForm(false);
    setLoading(true);
    setInitialValues({
      firstName: values.firstName,
      lastName: values.lastName,
    });

    const patient = await createPatient({
      identifiers: [
        {
          identifier: "103VWY7",
          identifierType: "ba2f7018-8d80-11d8-abbb-0024217bb78e",
          preferred: true,
        },
      ],
      person: {
        gender: "N/A",
        birthdate: "1970-01-01T00:00:00.000+01000",
        names: [
          {
            givenName: values.firstName,
            familyName: values.lastName,
          },
        ],
        addresses: [],
      },
    });
  };

  return (
    <>
      <Navigation title="Patient Arrival" link="/dashboard" />
      <MainGrid container>
        <MainGrid xs={2} md={3} lg={4} item></MainGrid>
        <MainGrid
          md={6}
          lg={4}
          sx={{
            display: "flex",
            flexDirection: "column",
          }}
          item
        >
          <br />
          <br />

          <RegistrationMainHeader>Patient Arrival</RegistrationMainHeader>
          <RegistrationDescriptionText>
            The demographics form has been thoughtfully crafted to collect
            patient information, including personal details, contact information
          </RegistrationDescriptionText>
          {completed == 5 && (
            <OperationSuccess
              title={`Patient Created With Visit Number ${visitNumberResponse?.next_visit_number}`}
              primaryActionText="Register More Patient"
              secondaryActionText="Go Home"
              onPrimaryAction={() => {
                setShowForm(true);
                setCompleted(0);
                refresh();
              }}
              onSecondaryAction={() => {
                navigateTo("/dashboard");
              }}
            />
          )}
          {showForm && (
            <>
              <RegistrationCard>
                {/* <MainButton variant="secondary" title={"Scan Barcode"} onClick={() => { }} /> */}
                <br />
                <PatientSearchResultsDialog
                  open={showSearchResultDialog}
                  onClose={() => setShowSearchResultDialog(false)}
                  patientResults={
                    foundPatients
                      ? foundPatients
                      : ({ locals: [], remotes: [] } as DDESearch)
                  }
                />
                <BarcodeDialog
                  isLoading={isRefetching}
                  onBarcodeScan={(value: any) => setNpid(value)}
                  open={showDialog}
                  onClose={() => setShowDialog(false)}
                />
                <WrapperBox
                  onClick={() => secureLink && setShowDialog(true)}
                  sx={{
                    display: "flex",
                    py: "1ch",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    backgroundColor: "#F5F5F5",
                  }}
                >
                  {secureLink ? (
                    <>
                      {" "}
                      <FaBarcode />
                      <MainTypography variant="body1" sx={{ ml: "1ch" }}>
                        Scan Barcode
                      </MainTypography>
                    </>
                  ) : (
                    <MainTypography variant="subtitle2">
                      Barcode scanning not available.
                    </MainTypography>
                  )}
                </WrapperBox>
                <br />
                <InitialRegistrationForm
                  initialValues={initialValues}
                  onSubmit={handleSubmit}
                />
              </RegistrationCard>
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

          {loading && !error && (
            <>
              <br />
              <br />
              <CustomizedProgressBars
                message={message}
                progress={(completed / 5) * 100}
              />
            </>
          )}
        </MainGrid>
        <MainGrid xs={2} md={3} lg={4} item></MainGrid>
      </MainGrid>
    </>
  );
}

export default AuthGuard(InitialRegistration, [
  roles.ADMIN,
  roles.INITIAL_REGISTRATION_CLERK,
  roles.CLINICIAN,
]);
