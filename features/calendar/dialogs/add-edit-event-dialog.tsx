import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
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
import { EventMultiSelect } from "@/features/calendar/components/event-multi-select";
import { EventConstraintList } from "@/features/calendar/components/event-constraint-list";
import type { EventGapConstraint } from "@/features/calendar/components/event-constraint-list";
import { useDisclosure } from "@/features/calendar/hooks";
import type { IEvent } from "@/shared/calendar/types";
import { getAcademicYearLabel, getAcademicYearOptions, getAcademicYearRange } from "@/shared/calendar/academic-year";
import { computeDefaultConfig } from "@/shared/calendar/rules";
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
  const { addEvent, updateEvent, users, eventEnums, canEditEvents, allEvents, academicYearStart } = useCalendar();
  const yearEvents = useMemo(
    () => allEvents.filter((e) => e.academicYearStart === academicYearStart),
    [allEvents, academicYearStart],
  );
  const isEditing = !!event;
  const eventSchema = useMemo(() => createEventSchema(t), [t]);

  const initialDates = useMemo(
    () => getInitialDates({ event, startDate, startTime }),
    [event, startDate, startTime],
  );

  const defaultValues = useMemo(
    () => getEventFormDefaults(event, initialDates, academicYearStart),
    [event, initialDates, academicYearStart],
  );

  const form = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "occurrences",
  });

  const watchedOccurrences = useWatch({ control: form.control, name: "occurrences" });

  const eligibleAcademicYearOptions = useMemo(() => {
    const occurrenceDates = (watchedOccurrences ?? [])
      .flatMap((o) => [o.startDate, o.endDate])
      .filter((d): d is Date => d instanceof Date && !Number.isNaN(d.getTime()));

    if (occurrenceDates.length === 0) {
      return getAcademicYearOptions(event?.academicYearStart ?? academicYearStart, 2);
    }

    const minDate = new Date(Math.min(...occurrenceDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...occurrenceDates.map((d) => d.getTime())));

    const candidateYears = getAcademicYearOptions(minDate.getFullYear(), 3);
    return candidateYears.filter((year) => {
      const range = getAcademicYearRange(year);
      return minDate >= new Date(range.startDate) && maxDate <= new Date(range.endDate);
    });
  }, [watchedOccurrences, event?.academicYearStart, academicYearStart]);

  const hasMountedEligibilityCheck = useRef(false);
  useEffect(() => {
    if (!hasMountedEligibilityCheck.current) {
      hasMountedEligibilityCheck.current = true;
      return;
    }

    if (eligibleAcademicYearOptions.length === 0) return;

    const current = form.getValues("academicYearStart");
    if (!eligibleAcademicYearOptions.includes(current)) {
      form.setValue("academicYearStart", eligibleAcademicYearOptions[0], { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligibleAcademicYearOptions]);

  const activeRules = useWatch({ control: form.control, name: "rules" }) ?? [];
  const availableRuleDefs = eventEnums.rules.filter(
    (def) => !def.hidden && !activeRules.some((r) => r.type === def.id),
  );

  const [ruleSelectKey, setRuleSelectKey] = useState(0);

  const addRule = (ruleId: string) => {
    const meta = eventEnums.rules.find((r) => r.id === ruleId);
    if (!meta) return;
    const current = form.getValues("rules");
    form.setValue("rules", [...current, { type: ruleId, config: computeDefaultConfig(meta.fields) }], { shouldDirty: true });
    setRuleSelectKey((k) => k + 1);
  };

  const removeRule = (index: number) => {
    const current = form.getValues("rules");
    form.setValue("rules", current.filter((_, i) => i !== index), { shouldDirty: true });
  };

  const updateRuleConfig = (index: number, fieldId: string, value: unknown) => {
    const current = form.getValues("rules");
    const updated = current.map((rule, i) =>
      i === index ? { ...rule, config: { ...rule.config, [fieldId]: value } } : rule,
    );
    form.setValue("rules", updated, { shouldDirty: true });
  };

  useEffect(() => {
    if (isOpen) {
      hasMountedEligibilityCheck.current = false;
      form.reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
                  name="academicYearStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="required">{t("calendar.dialogs.addEditEvent.fields.academicYear")}</FormLabel>
                      <FormControl>
                        <Select
                          value={String(field.value)}
                          onValueChange={(value) => field.onChange(Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {eligibleAcademicYearOptions.map((year) => (
                              <SelectItem value={String(year)} key={year}>
                                {getAcademicYearLabel(year)}
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

                <FormField
                  control={form.control}
                  name="notifyDaysBefore"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>{t("calendar.dialogs.addEditEvent.fields.notifyDaysBefore")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={t("calendar.dialogs.addEditEvent.fields.notifyDaysBeforePlaceholder")}
                          {...field}
                          value={field.value ?? ""}
                          className={fieldState.invalid ? "border-red-500" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>


              {/* Rules */}
              <div className="space-y-3 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{t("calendar.dialogs.addEditEvent.rules.title")}</p>
                  {availableRuleDefs.length > 0 && (
                    <Select key={ruleSelectKey} onValueChange={addRule}>
                      <SelectTrigger className="h-8 w-auto">
                        <SelectValue placeholder={t("calendar.dialogs.addEditEvent.rules.add")} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRuleDefs.map((def) => (
                          <SelectItem key={def.id} value={def.id}>
                            {t(`calendar.rules.${def.id}.label` as never)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {activeRules.length > 0 ? (
                  <div className="space-y-2">
                    {activeRules.map((rule, index) => {
                      const meta = eventEnums.rules.find((r) => r.id === rule.type);
                      if (!meta) return null;
                      return (
                        <div key={`${rule.type}-${index}`} className="rounded-md border bg-muted/40 p-2.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{t(`calendar.rules.${rule.type}.label` as never)}</span>
                            <button
                              type="button"
                              onClick={() => removeRule(index)}
                              className="text-muted-foreground hover:text-foreground"
                              aria-label={t("calendar.dialogs.addEditEvent.rules.removeRule")}
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {meta.fields.map((fieldDef) => {
                              const label = t(`calendar.rules.${rule.type}.fields.${fieldDef.id}` as never);

                              if (fieldDef.type === "checkbox") {
                                const checked = (rule.config[fieldDef.id] as boolean) ?? (fieldDef.defaultValue as boolean);
                                return (
                                  <label key={fieldDef.id} className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => updateRuleConfig(index, fieldDef.id, e.target.checked)}
                                      className="h-3.5 w-3.5 cursor-pointer"
                                    />
                                    {label}
                                  </label>
                                );
                              }

                              if (fieldDef.type === "number") {
                                const numVal = (rule.config[fieldDef.id] as number | undefined) ?? (fieldDef.defaultValue as number);
                                return (
                                  <label key={fieldDef.id} className="flex items-center gap-2 text-xs">
                                    <span>{label}</span>
                                    <input
                                      type="number"
                                      min={1}
                                      value={numVal}
                                      onChange={(e) => updateRuleConfig(index, fieldDef.id, parseInt(e.target.value, 10) || 1)}
                                      className="w-16 h-6 rounded border border-input bg-background px-2 text-xs"
                                    />
                                  </label>
                                );
                              }

                              if (fieldDef.type === "event-multiselect") {
                                const selectedIds = (rule.config[fieldDef.id] as number[] | undefined) ?? [];
                                return (
                                  <div key={fieldDef.id} className="w-full space-y-1">
                                    <span className="text-xs">{label}</span>
                                    <EventMultiSelect
                                      value={selectedIds}
                                      onChange={(ids) => updateRuleConfig(index, fieldDef.id, ids)}
                                      events={yearEvents}
                                      excludeEventId={event?.id}
                                    />
                                  </div>
                                );
                              }

                              if (fieldDef.type === "event-constraints") {
                                const constraints = (rule.config[fieldDef.id] as EventGapConstraint[] | undefined) ?? [];
                                return (
                                  <div key={fieldDef.id} className="w-full space-y-1.5">
                                    <span className="text-xs">{label}</span>
                                    <EventConstraintList
                                      value={constraints}
                                      onChange={(c) => updateRuleConfig(index, fieldDef.id, c)}
                                      events={yearEvents}
                                      excludeEventId={event?.id}
                                    />
                                  </div>
                                );
                              }

                              return null;
                            })}
                          </div>
                        </div>
                      );
                    })}
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

                    <div className="grid gap-3 grid-cols-3">
                      <FormField
                        control={form.control}
                        name={`occurrences.${index}.minDays`}
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>{t("calendar.dialogs.addEditEvent.occurrences.minDays")}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={t("calendar.dialogs.addEditEvent.occurrences.minDaysPlaceholder")}
                                {...field}
                                value={field.value ?? ""}
                                className={fieldState.invalid ? "border-red-500" : ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`occurrences.${index}.minDaysToNext`}
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>{t("calendar.dialogs.addEditEvent.occurrences.minDaysToNext")}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={t("calendar.dialogs.addEditEvent.occurrences.minDaysToNextPlaceholder")}
                                {...field}
                                value={field.value ?? ""}
                                className={fieldState.invalid ? "border-red-500" : ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`occurrences.${index}.notifyDaysBeforeOverride`}
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>{t("calendar.dialogs.addEditEvent.occurrences.notifyDaysBeforeOverride")}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={t("calendar.dialogs.addEditEvent.occurrences.notifyDaysBeforeOverridePlaceholder")}
                                {...field}
                                value={field.value ?? ""}
                                className={fieldState.invalid ? "border-red-500" : ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
