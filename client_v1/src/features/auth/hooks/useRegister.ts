import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/core/store/hooks";
import { authApi } from "../api/auth.api";
import { loginFailure, setLoading } from "../store/auth.slice";
// import { storageService } from "@/services/storage/localStorage.service";
// import { STORAGE_KEYS } from "@/shared/constants/storage.constants";
import type { RegisterData } from "../types/auth.types";

export const useRegister = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onMutate: () => {
      dispatch(setLoading(true));
    },
    onSuccess: () => {
      navigate("/login");
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Registration failed. Please try again.";
      console.error("Registration Error:", errorMessage);

      dispatch(loginFailure(errorMessage));
    },
  });

  return {
    register: mutation.mutate,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
};
