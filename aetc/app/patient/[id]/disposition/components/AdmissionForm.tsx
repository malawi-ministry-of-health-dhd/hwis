"use client";

import React, { useEffect, useMemo, useState } from "react";

import * as Yup from "yup";

import { getActivePatientDetails } from "@/hooks";
import {
    MainGrid,
    FormikInit,
    TextInputField,
    SearchComboBox,
    MainButton,
} from "@/components";
import { getPatientVisitTypes } from "@/hooks/patientReg";
import { fetchConceptAndCreateEncounter, getPatientsEncounters } from "@/hooks/encounter";
import { useParameters } from "@/hooks";
import { useServerTime } from "@/contexts/serverTimeContext";
import { Visit } from "@/interfaces";
import { concepts, encounters } from "@/constants";
import { AccordionWithMedication } from "./AccordionWithMedication";
import { AccordionComponent } from "@/components/accordion";
import { toast } from "react-toastify";
import { Box, Typography } from "@mui/material";

export default function AdmissionForm({
    openPatientSummary,
}: {
    openPatientSummary: () => void;
}) {
    const { params } = useParameters();
    const { mutate: submitEncounter } = fetchConceptAndCreateEncounter();
    const { ServerTime } = useServerTime();
    const [activeVisit, setActiveVisit] = useState<Visit | undefined>(undefined);
    const { data: patientVisits } = getPatientVisitTypes(params.id as string);
    const { data: diagnosisEncounters } = getPatientsEncounters(
        params.id as string,
        activeVisit?.uuid
            ? `encounter_type=${encounters.OUTPATIENT_DIAGNOSIS}&visit=${activeVisit.uuid}`
            : undefined
    );

    const isFinalDiagnosisReady = useMemo(
        () =>
            (diagnosisEncounters ?? []).some((encounter: any) =>
                (encounter?.obs ?? []).some(
                    (ob: any) =>
                        ob?.names?.some(
                            (n: any) => n?.name === concepts.FINAL_DIAGNOSIS
                        ) && (ob?.value_text ?? ob?.value)
                )
            ),
        [diagnosisEncounters]
    );

    useEffect(() => {
        if (patientVisits) {
            const active = patientVisits.find((visit) => !visit.date_stopped);
            if (active) setActiveVisit(active as unknown as Visit);
        }
    }, [patientVisits]);

    const handleSubmit = async (values: any) => {
        const currentDateTime = ServerTime.getServerTimeString();

        const hasFinalDiagnosis = (diagnosisEncounters ?? []).some(
            (encounter: any) =>
                (encounter?.obs ?? []).some(
                    (ob: any) =>
                        ob?.names?.some(
                            (n: any) => n?.name === concepts.FINAL_DIAGNOSIS
                        ) && (ob?.value_text ?? ob?.value)
                )
        );

        if (!hasFinalDiagnosis) {
            toast.error("Final Diagnosis is required before submitting disposition.");
            return;
        }

        const obs = [
          {
            concept: concepts.ADMISSION,
            value: concepts.ADMISSION,
            obsDatetime: currentDateTime,
            groupMembers: [
              {
                concept: concepts.WARD,
                value: values.wardName,
                obsDatetime: currentDateTime,
              },
              {
                concept: concepts.BED_NUMBER,
                value: values.bedNumber,
                obsDatetime: currentDateTime,
              },
              {
                concept: concepts.REASON_FOR_ADMISSION,
                value: values.reasonForAdmission,
                obsDatetime: currentDateTime,
              },
              {
                concept: concepts.SPECIALITY_DEPARTMENT,
                value: values.specialtyInvolved,
                obsDatetime: currentDateTime,
              },
            ],
          },
        ];
        const payload = {
            encounterType: encounters.DISPOSITION,
            visit: activeVisit?.uuid,
            patient: params.id,
            encounterDatetime: currentDateTime,
            obs,
        };

        try {
            await submitEncounter(payload);

            openPatientSummary();
        } catch (error) {
            console.error("Error submitting Admission information: ", error);
        }
    };

    const sections = [
        {
            id: "medications",
            title: <h2>Prescribe Medications</h2>,
            content: <AccordionWithMedication />,
        },
        {
            id: "admission",
            title: <h2>Admission</h2>,
            content: (
                <AdmissionFormContent
                    onSubmit={handleSubmit}
                    isFinalDiagnosisReady={isFinalDiagnosisReady}
                />
            ),
        },
      
    ];

    return (
        <MainGrid container spacing={2}>
            <MainGrid item xs={12}>
                <AccordionComponent sections={sections} />
            </MainGrid>
        </MainGrid>
    );
}

const initialValues = {
    wardName: "",
    bedNumber: "",
    reasonForAdmission: "",
    specialtyInvolved: "",
};

const validationSchema = Yup.object({
    wardName: Yup.string().required("Ward Name is required"),
    reasonForAdmission: Yup.string().required("Reason for Admission is required"),
    specialtyInvolved: Yup.string().required("Specialty Involved is required"),
});

const wardOptions = [
    {
        id: concepts.ONE_A_LABOUR_WARD,
        label: "1A Labour ward",
    },
    {
        id: concepts.MAIN_LABOUR_WARD,
        label: "Main Labour ward",
    },
    // {
    //     id: concepts.FOUR_A_FEMALE_WARD,
    //     label: "4A Female ward",
    // },
    // {
    //     id: concepts.FOUR_A_HDU,
    //     label: "4A HDU",
    // },

    {
        id: concepts.ANTENATAL_WARD,
        label: "Antenatal ward",
    },
    {
        id: concepts.POST_NATAL_WARD,
        label: "Post natal ward",
    },
    {
        id: concepts.GYNAECOLOGY_WARD_MAIN,
        label: "Gynaecology ward- Main",
    },
    {
        id: concepts.THREE_B_MALE_MEDICAL,
        label: "3B Male medical",
    },
    {
        id: concepts.THREE_B_HDU,
        label: "3B High Dependency Unit",
    },
    {
        id: concepts.MSF_WARD_GYNAECOLOGY,
        label: "MSF ward - Gynaecology",
    },
    {
        id: concepts.THREE_C_COMBINED_MALE_AND_FEMALE_MEDICAL,
        label: "3C Combined male and female medical",
    },
    {
        id: concepts.SIX_A_ORTHOPAEDIC_MALE,
        label: "6A Orthopaedic male",
    },

    {
        id: concepts.TWO_A_ONCOLOGY_WARD_GENERAL_WARD_HIGH_DEPENDENCY_UNIT,
        label: "2A Oncology Ward (General ward/High Dependency Unit)",
    },
    {
        id: concepts.TWO_B_RENAL_AND_DERMATOLOGY_WARD,
        label: "2B Renal and Dermatology Ward",
    },
    {
        id: concepts.SIX_A_FEMALE_ORTHOPAEDIC_WARD,
        label: "6A Female Orthopaedic Ward",
    },
    {
        id: concepts.FOUR_A_FEMALE_MEDICAL_WARD_GENERAL_WARD_HIGH_DEPENDENCY_UNIT,
        label: "4A Female Medical Ward (General ward/High Dependency Unit)",
    },
    {
        id: concepts.GYNECOLOGY_WARD_GENERAL_WARD_HIGH_DEPENDENCY_UNIT,
        label: "Gynecology Ward (General ward/High Dependency Unit)",
    },
    {
        id: concepts.LABOUR_WARD_GENERAL_WARD_HIGH_DEPENDENCY_UNIT,
        label: "Labour Ward (General ward/High Dependency Unit)",
    },
    {
        id: concepts.THREE_B_FEMALE_MEDICAL_WARD_GENERAL_WARD_HIGH_DEPENDENCY_UNIT,
        label: "3B Female Medical Ward (General ward/High Dependency Unit)",
    },
    { id: concepts.THREE_A_TB_WARD, label: "3A TB Ward" },
    {
        id: concepts.THREE_A_HDRU_HIGH_DEPENDENCY_RESPIRATORY_UNIT,
        label: "3A HDRU (High Dependency Respiratory Unit)",
    },
    {
        id: concepts.FIVE_A_MALE_SURGICAL_WARD_GENERAL_WARD_HIGH_DEPENDENCY_UNIT,
        label: "5A Male Surgical Ward (General ward/High Dependency Unit)",
    },
    {
        id: concepts.FIVE_B_FEMALE_SURGICAL_WARD_GENERAL_WARD_HIGH_DEPENDENCY_UNIT,
        label: "5B Female Surgical Ward (General ward/High Dependency Unit)",
    },
    { id: concepts.FIVE_B_ORTHOPAEDIC_WARD, label: "5B Orthopaedic Ward" },
    {
        id: concepts.FIVE_B_NEUROSURGICAL_WARD_GENERAL_WARD_HIGH_DEPENDENCY_UNIT,
        label: "5B Neurosurgical Ward (General ward/High Dependency Unit)",
    },
    { id: concepts.INTENSIVE_CARE_UNIT_ICU, label: "Intensive Care Unit (ICU)" },
    { id: concepts.THEATRE, label: "Theatre" },
    { id: concepts.ENT, label: "ENT" },
    { id: concepts.OPHTHALMOLOGY, label: "Ophthalmology" },
];

const specialtyOptions = [
    { id: concepts.MEDICINE, label: "Medicine" },
    { id: concepts.GENERAL_SURGERY, label: "General Surgery" },
    { id: concepts.ORTHOPEDICS, label: "Orthopedics" },
    { id: concepts.NEUROSURGERY, label: "Neurosurgery" },
    {
        id: concepts.EAR_NOSE_AND_THROAT_ENT,
        label: "Ear, Nose, and Throat (ENT)",
    },
    {
        id: concepts.DENTAL_AND_MAXILLOFACIAL_SURGERY,
        label: "Dental and Maxillofacial Surgery",
    },
    { id: concepts.OPHTHALMOLOGY, label: "Ophthalmology" },
    { id: concepts.PSYCHIATRY, label: "Psychiatry" },
    {
        id: concepts.GYNAECOLOGY_AND_OBSTETRICS,
        label: "Gynecology and Obstetrics",
    },
    { id: concepts.CRITICAL_CARE, label: "Critical Care" },
    { id: concepts.ONCOLOGY, label: "Oncology" },
];

function AdmissionFormContent({
    onSubmit,
    isFinalDiagnosisReady,
}: {
    onSubmit: (values: typeof initialValues) => void;
    isFinalDiagnosisReady: boolean;
}) {
    const { gender } = getActivePatientDetails();
    const [filteredWardOptions, setFilteredWardOptions] = useState(wardOptions);

    useEffect(() => {
        const femaleOnlyLabels = [
            "6A Female Orthopaedic Ward",
            "4A Female Medical Ward (General ward/High Dependency Unit)",
            "Gynecology Ward (General ward/High Dependency Unit)",
            "Labour Ward (General ward/High Dependency Unit)",
            "3B Female Medical Ward (General ward/High Dependency Unit)",
            "5B Female Surgical Ward (General ward/High Dependency Unit)",
        ];

        if (gender === "Male") {
            setFilteredWardOptions(
                wardOptions.filter((ward) => !femaleOnlyLabels.includes(ward.label))
            );
        } else {
            setFilteredWardOptions(wardOptions);
        }
    }, [gender]);

    return (
        <FormikInit
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
            submitButton={isFinalDiagnosisReady}
        >
            <>
                {!isFinalDiagnosisReady && (
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: "#fff3cd", border: "1px solid #ffeeba", borderRadius: "4px" }}>
                        <Typography variant="body2" color="text.primary">
                            Final Diagnosis is required before submitting disposition.
                        </Typography>
                    </Box>
                )}
                <MainGrid container spacing={2}>
                <MainGrid item xs={12} lg={6}>
                    <SearchComboBox
                        name="wardName"
                        label="Ward Name"
                        options={filteredWardOptions}
                        multiple={false}
                        disabled={!isFinalDiagnosisReady}
                    />
                </MainGrid>

                <MainGrid item xs={12} lg={6}>
                    <TextInputField
                        id="bedNumber"
                        name="bedNumber"
                        label="Bed Number"
                        placeholder="Enter Bed Number"
                        sx={{ width: "100%" }}
                        disabled={!isFinalDiagnosisReady}
                    />
                </MainGrid>

                <MainGrid item xs={12}>
                    <TextInputField
                        id="reasonForAdmission"
                        name="reasonForAdmission"
                        label="Reason for Admission"
                        placeholder="Provide reason for admission"
                        rows={4}
                        multiline
                        sx={{ width: "100%" }}
                        disabled={!isFinalDiagnosisReady}
                    />
                </MainGrid>

                <MainGrid item xs={12}>
                    <SearchComboBox
                        name="specialtyInvolved"
                        label="Specialty Involved"
                        options={specialtyOptions}
                        multiple={false}
                        disabled={!isFinalDiagnosisReady}
                    />
                </MainGrid>
                </MainGrid>

                {!isFinalDiagnosisReady && (
                    <MainButton
                        sx={{ mt: 3 }}
                        title="Submit"
                        type="submit"
                        disabled
                        onClick={() => {}}
                    />
                )}
            </>
        </FormikInit>
    );
}
