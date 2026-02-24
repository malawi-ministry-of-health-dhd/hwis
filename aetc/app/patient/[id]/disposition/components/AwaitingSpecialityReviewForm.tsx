"use client";

import React, { useEffect, useState } from "react";
import {
    MainGrid,
    MainPaper,
    FormikInit,
    TextInputField,
    SearchComboBox,
    FormDatePicker,
} from "@/components";
import { concepts, encounters } from "@/constants";
import { useParameters } from "@/hooks";
import { fetchConceptAndCreateEncounter } from "@/hooks/encounter";
import { getPatientVisitTypes } from "@/hooks/patientReg";
import * as Yup from "yup";
import { Visit } from "@/interfaces";
import { useNavigation } from "@/hooks";
import { AccordionWithMedication } from "./AccordionWithMedication";
import { useServerTime } from "@/contexts/serverTimeContext";
import { AccordionComponent } from "@/components/accordion";

// -------------------- Constants --------------------
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

const validationSchema = Yup.object({
    specialtyDepartment: Yup.string().required(
        "Specialty Department is required"
    ),
    reasonForReview: Yup.string().required("Reason for Review is required"),
    reviewDate: Yup.date().required("Date Scheduled for Review is required"),
});

const initialValues = {
    specialtyDepartment: "",
    reasonForReview: "",
    reviewDate: "",
};

export default function AwaitingSpecialityReviewForm({ openPatientSummary }: { openPatientSummary: () => void }) {
    const { params } = useParameters();
    const { mutateAsync: submitEncounter, } = fetchConceptAndCreateEncounter();
    const [activeVisit, setActiveVisit] = useState<Visit | undefined>(undefined);
    const { data: patientVisits } = getPatientVisitTypes(params.id as string);
    const { init, ServerTime } = useServerTime();
    const { navigateTo } = useNavigation();


    useEffect(() => {
        if (patientVisits) {
            const active = patientVisits.find((visit) => !visit.date_stopped);
            if (active) {
                setActiveVisit(active as unknown as Visit);
            }
        }
    }, [patientVisits]);

    const handleSubmit = async (values: typeof initialValues) => {
        const currentDateTime = ServerTime.getServerTimeString();

        const obs = [
          {
            concept: concepts.AWAITING_SPECIALITY_REVIEW,
            value: concepts.AWAITING_SPECIALITY_REVIEW,
            obsDatetime: currentDateTime,
            groupMembers: [
              {
                concept: concepts.SPECIALITY_DEPARTMENT,
                value: values.specialtyDepartment,
                obsDatetime: currentDateTime,
              },
              {
                concept: concepts.REASON_FOR_REQUEST,
                value: values.reasonForReview,
                obsDatetime: currentDateTime,
              },
              {
                concept: concepts.DATE_OF_ABSCONDING,
                value: values.reviewDate,
                obsDatetime: currentDateTime,
              },
            ],
          },
        ];

        const payload = {
            encounterType: encounters.AWAITING_SPECIALTY,
            visit: activeVisit?.uuid,
            patient: params.id,
            encounterDatetime: currentDateTime,
            obs,
        };

        try {
            await submitEncounter(payload);
            navigateTo("/awaiting-specialty");
        } catch (error) {
            console.error("Error submitting Awaiting Speciality Review info:", error);
        }
    };

    const sections = [
        {
            id: "awaitingSpecialty",
            title: <h2>Awaiting Specialty Review</h2>,
            content: <AwaitingSpecialityReviewFormContent onSubmit={handleSubmit} />,
        },
        {
            id: "medications",
            title: <h2>Prescribe Medications</h2>,
            content: <AccordionWithMedication />,
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

// -------------------- Inner Form Component --------------------
function AwaitingSpecialityReviewFormContent({
    onSubmit,
}: {
    onSubmit: (values: typeof initialValues) => void;
}) {
    return (
        <MainPaper sx={{ p: 3 }}>
            <FormikInit
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={onSubmit}
                submitButtonText="Submit"
            >
                <MainGrid container spacing={2}>
                    <MainGrid item xs={12}>
                        <SearchComboBox
                            name="specialtyDepartment"
                            label="Specialty Department"
                            options={specialtyOptions}
                            multiple={false}
                        />
                    </MainGrid>

                    <MainGrid item xs={12}>
                        <TextInputField
                            id="reasonForReview"
                            name="reasonForReview"
                            label="Reason for Review"
                            sx={{ width: "100%" }}
                            multiline
                            rows={4}
                            placeholder="Provide reason for review"
                        />
                    </MainGrid>

                    <MainGrid item xs={12}>
                        <FormDatePicker
                            name="reviewDate"
                            label="Date Scheduled for Review"
                            sx={{ width: "100%" }}
                        />
                    </MainGrid>
                </MainGrid>
            </FormikInit>
        </MainPaper>
    );
}
