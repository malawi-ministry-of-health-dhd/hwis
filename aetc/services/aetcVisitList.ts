import { emrApiClient } from "./apiClients";
import { create } from "./httpService";

const endpoint = "/aetc_visit_lists";

export const createAetcVisitList = (payload: any) =>
  create(payload, endpoint);

export const moveAetcVisitListPatient = (
  patientId: string | number,
  payload: any,
) => emrApiClient().patch(`${endpoint}/${patientId}/move`, payload);
