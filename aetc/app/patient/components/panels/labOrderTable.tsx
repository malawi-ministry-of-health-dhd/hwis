import { BaseTable, GenericDialog, MainButton, WrapperBox } from "@/components";
import {
  LabBarcodeComponentPrintTemplate,
} from "@/components/barcode";
import { getHumanReadableDateTimeLab } from "@/helpers/dateTime";
import { useParameters } from "@/hooks";
import { getPrinters } from "@/hooks/loadStatic";
import { getPatientLabOrder } from "@/hooks/labOrder";
import { getOnePatient } from "@/hooks/patientReg";
import { PatientLabOrder } from "@/interfaces";
import { ReactNode, useCallback, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { BasicSelect } from "../basicSelect";

type LabOrderTest = PatientLabOrder["tests"][number];

const TABLE_BORDER_COLOR = "#D0D5DD";

const hasResults = (test: LabOrderTest) =>
  Array.isArray(test.result) && test.result.length > 0;

const getLatestTestStatus = (test: LabOrderTest) => {
  if (test.test_status_trail && test.test_status_trail.length > 0) {
    return [...test.test_status_trail].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )[test.test_status_trail.length - 1];
  }

  return test.test_status;
};

const getLatestOrderStatus = (order: PatientLabOrder) => {
  if (order.order_status_trail && order.order_status_trail.length > 0) {
    return [...order.order_status_trail].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )[order.order_status_trail.length - 1];
  }

  return order.order_status;
};

const getOrderStatusLabel = (order: PatientLabOrder) => {
  const latestStatus = getLatestOrderStatus(order);
  if (latestStatus?.status) {
    return toStatusLabel(latestStatus.status);
  }

  return "Status pending";
};

const toStatusLabel = (status?: string) => {
  if (!status) return "";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getTestStatusLabel = (test: LabOrderTest) => {
  const latestStatus = getLatestTestStatus(test);
  if (latestStatus?.status) {
    return toStatusLabel(latestStatus.status);
  }

  return hasResults(test) ? "Results Available" : "Waiting for result(s)";
};

const getTechnicianLabel = (requestingClinician: string) => {
  const nameParts = requestingClinician.split(" ").filter(Boolean);
  return nameParts[1] ?? nameParts[0] ?? "";
};

const SPLIT_ROW_ITEM_SX = {
  minHeight: 34,
  py: 0.45,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
};

export const LabOrderTable = () => {
  const { data: printers } = getPrinters();
  const printFuncRef = useRef<(() => any) | null>(null);

  const { params } = useParameters();
  const { data: patient } = getOnePatient(params.id as string);
  const { data: labOrders } = getPatientLabOrder(params?.id as string);

  const [showDialog, setShowDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState({
    sampleType: "",
    ascension: "",
    tests: "",
    orderDate: "",
    requestingTechnician: "",
    description: "",
  });
  const [printer, setPrinter] = useState("http://localhost:3000");
  const [openDialog, setOpenDialog] = useState(false);
  const [fullResults, setFullResults] = useState([
    {
      name: "",
      value: "",
      testName: "",
    },
  ]);

  const handleViewClick = useCallback((results: any, name: string) => {
    const formattedResults = results.map((item: any) => ({
      name: item.indicator.name,
      value: item.value,
      testName: name,
    }));
    setFullResults(formattedResults);
    setOpenDialog(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpenDialog(false);
  }, []);

  const handleSetTriggerFunc = useCallback((func: () => any) => {
    printFuncRef.current = func;
  }, []);

  const handlePrint = () => {
    if (printFuncRef.current && typeof printFuncRef.current === "function") {
      printFuncRef.current();
      setShowDialog(false);
    }
  };

  const groupedLabOrders = useMemo(
    () =>
      labOrders?.map((lab) => ({
        ...lab,
        id: lab.order_id || lab.id,
      })) || [],
    [labOrders],
  );

  const renderSplitCell = (
    tests: LabOrderTest[],
    renderItem: (test: LabOrderTest, index: number) => ReactNode,
  ) => (
    <Stack spacing={0} sx={{ width: "100%" }}>
      {tests.map((test, index) => (
        <Box
          key={test.id ?? `${test.name}-${index}`}
          sx={{
            ...SPLIT_ROW_ITEM_SX,
            ...(index < tests.length - 1
              ? { borderBottom: `1px solid ${TABLE_BORDER_COLOR}` }
              : {}),
          }}
        >
          {renderItem(test, index)}
        </Box>
      ))}
    </Stack>
  );

  const columns = [
    {
      field: "specimen",
      headerName: "Specimen",
      flex: 0.8,
      minWidth: 120,
      renderCell: (cell: any) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            width: "100%",
            height: "100%",
            py: 0.7,
          }}
        >
          <Typography sx={{ fontWeight: 700, color: "#101828", fontSize: "0.92rem", lineHeight: 1.2 }}>
            {cell.row.specimen?.name || "Unknown specimen"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "accessionNumber",
      headerName: "Accession Number",
      flex: 0.9,
      minWidth: 140,
      renderCell: (cell: any) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            width: "100%",
            height: "100%",
            py: 0.7,
          }}
        >
          <Typography sx={{ color: "#101828", fontSize: "0.9rem", lineHeight: 1.2 }}>
            {cell.row.accession_number}
          </Typography>
        </Box>
      ),
    },
    {
      field: "specimenStatus",
      headerName: "Specimen Status",
      flex: 0.85,
      minWidth: 130,
      renderCell: (cell: any) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            width: "100%",
            height: "100%",
            py: 0.7,
          }}
        >
          <Typography sx={{ color: "#101828", fontSize: "0.9rem", lineHeight: 1.2 }}>
            {getOrderStatusLabel(cell.row)}
          </Typography>
        </Box>
      ),
    },
    {
      field: "requesting_clinician",
      headerName: "Ordered By",
      flex: 0.85,
      minWidth: 130,
      renderCell: (cell: any) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            width: "100%",
            height: "100%",
            py: 0.7,
          }}
        >
          <Typography sx={{ color: "#101828", fontSize: "0.9rem", lineHeight: 1.2 }}>
            {cell.row.requesting_clinician}
          </Typography>
        </Box>
      ),
    },
    {
      field: "tests",
      headerName: "Test(s)",
      flex: 1.05,
      minWidth: 150,
      sortable: false,
      renderCell: (cell: any) =>
        renderSplitCell(cell.row.tests || [], (test) => (
          <Typography sx={{ color: "#101828", width: "100%", fontSize: "0.9rem", lineHeight: 1.2 }}>
            {test.name}
          </Typography>
        )),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.95,
      minWidth: 130,
      sortable: false,
      renderCell: (cell: any) =>
        renderSplitCell(cell.row.tests || [], (test) => (
          <Typography sx={{ color: "#344054", fontWeight: 500, fontSize: "0.9rem", lineHeight: 1.2 }}>
            {getTestStatusLabel(test)}
          </Typography>
        )),
    },
    {
      field: "action",
      headerName: "Action",
      flex: 1.05,
      minWidth: 150,
      sortable: false,
      renderCell: (cell: any) =>
        renderSplitCell(cell.row.tests || [], (test) => (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              gap: 0.35,
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <Button
              disabled={!hasResults(test)}
              variant="contained"
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                handleViewClick(test.result ?? [], test.name);
              }}
              sx={{
                minWidth: 54,
                textTransform: "none",
                fontWeight: 600,
                minHeight: 22,
                padding: "0 6px",
                fontSize: "0.78rem",
              }}
            >
              View
            </Button>
            <MainButton
              title="Print"
              variant="secondary"
              size="small"
              onClick={(event) => {
                event?.stopPropagation?.();
                setShowDialog(true);
                setSelectedTest({
                  sampleType: cell.row.specimen?.name ?? "",
                  ascension: cell.row.accession_number ?? "",
                  orderDate: getHumanReadableDateTimeLab(cell.row.order_date),
                  tests: test.name,
                  requestingTechnician: cell.row.requesting_clinician ?? "",
                  description: cell.row.comment_to_fulfiller ?? "",
                });
              }}
              sx={{
                minWidth: 56,
                minHeight: 22,
                padding: "0 6px",
                fontSize: "0.78rem",
              }}
            />
          </Box>
        )),
    },
  ];

  return (
    <>
      {groupedLabOrders.length === 0 ? (
        <Typography>No lab orders added</Typography>
      ) : (
        <BaseTable
          height="25ch"
          showTopBar={false}
          rows={groupedLabOrders}
          columns={columns}
          getRowHeight={() => "auto"}
          dataGridSx={{
            my: 0,
            border: `1px solid ${TABLE_BORDER_COLOR}`,
            borderRadius: 0,
            "& .MuiDataGrid-columnHeaders": {
              borderBottom: `1px solid ${TABLE_BORDER_COLOR}`,
              minHeight: "34px !important",
              maxHeight: "34px !important",
            },
            "& .MuiDataGrid-columnHeader": {
              borderRight: `1px solid ${TABLE_BORDER_COLOR}`,
              minHeight: "34px !important",
              maxHeight: "34px !important",
              lineHeight: "34px !important",
              py: 0,
            },
            "& .MuiDataGrid-columnSeparator": {
              display: "none",
            },
            "& .MuiDataGrid-virtualScroller": {
              marginTop: "0 !important",
            },
            "& .MuiDataGrid-cell": {
              alignItems: "stretch",
              py: 0,
              px: 0.9,
              minHeight: "unset !important",
              maxHeight: "none !important",
              borderRight: `1px solid ${TABLE_BORDER_COLOR}`,
              borderBottom: `1px solid ${TABLE_BORDER_COLOR}`,
            },
            "& .MuiDataGrid-row": {
              maxHeight: "none !important",
              minHeight: "unset !important",
            },
            "& .MuiDataGrid-columnHeaderTitleContainer, & .MuiDataGrid-cellContent": {
              py: 0,
            },
            "& .MuiDataGrid-columnHeader:last-of-type, & .MuiDataGrid-cell:last-of-type": {
              borderRight: "none",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 700,
              color: "#101828",
              fontSize: "0.88rem",
            },
          }}
        />
      )}

      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Test results for {fullResults[0].testName}</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Measure</TableCell>
                <TableCell>Result</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fullResults.map((result: any, index) => (
                <TableRow key={index}>
                  <TableCell>{result.name}</TableCell>
                  <TableCell>{result.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <GenericDialog
        maxWidth="sm"
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title={"Preview Barcode"}
      >
        <WrapperBox
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <LabBarcodeComponentPrintTemplate
            printer={printer}
            orderDate={selectedTest.orderDate}
            setTriggerFunc={handleSetTriggerFunc}
            value={selectedTest.ascension}
            test={`${selectedTest.tests}|${selectedTest.ascension}|${getTechnicianLabel(selectedTest.requestingTechnician)}`}
            fullName={`${patient?.given_name} ${patient?.family_name}`}
            gender={patient?.gender}
            description={selectedTest.description}
          >
            <></>
          </LabBarcodeComponentPrintTemplate>
          <br />
          <BasicSelect
            getValue={(value: any) => {
              setPrinter(value);
            }}
            label="Select Printer"
            options={
              !printers
                ? []
                : printers.map((d) => ({
                    value: d.ip_address,
                    label: d.name,
                  }))
            }
          />
          <br />
          <MainButton title={"Print Barcode"} onClick={handlePrint} />
        </WrapperBox>
      </GenericDialog>
    </>
  );
};
