"use client";
import React from "react";
import ProfileEditForm from "@/app/_components/ProfileEditForm";
import { Container, Box } from "@mui/material";

const StudentProfilePage = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <ProfileEditForm />
      </Box>
    </Container>
  );
};

export default StudentProfilePage;
