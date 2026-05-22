import { SVGPopover } from "./svgPopover";
import { Box } from "@mui/material";

import { DataBox, RushForm } from "./forms";
import { useImageFormTransform } from "@/hooks";

import { useEffect } from "react";

import { useImageUpdate } from "@/hooks/useImageUpdate";

import { RadiologyAdult } from "@/assets/radiologyAdult";
interface Props {
  onValueChange: (values: any) => void;
}

export function RadiologyAdultImage({ onValueChange }: Props) {
  const {
    handleClose,
    handleFormSubmit,
    containerRef,
    section,
    anchorEl,
    selectedSection,
    ids,
  } = useImageUpdate();
  const { setData, submittedValues } = useImageFormTransform();
  useEffect(() => {
    onValueChange(ids);
  }, [ids]);

  const handleDataSubmission = (
    section: string,
    formData: any,
    formConceptsLabels: Array<{ concept: string; label: string }>
  ) => {
    setData({ section, formData, formConceptsLabels });
    handleFormSubmit(formData);
  };

  return (
    <div>
      <RadiologyAdult ref={containerRef} />
      <Box sx={{ display: "flex", flexWrap: "wrap" }}>
        {submittedValues.map((value) => (
          <DataBox key={value.section} labelValue={value} />
        ))}
      </Box>
      <SVGPopover
        section={section}
        selectedSection={selectedSection}
        anchorEl={anchorEl}
        handleClose={handleClose}
      >
        <></>
        {/* <RushForm
          onCancel={handleClose}
          onSubmit={(values, formConceptsLabels) =>
            handleDataSubmission(
              selectedSection.label as string,
              values,
              formConceptsLabels
            )
          }
        /> */}
      </SVGPopover>
    </div>
  );
}
