import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import { getReminderRules } from "@/lib/services/reminder.service";
import { ReminderSettingsClient } from "@/components/settings/reminder-settings-client";
import { SettingsNav } from "@/components/settings/settings-nav";

export default async function SettingsRemindersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const rules = await getReminderRules(session.user.id);

  return (
    <>
      <SettingsNav />
      <ReminderSettingsClient initialRules={rules} />
    </>
  );
}
