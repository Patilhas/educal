"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CalendarOff, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/responsive-modal";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import {
  createHolidayRequest,
  deleteHolidayRequest,
  updateHolidayRequest,
} from "@/features/calendar/client-requests";
import { getAcademicYearLabel } from "@/shared/calendar/academic-year";
import type { IHolidayPeriod } from "@/shared/calendar/types";
import { useTranslations } from "@/i18n/use-translations";

const holidayFormSchema = z
  .object({
    label: z.string().min(1, "A etiqueta é obrigatória"),
    startDate: z.string().min(1, "A data de início é obrigatória"),
    endDate: z.string().min(1, "A data de fim é obrigatória"),
  })
  .refine((v) => new Date(v.endDate) > new Date(v.startDate), {
    message: "A data de fim deve ser posterior à data de início",
    path: ["endDate"],
  });

type THolidayFormData = z.infer<typeof holidayFormSchema>;

interface HolidaysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const toInputDate = (isoString: string) => {
  if (!isoString) return "";
  return new Date(isoString).toISOString().slice(0, 10);
};

export default function HolidaysDialog({ open, onOpenChange }: HolidaysDialogProps) {
  const { t } = useTranslations();
  const { academicYearStart, holidays, canEditEvents, addHoliday, replaceHoliday, removeHoliday } = useCalendar();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const form = useForm<THolidayFormData>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: { label: "", startDate: "", endDate: "" },
  });

  const academicYearLabel = getAcademicYearLabel(academicYearStart);

  const openAddForm = () => {
    form.reset({ label: "", startDate: "", endDate: "" });
    setEditingId(null);
    setIsFormVisible(true);
  };

  const openEditForm = (holiday: IHolidayPeriod) => {
    form.reset({
      label: holiday.label,
      startDate: toInputDate(holiday.startDate),
      endDate: toInputDate(holiday.endDate),
    });
    setEditingId(holiday.id);
    setIsFormVisible(true);
  };

  const closeForm = () => {
    setIsFormVisible(false);
    setEditingId(null);
    form.reset();
  };

  const handleSave = async (values: THolidayFormData) => {
    setIsSaving(true);
    try {
      if (editingId) {
        const updated = await updateHolidayRequest(academicYearStart, editingId, values);
        replaceHoliday(updated);
        toast.success(t("calendar.academicYearTools.holidays.updateSuccess"));
      } else {
        const created = await createHolidayRequest(academicYearStart, values);
        addHoliday(created);
        toast.success(t("calendar.academicYearTools.holidays.createSuccess"));
      }
      closeForm();
    } catch {
      toast.error(
        editingId
          ? t("calendar.academicYearTools.holidays.updateError")
          : t("calendar.academicYearTools.holidays.createError"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (holiday: IHolidayPeriod) => {
    setDeletingId(holiday.id);
    try {
      await deleteHolidayRequest(academicYearStart, holiday.id);
      removeHoliday(holiday.id);
      if (editingId === holiday.id) closeForm();
      toast.success(t("calendar.academicYearTools.holidays.deleteSuccess"));
    } catch {
      toast.error(t("calendar.academicYearTools.holidays.deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-lg">
        <ModalHeader className="shrink-0">
          <ModalTitle className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5" />
            {t("calendar.academicYearTools.holidays.title", { label: academicYearLabel })}
          </ModalTitle>
          <ModalDescription>
            {holidays.length > 0
              ? t("calendar.academicYearTools.holidays.count", { count: holidays.length })
              : t("calendar.academicYearTools.holidays.empty")}
          </ModalDescription>
        </ModalHeader>

        <div className="flex-1 overflow-y-auto">
          {holidays.length > 0 && (
            <ul className="space-y-2 pb-2">
              {holidays.map((holiday) => (
                <li
                  key={holiday.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{holiday.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(holiday.startDate).toLocaleDateString("pt-PT")}
                      {" – "}
                      {new Date(holiday.endDate).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                  {canEditEvents && (
                    <div className="ml-2 flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditForm(holiday)}
                        disabled={deletingId === holiday.id}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(holiday)}
                        disabled={deletingId === holiday.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {isFormVisible && (
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">
                  {editingId
                    ? t("calendar.academicYearTools.holidays.edit")
                    : t("calendar.academicYearTools.holidays.add")}
                </p>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={closeForm}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSave)} className="space-y-3">
                  <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("calendar.academicYearTools.holidays.label")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("calendar.academicYearTools.holidays.labelPlaceholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("calendar.academicYearTools.holidays.startDate")}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("calendar.academicYearTools.holidays.endDate")}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={closeForm}>
                      {t("common.actions.cancel")}
                    </Button>
                    <Button type="submit" size="sm" disabled={isSaving}>
                      {t("common.actions.save")}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </div>

        <ModalFooter className="shrink-0">
          {canEditEvents && !isFormVisible && (
            <Button type="button" variant="outline" size="sm" onClick={openAddForm}>
              <Plus className="h-4 w-4" />
              {t("calendar.academicYearTools.holidays.add")}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.actions.close")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
