import { getCachedConcept } from "@/helpers/data";
import {
  getTestTypes,
  getSpecimenTypes,
  getLabReason,
  createLabOrder,
  getPatientLabTests,
  getSetMembers,
} from "@/services/labService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getConceptFromCacheOrFetch } from "./encounter";

export const getLabTestTypes = (name: string) => {
  const findAll = async () => {
    return getTestTypes(name).then((response) => {
      console.log({ response });
      return response.data;
      // .filter(
      //   (test: any) =>
      //     test.names.length > 0 && test.names.some((n: any) => n?.name),
      // )
      // .map((test: any) => ({
      //   ...test,
      //   name: test.names.find((n: any) => n?.name)?.name,
      // }))
      // .sort((a: any, b: any) => a.name.localeCompare(b.name));
    });
  };
  return useQuery({
    queryKey: ["testTypes", name],
    queryFn: findAll,
    enabled: true,
  });
};

export const getLabSpecimenTypes = () => {
  const findAll = async () => {
    return getSpecimenTypes().then((response) =>
      response.data.sort((a: any, b: any) =>
        a.names[0].name.localeCompare(b.names[0].name),
      ),
    );
  };

  return useQuery({
    queryKey: ["getSpecimenTypes"],
    queryFn: findAll,
    enabled: true,
  });
};

export const getLabTestReason = () => {
  const findAll = async () => {
    return getLabReason().then((response) => response.data);
  };
  return useQuery({
    queryKey: ["getLabTestReasons"],
    queryFn: findAll,
    enabled: true,
  });
};

export const getPatientLabOrder = (patientId: string) => {
  const findAll = async () => {
    return getPatientLabTests(patientId).then((response) => response.data);
  };
  return useQuery({
    queryKey: ["patientsOrder", patientId],
    queryFn: findAll,
    enabled: true,
  });
};

export const getConceptSetMembers = (id: string) => {
  const findAll = async () => {
    return getSetMembers(id).then((response) => response.data);
  };

  return useQuery({
    queryKey: ["concept-setMembers", id],
    queryFn: findAll,
    enabled: false,
  });
};

export const createOrder = (id?: string) => {
  const queryClient = useQueryClient();
  const addData = (patientData: any) => {
    return createLabOrder(patientData).then((response) => {
      return response.data;
    });
  };
  return useMutation({
    mutationFn: addData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientsOrder"] });
    },
  });
};
