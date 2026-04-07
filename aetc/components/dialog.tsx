'use client'
import * as React from "react";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import { FormikInit, MainButton } from "@/components";

export interface SimpleDialogProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title: string;
    maxWidth?: "md" | "sm" | "lg";
    sx?: any
}

export function GenericDialog({ onClose, open, children, title, maxWidth = "lg", sx }: SimpleDialogProps) {
    const handleClose = (
        event: {},
        _reason: "backdropClick" | "escapeKeyDown",
    ) => {
        (event as React.SyntheticEvent)?.stopPropagation?.();
        onClose()
    };


    return (
        <Dialog
            maxWidth={maxWidth}
            fullWidth={true}
            onClose={handleClose}
            onClick={(event) => event.stopPropagation()}
            open={open}
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent
                onClick={(event) => event.stopPropagation()}
                sx={{ ...sx, overflow: "visible" }}
            >
                {children}
            </DialogContent>
        </Dialog>
    );
}
