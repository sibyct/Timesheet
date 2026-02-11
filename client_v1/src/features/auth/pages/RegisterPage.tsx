import React from "react";
import { Box, Paper, Container } from "@mui/material";
import { RegisterForm } from "../components/RegisterForm";

const RegisterPage: React.FC = () => {
  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <RegisterForm />
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;
