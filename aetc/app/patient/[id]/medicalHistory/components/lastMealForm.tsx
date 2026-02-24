import { FormDatePicker, FormFieldContainer, MainButton, MainTypography, TextInputField, WrapperBox } from "@/components";
import { useEffect, useState } from "react";
import { FormValuesListener, FormikInit } from "@/components";
import * as yup from "yup";
import { concepts } from "@/constants";
import LabelledCheckbox from "@/components/form/labelledCheckBox";
import { Field, getIn } from "formik";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";


type Prop = {
  onSubmit: (values: any) => void;
  onSkip: () => void;
  onPrevious: () => void;
};

export const lastMealFormConfig = {
  lastMeal: {
    name: "dateOfMeal",
    label: "When did the patient eat last?"
  },
  description: {
    name: "descriptionOfLastMeal",
    label: "What did the patient eat?",
  }
}

const schema = yup.object().shape({
  didNotEat: yup.boolean().required(),
  [lastMealFormConfig.lastMeal.name]: yup
    .string()
    .when("didNotEat", {
      is: false,
      then: (schema) => schema.required('Please select a time of last meal'),
      otherwise: (schema) => schema.notRequired(),
    }),
  [lastMealFormConfig.description.name]: yup.string().when("didNotEat", {
    is: false,
    then: (schema) => schema.required("Please provide a description of the last meal"),
    otherwise: (schema) => schema.notRequired(),
  }),
});
const initialValues = {
  [lastMealFormConfig.lastMeal.name]: undefined,
  [lastMealFormConfig.description.name]: "",
  didNotEat: false,
};

export const LastMealForm = ({ onSubmit, onSkip, onPrevious }: Prop) => {
  const [formValues, setFormValues] = useState<any>({});

  const handleSubmit = async () => {
    if (formValues.didNotEat) {
      onSubmit({ didNotEat: true });
      return;
    }

    onSubmit(formValues);
  };

  return (
    <>
      <FormikInit
        validationSchema={schema}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        enableReinitialize={true}
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
                Last Meal
              </h3>

              <div style={{ marginBottom: "2ch" }}>
                <LabelledCheckbox
                  name="didNotEat"
                  label="Patient did not eat"
                />
              </div>

              {!formValues.didNotEat && (
                <FormFieldContainer direction="column">
                  <div style={{ marginRight: "2ch" }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <Field name={lastMealFormConfig.lastMeal.name}>
                        {({ form }: { form: any }) => {
                          const error = getIn(form.errors, lastMealFormConfig.lastMeal.name);
                          return (
                            <>
                              <DateTimePicker
                                disableFuture
                                label={lastMealFormConfig.lastMeal.label}
                                onChange={(newValue: any) => {
                                  form.setFieldValue(lastMealFormConfig.lastMeal.name, newValue?.$d.toLocaleString());
                                }}
                                sx={{
                                  width: "300px",
                                  mt: "1.8ch",
                                  backgroundColor: "white",
                                  borderRadius: "5px",
                                  border: error ? "1px solid red" : "1px solid #ccc",
                                }}
                                disabled={formValues.didNotEat}
                              />
                              {error && (
                                <MainTypography color="red" variant="subtitle2" width={"300px"}>
                                  {error}
                                </MainTypography>
                              )}
                            </>
                          );
                        }}
                      </Field>
                    </LocalizationProvider>
                  </div>

                  <TextInputField
                    id={lastMealFormConfig.description.name}
                    label={lastMealFormConfig.description.label}
                    name={lastMealFormConfig.description.name}
                    placeholder="e.g., rice and beans"
                    multiline
                    rows={4}
                    sx={{ width: "100%", mt: "2ch" }}
                    disabled={formValues.didNotEat}
                  />
                </FormFieldContainer>
              )}
            </WrapperBox>

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
                title="Submit"
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

export default LastMealForm;
