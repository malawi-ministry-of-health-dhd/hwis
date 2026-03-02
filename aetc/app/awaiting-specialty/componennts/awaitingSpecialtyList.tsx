"use client";
import { useEffect, useState } from "react";
import { useNavigation } from "@/hooks";
import { getPatientsWaitingForDispositionPaginated } from "@/hooks/patientReg";
import * as React from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import {
  CalculateWaitingTime,
  MainButton,
  PatientTableListServer,
  WrapperBox,
} from "../../../components";
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
  Paper,
  Typography,
  Button,
  Collapse,
} from "@mui/material";
import { calculateAge } from "@/helpers/dateTime";
import { closeCurrentVisit } from "@/hooks/visit";
import { closeVisit } from "@/services/visit";
import { fetchPatientsTablePaginate } from "@/hooks/fetchPatientsTablePaginate";
import { CPRDialogForm } from "@/app/patient/[id]/primary-assessment/components";
import Tooltip from "@mui/material/Tooltip";
import { useRouter } from "next/navigation";
import {
  FaPlay,
  FaSignOutAlt,
  FaHeartbeat,
  FaUser,
  FaFileAlt,
  FaRandom,
  FaFilter,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { getActivePatientDetails } from "@/hooks";
import { useDebounce } from "@/hooks/useDebounce";

interface FilterState {
  department: string;
  patientCareArea: string;
  recordedBy: string;
}

export const AwaitingSpecialtyList = () => {
  const [cpr, setCpr] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [visitUUID, setVisitUUID] = useState("");
  const [deleted, setDeleted] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    department: "",
    patientCareArea: "",
    recordedBy: "",
  });
  const [availableFilters, setAvailableFilters] = useState({
    department: [] as string[],
    patientCareAreas: [] as string[],
    recordedByOptions: [] as string[],
  });

  const { navigateTo } = useNavigation();
  const { gender } = getActivePatientDetails();

  const { mutate: closeVisit, isSuccess: visitClosed } = closeCurrentVisit();
  const patientCareFilter = filters.patientCareArea || undefined;
  const departmentFilter = filters.department || undefined;
  const creator = filters.recordedBy || undefined;

  const {
    paginationModel,
    patients: data,
    searchText,
    setSearchText,
    setPaginationModel,
    loading,
    totalPages,
    refetch,
    totalEntries,
  } = fetchPatientsTablePaginate(
    "awaiting_speciality",
    patientCareFilter,
    creator,
    departmentFilter,
  );

  const [inputText, setInputText] = useState("");
  const debouncedSearch = useDebounce(inputText, 500);
  const router = useRouter();

  // Extract unique filter options from data
  useEffect(() => {
    if (data && data.length > 0) {
      // Method 1: Using Array.from() instead of spread operator
      const specialties = Array.from(
        new Set(data.map((item: any) => item.department).filter(Boolean)),
      );
      const patientCareAreas = Array.from(
        new Set(
          data.map((item: any) => item.patient_care_area).filter(Boolean),
        ),
      );
      const recordedByOptions = Array.from(
        new Set(
          data.map((item: any) => item.last_encounter_creator).filter(Boolean),
        ),
      );

      setAvailableFilters({
        department: specialties.sort(),
        patientCareAreas: patientCareAreas.sort(),
        recordedByOptions: recordedByOptions.sort(),
      });
    }
  }, [data]);

  // Filter the data based on active filters
  // const filteredData = React.useMemo(() => {
  //     if (!data) return [];

  //     return data.filter((item: any) => {
  //         const matchesSpecialty = filters.specialty.length === 0 ||
  //             filters.specialty.includes(item.department);

  //         const matchesPatientCareArea = filters.patientCareArea.length === 0 ||
  //             filters.patientCareArea.includes(item.patient_care_area);

  //         const matchesRecordedBy = filters.recordedBy.length === 0 ||
  //             filters.recordedBy.includes(item.last_encounter_creator);

  //         return matchesSpecialty && matchesPatientCareArea && matchesRecordedBy;
  //     });
  // }, [data, filters]);

  const handleFilterChange =
    (filterType: keyof FilterState) => (event: SelectChangeEvent<string>) => {
      const value = event.target.value;
      setFilters((prev) => ({
        ...prev,
        [filterType]: value,
      }));
    };

  const clearFilter = (filterType: keyof FilterState) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: "",
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      department: "",
      patientCareArea: "",
      recordedBy: "",
    });
  };

  const hasActiveFilters =
    Boolean(filters.department) ||
    Boolean(filters.patientCareArea) ||
    Boolean(filters.recordedBy);

  useEffect(() => {
    setSearchText(debouncedSearch);
  }, [debouncedSearch]);

  useEffect(() => {
    refetch();
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      refetch();
    };

    window.addEventListener("focus", handleRouteChange);
    return () => window.removeEventListener("focus", handleRouteChange);
  }, []);

  useEffect(() => {
    if (visitClosed) {
      refetch();
      console.log("Visit closed successfully, refreshing data...");
    }
  }, [visitClosed, refetch]);

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
    { field: "gender", headerName: "Gender" },
    {
      field: "waiting",
      headerName: "Aggregated Time",
      flex: 1,
      renderCell: (cell: any) => (
        <CalculateWaitingTime arrival_time={cell.row.arrival_time} />
      ),
    },
    {
      field: "last_encounter_creator",
      headerName: "Recorded By",
      flex: 1,
    },
    {
      field: "patient_care_area",
      flex: 1,
      headerName: "Patient Care Area",
    },
    {
      field: "department",
      headerName: "Specialty",
      flex: 1,
    },
    {
      field: "action",
      headerName: "Actions",
      flex: 1.2,
      renderCell: (cell: any) => (
        <Box display="flex" gap={1}>
          <DispositionActions patient={cell.row} onVisitClosed={refetch} />
          {/* {cell.row.triage_result == "red" && ( */}
          <Tooltip title="Initiate CPR" arrow>
            <IconButton
              onClick={() => {
                setPatientId(cell.row.id);
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
      ),
    },
  ];

  const formatForMobileView = data?.map((row: any) => {
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
          encounterType={encounters.AWAITING_SPECIALTY}
          patientId={row.id}
        />
      ),
      aggregate: <CalculateWaitingTime arrival_time={row.arrival_time} />,
      waitingTime: (
        <CalculateWaitingTime arrival_time={row?.latest_encounter_time} />
      ),
      actionName: "Recorded By",
      action: (
        <CardAction
          patient={row}
          setDeleted={(id: any) => setDeleted(id)}
          triage={row.triage_result}
          visitId={row.visit_uuid}
          id={row.uuid}
          showCPR={row.triage_result === "red"}
          onCPR={() => {
            setPatientId(row.id);
            setCpr(true);
            setVisitUUID(row.visit_uuid);
          }}
          onVisitClosed={refetch}
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
                label={`${[filters.department, filters.patientCareArea, filters.recordedBy].filter(Boolean).length} active`}
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
            {/* Specialty Filter */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Specialty</InputLabel>
              <Select
                displayEmpty
                value={filters.department}
                onChange={handleFilterChange("department")}
                label="Specialty"
                renderValue={(selected) => selected || "All"}
              >
                <MenuItem value="">All</MenuItem>
                {availableFilters.department.map((specialty) => (
                  <MenuItem key={specialty} value={specialty}>
                    {specialty}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Patient Care Area Filter */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Patient Care Area</InputLabel>
              <Select
                displayEmpty
                value={filters.patientCareArea}
                onChange={handleFilterChange("patientCareArea")}
                label="Patient Care Area"
                renderValue={(selected) => selected || "All"}
              >
                <MenuItem value="">All</MenuItem>
                {availableFilters.patientCareAreas.map((area) => (
                  <MenuItem key={area} value={area}>
                    {area}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Recorded By Filter */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Recorded By</InputLabel>
              <Select
                displayEmpty
                value={filters.recordedBy}
                onChange={handleFilterChange("recordedBy")}
                label="Recorded By"
                renderValue={(selected) => selected || "All"}
              >
                <MenuItem value="">All</MenuItem>
                {availableFilters.recordedByOptions.map((person) => (
                  <MenuItem key={person} value={person}>
                    {person}
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
            {filters.department && (
              <Chip
                key={`department-${filters.department}`}
                label={`Department: ${filters.department}`}
                onDelete={() => clearFilter("department")}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {filters.patientCareArea && (
              <Chip
                key={`area-${filters.patientCareArea}`}
                label={`Care Area: ${filters.patientCareArea}`}
                onDelete={() => clearFilter("patientCareArea")}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {filters.recordedBy && (
              <Chip
                key={`recorded-${filters.recordedBy}`}
                label={`Recorded By: ${filters.recordedBy}`}
                onDelete={() => clearFilter("recordedBy")}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </Paper>

      <PatientTableListServer
        columns={columns}
        data={{
          data: data ?? [],
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

// Actions: Select form or close visit
const DispositionActions = ({
  patient,
  onVisitClosed,
}: {
  patient: any;
  onVisitClosed: () => void;
}) => {
  const { navigateTo } = useNavigation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { mutate: closeVisitMutation, isSuccess: visitClosed } =
    closeCurrentVisit();
  const { gender } = getActivePatientDetails();

  useEffect(() => {
    if (visitClosed) {
      onVisitClosed();
    }
  }, [visitClosed, onVisitClosed]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCloseVisit = () => {
    if (patient.visit_uuid) {
      closeVisitMutation(patient.visit_uuid);
    } else {
      console.warn("No active visit UUID found for this patient.");
    }
  };

  return (
    <Box display="flex" gap={1}>
      <Tooltip title="View Profile" arrow>
        <IconButton
          onClick={() => navigateTo(`/patient/${patient.id}/profile`)}
          aria-label="view profile"
          sx={{ color: "green" }}
        >
          <FaPlay />
        </IconButton>
      </Tooltip>
      <Tooltip title="Dispose" arrow>
        <IconButton
          onClick={() => navigateTo(`/patient/${patient.id}/disposition`)}
          aria-label="Dispose"
          sx={{ color: "grey" }}
        >
          <FaRandom />
        </IconButton>
      </Tooltip>
      <Tooltip title="Template Forms" arrow>
        <IconButton
          onClick={handleClick}
          aria-label="template forms"
          sx={{ color: "#015E85" }}
        >
          <FaFileAlt />
        </IconButton>
      </Tooltip>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem
          onClick={() => navigateTo(`/patient/${patient.id}/medicalInpatient`)}
        >
          Medical Inpatient
        </MenuItem>
        <MenuItem
          onClick={() => navigateTo(`/patient/${patient.id}/surgicalNotes`)}
        >
          Surgical Notes
        </MenuItem>
        {patient.gender?.toLowerCase() === "female" && (
          <MenuItem
            onClick={() => navigateTo(`/patient/${patient.id}/gyneacology`)}
          >
            Gyneacology Ward Admission
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

const CardAction = ({
  id,
  visitId,
  triage,
  setDeleted,
  patient,
  showCPR,
  onCPR,
  onVisitClosed,
}: {
  id: string;
  visitId: string;
  triage: string;
  setDeleted: (id: any) => void;
  patient: any;
  showCPR?: boolean;
  onCPR?: () => void;
  onVisitClosed: () => void;
}) => {
  const { navigateTo } = useNavigation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { mutate: closeVisitMutation, isSuccess: visitClosed } =
    closeCurrentVisit();

  useEffect(() => {
    if (visitClosed) {
      onVisitClosed();
    }
  }, [visitClosed, onVisitClosed]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCloseVisit = () => {
    if (patient.visit_uuid) {
      closeVisitMutation(patient.visit_uuid);
    } else {
      console.warn("No active visit UUID found for this patient.");
    }
  };

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
      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
        <Tooltip title="Close Visit" arrow>
          <IconButton
            onClick={handleCloseVisit}
            aria-label="close visit"
            size="small"
            sx={{ color: "#015E85" }}
          >
            <FaSignOutAlt />
          </IconButton>
        </Tooltip>
        <Tooltip title="Template Forms" arrow>
          <IconButton
            onClick={handleClick}
            aria-label="template forms"
            size="small"
            sx={{ color: "#015E85" }}
          >
            <FaFileAlt />
          </IconButton>
        </Tooltip>
        <Tooltip title="View Profile" arrow>
          <IconButton
            onClick={() => navigateTo(`/patient/${patient.id}/profile`)}
            aria-label="view profile"
            size="small"
            sx={{ color: "#015E85" }}
          >
            <FaPlay />
          </IconButton>
        </Tooltip>
        {showCPR && (
          <Tooltip title="Initiate CPR" arrow>
            <IconButton
              onClick={onCPR}
              aria-label="initiate CPR"
              size="small"
              color="error"
            >
              <FaHeartbeat />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Menu
        id="card-action-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem
          onClick={() => {
            navigateTo(`/patient/${id}/medicalInpatient`);
            handleClose();
          }}
        >
          Medical Inpatient
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigateTo(`/patient/${id}/surgicalNotes`);
            handleClose();
          }}
        >
          Surgical Notes
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigateTo(`/patient/${id}/gyneacology`);
            handleClose();
          }}
        >
          Gyneacology Ward Admission
        </MenuItem>
      </Menu>
    </Box>
  );
};
