import {
  ActiveVisit,
  DailyVisitPaginated,
  DDEScore,
  DDESearch,
  DeathReport,
  Patient,
  PatientUpdateResponse,
  Person,
  Relationship,
  RelationshipType,
} from "@/interfaces";
import { create, edit, get, getAll, getOne, remove  } from "./httpService";

const endPoint = "/people";

export const createPatient = (patientData: any) =>
  create(patientData, endPoint);

export const initialRegistration = (patientData: any) =>
  create<Person>(patientData, "/patients");

export const getPatients = () => getAll<Array<any>>(endPoint);

export const getDailyVisits = (queryParam?: string) =>
  getAll<Person[]>(
    `/aetc_visit_lists?category=${queryParam}&paginate=false`
  );

export const getDailyVisitsPaginated = (queryParam?: string) =>
  getAll<DailyVisitPaginated>(
    `/aetc_visit_lists?${queryParam}&paginate=true`
  );

// getAll<Person[]>(`/daily_visits?category=${queryParam}`);
// getAll<{
//   page: number,
//   total_pages: number,
//   per_page: number,
//   data: Person[]
// }>(`/visits?date_stopped&category=${queryParam}`);

export const updatePatient = (patientId: string, patientData: any) =>
  edit<PatientUpdateResponse>(patientId, patientData, endPoint);

export const potentialDuplicates = (patientData: any) =>
  create(patientData, "/search/people");

export const getPatient = (uuid: string) => getOne<Person>(uuid, "/patients");

export const findByNameAndGender = (
  firstName: string,
  lastName: string,
  gender: string
) =>
  getAll<DDESearch>(
    `/dde/patients/find_by_name_and_gender?given_name=${firstName}&family_name=${lastName}&gender=${gender}&visit_type_id=${process.env.NEXT_PUBLIC_DDEPROGRAMID}`
  );

export const searchByNameAndGender = (
  firstName?: string,
  lastName?: string,
  gender?: string
) =>
  getAll<DDESearch>(
    `/search/patients?given_name=${firstName}&family_name=${lastName}&gender=${gender}`
  );
export const findByNPID = (npid: string) =>
  getAll<DDESearch>(
    `/dde/patients/find_by_npid?npid=${npid}&visit_type_id=${process.env.NEXT_PUBLIC_DDEPROGRAMID}`
  );

export const findByDemographics = (
  firstName: string,
  lastName: string,
  gender: string,
  birthdate: string,
  homeVillage: string,
  homeTA: string,
  homeDistrict: string
) =>
  getAll<DDEScore[]>(
    `/dde/patients/match_by_demographics?home_district=${homeDistrict}&home_traditional_authority=${homeTA}&home_village=${homeVillage}&birthdate=${birthdate}&given_name=${firstName}&family_name=${lastName}&gender=${gender}&visit_type_id=${process.env.NEXT_PUBLIC_DDEPROGRAMID}`
  );

export const mergePatients = (data: any) => {
  return create<Person & { active_visit: ActiveVisit }>(
    data,
    `/dde/patients/merge?visit_type_id=${process.env.NEXT_PUBLIC_DDEPROGRAMID}`
  );
};

export const getRelations = (patientId: string) => {
  return getAll<Relationship[]>(
    `/relationships?person_a=${patientId}&paginate=false`
  );
};

export const getRelationshipTypes = () => {
  return getAll<RelationshipType[]>(`/relationship_types?paginate=false`);
};

export const getPatientVisits = (id: string) => {
  return getAll<ActiveVisit[]>(`/patients/${id}/visits`);
};

export const checkPatientIfOnAssessment = (id: string) => {
  return get(`/visits/${id}/eligible?category=assessment`);
};

export const addDeathReport = (data: any) =>
  create<DeathReport>(data, "/death_reports");

export const getDeathReports = () => get<DeathReport[]>("/death_reports");

export const updateDeathReport = (id: string | number, data: any) =>
  edit<DeathReport>(id, data, "/death_reports");

export const voidPatient = (id: string, void_reason:string) => remove<Patient>(`patients/${id}`, {  id, void_reason });

// export const updateDeathReport = (id: string, data: any) =>
//   edit<DeathReport>(id, data, "/death_reports");
