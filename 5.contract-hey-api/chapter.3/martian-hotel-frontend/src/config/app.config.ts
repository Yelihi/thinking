import { z } from "zod";

const AppConfigSchema = z.object({
  backendUrl: z.string().min(1),
  enableMocks: z
    .string()
    .transform((value) => value === "true")
    .pipe(z.boolean()),
  envMode: z.enum(["development", "production", "test"]),
});

export type ApplicationConfig = z.infer<typeof AppConfigSchema>;

const getEnv = (key: string, fallback = ""): string => {
  return import.meta.env[key] || fallback;
};

export const getAppConfig = (): ApplicationConfig => {
  try {
    return AppConfigSchema.parse({
      backendUrl: getEnv("VITE_BACKEND_URL"),
      enableMocks: getEnv("VITE_API_MOCKS", "false"),
      envMode: getEnv("MODE", "development"),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => {
          const path = issue.path.join(".") || "<root>";

          return `${path}: ${issue.message}`;
        })
        .join("; ");

      throw new Error(
        `Invalid application configuration from environment variables: ${issues}`,
      );
    }

    throw error;
  }
};
