"use client";
import {
  MainButton,
  MainPaper,
  MainTypography,
  WrapperBox,
} from "@/components";
import { Chip, Paper, Typography } from "@mui/material";
import { getOnePatient } from "@/hooks/patientReg";
import { getActivePatientDetails, useNavigation, useParameters } from "@/hooks";
import {
  calculateAge,
  getHumanReadableDate,
  getHumanReadableShortDate,
} from "@/helpers/dateTime";
import { ProfilePanelSkeletonLoader } from "@/components/loadingSkeletons";
import PersonIcon from "@mui/icons-material/Person";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useState, MouseEvent, useEffect } from "react";
import { PatientInfoPrintDialog } from "../dialogs";
import { confirmationDialog } from "@/helpers";
import { reOpenRecentClosedVisit } from "@/hooks/visit";
import { getRoles } from "@/helpers/localstorage";
import { roles } from "@/constants";

export const PersonalDetailsCard = ({ sx }: { sx?: any }) => {
  const { params } = useParameters();
  const { navigateTo } = useNavigation();
  const { data: patient, isLoading } = getOnePatient(params.id as string);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const [openPatientSummary, setOpenPatientSummary] = useState(false);
  const { hasActiveVisit, closedVisitId, openClosedVisit } =
    getActivePatientDetails();
  const { mutateAsync } = reOpenRecentClosedVisit(params.id as string);

  const handleClose = () => {
    setAnchorEl(null);
  };

  function getNationalIdIdentifiers(data: any) {
    // Filter the data to only include objects where identifier_type.name is "National id"
    const nationalIdObjects = data.filter(
      (item: any) =>
        item.identifier_type && item.identifier_type.name === "National id",
    );

    // Extract just the identifier values from the filtered objects
    const nationalIdValues = nationalIdObjects.map(
      (item: any) => item.identifier,
    );

    return nationalIdValues[nationalIdValues.length - 1];
  }

  if (isLoading) {
    return <ProfilePanelSkeletonLoader />;
  }

  const handleCloseVisitMenu = () => {
    handleClose();
    confirmationDialog({
      title: "Visit reactivation",
      text: "Are you sure you want to reactive the most recent closed visit for this patient?",
      icon: "warning",
      confirmButtonText: "Yes",
      onConfirm: async () => {
        const response = await mutateAsync(closedVisitId as string);
        if (response) {
          openClosedVisit();
        }
      },
    });
  };

  // =========================
  // ✅ CONTACT (ONE LINE)
  // =========================
  const contactValues =
    patient?.person?.person_attributes
      ?.map((a: any) => a?.value)
      ?.filter((v: any) => typeof v === "string" && v.trim() !== "") || [];

  const contactText = contactValues.length ? contactValues.join(", ") : "-";

  return (
    <>
      <style>
        {`
          .first_letter {
              background-color: #e6e6e6;
              padding: 20px;
              margin-right: 20px;
              font-size: 24px;
              border-radius: 4px;
              color: #636363 !important;
          }
          .p_name_image {
              font-size: 24px;
              color: #00190e;
              display: flex;
              font-weight: 700;
              overflow: hidden;
          }
          .p_name {
              max-width: 210px;
              margin-left: 20px;
              height: 25px;
          }
          .p_dash_header {
              display: flex;
              justify-content: space-between;
              padding: 20px;
              border-bottom: solid #cccccc 1px;
          }
          .p_title {
              font-weight: 700;
              font-size: 24px;
              color: #00190e;
          }
              .initialsBox {
              min-width: 85px;
              height: 90px;
              left: 31px;
              top: 122px;
              align-items: center;
              border-radius: 10px;
              align-items: center;
              display: flex;
              justify-content: center;
              margin-top: 10px;
          }
          .maleColor {
              background: #5983ba;
          }
          .femaleColor {
              background: #876d9b;
          }
              .vertical-dots {
            display: flex;
            flex-direction: column;
            align-items: end;
            gap: 3px;
          }

          .dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background-color: #333;
          }
        `}
      </style>
      <Paper
        style={{
          backgroundColor: "#ffffff", // Light grey background for placeholders
          padding: "1ch",
        }}
      >
        <div style={{ width: "100%", display: "flex", justifyContent: "end" }}>
          <Button
            id="basic-button"
            aria-controls={open ? "basic-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleClick}
            size="small"
            style={{ minWidth: "30px" }}
          >
            <div className="vertical-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </Button>

          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              "aria-labelledby": "basic-button",
            }}
          >
            <MenuItem
              onClick={() => {
                handleClose();
                navigateTo(`/patient/${params.id}/view`);
              }}
              style={{ borderBottom: "1px solid #ccc", padding: "10px" }}
            >
              Update demographics
            </MenuItem>
            <MenuItem
              onClick={handleClose}
              style={{ borderBottom: "1px solid #ccc", padding: "10px" }}
            >
              Update outcome
            </MenuItem>
            <MenuItem
              onClick={handleClose}
              style={{ borderBottom: "1px solid #ccc", padding: "10px" }}
            >
              Print visit summary
            </MenuItem>
            <MenuItem
              onClick={handleClose}
              style={{ borderBottom: "1px solid #ccc", padding: "10px" }}
            >
              Print patient identifier
            </MenuItem>
            {!hasActiveVisit &&
              getRoles().some((role) =>
                [roles.ADMIN, roles.CLINICIAN].includes(role),
              ) && (
                <MenuItem
                  onClick={handleCloseVisitMenu}
                  style={{ borderBottom: "1px solid #ccc", padding: "10px" }}
                >
                  Reactivate Most Recent Visit
                </MenuItem>
              )}

            <MenuItem
              onClick={() => {
                handleClose();
                setOpenPatientSummary(true);
              }}
              style={{ borderBottom: "1px solid #ccc", padding: "10px" }}
            >
              Print patient summary
            </MenuItem>
            <MenuItem
              onClick={() => navigateTo(`/patient/${params.id}/view`)}
              sx={{ color: "blue", cursor: "pointer" }}
            >
              see more
            </MenuItem>
          </Menu>
        </div>

        <WrapperBox sx={{ display: "flex", alignItems: "center" }}>
          <WrapperBox
            sx={{
              background: "#E6E6E6",
              height: "5ch",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mr: "1ch",
              mt: "2ch",
              ml: "1ch",
            }}
          >
            <div className="p_name_image">
              <div
                className={
                  patient?.gender == "Male"
                    ? "initialsBox maleColor"
                    : "initialsBox femaleColor"
                }
              >
                <PersonIcon style={{ fontSize: "90px", color: "#fff" }} />
              </div>
            </div>
          </WrapperBox>
          <WrapperBox>
            <MainTypography variant="h5" fontWeight={"700"}>
              {patient?.given_name + " " + patient?.family_name}
            </MainTypography>
          </WrapperBox>
        </WrapperBox>
        <br />
        <div style={{ marginLeft: "1ch" }}>
          <LabelValue
            label="MRN:"
            value={getNationalIdIdentifiers(patient?.identifiers)}
          />
          <LabelValue
            label="Gender:"
            value={
              patient?.gender === "F"
                ? "Female"
                : patient?.gender === "M"
                  ? "Male"
                  : patient?.gender
            }
          />
          <LabelValue
            label="Age:"
            value={`  ${
              patient?.birthdate && calculateAge(patient?.birthdate)
            } yrs (${getHumanReadableShortDate(patient?.birthdate)})`}
          />
          <LabelValue
            label="Address:"
            value={
              patient?.addresses[0]?.address1 +
              " ," +
              patient?.addresses[0]?.address2 +
              ", " +
              patient?.addresses[0]?.city_village
            }
          />

          {/* ✅ ONLY ADDITION: Contact (one line) */}
          <LabelValue label="Contact:" value={contactText} />
        </div>
      </Paper>

      <PatientInfoPrintDialog
        onClose={() => setOpenPatientSummary(false)}
        open={openPatientSummary}
      />
    </>
  );
};

const LabelValue = ({ label, value }: { label: string; value: any }) => {
  return (
    <WrapperBox
      sx={{
        display: "flex",
        mb: "0.5ch",
        mt: "1ch",
        color: "#737373",
      }}
    >
      <div style={{ fontSize: "0.9rem", minWidth: "85px" }}>{label}</div>
      <div style={{ fontSize: "0.9rem", fontWeight: "700" }}>{value}</div>
    </WrapperBox>
  );
};
