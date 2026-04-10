import { Member } from "./member";

export interface Branch {
  id: number;
  name: string;
  location: string | null;
  status: string;
  members?: Member[];
}

export type BranchSparklineData = {
  branchId: string;
  branchName: string;
  sparkline: number[];
  total: number;
};