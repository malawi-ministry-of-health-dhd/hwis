import { concepts } from "@/constants";
import { getAll, create } from "./httpService";
import {
  Concept,
  LabReason,
  LabResult,
  PatientLabOrder,
  SpecimenType,
  TestType,
} from "@/interfaces";
import { getConceptFromCacheOrFetch } from "@/hooks/encounter";

// export const getTestTypes = (name: string) => getSetMembers(name);
export const getTestTypes = (name: string) =>
  getAll(`/lab/test_types?specimen_type=${name}`);
export const getSpecimenTypes = () => getSetMembers(concepts.INVESTIGATIONS);
export const getLabReason = () => getAll<LabReason[]>("/lab/reasons_for_test");
export const createLabOrder = (order: any) =>
  create<PatientLabOrder[]>(order, "/lab/orders");
export const getPatientLabTests = (id: string) =>
  getAll<PatientLabOrder[]>(`/lab/orders?patient=${id}`);
export const getSetMembers = async (id: string) => {
  const concept = await getConceptFromCacheOrFetch(id);

  // console.log("concept?.data[0].uuid",concept?.data[0].uuid);
  return getAll<Concept[]>(
    `/concepts/${concept?.data[0].uuid}/set_members?paginate=false`,
  );
};
