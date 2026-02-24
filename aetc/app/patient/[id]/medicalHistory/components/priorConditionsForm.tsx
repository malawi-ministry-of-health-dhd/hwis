"use client";
import {
  FormDatePicker,
  FormikInit,
  FormValuesListener,
  MainButton,
  MainTypography,
  RadioGroupInput,
  TextInputField,
  WrapperBox,
} from "@/components";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { Field, FieldArray, getIn } from "formik";
import { useParameters } from "@/hooks";
import { getPatientsEncounters } from "@/hooks/encounter";
import { Obs } from "@/interfaces";
import LabelledCheckbox from "@/components/form/labelledCheckBox";
import OfflineICD11Selection from "@/components/form/offLineICD11Diagnosis";
import { MdOutlineClose } from "react-icons/md";

type Prop = {
  onSubmit: (values: any) => void;
  onSkip: () => void;
  onPrevious: () => void;
};

type Condition = {
  name: string;
  date: string;
  onTreatment: string;
  additionalDetails: string;
};

const conditionTemplate: Condition = {
  name: "",
  date: "",
  onTreatment: "",
  additionalDetails: "",
};

const initialValues = {
  conditions: [conditionTemplate],
  none: false,
  surgeries: "",
  previousAdmissions: "",
};

const conditionsSchema = Yup.object().shape({
  name: Yup.string().required("Condition name is required"),
  date: Yup.date()
    .nullable()
    .required("Date of diagnosis is required")
    .typeError("Invalid date format")
    .max(new Date(), "Date of diagnosis cannot be in the future"),
  onTreatment: Yup.string().required("Treatment status is required"),
  additionalDetails: Yup.string().optional(),
});

const schema = Yup.object().shape({
  none: Yup.boolean().required(),
  conditions: Yup.array().when("none", {
    is: false,
    then: (schema) =>
      schema
        .of(conditionsSchema)
        .min(1, "At least one condition must be added"),
    otherwise: (schema) => schema.notRequired(),
  }),
  surgeries: Yup.string().optional(),
  previousAdmissions: Yup.string().optional(),
});

const ErrorMessage = ({ name }: { name: string }) => (
  <Field
    name={name}
    render={({ form }: { form: any }) => {
      const error = getIn(form.errors, name);
      const touch = getIn(form.touched, name);
      return touch && error ? error : null;
    }}
  />
);

export const PriorConditionsForm = ({ onSubmit, onSkip, onPrevious }: Prop) => {
  const { params } = useParameters();
  const { data, isLoading } = getPatientsEncounters(params?.id as string);
  const [formValues, setFormValues] = useState<any>({});
  const [existingHistory, setExistingHistory] = useState<string[]>();
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading) {
      const conditionsEncounters = data?.filter(
        (item) =>
          item.encounter_type?.name === "DIAGNOSIS" && item.obs?.length !== 4
      );
      const ICD11Obs = conditionsEncounters?.[0]?.obs?.filter(
        (obsItem) => (obsItem as Obs).names[0].name === "ICD11 Diagnosis"
      );
      const uniqueObs = new Map();
      ICD11Obs?.forEach((obs) => {
        const uniqueKey = obs.value;
        if (!uniqueObs.has(uniqueKey)) uniqueObs.set(uniqueKey, obs);
      });
      setExistingHistory(Array.from(uniqueObs.keys()));
    }
  }, [data]);

  const handleSubmit = async () => {
    if (formValues.none) {
      onSubmit({ none: true });
      return;
    }
    onSubmit(formValues);
  };

  const handleICD11Selection = (selectedEntity: any, index: number) => {
    const updatedSelections = { ...selectedDiagnosis };
    updatedSelections[index] =
      selectedEntity.diagnosis + " - " + selectedEntity.code;
    setSelectedDiagnosis(updatedSelections);

    const updatedValues = { ...formValues };
    updatedValues.conditions[index].name =
      selectedEntity.code + "," + selectedEntity.diagnosis;
    setFormValues(updatedValues);
  };

  const handleClear = (index: number) => {
    const updatedSelections = { ...selectedDiagnosis };
    updatedSelections[index] = "";
    setSelectedDiagnosis(updatedSelections);
  };

  return (
    <>
      {existingHistory && existingHistory.length > 0 && (
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "5px",
            marginBottom: "20px",
          }}
        >
          <h4 style={{ color: "rgba(0, 0, 0, 0.6)", marginBottom: "10px" }}>
            Known Conditions
          </h4>
          {existingHistory?.map((condition, index) => (
            <p key={index} style={{ color: "rgba(0, 0, 0, 0.6)", margin: 0 }}>
              {condition}
            </p>
          ))}
        </div>
      )}

      <FormikInit
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={handleSubmit}
        enableReinitialize
        submitButton={false}
      >
        {({ values }) => (
          <>
            <div style={{ marginBottom: "2ch" }}>
              <LabelledCheckbox
                name="none"
                label="Patient has no prior/existing conditions"
              />
            </div>

            <FormValuesListener getValues={setFormValues} />

            <FieldArray name="conditions">
              {({ push }) => (
                <>
                  {values.conditions.map((_: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                        marginBottom: "2ch",
                      }}
                    >
                      {/* Date */}
                      <FormDatePicker
                        name={`conditions[${index}].date`}
                        disabled={formValues.none}
                        label="Date of diagnosis"
                        sx={{ background: "white", width: "100%" }}
                      />
                      <MainTypography color="red" variant="subtitle2">
                        <ErrorMessage
                          name={`conditions[${index}].date`}
                        />
                      </MainTypography>

                      {/* ICD11 Diagnosis */}
                      {selectedDiagnosis[index] ? (
                        <div
                          style={{
                            backgroundColor: "white",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px",
                            borderRadius: "5px",
                            border: "1px solid #e0e0e0",
                          }}
                        >
                          <label style={{ fontWeight: "bold" }}>
                            {selectedDiagnosis[index]}
                          </label>
                          <MdOutlineClose
                            color="red"
                            onClick={() => handleClear(index)}
                            style={{ cursor: "pointer" }}
                          />
                        </div>
                      ) : (
                        <>
                          <OfflineICD11Selection
                            label="Diagnosis"
                            initialValue=""
                            onSelection={(entity: any) =>
                              handleICD11Selection(entity, index)
                            }
                            placeholder="Start typing to search diagnoses..."
                          />
                          <MainTypography color="red" variant="subtitle2">
                            <ErrorMessage name={`conditions[${index}].name`} />
                          </MainTypography>
                        </>
                      )}

                      {/* On Treatment */}
                      <RadioGroupInput
                        disabled={formValues.none}
                        name={`conditions[${index}].onTreatment`}
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Unknown", label: "Unknown" },
                        ]}
                        label="On treatment?"
                      />
                      <MainTypography color="red" variant="subtitle2">
                        <ErrorMessage
                          name={`conditions[${index}].onTreatment`}
                        />
                      </MainTypography>

                      {/* Additional Details */}
                      <TextInputField
                        disabled={formValues.none}
                        id={`conditions[${index}].additionalDetails`}
                        name={`conditions[${index}].additionalDetails`}
                        label="Additional details"
                        sx={{ width: "100%" }}
                        multiline
                        rows={3}
                      />

                      {/* Surgeries */}
                      <TextInputField
                        disabled={formValues.none}
                        id="surgeries"
                        name="surgeries"
                        label="Surgeries"
                        placeholder="e.g., Appendectomy in 2015, Cholecystectomy in 2018..."
                        sx={{ width: "100%" }}
                        multiline
                        rows={3}
                      />

                      {/* Previous Admissions */}
                      <TextInputField
                        disabled={formValues.none}
                        id="previousAdmissions"
                        name="previousAdmissions"
                        label="Previous Admissions"
                        placeholder="e.g., Admitted in 2020 for pneumonia..."
                        sx={{ width: "100%" }}
                        multiline
                        rows={3}
                      />
                    </div>
                  ))}

                  {/* Buttons */}
                  <WrapperBox sx={{ mt: "2ch" }}>
                    <MainButton
                      variant="secondary"
                      title="Previous"
                      type="button"
                      onClick={onPrevious}
                      sx={{ flex: 1, marginRight: "8px" }}
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
            </FieldArray>
          </>
        )}
      </FormikInit>
    </>
  );
};
