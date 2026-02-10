import React from "react";
import { Box, Paper, Container } from "@mui/material";
import { RegisterForm } from "../components/RegisterForm";

const RegisterPage: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
