import { type ReactNode, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
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
import type { IEvent } from "@/shared/calendar/types";
import { CALENDAR_RULE_TYPES } from "@/shared/calendar/types";
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

export default function AddEditEventDialog({ children, startDate, startTime, event }: IProps) {
  const { t } = useTranslations();
  const { isOpen, onClose, onToggle } = useDisclosure();
  const { addEvent, updateEvent, users, eventEnums, canEditEvents } = useCalendar();
  const isEditing = !!event;
  const eventSchema = useMemo(() => createEventSchema(t), [t]);

  const initialDates = useMemo(
    () => getInitialDates({ event, startDate, startTime }),
    [event, startDate, startTime],
  );

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

  const activeRules = useWatch({ control: form.control, name: "rules" }) ?? [];
  const availableRules = CALENDAR_RULE_TYPES.filter((r) => !activeRules.includes(r));

  const addRule = (rule: string) => {
    const current = form.getValues("rules");
    form.setValue("rules", [...current, rule as typeof CALENDAR_RULE_TYPES[number]], { shouldDirty: true });
  };

  const removeRule = (rule: string) => {
    const current = form.getValues("rules");
    form.setValue("rules", current.filter((r) => r !== rule), { shouldDirty: true });
  };

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

      const formattedEvent: IEvent = formatEventFromForm({ values, isEditing, event, defaultUser });

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
      toast.error(isEditing ? t("calendar.messages.updateError") : t("calendar.messages.createError"));
    }
  };

  if (!canEditEvents) return <>{children}</>;

  return (
    <Modal open={isOpen} onOpenChange={onToggle}>
      <ModalTrigger asChild>{children}</ModalTrigger>

      <ModalContent showCloseButton={false} className="lg:p-0 lg:gap-0 lg:flex lg:flex-col lg:max-w-[82vw] lg:h-[80vh] lg:max-h-[80vh]">
        {/* Header */}
        <div className="flex items-start gap-4 lg:px-8 lg:pt-7 lg:pb-6 lg:border-b lg:shrink-0">
          <div className="flex-1 min-w-0">
            <ModalTitle>
              {isEditing
                ? t("calendar.dialogs.addEditEvent.titleEdit")
                : t("calendar.dialogs.addEditEvent.titleAdd")}
            </ModalTitle>
            <ModalDescription className="mt-1">
              {isEditing
                ? t("calendar.dialogs.addEditEvent.descEdit")
                : t("calendar.dialogs.addEditEvent.descAdd")}
            </ModalDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            <ModalClose asChild>
              <Button type="button" variant="outline" size="sm">
                {t("common.actions.cancel")}
              </Button>
            </ModalClose>
            <Button form="event-form" type="submit" size="sm">
              {isEditing
                ? t("calendar.dialogs.addEditEvent.submitEdit")
                : t("calendar.dialogs.addEditEvent.submitAdd")}
            </Button>
            <ModalClose asChild>
              <Button type="button" variant="ghost" size="icon-sm">
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </ModalClose>
          </div>
        </div>

        {/* Body */}
        <Form {...form}>
          <form
            id="event-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="lg:flex lg:flex-1 lg:min-h-0"
          >
            {/* Left panel — event fields */}
            <div className="lg:w-[45%] lg:shrink-0 lg:border-r lg:overflow-y-auto lg:px-8 lg:py-7 space-y-4 mb-4 lg:mb-0">
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

              <div className="grid gap-4 grid-cols-2">
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

              {/* Rules */}
              <div className="space-y-3 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{t("calendar.dialogs.addEditEvent.rules.title")}</p>
                  {availableRules.length > 0 && (
                    <Select onValueChange={addRule}>
                      <SelectTrigger className="h-8 w-auto">
                        <SelectValue placeholder={t("calendar.dialogs.addEditEvent.rules.add")} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRules.map((rule) => (
                          <SelectItem key={rule} value={rule}>
                            {t(`calendar.dialogs.addEditEvent.rules.${rule}` as never)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {activeRules.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {activeRules.map((rule) => (
                      <div
                        key={rule}
                        className="flex items-center gap-1 rounded-md border bg-muted px-2 py-1 text-sm"
                      >
                        <span>{t(`calendar.dialogs.addEditEvent.rules.${rule}` as never)}</span>
                        <button
                          type="button"
                          onClick={() => removeRule(rule)}
                          className="ml-1 text-muted-foreground hover:text-foreground"
                          aria-label={t("calendar.dialogs.addEditEvent.rules.removeRule")}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t("calendar.dialogs.addEditEvent.rules.noRules")}
                  </p>
                )}
              </div>
            </div>

            {/* Right panel — occurrences */}
            <div className="lg:flex-1 lg:overflow-y-auto lg:px-8 lg:py-7 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  {t("calendar.dialogs.addEditEvent.occurrences.title")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
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

              <div className="grid gap-3 lg:grid-cols-2">
                {fields.map((occurrence, index) => (
                  <div key={occurrence.id} className="rounded-lg border bg-background p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                        {t("calendar.dialogs.addEditEvent.occurrences.occurrenceLabel")} {index + 1}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
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
                          <FormLabel className="required">
                            {t("calendar.dialogs.addEditEvent.occurrences.description")}
                          </FormLabel>
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

                    <div className="grid gap-3 grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`occurrences.${index}.startDate`}
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel className="required">
                              {t("calendar.dialogs.addEditEvent.occurrences.startDate")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                value={field.value ? toInputDate(field.value) : ""}
                                onChange={(e) => field.onChange(new Date(e.target.value))}
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
                            <FormLabel className="required">
                              {t("calendar.dialogs.addEditEvent.occurrences.endDate")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                value={field.value ? toInputDate(field.value) : ""}
                                onChange={(e) => field.onChange(new Date(e.target.value))}
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
            </div>
          </form>
        </Form>
      </ModalContent>
    </Modal>
  );
}
