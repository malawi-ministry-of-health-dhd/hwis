"use client";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { FC, useEffect } from "react";
import { useFormikField } from "./hooks";
import { Box, InputLabel, SxProps } from "@mui/material";
import { MainTypography } from "..";

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
  onBlur?: (values: any) => void;
  format?: string;
};

export const FormDatePicker: FC<Prop> = ({
  name,
  label,
  width = "25ch",
  sx,
  size = "medium",
  getValue,
  disabled = false,
  onBlur,
  format = "YYYY-MM-DD",
}) => {
  const { value, setFieldValue, initialValues, errorMessage } =
    useFormikField(name);

  useEffect(() => {
    getValue && getValue(value);
  }, [value]);

  let initialDate: string | number | Date | dayjs.Dayjs | null | undefined =
    undefined;

  if (typeof initialValues == "object" && initialValues !== null) {
    //@ts-ignore
    initialDate = initialValues[name] as
      | string
      | number
      | Date
      | dayjs.Dayjs
      | null
      | undefined;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: "flex", flexDirection: "column", width }}>
        <InputLabel
          sx={{ mb: "1ch", fontSize: "0.76rem", color: "text.secondary" }}
        >
          {label}
        </InputLabel>
        <DatePicker
          sx={{
            backgroundColor: "white",
            "& fieldset": { borderRadius: "5px" },
            ...sx,
          }}
          format={format}
          value={
            value
              ? dayjs(value as string | number | Date | dayjs.Dayjs | null | undefined)
              : initialDate
                ? dayjs(initialDate)
                : null
          }
          label="" // Keep label empty to avoid internal label rendering
          onChange={(dateValue: any) =>
            setFieldValue(name, dayjs(dateValue).format("YYYY-MM-DD"))
          }
          disabled={disabled}
          onClose={() => {
            onBlur?.(value);
          }}
          slotProps={{
            textField: {
              onBlur: (values) => {
                onBlur?.(value); // Call your onBlur prop
              },
            },
          }}
        />
        <MainTypography color={"red"} variant="subtitle2">
          {errorMessage}
        </MainTypography>
      </Box>
    </LocalizationProvider>
  );
};
