import { OverlayLoader } from "@/components/backdrop";
import {
  SearchRegistrationContext,
  SearchRegistrationContextType,
} from "@/contexts";
import { demographicSearchDDEAdaptor } from "@/helpers/adapters";
import { searchDDEPatient } from "@/hooks/patientReg";
import { searchNPID } from "@/hooks/people";
import { Person } from "@/interfaces";
import { useContext, useState, useEffect } from "react";
import { SearchForm } from "../search/components/searchForm";
import { SearchNPIDForm } from "../search/components/searchNpid";
import { SearchResults } from "../search/components/searchResults";

export const DemographicsSearch = ({
  patient,
  genericSearch = false,
}: {
  patient: Person;
  genericSearch?: boolean;
}) => {
  const { setSearchedPatient: setSearchedPatientContext } = useContext(
    SearchRegistrationContext,
  ) as SearchRegistrationContextType;

  const [search, setSearch] = useState({
    firstName: "",
    lastName: "",
    gender: "",
  });

  const {
    refetch,
    isFetching,
    isSuccess: searchComplete,
    data,
    isError,
  } = searchDDEPatient(search.firstName, search.lastName, search.gender);
  const [searchedPatient, setSearchedPatient] = useState({});

  useEffect(() => {
    if (!Boolean(search.firstName)) return;
    refetch();
  }, [search]);

  const handleSubmit = (values: any) => {
    setSearchedPatient(values);
    setSearch({
      firstName: values.firstName,
      lastName: values.lastName,
      gender: values.gender,
    });
    setSearchedPatientContext({
      patient_id: patient.patient_id,
      firstName: values.firstName,
      lastName: values.lastName,
      gender: values.gender,
    });
  };

  return (
    <>
      <SearchForm
        init={{
          firstName: patient?.given_name,
          lastName: patient?.family_name,
        }}
        onSubmit={handleSubmit}
        fullForm={false}
      />
      <br />
      <OverlayLoader open={isFetching} />
      {(searchComplete || isError) && (
        <SearchResults
          genericSearch={genericSearch}
          searchResults={demographicSearchDDEAdaptor(data)}
          // searchResults={demographicSearchLocalAdaptor(data)}
          searchedPatient={searchedPatient}
        />
      )}
    </>
  );
};

export const NPIDSearch = ({
  genericSearch = true,
}: {
  genericSearch?: boolean;
}) => {
  const [search, setSearch] = useState("");
  const { refetch, isFetching, isSuccess, data, isError } = searchNPID(search);

  useEffect(() => {
    if (!Boolean(search)) return;
    refetch();
  }, [search]);

  return (
    <>
      <OverlayLoader open={isFetching} />
      <SearchNPIDForm onSubmit={(values: any) => setSearch(values.npid)} />
      {(isSuccess || isError) && (
        <SearchResults
          genericSearch={genericSearch}
          searchResults={data ? data : { remotes: [], locals: [] }}
          searchedPatient={data}
        />
      )}
    </>
  );
};
