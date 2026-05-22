import { concepts } from "@/constants";

export type RadiologyTypeSlug =
  | "x-ray"
  | "ct-scan"
  | "ultrasound"
  | "mri"
  | "other";

export type RadiologyTypeOption = {
  slug: RadiologyTypeSlug;
  label: string;
  conceptValue?: string;
  description: string;
};

const normalizeText = (value: unknown) => {
  if (typeof value === "string") return value.trim().toLowerCase();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim().toLowerCase();
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
        return candidate.trim().toLowerCase();
      }
    }
  }
  return "";
};

export const STANDARD_IMAGING_TYPE_VALUES = [
  concepts.X_RAY,
  concepts.CT_SCAN,
  concepts.ULTRASOUND,
  concepts.MRI,
];

export const RADIOLOGY_TYPE_OPTIONS: RadiologyTypeOption[] = [
  {
    slug: "x-ray",
    label: concepts.X_RAY,
    conceptValue: concepts.X_RAY,
    description: "General radiographic studies",
  },
  {
    slug: "ct-scan",
    label: concepts.CT_SCAN,
    conceptValue: concepts.CT_SCAN,
    description: "Cross-sectional imaging studies",
  },
  {
    slug: "ultrasound",
    label: concepts.ULTRASOUND,
    conceptValue: concepts.ULTRASOUND,
    description: "Ultrasound imaging studies",
  },
  {
    slug: "mri",
    label: concepts.MRI,
    conceptValue: concepts.MRI,
    description: "Magnetic resonance imaging studies",
  },
  {
    slug: "other",
    label: "Other",
    description: "Other imaging studies",
  },
];

export const getRadiologyTypeBySlug = (slug?: string | null) =>
  RADIOLOGY_TYPE_OPTIONS.find((option) => option.slug === slug);

export const isImagingTypeMatch = (
  imagingTypeValue: unknown,
  selectedType: RadiologyTypeOption
) => {
  const normalizedValue = normalizeText(imagingTypeValue);
  if (!normalizedValue) return false;

  if (selectedType.slug === "other") {
    const knownTypes = STANDARD_IMAGING_TYPE_VALUES.map(normalizeText);
    return normalizedValue === "other" || !knownTypes.includes(normalizedValue);
  }

  return normalizedValue === normalizeText(selectedType.conceptValue);
};
