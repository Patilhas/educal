import { type ReactNode, useEffect, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
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
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/responsive-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { useDisclosure } from "@/features/calendar/hooks";
import type { IEvent } from "@/features/calendar/interfaces";
import { createEventSchema, type TEventFormData } from "@/features/calendar/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  formatEventFromForm,
  getEventFormDefaults,
  getInitialDates,
  toInputDate,
} from "@/features/calendar/dialogs/add-edit-event-dialog-utils";
import { useTranslations } from "@/i18n/use-translations";

interface IProps {
  children: ReactNode;
  startDate?: Date;
  startTime?: { hour: number; minute: number };
  event?: IEvent;
}

export default function AddEditEventDialog({
  children,
  startDate,
  startTime,
  event,
}: IProps) {
  const { t } = useTranslations();
  const { isOpen, onClose, onToggle } = useDisclosure();
  const { addEvent, updateEvent, users, eventEnums, canEditEvents } = useCalendar();
  const isEditing = !!event;
  const eventSchema = useMemo(() => createEventSchema(t), [t]);

  const initialDates = useMemo(() => {
    return getInitialDates({ event, startDate, startTime });
  }, [event, startDate, startTime]);

  const defaultValues = useMemo(
    () => getEventFormDefaults(event, initialDates),
    [event, initialDates],
  );

  const form = useForm<TEventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "occurrences",
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const onSubmit = async (values: TEventFormData) => {
    try {
      const defaultUser = event?.user ?? users[0];
      if (!defaultUser) {
        toast.error(t("calendar.messages.noUser"));
        return;
      }

      const formattedEvent: IEvent = formatEventFromForm({
        values,
        isEditing,
        event,
        defaultUser,
      });

      if (isEditing) {
        await updateEvent(formattedEvent);
        toast.success(t("calendar.messages.updateSuccess"));
      } else {
        await addEvent(formattedEvent);
        toast.success(t("calendar.messages.createSuccess"));
      }

      onClose();
      form.reset();
    } catch (error) {
      console.error(`Error ${isEditing ? "editing" : "adding"} event:`, error);
      toast.error(
        isEditing
          ? t("calendar.messages.updateError")
          : t("calendar.messages.createError"),
      );
    }
  };

  if (!canEditEvents) {
    return <>{children}</>;
  }

  return (
    <Modal open={isOpen} onOpenChange={onToggle} modal={false}>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            {isEditing ? t("calendar.dialogs.addEditEvent.titleEdit") : t("calendar.dialogs.addEditEvent.titleAdd")}
          </ModalTitle>
          <ModalDescription>
            {isEditing
              ? t("calendar.dialogs.addEditEvent.descEdit")
              : t("calendar.dialogs.addEditEvent.descAdd")}
          </ModalDescription>
        </ModalHeader>

        <Form {...form}>
          <form
            id="event-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="required">{t("calendar.dialogs.addEditEvent.fields.name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("calendar.dialogs.addEditEvent.fields.namePlaceholder")}
                      {...field}
                      className={fieldState.invalid ? "border-red-500" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="objective"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="required">{t("calendar.dialogs.addEditEvent.fields.objective")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("calendar.dialogs.addEditEvent.fields.objectivePlaceholder")}
                      className={fieldState.invalid ? "border-red-500" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="daysBetweenOccurrences"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("calendar.dialogs.addEditEvent.fields.daysBetween")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode="numeric"
                      placeholder={t("calendar.dialogs.addEditEvent.fields.daysBetweenPlaceholder")}
                      className={fieldState.invalid ? "border-red-500" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="required">{t("calendar.dialogs.addEditEvent.fields.category")}</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("calendar.dialogs.addEditEvent.fields.categoryPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {eventEnums.categories.map(({ value }) => (
                            <SelectItem value={value} key={value}>
                              {t(`calendar.categories.${value}` as never)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="classification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="required">{t("calendar.dialogs.addEditEvent.fields.classification")}</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("calendar.dialogs.addEditEvent.fields.classificationPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {eventEnums.classifications.map((key) => (
                            <SelectItem value={key} key={key}>
                              {t(`calendar.classifications.${key}` as never)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="required">{t("calendar.dialogs.addEditEvent.fields.status")}</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("calendar.dialogs.addEditEvent.fields.statusPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {eventEnums.statuses.map((key) => (
                            <SelectItem value={key} key={key}>
                              {t(`calendar.statuses.${key}` as never)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsible"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="required">{t("calendar.dialogs.addEditEvent.fields.responsible")}</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("calendar.dialogs.addEditEvent.fields.responsiblePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {eventEnums.responsibles.map((key) => (
                            <SelectItem value={key} key={key}>
                              {t(`calendar.responsibles.${key}` as never)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t("calendar.dialogs.addEditEvent.occurrences.title")}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      id: crypto.randomUUID(),
                      description: "",
                      startDate: initialDates.startDate,
                      endDate: initialDates.endDate,
                    })
                  }
                >
                  {t("calendar.dialogs.addEditEvent.occurrences.add")}
                </Button>
              </div>

              {fields.map((occurrence, index) => (
                <div key={occurrence.id} className="space-y-3 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("calendar.dialogs.addEditEvent.occurrences.occurrenceLabel")} {index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                    >
                      {t("common.actions.remove")}
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`occurrences.${index}.description`}
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="required">{t("calendar.dialogs.addEditEvent.occurrences.description")}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t("calendar.dialogs.addEditEvent.occurrences.descriptionPlaceholder")}
                            className={fieldState.invalid ? "border-red-500" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-3 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`occurrences.${index}.startDate`}
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel className="required">{t("calendar.dialogs.addEditEvent.occurrences.startDate")}</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              value={field.value ? toInputDate(field.value) : ""}
                              onChange={(event) =>
                                field.onChange(new Date(event.target.value))
                              }
                              className={fieldState.invalid ? "border-red-500" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`occurrences.${index}.endDate`}
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel className="required">{t("calendar.dialogs.addEditEvent.occurrences.endDate")}</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              value={field.value ? toInputDate(field.value) : ""}
                              onChange={(event) =>
                                field.onChange(new Date(event.target.value))
                              }
                              className={fieldState.invalid ? "border-red-500" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </form>
        </Form>

        <ModalFooter className="flex justify-end gap-2">
          <ModalClose asChild>
            <Button type="button" variant="outline">
              {t("common.actions.cancel")}
            </Button>
          </ModalClose>
          <Button form="event-form" type="submit">
            {isEditing ? t("calendar.dialogs.addEditEvent.submitEdit") : t("calendar.dialogs.addEditEvent.submitAdd")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

