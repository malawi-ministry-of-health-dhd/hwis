import { concepts, encounters } from "@/constants";
import { Concept, Obs } from "@/interfaces";
import { queryClient } from "@/providers";
import { moveAetcVisitListPatient } from "@/services/aetcVisitList";
import {
  createEncounter,
  getPatientEncounters,
  deleteObservation,
} from "@/services/encounter";
import { getAll } from "@/services/httpService";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";

type AetcMovePayload = {
  category: "disposition" | "awaiting_speciality";
  from_category: "assessment";
  disposition_type: string;
  destination?: string;
  department?: string;
};

const DISPOSITION_CONCEPTS = new Set<string>([
  concepts.DISCHARGE_HOME,
  concepts.ADMISSION,
  concepts.AWAITING_SPECIALITY_REVIEW,
  concepts.DEATH,
  concepts.ABSCONDED,
  concepts.REFUSED_HOSPITAL_TREATMENT,
  concepts.TRANSFER_OUT,
  concepts.SHORT_STAY,
]);

const normalizeObservations = (obs: any): Obs[] => {
  if (Array.isArray(obs)) return obs;
  return obs ? [obs] : [];
};

const getGroupMemberValue = (observation: any, concept: string) =>
  observation?.groupMembers?.find((member: any) => member?.concept === concept)
    ?.value;

const buildAetcDispositionMovePayload = (
  encounter: any,
  observations: Obs[],
): AetcMovePayload | null => {
  const encounterType = encounter?.encounterType;

  if (encounterType === encounters.AWAITING_SPECIALTY) {
    const awaitingSpecialityObservation = observations.find(
      (observation: any) =>
        observation?.concept === concepts.AWAITING_SPECIALITY_REVIEW,
    );

    if (!awaitingSpecialityObservation) return null;

    const department = getGroupMemberValue(
      awaitingSpecialityObservation,
      concepts.SPECIALITY_DEPARTMENT,
    );

    return {
      category: "awaiting_speciality",
      from_category: "assessment",
      disposition_type: concepts.AWAITING_SPECIALITY_REVIEW,
      ...(department ? { department } : {}),
    };
  }

  if (encounterType !== encounters.DISPOSITION) return null;

  const dispositionObservation = observations.find((observation: any) =>
    DISPOSITION_CONCEPTS.has(observation?.concept),
  );

  if (!dispositionObservation?.concept) return null;

  const dispositionType = dispositionObservation.concept;
  const isAwaitingSpeciality =
    dispositionType === concepts.AWAITING_SPECIALITY_REVIEW;

  const payload: AetcMovePayload = {
    category: isAwaitingSpeciality ? "awaiting_speciality" : "disposition",
    from_category: "assessment",
    disposition_type: dispositionType,
  };

  if (dispositionType === concepts.ADMISSION) {
    const ward = getGroupMemberValue(dispositionObservation, concepts.WARD);
    if (ward) payload.destination = ward;
  }

  if (isAwaitingSpeciality) {
    const department = getGroupMemberValue(
      dispositionObservation,
      concepts.SPECIALITY_DEPARTMENT,
    );

    if (department) payload.department = department;
  }

  return payload;
};

const syncAetcVisitListDisposition = async (
  encounter: any,
  observations: Obs[] | Obs,
) => {
  const patientId = encounter?.patient;
  if (!patientId) return;

  const normalizedObservations = normalizeObservations(observations);
  const payload = buildAetcDispositionMovePayload(
    encounter,
    normalizedObservations,
  );

  if (!payload) return;

  await moveAetcVisitListPatient(patientId, payload);

  queryClient.invalidateQueries({ queryKey: ["assessments"] });
  queryClient.invalidateQueries({ queryKey: ["disposition"] });
  queryClient.invalidateQueries({ queryKey: ["awaiting_speciality"] });
  queryClient.invalidateQueries({ queryKey: ["visits"] });
};

export const addEncounter = () => {
  const queryClient = useQueryClient();

  const addData = (encounter: any) => {
    const filteredEncounter = {
      ...encounter,
      obs: encounter?.obs?.filter((ob: any) => Boolean(ob.value)),
    };

    return createEncounter(filteredEncounter).then((response) => response.data);
  };

  return useMutation({
    mutationFn: addData,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["encounters"],
      });
    },
  });
};

export const getPatientsEncounters = (patientId: string, params?: string) => {
  const getall = (patientId: string) =>
    getPatientEncounters(patientId, params).then((response) => response.data);

  return useQuery({
    queryKey: ["encounters", patientId, params],
    queryFn: () => getall(patientId),
    enabled: !!patientId,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

export const removeObservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteObservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["observations"] });
    },
  });
};

export const fetchConceptAndCreateEncounter = () => {
  const addData = async (encounter: any) => {
    const filteredEncounter = {
      ...encounter,
      obs: encounter?.obs?.filter((ob: any) => Boolean(ob.value)),
    };

    const submittedObservations = filteredEncounter.obs;
    filteredEncounter.obs = await getConceptIds(filteredEncounter.obs);

    const createdEncounter = await createEncounter(filteredEncounter).then(
      (response) => response.data,
    );

    await syncAetcVisitListDisposition(encounter, submittedObservations);

    return createdEncounter;
  };

  return useMutation({
    mutationFn: addData,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["encounters", data.person_uuid],
      });
    },
  });
};

const getConceptIds: any = async (obs: Obs[]) => {
  const obsWithUUIDs = [];

  try {
    for (const observation of obs) {
      const conceptName = observation.concept as unknown as string;

      let concept: any = await getConceptFromCacheOrFetch(conceptName);

      let value = observation.value;

      if (concept?.data?.length == 0) {
        console.warn(`couldn't find concept "${conceptName}" 😥`);
        continue;
      }

      if (observation.coded || concept?.data[0]?.datatype == "Coded") {
        const valueConcept = await getConceptFromCacheOrFetch(
          observation.value,
        );

        if (valueConcept?.data.length == 0) {
          console.warn(`couldn't find concept "${observation.value}" 😥`);
          continue;
        }

        value = valueConcept?.data[0].uuid;
      }

      const groupMembers = Array.isArray(observation.groupMembers)
        ? await getConceptIds(observation.groupMembers)
        : [];

      if (concept.data.length > 0) {
        obsWithUUIDs.push({
          ...observation,
          concept: concept?.data[0]?.uuid,
          value,
          groupMembers,
          conceptName,
        });
      }
    }
  } catch (error) {
    console.error({ error });
  }

  return obsWithUUIDs;
};

export const getConceptFromCacheOrFetch = async (conceptName: string) => {
  const cachedConcept = queryClient.getQueryData(["concepts", conceptName]);
  let concept;
  if (cachedConcept) {
    concept = cachedConcept;
    console.log("using cached data", cachedConcept);
  } else {
    concept = await getConcept(conceptName);
    queryClient.setQueryData(["concepts", conceptName], concept);
    queryClient.setQueryData([concept?.data[0]?.uuid], conceptName);
  }
  return concept;
};

export const getConcept: any = async (conceptName: string) => {
  if (!conceptName) return null;
  return await getAll<Concept[]>(
    `/concepts?name=${encodeURI(conceptName)}&paginate=false&exact_match=true`,
  );
};

type ConceptOption = { id: string; label: string };
type RadioOption = { value: any; label: string };

const fetchConcepts = async (
  options: Array<{ key: string; label: string }>,
  useValueKey: boolean,
) => {
  const mappedOptions = [];

  for (const option of options) {
    const cachedConcept = queryClient.getQueryData(["concepts", option.key]);

    let conceptData = cachedConcept
      ? cachedConcept
      : await getConcept(option.key);

    if (!cachedConcept) {
      queryClient.setQueryData(["concepts", option.key], conceptData);
      queryClient.setQueryData([conceptData?.data[0]?.uuid], option.key);
    }

    if (conceptData.data.length) {
      mappedOptions.push({
        [useValueKey ? "value" : "id"]: conceptData?.data[0]?.uuid,
        label: option.label,
      });
    }
  }

  return mappedOptions;
};

export const fetchConceptsSelectOptions = (options: ConceptOption[]) =>
  fetchConcepts(
    options.map(({ id, label }) => ({ key: id, label })),
    false,
  );

export const fetchConceptsRadioOptions = (options: RadioOption[]) =>
  fetchConcepts(
    options.map(({ value, label }) => ({ key: value, label })),
    true,
  );
