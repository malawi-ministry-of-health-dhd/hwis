import React, { useState, useContext, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Menu,
  MenuItem,
  ButtonGroup,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { FaPlus } from "react-icons/fa6";
import {
  checkPatientIfOnWaitingAssessment,
  getActivePatientDetails,
  useNavigation,
} from "@/hooks";
import { ConsultationContext, ConsultationContextType } from "@/contexts";
import { CPRDialogForm } from "@/app/patient/[id]/primary-assessment/components";
import { getPatientsEncounters } from "@/hooks/encounter";
import { encounters } from "@/constants";

// Define types for menu items
interface MenuItemConfig {
  label: string;
  path: string;
  id?: number;
}

interface CollapsibleMenuSection {
  label: string;
  items: Array<MenuItemConfig | ConsultationItemConfig>;
}

interface ConsultationItemConfig {
  id: number;
  title: string;
  label: string;
}

interface FlowStarterProps {
  patient: any;
}

const FlowStarter: React.FC<FlowStarterProps> = ({ patient }) => {
  const [cprDialog, setCprDialog] = useState(false);
  const { gender } = getActivePatientDetails();
  const { patientId, hasActiveVisit } = getActivePatientDetails();
  const { data: patientHistory, isLoading: historyLoading } =
    getPatientsEncounters(patientId as string);
  const { navigateTo } = useNavigation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { isOnList } = checkPatientIfOnWaitingAssessment(patient?.id);
  const { setActiveStep } = useContext(
    ConsultationContext,
  ) as ConsultationContextType;

  // State for collapsible menu sections
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    templateForms: false,
    consultation: false,
  });
  const [recentDiagnosis, setRecentDiagnosis] = useState<string>("");

  const getEncountersByType = (encounterTypeUuid: any) => {
    const encounter: any = patientHistory?.find(
      (d: any) => d?.encounter_type?.uuid === encounterTypeUuid,
    );
    if (!encounter) return [];
    const latestObsMap = new Map();
    const obs = encounter.obs || [];
    // Find the most recent observation for each concept_id
    obs.forEach((observation: any) => {
      const { concept_id, obs_datetime } = observation;
      const currentLatest = latestObsMap.get(concept_id);

      if (
        !currentLatest ||
        new Date(obs_datetime) > new Date(currentLatest.obs_datetime)
      ) {
        latestObsMap.set(concept_id, observation);
      }
    });
    const data = Array.from(latestObsMap.values());
    setRecentDiagnosis(data[0]?.value);
  };

  useEffect(() => {
    if (!historyLoading && patientHistory) {
      getEncountersByType(encounters.OUTPATIENT_DIAGNOSIS);
    }
  }, [historyLoading, patientHistory]);

  // Handle button click to open menu
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle menu close
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Navigate to the specified path
  const startFlow = (path: string) => {
    handleClose();
    navigateTo(path);
  };

  // Set active step and navigate for consultation items
  const handleConsultationItem = (item: ConsultationItemConfig) => {
    setActiveStep(item.id);
    startFlow(`/patient/${patient.id}/consultation`);
  };

  // Toggle section open/closed state
  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Define template forms menu items
  const templateFormsItems: MenuItemConfig[] = [
    {
      label: "Medical Inpatient Admission Sheet",
      path: `/patient/${patient.id}/medicalInpatient`,
    },
    {
      label: "Surgical Notes",
      path: `/patient/${patient.id}/surgicalNotes`,
    },
    ...(gender === "Female" || gender === "F"
      ? [
          {
            label: "Gynaecology Ward Admission",
            path: `/patient/${patient.id}/gyneacology`,
          },
        ]
      : []),
  ];

  // Define main menu items
  const mainMenuItems: MenuItemConfig[] = [
    {
      label: "Monitoring Chart",
      path: `/patient/${patient.id}/nursingChart`,
    },
    {
      label: "Nursing Care Notes (SOAPIER)",
      path: `/patient/${patient.id}/soap`,
    },
    {
      label: "Primary Survey",
      path: `/patient/${patient.id}/primary-assessment`,
    },
    {
      label: "SAMPLE History",
      path: `/patient/${patient.id}/medicalHistory`,
    },
    {
      label: "Secondary Survey",
      path: `/patient/${patient.id}/secondary-assessment`,
    },
    {
      label: "Differential Diagnosis",
      path: `/patient/${patient.id}/differential-diagnosis`,
    },
    {
      label: "Investigations Plan",
      path: `/patient/${patient.id}/investigations`,
    },
    {
      label: "Final Diagnosis",
      path: `/patient/${patient.id}/final-diagnosis`,
    },
    {
      label: "Patient Management Plan",
      path: `/patient/${patient.id}/patient-management-plan`,
    },
    {
      label: "Continuation Sheet",
      path: `/patient/${patient.id}/continuationSheet`,
    },
    { label: "Disposition", path: `/patient/${patient.id}/disposition` },
  ];

  return (
    <Box>
      <style>
        {`
          .listItemButton {
            gap: 10px !important;
            line-height: 1 !important;
            border-bottom: 1px solid #ccc !important;
          } 
          .nestedMenuItem {
            padding-left: 32px !important;
          }
        `}
      </style>

      <Button
        sx={{
          backgroundColor: "#FECDCA",
          color: "#B42318",
          borderRadius: "9999px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "14px",
          marginRight: "10px",
          textTransform: "none",
          maxWidth: 300, // You can adjust this
          justifyContent: "flex-start",
          paddingRight: "20px",
          "&:hover": {
            backgroundColor: "#FFA6A0",
          },
        }}
      >
        <Typography component="span" fontWeight="bold" mr={0.5} noWrap>
          Final Diagnosis:
        </Typography>
        <Box
          component="span"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "inline-block",
            maxWidth: "calc(100% - 130px)", // Adjust based on label length
            verticalAlign: "bottom",
          }}
          title={recentDiagnosis} // Show full text on hover
        >
          {recentDiagnosis}
        </Box>
      </Button>

      <Button
        disabled={!hasActiveVisit}
        variant="outlined"
        onClick={() => setCprDialog(true)}
        sx={{
          backgroundColor: "rgb(221, 238, 221)",
          color: "rgb(0, 70, 0)",
          borderRadius: "9999px",
          border: "1px solid currentColor",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "14px",
          marginRight: "10px",
          flexGrow: 1,
          textTransform: "none",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "calc(100% - 40px)", // Ensure text doesn't overlap with dropdown
          "&:hover": {
            backgroundColor: "rgb(197, 231, 197)",
          },
        }}
      >
        Start CPR
      </Button>
      {/* Assessment Button Group */}
      <ButtonGroup
        variant="contained"
        disabled={!hasActiveVisit}
        sx={{
          borderRadius: "9999px",
          overflow: "hidden",
          minWidth: "130px",
          "& .MuiButtonGroup-grouped:not(:last-of-type)": {
            borderRight: 0,
          },
        }}
      >
        <Button
          sx={{
            backgroundColor: "#006401",
            color: "white",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "14px",
            flexGrow: 1,
            textTransform: "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "calc(100% - 40px)", // Ensure text doesn't overlap with dropdown
            "&:hover": {
              backgroundColor: "#004d00",
            },
          }}
        >
          Start Assessment
        </Button>
        <Button
          onClick={handleClick}
          sx={{
            backgroundColor: "#008000",
            color: "white",
            borderLeft: "1px solid #135a14",
            fontSize: "14px",
            padding: "0px",
            minWidth: "unset",
            width: "40px", // Fixed width for dropdown button
            "&:hover": {
              backgroundColor: "#006b00",
            },
          }}
        >
          <Typography sx={{ fontSize: "18px" }}>▾</Typography>
        </Button>
      </ButtonGroup>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            borderRadius: "10px",
            marginTop: "105px",
          },
        }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <List
          sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
        >
          {/* Main menu items */}
          {mainMenuItems.map((item, index) => (
            <ListItemButton
              key={index}
              onClick={() => startFlow(item.path)}
              className="listItemButton"
            >
              <FaPlus />
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}

          {/* Template Forms collapsible section */}
          <ListItemButton
            onClick={() => toggleSection("templateForms")}
            className="listItemButton"
          >
            <FaPlus />
            <ListItemText primary="Template Forms" />
            {openSections.templateForms ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse
            in={openSections.templateForms}
            timeout="auto"
            unmountOnExit
          >
            <List component="div" disablePadding>
              {templateFormsItems.map((item, index) => (
                <ListItemButton
                  key={`template-${index}`}
                  onClick={() => startFlow(item.path)}
                  className="listItemButton nestedMenuItem"
                >
                  <FaPlus />
                  <ListItemText primary={item.label} />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </List>
      </Menu>
      <CPRDialogForm
        open={cprDialog}
        onClose={() => {
          setCprDialog(false);
        }}
      />
    </Box>
  );
};

export default FlowStarter;
