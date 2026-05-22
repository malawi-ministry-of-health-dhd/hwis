"use client";

import { BedsideTestForm } from "./bedsideTestForm";
import { LabRequestForm } from "./labRequestForm";
import { LabOrderTable } from "@/app/patient/components/panels/labOrderTable";
import { AccordionComponent } from "@/components/accordion";
import { Radiology } from "./Radiology";

export function TestAccordion({ onClose }: { onClose?: () => void }) {
  const sections = [
    {
      id: "bedside",
      title: "Bedside",
      content: (
        <BedsideTestForm
          onClose={() => {
            onClose?.();
          }}
        />
      ),
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
      title: "Radiology",
      content: (
        <>
          <Radiology />
        </>
      ),
    },
  ];

  return <AccordionComponent sections={sections} />;
}
