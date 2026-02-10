import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  FormHelperText,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  PersonAddOutlined as PersonAddIcon,
} from "@mui/icons-material";
import { useRegister } from "../../hooks/useRegister";
import {
  registerSchema,
  type RegisterFormData,
} from "../../schemas/auth.schema";

const RegisterForm: React.FC = () => {
  const { register: registerUser, isLoading, error } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerUser(data);
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 450,
        mx: "auto",
        p: 4,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <PersonAddIcon sx={{ color: "white", fontSize: 30 }} />
        </Box>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          Create Account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sign up to get started
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.toString()}
        </Alert>
      )}

      {/* Form */}
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Name Field */}
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Full Name"
              type="text"
              autoComplete="name"
              autoFocus
              error={!!errors.name}
              helperText={errors.name?.message}
              sx={{ mb: 2 }}
            />
          )}
        />

        {/* Email Field */}
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Email Address"
              type="email"
              autoComplete="email"
              error={!!errors.email}
              helperText={errors.email?.message}
              sx={{ mb: 2 }}
            />
          )}
        />

        {/* Password Field */}
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
          )}
        />

        {/* Confirm Password Field */}
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
          )}
        />

        {/* Terms & Conditions */}
        <Box sx={{ mb: 2 }}>
          <Controller
            name="acceptTerms"
            control={control}
            render={({ field }) => (
              <>
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I accept the{" "}
                      <Link
                        component={RouterLink}
                        to="/terms"
                        underline="hover"
                      >
                        Terms and Conditions
                      </Link>
                    </Typography>
                  }
                />
                {errors.acceptTerms && (
                  <FormHelperText error>
                    {errors.acceptTerms.message}
                  </FormHelperText>
                )}
              </>
            )}
          />
        </Box>

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isLoading}
          sx={{ mb: 2, py: 1.5 }}
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </Button>

        {/* Divider */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            my: 3,
          }}
        >
          <Box sx={{ flex: 1, height: 1, bgcolor: "divider" }} />
          <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
            OR
          </Typography>
          <Box sx={{ flex: 1, height: 1, bgcolor: "divider" }} />
        </Box>

        {/* Sign In Link */}
        <Typography variant="body2" align="center" color="text.secondary">
          Already have an account?{" "}
          <Link
            component={RouterLink}
            to="/login"
            fontWeight={600}
            underline="hover"
          >
            Sign in
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterForm;
