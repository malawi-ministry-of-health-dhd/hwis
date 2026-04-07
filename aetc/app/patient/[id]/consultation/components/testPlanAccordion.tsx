"use client";

import { BedsideTestPlanForm } from "./bedsideTestPlanForm";
import { LabRequestPlanForm } from "./labRequestPlanForm";
import { LabOrderPlanTable } from "@/app/patient/components/panels/labOrderPlanTable";
import { AccordionComponent } from "@/components/accordion";
import { Radiology } from "./Radiology";

export function TestPlanAccordion() {
  const sections = [
    {
      id: "bedside",
      title: "Bedside plan",
      content: <BedsideTestPlanForm />,
    },
    {
      id: "labForm",
      title: "Lab order plan",
      content: (
        <>
          <LabRequestPlanForm onClose={() => {}} addRequest={() => {}} />
          <LabOrderPlanTable />
        </>
      ),
    },
    {
      id: "radiology",
      title: "Radiology",
      content: (
        <>
          <Radiology />
        </>
      ),
    },
  ];

  return (
    <>
      <h3 style={{ marginBottom: "20px" }}>Investigation Plan</h3>
      <AccordionComponent sections={sections} />{" "}
    </>
  );
}
