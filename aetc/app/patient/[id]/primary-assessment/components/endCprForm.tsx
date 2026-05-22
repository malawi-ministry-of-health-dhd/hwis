import {
  FormikInit,
  TextInputField,
  FormFieldContainerMultiple,
  RadioGroupInput,
  FieldsContainer,
  FormTimePicker,
  SearchComboBox,
} from "@/components";
import { concepts, NO, YES } from "@/constants";
import { getInitialValues } from "@/helpers";
import { getAllUsers } from "@/hooks/users";
import { Button, Typography } from "@mui/material";
import * as Yup from "yup";

const form = {
  reasonsCprStopped: {
    name: concepts.REASON_CPR_STOPPED,
    label: "Reason CPR Stopped",
  },
  otherReason: {
    name: concepts.OTHER,
    label: "Other Reason",
  },
  dispositionAfterCpr: {
    name: concepts.DISPOSITION_AFTER_CPR,
    label: "Disposition After CPR",
  },
  outcome: {
    name: concepts.OUTCOME,
    label: "Outcome",
  },
  spo: {
    name: concepts.SPO2,
    label: "SPO2",
  },
  oxygen: {
    name: concepts.OXYGEN_GIVEN,
    label: "Oxygen",
  },
  respiratoryRate: {
    name: concepts.RESPIRATORY_RATE,
    label: "Respiratory Rate",
  },
  systolic: {
    name: concepts.SYSTOLIC_BLOOD_PRESSURE,
    label: "Systolic",
  },
  diastolic: {
    name: concepts.DIASTOLIC_BLOOD_PRESSURE,
    label: "Diastolic",
  },
  // gcs: {
  //   name: concepts.GCS,
  //   label: "Glasgow Coma Scale",
  // },
  pulseRate: {
    name: concepts.PULSE_RATE,
    label: "Pulse Rate",
  },
  temperature: {
    name: concepts.TEMPERATURE,
    label: "Temperature",
  },
  motorResponse: {
    name: concepts.MOTOR_RESPONSE,
    label: "Motor Response",
  },
  eyeOpeningResponse: {
    name: concepts.EYE_OPENING_RESPONSE,
    label: "Eye Opening Response",
  },
  verbalResponse: {
    name: concepts.VERBAL_RESPONSE,
    label: "Verbal Response",
  },
  teamLeader: {
    name: concepts.TEAM_LEADER,
    label: "Team Leader",
  },
  teamMembers: {
    name: concepts.TEAM_MEMBERS,
    label: "Team Members",
  },

  cause: {
    name: concepts.CAUSE,
    label: "Likely or known cause of cardiac arrest",
  },
  timeStopped: {
    name: concepts.CPR_TIME_STOPPED,
    label: "CPR Time Stopped",
  },
  specify: {
    name: concepts.SPECIFY,
    label: "Specify Disposition",
  },
};

const endCPRValidationSchema = Yup.object().shape({
  [form.reasonsCprStopped.name]: Yup.string()
    .required()
    .label(form.reasonsCprStopped.label),
  [form.specify.name]: Yup.string().label(form.specify.label),
  [form.otherReason.name]: Yup.string()
    .when(form.reasonsCprStopped.name, {
      is: (value: any) => value === concepts.OTHER,
      then: (schema) => schema.required().label(form.otherReason.label),
    })
    .label(form.otherReason.label),
  [form.dispositionAfterCpr.name]: Yup.string()
    .required()
    .label(form.dispositionAfterCpr.label),
  [form.spo.name]: Yup.number().min(0).max(100).label(form.spo.label),
  [form.oxygen.name]: Yup.string().label(form.oxygen.label),
  [form.outcome.name]: Yup.string().label(form.outcome.label),
  [form.respiratoryRate.name]: Yup.number()
    .min(0)
    .max(90)
    .label(form.respiratoryRate.label),
  [form.systolic.name]: Yup.number().min(0).max(300).label(form.systolic.label),
  [form.diastolic.name]: Yup.number()
    .min(0)
    .max(300)
    .label(form.diastolic.label),
  // [form.gcs.name]: Yup.string().required().label(form.gcs.label),
  [form.temperature.name]: Yup.number()
    .min(20)
    .max(45)
    .label(form.temperature.label),
  [form.pulseRate.name]: Yup.number()
    .min(0)
    .max(220)
    .label(form.pulseRate.label),
  [form.eyeOpeningResponse.name]: Yup.string().label(
    form.eyeOpeningResponse.label
  ),
  [form.motorResponse.name]: Yup.string().label(form.motorResponse.label),
  [form.verbalResponse.name]: Yup.string().label(form.verbalResponse.label),
  [form.teamLeader.name]: Yup.string().required().label(form.teamLeader.label),
  [form.teamMembers.name]: Yup.array().required().label(form.teamMembers.label),
  [form.cause.name]: Yup.string().required().label(form.cause.label),
  [form.timeStopped.name]: Yup.string()
    .required()
    .label(form.timeStopped.label),
});

const circulationList = [
  { id: "Intake fluids", label: "Intake fluids" },
  { id: "Hemorrhage control", label: "Hemorrhage control" },
  { id: "Blood sample", label: "Blood sample" },
  { id: "Catheter", label: "Catheter" },
  { id: "Transfusion", label: "Transfusion" },
  { id: "NG Insertion", label: "NG Insertion" },
  { id: "Suturing", label: "Suturing" },
  { id: "Keep warm", label: "Keep warm" },
];

const reasonsCprStopped = [
  { label: "ROSC", id: concepts.ROSC },
  { label: "Team decision to stop", id: concepts.TEAM_DECISION_TO_STOP },
  { label: "DNA CPR document found", id: concepts.DNA_CPR_DOCUMENT_FOUND },
  { label: "Other", id: concepts.OTHER },
];

const dispositionAfterCpr = [
  { label: "Resuscitation room", id: concepts.RESUSCITATION_ROOM },
  { label: "ICU", id: concepts.ICU },
  { label: "HDU Specify", id: concepts.HDU_SPECIFY },
  { label: "General Ward Specify", id: concepts.GENERAL_WARD_SPECIFY },
  { label: "Mortuary", id: concepts.MORTUARY },
];

const radioOptions = [
  { label: "Yes", value: YES },
  { label: "No", value: NO },
];

const eyeOpeningResponses = [
  { label: "Spontaneous", value: "Spontaneous", weight: 4 },
  { label: "To Speech", value: "To Speech", weight: 3 },
  { label: "To Pain", value: "To Pain", weight: 2 },
  { label: "No Response", value: "No Response", weight: 1 },
];
const motorResponses = [
  { label: "Obeying Commands", value: "Obeying Commands", weight: 6 },
  { label: "Localising", value: "Localising", weight: 5 },
  { label: "Withdraw", value: "Withdraw", weight: 4 },
  { label: "Normal Flexion", value: "Normal Flexion", weight: 3 },
  { label: "Extension", value: "Extension", weight: 2 },
  { label: "None", value: "None", weight: 1 },
];
const verbalResponses = [
  { label: "Oriented", value: "Oriented", weight: 5 },
  { label: "Confused", value: "Confused", weight: 4 },
  { label: "Inappropriate Words", value: "Inappropriate Words", weight: 3 },
  {
    label: "Incomprehensible sounds",
    value: "Incomprehensible sounds",
    weight: 2,
  },
  { label: "None", value: "None", weight: 1 },
];

const outcomes = [
  { label: "Death", id: concepts.DEATH },
  { label: "ROSC", id: concepts.ROSC },
];

export const EndCPRForm = ({
  onSubmit,
  formRef,
  triggerValidate,
}: {
  onSubmit: (values: any) => void;
  formRef: any;
  triggerValidate: () => void;
}) => {
  const { data: users, isLoading } = getAllUsers();
  const userOptions = users?.map((user) => {
    return {
      label:
        user.person.names[0].family_name +
        " " +
        user.person.names[0].given_name,
      id: user.uuid,
    };
  });

  const getWeight = (value: string, lists: any) => {
    const found = lists.find((l: any) => l.value == value);
    return found ? found.weight : 0;
  };
  return (
    <FormikInit
      initialValues={getInitialValues(form)}
      validationSchema={endCPRValidationSchema}
      onSubmit={onSubmit}
      submitButton={false}
      ref={formRef}
    >
      {({ values }) => (
        <>
          <TextInputField
            name={form.cause.name}
            label={form.cause.label}
            id={form.cause.name}
            multiline
            rows={4}
            sx={{ width: "100%" }}
          />

          <FormTimePicker
            name={form.timeStopped.name}
            label={form.timeStopped.label}
          />
          <br />
          <SearchComboBox
            name={form.reasonsCprStopped.name}
            label={form.reasonsCprStopped.label}
            options={reasonsCprStopped}
            multiple={false}
          />
          <br />
          {values[form.reasonsCprStopped.name] == concepts.OTHER && (
            <TextInputField
              multiline
              rows={5}
              name={form.otherReason.name}
              label={form.otherReason.label}
              sx={{ width: "100%" }}
              id={form.otherReason.name}
            />
          )}
          <br />

          {values[form.reasonsCprStopped.name] === concepts.ROSC && (
            <>
              <Typography variant="h6">Vital signs after ROSC</Typography>
              <br />

              <FormFieldContainerMultiple>
                <TextInputField
                  name={form.spo.name}
                  label={form.spo.label}
                  id={form.spo.name}
                  sx={{ width: "100%" }}
                  unitOfMeasure="%"
                />

                <RadioGroupInput
                  name={form.oxygen.name}
                  label={form.oxygen.label}
                  options={radioOptions}
                  row
                />

                <TextInputField
                  name={form.systolic.name}
                  label={form.systolic.label}
                  id={form.systolic.name}
                  sx={{ width: "100%" }}
                  unitOfMeasure="mmHg"
                />
                <TextInputField
                  name={form.diastolic.name}
                  label={form.diastolic.label}
                  id={form.diastolic.name}
                  sx={{ width: "100%" }}
                  unitOfMeasure="mmHg"
                />
              </FormFieldContainerMultiple>
              <FormFieldContainerMultiple>
                <TextInputField
                  name={form.respiratoryRate.name}
                  label={form.respiratoryRate.label}
                  id={form.respiratoryRate.name}
                  sx={{ width: "100%" }}
                  unitOfMeasure="BPM"
                />
                <TextInputField
                  name={form.pulseRate.name}
                  label={form.pulseRate.label}
                  id={form.pulseRate.name}
                  sx={{ width: "100%" }}
                  unitOfMeasure="BPM"
                />
                <TextInputField
                  name={form.temperature.name}
                  label={form.temperature.label}
                  id={form.temperature.name}
                  sx={{ width: "100%" }}
                  unitOfMeasure="°C"
                />
              </FormFieldContainerMultiple>
              <br />
            </>
          )}

          <FieldsContainer sx={{ alignItems: "start" }}>
            <RadioGroupInput
              name={form.motorResponse.name}
              label={form.motorResponse.label}
              options={motorResponses}
              row={false}
            />
            <RadioGroupInput
              name={form.verbalResponse.name}
              label={form.verbalResponse.label}
              options={verbalResponses}
              row={false}
            />
            <RadioGroupInput
              name={form.eyeOpeningResponse.name}
              label={form.eyeOpeningResponse.label}
              options={eyeOpeningResponses}
              row={false}
            />
          </FieldsContainer>
          <Typography fontWeight={"800"} variant="body2">
            (M
            {getWeight(values[form.motorResponse.name], motorResponses)} V
            {getWeight(values[form.verbalResponse.name], verbalResponses)} E
            {getWeight(
              values[form.eyeOpeningResponse.name],
              eyeOpeningResponses
            )}
            ){" "}
            {getWeight(values[form.motorResponse.name], motorResponses) +
              getWeight(values[form.verbalResponse.name], verbalResponses) +
              getWeight(
                values[form.eyeOpeningResponse.name],
                eyeOpeningResponses
              )}
            /15
          </Typography>
          <br />

          <SearchComboBox
            name={form.outcome.name}
            label={form.outcome.label}
            options={outcomes}
            multiple={false}
          />
          <br />
          <FormFieldContainerMultiple>
            <SearchComboBox
              name={form.dispositionAfterCpr.name}
              label={form.dispositionAfterCpr.label}
              options={dispositionAfterCpr.filter((disposition) => {
                if (values[form.outcome.name] == concepts.DEATH) {
                  return disposition.id == concepts.MORTUARY;
                }
                if (values[form.outcome.name] == concepts.ROSC) {
                  return disposition.id != concepts.MORTUARY;
                }
              })}
              multiple={false}
            />
          </FormFieldContainerMultiple>
          {[
            concepts.HDU_SPECIFY,
            concepts.GENERAL_WARD_SPECIFY,
            concepts.MORTUARY,
          ].includes(values[form.dispositionAfterCpr.name]) && (
            <>
              <br />
              <TextInputField
                name={form.specify.name}
                label={form.specify.label}
                id={form.specify.name}
                sx={{ width: "100%" }}
              />
            </>
          )}
          <br />
          <Typography variant="h6">Resuscitation Team</Typography>
          <br />
          <SearchComboBox
            name={form.teamLeader.name}
            label={form.teamLeader.label}
            options={userOptions ?? []}
            multiple={false}
          />
          <br />
          <SearchComboBox
            name={form.teamMembers.name}
            label={form.teamMembers.label}
            options={userOptions ?? []}
          />
          <br />
          <Button onClick={triggerValidate} variant="contained" fullWidth>
            Finish CPR
          </Button>
        </>
      )}
    </FormikInit>
  );
};
