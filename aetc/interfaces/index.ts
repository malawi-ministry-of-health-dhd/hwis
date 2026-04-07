export interface Set {
  concept_set_id: number;
  concept_set: number;
  sort_weight: number;
  uuid: string;
  names: Name[];
}
export interface Name {
  locale: string;
  concept_id: number;
  name: string;
  uuid: string;
}

export interface Concept {
  concept_set_id?: number;
  concept_id: number;
  is_set: number;
  uuid: string;
  set_members: Set[];
  names: Name[];
}

export interface Address {
  address1?: string;
  address2?: string;
  address3?: string;
  stateProvince?: string;
  countyDistrict?: string;
  county_district?: string;
  cityVillage?: string;
  city_village?: string;
  country?: string;
  postalCode?: string;
  preferred?: boolean;
  current_district?: string;
  current_village?: string;
  current_traditional_authority?: string;
  home_district?: string;
  home_village?: string;
  home_traditional_authority?: string;
}

export interface Identifier {
  identifier: string;
  identifierType?: string;
  identifier_type?: {
    name: string;
    uuid: string;
  };
  preferred: boolean;
  uuid?: string;
}

export interface Patient {
  patient_id: number;
  identifiers: Identifier[];
  addresses: Address[];
  uuid: string;
  gender: string;
}

export interface PersonAttribute {
  person_attribute_id: number;
  person_attribute_type_id: number;
  person_id: number;
  uuid: string;
  value: string;
}

export interface Person {
  latest_encounter_type: string;
  patient_id: number;
  identifiers: Identifier[];
  given_name: string;
  family_name: string;
  aetc_visit_number: string;
  birthdateEstimated: boolean;
  gender: string;
  birthdate: Date;
  person: Person;
  addresses: Address[];
  uuid: string;
  visit_uuid: string;
  arrival_time: string;
  triage_result: string;
  latest_encounter_time: any;
  names: Array<{
    given_name: string;
    family_name: string;
  }>;
  active_visit?: ActiveVisit;
  person_attributes: PersonAttribute[];
}

export interface DailyVisitPaginated {
  page: number;
  total_pages: number;
  per_page: number;
  data: any[];
  totalEntries: number;
}

export interface PaginationModel {
  pageSize: number;
  page: number;
}

export interface PatientUpdateResponse extends Person {
  patient: Patient;
}

interface EncounterType {
  name: string;
  description: string;
  uuid: string;
}

export interface Obs {
  concept(concept: any): unknown;
  group_members: any;
  obs_id: number;
  person_id: number;
  concept_id: number;
  encounter_id: number;
  order_id: number | null;
  obs_datetime: string;
  obs_group_id: number | null;
  accession_number: any;
  value_datetime: string | null;
  value_numeric: number | null;
  value_text: string | null;
  value_complex: any;
  comments: any;
  uuid: string;
  previous_version: any;
  form_namespace_and_path: any;
  status: string;
  interpretation: any;
  value: any;
  value_coded_uuid: any;
  names: Name[];
  created_by: string;
  children: Obs[];
  groupMembers: Obs[];
  coded?: boolean;
}

export interface Encounter {
  encounter_id: number;
  encounter_type: EncounterType;
  patient_id: number;
  form_id: number | null;
  encounter_datetime: string;
  visit_id: number;
  uuid: string;
  obs: Obs[];
  created_by: string;
  person_uuid?: string;
  visit: Visit;
}

export interface Visit {
  uuid: string;
  patient: string;
  visitType: string;
  startDatetime: string;
}

export interface LabRequest {
  id?: any;
  uuid: string;
  // test: string;
  sample: string;
  sampleType: string;
  specimenSite: string;
  testType?: string;
  test: TestType;
}

export interface Role {
  role: string;
  description: string;
  uuid: string;
}

export interface UserRole {
  user_id: number;
  role: Role;
}
export interface User {
  uuid: string;
  username: string;
  user_roles: UserRole[];
  person: Person;
}

export interface IApiService {
  getAll<T>(query?: string): Promise<any>;

  getOne<T>(id: string | string, query?: string): Promise<any>;

  create<T>(data: Partial<T>): Promise<any>;

  edit<T>(id: string | number, data: Partial<T>): Promise<any>;
}

export type TriageResult = "" | "yellow" | "red" | "green";

export type DDESearch = {
  locals: Person[] | Patient[];
  remotes:
    | Person[]
    | Patient[]
    | Array<{ patient_identifiers: Array<any>; person: Person }>;
};

export type DDEScore = {
  person: Person;
  score: number;
};

export type TestType = {
  name: string;
  concept_id: number;
  names: Name[];
};

export type SpecimenType = {
  name: string;
  concept_id: number;
  names: Name[];
};

export type LabReason = {
  name: string;
  concept_id: number;
  uuid: string;
};

export type Order = {
  id: number;
  concept_id: number;
  name: string;
  accession_number: string;
};

export type LabResult = {
  id: number;
  concept_id: number;
  name: string;
  order: Order;
  result: any;
};

interface Specimen {
  concept_id: number;
  name: string;
}

interface ReasonForTest {
  concept_id: number;
  name: string;
}

export interface LabStatusUpdatedBy {
  first_name: string;
  last_name: string;
  id: string | number;
  phone_number?: string | null;
}

export interface LabStatusEntry {
  status_id: number;
  status: string;
  timestamp: string;
  updated_by?: LabStatusUpdatedBy | null;
}

export interface LabResultIndicator {
  concept_id: number;
  name: string;
}

export interface LabResultValue {
  id: number;
  indicator: LabResultIndicator;
  date: string;
  value: string | number | null;
  value_type: string;
  value_modifier: string;
  program_id: number | null;
}

interface Test {
  id: number;
  concept_id?: number;
  uuid?: string;
  name: string;
  result?: LabResultValue[];
  test_status?: LabStatusEntry;
  test_status_trail?: LabStatusEntry[];
}

export type PatientLabOrder = {
  id: number;
  order_id: number;
  encounter_id: number;
  order_date: string;
  patient_id: number;
  accession_number: string;
  specimen: Specimen;
  requesting_clinician: string;
  target_lab: string;
  reason_for_test: ReasonForTest;
  delivery_mode: any;
  order_status?: LabStatusEntry;
  order_status_trail?: LabStatusEntry[];
  tests: Test[];
};

export type District = {
  district_id: number;
  name: string;
};

export type TraditionalAuthority = {
  traditional_authority_id: number;
  name: string;
  district_id: number;
};

export type Village = {
  village_id: number;
  name: string;
  traditional_authority_id: number;
};

export type Relationship = {
  relationship_id: number;
  person_a: Person;
  relationship: number;
  person_b: Person;
  uuid: string;
};

export type RelationshipType = {
  relationship_type_id: number;
  a_is_to_b: string;
  b_is_to_a: string;
  preferred: number;
  weight: number;
  description: string;
  creator: number;
  date_created: string;
  uuid: string;
  retired: boolean;
  retired_by: null | number; // Assuming retired_by could potentially be a number if not null.
  date_retired: null | string; // Assuming the date format is the same as `date_created` if not null.
  retire_reason: null | string;
};

export interface ActiveVisit {
  visit_id: number;
  patient_id: number;
  uuid: string;
  visit_type_id: number;
  date_started: Date;
  date_stopped: Date;
}

export interface Drugs {
  drug_id: number;
  concept_id: number;
  name: string;
  combination: number;
  dosage_form: string | null;
  dose_strength: string | null;
  maximum_daily_dose: string | null;
  minimum_daily_dose: string | null;
  route: string | null;
  units: string;
  creator: number;
  date_created: Date;
  retired: number;
  retired_by: number | null;
  date_retired: Date | null;
  retire_reason: string | null;
  uuid: string;
}

export interface LabFormProps {
  onClose: () => void;
  addRequest: (value: LabRequest) => void;
}

export interface BedsideFormProps {
  onClose: () => void;
  addRequest: (value: LabRequest) => void;
}

export interface FormValueLabel {
  section: string;
  formValues: Array<{
    label: string | undefined;
    value: string | undefined;
  }>;
}

export interface Printer {
  id: number;
  name: string;
  ip_address: string;
}

export interface DeathReport {
  id: number;
  place_of_death: string;
  date_of_death: string;
  time_of_death: string;
  date_of_arrival: string;
  time_of_arrival: string;
  brought_by: string;
  brought_by_contact: string;
  gender_deceased: string;
  pregnant: boolean;
  what_happened: string;
  patient_seen_at_hospital: boolean;
  history_of_travel: string;
  immediate: string;
  underlying_conditions: string;
  involved_in_accident: boolean;
  place_of_injury: string;
  time_of_injury: string | null;
  date_of_injury: string | null;
  how_the_injury_occurred: string;
  police_informed: boolean;
  police_station_informed: string;
  is_death_natural: boolean;
  autopsy_is_discussed: boolean;
  mortuary_informed: boolean;
  name_of_confirming_death: string;
  date_confirming_death: string;
  time_confirming_death: string;
  created_at: string;
  updated_at: string;
}
