// /lib/data/mockMetrics.ts
// Mock/demo layer — Engagement and conversion metrics (not real)
// Label: "Demo Performance Layer" until real connectors are live

export interface EmployeeMetrics {
  employeeId: string;
  employeeName: string;
  period: string;
  totalPosts: number;
  totalLikes: number;
  totalReplies: number;
  totalReposts: number;
  totalClicks: number;
  totalSignups: number;
  socialFG: number;      // conversions / shot attempts
  socialEFG: number;     // weighted conversions / shot attempts
  socialTS: number;      // total value / total attempts
  assistRate: number;    // assisted conversions / total conversions
  reboundRate: number;   // second-chance conversions / missed attempts
  turnoverRate: number;  // dead-end sessions / live possessions
}

export const mockMetrics: EmployeeMetrics[] = [
  {
    employeeId: "emp_001",
    employeeName: "Dan Shipper",
    period: "2026-Q2",
    totalPosts: 12,
    totalLikes: 3420,
    totalReplies: 234,
    totalReposts: 890,
    totalClicks: 1205,
    totalSignups: 89,
    socialFG: 0.142,
    socialEFG: 0.168,
    socialTS: 0.142,
    assistRate: 0.152,
    reboundRate: 0.08,
    turnoverRate: 0.03,
  },
  {
    employeeId: "emp_002",
    employeeName: "Austin Tedesco",
    period: "2026-Q2",
    totalPosts: 28,
    totalLikes: 4560,
    totalReplies: 312,
    totalReposts: 678,
    totalClicks: 2340,
    totalSignups: 156,
    socialFG: 0.112,
    socialEFG: 0.134,
    socialTS: 0.112,
    assistRate: 0.178,
    reboundRate: 0.06,
    turnoverRate: 0.04,
  },
  {
    employeeId: "emp_005",
    employeeName: "Kieran Klaassen",
    period: "2026-Q2",
    totalPosts: 18,
    totalLikes: 1890,
    totalReplies: 145,
    totalReposts: 456,
    totalClicks: 678,
    totalSignups: 34,
    socialFG: 0.095,
    socialEFG: 0.098,
    socialTS: 0.095,
    assistRate: 0.10,
    reboundRate: 0.11,
    turnoverRate: 0.02,
  },
];
