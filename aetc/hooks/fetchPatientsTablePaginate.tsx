import { useEffect, useState, useCallback } from "react";
import { getDailyVisitsPaginated } from "@/services/patient";
import { queryClient } from "@/providers";
import { DailyVisitPaginated, Patient } from "@/interfaces";

// Define types
type Category =
  | "assessment"
  | "triage"
  | "disposition"
  | "awaiting_speciality"
  | "screening"
  | "registration"
  | "investigations";

interface PaginationModel {
  page: number;
  pageSize: number;
}

export const fetchPatientsTablePaginate = (
  category: Category,
  patientCareArea?: string,
  creator?: string,
  department?: string,
) => {
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchText, setSearchText] = useState<string>("");
  const [patients, setPatients] = useState<Array<any>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [onSwitch, setOnSwitch] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, [
    patientCareArea,
    paginationModel,
    searchText,
    onSwitch,
    creator,
    department,
  ]);

  const fetchData = async () => {
    setLoading(true);
    let date;

    if (onSwitch) {
      date = new Date().toISOString().split("T")[0];
    }

    try {
      const response = await getPatientsFromCacheOrFetch(
        category,
        paginationModel.pageSize,
        searchText,
        paginationModel.page + 1,
        date || "",
        patientCareArea,
        creator,
        department,
      );

      setPatients(response.data.data);
      setTotalPages(response.data.total_pages);
      setTotalEntries(response.data.totalEntries);
    } catch (error) {
      console.error("Error fetching patients:", error);
      // Optionally set error state here
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    patients,
    paginationModel,
    setPaginationModel,
    searchText,
    setSearchText,
    totalPages,
    totalEntries,
    setOnSwitch,
    refetch: fetchData, // Add refetch to the returned object
  };
};

export const getPatientsFromCacheOrFetch = async (
  category: Category,
  pageSize: number,
  searchString: string,
  page: number,
  date: string,
  patientCareArea?: string,
  creator?: string,
  department?: string,
): Promise<any> => {
  let query = `category=${category}&page=${page}&page_size=${pageSize}&search=${searchString}&date=${date}`;

  if (patientCareArea) {
    query = query + `&patient_care_area=${encodeURIComponent(patientCareArea)}`;
  }
  if (department) {
    query = query + `&department=${encodeURIComponent(department)}`;
  }

  if (creator) {
    query = query + `&last_encounter_creator=${encodeURIComponent(creator)}`;
  }

  const patientList = await getDailyVisitsPaginated(query);

  return patientList;
  // }
};
