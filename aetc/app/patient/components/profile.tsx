"use client";
import { MainGrid } from "@/components";
import { PersonalDetailsCard } from ".";

import React from "react";
import { VitalsPanel } from "./panels/vitalsDetails";

import { TabsContainer } from "./tabsContainer";

import { ListVisitDates } from "./listVisitDates";
import { VisitDatesProvider } from "@/contexts/visitDatesContext";
import { Box, Typography } from "@mui/material";
import { getActivePatientDetails } from "@/hooks";
import { getHumanReadableDateTime } from "@/helpers/dateTime";

export const DesktopView = () => {
  const { hasActiveVisit, recentVisitCloseDateTime, isSuccess } =
    getActivePatientDetails();
  const shouldShowNoActiveVisitBanner = isSuccess && hasActiveVisit === false;

  return (
    <VisitDatesProvider>
      {shouldShowNoActiveVisitBanner && (
        <Box
          sx={{
            width: "100%",
            backgroundColor: "#FF2400",
            textAlign: "center",
            color: "white",
            padding: "10px",
          }}
        >
          <Typography>
            This patient doesnt have an active visit.{" "}
            {recentVisitCloseDateTime
              ? `The most recent visit was closed on ${getHumanReadableDateTime(recentVisitCloseDateTime)}`
              : null}{" "}
          </Typography>
        </Box>
      )}
      <MainGrid
        container
        style={{
          justifyContent: "center",
          marginTop: "15px",
          gap: "15px",
          margin: "5px",
          width: "unset",
        }}
      >
        <MainGrid item lg={2.2} sm={12}>
          <PersonalDetailsCard />
          <br />
          <ListVisitDates />
        </MainGrid>
        <MainGrid item lg={8.5} sm={12} style={{ minWidth: "300px" }}>
          <VitalsPanel />
          <TabsContainer />
        </MainGrid>
      </MainGrid>
    </VisitDatesProvider>
  );
};
