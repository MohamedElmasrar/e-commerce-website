import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts"] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Components must go through src/lib/api and the React Query hooks, never fetch directly.
    files: ["src/components/**/*.{ts,tsx}", "src/features/**/*.{ts,tsx}", "src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-globals": ["error", { name: "fetch", message: "Use the typed client in src/lib/api." }],
    },
  },
];

export default eslintConfig;
