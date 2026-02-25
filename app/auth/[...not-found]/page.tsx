import { notFound } from "next/navigation";

export default function AuthCatchAll() {
  notFound(); // This forces the neighbor not-found.tsx to render
}