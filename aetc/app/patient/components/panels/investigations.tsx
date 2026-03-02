import { MainButton, MainTypography, WrapperBox } from "@/components";
import { FaPlus } from "react-icons/fa";
import { Panel } from ".";
import {
  checkPatientIfOnWaitingAssessment,
  getActivePatientDetails,
  useNavigation,
  useParameters,
} from "@/hooks";
import { ProfilePanelSkeletonLoader } from "@/components/loadingSkeletons";
import { useState, useEffect } from "react";

import { LabRequestModal } from "../labRequest";
import { LabResultsTable } from "./labResults";

import { LabOrderTable } from "./labOrderTable";
import { LabRequest } from "@/interfaces";
import { Box, Paper, Popover } from "@mui/material";
import { TestAccordion } from "../../[id]/consultation/components/testAccordion";
import { AccordionComponent } from "@/components/accordion"; // Import AccordionComponent

import { MinimalTable } from "@/components/tables/minimalTable"; // Import MinimalTable
import * as React from "react";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Typography from "@mui/material/Typography";
import { BedsideTestForm } from "../../[id]/consultation/components";
import { LabRequestForm } from "../../[id]/consultation/components/labRequestForm";
import { Radiology } from "../../[id]/consultation/components/Radiology";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

export const Investigations = () => {
  const sections = [
    {
      id: "bedside",
      title: "Bedside",
      content: <BedsideTestForm />,
    },
    {
      id: "labForm",
      title: "Lab orders",
      content: (
        <>
          <LabRequestForm onClose={() => {}} addRequest={() => {}} />
          <LabOrderTable />
        </>
      ),
    },
    {
      id: "radiology",
      title: "Radiology (Coming Soon)",
      content: (
        <>
          <Radiology />
        </>
      ),
    },

    {
      id: "labResults",
      title: "Lab Results",
      content: <LabResultsTable rows={[]} />,
    },
  ];

  return (
    <Paper sx={{ padding: "1ch" }} elevation={0}>
      <WrapperBox sx={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontWeight: "bold", fontSize: "1.4rem" }}>
          Investigations
        </div>
        <CustomizedDialogs />
      </WrapperBox>
      <br />

      {/* Accordion with Lab Orders and Lab Results */}
      <AccordionComponent sections={sections} />

      {/* Flex container for inline tables */}
      {/* <Box display="flex" gap={2} width="100%">
        <Box flex={1}>
          <LabOrderTable />
        </Box>
        <Box flex={1}>
          <LabResultsTable rows={[]} />
        </Box>
      </Box> */}
    </Paper>
  );
};

export default function CustomizedDialogs() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const { hasActiveVisit } = getActivePatientDetails();

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <React.Fragment>
        <BootstrapDialog
          onClose={handleClose}
          aria-labelledby="customized-dialog-title"
          open={open}
          fullWidth
          maxWidth="xl"
        >
          <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
            Lab Order
          </DialogTitle>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={(theme) => ({
              position: "absolute",
              right: 8,
              top: 8,
              color: theme.palette.grey[500],
            })}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent dividers>
            <TestAccordion onClose={handleClose} />{" "}
          </DialogContent>
          <DialogActions></DialogActions>
        </BootstrapDialog>
      </React.Fragment>
    </>
  );
}
