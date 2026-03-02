import { Obs } from "@/interfaces";
import { ClinicalNotesDataType } from "../displayInformation";
import { VitalFormConfig } from "@/app/vitals/components/vitalsForm";
import { filterObservations, getObservationValue } from "@/helpers/emr";
import { concepts } from "@/constants";
import {
  airwayFormConfig,
  breathingFormConfig,
  circulationFormConfig,
  disabilityFormConfig,
  exposureFormConfig,
} from "@/app/patient/[id]/primary-assessment/components";
import { soapierFormConfig } from "@/app/patient/[id]/soap/components/soapForm";
import { nonPharmacologicalFormConfig } from "@/app/patient/[id]/patient-management-plan/components/forms/nonPharmacologicalForm";
import {
  abdomenAndPelvisFormConfig,
  chestFormConfig,
  extremitiesFormConfig,
  generalInformationFormConfig,
  headAndNeckFormConfig,
  neurologicalFormConfig,
} from "@/app/patient/[id]/secondary-assessment/components";
import {
  allergiesFormConfig,
  lastMealFormConfig,
} from "@/app/patient/[id]/medicalHistory/components";
import { dispositionFormConfig } from "@/app/patient/[id]/disposition/components/DischargeHomeForm";
import { getHumanReadableDateTime } from "@/helpers/dateTime";

/** Utility: Formats user info safely */
const formatUser = (obs: Obs[]) => {
  if (!obs?.length) return "Notes not entered";
  const first = obs[0];
  return first?.created_by
    ? `${first.created_by} ${getHumanReadableDateTime(first?.obs_datetime)}`
    : `Notes not entered"`;
};

export const formatPresentingComplaints = (
  data: Obs[]
): ClinicalNotesDataType => {
  const items = data?.map((item) => ({ item: item?.value }));
  return {
    heading: "Presenting Complaints",
    children: items,
    user: formatUser(data),
  };
};

export const formatVitals = (data: Obs[]): ClinicalNotesDataType[] => {
  const items = (
    Object.keys(VitalFormConfig) as Array<keyof typeof VitalFormConfig>
  ).map((key) => {
    const vital = VitalFormConfig[key];
    const value = getObservationValue(data, vital.name);
    return { item: { [vital.label]: value || "N/A" } };
  });

  return [
    {
      heading: "Vitals",
      children: items,
      user: formatUser(data),
    },
    {
      heading: "Triage Result",
      children: [
        { item: getObservationValue(data, concepts.TRIAGE_RESULT) || "N/A" },
      ],
      user: formatUser(data),
    },
    {
      heading: "Patient Care Area",
      children: [
        { item: getObservationValue(data, concepts.CARE_AREA) || "N/A" },
      ],
      user: formatUser(data),
    },
  ];
};

export const formatPrimarySurvey = (data: {
  airwayObs: Obs[];
  breathingObs: Obs[];
  circulationObs: Obs[];
  disabilityObs: Obs[];
  exposureObs: Obs[];
}): ClinicalNotesDataType[] => [
  {
    heading: "Airway",
    children: buildNotesObject(airwayFormConfig, data.airwayObs),
    user: formatUser(data.airwayObs),
  },
  {
    heading: "Breathing",
    children: buildNotesObject(breathingFormConfig, data.breathingObs),
    user: formatUser(data.breathingObs),
  },
  {
    heading: "Circulation",
    children: buildNotesObject(circulationFormConfig, data.circulationObs),
    user: formatUser(data.circulationObs),
  },
  {
    heading: "Disability",
    children: buildNotesObject(disabilityFormConfig, data.disabilityObs),
    user: formatUser(data.disabilityObs),
  },
  {
    heading: "Exposure",
    children: buildNotesObject(exposureFormConfig, data.exposureObs),
    user: formatUser(data.exposureObs),
  },
];

export const formatPatientManagamentPlan = (data: {
  nonPharmalogical: Obs[];
  careAreaObs: Obs[];
  medicationObs: Obs[];
}): ClinicalNotesDataType[] => [
  {
    heading: "Non-Pharmacological",
    children: buildNotesObject(
      nonPharmacologicalFormConfig,
      data.nonPharmalogical
    ),
    user: formatUser(data.nonPharmalogical),
  },
  {
    heading: "Patient Care Area",
    children: formatCareAreaNotes(data.careAreaObs),
    user: formatUser(data.careAreaObs),
  },
  {
    heading: "Medications",
    children: formatMedicationPlanNotes(data.medicationObs),
    user: formatUser(data.medicationObs),
  },
];

export const formatSecondarySurvey = (data: {
  generalInformationObs: Obs[];
  headAndNeckObs: Obs[];
  chestObs: Obs[];
  abdomenAndPelvisObs: Obs[];
  extremitiesObs: Obs[];
  neurologicalObs: Obs[];
}): ClinicalNotesDataType[] => [
  {
    heading: "General Information",
    children: buildNotesObject(
      generalInformationFormConfig,
      data.generalInformationObs
    ),
    user: formatUser(data.generalInformationObs),
  },
  {
    heading: "Head and Neck",
    children: buildNotesObject(headAndNeckFormConfig, data.headAndNeckObs),
    user: formatUser(data.headAndNeckObs),
  },
  {
    heading: "Chest",
    children: buildNotesObject(chestFormConfig, data.chestObs),
    user: formatUser(data.chestObs),
  },
  {
    heading: "Abdomen and Pelvis",
    children: buildNotesObject(
      abdomenAndPelvisFormConfig,
      data.abdomenAndPelvisObs
    ),
    user: formatUser(data.abdomenAndPelvisObs),
  },
  {
    heading: "Extremities",
    children: buildNotesObject(extremitiesFormConfig, data.extremitiesObs),
    user: formatUser(data.extremitiesObs),
  },
  {
    heading: "Neurological",
    children: buildNotesObject(neurologicalFormConfig, data.neurologicalObs),
    user: formatUser(data.neurologicalObs),
  },
];

export const formatSampleHistory = (data: {
  presentingComplaintsObs: Obs[];
  allergiesObs: Obs[];
  medicationsObs: Obs[];
  existingConditionsObs: Obs[];
  lastMealObs: Obs[];
  eventsObs: Obs[];
}): ClinicalNotesDataType[] => [
  {
    heading: "Presenting Complaints",
    children: buildNotesObject(
      generalInformationFormConfig,
      data.presentingComplaintsObs
    ),
    user: formatUser(data.presentingComplaintsObs),
  },
  {
    heading: "Allergies",
    children: buildNotesObject(allergiesFormConfig, data.allergiesObs),
    user: formatUser(data.allergiesObs),
  },
  {
    heading: "Medications",
    children: buildNotesObject(chestFormConfig, data.medicationsObs),
    user: formatUser(data.medicationsObs),
  },
  {
    heading: "Existing Conditions",
    children: buildNotesObject(
      abdomenAndPelvisFormConfig,
      data.existingConditionsObs
    ),
    user: formatUser(data.existingConditionsObs),
  },
  {
    heading: "Last Meal",
    children: buildNotesObject(lastMealFormConfig, data.lastMealObs),
    user: formatUser(data.lastMealObs),
  },
  {
    heading: "Events",
    children: buildNotesObject(neurologicalFormConfig, data.eventsObs),
    user: formatUser(data.eventsObs),
  },
];

export const formatSoapierNotes = (data: Obs[]) => [
  {
    heading: "",
    children: buildNotesObject(soapierFormConfig, data),
    user: formatUser(data),
  },
];

export const formatDiagnosisNotes = (data: Obs[]) => {
  const diagnosisNotesConfig = {
    diagnosis: {
      name: concepts.DIFFERENTIAL_DIAGNOSIS,
      label: "Diagnosis",
      type: "title",
      children: [
        {
          concept: concepts.DIFFERENTIAL_DIAGNOSIS,
          label: "Differential",
          type: "string",
          multiple: true,
        },
        {
          concept: concepts.FINAL_DIAGNOSIS,
          label: "Final",
          type: "string",
          multiple: true,
        },
      ],
    },
  };

  return [
    {
      heading: "Diagnosis Notes",
      children: buildNotesObject(diagnosisNotesConfig, data),
      user: formatUser(data),
    },
  ];
};

export const formatInvestigationPlans = (data: Obs[]) =>
  data
    .filter((ob) => ob && (ob.value || (Array.isArray(ob.children) && ob.children.length > 0)))
    .map((ob) => ({
      plan: ob?.value ? String(ob.value) : ob?.names?.[0]?.name || "Plan",
      result: (Array.isArray(ob?.children) ? ob.children : []).map((child: Obs) => ({
        test: child?.names?.[0]?.name || "Result",
        result: child?.value ? String(child.value) : "—",
      })),
      user: ob?.created_by
        ? `${ob.created_by} ${getHumanReadableDateTime(ob?.obs_datetime)}`
        : undefined,
    }));

const normalizeObsValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : value == null ? "" : String(value);

const isPatientContextValue = (value: string) =>
  value.toLowerCase().startsWith("patient context(hidden):");

const RADIOLOGY_REQUEST_ID_PREFIX = "radiology request id:";
const RADIOLOGY_IMAGING_TYPE_PREFIX = "imaging type:";
const RADIOLOGY_CLINICAL_FINDINGS_PREFIX = "clinical findings:";
const RADIOLOGY_REQUESTED_BY_PREFIX = "requested by:";
const RADIOLOGY_REPORTED_BY_PREFIX = "reported by:";
const RADIOLOGY_ABSCONDED_PREFIX = "patient absconded the ";

const getObsName = (obs: Obs | any) => normalizeObsValue(obs?.names?.[0]?.name);
const getObsNameLower = (obs: Obs | any) => getObsName(obs).toLowerCase();
const getObsValue = (obs: Obs | any) =>
  normalizeObsValue(obs?.value_text) || normalizeObsValue(obs?.value);

const getObsChildren = (obs: Obs | any): Obs[] => {
  if (Array.isArray(obs?.children) && obs.children.length > 0) return obs.children;
  if (Array.isArray(obs?.groupMembers) && obs.groupMembers.length > 0) {
    return obs.groupMembers;
  }
  return [];
};

const getDescriptionValueByPrefix = (
  observations: Obs[],
  prefixes: string[]
) => {
  const normalizedPrefixes = prefixes.map((prefix) => prefix.toLowerCase());

  for (const obs of observations) {
    if (getObsNameLower(obs) !== concepts.DESCRIPTION.toLowerCase()) continue;

    const value = getObsValue(obs);
    const matchedPrefix = normalizedPrefixes.find((prefix) =>
      value.toLowerCase().startsWith(prefix)
    );

    if (matchedPrefix) {
      return value.slice(matchedPrefix.length).trim();
    }
  }

  return "";
};

const getValueByConceptName = (observations: Obs[], conceptName: string) => {
  const target = conceptName.toLowerCase();
  const obs = observations.find((item) => getObsNameLower(item) === target);
  return obs ? getObsValue(obs) : "";
};

const toTimestamp = (value: string) => {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatMaybeDateTime = (value: string) => {
  if (!value) return "Unknown time";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : getHumanReadableDateTime(parsed);
};

type RadiologyEncounterSummary = {
  imagingType: string;
  requestId: string;
  requestedBy: string;
  reasonForRequest: string;
  differentialDiagnosis: string;
  clinicalFindings: string;
  selectedAreas: string;
  findings: string;
  reportedBy: string;
  abscondReason: string;
  recordedAt: string;
  user: string;
  isRequest: boolean;
  isResult: boolean;
  isAbscond: boolean;
};

const parseRadiologySummary = (encounterObs: Obs[]): RadiologyEncounterSummary | null => {
  if (!Array.isArray(encounterObs) || encounterObs.length === 0) return null;

  const imagingType =
    getDescriptionValueByPrefix(encounterObs, [RADIOLOGY_IMAGING_TYPE_PREFIX]) ||
    getValueByConceptName(encounterObs, concepts.IMAGING_TESTS) ||
    "Unspecified imaging";

  const requestId = getDescriptionValueByPrefix(encounterObs, [
    RADIOLOGY_REQUEST_ID_PREFIX,
  ]);
  const requestedBy = getDescriptionValueByPrefix(encounterObs, [
    RADIOLOGY_REQUESTED_BY_PREFIX,
  ]);
  const reasonForRequest = getValueByConceptName(
    encounterObs,
    concepts.REASON_FOR_REQUEST
  );
  const differentialDiagnosis = getValueByConceptName(
    encounterObs,
    concepts.DIFFERENTIAL_DIAGNOSIS
  );
  const clinicalFindings = getDescriptionValueByPrefix(encounterObs, [
    RADIOLOGY_CLINICAL_FINDINGS_PREFIX,
  ]);
  const findings =
    getDescriptionValueByPrefix(encounterObs, ["radiology findings:"]) ||
    getDescriptionValueByPrefix(encounterObs, ["radiology result:"]);
  const reportedBy = getDescriptionValueByPrefix(encounterObs, [
    RADIOLOGY_REPORTED_BY_PREFIX,
  ]);
  const abscondReason = getDescriptionValueByPrefix(encounterObs, [
    RADIOLOGY_ABSCONDED_PREFIX,
  ]);

  const excludedNames = new Set([
    concepts.IMAGING_TESTS.toLowerCase(),
    concepts.REASON_FOR_REQUEST.toLowerCase(),
    concepts.DIFFERENTIAL_DIAGNOSIS.toLowerCase(),
    concepts.SPECIALITY_DEPARTMENT.toLowerCase(),
    concepts.DATE_OF_LAST_MENSTRUAL.toLowerCase(),
    concepts.DESCRIPTION.toLowerCase(),
  ]);

  const selectedAreas = encounterObs
    .filter((obs) => {
      const name = getObsNameLower(obs);
      const value = getObsValue(obs).toLowerCase();
      return !excludedNames.has(name) && value === "yes";
    })
    .map((obs) => {
      const parent = getObsName(obs);
      const children = getObsChildren(obs)
        .filter((child) => getObsValue(child).toLowerCase() === "yes")
        .map((child) => getObsName(child))
        .filter(Boolean);
      if (children.length === 0) return parent;
      return `${parent}: ${children.join(", ")}`;
    })
    .filter(Boolean)
    .join("; ");

  const recordedAt =
    encounterObs
      .map((obs) => normalizeObsValue(obs?.obs_datetime))
      .filter(Boolean)
      .sort((a, b) => toTimestamp(a) - toTimestamp(b))
      .pop() || "";

  const hasRequestDetails = Boolean(
    requestedBy ||
      reasonForRequest ||
      differentialDiagnosis ||
      clinicalFindings ||
      selectedAreas ||
      requestId
  );
  const isResult = Boolean(findings);
  const isAbscond = Boolean(abscondReason);
  const isRequest = hasRequestDetails && !isResult && !isAbscond;

  if (!isRequest && !isResult && !isAbscond) {
    return null;
  }

  const firstWithUser = encounterObs.find((obs) => Boolean(obs?.created_by));
  const user = firstWithUser?.created_by
    ? `${firstWithUser.created_by} ${getHumanReadableDateTime(firstWithUser?.obs_datetime)}`
    : "";

  return {
    imagingType,
    requestId,
    requestedBy,
    reasonForRequest,
    differentialDiagnosis,
    clinicalFindings,
    selectedAreas,
    findings,
    reportedBy,
    abscondReason,
    recordedAt,
    user,
    isRequest,
    isResult,
    isAbscond,
  };
};

const groupObservationsByEncounter = (data: Obs[]) => {
  const grouped = new Map<string, Obs[]>();

  data.forEach((obs) => {
    const encounterId = normalizeObsValue((obs as any)?.encounter_id);
    const dateTime = normalizeObsValue(obs?.obs_datetime);
    const key = encounterId || `${dateTime}|${normalizeObsValue(obs?.created_by)}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(obs);
  });

  return Array.from(grouped.values());
};

export const formatRadiologyInvestigationPlans = (data: Obs[]) =>
  (() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const sanitized = data.filter(
      (ob) => ob && !isPatientContextValue(getObsValue(ob))
    );

    const encounterGroups = groupObservationsByEncounter(sanitized);
    const summaries = encounterGroups
      .map((group) => parseRadiologySummary(group))
      .filter(Boolean) as RadiologyEncounterSummary[];

    if (summaries.length === 0) return [];

    const groupedByType = summaries.reduce((acc, summary) => {
      const key = summary.imagingType || "Unspecified imaging";
      if (!acc[key]) acc[key] = [];
      acc[key].push(summary);
      return acc;
    }, {} as Record<string, RadiologyEncounterSummary[]>);

    const rows: Array<{
      plan: string;
      result: Array<{ test: string; result: string }>;
      user?: string;
    }> = [];

    Object.keys(groupedByType)
      .sort((a, b) => a.localeCompare(b))
      .forEach((imagingType) => {
        const entries = [...groupedByType[imagingType]].sort(
          (a, b) => toTimestamp(a.recordedAt) - toTimestamp(b.recordedAt)
        );

        const requests = entries.filter((entry) => entry.isRequest);
        const terminals = entries.filter((entry) => entry.isResult || entry.isAbscond);

        type ScanRecord = {
          request?: RadiologyEncounterSummary;
          result?: RadiologyEncounterSummary;
          abscond?: RadiologyEncounterSummary;
        };

        const scans: ScanRecord[] = requests.map((request) => ({ request }));

        const requestIdToIndices = new Map<string, number[]>();
        scans.forEach((scan, index) => {
          const id = normalizeObsValue(scan.request?.requestId).toLowerCase();
          if (!id) return;
          if (!requestIdToIndices.has(id)) requestIdToIndices.set(id, []);
          requestIdToIndices.get(id)!.push(index);
        });

        const unmatchedTerminals: RadiologyEncounterSummary[] = [];

        terminals.forEach((terminal) => {
          const id = normalizeObsValue(terminal.requestId).toLowerCase();
          if (!id || !requestIdToIndices.has(id)) {
            unmatchedTerminals.push(terminal);
            return;
          }

          const indices = requestIdToIndices.get(id) || [];
          const targetIndex =
            indices.find((index) => !scans[index].result && !scans[index].abscond) ??
            indices[0];

          if (targetIndex == null) {
            unmatchedTerminals.push(terminal);
            return;
          }

          if (terminal.isResult) scans[targetIndex].result = terminal;
          if (terminal.isAbscond) scans[targetIndex].abscond = terminal;
        });

        unmatchedTerminals.forEach((terminal) => {
          const pendingIndex = scans.findIndex(
            (scan) => !scan.result && !scan.abscond
          );
          if (pendingIndex >= 0) {
            if (terminal.isResult) scans[pendingIndex].result = terminal;
            if (terminal.isAbscond) scans[pendingIndex].abscond = terminal;
            return;
          }
          scans.push(terminal.isResult ? { result: terminal } : { abscond: terminal });
        });

        scans
          .sort((a, b) => {
            const aTime =
              a.request?.recordedAt || a.result?.recordedAt || a.abscond?.recordedAt || "";
            const bTime =
              b.request?.recordedAt || b.result?.recordedAt || b.abscond?.recordedAt || "";
            return toTimestamp(aTime) - toTimestamp(bTime);
          })
          .forEach((scan, index) => {
            const details: Array<{ test: string; result: string }> = [];
            const request = scan.request;
            const result = scan.result;
            const abscond = scan.abscond;

            const requestTime =
              request?.recordedAt || result?.recordedAt || abscond?.recordedAt || "";
            details.push({
              test: "Requested On",
              result: formatMaybeDateTime(requestTime),
            });

            if (request?.requestedBy) {
              details.push({ test: "Requesting Dr", result: request.requestedBy });
            }
            if (request?.reasonForRequest) {
              details.push({
                test: "Examination request for",
                result: request.reasonForRequest,
              });
            }
            if (request?.differentialDiagnosis) {
              details.push({
                test: "Differential diagnosis",
                result: request.differentialDiagnosis,
              });
            }
            if (request?.clinicalFindings) {
              details.push({
                test: "Clinical findings",
                result: request.clinicalFindings,
              });
            }
            if (request?.selectedAreas) {
              details.push({
                test: "Requested scan areas",
                result: request.selectedAreas,
              });
            }

            if (result) {
              details.push({
                test: "Status",
                result: `Report submitted (${formatMaybeDateTime(result.recordedAt)})`,
              });
              if (result.findings) {
                details.push({
                  test: "Radiologist findings",
                  result: result.findings,
                });
              }
              if (result.reportedBy) {
                details.push({ test: "Reported by", result: result.reportedBy });
              }
            } else if (abscond) {
              details.push({
                test: "Status",
                result: `Patient absconded (${formatMaybeDateTime(abscond.recordedAt)})`,
              });
              if (abscond.abscondReason) {
                details.push({ test: "Abscond note", result: abscond.abscondReason });
              }
            } else {
              details.push({
                test: "Status",
                result: "Pending radiologist report",
              });
            }

            rows.push({
              plan: `${imagingType} Scan ${index + 1}`,
              result: details,
              user: request?.user || result?.user || abscond?.user || undefined,
            });
          });
      });

    return rows;
  })();

export const formatManagementPlan = (data: Obs[]): ClinicalNotesDataType => {
  const items = data?.map((item) => ({ item: item?.value }));
  return {
    heading: "Non Pharmacological",
    children: items,
    user: formatUser(data),
  };
};

const getDispositionConfig = (ob: Obs) => {
  const conceptName = ob?.names?.[0]?.name;
  return (
    Object.values(dispositionFormConfig).find(
      (config: any) =>
        config?.name === conceptName || config?.name === ob?.value
    ) || null
  );
};

export const formatDisposition = (data: Obs[]) => {
  if (!Array.isArray(data) || data.length === 0) return [];

  return data
    .filter((ob) => ob?.value || (ob?.children && ob.children.length > 0))
    .map((ob) => {
      const config = getDispositionConfig(ob);
      const heading =
        config?.label || ob?.value || ob?.names?.[0]?.name || "Disposition";
      const children = config?.children
        ? buildChildren(ob?.children ?? [], config.children)
        : [];
      const user = ob?.created_by
        ? `${ob.created_by} ${getHumanReadableDateTime(ob?.obs_datetime)}`
        : undefined;

      return {
        heading,
        children,
        user,
      };
    });
};

/** ------------------------------
 * Helpers for children + notes
 * ------------------------------ */

const handleImagesObsRestructure = (children: Obs[]) => {
  return children
    .filter((ob: Obs) => ob.value || (ob.children && ob.children.length > 0))
    .map((ob: Obs) => {
      const childItems =
        ob.children
          ?.filter(
            (childOb: Obs) =>
              childOb.value || (childOb.children && childOb.children.length > 0)
          )
          .map((childOb: Obs) => {
            let nestedChildren: any[] = [];

            if (childOb?.children && childOb.children.length > 0) {
              nestedChildren = childOb.children
                .filter((cOb: Obs) => cOb.value)
                .map((cOb: Obs) => ({
                  item: {
                    [cOb.names?.[0]?.name || "Unnamed"]: cOb.value,
                  },
                }));
            }

            return {
              item:
                nestedChildren.length === 0
                  ? { [childOb.names?.[0]?.name || "Unnamed"]: childOb.value }
                  : childOb.value,
              children: nestedChildren.length > 0 ? nestedChildren : undefined,
            };
          }) ?? [];

      return {
        item: ob.value,
        children: childItems.length > 0 ? childItems : undefined,
      };
    });
};

const formatDateDDMMYYYY = (value: any) => {
  if (!value || typeof value !== "string") return value;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  return `${match[3]}-${match[2]}-${match[1]}`;
};

const getLatestObs = (obsList: Obs[]) => {
  if (!obsList || obsList.length === 0) return null;
  return obsList.reduce((latest: Obs | null, current: Obs) => {
    if (!latest) return current;
    const latestTime = new Date(latest?.obs_datetime || 0).getTime();
    const currentTime = new Date(current?.obs_datetime || 0).getTime();
    return currentTime > latestTime ? current : latest;
  }, null);
};

const formatCareAreaNotes = (obs: Obs[]) => {
  const careArea = getObservationValue(obs, concepts.CARE_AREA);
  if (!careArea) return [];
  return [{ item: { "Patient Care Area": careArea } }];
};

const formatMedicationPlanNotes = (obs: Obs[]) => {
  if (!obs?.length) return [];

  return obs
    .filter((ob) => ob?.value || (ob?.children && ob.children.length > 0))
    .map((ob) => {
      const formulation = getObservationValue(
        ob.children,
        concepts.MEDICATION_FORMULATION
      );
      const dose = getObservationValue(ob.children, concepts.MEDICATION_DOSE);
      const doseUnit = getObservationValue(
        ob.children,
        concepts.MEDICATION_DOSE_UNIT
      );
      const frequency = getObservationValue(
        ob.children,
        concepts.MEDICATION_FREQUENCY
      );
      const duration = getObservationValue(
        ob.children,
        concepts.MEDICATION_DURATION
      );
      const durationUnit = getObservationValue(
        ob.children,
        concepts.MEDICATION_DURATION_UNIT
      );

      const children = [];

      if (formulation) {
        children.push({ item: { Formulation: formulation } });
      }

      if (dose || doseUnit) {
        children.push({
          item: { Dose: [dose, doseUnit].filter(Boolean).join(" ") },
        });
      }

      if (frequency) {
        children.push({ item: { Frequency: frequency } });
      }

      if (duration || durationUnit) {
        children.push({
          item: { Duration: [duration, durationUnit].filter(Boolean).join(" ") },
        });
      }

      return {
        item: ob.value || "Medication",
        children: children.length > 0 ? children : undefined,
      };
    });
};

const buildChildren = (obs: Obs[], children: any) => {
  if (!children) return [];
  return (
    obs.length > 0 &&
    children.flatMap((child: any) => {
      const innerObs = filterObservations(obs, child.concept);

      if (!innerObs || innerObs.length === 0) return [];

      // Handle image-type obs
      if (child?.image) {
        const parentOb = filterObservations(obs, child?.parentConcept);
        if (!parentOb?.length) return [];
        return handleImagesObsRestructure(parentOb[0].children);
      }

      const obValue = getObservationValue(obs, child?.concept);
      const formattedObValue =
        child?.format === "date" ? formatDateDDMMYYYY(obValue) : obValue;

      // If there's no usable value, skip this child
      if (
        (!formattedObValue ||
          formattedObValue === "" ||
          formattedObValue === null) &&
        (!child.multiple || innerObs.length === 0)
      ) {
        return [];
      }

      let transformedObs: any;

      if (child?.type === "string") {
        const childValue = child?.multiple
          ? innerObs
              .map((innerOb) => {
                const val = child?.options
                  ? child.options[innerOb.value]
                  : innerOb.value;
                return val ? { item: val } : null;
              })
              .filter(Boolean)
          : child?.options
            ? child.options[formattedObValue]
            : formattedObValue;

        if (
          childValue === undefined ||
          childValue === null ||
          (Array.isArray(childValue) && childValue.length === 0)
        ) {
          return [];
        }

        transformedObs = {
          item: child.label,
          children: child?.children
            ? buildChildren(obs, child?.children)
            : childValue,
        };
      } else {
        const childValue = child?.multiple
          ? innerObs
              .map((innerOb) => {
                const val = child?.options
                  ? child.options[innerOb.value]
                  : innerOb.value;
                return val ? { item: val } : null;
              })
              .filter(Boolean)
          : formattedObValue
            ? { [child.label]: formattedObValue }
            : null;

        if (
          !childValue ||
          (Array.isArray(childValue) && childValue.length === 0)
        ) {
          return [];
        }

        transformedObs = {
          item: childValue,
          children: child?.children
            ? buildChildren(obs, child?.children)
            : childValue,
        };
      }

      return transformedObs;
    })
  );
};

const buildNotesObject = (formConfig: any, obs: Obs[]) => {
  return (Object.keys(formConfig) as Array<keyof typeof formConfig>)
    .filter((key) => {
      const config = formConfig[key];
      return !config.child;
    })
    .flatMap((key) => {
      const config = formConfig[key];
      const value = getObservationValue(obs, config.name);
      if (
        !value &&
        !config.hasGroupMembers &&
        !config.image &&
        config.type != "title"
      ) {
        return [];
      }

      const displayValue = config.options?.[value] ?? value;
      const topParentType = config?.type || "N/A";

      let groupMemberChildren = [];

      if (config.groupMembersWithLabel) {
        const parentObs: any = filterObservations(obs, config.name);
        if (parentObs?.length > 0) {
          const parentToUse = config.useLatestGroupMember
            ? getLatestObs(parentObs)
            : parentObs[0];
          groupMemberChildren = parentToUse?.children ?? [];
        }
      }

      let children =
        buildChildren(
          config.groupMembersOnly ? groupMemberChildren : [...obs, ...groupMemberChildren],
          config.children
        ) ?? [];

      if (config.hasGroupMembers) {
        const parentObs: any = filterObservations(obs, config.name);
        if (parentObs?.length > 0) {
          children = [
            ...children,
            ...parentObs[0]?.children
              .filter((child: any) => child.value)
              .map((child: any) => ({
                item: child.value,
              })),
          ];
        }

        if (!value && children.length === 0) {
          return [];
        }
      }

      if (config?.image) {
        const parentObs: any = filterObservations(obs, config.name);
        const imagesObs = parentObs
          .filter((ob: Obs) => ob.value || (ob.children?.length ?? 0) > 0)
          .map((ob: Obs) => ({
            item: ob.value,
            children: handleImagesObsRestructure(ob.children),
          }));
        return imagesObs;
      }

      const result: any = {
        item:
          topParentType === "string"
            ? displayValue
            : topParentType === "title"
              ? config.label
              : { [config.label]: displayValue },
      };

      if (children.length > 0) {
        result.children = children;
      }

      result.bold=config.bold;

      return result;
    });
};
