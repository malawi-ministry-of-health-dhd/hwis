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
  data.map((ob) => {
    const plan = ob.value;
    const result = ob.children.map((child: Obs) => ({
      test: child.names[0].name,
      result: child.value,
    }));

    return {
      plan,
      result,
      user: ob?.created_by
        ? `${ob.created_by} ${getHumanReadableDateTime(ob?.obs_datetime)}`
        : undefined,
    };
  });

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
