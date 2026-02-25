import { getCATTime, getTime } from "@/helpers/dateTime";
import { useNavigation } from "@/hooks";

import {
  BaseTable,
  CalculateWaitingTime,
  MainButton,
  MainTypography,
  PatientTableList,
  PatientTableListServer,
} from "@/components";


import { AbscondButton } from "@/components/abscondButton";
import { useContext, useEffect, useState } from "react";

import {
  SearchRegistrationContext,
  SearchRegistrationContextType,
} from "@/contexts";
import { DisplayEncounterCreator } from "@/components";
import { encounters } from "@/constants";
import { Tooltip, IconButton } from "@mui/material";
import { FaPlay } from "react-icons/fa";
import { FaHeartbeat } from "react-icons/fa";
import { fetchPatientsTablePaginate } from "@/hooks/fetchPatientsTablePaginate";
import { useDebounce } from "@/hooks/useDebounce";
import { deletePatient } from "@/hooks/patientReg";
import { CPRDialogForm } from "@/app/patient/[id]/primary-assessment/components";

export const WaitingRegistrationList = () => {
  const [cpr, setCpr] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [visitUUID, setVisitUUID] = useState("");
  const [deleted, setDeleted] = useState("");
  const { navigateTo } = useNavigation();
  const {
    loading,
    patients,
    paginationModel,
    setPaginationModel,
    searchText,
    setSearchText,
    totalPages,
    setOnSwitch,
    totalEntries
  } = fetchPatientsTablePaginate("registration");
  const [inputText, setInputText] = useState("");
  const debouncedSearch = useDebounce(inputText, 500); // debounce for 500ms
  const { mutate } = deletePatient();

  useEffect(() => {
    setSearchText(debouncedSearch);
  }, [debouncedSearch]);

  const rows = patients
    ?.sort((p1, p2) => {
      //@ts-ignore
      return new Date(p1.arrival_time) - new Date(p2.arrival_time);
    })
    .map((p) => ({
      id: p?.patient_uuid || p?.uuid,
      ...p,
      patient_arrival_time: getTime(p.arrival_time),
    }))
    .filter((p) => p.id != deleted);
  const { setPatient, setRegistrationType, setSearchedPatient } = useContext(
    SearchRegistrationContext
  ) as SearchRegistrationContextType;

  const columns = [
    { field: "aetc_visit_number", headerName: "Visit Number" },
    { field: "given_name", headerName: "First Name", flex: 1 },
    { field: "family_name", headerName: "Last Name", flex: 1 },
    { field: "patient_arrival_time", headerName: "Arrival Time", flex: 1 },
    {
      field: "waiting",
      headerName: "WaitingTime",
      flex: 1,
      renderCell: (cell: any) => {
        return (
          <CalculateWaitingTime arrival_time={cell.row.latest_encounter_time} />
        );
      },
    },
    {
      field: "aggreg",
      headerName: "Aggregate",
      flex: 1,
      renderCell: (cell: any) => {
        return <CalculateWaitingTime arrival_time={cell.row.arrival_time} />;
      },
    },

    { field: "last_encounter_creator", headerName: "Screened By", flex: 1 },

    {
      field: "action",
      headerName: "Action",
      flex: 1,
      renderCell: (cell: any) => {
        // const link = cell.row.gender != 'N/A' ? `/registration/${cell.id}/new` : `/registration/${cell.id}/search`;
        const link = `/registration/${cell.id}/search`;

        return (
          <>
            <Tooltip title="Start Registration" arrow>
              <IconButton
                onClick={() => {
                  if (cell.row.gender != "N/A") {
                    setSearchedPatient({
                      firstName: cell.row.given_name,
                      lastName: cell.row.family_name,
                      gender: cell.row.gender,
                    });
                    setPatient(cell.row);
                    setRegistrationType("local");
                  }
                  navigateTo(link);
                }}
                aria-label="start screening"
                color="primary"
              >
                <FaPlay />
              </IconButton>
            </Tooltip>
            <AbscondButton
              onDelete={() => {
                setDeleted(cell.id);
                mutate({
                  id: cell.row.patient_id,
                  void_reason: "Absconded",
                });
              }}
              visitId={cell.row.visit_uuid}
              patientId={cell.id}
            />
            <Tooltip title="Initiate CPR" arrow>
              <IconButton
                onClick={() => {
                  setPatientId(cell.id);
                  setCpr(true);
                  setVisitUUID(cell.row.visit_uuid);
                }}
                aria-label="initiate CPR"
                color="error"
              >
                <FaHeartbeat />
              </IconButton>
            </Tooltip>
          </>
        );
      },
    },
  ];

  const formatForMobileView = rows?.map((row) => {
    return {
      id: row.id,
      visitNumber: row.aetc_visit_number,
      firstName: row.given_name,
      lastName: row.family_name,
      gender: row.gender,
      arrivalDateTime: row.arrival_time,
      arrivalTime: row.patient_arrival_time,
      actor: (
        <DisplayEncounterCreator
          encounterType={encounters.SCREENING_ENCOUNTER}
          patientId={row.id}
        />
      ),
      aggregate: <CalculateWaitingTime arrival_time={row.arrival_time} />,
      waitingTime: (
        <CalculateWaitingTime arrival_time={row?.latest_encounter_time} />
      ),
      actionName: "screened by",
      action: (
        <>
          {" "}
          <MainButton
            sx={{ fontSize: "12px", width: "49%", mr: "1px" }}
            title={"start"}
            onClick={() => navigateTo(`/registration/${row.id}/search`)}
          />
          <AbscondButton
            sx={{ width: "49%" }}
            onDelete={() => setDeleted(row.id)}
            visitId={row.visit_uuid}
            patientId={row.id}
          />
        </>
      ),
      age: "N/A",
      triageResult: row.triage_result,
    };
  });

  return (
    <>
      {/* <PatientTableList formatForMobileView={formatForMobileView} isLoading={isLoading || isRefetching} columns={columns} rows={rows ? rows : []} /> */}
      <PatientTableListServer
        columns={columns}
        data={{
          data: rows ?? [],
          page: paginationModel.page,
          per_page: paginationModel.pageSize,
          total_pages: totalPages,
          totalEntries
        }}
        searchText={inputText}
        setSearchString={setInputText}
        setPaginationModel={setPaginationModel}
        paginationModel={paginationModel}
        // loading={isPending || isRefetching}
        loading={loading}
        formatForMobileView={formatForMobileView ? formatForMobileView : []}
        onSwitchChange={setOnSwitch}
        onRowClick={(row: any) => navigateTo(`/registration/${row.id}/search`)}
      />
      <CPRDialogForm
        patientuuid={patientId}
        visituuid={visitUUID}
        open={cpr}
        onClose={() => setCpr(false)}
      />
    </>
  );
};
