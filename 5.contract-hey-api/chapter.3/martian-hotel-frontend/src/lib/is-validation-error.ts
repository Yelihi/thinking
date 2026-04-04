import { type ValidationError } from "@/api";

export const isValidationError = (err: unknown): err is ValidationError => {
  return (
    err !== null &&
    typeof err === "object" &&
    "errors" in err &&
    err.errors !== null &&
    typeof err.errors === "object"
  );
};
