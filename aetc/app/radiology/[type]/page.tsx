"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  Collapse,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  SelectChangeEvent,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  FaChevronDown,
  FaChevronUp,
  FaFilter,
  FaPlay,
  FaSignOutAlt,
  FaTimes,
} from "react-icons/fa";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { GridColDef } from "@mui/x-data-grid";
import {
  BaseTable,
  FormikInit,
  GenericDialog,
  MainGrid,
  MainPaper,
  MainTypography,
  TextInputField,
} from "@/components";
import { Navigation } from "@/app/components/navigation";
import { calculateAge, getShortDateTime } from "@/helpers/dateTime";
import { fetchConceptAndCreateEncounter } from "@/hooks/encounter";
import { useServerTime } from "@/contexts/serverTimeContext";
import { getDailyVisits, getPatient } from "@/services/patient";
import { getPatientEncounters } from "@/services/encounter";
import { concepts, encounters, roles } from "@/constants";
import AuthGuard from "@/helpers/authguard";
import { useQuery } from "@tanstack/react-query";
import { getRadiologyTypeBySlug, isImagingTypeMatch } from "../constants";
import { getAll } from "@/services/httpService";

type PatientVisit = {
  uuid: string;
  visit_uuid?: string;
  given_name?: string;
  family_name?: string;
  birthdate?: string | Date;
  gender?: string;
  patient_care_area?: string;
};

type EncounterObservation = {
  names?: Array<{ name?: string }>;
  value?: unknown;
  value_text?: unknown;
  obs_datetime?: string;
};

type PatientEncounter = {
  encounter_datetime?: string;
  created_by?: string;
  obs?: EncounterObservation[];
  person_uuid?: string;
  visit?: {
    uuid?: string;
    patient?: string;
  };
  visit_uuid?: string;
};

type RadiologyQueueItem = {
  id: string;
  patientUuid: string;
  visitUuid: string;
  requestId: string;
  givenName: string;
  familyName: string;
  gender: string;
  age: string;
  patientCareArea: string;
  imagingType: string;
  requestedBy: string;
  reasonForRequest: string;
  differentialDiagnosis: string;
  clinicalFindings: string;
  requestedAt: string;
};

type FilterState = {
  requestedBy: string[];
  patientCareArea: string[];
};

type RadiologyResultFormValues = {
  radiologyFindings: string;
};

type RadiologyRemoveFormValues = {
  abscondReason: string;
};

const PATIENT_ABSCONDED_PREFIX = "patient absconded the ";
const RADIOLOGY_REQUEST_ID_PREFIX = "radiology request id:";
const IMAGING_TYPE_PREFIX = "imaging type:";

const RADIOLOGY_WORKLIST_SOURCE_CATEGORIES = [
  "investigations",
  "assessment",
  "specialty",
  "disposition",
  "triage",
  "registration",
  "screening",
];

const resultSchema = Yup.object({
  radiologyFindings: Yup.string()
    .trim()
    .required("Radiology findings are required"),
});

const removeSchema = Yup.object({
  abscondReason: Yup.string().trim().required("Reason for absconding is required"),
});

const normalizeText = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    const candidates = [
      objectValue.display,
      objectValue.name,
      objectValue.value,
      objectValue.label,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
  }
  return "";
};

const normalizeLower = (value: unknown) =>
  normalizeText(value).toLowerCase();

const toTimestamp = (value: string) => {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getObservationName = (observation: EncounterObservation) =>
  normalizeLower(observation?.names?.[0]?.name);

const getObservationValue = (observation: EncounterObservation) =>
  normalizeText(observation?.value_text) || normalizeText(observation?.value);

const getObservationValueByName = (
  observations: EncounterObservation[],
  conceptName: string
) => {
  const target = conceptName.trim().toLowerCase();
  const match = observations.find(
    (observation) => getObservationName(observation) === target
  );
  return match ? getObservationValue(match) : "";
};

const getDescriptionValueByPrefix = (
  observations: EncounterObservation[],
  prefixes: string[]
) => {
  const normalizedPrefixes = prefixes.map((prefix) => prefix.toLowerCase());

  for (const observation of observations) {
    if (getObservationName(observation) !== concepts.DESCRIPTION.toLowerCase()) {
      continue;
    }

    const value = getObservationValue(observation);
    const normalizedValue = value.toLowerCase();
    const matchedPrefix = normalizedPrefixes.find((prefix) =>
      normalizedValue.startsWith(prefix)
    );

    if (matchedPrefix) {
      return value.slice(matchedPrefix.length).trim();
    }
  }

  return "";
};

const buildQueueItems = (
  patient: PatientVisit,
  radiologyEncounters: PatientEncounter[],
  selectedType: ReturnType<typeof getRadiologyTypeBySlug>
): RadiologyQueueItem[] => {
  if (!selectedType || !patient.uuid || !patient.visit_uuid) return [];

  const summaries = radiologyEncounters
    .map((encounter) => {
      const observations = Array.isArray(encounter?.obs) ? encounter.obs : [];
      const imagingTypeFromObs = getObservationValueByName(
        observations,
        concepts.IMAGING_TESTS
      );
      const imagingTypeFromDescription = getDescriptionValueByPrefix(
        observations,
        [IMAGING_TYPE_PREFIX]
      );
      const imagingType = imagingTypeFromDescription || imagingTypeFromObs;

      if (!isImagingTypeMatch(imagingType, selectedType)) {
        return null;
      }

      const requestedAt =
        normalizeText(encounter?.encounter_datetime) ||
        normalizeText(observations.find((observation) => observation.obs_datetime)?.obs_datetime);

      return {
        imagingType,
        reasonForRequest: getObservationValueByName(
          observations,
          concepts.REASON_FOR_REQUEST
        ),
        differentialDiagnosis: getObservationValueByName(
          observations,
          concepts.DIFFERENTIAL_DIAGNOSIS
        ),
        clinicalFindings: getDescriptionValueByPrefix(observations, [
          "clinical findings:",
        ]),
        requestedBy:
          getDescriptionValueByPrefix(observations, ["requested by:"]) ||
          normalizeText(encounter?.created_by),
        radiologyFindings: getDescriptionValueByPrefix(observations, [
          "radiology findings:",
          "radiology result:",
        ]),
        abscondedImagingType: getDescriptionValueByPrefix(observations, [
          PATIENT_ABSCONDED_PREFIX,
        ]),
        requestId: getDescriptionValueByPrefix(observations, [
          RADIOLOGY_REQUEST_ID_PREFIX,
        ]),
        requestedAt,
      };
    })
    .filter(Boolean) as Array<{
    imagingType: string;
    reasonForRequest: string;
    differentialDiagnosis: string;
    clinicalFindings: string;
    requestedBy: string;
    radiologyFindings: string;
    abscondedImagingType: string;
    requestId: string;
    requestedAt: string;
  }>;

  if (summaries.length === 0) return [];

  const timeline = summaries
    .map((summary) => ({
      ...summary,
      timestamp: toTimestamp(summary.requestedAt),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const requestEntries = timeline.filter((entry) => {
    const hasImagingType = normalizeText(entry.imagingType).length > 0;
    const hasRadiologyFindings = normalizeText(entry.radiologyFindings).length > 0;
    const hasAbscondedMarker =
      normalizeText(entry.abscondedImagingType).length > 0;
    return hasImagingType && !hasRadiologyFindings && !hasAbscondedMarker;
  });

  const terminalEntries = timeline.filter((entry) => {
    const hasRadiologyFindings = normalizeText(entry.radiologyFindings).length > 0;
    const hasAbscondedMarker =
      normalizeText(entry.abscondedImagingType).length > 0;
    return hasRadiologyFindings || hasAbscondedMarker;
  });

  const requestIdsResolvedByTerminal = new Set(
    terminalEntries
      .map((entry) => normalizeText(entry.requestId).toLowerCase())
      .filter(Boolean)
  );

  const pendingRequestsWithId = requestEntries.filter((entry) => {
    const requestId = normalizeText(entry.requestId).toLowerCase();
    if (!requestId) return false;
    return !requestIdsResolvedByTerminal.has(requestId);
  });

  const legacyRequestEntries = requestEntries.filter(
    (entry) => normalizeText(entry.requestId).length === 0
  );
  const legacyTerminalCount = terminalEntries.filter(
    (entry) => normalizeText(entry.requestId).length === 0
  ).length;
  const unresolvedLegacyCount = Math.max(
    legacyRequestEntries.length - legacyTerminalCount,
    0
  );
  const pendingLegacyRequests =
    unresolvedLegacyCount > 0
      ? legacyRequestEntries.slice(-unresolvedLegacyCount)
      : [];

  const pendingRequests = [...pendingRequestsWithId, ...pendingLegacyRequests]
    .sort((a, b) => a.timestamp - b.timestamp);

  return pendingRequests.map((request, requestIndex) => ({
    id: `${patient.uuid}|${patient.visit_uuid}|${selectedType.slug}|${request.requestedAt}|${requestIndex}`,
    patientUuid: patient.uuid,
    visitUuid: patient.visit_uuid as string,
    requestId: normalizeText(request.requestId),
    givenName: normalizeText(patient.given_name),
    familyName: normalizeText(patient.family_name),
    gender: normalizeText(patient.gender),
    age: (() => {
      const age = calculateAge(patient.birthdate);
      return age == null ? "N/A" : `${age} yrs`;
    })(),
    patientCareArea: normalizeText(patient.patient_care_area) || "N/A",
    imagingType: normalizeText(request.imagingType) || selectedType.label,
    requestedBy: normalizeText(request.requestedBy) || "N/A",
    reasonForRequest: normalizeText(request.reasonForRequest) || "N/A",
    differentialDiagnosis: normalizeText(request.differentialDiagnosis) || "N/A",
    clinicalFindings: normalizeText(request.clinicalFindings) || "N/A",
    requestedAt: normalizeText(request.requestedAt),
  }));
};

function RadiologyTypeWorklistPage() {
  const params = useParams<{ type: string }>();
  const selectedType = useMemo(
    () => getRadiologyTypeBySlug(params?.type),
    [params?.type]
  );

  const { ServerTime } = useServerTime();
  const { mutate: submitRadiologyResult, isPending: isSubmittingResult } =
    fetchConceptAndCreateEncounter();
  const { mutate: markQueueItemAsRemoved, isPending: isRemovingFromWorklist } =
    fetchConceptAndCreateEncounter();

  const [queueItems, setQueueItems] = useState<RadiologyQueueItem[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    requestedBy: [],
    patientCareArea: [],
  });
  const [selectedQueueItem, setSelectedQueueItem] =
    useState<RadiologyQueueItem | null>(null);
  const [selectedQueueItemForRemoval, setSelectedQueueItemForRemoval] =
    useState<RadiologyQueueItem | null>(null);

  const {
    data: investigationsData,
    dataUpdatedAt: investigationsUpdatedAt,
    isLoading: isLoadingInvestigations,
    refetch: refetchInvestigations,
  } =
    useQuery({
      queryKey: ["radiology_worklist_patients_active_visits"],
      queryFn: async () => {
        const sourceCategories: Array<string | undefined> = [
          undefined,
          ...RADIOLOGY_WORKLIST_SOURCE_CATEGORIES,
        ];

        const categoryResponses = await Promise.all(
          sourceCategories.map(async (category) => {
            try {
              const response = await getDailyVisits(category);
              return Array.isArray(response?.data)
                ? (response.data as PatientVisit[])
                : [];
            } catch {
              return [];
            }
          })
        );

        const mergedPatients = categoryResponses.flat();
        const uniqueByPatientVisit = new Map<string, PatientVisit>();

        mergedPatients.forEach((patient) => {
          const patientUuid = normalizeText(patient?.uuid);
          const visitUuid = normalizeText(patient?.visit_uuid);
          if (!patientUuid || !visitUuid) return;
          const key = `${patientUuid}|${visitUuid}`;
          if (!uniqueByPatientVisit.has(key)) {
            uniqueByPatientVisit.set(key, patient);
          }
        });

        try {
          const radiologyEncountersResponse = await getAll<PatientEncounter[]>(
            "/encounters",
            `encounter_type=${encounters.RADIOLOGY_EXAMINATON}&paginate=false`
          );
          const radiologyEncounters = Array.isArray(radiologyEncountersResponse?.data)
            ? (radiologyEncountersResponse.data as PatientEncounter[])
            : [];

          const missingPatientVisits = new Map<
            string,
            { patientUuid: string; visitUuid: string }
          >();

          radiologyEncounters.forEach((encounter) => {
            const patientUuid = normalizeText(
              encounter?.person_uuid || encounter?.visit?.patient
            );
            const visitUuid = normalizeText(
              encounter?.visit?.uuid || encounter?.visit_uuid
            );

            if (!patientUuid || !visitUuid) return;

            const key = `${patientUuid}|${visitUuid}`;
            if (!uniqueByPatientVisit.has(key)) {
              missingPatientVisits.set(key, { patientUuid, visitUuid });
            }
          });

          if (missingPatientVisits.size > 0) {
            const uniquePatientUuids = Array.from(
              new Set(
                Array.from(missingPatientVisits.values()).map(
                  ({ patientUuid }) => patientUuid
                )
              )
            );

            const patientInfoMap = new Map<string, any>();

            await Promise.all(
              uniquePatientUuids.map(async (patientUuid) => {
                try {
                  const response = await getPatient(patientUuid);
                  patientInfoMap.set(patientUuid, response?.data);
                } catch {
                  patientInfoMap.set(patientUuid, null);
                }
              })
            );

            missingPatientVisits.forEach(({ patientUuid, visitUuid }, key) => {
              if (uniqueByPatientVisit.has(key)) return;

              const person = patientInfoMap.get(patientUuid);
              const names = person?.names?.[0] || person?.person?.names?.[0] || {};

              uniqueByPatientVisit.set(key, {
                uuid: patientUuid,
                visit_uuid: visitUuid,
                given_name: normalizeText(names?.given_name),
                family_name: normalizeText(names?.family_name),
                birthdate: person?.birthdate || person?.person?.birthdate,
                gender: normalizeText(person?.gender || person?.person?.gender),
                patient_care_area:
                  normalizeText(
                    person?.patient_care_area || person?.active_visit?.patient_care_area
                  ) || "N/A",
              });
            });
          }
        } catch {
          // Fallback silently to visit-category based sourcing.
        }

        return Array.from(uniqueByPatientVisit.values());
      },
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
    });

  useEffect(() => {
    if (!selectedType || !Array.isArray(investigationsData)) {
      setQueueItems([]);
      return;
    }

    let active = true;

    const loadQueue = async () => {
      setQueueLoading(true);

      try {
        const queueResults = await Promise.all(
          investigationsData.map(async (patient: PatientVisit) => {
            if (!patient?.uuid || !patient?.visit_uuid) return [];

            try {
              const response = await getPatientEncounters(
                patient.uuid,
                `encounter_type=${encounters.RADIOLOGY_EXAMINATON}&visit=${patient.visit_uuid}&paginate=false`
              );

              const encountersForVisit = Array.isArray(response?.data)
                ? (response.data as PatientEncounter[])
                : [];

              return buildQueueItems(patient, encountersForVisit, selectedType);
            } catch {
              return [];
            }
          })
        );

        if (!active) return;
        setQueueItems(queueResults.flat());
      } finally {
        if (active) {
          setQueueLoading(false);
        }
      }
    };

    loadQueue();

    return () => {
      active = false;
    };
  }, [investigationsData, investigationsUpdatedAt, selectedType]);

  const visibleQueueItems = queueItems;

  const filterOptions = useMemo(() => {
    const requestedByOptions = Array.from(
      new Set(
        visibleQueueItems.map((item) => item.requestedBy).filter(Boolean)
      )
    ).sort();

    const patientCareAreaOptions = Array.from(
      new Set(
        visibleQueueItems.map((item) => item.patientCareArea).filter(Boolean)
      )
    ).sort();

    return { requestedByOptions, patientCareAreaOptions };
  }, [visibleQueueItems]);

  const filteredQueueItems = useMemo(() => {
    return visibleQueueItems.filter((item) => {
      const requestedByMatch =
        filters.requestedBy.length === 0 ||
        filters.requestedBy.includes(item.requestedBy);

      const patientCareAreaMatch =
        filters.patientCareArea.length === 0 ||
        filters.patientCareArea.includes(item.patientCareArea);

      return requestedByMatch && patientCareAreaMatch;
    });
  }, [visibleQueueItems, filters]);

  const hasActiveFilters =
    filters.requestedBy.length > 0 || filters.patientCareArea.length > 0;

  const clearAllFilters = useCallback(() => {
    setFilters({ requestedBy: [], patientCareArea: [] });
  }, []);

  const clearFilterValue = useCallback(
    (filterType: keyof FilterState, valueToRemove: string) => {
      setFilters((prev) => ({
        ...prev,
        [filterType]: prev[filterType].filter((value) => value !== valueToRemove),
      }));
    },
    []
  );

  const handleFilterChange = useCallback(
    (filterType: keyof FilterState) =>
      (event: SelectChangeEvent<string[]>) => {
        const value = event.target.value;
        setFilters((prev) => ({
          ...prev,
          [filterType]: typeof value === "string" ? value.split(",") : value,
        }));
      },
    []
  );

  const openResultDialog = useCallback((queueItem: RadiologyQueueItem) => {
    setSelectedQueueItem(queueItem);
  }, []);

  const openRemoveDialog = useCallback((queueItem: RadiologyQueueItem) => {
    setSelectedQueueItemForRemoval(queueItem);
  }, []);

  const removeQueueItem = useCallback((queueItemId: string) => {
    setQueueItems((prev) => prev.filter((item) => item.id !== queueItemId));
    setSelectedQueueItem((prev) =>
      prev?.id === queueItemId ? null : prev
    );
  }, []);

  const removePatientFromWorklist = useCallback(
    (values: RadiologyRemoveFormValues, actions: any) => {
      if (!selectedQueueItemForRemoval) {
        toast.error("Select a patient before removing from list.");
        actions?.setSubmitting?.(false);
        return;
      }

      if (
        !selectedQueueItemForRemoval?.patientUuid ||
        !selectedQueueItemForRemoval?.visitUuid
      ) {
        toast.error("Patient visit context is missing.");
        actions?.setSubmitting?.(false);
        return;
      }

      const reason = normalizeText(values.abscondReason);
      if (!reason) {
        toast.error("Reason for absconding is required.");
        actions?.setSubmitting?.(false);
        return;
      }

      const imagingTypeLabel =
        selectedQueueItemForRemoval.imagingType || selectedType?.label || "";
      const normalizedReason = normalizeLower(reason).startsWith(
        PATIENT_ABSCONDED_PREFIX
      )
        ? reason
        : `${PATIENT_ABSCONDED_PREFIX}${imagingTypeLabel} - ${reason}`;

      let encounterDatetime = "";
      try {
        encounterDatetime = ServerTime.getServerTimeString();
      } catch {
        encounterDatetime = new Date().toISOString();
      }

      markQueueItemAsRemoved(
        {
          encounterType: encounters.RADIOLOGY_EXAMINATON,
          patient: selectedQueueItemForRemoval.patientUuid,
          visit: selectedQueueItemForRemoval.visitUuid,
          encounterDatetime,
          obs: [
            {
              concept: concepts.IMAGING_TESTS,
              value: imagingTypeLabel,
              obsDatetime: encounterDatetime,
            },
            {
              concept: concepts.DESCRIPTION,
              value: normalizedReason,
              obsDatetime: encounterDatetime,
            },
            {
              concept: concepts.DESCRIPTION,
              value: `${IMAGING_TYPE_PREFIX} ${imagingTypeLabel}`,
              obsDatetime: encounterDatetime,
            },
            ...(normalizeText(selectedQueueItemForRemoval.requestId)
              ? [
                  {
                    concept: concepts.DESCRIPTION,
                    value: `${RADIOLOGY_REQUEST_ID_PREFIX} ${selectedQueueItemForRemoval.requestId}`,
                    obsDatetime: encounterDatetime,
                  },
                ]
              : []),
          ],
        },
        {
          onSuccess: () => {
            removeQueueItem(selectedQueueItemForRemoval.id);
            setSelectedQueueItemForRemoval(null);
            actions?.resetForm?.();
            actions?.setSubmitting?.(false);
            refetchInvestigations();
            toast.success(
              `${selectedQueueItemForRemoval.givenName} ${selectedQueueItemForRemoval.familyName} removed from radiology list.`
            );
          },
          onError: () => {
            toast.error("Failed to remove patient from radiology list.");
            actions?.setSubmitting?.(false);
          },
        }
      );
    },
    [
      selectedQueueItemForRemoval,
      ServerTime,
      markQueueItemAsRemoved,
      selectedType,
      removeQueueItem,
      refetchInvestigations,
    ]
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: "givenName", headerName: "First Name", flex: 1 },
      { field: "familyName", headerName: "Last Name", flex: 1 },
      { field: "gender", headerName: "Sex", flex: 0.6 },
      { field: "age", headerName: "Age", flex: 0.6 },
      { field: "patientCareArea", headerName: "Patient Care Area", flex: 1 },
      { field: "requestedBy", headerName: "Requested By", flex: 1 },
      {
        field: "requestedAt",
        headerName: "Requested At",
        flex: 1,
        renderCell: (cell) =>
          cell.row?.requestedAt
            ? getShortDateTime(cell.row.requestedAt)
            : "",
      },
      { field: "reasonForRequest", headerName: "Reason for Request", flex: 2 },
      {
        field: "action",
        headerName: "Action",
        flex: 0.7,
        sortable: false,
        filterable: false,
        renderCell: (cell) => {
          const queueRow = cell.row as RadiologyQueueItem;

          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
              <Tooltip title="Enter result" arrow>
                <IconButton
                  color="primary"
                  size="medium"
                  onClick={(event) => {
                    event.stopPropagation();
                    openResultDialog(queueRow);
                  }}
                  aria-label="enter result"
                >
                  <FaPlay size={18} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove from list" arrow>
                <IconButton
                  color="warning"
                  size="medium"
                  disabled={isRemovingFromWorklist}
                  onClick={(event) => {
                    event.stopPropagation();
                    openRemoveDialog(queueRow);
                  }}
                  aria-label="remove from radiology list"
                >
                  <FaSignOutAlt size={18} />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [openResultDialog, openRemoveDialog, isRemovingFromWorklist]
  );

  const submitResult = useCallback(
    (values: RadiologyResultFormValues, actions: any) => {
      if (!selectedType || !selectedQueueItem) {
        toast.error("Select a patient before submitting.");
        actions?.setSubmitting?.(false);
        return;
      }

      const findings = normalizeText(values.radiologyFindings);
      if (!findings) {
        toast.error("Radiology findings are required.");
        actions?.setSubmitting?.(false);
        return;
      }

      if (!selectedQueueItem.patientUuid || !selectedQueueItem.visitUuid) {
        toast.error("Patient visit context is missing.");
        actions?.setSubmitting?.(false);
        return;
      }

      let encounterDatetime = "";
      try {
        encounterDatetime = ServerTime.getServerTimeString();
      } catch {
        encounterDatetime = new Date().toISOString();
      }

      const reporterName =
        typeof window === "undefined"
          ? ""
          : normalizeText(localStorage.getItem("userName"));

      submitRadiologyResult(
        {
          encounterType: encounters.RADIOLOGY_EXAMINATON,
          patient: selectedQueueItem.patientUuid,
          visit: selectedQueueItem.visitUuid,
          encounterDatetime,
          obs: [
            {
              concept: concepts.IMAGING_TESTS,
              value: selectedQueueItem.imagingType || selectedType.label,
              obsDatetime: encounterDatetime,
            },
            {
              concept: concepts.REASON_FOR_REQUEST,
              value: selectedQueueItem.reasonForRequest,
              obsDatetime: encounterDatetime,
            },
            {
              concept: concepts.SPECIALITY_DEPARTMENT,
              value: "AETC",
              obsDatetime: encounterDatetime,
            },
            {
              concept: concepts.DESCRIPTION,
              value: `Radiology findings: ${findings}`,
              obsDatetime: encounterDatetime,
            },
            {
              concept: concepts.DESCRIPTION,
              value: `Reported By: ${reporterName}`,
              obsDatetime: encounterDatetime,
            },
            {
              concept: concepts.DESCRIPTION,
              value: `${IMAGING_TYPE_PREFIX} ${
                selectedQueueItem.imagingType || selectedType.label
              }`,
              obsDatetime: encounterDatetime,
            },
            ...(normalizeText(selectedQueueItem.requestId)
              ? [
                  {
                    concept: concepts.DESCRIPTION,
                    value: `${RADIOLOGY_REQUEST_ID_PREFIX} ${selectedQueueItem.requestId}`,
                    obsDatetime: encounterDatetime,
                  },
                ]
              : []),
          ],
        },
        {
          onSuccess: () => {
            toast.success("Radiology result submitted successfully.", {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "colored",
            });

            removeQueueItem(selectedQueueItem.id);
            actions?.resetForm?.();
            actions?.setSubmitting?.(false);
            refetchInvestigations();
          },
          onError: () => {
            toast.error("Failed to submit radiology result.");
            actions?.setSubmitting?.(false);
          },
        }
      );
    },
    [
      selectedQueueItem,
      selectedType,
      ServerTime,
      submitRadiologyResult,
      removeQueueItem,
      refetchInvestigations,
    ]
  );

  if (!selectedType) {
    return (
      <>
        <Navigation title="Radiology Worklist" link="/dashboard" />
        <MainGrid container>
          <MainGrid item xs={12} md={12} lg={12} sx={{ mt: "3ch" }}>
            <MainPaper sx={{ p: "3ch" }}>
              <MainTypography variant="h5">
                Invalid imaging type selected.
              </MainTypography>
            </MainPaper>
          </MainGrid>
        </MainGrid>
      </>
    );
  }

  return (
    <>
      <Navigation title={`${selectedType.label} Worklist`} link="/dashboard" />
      <MainGrid container>
        <MainGrid item xs={12} md={12} lg={12} sx={{ mt: "1ch", mb: "1ch" }}>
          <MainPaper sx={{ p: "1.5ch" }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1,
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="h5">{selectedType.label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending patients for this imaging type: {filteredQueueItems.length}
                </Typography>
              </Box>
              {hasActiveFilters && (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={<FaTimes />}
                  onClick={clearAllFilters}
                >
                  Clear Filters
                </Button>
              )}
            </Box>

            <Paper sx={{ p: 1.5, mb: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FaFilter />
                  <Typography variant="h6">Filters</Typography>
                  {hasActiveFilters && (
                    <Chip
                      label={
                        filters.requestedBy.length + filters.patientCareArea.length
                      }
                      size="small"
                      color="primary"
                    />
                  )}
                </Box>
                <Button
                  startIcon={showFilters ? <FaChevronUp /> : <FaChevronDown />}
                  onClick={() => setShowFilters((prev) => !prev)}
                  size="small"
                  variant="outlined"
                >
                  {showFilters ? "Hide" : "Show"} Filters
                </Button>
              </Box>

              <Collapse in={showFilters}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
                  <FormControl sx={{ minWidth: 240 }}>
                    <InputLabel>Requested By</InputLabel>
                    <Select
                      multiple
                      value={filters.requestedBy}
                      onChange={handleFilterChange("requestedBy")}
                      input={<OutlinedInput label="Requested By" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip
                              key={value}
                              label={value}
                              size="small"
                              onDelete={() =>
                                clearFilterValue("requestedBy", value)
                              }
                              onMouseDown={(event) => event.stopPropagation()}
                            />
                          ))}
                        </Box>
                      )}
                    >
                      {filterOptions.requestedByOptions.map((value) => (
                        <MenuItem key={value} value={value}>
                          {value}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl sx={{ minWidth: 240 }}>
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
                              onDelete={() =>
                                clearFilterValue("patientCareArea", value)
                              }
                              onMouseDown={(event) => event.stopPropagation()}
                            />
                          ))}
                        </Box>
                      )}
                    >
                      {filterOptions.patientCareAreaOptions.map((value) => (
                        <MenuItem key={value} value={value}>
                          {value}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Collapse>
            </Paper>

            <BaseTable
              loading={isLoadingInvestigations || queueLoading}
              columns={columns}
              rows={filteredQueueItems}
              width="100%"
              style={{ margin: 0, padding: 0 }}
              rowHeight={44}
              dataGridSx={{
                my: 0,
                mx: 0,
                "& .MuiDataGrid-cell": {
                  px: 0,
                },
                "& .MuiDataGrid-columnHeader": {
                  px: 0,
                },
              }}
              onRowClick={(cell) => {
                if (!cell?.row) return;
                openResultDialog(cell.row as RadiologyQueueItem);
              }}
            />

            {!isLoadingInvestigations && !queueLoading && filteredQueueItems.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No pending patients for {selectedType.label}.
              </Typography>
            )}
          </MainPaper>
        </MainGrid>
      </MainGrid>

      <GenericDialog
        open={Boolean(selectedQueueItem)}
        onClose={() => setSelectedQueueItem(null)}
        title={`${selectedType.label} Result Entry`}
        maxWidth="md"
      >
        {selectedQueueItem && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {selectedQueueItem.givenName} {selectedQueueItem.familyName} ({selectedQueueItem.gender || "N/A"})
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Requested by: {selectedQueueItem.requestedBy}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Reason for request: {selectedQueueItem.reasonForRequest}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Differential diagnosis: {selectedQueueItem.differentialDiagnosis}
            </Typography>

            <FormikInit
              initialValues={{ radiologyFindings: "" }}
              validationSchema={resultSchema}
              onSubmit={submitResult}
              loading={isSubmittingResult}
              submitButtonText="Submit Result"
            >
              <TextInputField
                id="radiologyFindings"
                name="radiologyFindings"
                label="Radiology findings"
                multiline
                rows={4}
                placeholder="Enter radiology findings"
                sx={{ width: "100%" }}
              />
            </FormikInit>
          </Box>
        )}
      </GenericDialog>

      <GenericDialog
        open={Boolean(selectedQueueItemForRemoval)}
        onClose={() => setSelectedQueueItemForRemoval(null)}
        title="Remove Patient from Radiology List"
        maxWidth="sm"
      >
        {selectedQueueItemForRemoval && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              {selectedQueueItemForRemoval.givenName}{" "}
              {selectedQueueItemForRemoval.familyName}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Provide reason for absconding.
            </Typography>

            <FormikInit
              initialValues={{
                abscondReason: `${PATIENT_ABSCONDED_PREFIX}${
                  selectedQueueItemForRemoval.imagingType || selectedType?.label
                }`,
              }}
              validationSchema={removeSchema}
              onSubmit={removePatientFromWorklist}
              loading={isRemovingFromWorklist}
              submitButtonText="Remove Patient"
              enableReinitialize={true}
            >
              <TextInputField
                id="abscondReason"
                name="abscondReason"
                label="Reason for absconding"
                multiline
                rows={3}
                placeholder="Enter reason for absconding"
                sx={{ width: "100%" }}
              />
            </FormikInit>
          </Box>
        )}
      </GenericDialog>
    </>
  );
}

export default AuthGuard(RadiologyTypeWorklistPage, [
  roles.PROVIDER,
]);
