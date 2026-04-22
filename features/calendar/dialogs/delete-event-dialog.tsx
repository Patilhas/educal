import { TrashIcon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { useTranslations } from "@/i18n/use-translations";

interface DeleteEventDialogProps {
  eventId: number;
}

export default function DeleteEventDialog({ eventId }: DeleteEventDialogProps) {
  const { removeEvent } = useCalendar();
  const { t } = useTranslations();

  const deleteEvent = async () => {
    try {
      await removeEvent(eventId);
      toast.success(t("calendar.messages.deleteSuccess"));
    } catch {
      toast.error(t("calendar.messages.deleteError"));
    }
  };

  if (!eventId) {
    return null;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <TrashIcon />
          {t("common.actions.delete")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("calendar.dialogs.deleteEvent.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("calendar.dialogs.deleteEvent.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.actions.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={deleteEvent}>{t("common.actions.delete")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
