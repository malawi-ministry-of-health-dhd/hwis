import { useContext, useEffect, useState } from "react";
import {
  MainButton,
  MainPaper,
  MainTypography,
  WrapperBox,
  defaultTheme,
} from "@/components";
import plus from "../../../../icons/plus.svg";
import Image from "next/image";
import { PatientNationalIdCheck } from "../../components";
import { getActivePatientDetails, useNavigation, useParameters } from "@/hooks";
import { FaUser, FaBarcode } from "react-icons/fa6";

import {
  SearchRegistrationContext,
  SearchRegistrationContextType,
} from "@/contexts";
import { DDESearch, Encounter, Person } from "@/interfaces";
import { GenericDialog } from "@/components";
import { getPatientRelationships, merge } from "@/hooks/patientReg";
import { OverlayLoader } from "@/components/backdrop";
import { ViewPatient } from "@/app/patient/components/viewPatient";
import {
  addEncounter,
  fetchConceptAndCreateEncounter,
  getPatientsEncounters,
} from "@/hooks/encounter";
import { closeCurrentVisit } from "@/hooks/visit";
import { concepts, encounters, roles } from "@/constants";
import { getObservationValue } from "@/helpers/emr";
import { useServerTime } from "@/contexts/serverTimeContext";
import { EditReferralForm } from "@/app/patient/components/editReferral";
import { OperationSuccess } from "@/components/operationSuccess";
import {
  DisplayFinancing,
  DisplayRelationship,
  DisplaySocialHistory,
} from "@/app/patient/[id]/view/components";
import { DDEPatientRegistration } from "../../components/ddePatientRegistration";
import { PrinterBarcodeButton } from "@/components/barcodePrinterDialogs";
import { Button, Chip, Typography } from "@mui/material";
import { AbscondButton } from "@/components/abscondButton";
import { AuthGuardComp } from "@/helpers/authguardcomponent";

export const SearchResults = ({
  searchedPatient,
  searchResults,
  genericSearch,
}: {
  searchedPatient: any;
  searchResults: DDESearch;
  genericSearch: boolean;
}) => {
  const { navigateTo } = useNavigation();
  const { params } = useParameters();
  const [open, setOpen] = useState(false);
  const { setRegistrationType, setPatient, patient } = useContext(
    SearchRegistrationContext,
  ) as SearchRegistrationContextType;
  const [type, setType] = useState("");

  const { setPatient: setRegisterPatient } = useContext(
    SearchRegistrationContext,
  ) as SearchRegistrationContextType;

  const handleNewRecord = () => {
    setRegisterPatient(searchedPatient);
    navigateTo(`/registration/${params.id}/new`);
  };

  const selectPatient = (person: Person, type: string) => {
    setPatient(person);
    setOpen(true);
    setType(type);
    // setRegistrationType(registrationType)
  };

  const resultNotFound =
    searchResults?.locals?.length == 0 && searchResults?.remotes?.length == 0;

  return (
    <WrapperBox
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <MainTypography variant="h5">Search Results</MainTypography>

      {resultNotFound && (
        <WrapperBox
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <br />
          <MainTypography variant="body2">
            No patient with similar demographics found
          </MainTypography>
          <br />

          {!genericSearch && (
            <MainButton
              sx={{ mr: "0.2ch", borderRadius: "1px" }}
              variant="secondary"
              title="add new record"
              onClick={handleNewRecord}
            />
          )}
        </WrapperBox>
      )}
      <br />
      {!resultNotFound && (
        <WrapperBox sx={{ width: "100%" }}>
          {!genericSearch && (
            <MainButton
              sx={{ mr: "0.2ch", borderRadius: "1px" }}
              variant="secondary"
              title="add new record"
              onClick={handleNewRecord}
            />
          )}
        </WrapperBox>
      )}
      <br />
      <WrapperBox sx={{ width: "100%", height: "50ch", overflow: "scroll" }}>
        {searchResults?.locals?.map((patient) => {
          return (
            <>
              <ResultBox
                genericSearch={genericSearch}
                setOpen={(person: Person) =>
                  !genericSearch && selectPatient(person, "local")
                }
                type="Local"
                key={patient?.uuid}
                person={patient}
              />
            </>
          );
        })}
        {searchResults?.remotes?.map((patient) => {
          //@ts-ignore
          return (
            <ResultBox
              genericSearch={genericSearch}
              setOpen={(person: Person) =>
                !genericSearch && selectPatient(person, "remote")
              }
              type="Remote"
              //@ts-ignore
              key={patient?.uuid}
              person={patient}
            />
          );
        })}
      </WrapperBox>
      {type == "local" && (
        <ViewPatientDialog
          type={type}
          patient={patient ? patient : ({} as Person)}
          onClose={() => setOpen(false)}
          open={open}
        />
      )}
      {type == "remote" && (
        <DDEPatientRegistration
          patient={patient ? patient : ({} as Person)}
          onClose={() => setOpen(false)}
          open={open}
        />
      )}
      {/* <ConfirmationDialog open={open} onClose={() => setOpen(false)} /> */}
    </WrapperBox>
  );
};

export const ResultBox = ({
  person,
  type,
  setOpen,
  genericSearch,
}: {
  person: any;
  type: string;
  setOpen: (person: any) => void;
  genericSearch: boolean;
}) => {
  const [visitActive, setVisitActive] = useState(false);
  const { navigateTo } = useNavigation();

  useEffect(() => {
    setVisitActive(Boolean(person?.active_visit));
  }, [person]);

  if (!person) {
    return <></>;
  }

  // return <></>;
  const identifier = person?.identifiers?.find(
    (i: any) => i?.identifier_type?.name == "National id",
  );

  return (
    <MainPaper
      onClick={() => {
        if (visitActive) return;
        setOpen(person);
      }}
      sx={{
        display: "flex",
        padding: 2,
        width: "100%",
        my: 1,
        cursor: "pointer",
      }}
    >
      <WrapperBox
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          mr: 1,
        }}
      >
        <WrapperBox
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F5F5F5",
          }}
        >
          <MainTypography color={defaultTheme.primary} variant="h1">
            <FaUser />
          </MainTypography>
        </WrapperBox>
        <br />

        {type == "Local" && genericSearch && (
          <PrinterBarcodeButton
            title={`Print Barcode`}
            icon={
              <Typography mr="1ch">
                <FaBarcode />
              </Typography>
            }
            variant="primary"
            uuid={person?.uuid}
          />
        )}
        {type == "Local" && genericSearch && (
          <AuthGuardComp roles={[roles.ADMIN]}>
            <Button
              onClick={() => navigateTo(`/patient/${person.uuid}/profile`)}
              sx={{ mb: "1ch" }}
              variant="text"
            >
              view profile
            </Button>
          </AuthGuardComp>
        )}

        {visitActive && !genericSearch && (
          <AbscondButton
            patientId=""
            dialogTitle="Close Patient Visit"
            dialogConfirmationMsg="Are you sure you want to close this visit?"
            visitId={person?.active_visit?.uuid}
            buttonTitle="Close Visit"
            onDelete={() => setVisitActive(false)}
          />
        )}
      </WrapperBox>
      <WrapperBox>
        <WrapperBox
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <MainTypography variant="h5">
            {person?.given_name} {person?.family_name}
          </MainTypography>
          <MainTypography>{type}</MainTypography>
        </WrapperBox>
        <WrapperBox sx={{ display: "flex" }}>
          <MainTypography color={"GrayText"} sx={{ mr: 1 }}>
            NPID:
          </MainTypography>
          <MainTypography color={"GrayText"}>
            {identifier?.identifier}
          </MainTypography>
        </WrapperBox>
        <br />
        <WrapperBox sx={{ display: "flex", mb: 1 }}>
          <Label label="Date of birth" value={person?.birthdate} />
          <Label label="Gender" value={person?.gender} />
        </WrapperBox>
        <WrapperBox sx={{ display: "flex" }}>
          <Label
            label="Home district"
            value={person && person.addresses && person?.addresses[0]?.address1}
          />
          <Label
            label="Home traditional authority"
            value={
              person && person.addresses && person?.addresses[0]?.cityVillage
            }
          />
          <Label
            label="Home village"
            value={person && person.addresses && person?.addresses[0]?.address2}
          />
        </WrapperBox>
      </WrapperBox>
      <WrapperBox sx={{ ml: "1ch" }}>
        {visitActive && <Chip color="success" label="Visit" />}
      </WrapperBox>
    </MainPaper>
  );
};

const Label = ({
  label,
  value,
}: {
  label: string;
  value: string | undefined | Date;
}) => {
  return (
    <WrapperBox sx={{ display: "flex", flexDirection: "column", mr: 1 }}>
      <MainTypography variant="subtitle2" color={"#C0C0C0"} sx={{ mr: 0.5 }}>
        {label}
      </MainTypography>
      <MainTypography variant="subtitle2" color={"#585858"}>
        {value ? value.toString() : ""}
      </MainTypography>
    </WrapperBox>
  );
};

export const AddPatientButton = () => {
  const { params } = useParameters();
  return (
    <WrapperBox
      onClick={() => PatientNationalIdCheck(params.id)}
      sx={{ display: "flex", mt: "1ch", cursor: "pointer" }}
    >
      <Image src={plus} alt="plus" />
      <MainTypography
        sx={{
          fontFamily: "Inter",
          fontSize: "14px",
          fontWeight: 500,
          lineHeight: "17px",
          letterSpacing: "0em",
          textAlign: "left",
          color: defaultTheme.primary,
          borderBottom: `1px solid ${defaultTheme.primary}`,
          ml: "1ch",
        }}
      >
        Add new patient
      </MainTypography>
    </WrapperBox>
  );
};

const ViewPatientDialog = ({
  patient,
  onClose,
  open,
  type = "remote",
}: {
  patient: Person;
  onClose: () => void;
  open: boolean;
  type: string;
}) => {
  const [mergeType, setMergeType] = useState(type);
  const { params } = useParameters();
  const { ServerTime } = useServerTime();

  // encounters for the patient registered during the initial registration
  const { data: patientEncounters } = getPatientsEncounters(
    params?.id as string,
  );

  // encounters for patient that was found in the system
  const { data: existingPatientEncounters, isPending } = getPatientsEncounters(
    patient?.uuid,
  );
  const { mutate: closeVisit, isSuccess: visitClosed } = closeCurrentVisit();

  const { data: relationships, isPending: loadingRelationships } =
    getPatientRelationships(patient?.uuid);
  const [initialPatient, setInitialPatient] = useState({} as Person);
  const [isReferred, setIsReferred] = useState<any>("");
  const [openReferralDialog, setOpenReferralDialog] = useState(false);
  const [transactionSuccess, setTransactionSuccess] = useState(false);

  const {
    mutateAsync: createSocialHistoryEncounter,
    isPending: creatingSocialHistoryEncounter,
    isSuccess: socialHistoryEncounterCreated,
    isError: socialHistoryEncounterErrored,
  } = fetchConceptAndCreateEncounter();

  const {
    mutateAsync: createFinancingEncounter,
    isPending: creatingFinancingEncounter,
    isSuccess: financingEncounterCreated,
    isError: financingEncounterErrored,
  } = fetchConceptAndCreateEncounter();

  const {
    mutateAsync: createReferralEncounter,
    isPending: creatingReferralEncounter,
    isSuccess: referralCreated,
    isError: referralErrored,
  } = fetchConceptAndCreateEncounter();

  const {
    mutateAsync: mergePatients,
    isPending: merging,
    isSuccess: merged,
    isError,
    data: mergedResponse,
  } = merge();
  const {
    mutateAsync: ddeMergePatients,
    isPending: ddeMerging,
    isSuccess: ddeMerged,
    isError: ddeMergeError,
    data: ddeMergedResponse,
  } = merge();

  const loading =
    merging ||
    creatingReferralEncounter ||
    creatingFinancingEncounter ||
    creatingSocialHistoryEncounter;

  const [socialHistory, setSocialHistory] = useState<any>({} as Encounter);
  const [financing, setFinancing] = useState<Encounter>({} as Encounter);
  const [referralData, setReferralData] = useState({
    [concepts.REFERRED_FROM]: "",
  });

  useEffect(() => {
    setInitialPatient(patient);
  }, [patient]);

  useEffect(() => {
    if (ddeMerged) {
      setMergeType("");
    }
  }, [ddeMerged]);

  useEffect(() => {
    const referralEncounter = patientEncounters?.find(
      (encounter) =>
        encounter.encounter_type.uuid == encounters.SCREENING_ENCOUNTER,
    );

    //TODO: remove the hard coded concept
    const referred = getObservationValue(
      referralEncounter?.obs,
      concepts.IS_PATIENT_REFERRED,
    );

    setIsReferred(referred);
  }, [patientEncounters]);

  // close patient visit
  useEffect(() => {
    if (referralCreated) {
      setTransactionSuccess(true);
    }
  }, [referralCreated]);

  const triggerMerge = async () => {
    const uuid = patient?.uuid;
    const initialUuid = params?.id;

    const mergedResponse = await mergePatients({
      primary: {
        patient_id: uuid,
      },
      secondary: [
        {
          patient_id: initialUuid,
        },
      ],
    });

    await createSocialHistoryEncounter({
      encounterType: encounters.SOCIAL_HISTORY,
      visit: mergedResponse?.active_visit?.uuid,
      patient: mergedResponse?.uuid,
      encounterDatetime: ServerTime.getServerTimeString(),
      obs: socialHistory?.obs?.map((ob: any) => ({
        concept: ob.names[0].uuid,
        value: ob.value,
        obsDatetime: ServerTime.getServerTimeString(),
      })),
    });

    await createReferralEncounter({
      encounterType: encounters.REFERRAL,
      visit: mergedResponse?.active_visit?.uuid,
      patient: mergedResponse?.uuid,
      encounterDatetime: ServerTime.getServerTimeString(),
      obs: [
        {
          concept: concepts.REFERRED_FROM,
          value: referralData[concepts.REFERRED_FROM],
          obsDatetime: ServerTime.getServerTimeString(),
        },
      ],
    });

    await createFinancingEncounter({
      encounterType: encounters.FINANCING,
      visit: mergedResponse?.active_visit?.uuid,
      patient: mergedResponse?.uuid,
      encounterDatetime: ServerTime.getServerTimeString(),
      obs: financing?.obs?.map((ob) => ({
        concept: ob.names[0].uuid,
        value: ob.value,
        obsDatetime: ServerTime.getServerTimeString(),
      })),
    });
  };

  const handleContinue = () => {
    if (isReferred == concepts.YES) {
      setOpenReferralDialog(true);
      return;
    }
    triggerMerge();
  };

  useEffect(() => {
    const financing = existingPatientEncounters?.find(
      (p) => p.encounter_type.uuid == encounters.FINANCING,
    );
    const socialHistory = existingPatientEncounters?.find(
      (p) => p.encounter_type.uuid == encounters.SOCIAL_HISTORY,
    );

    if (socialHistory) setSocialHistory(socialHistory);

    if (financing) setFinancing(financing);
  }, [existingPatientEncounters]);

  const handleReferralSubmit = async (values: any) => {
    await setReferralData(values);
    await triggerMerge();
    setOpenReferralDialog(false);
  };

  const handleTransformFinancing = (financingData: any) => {
    const found = financingData[concepts.PAYMENT_OPTIONS].filter(
      (opt: any) => opt.value,
    );

    // TODO: remove this and have a proper implementation
    const financingValue = found[0]?.key;

    financingData[concepts.PAYMENT_OPTIONS] = financingValue;

    // console.log("financing", { financing })

    const newFinancing = JSON.parse(JSON.stringify(financing));

    const mappings: any = {
      "c7bcc8bd-09d5-4f98-8d58-5179f749fd99": concepts.PAYMENT_OPTIONS,
      "b0ffce26-2d25-449e-871e-c702e44bb37e": concepts.INSURANCE_PROVIDER,
      "98b08fb2-f877-45b6-a95a-db89dffefb27": concepts.INSURANCE_NUMBER,
      "db2e6bba-7d04-4873-a0a2-ac7bd69dd7b1": concepts.INSURANCE_SCHEME,
      "3cdd53d9-35a5-47e5-909f-654e5bc7c9a8": concepts.INSURANCE_STATUS,
    };

    const obs = newFinancing.obs.map((ob: any) => {
      const conceptuuid = ob.names[0].uuid;
      const formuuid = mappings[conceptuuid];

      const newValue = financingData[formuuid];

      return {
        ...ob,
        value: newValue,
      };
    });

    newFinancing.obs = obs;
    setFinancing(newFinancing);
  };

  const handleDDEMerge = () => {
    const uuid = patient?.uuid;
    ddeMergePatients({
      primary: {
        patient_id: initialPatient.uuid,
      },
      secondary: [
        {
          doc_id: uuid,
        },
      ],
    });
  };

  const handleSocialHistorySubmit = (social: any) => {
    const obs = Object.keys(social).map((key) => ({
      names: [{ uuid: key }],
      concept: key,
      value: social[key],
      obsDatetime: ServerTime.getServerTimeString(),
    }));
    setSocialHistory({ obs });
  };

  return (
    <GenericDialog
      sx={{ backgroundColor: "#F6F6F6" }}
      onClose={onClose}
      open={open}
      title="view patient"
    >
      <OverlayLoader open={loading || ddeMerging} />
      <SuccessMessage open={transactionSuccess} />
      <MainTypography variant="h4">{`${patient.given_name} ${patient.family_name}`}</MainTypography>
      <br />
      <MainButton title={"Continue with Patient"} onClick={handleContinue} />
      {mergeType == "remote" && (
        <MainButton
          sx={{ mx: "1px" }}
          title={"Merge Patient"}
          onClick={handleDDEMerge}
        />
      )}
      <AddReferralDialog
        open={openReferralDialog}
        onClose={() => setOpenReferralDialog(false)}
        onSubmit={handleReferralSubmit}
      />
      <br />
      <ViewPatient disabled={mergeType == "remote"} patient={patient} />
      <br />
      <br />
      <DisplayRelationship
        disabled={mergeType == "remote"}
        patientId={patient?.uuid}
        loading={loadingRelationships}
        relationships={relationships ? relationships : []}
      />
      <br />
      <br />
      <WrapperBox display={"flex"}>
        <DisplaySocialHistory
          disabled={mergeType == "remote"}
          onSubmit={handleSocialHistorySubmit}
          loading={isPending}
          socialHistory={socialHistory ? socialHistory : ({} as Encounter)}
        />
        <DisplayFinancing
          disabled={mergeType == "remote"}
          onSubmit={handleTransformFinancing}
          loading={isPending}
          financing={financing ? financing : ({} as Encounter)}
        />
      </WrapperBox>
    </GenericDialog>
  );
};

const ConfirmationDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { params } = useParameters();
  const { navigateTo } = useNavigation();
  const { mutate, isPending, isSuccess, data } = merge();
  // const { setPatient } = useContext(SearchRegistrationContext) as SearchRegistrationContextType

  const { registrationType, initialRegisteredPatient, patient, setPatient } =
    useContext(SearchRegistrationContext) as SearchRegistrationContextType;

  const identifier = patient?.identifiers?.find(
    (id) => id?.identifier_type?.name == "DDE person document ID",
  );

  useEffect(() => {
    if (isSuccess) {
      setPatient(data);
      navigateTo(`/registration/${params.id}/new`);
    }
  }, [isSuccess]);

  return (
    <GenericDialog
      maxWidth="sm"
      title="Confirmation"
      open={open}
      onClose={onClose}
    >
      <MainTypography>
        {" "}
        {registrationType == "local"
          ? "Are you sure you want to continue registration with the local record?"
          : "Are you sure you want to continue registration with the remote record?"}
      </MainTypography>
      <MainButton
        sx={{ mr: 0.5 }}
        title={"Yes"}
        onClick={() => {
          // patient available in DDE and merge with Local
          if (identifier) {
            mutate({
              primary: { patient_id: initialRegisteredPatient.patient_id },
              secondary: [
                {
                  doc_id: identifier?.identifier,
                },
              ],
            });
          } else {
            if (registrationType == "local") {
              mutate({
                primary: { patient_id: initialRegisteredPatient.patient_id },
                secondary: [
                  {
                    patient_id: patient.uuid,
                  },
                ],
              });
            } else {
              navigateTo(`/registration/${params.id}/new`);
            }
          }
        }}
      />
      <MainButton variant="secondary" title={"No"} onClick={onClose} />
      <OverlayLoader open={isPending} />
    </GenericDialog>
  );
};

const AddReferralDialog = ({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
}) => {
  return (
    <GenericDialog
      maxWidth="sm"
      title="Add Referral"
      open={open}
      onClose={onClose}
    >
      <EditReferralForm onSubmit={onSubmit} />
    </GenericDialog>
  );
};

const SuccessMessage = ({ open }: { open: boolean }) => {
  const { navigateTo } = useNavigation();
  return (
    <GenericDialog open={open} maxWidth="sm" title="" onClose={() => {}}>
      <OperationSuccess
        title="Process Completed Successfully"
        primaryActionText="Register More"
        secondaryActionText="Go Home"
        onPrimaryAction={() => {
          navigateTo("/registration/list");
        }}
        onSecondaryAction={() => {
          navigateTo("/dashboard");
        }}
      />
    </GenericDialog>
  );
};
