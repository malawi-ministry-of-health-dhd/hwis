import {
  createAetcVisitList,
  moveAetcVisitListPatient,
} from "@/services/aetcVisitList";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const addPatientToAetcVisitList = () => {
  const queryClient = useQueryClient();

  const addData = (payload: any) =>
    createAetcVisitList(payload).then((response) => response.data);

  return useMutation({
    mutationFn: addData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["screening"] });
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
  });
};

export const movePatientToAetcCategory = () => {
  const queryClient = useQueryClient();

  const moveData = (payload: any) => {
    const { patient_id: patientId, ...attributes } = payload;

    return moveAetcVisitListPatient(patientId, attributes).then(
      (response) => response.data,
    );
  };

  return useMutation({
    mutationFn: moveData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["screening"] });
      queryClient.invalidateQueries({ queryKey: ["registration"] });
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
  });
};
