import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import surfaceIq from "eslint-plugin-surface-iq";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    plugins: {
      "surface-iq": surfaceIq,
    },
    rules: {
      "surface-iq/require-node-runtime-for-prisma": "error",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "dist/**", "out/**", "KIMI 2.678/**"],
  },
];

export default eslintConfig;
