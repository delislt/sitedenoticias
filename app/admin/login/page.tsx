import { redirect } from "next/navigation";
export default function LoginPage() {
  redirect("/conta?next=/admin");
}
