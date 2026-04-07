import { useEffect, useState } from "react";
import { concepts, encounters } from "@/constants";
import { Obs } from "@/interfaces";

type RadiologySummary = {
  imagingType: string;
  requestId: string;
  requestedBy: string;
  reasonForRequest: string;
  differentialDiagnosis: string;
  clinicalFindings: string;
  findings: string;
  reportedBy: string;
  abscondReason: string;
  recordedAt: string;
  isRequest: boolean;
  isResult: boolean;
  isAbscond: boolean;
};

const DESCRIPTION = concepts.DESCRIPTION.toLowerCase();
const IMAGING_TYPE_PREFIX = "imaging type:";
const REQUEST_ID_PREFIX = "radiology request id:";
const CLINICAL_FINDINGS_PREFIX = "clinical findings:";
const REQUESTED_BY_PREFIX = "requested by:";
const FINDINGS_PREFIXES = ["radiology findings:", "radiology result:"];
const REPORTED_BY_PREFIX = "reported by:";
const ABSCONDED_PREFIX = "patient absconded the ";

const normalize = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    const candidates = [
      objectValue.value_text,
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

const normalizeLower = (value: unknown) => normalize(value).toLowerCase();

const getObsName = (obs: Obs | any) => normalize(obs?.names?.[0]?.name);
const getObsNameLower = (obs: Obs | any) => getObsName(obs).toLowerCase();

const getObsValue = (obs: Obs | any) =>
  normalize(obs?.value_text) || normalize(obs?.value);

const getChildren = (obs: Obs | any): Obs[] => {
  if (Array.isArray(obs?.children) && obs.children.length > 0) return obs.children;
  if (Array.isArray(obs?.groupMembers) && obs.groupMembers.length > 0) {
    return obs.groupMembers;
  }
  return [];
};

const getValueByConceptName = (observations: Array<Obs | any>, conceptName: string) => {
  const target = conceptName.toLowerCase();
  const found = observations.find((obs) => getObsNameLower(obs) === target);
  return found ? getObsValue(found) : "";
};

const getDescriptionValueByPrefix = (
  observations: Array<Obs | any>,
  prefixes: string[]
) => {
  const normalizedPrefixes = prefixes.map((prefix) => prefix.toLowerCase());

  for (const obs of observations) {
    if (getObsNameLower(obs) !== DESCRIPTION) continue;

    const value = getObsValue(obs);
    const lowered = value.toLowerCase();
    const matchedPrefix = normalizedPrefixes.find((prefix) =>
      lowered.startsWith(prefix)
    );

    if (matchedPrefix) {
      return value.slice(matchedPrefix.length).trim();
    }
  }

  return "";
};

const getEncounterDate = (encounter: any) => {
  const encounterDate = normalize(encounter?.encounter_datetime);
  if (encounterDate) return encounterDate;

  const observations = Array.isArray(encounter?.obs) ? encounter.obs : [];
  const obsDate = observations.find((obs: Obs | any) => Boolean(obs?.obs_datetime))
    ?.obs_datetime;
  return normalize(obsDate);
};

const toTimestamp = (dateString: string) => {
  const parsed = new Date(dateString).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatDate = (dateString: string) => {
  if (!dateString) return "Unknown time";
  const parsed = new Date(dateString);
  return Number.isNaN(parsed.getTime()) ? dateString : parsed.toLocaleString();
};

const processObservation = (obs: Obs, indent = 0): string => {
  let message = "";
  const indentStr = " ".repeat(indent * 2);
  const value = getObsValue(obs);

  if (value) {
    message += `${indentStr}${getObsName(obs) || "Test"}: ${value}\n`;
  }

  const children = getChildren(obs);
  if (children.length > 0) {
    children.forEach((child) => {
      message += processObservation(child, indent + 1);
    });
  }

  return message;
};

const parseRadiologySummary = (encounter: any): RadiologySummary | null => {
  const observations = Array.isArray(encounter?.obs) ? encounter.obs : [];
  if (observations.length === 0) return null;

  const imagingType =
    getDescriptionValueByPrefix(observations, [IMAGING_TYPE_PREFIX]) ||
    getValueByConceptName(observations, concepts.IMAGING_TESTS) ||
    "Unspecified imaging";

  const requestId = getDescriptionValueByPrefix(observations, [REQUEST_ID_PREFIX]);
  const requestedBy = getDescriptionValueByPrefix(observations, [REQUESTED_BY_PREFIX]);
  const reasonForRequest = getValueByConceptName(observations, concepts.REASON_FOR_REQUEST);
  const differentialDiagnosis = getValueByConceptName(
    observations,
    concepts.DIFFERENTIAL_DIAGNOSIS
  );
  const clinicalFindings = getDescriptionValueByPrefix(observations, [
    CLINICAL_FINDINGS_PREFIX,
  ]);
  const findings = getDescriptionValueByPrefix(observations, FINDINGS_PREFIXES);
  const reportedBy = getDescriptionValueByPrefix(observations, [REPORTED_BY_PREFIX]);
  const abscondReason = getDescriptionValueByPrefix(observations, [ABSCONDED_PREFIX]);

  const hasRequestDetails = Boolean(
    requestedBy || reasonForRequest || differentialDiagnosis || clinicalFindings || requestId
  );
  const isResult = Boolean(findings);
  const isAbscond = Boolean(abscondReason);
  const isRequest = hasRequestDetails && !isResult && !isAbscond;

  if (!isRequest && !isResult && !isAbscond) return null;

  return {
    imagingType,
    requestId,
    requestedBy,
    reasonForRequest,
    differentialDiagnosis,
    clinicalFindings,
    findings,
    reportedBy,
    abscondReason,
    recordedAt: getEncounterDate(encounter),
    isRequest,
    isResult,
    isAbscond,
  };
};

const buildRadiologySection = (encountersList: any[]) => {
  const summaries = encountersList
    .map((encounter) => parseRadiologySummary(encounter))
    .filter(Boolean) as RadiologySummary[];

  if (summaries.length === 0) return "";

  const byType: Record<string, RadiologySummary[]> = {};
  summaries.forEach((summary) => {
    const key = summary.imagingType || "Unspecified imaging";
    if (!byType[key]) byType[key] = [];
    byType[key].push(summary);
  });

  const lines: string[] = ["Radiology examinations:\n\n"];

  Object.keys(byType)
    .sort((a, b) => a.localeCompare(b))
    .forEach((typeName) => {
      const sorted = [...byType[typeName]].sort(
        (a, b) => toTimestamp(a.recordedAt) - toTimestamp(b.recordedAt)
      );

      const requests = sorted.filter((entry) => entry.isRequest);
      const terminals = sorted.filter((entry) => entry.isResult || entry.isAbscond);

      const scans = requests.map((request) => ({ request } as {
        request?: RadiologySummary;
        result?: RadiologySummary;
        abscond?: RadiologySummary;
      }));

      const requestIndicesById = new Map<string, number[]>();
      scans.forEach((scan, index) => {
        const id = normalizeLower(scan.request?.requestId);
        if (!id) return;
        if (!requestIndicesById.has(id)) requestIndicesById.set(id, []);
        requestIndicesById.get(id)!.push(index);
      });

      const unmatchedTerminals: RadiologySummary[] = [];

      terminals.forEach((terminal) => {
        const id = normalizeLower(terminal.requestId);
        if (!id || !requestIndicesById.has(id)) {
          unmatchedTerminals.push(terminal);
          return;
        }

        const indices = requestIndicesById.get(id) || [];
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

        scans.push(
          terminal.isResult ? { result: terminal } : { abscond: terminal }
        );
      });

      lines.push(`${typeName}:\n`);

      scans.forEach((scan, index) => {
        const request = scan.request;
        const result = scan.result;
        const abscond = scan.abscond;
        const referenceTime =
          request?.recordedAt || result?.recordedAt || abscond?.recordedAt || "";

        lines.push(`  ${index + 1}. Requested on ${formatDate(referenceTime)}\n`);

        if (request?.requestedBy) {
          lines.push(`     Requesting Dr: ${request.requestedBy}\n`);
        }
        if (request?.reasonForRequest) {
          lines.push(`     Examination request for: ${request.reasonForRequest}\n`);
        }
        if (request?.differentialDiagnosis) {
          lines.push(
            `     Differential diagnosis: ${request.differentialDiagnosis}\n`
          );
        }
        if (request?.clinicalFindings) {
          lines.push(`     Clinical findings: ${request.clinicalFindings}\n`);
        }

        if (result) {
          lines.push(`     Radiology findings: ${result.findings}\n`);
          if (result.reportedBy) {
            lines.push(`     Reported by: ${result.reportedBy}\n`);
          }
          lines.push(`     Status: Report submitted (${formatDate(result.recordedAt)})\n`);
        } else if (abscond) {
          lines.push(`     Status: Patient absconded (${formatDate(abscond.recordedAt)})\n`);
          if (abscond.abscondReason) {
            lines.push(`     Abscond note: ${abscond.abscondReason}\n`);
          }
        } else {
          lines.push("     Status: Pending radiologist report\n");
        }

        lines.push("\n");
      });

      lines.push("\n");
    });

  return lines.join("");
};

export const useInvestigations = (pData: any) => {
  const [investigationsMessage, setInvestigationsMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!Array.isArray(pData)) return;

    const bedSideEncounters = pData.filter(
      (d: any) => d?.encounter_type?.uuid === encounters.BED_SIDE_TEST
    );
    const radiologyEncounters = pData.filter(
      (d: any) => d?.encounter_type?.uuid === encounters.RADIOLOGY_EXAMINATON
    );

    const messages: string[] = [];

    if (bedSideEncounters.length > 0) {
      const allBedsideObs = bedSideEncounters.flatMap((enc: any) =>
        Array.isArray(enc?.obs) ? enc.obs : []
      );

      const observationDates = allBedsideObs
        .map((ob: Obs | any) => ob?.obs_datetime)
        .filter((d: string | null | undefined): d is string => Boolean(d));

      const latestDate =
        observationDates.length > 0
          ? new Date(
              Math.max(...observationDates.map((d: string) => new Date(d).getTime()))
            )
          : new Date();

      messages.push(`Bed side tests recorded on ${latestDate.toLocaleString()}:\n\n`);
      allBedsideObs.forEach((obs: Obs) => {
        messages.push(processObservation(obs));
      });
      messages.push("\n");
    }

    if (radiologyEncounters.length > 0) {
      const radiologySection = buildRadiologySection(radiologyEncounters);
      if (radiologySection) {
        messages.push(radiologySection);
      }
    }

    const finalMessage = messages.join("").trim();
    setInvestigationsMessage(finalMessage || null);
  }, [pData]);

  return investigationsMessage;
};
