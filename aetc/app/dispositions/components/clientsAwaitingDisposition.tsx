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
  OutlinedInput,
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
import {
  FaPlay,
  FaSignOutAlt,
  FaHeartbeat,
  FaUser,
  FaFileAlt,
  FaFilter,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { getActivePatientDetails } from "@/hooks";
import { useDebounce } from "@/hooks/useDebounce";

interface FilterState {
  disposedBy: string[];
  patientCareArea: string[];
  dispositionType: string[];
}

export const ClientsAwaitingDisposition = () => {
  const [cpr, setCpr] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [visitUUID, setVisitUUID] = useState("");
  const [deleted, setDeleted] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    disposedBy: [],
    patientCareArea: [],
    dispositionType: [],
  });
  const [availableFilters, setAvailableFilters] = useState({
    disposedByOptions: [] as string[],
    patientCareAreas: [] as string[],
    dispositionTypes: [] as string[],
  });

  const { navigateTo } = useNavigation();
  const { gender } = getActivePatientDetails();

  const { mutate: closeVisit, isSuccess: visitClosed } = closeCurrentVisit();
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
  } = fetchPatientsTablePaginate("disposition");

  const [inputText, setInputText] = useState("");
  const debouncedSearch = useDebounce(inputText, 500);

  // Extract unique filter options from data
  useEffect(() => {
    if (data && data.length > 0) {
      const disposedByOptions = Array.from(
        new Set(data.map((item: any) => item.last_encounter_creator).filter(Boolean))
      );
      const patientCareAreas = Array.from(
        new Set(data.map((item: any) => item.patient_care_area).filter(Boolean))
      );
      const dispositionTypes = Array.from(
        new Set(data.map((item: any) => item.disposition_type).filter(Boolean))
      );

      setAvailableFilters({
        disposedByOptions: disposedByOptions.sort(),
        patientCareAreas: patientCareAreas.sort(),
        dispositionTypes: dispositionTypes.sort(),
      });
    }
  }, [data]);

  const normalizedData = React.useMemo(() => {
    if (!data) return [];

    return data.map((item: any) => ({
      ...item,
      id: item?.patient_uuid || item?.id || item?.uuid,
    }));
  }, [data]);

  // Filter the data based on active filters
  const filteredData = React.useMemo(() => {
    if (!normalizedData) return [];

    return normalizedData.filter((item: any) => {
      const matchesDisposedBy =
        filters.disposedBy.length === 0 ||
        filters.disposedBy.includes(item.last_encounter_creator);

      const matchesPatientCareArea =
        filters.patientCareArea.length === 0 ||
        filters.patientCareArea.includes(item.patient_care_area);

      const matchesDispositionType =
        filters.dispositionType.length === 0 ||
        filters.dispositionType.includes(item.disposition_type);

      return matchesDisposedBy && matchesPatientCareArea && matchesDispositionType;
    });
  }, [normalizedData, filters]);

  const handleFilterChange =
    (filterType: keyof FilterState) => (event: SelectChangeEvent<string[]>) => {
      const value = event.target.value;
      setFilters((prev) => ({
        ...prev,
        [filterType]: typeof value === "string" ? value.split(",") : value,
      }));
    };

  const clearFilter = (filterType: keyof FilterState, valueToRemove: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: prev[filterType].filter((item) => item !== valueToRemove),
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      disposedBy: [],
      patientCareArea: [],
      dispositionType: [],
    });
  };

  const hasActiveFilters =
    filters.disposedBy.length > 0 ||
    filters.patientCareArea.length > 0 ||
    filters.dispositionType.length > 0;

  useEffect(() => {
    setSearchText(debouncedSearch);
  }, [debouncedSearch]);

  // Handle visit closure success
  useEffect(() => {
    if (visitClosed) {
      refetch();
      console.log("Visit closed successfully, refreshing data...");
    }
  }, [visitClosed, refetch]);

  const columns = [
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
      headerName: "Disposed By",
      flex: 1,
    },
    {
      field: "patient_care_area",
      flex: 1,
      headerName: "Patient Care Area",
    },
    {
      field: "disposition_type",
      headerName: "Disposition Type",
      flex: 1,
    },
    {
      field: "destination",
      headerName: "Destination",
      flex: 1,
    },
    {
      field: "action",
      headerName: "Actions",
      flex: 1.2,
      renderCell: (cell: any) => (
        <Box display="flex" gap={1}>
          <DispositionActions patient={cell.row} onVisitClosed={refetch} />
        </Box>
      ),
    },
  ];

  const formatForMobileView = filteredData?.map((row: any) => {
    return {
      id: row.id,
      visitNumber: row.aetc_visit_number,
      firstName: row.given_name,
      lastName: row.family_name,
      gender: row.gender,
      arrivalTime: row.patient_arrival_time,
      arrivalDateTime: row.arrival_time,
      dispositionType: row.disposition_type,
      actor: (
        <DisplayEncounterCreator
          encounterType={encounters.DISPOSITION}
          patientId={row.id}
        />
      ),
      aggregate: <CalculateWaitingTime arrival_time={row.arrival_time} />,
      waitingTime: (
        <CalculateWaitingTime arrival_time={row?.latest_encounter_time} />
      ),
      actionName: "Disposed By",
      action: (
        <CardAction
          patient={row}
          setDeleted={(id: any) => setDeleted(id)}
          triage={row.triage_result}
          visitId={row.visit_uuid}
          id={row.id}
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
                label={`${filters.disposedBy.length +
                  filters.patientCareArea.length +
                  filters.dispositionType.length
                  } active`}
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
            {/* Disposed By Filter */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Disposed By</InputLabel>
              <Select
                multiple
                value={filters.disposedBy}
                onChange={handleFilterChange("disposedBy")}
                input={<OutlinedInput label="Disposed By" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        size="small"
                        onDelete={() => clearFilter("disposedBy", value)}
                        onMouseDown={(event) => {
                          event.stopPropagation();
                        }}
                      />
                    ))}
                  </Box>
                )}
              >
                {availableFilters.disposedByOptions.map((person) => (
                  <MenuItem key={person} value={person}>
                    {person}
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

            {/* Disposition Type Filter */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Disposition Type</InputLabel>
              <Select
                multiple
                value={filters.dispositionType}
                onChange={handleFilterChange("dispositionType")}
                input={<OutlinedInput label="Disposition Type" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        size="small"
                        onDelete={() => clearFilter("dispositionType", value)}
                        onMouseDown={(event) => {
                          event.stopPropagation();
                        }}
                      />
                    ))}
                  </Box>
                )}
              >
                {availableFilters.dispositionTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
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
            {filters.disposedBy.map((filter) => (
              <Chip
                key={`disposed-${filter}`}
                label={`Disposed By: ${filter}`}
                onDelete={() => clearFilter("disposedBy", filter)}
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
            {filters.dispositionType.map((filter) => (
              <Chip
                key={`type-${filter}`}
                label={`Type: ${filter}`}
                onDelete={() => clearFilter("dispositionType", filter)}
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
        data={
          filteredData?.length
            ? {
              data: filteredData.map((row: any) => ({ id: row.id, ...row })),
              page: paginationModel.page,
              per_page: paginationModel.pageSize,
              total_pages: totalPages,
              totalEntries,
            }
            : { data: [], page: 1, per_page: 10, total_pages: 0, totalEntries: 0 }
        }
        searchText={inputText}
        setSearchString={setInputText}
        setPaginationModel={setPaginationModel}
        paginationModel={paginationModel}
        loading={loading}
        formatForMobileView={formatForMobileView ? formatForMobileView : []}
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
      <Tooltip title="Close Visit" arrow>
        <IconButton
          onClick={handleCloseVisit}
          aria-label="close visit"
          sx={{ color: "grey" }}
        >
          <FaSignOutAlt />
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
      <Menu id="basic-menu" anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem
          onClick={() => navigateTo(`/patient/${patient.id}/medicalInpatient`)}
        >
          Medical Inpatient Admission Sheet
        </MenuItem>
        <MenuItem onClick={() => navigateTo(`/patient/${patient.id}/surgicalNotes`)}>
          Surgical Notes
        </MenuItem>
        {patient.gender?.toLowerCase() === "female" && (
          <MenuItem onClick={() => navigateTo(`/patient/${patient.id}/gyneacology`)}>
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
  const { mutate: closeVisitMutation, isSuccess: visitClosed } = closeCurrentVisit();

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
      <Menu id="card-action-menu" anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem
          onClick={() => {
            navigateTo(`/patient/${id}/medicalInpatient`);
            handleClose();
          }}
        >
          Medical Inpatient Admission Sheet
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