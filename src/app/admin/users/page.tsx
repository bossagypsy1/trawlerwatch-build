import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import UsersAdmin from "./UsersAdmin";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return <UsersAdmin />;
}
