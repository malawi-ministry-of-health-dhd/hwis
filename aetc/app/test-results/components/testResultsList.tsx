import { calculateAge, getCATTime, getTime } from "@/helpers/dateTime";
import { useEffect, useState } from "react";
import { useNavigation } from "@/hooks";
import * as React from "react";

import {
  CalculateWaitingTime,
  MainButton,
  PatientTableListServer,
} from "@/components";

import { AbscondButton } from "@/components/abscondButton";
import { DisplayEncounterCreator } from "@/components";
import { encounters } from "@/constants";
import { PrinterBarcodeButton } from "@/components/barcodePrinterDialogs";
import { CPRDialogForm } from "@/app/patient/[id]/primary-assessment/components";
import { FaHeartbeat } from "react-icons/fa";

import {
  Tooltip,
  IconButton,
  Box,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Chip,
  OutlinedInput,
  Paper,
  Typography,
  Button,
  Collapse,
  MenuItem,
} from "@mui/material";
import {
  FaPlay,
  FaRandom,
  FaFilter,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { fetchPatientsTablePaginate } from "@/hooks/fetchPatientsTablePaginate";
import { useDebounce } from "@/hooks/useDebounce";
import { red } from "@mui/material/colors";
import { TestStatusView } from "./testStatusView";

interface FilterState {
  plannedBy: string[];
  patientCareArea: string[];
}

export const ClientsWaitingForTestResults = () => {
  const [cpr, setCpr] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [visitUUID, setVisitUUID] = useState("");
  const [deleted, setDeleted] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    plannedBy: [],
    patientCareArea: [],
  });
  const [availableFilters, setAvailableFilters] = useState({
    plannedByOptions: [] as string[],
    patientCareAreas: [] as string[],
  });

  const { navigateTo } = useNavigation();
  const patientCareFilter =
    filters.patientCareArea.length === 1
      ? filters.patientCareArea[0]
      : undefined;
  const creator =
    filters.plannedBy.length === 1 ? filters.plannedBy[0] : undefined;

  const {
    loading,
    patients,
    paginationModel,
    setPaginationModel,
    searchText,
    setSearchText,
    totalPages,
    setOnSwitch,
    totalEntries,
  } = fetchPatientsTablePaginate("investigations", patientCareFilter, creator);

  const [inputText, setInputText] = useState("");
  const debouncedSearch = useDebounce(inputText, 500); // debounce for 500ms

  useEffect(() => {
    setSearchText(debouncedSearch);
  }, [debouncedSearch]);

  const rows = patients
    ?.map((p) => ({
      id: p?.uuid,
      ...p,
      patient_arrival_time: getTime(p.arrival_time),
    }))
    .filter((p) => p.id != deleted);

  // Extract unique filter options from data
  useEffect(() => {
    if (!rows || rows.length === 0) return;

    const plannedByOptions = Array.from(
      new Set(
        rows.map((item: any) => item.last_encounter_creator).filter(Boolean),
      ),
    ).sort();

    const patientCareAreas = Array.from(
      new Set(rows.map((item: any) => item.patient_care_area).filter(Boolean)),
    ).sort();

    // Only update if filters actually changed
    setAvailableFilters((prev) => {
      const samePlannedBy =
        JSON.stringify(prev.plannedByOptions) ===
        JSON.stringify(plannedByOptions);
      const sameAreas =
        JSON.stringify(prev.patientCareAreas) ===
        JSON.stringify(patientCareAreas);

      if (samePlannedBy && sameAreas) return prev;

      return {
        plannedByOptions,
        patientCareAreas,
      };
    });
  }, [rows]);

  // Filter the data based on active filters
  // const filteredData = React.useMemo(() => {
  //   if (!rows) return [];

  //   return rows.filter((item: any) => {
  //     const matchesPlannedBy = filters.plannedBy.length === 0 ||
  //       filters.plannedBy.includes(item.last_encounter_creator);

  //     const matchesPatientCareArea = filters.patientCareArea.length === 0 ||
  //       filters.patientCareArea.includes(item.patient_care_area);

  //     return matchesPlannedBy && matchesPatientCareArea;
  //   });
  // }, [rows, filters]);

  const handleFilterChange =
    (filterType: keyof FilterState) => (event: SelectChangeEvent<string[]>) => {
      const value = event.target.value;
      setFilters((prev) => ({
        ...prev,
        [filterType]: typeof value === "string" ? value.split(",") : value,
      }));
    };

  const clearFilter = (
    filterType: keyof FilterState,
    valueToRemove: string,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: prev[filterType].filter((item) => item !== valueToRemove),
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      plannedBy: [],
      patientCareArea: [],
    });
  };

  const hasActiveFilters =
    filters.plannedBy.length > 0 || filters.patientCareArea.length > 0;

  const columns = [
    {
      field: "triage_result",
      headerName: "Triage Cat",
      renderCell: (cell: any) => {
        return (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
            }}
          >
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                backgroundColor:
                  cell.value == "red" || cell.value == "Emergency"
                    ? "#B42318"
                    : cell.value == "yellow" || cell.value == "Priority"
                      ? "#EDE207"
                      : cell.value == "green" || cell.value == "Queue"
                        ? "#016302"
                        : "transparent",
              }}
            />
          </Box>
        );
      },
    },
    { field: "given_name", headerName: "First Name", flex: 1 },
    { field: "family_name", headerName: "Last Name", flex: 1 },
    // { field: "patient_arrival_time", headerName: "Arrival Time" },
    {
      field: "waiting",
      headerName: "WaitingTime",
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
    {
      field: "last_encounter_creator",
      headerName: "Planned By",
      flex: 1,
    },
    {
      field: "patient_care_area",
      flex: 1,
      headerName: "Patient Care Area",
    },
    {
      field: "test_status",
      flex: 1.35,
      minWidth: 320,
      headerName: "Specimen Status",
      renderCell: (cell: any) => {
        return <TestStatusView patientId={cell.id} />;
      },
    },
    {
      field: "action",
      headerName: "Action",
      flex: 1.2,
      renderCell: (cell: any) => {
        return (
          <>
            <Tooltip title="patient profile" arrow>
              <IconButton
                onClick={() => navigateTo(`/patient/${cell.id}/profile`)}
                aria-label="Profile"
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
            {/* <AbscondButton
              onDelete={() => setDeleted(cell.id)}
              visitId={cell.row.visit_uuid}
              patientId={cell.id}
            /> */}
            <Tooltip title="Dispose" arrow>
              <IconButton
                onClick={() => navigateTo(`/patient/${cell.id}/disposition`)}
                aria-label="Dispose"
                sx={{ color: "grey" }}
              >
                <FaRandom />
              </IconButton>
            </Tooltip>
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
            onClick={() => navigateTo(`/patient/${row.id}/profile`)}
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
      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FaFilter />
            <Typography variant="h6">Filters</Typography>
            {hasActiveFilters && (
              <Chip
                label={`${filters.plannedBy.length + filters.patientCareArea.length} active`}
                size="small"
                color="primary"
              />
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            {hasActiveFilters && (
              <Button
                startIcon={<FaTimes />}
                onClick={clearAllFilters}
                size="small"
                variant="outlined"
                color="secondary"
              >
                Clear All
              </Button>
            )}
            <Button
              startIcon={showFilters ? <FaChevronUp /> : <FaChevronDown />}
              onClick={() => setShowFilters(!showFilters)}
              size="small"
              variant="outlined"
            >
              {showFilters ? "Hide" : "Show"} Filters
            </Button>
          </Box>
        </Box>

        <Collapse in={showFilters}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
            {/* Planned By Filter */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Planned By</InputLabel>
              <Select
                multiple
                value={filters.plannedBy}
                onChange={handleFilterChange("plannedBy")}
                input={<OutlinedInput label="Planned By" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        size="small"
                        onDelete={() => clearFilter("plannedBy", value)}
                        onMouseDown={(event) => {
                          event.stopPropagation();
                        }}
                      />
                    ))}
                  </Box>
                )}
              >
                {availableFilters.plannedByOptions.map((planner) => (
                  <MenuItem key={planner} value={planner}>
                    {planner}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Patient Care Area Filter */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Patient Care Area</InputLabel>
              <Select
                multiple
                value={filters.patientCareArea}
                onChange={handleFilterChange("patientCareArea")}
                input={<OutlinedInput label="Patient Care Area" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        size="small"
                        onDelete={() => clearFilter("patientCareArea", value)}
                        onMouseDown={(event) => {
                          event.stopPropagation();
                        }}
                      />
                    ))}
                  </Box>
                )}
              >
                {availableFilters.patientCareAreas.map((area) => (
                  <MenuItem key={area} value={area}>
                    {area}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Collapse>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Typography variant="body2" sx={{ mr: 1, alignSelf: "center" }}>
              Active filters:
            </Typography>
            {filters.plannedBy.map((filter) => (
              <Chip
                key={`plannedBy-${filter}`}
                label={`Planned By: ${filter}`}
                onDelete={() => clearFilter("plannedBy", filter)}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
            {filters.patientCareArea.map((filter) => (
              <Chip
                key={`area-${filter}`}
                label={`Care Area: ${filter}`}
                onDelete={() => clearFilter("patientCareArea", filter)}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        )}
      </Paper>

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
        loading={loading}
        formatForMobileView={formatForMobileView ? formatForMobileView : []}
        onSwitchChange={setOnSwitch}
        onRowClick={(row: any) => navigateTo(`/patient/${row.id}/profile`)}
        getRowHeight={() => "auto"}
        dataGridSx={{
          "& .MuiDataGrid-cell": {
            alignItems: "flex-start",
            py: 1.25,
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 700,
          },
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
