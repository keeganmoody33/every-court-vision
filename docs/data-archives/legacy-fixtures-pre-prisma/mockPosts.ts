// /lib/data/mockPosts.ts
// Mock/demo layer — Post-level engagement data (not real)
// Label: "Demo Performance Layer" until real connectors are live

export interface MockPost {
  id: string;
  employeeId: string;
  employeeName: string;
  surface: string;
  contentType: "promo" | "philosophy" | "personal" | "assist" | "setup";
  intentClass: "shot_attempt" | "pass" | "rebound" | "turnover" | "assist";
  text: string;
  likes: number;
  replies: number;
  reposts: number;
  clicks: number;
  signups: number;
  timestamp: string;
}

export const mockPosts: MockPost[] = [
  // Austin Tedesco — high-efficiency examples
  {
    id: "post_001",
    employeeId: "emp_002",
    employeeName: "Austin Tedesco",
    surface: "x",
    contentType: "promo",
    intentClass: "shot_attempt",
    text: "We just shipped a new feature in Cora that cuts research time by 60%. Here's how it works...",
    likes: 245,
    replies: 32,
    reposts: 89,
    clicks: 412,
    signups: 28,
    timestamp: "2026-04-20T10:00:00Z",
  },
  {
    id: "post_002",
    employeeId: "emp_002",
    employeeName: "Austin Tedesco",
    surface: "x",
    contentType: "personal",
    intentClass: "pass",
    text: "The best growth experiments are the ones that teach you something even when they fail.",
    likes: 567,
    replies: 45,
    reposts: 123,
    clicks: 0,
    signups: 0,
    timestamp: "2026-04-18T14:30:00Z",
  },
  // Dan Shipper — founder narrative
  {
    id: "post_003",
    employeeId: "emp_001",
    employeeName: "Dan Shipper",
    surface: "substack",
    contentType: "philosophy",
    intentClass: "shot_attempt",
    text: "Why I believe AI tools should feel like extensions of your mind, not replacements for it.",
    likes: 1205,
    replies: 89,
    reposts: 456,
    clicks: 890,
    signups: 67,
    timestamp: "2026-04-15T09:00:00Z",
  },
  // Kieran Klaassen — conviction tweet
  {
    id: "post_004",
    employeeId: "emp_005",
    employeeName: "Kieran Klaassen",
    surface: "x",
    contentType: "philosophy",
    intentClass: "shot_attempt",
    text: "The problem with most AI research tools is they give you answers. Cora gives you better questions.",
    likes: 315,
    replies: 28,
    reposts: 89,
    clicks: 234,
    signups: 12,
    timestamp: "2026-04-19T11:00:00Z",
  },
  // Naveen Naidu — cultural post
  {
    id: "post_005",
    employeeId: "emp_007",
    employeeName: "Naveen Naidu",
    surface: "x",
    contentType: "personal",
    intentClass: "pass",
    text: "Dia and Granola are the real product managers at Every. They just don't know it yet.",
    likes: 82,
    replies: 12,
    reposts: 8,
    clicks: 0,
    signups: 0,
    timestamp: "2026-04-17T16:00:00Z",
  },
  // Natalia Quintero — LinkedIn close
  {
    id: "post_006",
    employeeId: "emp_008",
    employeeName: "Natalia Quintero",
    surface: "linkedin",
    contentType: "promo",
    intentClass: "shot_attempt",
    text: "Three enterprise teams switched to Cora last month. Here's what they told us about their research workflow...",
    likes: 189,
    replies: 34,
    reposts: 45,
    clicks: 312,
    signups: 8,
    timestamp: "2026-04-21T08:00:00Z",
  },
];
