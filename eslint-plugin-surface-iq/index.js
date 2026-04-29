/** @type {import("eslint").Rule.RuleModule} */
const enforceNodejsRuntime = {
  meta: {
    type: "problem",
    docs: {
      description:
        'Files importing server-only DB code must export `runtime = "nodejs"`',
    },
    messages: {
      missing:
        'This file imports {{module}}, which uses Prisma. It must export `export const runtime = "nodejs"` to prevent Edge runtime regression.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    const isGated =
      /\/app\/api\/.*\.ts$/.test(filename) ||
      /\/app\/.*\/page\.tsx$/.test(filename) ||
      /\/app\/.*\/layout\.tsx$/.test(filename);
    if (!isGated) return {};

    const PRISMA_IMPORTS = [
      "@/lib/db",
      "@/lib/queries",
      "@/lib/acquisition/persist",
    ];

    /** @type {{ node: import("estree").ImportDeclaration; source: string }[]} */
    const importedPrismaModules = [];
    let hasNodeRuntimeExport = false;

    return {
      ImportDeclaration(node) {
        const src = String(node.source.value);
        if (
          PRISMA_IMPORTS.some((p) => src === p || src.startsWith(`${p}/`))
        ) {
          importedPrismaModules.push({ node, source: src });
        }
      },
      ExportNamedDeclaration(node) {
        if (
          node.declaration &&
          node.declaration.type === "VariableDeclaration" &&
          node.declaration.declarations.some(
            (d) =>
              d.id.type === "Identifier" &&
              d.id.name === "runtime" &&
              d.init?.type === "Literal" &&
              d.init.value === "nodejs",
          )
        ) {
          hasNodeRuntimeExport = true;
        }
      },
      "Program:exit"() {
        if (importedPrismaModules.length > 0 && !hasNodeRuntimeExport) {
          for (const { node, source } of importedPrismaModules) {
            context.report({
              node,
              messageId: "missing",
              data: { module: source },
            });
          }
        }
      },
    };
  },
};

module.exports = {
  rules: {
    "enforce-nodejs-runtime": enforceNodejsRuntime,
  },
};
