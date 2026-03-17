import { GenericDialog } from "@/components";
import { getHumanReadableDateTimeLab } from "@/helpers/dateTime";
import { getPatientLabOrder } from "@/hooks/labOrder";
import { LabStatusEntry, PatientLabOrder } from "@/interfaces";
import {
  Box,
  Button,
  Chip,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { SyntheticEvent, useMemo, useState } from "react";

// Temporary UI preview data. Set this to false or remove this block to restore live API data only.
const USE_MOCK_STATUS_VIEW_DATA = true;

const createUpdatedBy = (
  first_name: string,
  last_name: string,
  id: string,
) => ({
  first_name,
  last_name,
  id,
  phone_number: "",
});

const createStatusEntry = (
  status: string,
  timestamp: string,
  updatedBy: ReturnType<typeof createUpdatedBy>,
): LabStatusEntry => ({
  status_id: 0,
  status,
  timestamp,
  updated_by: updatedBy,
});

const createMockLabOrder = ({
  id,
  accession_number,
  specimenName,
  orderStatusTrail,
}: {
  id: number;
  accession_number: string;
  specimenName: string;
  orderStatusTrail: LabStatusEntry[];
}): PatientLabOrder => ({
  id,
  order_id: id,
  encounter_id: 1000 + id,
  order_date: orderStatusTrail[0]?.timestamp ?? "2026-03-03T08:00:00.000+02:00",
  patient_id: 1,
  accession_number,
  specimen: {
    concept_id: id,
    name: specimenName,
  },
  requesting_clinician: "Demo Clinician",
  target_lab: "Central Lab",
  reason_for_test: {
    concept_id: 1,
    name: "UI Preview",
  },
  delivery_mode: null,
  order_status: orderStatusTrail[orderStatusTrail.length - 1],
  order_status_trail: orderStatusTrail,
  tests: [
    {
      id: id * 100,
      name: `Mock Test ${id}`,
      result: [],
    },
  ],
});

const MOCK_STATUS_VIEW_DATA: PatientLabOrder[] = [
  createMockLabOrder({
    id: 14348,
    accession_number: "XAETC263311050",
    specimenName: "Venous Whole Blood",
    orderStatusTrail: [
      createStatusEntry(
        "Drawn",
        "2026-03-03T10:50:06.000+02:00",
        createUpdatedBy("Super", "User", "1"),
      ),
      createStatusEntry(
        "specimen_accepted",
        "2026-03-03T11:28:03.000+02:00",
        createUpdatedBy("Developer", "User", "822307"),
      ),
    ],
  }),
  createMockLabOrder({
    id: 14349,
    accession_number: "XAETC263311051",
    specimenName: "Urine",
    orderStatusTrail: [
      createStatusEntry(
        "specimen_not_collected",
        "2026-03-03T09:12:00.000+02:00",
        createUpdatedBy("Martha", "Nurse", "440"),
      ),
    ],
  }),
  createMockLabOrder({
    id: 14350,
    accession_number: "XAETC263311052",
    specimenName: "CSF",
    orderStatusTrail: [
      createStatusEntry(
        "Drawn",
        "2026-03-03T11:20:00.000+02:00",
        createUpdatedBy("Peter", "Clinician", "66"),
      ),
      createStatusEntry(
        "specimen_rejected",
        "2026-03-03T12:03:00.000+02:00",
        createUpdatedBy("Grace", "Lab", "512"),
      ),
    ],
  }),
  createMockLabOrder({
    id: 14351,
    accession_number: "XAETC263311053",
    specimenName: "Serum",
    orderStatusTrail: [
      createStatusEntry(
        "Drawn",
        "2026-03-03T08:40:00.000+02:00",
        createUpdatedBy("James", "Ward", "301"),
      ),
    ],
  }),
  createMockLabOrder({
    id: 14352,
    accession_number: "XAETC263311054",
    specimenName: "Nasopharyngeal Swab",
    orderStatusTrail: [
      createStatusEntry(
        "Drawn",
        "2026-03-03T12:48:00.000+02:00",
        createUpdatedBy("Amina", "Nurse", "220"),
      ),
      createStatusEntry(
        "specimen_accepted",
        "2026-03-03T13:15:00.000+02:00",
        createUpdatedBy("Ruth", "Lab", "118"),
      ),
    ],
  }),
];

const STATUS_STYLES: Record<
  string,
  { label: string; textColor: string; bgColor: string; borderColor: string }
> = {
  drawn: {
    label: "Drawn",
    textColor: "#0F4C81",
    bgColor: "#EAF2FB",
    borderColor: "#BFD6EE",
  },
  specimen_not_collected: {
    label: "Not Collected",
    textColor: "#9A3412",
    bgColor: "#FFF4E5",
    borderColor: "#F5C38B",
  },
  specimen_accepted: {
    label: "Accepted",
    textColor: "#166534",
    bgColor: "#EAF7EE",
    borderColor: "#B6E2C1",
  },
  specimen_rejected: {
    label: "Rejected",
    textColor: "#B42318",
    bgColor: "#FDECEC",
    borderColor: "#F3B3AE",
  },
};

const normalizeStatus = (status?: string) => status?.trim().toLowerCase() ?? "";

const toStatusLabel = (status?: string) => {
  if (!status) return "Status pending";

  const normalizedStatus = normalizeStatus(status);
  if (STATUS_STYLES[normalizedStatus]) {
    return STATUS_STYLES[normalizedStatus].label;
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getStatusStyle = (status?: string) => {
  const normalizedStatus = normalizeStatus(status);

  return (
    STATUS_STYLES[normalizedStatus] ?? {
      label: toStatusLabel(status),
      textColor: "#475467",
      bgColor: "#F2F4F7",
      borderColor: "#D0D5DD",
    }
  );
};

const getStatusTrail = (order: PatientLabOrder) => {
  if (order.order_status_trail && order.order_status_trail.length > 0) {
    return [...order.order_status_trail].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }

  return order.order_status ? [order.order_status] : [];
};

const getLatestStatus = (
  order: PatientLabOrder,
): LabStatusEntry | undefined => {
  const statusTrail = getStatusTrail(order);
  return statusTrail[statusTrail.length - 1];
};

const getUpdatedByLabel = (entry?: LabStatusEntry) => {
  const updatedBy = entry?.updated_by;
  if (!updatedBy) return "Updated by system";

  const fullName = [updatedBy.first_name, updatedBy.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || `Updated by ${updatedBy.id}`;
};

export const TestStatusView = ({ patientId }: { patientId: string }) => {
  const { data: liveLabOrders, isLoading } = getPatientLabOrder(
    patientId as string,
  );
  const [openDialog, setOpenDialog] = useState(false);
  const labOrders = USE_MOCK_STATUS_VIEW_DATA
    ? MOCK_STATUS_VIEW_DATA
    : (liveLabOrders ?? []);

  const orderedLabStatuses = useMemo(() => {
    return [...labOrders]
      .map((order) => ({
        order,
        latestStatus: getLatestStatus(order),
        trail: getStatusTrail(order),
      }))
      .sort((firstOrder, secondOrder) => {
        const firstTimestamp = firstOrder.latestStatus?.timestamp
          ? new Date(firstOrder.latestStatus.timestamp).getTime()
          : 0;
        const secondTimestamp = secondOrder.latestStatus?.timestamp
          ? new Date(secondOrder.latestStatus.timestamp).getTime()
          : 0;

        return secondTimestamp - firstTimestamp;
      });
  }, [labOrders]);

  if (!USE_MOCK_STATUS_VIEW_DATA && isLoading) {
    return (
      <Stack spacing={0.8} sx={{ py: 0.5, minWidth: 240 }}>
        <Skeleton variant="rounded" height={24} />
        <Skeleton variant="rounded" height={24} />
      </Stack>
    );
  }

  if (orderedLabStatuses.length === 0) {
    return (
      <Typography variant="caption" sx={{ color: "#667085" }}>
        No specimen status
      </Typography>
    );
  }

  const handleOpenDialog = (event: SyntheticEvent) => {
    event.stopPropagation();
    setOpenDialog(true);
  };

  return (
    <>
      <Box
        sx={{
          minWidth: 260,
          py: 0.25,
          display: "flex",
          flexDirection: "column",
          gap: 0.8,
        }}
      >
        <Box
          sx={{
            maxHeight: 58,
            overflowY: orderedLabStatuses.length > 1 ? "auto" : "hidden",
            pr: orderedLabStatuses.length > 1 ? 0.4 : 0,
            display: "flex",
            flexDirection: "column",
            gap: 0.8,
            "&::-webkit-scrollbar": {
              width: 6,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#D0D5DD",
              borderRadius: 999,
            },
          }}
        >
          {orderedLabStatuses.map(({ order, latestStatus }) => {
            const statusStyle = getStatusStyle(latestStatus?.status);

            return (
              <Tooltip
                key={order.id}
                title="Click to view specimen details"
                placement="top"
              >
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={handleOpenDialog}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      handleOpenDialog(event);
                    }
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    borderRadius: 2,
                    border: "1px solid #E4E7EC",
                    backgroundColor: "#FFFFFF",
                    px: 1.25,
                    py: 0.9,
                    cursor: "pointer",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    "&:hover": {
                      borderColor: "#98A2B3",
                      boxShadow: "0 1px 3px rgba(16, 24, 40, 0.08)",
                    },
                    "&:focus-visible": {
                      outline: "2px solid #2E90FA",
                      outlineOffset: 2,
                    },
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#101828",
                        fontWeight: 600,
                        lineHeight: 1.25,
                      }}
                    >
                      {order.specimen?.name ?? "Unknown specimen"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#667085" }}>
                      Specimen status
                    </Typography>
                  </Box>
                  <Chip
                    label={statusStyle.label}
                    size="small"
                    sx={{
                      height: 24,
                      fontWeight: 700,
                      color: statusStyle.textColor,
                      backgroundColor: statusStyle.bgColor,
                      border: "1px solid",
                      borderColor: statusStyle.borderColor,
                      "& .MuiChip-label": {
                        px: 1,
                      },
                    }}
                  />
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            px: 0.5,
          }}
        >
          <Typography variant="caption" sx={{ color: "#667085" }}>
            {orderedLabStatuses.length > 1
              ? `${orderedLabStatuses.length} specimen statuses`
              : "1 specimen status"}
          </Typography>
          <Typography variant="caption" sx={{ color: "#98A2B3" }}>
            Click row
          </Typography>
        </Box>
      </Box>

      <GenericDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        title="Specimen status details"
        maxWidth="md"
        sx={{ overflow: "hidden", px: 0 }}
      >
        <Stack spacing={1.5} sx={{ minWidth: { xs: "100%", sm: 560 } }}>
          {orderedLabStatuses.map(({ order, latestStatus, trail }) => {
            const latestStatusStyle = getStatusStyle(latestStatus?.status);

            return (
              <Box
                key={order.id}
                sx={{
                  borderRadius: 3,
                  border: "1px solid #EAECF0",
                  backgroundColor: "#F8FAFC",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    backgroundColor: "#FFFFFF",
                    borderBottom: "1px solid #EAECF0",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "#101828", fontWeight: 700 }}
                  >
                    {order.specimen?.name ?? "Unknown specimen"}
                  </Typography>
                  <Chip
                    label={latestStatusStyle.label}
                    size="small"
                    sx={{
                      height: 24,
                      fontWeight: 700,
                      color: latestStatusStyle.textColor,
                      backgroundColor: latestStatusStyle.bgColor,
                      border: "1px solid",
                      borderColor: latestStatusStyle.borderColor,
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderBottom: "1px solid #EAECF0",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#475467",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Tests
                  </Typography>
                  {order.tests && order.tests.length > 0 ? (
                    <Stack spacing={0.85} sx={{ mt: 1 }}>
                      {order.tests.map((test) => (
                        <Box
                          key={test.id}
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 0.9,
                          }}
                        >
                          <Box
                            sx={{
                              width: 7,
                              height: 7,
                              mt: 0.8,
                              borderRadius: "50%",
                              backgroundColor: "#98A2B3",
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ color: "#344054", lineHeight: 1.4 }}
                          >
                            {test.name}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ color: "#667085", mt: 1 }}
                    >
                      No tests listed.
                    </Typography>
                  )}
                </Box>

                <Stack spacing={0} sx={{ px: 2, py: 1.5 }}>
                  {trail.length > 0 ? (
                    trail.map((entry, index) => {
                      const statusStyle = getStatusStyle(entry.status);
                      const isLastItem = index === trail.length - 1;

                      return (
                        <Box
                          key={`${order.id}-${entry.timestamp}-${entry.status}-${index}`}
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "18px minmax(0, 1fr)",
                            columnGap: 1.25,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                            }}
                          >
                            <Box
                              sx={{
                                mt: 0.7,
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                backgroundColor: statusStyle.textColor,
                                border: "2px solid #FFFFFF",
                                boxShadow: "0 0 0 1px #D0D5DD",
                              }}
                            />
                            {!isLastItem && (
                              <Box
                                sx={{
                                  mt: 0.35,
                                  width: 2,
                                  flex: 1,
                                  minHeight: 28,
                                  backgroundColor: "#D0D5DD",
                                }}
                              />
                            )}
                          </Box>

                          <Box sx={{ pb: isLastItem ? 0 : 1.75 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ color: "#101828", fontWeight: 600 }}
                              >
                                {toStatusLabel(entry.status)}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "#667085" }}
                              >
                                {getHumanReadableDateTimeLab(entry.timestamp)}
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{ color: "#667085" }}
                            >
                              {getUpdatedByLabel(entry)}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })
                  ) : (
                    <Typography variant="body2" sx={{ color: "#667085" }}>
                      No status history available.
                    </Typography>
                  )}
                </Stack>
              </Box>
            );
          })}
          <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 0.5 }}>
            <Button
              variant="outlined"
              onClick={(event) => {
                event.stopPropagation();
                setOpenDialog(false);
              }}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Close
            </Button>
          </Box>
        </Stack>
      </GenericDialog>
    </>
  );
};
