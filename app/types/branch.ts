import { Member } from "./member";

export interface Branch {
  id: number;
  name: string;
  location: string;
  status: string;
  members: Member[];
}