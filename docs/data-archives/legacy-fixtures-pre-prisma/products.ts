// /lib/data/products.ts
// Real researched seed data — Every products on Product Hunt

export interface ProductSurface {
  id: string;
  name: string;
  productHuntUrl?: string;
  makerProfileAttached: boolean;
  gmEmployeeId?: string;
  gmEmployeeName?: string;
  notes?: string;
}

export const products: ProductSurface[] = [
  {
    id: "prod_cora_001",
    name: "Cora",
    productHuntUrl: "https://producthunt.com/products/cora",
    makerProfileAttached: false,
    gmEmployeeId: "emp_003",
    gmEmployeeName: "Brandon Gell",
    notes: "AI research assistant. No maker profiles attached.",
  },
  {
    id: "prod_every_001",
    name: "Every (Newsletter)",
    productHuntUrl: "https://producthunt.com/products/every",
    makerProfileAttached: false,
    gmEmployeeId: "emp_001",
    gmEmployeeName: "Dan Shipper",
    notes: "Newsletter + community platform. No maker profiles attached.",
  },
  {
    id: "prod_agent_001",
    name: "Every Agent",
    productHuntUrl: "https://producthunt.com/products/every-agent",
    makerProfileAttached: false,
    gmEmployeeId: "emp_001",
    gmEmployeeName: "Dan Shipper",
    notes: "AI agent product. No maker profiles attached.",
  },
  {
    id: "prod_games_001",
    name: "Every Games",
    productHuntUrl: "https://producthunt.com/products/every-games",
    makerProfileAttached: false,
    gmEmployeeId: undefined,
    gmEmployeeName: undefined,
    notes: "Game-based learning. No maker profiles attached.",
  },
  {
    id: "prod_tools_001",
    name: "Every Tools",
    productHuntUrl: "https://producthunt.com/products/every-tools",
    makerProfileAttached: false,
    gmEmployeeId: undefined,
    gmEmployeeName: undefined,
    notes: "Builder tools suite. No maker profiles attached.",
  },
];
