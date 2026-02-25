"use client";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

import { FC, useEffect } from "react";
import { useFormikField } from "./hooks";
import { SxProps } from "@mui/material";

type Prop = {
  name: string;
  label: string;
  width?: any;
  sx?: SxProps;
  placeholder?: string;
  rows?: number;
  getValue?: (value: any) => void;
  size?: "small" | "medium";
  showHelperText?: boolean;
  disabled?: boolean;
};

export const FormTimePicker: FC<Prop> = ({
  name,
  label,
  width = "100%",
  sx,
  getValue,
  disabled = false,
}) => {
  const { value, setFieldValue, initialValues } = useFormikField(name);

  useEffect(() => {
    getValue && getValue(value);
  }, [value]);

  let initialTime: string | number | Date | dayjs.Dayjs | null | undefined =
    undefined;

  if (typeof initialValues == "object" && initialValues !== null) {
    //@ts-ignore
    initialTime = initialValues[name] as
      | string
      | number
      | Date
      | dayjs.Dayjs
      | null
      | undefined;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <TimePicker
        timeSteps={{ hours: 1, minutes: 1, seconds: 1 }}
        sx={{
          width,
          my: "1ch",
          mr: "1ch",
          "& fieldset": { borderRadius: "10px" },
          ...sx,
        }}
        label={label}
        value={
          value
            ? dayjs(
                value as string | number | Date | dayjs.Dayjs | null | undefined,
                "HH:mm:ss"
              )
            : initialTime
              ? dayjs(initialTime, "HH:mm:ss")
              : null
        }
        onChange={(dateValue: any) => {
          //   console.log(dayjs(dateValue).format("HH:mm:ss"));
          setFieldValue(name, dayjs(dateValue).format("HH:mm:ss"));
        }}
        disabled={disabled}
      />
    </LocalizationProvider>
  );
};
