"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { useTranslations } from "@/i18n/use-translations";
import type { IEvent } from "@/shared/calendar/types";

interface IProps {
  event: IEvent;
}

export default function NotificationConfigDialog({ event }: IProps) {
  const { updateEvent } = useCalendar();
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);

  const [recipients, setRecipients] = useState<string>(
	(event.emailTemplate?.recipients ?? []).join(", ") || "",
  );
  const [content, setContent] = useState<string>(event.emailTemplate?.content ?? "");

  const handleSave = async () => {
	// Prepare email template values and only call updateEvent if something changed.
	const recipientsArray = recipients
	  .split(",")
	  .map((s) => s.trim())
	  .filter(Boolean);

	const existingRecipients = event.emailTemplate?.recipients ?? [];
	const existingContent = event.emailTemplate?.content ?? "";

	const recipientsEqual =
	  existingRecipients.length === recipientsArray.length &&
	  existingRecipients.every((r, i) => r === recipientsArray[i]);

	const contentEqual = (existingContent ?? "") === (content ?? "").trim();

	const emailTemplateChanged = !recipientsEqual || !contentEqual;

	if (emailTemplateChanged) {
	  const nextEmailTemplate =
		recipientsArray.length > 0 && content.trim().length > 0
		  ? {
			  recipients: recipientsArray,
			  content: content.trim(),
			}
		  : null;

	  await updateEvent({
		...event,
		emailTemplate: nextEmailTemplate,
	  });
	}

	setOpen(false);
  };

  return (
	<Dialog open={open} onOpenChange={setOpen}>
	  <DialogTrigger asChild>
		<Button variant="outline">{t("calendar.dialogs.notificationConfig.trigger")}</Button>
	  </DialogTrigger>
	  <DialogContent>
		<DialogHeader>
		  <DialogTitle>{t("calendar.dialogs.notificationConfig.title")}</DialogTitle>
		</DialogHeader>

		<div className="space-y-4 p-2">
		  <div>
			<label className="text-sm font-medium">{t("calendar.dialogs.notificationConfig.recipients")}</label>
			<Input value={recipients} onChange={(e) => setRecipients(e.target.value)} />
		  </div>

		  <div>
			<label className="text-sm font-medium">{t("calendar.dialogs.notificationConfig.content")}</label>
			<Textarea value={content} onChange={(e) => setContent(e.target.value)} />
		  </div>

		  <div className="flex justify-end gap-2">
			<Button variant="outline" onClick={() => setOpen(false)}>
			  {t("common.actions.cancel")}
			</Button>
			<Button onClick={handleSave}>{t("common.actions.save")}</Button>
		  </div>
		</div>
	  </DialogContent>
	</Dialog>
  );
}


