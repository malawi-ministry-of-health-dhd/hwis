import { calculateAge, getCATTime, getTime } from "@/helpers/dateTime";
import { useNavigation } from "@/hooks";
import { getPatientsEncounters } from "@/hooks/encounter";
import {
  deletePatient,
  getPatientsWaitingForPrescreening,
} from "@/hooks/patientReg";
import { getVisitNum } from "@/hooks/visitNumber";
import { useEffect, useState } from "react";
import {
  BaseTable,
  CalculateWaitingTime,
  MainButton,
  MainTypography,
  PatientTableList,
  PatientTableListServer,
} from "@/components";
import Image from "next/image";
import { AbscondButton } from "@/components/abscondButton";
import { DisplayEncounterCreator } from "@/components";
import { encounters } from "@/constants";
import { Tooltip, IconButton } from "@mui/material";
import { FaPlay } from "react-icons/fa";
import { fetchPatientsTablePaginate } from "@/hooks/fetchPatientsTablePaginate";
import { useDebounce } from "@/hooks/useDebounce";
import { FaHeartbeat } from "react-icons/fa";
import { CPRDialogForm } from "@/app/patient/[id]/primary-assessment/components";

export const InitialRegistrationList = () => {
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
  } = fetchPatientsTablePaginate("screening");
  const [inputText, setInputText] = useState("");
  const debouncedSearch = useDebounce(inputText, 500); // debounce for 500ms

  useEffect(() => {
    setSearchText(debouncedSearch);
  }, [debouncedSearch]);
  const { navigateTo } = useNavigation();
  const [cpr, setCpr] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [visitUUID, setVisitUUID] = useState("");
  const [deleted, setDeleted] = useState("");
  const { mutate } = deletePatient();

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
        return <CalculateWaitingTime arrival_time={cell.row.arrival_time} />;
      },
    },
    { field: "last_encounter_creator", headerName: "Attended By", flex: 1 },
    {
      field: "action",
      flex: 1,
      headerName: "Action",
      renderCell: (cell: any) => {
        return (
          <>
            <Tooltip title="Start screening" arrow>
              <IconButton
                onClick={() => navigateTo(`/prescreening/${cell.id}`)}
                aria-label="start screening"
                color="primary"
              >
                <FaPlay />
              </IconButton>
            </Tooltip>
            {/* <MainButton
              size="small"
              sx={{ fontSize: "12px", mr: "1px" }}
              title={"screen"}
              onClick={() => navigateTo(`/prescreening/${cell.id}`)}
            /> */}
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
      arrivalTime: row.patient_arrival_time,
      arrivalDateTime: row.arrival_time,
      actor: (
        <DisplayEncounterCreator
          encounterType={encounters.INITIAL_REGISTRATION}
          patientId={row.id}
        />
      ),
      aggregate: <CalculateWaitingTime arrival_time={row.arrival_time} />,
      waitingTime: (
        <CalculateWaitingTime arrival_time={row?.latest_encounter_time} />
      ),
      actionName: "registered by",
      action: (
        <>
          {" "}
          <MainButton
            sx={{ fontSize: "12px", width: "49%", mr: "1px" }}
            title={"screen"}
            onClick={() => navigateTo(`/prescreening/${row.id}`)}
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
        onRowClick={(row: any) => {
          navigateTo(`/prescreening/${row.id}`);
        }}
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
