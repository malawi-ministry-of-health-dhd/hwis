"use client";
import { FormikInit, FormValuesListener, MainButton, TextInputField, WrapperBox } from "@/components";
import React, { useState } from "react";
import * as yup from "yup";
import LabelledCheckbox from "@/components/form/labelledCheckBox";

type Prop = {
  onSubmit: (values: any) => void;
  onSkip: () => void;
  onPrevious: () => void;
};

const initialValues = {
  medications: "",
  none: false
};

export const schema = yup.object().shape({
  none: yup.boolean().required(),
  medications: yup.string().when("none", {
    is: false,
    then: (schema) => schema.required("Please provide medication details"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

export const MedicationsForm = ({ onSubmit, onSkip, onPrevious }: Prop) => {
  const [formValues, setFormValues] = useState<any>({});

  const handleSubmit = async () => {
    if (formValues.none) {
      onSubmit({ none: true });
      return;
    }
    onSubmit(formValues);
  };

  return (
    <>
      <FormikInit
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={handleSubmit}
        enableReinitialize
        submitButton={false}
      >
        {({ values }) => (
          <>
            <FormValuesListener getValues={setFormValues} />

            <WrapperBox
              sx={{
                bgcolor: "white",
                padding: "2ch",
                mb: "2ch",
                width: "100%",
                borderRadius: "5px",
              }}
            >
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                  borderBottom: "2px solid #ccc",
                  paddingBottom: "0.5rem",
                }}
              >
                Current Medications
              </h3>

              <div style={{ marginBottom: "2ch" }}>
                <LabelledCheckbox
                  name="none"
                  label="Patient was not prescribed any medication"
                />
              </div>

              {!formValues.none && (
                <TextInputField
                  id="medications"
                  name="medications"
                  label="Medication Details"
                  placeholder="e.g., Paracetamol 500mg twice daily for 7 days, last taken yesterday..."
                  multiline
                  rows={6}
                  sx={{ width: "100%", mt: "1rem" }}
                  disabled={formValues.none}
                />
              )}
            </WrapperBox>

            <WrapperBox sx={{ mt: '2ch' }}>
              <MainButton
                variant="secondary"
                title="Previous"
                type="button"
                onClick={onPrevious}
                sx={{ flex: 1, marginRight: '8px' }}
              />
              <MainButton
                onClick={() => { }}
                variant="primary"
                title="Next"
                type="submit"
                sx={{ flex: 1 }}
              />
            </WrapperBox>
          </>
        )}
      </FormikInit>
    </>
  );
};
