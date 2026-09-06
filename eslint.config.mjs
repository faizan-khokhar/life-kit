import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["features/notes/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/budget", "@/features/budget/**"],
              message:
                "Notes must not import Budget. Share only via components/ui or lib/*.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["features/budget/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/notes", "@/features/notes/**"],
              message:
                "Budget must not import Notes. Share only via components/ui or lib/*.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
