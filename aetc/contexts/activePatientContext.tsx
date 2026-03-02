"use client";
import { useParameters } from "@/hooks";
import { getOnePatient, getPatientVisitTypes } from "@/hooks/patientReg";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface PatientContextProps {
  activeVisit?: string;
  patientId?: string;
  activeVisitId?: string;
  isLoading: boolean;
  isSuccess: boolean;
  gender?: string;
  patient?: any;
  hasActiveVisit: boolean | null;
  recentVisitCloseDateTime?: string;
  closedVisitId?: string;
  openClosedVisit: () => void;
}

const PatientContext = createContext<PatientContextProps | undefined>(
  undefined
);

export const ActivePatientProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [hasActiveVisit, setHasActiveVisit] = useState<boolean | null>(null);
  const { params } = useParameters();
  const {
    data: patientVisits,
    isLoading: isLoadingVisits,
    isSuccess: isVisitsSuccess,
  } = getPatientVisitTypes(params?.id as string);

  const {
    data: patient,
    isLoading: isLoadingPatient,
    isSuccess: isPatientSuccess,
  } = getOnePatient(params?.id as string);
  const activeVisit = patient?.active_visit;

  const recentClosedVisit =
    patientVisits && patientVisits.length > 0
      ? patientVisits[patientVisits.length - 1]
      : null;

  useEffect(() => {
    if (!isVisitsSuccess || !isPatientSuccess) {
      setHasActiveVisit(null);
      return;
    }

    setHasActiveVisit(Boolean(activeVisit));
  }, [activeVisit, isVisitsSuccess, isPatientSuccess]);

  const value: PatientContextProps = {
    activeVisit: activeVisit?.uuid,
    patientId: params?.id as string,
    activeVisitId: activeVisit?.visit_id as unknown as string,
    isLoading: isLoadingVisits || isLoadingPatient,
    isSuccess: isVisitsSuccess && isPatientSuccess,
    gender: patient?.gender,
    patient,
    hasActiveVisit,
    recentVisitCloseDateTime:
      recentClosedVisit?.date_stopped as unknown as string,
    closedVisitId: recentClosedVisit?.uuid,
    openClosedVisit: () => setHasActiveVisit(true),
  };

  return (
    <PatientContext.Provider value={value}>{children}</PatientContext.Provider>
  );
};

export const usePatientContext = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error("usePatientContext must be used within a PatientProvider");
  }
  return context;
};
