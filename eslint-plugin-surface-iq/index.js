const APP_ROUTER_FILE = /(?:^|\/)app\/.*\/(?:page|layout|route)\.[jt]sx?$/;

const PRISMA_BACKED_IMPORTS = [
  "@/inngest",
  "@/lib/acquisition",
  "@/lib/db",
  "@/lib/discovery",
  "@/lib/ingestion",
  "@/lib/intent/recategorize",
  "@/lib/prisma",
  "@/lib/queries",
];

function filenameFor(context) {
  return context.filename ?? context.getFilename?.() ?? "";
}

function isAppRouterFile(filename) {
  return APP_ROUTER_FILE.test(filename.replaceAll("\\", "/"));
}

function isPrismaBackedImport(source) {
  return PRISMA_BACKED_IMPORTS.some((prefix) => source === prefix || source.startsWith(`${prefix}/`));
}

function isNodeRuntimeExport(node) {
  if (node.type !== "ExportNamedDeclaration") return false;
  const declaration = node.declaration;
  if (!declaration || declaration.type !== "VariableDeclaration") return false;

  return declaration.declarations.some((item) => {
    if (item.id.type !== "Identifier" || item.id.name !== "runtime") return false;
    return item.init?.type === "Literal" && item.init.value === "nodejs";
  });
}

const requireNodeRuntimeForPrisma = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require `export const runtime = \"nodejs\"` when App Router files import Prisma-backed modules.",
    },
    schema: [],
    messages: {
      missingRuntime:
        "App Router files importing Prisma-backed modules must export `runtime = \"nodejs\"`.",
    },
  },
  create(context) {
    const filename = filenameFor(context);
    if (!isAppRouterFile(filename)) return {};

    let importsPrismaBackedModule = false;
    let hasNodeRuntime = false;

    return {
      Program(node) {
        hasNodeRuntime = node.body.some(isNodeRuntimeExport);
      },
      ImportDeclaration(node) {
        if (typeof node.source.value === "string" && isPrismaBackedImport(node.source.value)) {
          importsPrismaBackedModule = true;
        }
      },
      "Program:exit"(node) {
        if (importsPrismaBackedModule && !hasNodeRuntime) {
          context.report({ node, messageId: "missingRuntime" });
        }
      },
    };
  },
};

const plugin = {
  rules: {
    "require-node-runtime-for-prisma": requireNodeRuntimeForPrisma,
  },
};

export default plugin;
