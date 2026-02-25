"use client";
import { calculateAge } from "@/helpers/dateTime";
import { useEffect, useState } from "react";
import { useNavigation } from "@/hooks";
import * as React from "react";

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";

import { FaPlay, FaHeartbeat, FaRandom, FaFilter, FaTimes, FaChevronDown, FaChevronUp } from "react-icons/fa";

import {
  CalculateWaitingTime,
  MainButton,
  PatientTableListServer,
  WrapperBox,
} from "../../../components";

import { AbscondButton } from "@/components/abscondButton";
import { DisplayEncounterCreator } from "@/components";
import { encounters } from "@/constants";
import {
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Chip,
  OutlinedInput,
  Paper,
  Typography,
  Button,
  Collapse
} from "@mui/material";
import {
  FetchAndDisplayTriageBarcode,
  PrinterBarcodeButton,
} from "@/components/barcodePrinterDialogs";
import { CPRDialogForm } from "@/app/patient/[id]/primary-assessment/components";
import { HiPrinter } from "react-icons/hi2";
import { fetchPatientsTablePaginate } from "@/hooks/fetchPatientsTablePaginate";
import { useDebounce } from "@/hooks/useDebounce";

interface FilterState {
  triageBy: string[];
  patientCareArea: string[];
}

export const ClientWaitingForAssessment = () => {
  const [cpr, setCpr] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [visitUUID, setVisitUUID] = useState("");
  const [deleted, setDeleted] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    triageBy: [],
    patientCareArea: [],
  });
  const [availableFilters, setAvailableFilters] = useState({
    triageByOptions: [] as string[],
    patientCareAreas: [] as string[],
  });

  const { navigateTo } = useNavigation();
  const patientCareFilter = filters.patientCareArea.length === 1 ? filters.patientCareArea[0] : undefined;
  const triageFilter = filters.triageBy.length === 1 ? filters.triageBy[0] : undefined;

  const {
    paginationModel,
    patients: data,
    searchText,
    setSearchText,
    setPaginationModel,
    loading,
    totalPages,
    setOnSwitch,
    totalEntries,
    refetch,
  } = fetchPatientsTablePaginate("assessment", patientCareFilter, triageFilter);
  const [inputText, setInputText] = useState("");
  const debouncedSearch = useDebounce(inputText, 500); // debounce for 500ms

  useEffect(() => {
    setSearchText(debouncedSearch);
  }, [debouncedSearch]);

  const [patientsData, setPatientsData] = useState<any>([]);

  useEffect(() => {
    if (data) {
      const mappedRows = data.map((item: any) => ({
        ...item,
        id: item?.patient_uuid || item?.id || item?.uuid,
      }));
      setPatientsData(mappedRows);
    }
  }, [data]);

  // Extract unique filter options from data
  useEffect(() => {
    if (patientsData && patientsData.length > 0) {
      const triageByOptions = Array.from(new Set(patientsData.map((item: any) => item.last_encounter_creator).filter(Boolean))) as string[];
      const patientCareAreas = Array.from(new Set(patientsData.map((item: any) => item.patient_care_area).filter(Boolean))) as string[];

      setAvailableFilters({
        triageByOptions: triageByOptions.sort(),
        patientCareAreas: patientCareAreas.sort(),
      });
    }
  }, [patientsData]);


  // useEffect(() => {
  //   refetch();
  // }, [filters]);

  // Filter the data based on active filters
  // const filteredData = React.useMemo(() => {
  //   if (!patientsData) return [];

  //   return patientsData.filter((item: any) => {
  //     const matchesTriageBy = filters.triageBy.length === 0 ||
  //       filters.triageBy.includes(item.last_encounter_creator);

  //     const matchesPatientCareArea = filters.patientCareArea.length === 0 ||
  //       filters.patientCareArea.includes(item.patient_care_area);

  //     return matchesTriageBy && matchesPatientCareArea;
  //   });
  // }, [patientsData, filters]);

  const handleFilterChange = (filterType: keyof FilterState) => (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFilters(prev => ({
      ...prev,
      [filterType]: typeof value === 'string' ? value.split(',') : value
    }));
  };

  const clearFilter = (filterType: keyof FilterState, valueToRemove: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].filter(item => item !== valueToRemove)
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      triageBy: [],
      patientCareArea: [],
    });
  };

  const hasActiveFilters = filters.triageBy.length > 0 ||
    filters.patientCareArea.length > 0;

  const handleDelete = (deletedId: string) => {
    const updatedData = patientsData.filter(
      (item: any) => item.id !== deletedId
    );
    setPatientsData(updatedData);
    setDeleted(deletedId);
  };

  const columns = [
    // { field: "aetc_visit_number", headerName: "Visit" },
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
    { field: "gender", headerName: "Gender" },
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
    { field: "last_encounter_creator", headerName: "Triaged By", flex: 1 },
    {
      field: "patient_care_area",
      flex: 1,
      headerName: "Patient Care Area",
    },

    {
      field: "action",
      headerName: "Action",
      flex: 1.5,
      renderCell: (cell: any) => {
        return (
          <Box display="flex" gap={1}>
            <Tooltip title="Start assessment" arrow>
              <IconButton
                onClick={() => navigateTo(`/patient/${cell.id}/profile`)}
                aria-label="start assessment"
                color="primary"
              >
                <FaPlay />
              </IconButton>
            </Tooltip>

            {/* <Tooltip title="Mark as absconded" arrow>
              <AbscondButton
                onDelete={() => handleDelete(cell.id)}
                visitId={cell.row.visit_uuid}
                patientId={cell.id}
              />
            </Tooltip> */}
            <Tooltip title="Dispose" arrow>
              <IconButton
                onClick={() => navigateTo(`/patient/${cell.id}/disposition`)}
                aria-label="Dispose"
                sx={{ color: "grey" }}
              >
                <FaRandom />
              </IconButton>
            </Tooltip>

            <Tooltip title="Print options" arrow>
              <BasicMenu patient={cell.row} />
            </Tooltip>

            {/* {cell.row.triage_result == "red" && ( */}
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
            {/* )} */}
          </Box>
        );
      },
    },
  ];

  const formatForMobileView = patientsData?.map((row: any) => {
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
          encounterType={encounters.VITALS}
          patientId={row.id}
        />
      ),
      aggregate: <CalculateWaitingTime arrival_time={row.arrival_time} />,
      waitingTime: (
        <CalculateWaitingTime arrival_time={row?.latest_encounter_time} />
      ),
      actionName: "Triaged By",
      action: (
        <CardAction
          patient={row}
          setDeleted={(id: any) => handleDelete(id)}
          triage={row.triage_result}
          visitId={row.visit_uuid}
          id={row.id}
        />
      ),
      age: `${calculateAge(row.birthdate)}yrs`,
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
                label={`${filters.triageBy.length + filters.patientCareArea.length} active`}
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
            {/* Triaged By Filter */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Triaged By</InputLabel>
              <Select
                multiple
                value={filters.triageBy}
                onChange={handleFilterChange("triageBy")}
                input={<OutlinedInput label="Triaged By" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        size="small"
                        onDelete={() => clearFilter("triageBy", value)}
                        onMouseDown={(event) => {
                          event.stopPropagation();
                        }}
                      />
                    ))}
                  </Box>
                )}
              >
                {availableFilters.triageByOptions.map((triager) => (
                  <MenuItem key={triager} value={triager}>
                    {triager}
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
            {filters.triageBy.map((filter) => (
              <Chip
                key={`triageBy-${filter}`}
                label={`Triaged By: ${filter}`}
                onDelete={() => clearFilter("triageBy", filter)}
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
          data: patientsData ?? [],
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

const CardAction = ({
  id,
  visitId,
  triage,
  setDeleted,
  patient,
}: {
  id: string;
  visitId: string;
  triage: string;
  setDeleted: (id: any) => void;
  patient: any;
}) => {
  const { navigateTo } = useNavigation();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: "1" }}>
      <WrapperBox
        sx={{
          borderRadius: "2px",
          width: "100%",
          height: "5ch",
          backgroundColor:
            triage == "red"
              ? "#B42318"
              : triage == "yellow"
                ? "#ede207"
                : triage == "green"
                  ? "#016302"
                  : "",
          marginY: 1,
        }}
      ></WrapperBox>
      <Box sx={{ flex: "1" }}>
        <Tooltip title="Start assessment" arrow>
          <MainButton
            sx={{ fontSize: "12px", width: "30%", mr: "2px", mb: "1px" }}
            title={"Start"}
            onClick={() => navigateTo(`/patient/${id}/profile`)}
          />
        </Tooltip>

        <Tooltip title="Mark as absconded" arrow>
          <AbscondButton
            sx={{ width: "30%" }}
            onDelete={() => setDeleted(id)}
            visitId={visitId}
            patientId={id}
          />
        </Tooltip>

        <Tooltip title="Print barcode" arrow>
          <PrinterBarcodeButton
            sx={{ width: "30%" }}
            uuid={patient?.id || patient?.uuid}
          />
        </Tooltip>
      </Box>
    </Box>
  );
};

export function BasicMenu({ patient }: { patient: any }) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title="Print" arrow>
        <IconButton
          onClick={handleClick}
          aria-label="Print"
          sx={{ color: "#015E85" }}
        >
          <HiPrinter />
        </IconButton>
      </Tooltip>
      {/* <Button
        size="small"
        variant="text"
        onClick={handleClick}
      >
        Print
      </Button> */}
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem sx={{ justifyContent: "flex-start" }}>
          <PrinterBarcodeButton
            title="Demographics"
            sx={{ color: "ButtonText" }}
            variant="text"
            onClose={handleClose}
            uuid={patient?.id || patient?.uuid}
          />
        </MenuItem>
        <MenuItem sx={{ justifyContent: "flex-start" }}>
          <FetchAndDisplayTriageBarcode
            arrivalDateTime={patient.arrival_time}
            patientId={patient.id}
            activeVisitId={patient?.visit_uuid}
          />
        </MenuItem>
      </Menu>
    </>
  );
}
