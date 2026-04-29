import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import surfaceIQ from "eslint-plugin-surface-iq";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "dist/**", "out/**", "eslint-plugin-surface-iq/**"],
  },
  {
    plugins: { "surface-iq": surfaceIQ },
    rules: { "surface-iq/enforce-nodejs-runtime": "error" },
  },
];

export default eslintConfig;
