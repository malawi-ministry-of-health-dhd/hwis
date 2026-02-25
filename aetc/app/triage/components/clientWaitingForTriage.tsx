import { calculateAge, getCATTime, getTime } from "@/helpers/dateTime";
import { useEffect, useState } from "react";
import { useNavigation } from "@/hooks";
import { getPatientsEncounters } from "@/hooks/encounter";
import {
  getPatientCategoryListPaginated,
  getPatientsWaitingForTriage,
} from "@/hooks/patientReg";
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
import { PrinterBarcodeButton } from "@/components/barcodePrinterDialogs";
import { Tooltip, IconButton } from "@mui/material";
import { FaPlay } from "react-icons/fa";
import { fetchPatientsTablePaginate } from "@/hooks/fetchPatientsTablePaginate";
import { useDebounce } from "@/hooks/useDebounce";
import { FaHeartbeat } from "react-icons/fa";
import { CPRDialogForm } from "@/app/patient/[id]/primary-assessment/components";

export const ClientWaitingForTriage = () => {
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
  } = fetchPatientsTablePaginate("triage");

  const [inputText, setInputText] = useState("");
  const debouncedSearch = useDebounce(inputText, 500); // debounce for 500ms

  useEffect(() => {
    setSearchText(debouncedSearch);
  }, [debouncedSearch]);

  const rows = patients
    ?.map((p) => ({
      id: p?.patient_uuid || p?.uuid,
      ...p,
      patient_arrival_time: getTime(p.arrival_time),
    }))
    .filter((p) => p.id != deleted);

  const columns = [
    { field: "aetc_visit_number", headerName: "Visit Number" },
    { field: "given_name", headerName: "First Name", flex: 1 },
    { field: "family_name", headerName: "Last Name", flex: 1 },
    { field: "patient_arrival_time", headerName: "Arrival Time" },
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
    { field: "last_encounter_creator", headerName: "Registered By", flex: 1 },
    {
      field: "action",
      headerName: "Action",
      flex: 1.2,
      renderCell: (cell: any) => {
        return (
          <>
            <Tooltip title="Start Triage" arrow>
              <IconButton
                onClick={() => navigateTo(`/triage/${cell.id}/start`)}
                aria-label="start Triage"
                color="primary"
              >
                <FaPlay />
              </IconButton>
            </Tooltip>

            {/* <MainButton
              size="small"
              sx={{ fontSize: "12px", mr: "1px" }}
              title={"start"}
              onClick={() => navigateTo(`/triage/${cell.id}/start`)}
            /> */}
            <AbscondButton
              onDelete={() => setDeleted(cell.id)}
              visitId={cell.row.visit_uuid}
              patientId={cell.id}
            />
            <PrinterBarcodeButton icon={true} uuid={cell.row.uuid} />
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
          encounterType={encounters.SOCIAL_HISTORY}
          patientId={row.id}
        />
      ),
      aggregate: <CalculateWaitingTime arrival_time={row.arrival_time} />,
      waitingTime: (
        <CalculateWaitingTime arrival_time={row?.latest_encounter_time} />
      ),
      actionName: "Registered by",
      action: (
        <>
          <MainButton
            size="small"
            sx={{ fontSize: "12px", width: "30%", mr: "1px", mb: "1px" }}
            title={"start"}
            onClick={() => navigateTo(`/triage/${row.id}/start`)}
          />
          <AbscondButton
            sx={{ width: "30%" }}
            onDelete={() => setDeleted(row.id)}
            visitId={row.visit_uuid}
            patientId={row.id}
          />
          <PrinterBarcodeButton sx={{ width: "30%" }} uuid={row.uuid} />
        </>
      ),
      age: calculateAge(row.birthdate),
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
          totalEntries,
        }}
        searchText={inputText}
        setSearchString={setInputText}
        setPaginationModel={setPaginationModel}
        paginationModel={paginationModel}
        // loading={isPending || isRefetching}
        loading={loading}
        formatForMobileView={formatForMobileView ? formatForMobileView : []}
        onSwitchChange={setOnSwitch}
        onRowClick={(row: any) => navigateTo(`/triage/${row.id}/start`)}
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
