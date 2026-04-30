// /lib/data/company.ts
// Real researched seed data — Company entity for Every

export interface Company {
  id: string;
  name: string;
  description: string;
  totalEmployees: number;
  publicFacingEmployees: number;
  verifiedCompanySurfaces: number;
  productHuntPages: number;
  makerProfilesAttached: number;
  surfaceIQAverage: number;
}

export const company: Company = {
  id: "comp_every_001",
  name: "Every",
  description: "AI-powered tools for builders and founders",
  totalEmployees: 25,
  publicFacingEmployees: 16,
  verifiedCompanySurfaces: 7,
  productHuntPages: 5,
  makerProfilesAttached: 0,
  surfaceIQAverage: 62.4,
};
