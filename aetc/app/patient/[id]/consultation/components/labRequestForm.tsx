import { useEffect, useState } from "react";
import {
  MainTypography,
  WrapperBox,
  FormikInit,
  RadioGroupInput,
  SearchComboBox,
  Header,
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
import { getHumanReadableDateTimeLab } from "@/helpers/dateTime";
import * as Yup from "yup";
import {
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Box,
  Button,
} from "@mui/material";
import { concepts, encounters } from "@/constants";
import { getPatientsEncounters } from "@/hooks/encounter";
import { useFormikContext } from "formik";
import { getConceptFromCacheOrFetch } from "@/hooks/encounter";
import { Bounce, toast } from "react-toastify";
import { ContainerLoaderOverlay } from "@/components/containerLoaderOverlay";
import { useVisitDates } from "@/contexts/visitDatesContext";

// Types
interface LabOrderTest {
  test: string;
  date: string;
  specimen: string;
  id: number;
  comment_to_fulfiller?: string; // Optional field for comments
}

interface GroupedTests {
  [key: string]: LabOrderTest[];
}

interface FormValues {
  testType: string;
  sampleType: string;
  selectedLabOrderIds: number[];
}

interface OrderedTestsCheckboxesProps {
  groupedTests: GroupedTests;
}

interface ProcessedTest {
  testName: string;
  testId: number;
  specimenType: string;
  date: string;
}

// Component to handle checkboxes with Formik
const OrderedTestsCheckboxes: React.FC<OrderedTestsCheckboxesProps> = ({
  groupedTests,
}) => {
  const { values, setFieldValue } = useFormikContext<FormValues>();

  // Initialize selected tests if not already in form values
  useEffect(() => {
    if (!values.selectedLabOrderIds) {
      setFieldValue("selectedLabOrderIds", []);
    }
  }, []);

  const handleCheckboxChange = (testId: number): void => {
    const currentSelected = values.selectedLabOrderIds || [];
    let newSelected: number[];

    if (currentSelected.includes(testId)) {
      newSelected = currentSelected.filter((id) => id !== testId);
    } else {
      newSelected = [...currentSelected, testId];
    }

    setFieldValue("selectedLabOrderIds", newSelected);
  };

  return (
    <Box sx={{ mt: 3, mb: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Ordered Tests
      </Typography>

      {Object.entries(groupedTests).map(([specimen, testsArray]) => (
        <Box key={specimen} sx={{ mb: 2 }}>
          <Typography variant="subtitle2">{specimen}</Typography>
          <FormGroup>
            {testsArray.map((test) => (
              <FormControlLabel
                key={test.id}
                control={
                  <Checkbox
                    checked={
                      values.selectedLabOrderIds?.includes(test.id) || false
                    }
                    onChange={() => handleCheckboxChange(test.id)}
                  />
                }
                label={`${test.test} (${getHumanReadableDateTimeLab(test.date)})`}
              />
            ))}
          </FormGroup>
        </Box>
      ))}
    </Box>
  );
};

export const LabRequestForm: React.FC<LabFormProps> = ({
  onClose,
  addRequest,
}) => {
  const [sampleName, setSampleName] = useState<string>("");
  const [request, setRequest] = useState<any>({});

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
  const [testType, setTestType] = useState<string>("");
  const [sampleId, setSampleId] = useState<string>("");
  const [bedsideTestId, setBedsideTestId] = useState<string>("");
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

  const { params } = useParameters();
  const { activeVisit, patientId } = getActivePatientDetails();
  const { mutate, isPending, isSuccess: orderCreated } = createOrder();
  const { selectedVisit } = useVisitDates();

  const { data: labOrdersPlan, refetch: refetchLabOrdersPlan } =
    getPatientsEncounters(
      params?.id as string,
      `encounter_type=${encounters.LAB_ORDERS_PLAN}&visit=${selectedVisit?.uuid}`,
    );
  const { data: labOrdersObs, refetch: refetchLabOrders } =
    getPatientsEncounters(
      params?.id as string,
      `encounter_type=${encounters.LAB}&visit=${selectedVisit?.uuid}`,
    );

  useEffect(() => {
    refetch();
  }, [sampleName]);

  useEffect(() => {
    reloadSamples();
  }, [sampleId]);
  useEffect(() => {
    refetchLabOrdersPlan();
    refetchLabOrders();
  }, []);
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
    const transform = transformBedsideTests();
    setTests(transform);
  }, [bedsideTests]);

  useEffect(() => {
    if (!labTests) return;
    setTests(labTests);
  }, [labTests]);

  const transformedBedsideSamples = (): Concept[] => {
    if (!bedsideSampleTypes) return [];
    return bedsideSampleTypes
      .map((c) => ({
        ...c,
        names: c.names,
        name: c.names[0].name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const transformBedsideTests = (): Concept[] => {
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
    toast.success("Test submitted successfully!", {
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
    onClose();
  }, [orderCreated]);
  const handleLabSend = async (values: FormValues) => {
    const selectedLabOrderIds = values.selectedLabOrderIds || [];

    const selectedOrderTests = flattenedLabOrdersPlan
      .filter((test) => selectedLabOrderIds.includes(test.id))
      .map((test) => ({
        testName: test.test,
        testId: test.id,
        specimenType: test.specimen,
        date: test.date,
        ...(test?.comment_to_fulfiller
          ? { comment_to_fulfiller: test.comment_to_fulfiller }
          : {}),
      }));

    // Group tests by both specimen type AND date
    const testsBySpecimenAndDate = selectedOrderTests.reduce(
      (groups: Record<string, any[]>, test) => {
        // Create a composite key using both specimen type and date
        const key = `${test.specimenType}|${test.date}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(test);
        return groups;
      },
      {} as Record<string, any[]>,
    );

    // Create orders for each specimen type and date combination
    const orderPromises = Object.entries(testsBySpecimenAndDate).map(
      async ([compositeKey, tests]) => {
        // Add a type assertion to tell TypeScript that tests is an array
        const testsArray = tests as any[];
        // Extract specimen type and date from the composite key
        const [specimenType, testDate] = compositeKey.split("|");
        // Map tests for this specimen and date
        const mappedTests = await Promise.all(
          testsArray.map(async (test) => ({
            concept: await getConceptFromCacheOrFetch(test.testName).then(
              (res) => res.data[0].uuid,
            ),
          })),
        );

        // Get specimen concept (using the first test in this group)
        const specimenConcept = await getConceptFromCacheOrFetch(
          specimenType,
        ).then((res) => res.data[0].uuid);

        return {
          patient: patientId,
          visit: activeVisit,
          tests: mappedTests,
          reason_for_test: "b998cdac-8d80-11d8-abbb-0024217bb78e",
          target_lab: "Blantyre Dream Project Clinic",
          date: testDate,
          requesting_clinician: localStorage.getItem("userName"),
          comment_to_fulfiller: testsArray[0].comment_to_fulfiller || "",
          specimen: {
            concept: specimenConcept,
            specimenType: specimenType,
          },
        };
      },
    );

    // Resolve all order promises
    const orders = await Promise.all(orderPromises);

    // Now you can use this data to send to your API
    // Example of how you might create an order with the selected tests
    const order = {
      orders: orders,
    };
    // Uncomment to actually submit the order
    mutate(order);
    refetchLabOrdersPlan();
    refetchLabOrders();
  };
  const filterTests = (tests: any, encounters: any) => {
    const matchMap = new Map();

    encounters.forEach((encounter: any) => {
      encounter.obs.forEach((observation: any) => {
        if (observation.value_coded !== null) {
          const key = `${observation.value_coded}_${observation.obs_datetime}`;
          matchMap.set(key, true);
        }
      });
    });

    // Filter out tests that match both criteria
    return tests.filter((test: any) => {
      const key = `${test.testConceptId}_${test.date}`;
      return !matchMap.has(key);
    });
  };
  // Parse lab orders plan
  let flattenedLabOrdersPlan: LabOrderTest[] = [];

  if (labOrdersPlan && labOrdersPlan?.length > 0) {
    flattenedLabOrdersPlan = labOrdersPlan[0]?.obs?.flatMap((obs: any) => {
      return obs.children.map((test: any) => {
        let descriptionConcept;
        if (test.children && test.children.length > 0) {
          descriptionConcept = test.children.find((child: any) =>
            child.names.find((name: any) => name.name == concepts.DESCRIPTION),
          );
        }

        return {
          test:
            test.names.find((n: any) => n.locale_preferred == 1)?.name ||
            "Unknown Test",
          testConceptId: test.concept_id,
          date: obs.obs_datetime,
          specimen: obs.names[0].name,
          id: test.obs_id,
          ...(descriptionConcept
            ? { comment_to_fulfiller: descriptionConcept?.value }
            : {}),
        };
      });
    });

    if (labOrdersObs && labOrdersObs?.length > 0)
      flattenedLabOrdersPlan = filterTests(
        flattenedLabOrdersPlan,
        labOrdersObs,
      );
  }

  // Group tests by specimen type
  const groupedTests: GroupedTests = flattenedLabOrdersPlan.reduce(
    (groups: GroupedTests, item: LabOrderTest) => {
      const key = item.specimen;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    },
    {} as GroupedTests,
  );

  return (
    <ContainerLoaderOverlay loading={isPending}>
      <FormikInit
        initialValues={{
          testType: "",
          sampleType: "",
          selectedLabOrderIds: [], // Initialize array to store selected checkbox IDs
        }}
        onSubmit={handleLabSend}
        validationSchema={Yup.object().shape({
          selectedLabOrderIds: Yup.array().of(Yup.number()), // Add validation for array of numbers
        })}
      >
        {/* Lab Orders Plan Tests as Checkboxes */}
        {flattenedLabOrdersPlan.length > 0 && (
          <OrderedTestsCheckboxes groupedTests={groupedTests} />
        )}
      </FormikInit>
    </ContainerLoaderOverlay>
  );
};
