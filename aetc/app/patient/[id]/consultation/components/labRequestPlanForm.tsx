import { useEffect, useState, useRef } from "react";
import {
  MainTypography,
  WrapperBox,
  FormikInit,
  RadioGroupInput,
  SearchComboBox,
  Header,
  TextInputField,
} from "@/components";
import { Concept, LabFormProps, LabRequest, TestType } from "@/interfaces";
import {
  createOrder,
  getConceptSetMembers,
  getLabSpecimenTypes,
  getLabTestReason,
  getLabTestTypes,
} from "@/hooks/labOrder";
import { getActivePatientDetails, useParameters } from "@/hooks";
import { getOnePatient } from "@/hooks/patientReg";
import * as Yup from "yup";
import { Typography } from "@mui/material";
import { concepts, encounters } from "@/constants";
import { useFormikContext } from "formik";
import { fetchConceptAndCreateEncounter } from "@/hooks/encounter";
import { useServerTime } from "@/contexts/serverTimeContext";
import { ContainerLoaderOverlay } from "@/components/containerLoaderOverlay";
import { Bounce, toast } from "react-toastify";

// This is a component to handle form resets when sample type changes
const FormResetHandler = ({ sampleName }: { sampleName: any }) => {
  const formik = useFormikContext();
  const prevSampleNameRef = useRef(sampleName);

  useEffect(() => {
    // Only reset if sampleName actually changed and is not empty (initial load)
    if (sampleName !== prevSampleNameRef.current && sampleName !== "") {
      // Reset tests when sample type changes
      formik.setFieldValue("tests", []);

      // Set radio buttons to undefined to make them unselected
      formik.setFieldValue("emergency", undefined);
      formik.setFieldValue("urgentSample", undefined);

      prevSampleNameRef.current = sampleName;
    }
  }, [sampleName, formik]);

  return null;
};

export const LabRequestPlanForm = ({ onClose, addRequest }: LabFormProps) => {
  const { ServerTime } = useServerTime();
  const [sampleName, setSampleName] = useState<string>("");
  const {
    data: specimenTypes,
    isLoading,
    isSuccess,
    refetch: refetchLabSpecimen,
    isRefetching: refetchingLabSpecimen,
  } = getLabSpecimenTypes();
  const {
    data: labTests,
    isLoading: loadingTests,
    isSuccess: testLoaded,
    refetch,
    isRefetching,
  } = getLabTestTypes(sampleName);
  const [testType, setTestType] = useState("");
  const [sampleId, setSampleId] = useState("");
  const [bedsideTestId, setBedsideTestId] = useState("");
  const {
    data: bedsideSampleTypes,
    isLoading: bedsideLoading,
    refetch: reloadSamples,
    isRefetching: reloading,
  } = getConceptSetMembers(sampleId);

  const {
    data: bedsideTests,
    isLoading: bedsideTestsLoading,
    refetch: reloadBedSideTests,
    isRefetching: reloadingBedsideTest,
  } = getConceptSetMembers(bedsideTestId);

  const [samples, setSamples] = useState<Concept[]>([]);
  const [tests, setTests] = useState<any>([]);
  const [formKey, setFormKey] = useState(0); // Add this to force form reset
  // Add a state to track radio button reset
  const [radioKey, setRadioKey] = useState(0);

  const { params } = useParameters();
  const { activeVisit, patientId } = getActivePatientDetails();
  const {
    mutate,
    isPending,
    isSuccess: orderCreated,
  } = fetchConceptAndCreateEncounter();

  useEffect(() => {
    refetch();
  }, [sampleName]);

  useEffect(() => {
    reloadSamples();
  }, [sampleId]);

  useEffect(() => {
    if (!bedsideSampleTypes) return;
    const transformed = transformedBedsideSamples();
    setSamples(transformed);
  }, [bedsideSampleTypes]);

  useEffect(() => {
    if (!specimenTypes) return;
    setSamples(specimenTypes);
  }, [specimenTypes, refetchingLabSpecimen]);

  useEffect(() => {
    reloadBedSideTests();
  }, [bedsideTestId]);

  useEffect(() => {
    if (!labTests) return;
    setTests(labTests);
  }, [labTests]);

  const transformedBedsideSamples = () => {
    if (!bedsideSampleTypes) return [];
    return bedsideSampleTypes
      .map((c) => ({
        ...c,
        names: c.names,
        name: c.names[0].name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const transformBedsideTests = () => {
    if (!bedsideTests) return [];
    const bedSideTestTypes = [
      "Random Blood Glucose (RBS)",
      "Fasting Blood Glucose (FBS)",
      "H. Pylori",
      "C-Reactive Protein (CRP)",
      "Haemoglobin",
      "Pregnancy Test",
      "HIV",
      "C-reactive protein",
      "Malaria Screening",
      "Blood Gas",
      "Urine Chemistries",
    ].map((name) => name.toLowerCase());

    return bedsideTests
      .filter((bed) => bed.names.length > 0 && bed.names.some((n) => n?.name))
      .map((bed) => ({
        ...bed,
        name: bed.names.find((n) => n?.name)?.name || "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((bed) => bedSideTestTypes.includes(bed.name?.toLowerCase()));
  };

  useEffect(() => {
    if (!orderCreated) return;
    toast.success("Test plan submitted successfully!", {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Bounce,
    });
  }, [orderCreated]);

  const handleLabSend = (values: any) => {
    const specimenType = JSON.parse(values.sampleType);
    const dateTime = ServerTime.getServerTimeString();
    const group_members = values?.tests.map((test: any) => {
      const group_members_data = [];
      if (values?.emergency) {
        group_members_data.push({
          concept: concepts.EMERGENCY,
          obsDatetime: dateTime,
          value: values.emergency,
        });
      }
      if (values?.urgentSample) {
        group_members_data.push({
          concept: concepts.URGENT,
          obsDatetime: dateTime,
          value: values.urgentSample,
        });
      }

      if (values?.description) {
        group_members_data.push({
          concept: concepts.DESCRIPTION,
          obsDatetime: dateTime,
          value: values.description,
        });
      }

      return {
        concept: test?.label,
        obsDatetime: dateTime,
        value: test?.id,
        groupMembers: group_members_data,
      };
    });

    const obs = [
      {
        concept: specimenType.name,
        obsDatetime: dateTime,
        value: specimenType.uuid,
        groupMembers: group_members,
      },
    ];

    // Reset form after submission by changing the key
    setFormKey((prevKey) => prevKey + 1);
    setRadioKey((prevKey) => prevKey + 1);

    // Clear the sampleName state and testType state
    setSampleName("");
    setTestType("");

    mutate({
      encounterType: encounters.LAB_ORDERS_PLAN,
      visit: activeVisit,
      patient: patientId,
      encounterDatetime: dateTime,
      obs,
    });
    onClose();
  };

  const handleSampleTypeChange = (value: string) => {
    const specimenType = JSON.parse(value);
    setSampleName(specimenType.name);
    setTestType(""); // Reset testType when sample type changes
    setRadioKey((prevKey) => prevKey + 1); // Force radio buttons to re-render

    // The tests field is reset by FormResetHandler
  };

  return (
    <ContainerLoaderOverlay loading={isPending}>
      <FormikInit
        key={formKey} // Add key to force re-render and reset the form
        initialValues={{
          testType: "",
          sampleType: "",
          tests: [],
          emergency: undefined,
          urgentSample: undefined,
          description: "",
        }}
        onSubmit={handleLabSend}
        validationSchema={Yup.object().shape({
          tests: Yup.array().required().label("Tests"),
          sampleType: Yup.string().required().label("Sample Type"),
          description: Yup.string().max(15).label("Description"),
        })}
        enableReinitialize={true}
      >
        {/* Add the reset handler component */}
        <FormResetHandler sampleName={sampleName} />

        <SearchComboBox
          getValue={handleSampleTypeChange}
          multiple={false}
          label="Sample Type"
          name="sampleType"
          sx={{ mb: 2 }}
          options={
            samples
              ? samples.map((sp) => ({
                  label: sp?.names[0]?.name,
                  id: JSON.stringify({
                    name: sp.names[0].name,
                    uuid: sp.names[0].uuid,
                  }),
                }))
              : []
          }
        />
        <SearchComboBox
          key={`tests-${sampleName}`} // Add key to force re-render when sampleName changes
          label="Tests"
          name="tests"
          options={
            tests
              ? tests.map((d: any) => ({
                  id: d.uuid,
                  label: d.name,
                }))
              : []
          }
        />
        <br />
        <WrapperBox
          key={`radio-buttons-${radioKey}`}
          sx={{ display: "flex", width: "50ch" }}
        >
          <RadioGroupInput
            getValue={(value) => setTestType(value)}
            row
            name="emergency"
            options={[
              { value: "Yes", label: "Yes" },
              { value: "No", label: "No" },
            ]}
            label="Emergency"
          />
          <RadioGroupInput
            getValue={(value) => setTestType(value)}
            row
            name="urgentSample"
            options={[
              { value: "Yes", label: "Yes" },
              { value: "No", label: "No" },
            ]}
            label="Urgent Sample"
          />
        </WrapperBox>
        <TextInputField
          name="description"
          label="Description"
          id="description"
          sx={{ width: "100%" }}
        />
      </FormikInit>
    </ContainerLoaderOverlay>
  );
};
