// /lib/data/plays.ts
// Real researched seed data — Recommended plays (coaching cards)

export interface Play {
  id: string;
  title: string;
  description: string;
  targetSurfaces: string[];
  targetEmployeeIds: string[];
  impact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
  steps: string[];
  expectedOutcome: string;
  attributionConfidence: "direct" | "estimated" | "modeled" | "hypothesis";
}

export const plays: Play[] = [
  {
    id: "play_001",
    title: "Claim Product Hunt Maker Profiles",
    description: "Attach verified makers to all 5 Every product pages on Product Hunt.",
    targetSurfaces: ["product_hunt"],
    targetEmployeeIds: ["emp_001", "emp_002", "emp_003", "emp_005"],
    impact: "high",
    effort: "low",
    steps: [
      "Verify Dan Shipper as primary maker on all 5 products",
      "Attach Brandon Gell as maker on Cora",
      "Attach Kieran Klaassen as technical maker on Cora",
      "Attach Austin Tedesco as growth maker on Every Agent",
      "Update product descriptions with maker attribution",
    ],
    expectedOutcome: "+15% attribution accuracy on Product Hunt traffic. Immediate credibility boost.",
    attributionConfidence: "direct",
  },
  {
    id: "play_002",
    title: "Operationalize Austin's Substack",
    description: "Cross-promote Austin's discovered Substack with Every's main newsletter.",
    targetSurfaces: ["substack", "newsletter"],
    targetEmployeeIds: ["emp_002"],
    impact: "high",
    effort: "low",
    steps: [
      "Add Austin's Substack to Every newsletter footer",
      "Create 'Growth Experiments' column in Every newsletter",
      "Repurpose top Austin posts as Every content",
      "Set up Substack recommendation exchange",
    ],
    expectedOutcome: "Compounding subscriber growth. Austin's voice becomes a regular Every asset.",
    attributionConfidence: "direct",
  },
  {
    id: "play_003",
    title: "GitHub Org Activation",
    description: "Make Every's GitHub org visible and credible to builder audiences.",
    targetSurfaces: ["github"],
    targetEmployeeIds: ["emp_005", "emp_014", "emp_016"],
    impact: "high",
    effort: "medium",
    steps: [
      "Pin 3 flagship repos to Every GitHub org",
      "Add team section with public-facing engineers",
      "Write comprehensive README with Every branding",
      "Enable discussions on key repos",
      "Cross-link from personal sites and X bios",
    ],
    expectedOutcome: "Builder trust signal. Kieran's visible GitHub becomes a team asset, not an outlier.",
    attributionConfidence: "estimated",
  },
  {
    id: "play_004",
    title: "Laura Needs Twitter",
    description: "A writer without Twitter is a shooter without a court. Fix the highest-priority absent surface.",
    targetSurfaces: ["x"],
    targetEmployeeIds: ["emp_010"],
    impact: "high",
    effort: "low",
    steps: [
      "Create Laura Entis X profile",
      "Pin a thread of her best Every articles",
      "Set up auto-post from new article publishes",
      "Engage with 5 relevant threads per week",
    ],
    expectedOutcome: "Writer gets a court. Article distribution increases 3-5x.",
    attributionConfidence: "direct",
  },
  {
    id: "play_005",
    title: "Mike's O'Reilly Authority Play",
    description: "Use Mike's O'Reilly book as a trust anchor across Every surfaces.",
    targetSurfaces: ["personal_site", "linkedin", "product_hunt"],
    targetEmployeeIds: ["emp_013"],
    impact: "high",
    effort: "low",
    steps: [
      "Create personal site combining book + consulting",
      "Add 'O'Reilly Author' badge to Every team page",
      "Reference book in Cora enterprise landing page",
      "Link book from Product Hunt maker profile",
    ],
    expectedOutcome: "Enterprise trust signal. Book authority becomes company authority.",
    attributionConfidence: "direct",
  },
  {
    id: "play_006",
    title: "Natalia's LinkedIn Lead Engine",
    description: "Natalia is already generating consulting leads in LinkedIn comments. Systematize it.",
    targetSurfaces: ["linkedin", "substack"],
    targetEmployeeIds: ["emp_008"],
    impact: "high",
    effort: "medium",
    steps: [
      "Document Natalia's comment-to-lead workflow",
      "Create LinkedIn content calendar for enterprise insights",
      "Launch 'Enterprise AI' Substack newsletter",
      "Set up Calendly link in LinkedIn featured section",
    ],
    expectedOutcome: "Predictable enterprise lead generation. LinkedIn comments become a funnel.",
    attributionConfidence: "direct",
  },
  {
    id: "play_007",
    title: "Lucas Design Authority Expansion",
    description: "Lucas has an external interview. Build a design authority surface stack around it.",
    targetSurfaces: ["instagram", "dribbble", "personal_site"],
    targetEmployeeIds: ["emp_012"],
    impact: "medium",
    effort: "low",
    steps: [
      "Create Instagram design portfolio",
      "Set up Dribbble profile with Every work",
      "Build personal site around external interview",
      "Cross-link all design surfaces",
    ],
    expectedOutcome: "Design authority becomes a recruiting and customer trust signal.",
    attributionConfidence: "estimated",
  },
  {
    id: "play_008",
    title: "Anthony Visibility Decision",
    description: "Anthony is invisible on all surfaces. Decide if this is intentional or a gap.",
    targetSurfaces: ["github", "linkedin"],
    targetEmployeeIds: ["emp_016"],
    impact: "medium",
    effort: "low",
    steps: [
      "Have 1:1 with Anthony about public presence preference",
      "If yes: create GitHub profile, basic LinkedIn",
      "If no: document decision in employee notes",
      "Either way: ensure his work is attributed via teammates",
    ],
    expectedOutcome: "Clarity. Either Anthony becomes visible or the team covers for him intentionally.",
    attributionConfidence: "direct",
  },
];
