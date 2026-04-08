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

interface DeleteEventDialogProps {
  eventId: number;
}

export default function DeleteEventDialog({ eventId }: DeleteEventDialogProps) {
  const { removeEvent } = useCalendar();

  const deleteEvent = () => {
    try {
      removeEvent(eventId);
      toast.success("Evento eliminado com sucesso.");
    } catch {
      toast.error("Erro ao eliminar evento.");
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
          Eliminar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser revertida. O evento será eliminado
            permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={deleteEvent}>Continuar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
