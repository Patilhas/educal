"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, BadgeAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/responsive-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import {
  migrateAcademicYearRequest,
  validateAcademicYearRequest,
} from "@/features/calendar/client-requests";
import {
  getAcademicYearLabel,
  getAcademicYearOptions,
} from "@/shared/calendar/academic-year";
import type {
  IAcademicYearMigrationResult,
  IAcademicYearValidationResult,
} from "@/shared/calendar/types";
import { useTranslations } from "@/i18n/use-translations";

export function AcademicYearTools() {
  const router = useRouter();
  const { t } = useTranslations();
  const { academicYearStart, selectedDate, setSelectedDate, canEditEvents } = useCalendar();
  const [isValidating, setIsValidating] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [validationResult, setValidationResult] =
    useState<IAcademicYearValidationResult | null>(null);
  const [migrationResult, setMigrationResult] =
    useState<IAcademicYearMigrationResult | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const yearOptions = useMemo(
    () => getAcademicYearOptions(selectedDate.getFullYear(), 2),
    [selectedDate],
  );

  const currentYearLabel = getAcademicYearLabel(academicYearStart);

  const handleYearChange = (value: string) => {
    const nextYear = Number(value);
    if (!Number.isInteger(nextYear) || nextYear <= 0) return;
    setSelectedDate(new Date(nextYear, 0, 1));
  };

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const result = await validateAcademicYearRequest(academicYearStart);
      setValidationResult(result);
      setMigrationResult(null);
      setIsReportOpen(true);

      if (result.issues.length === 0) {
        toast.success(t("calendar.academicYearTools.validationSuccess", { label: result.academicYear.label }));
        return;
      }

      toast.error(
        t("calendar.academicYearTools.validationIssues", { count: result.issues.length, label: result.academicYear.label }),
      );
    } catch (error) {
      console.error("Erro a validar ano letivo:", error);
      toast.error(t("calendar.academicYearTools.validationError"));
    } finally {
      setIsValidating(false);
    }
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      const result = await migrateAcademicYearRequest(academicYearStart);
      setMigrationResult(result);
      setValidationResult(null);
      setIsReportOpen(true);
      toast.success(
        t("calendar.academicYearTools.migrationSuccess", { createdEvents: result.createdEvents, skippedEvents: result.skippedEvents }),
      );
      router.refresh();
    } catch (error) {
      console.error("Erro a migrar ano letivo:", error);
      toast.error(t("calendar.academicYearTools.migrationError"));
    } finally {
      setIsMigrating(false);
    }
  };

  const report = validationResult ?? migrationResult;
  const reportTitle = validationResult
    ? t("calendar.academicYearTools.reportValidationTitle", { label: validationResult.academicYear.label })
    : migrationResult
      ? t("calendar.academicYearTools.reportMigrationTitle", { source: migrationResult.sourceAcademicYear.label, target: migrationResult.targetAcademicYear.label })
      : t("calendar.academicYearTools.reportTitle");
  const reportDescription = validationResult
    ? t("calendar.academicYearTools.reportValidationDescription", { totalEvents: validationResult.totalEvents, totalOccurrences: validationResult.totalOccurrences })
    : migrationResult
      ? t("calendar.academicYearTools.reportMigrationDescription", { createdEvents: migrationResult.createdEvents, skippedEvents: migrationResult.skippedEvents })
      : "";

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-background/60 p-3 lg:flex-row lg:items-center lg:gap-3">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="h-8 px-3">
          {t("calendar.academicYearTools.academicYear")}
        </Badge>
        <Select value={String(academicYearStart)} onValueChange={handleYearChange}>
          <SelectTrigger className="h-8 w-30">
            <SelectValue placeholder={currentYearLabel} />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {getAcademicYearLabel(year)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleValidate}
          disabled={isValidating || isMigrating}
        >
          <CheckCircle2 className="h-4 w-4" />
          {isValidating ? t("calendar.academicYearTools.validating") : t("calendar.academicYearTools.validate")}
        </Button>

        {canEditEvents && (
          <Button
            type="button"
            size="sm"
            onClick={handleMigrate}
            disabled={isValidating || isMigrating}
          >
            <ArrowRightLeft className="h-4 w-4" />
            {isMigrating ? t("calendar.academicYearTools.migrating") : t("calendar.academicYearTools.migrate")}
          </Button>
        )}
      </div>

      <Modal open={isReportOpen} onOpenChange={setIsReportOpen}>
        <ModalContent className="sm:max-w-180">
          <ModalHeader className="shrink-0">
            <ModalTitle className="flex items-center gap-2">
              <BadgeAlert className="h-5 w-5" />
              {reportTitle}
            </ModalTitle>
            {reportDescription && <ModalDescription>{reportDescription}</ModalDescription>}
          </ModalHeader>

          <div className="flex-1 overflow-y-auto pr-4">
            {report ? (
              <div className="space-y-3">
                {report.issues.length === 0 ? (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-200">
                    {t("calendar.academicYearTools.reportNoIssues")}
                  </div>
                ) : (
                  report.issues.map((issue) => (
                    <div key={`${issue.eventId}-${issue.occurrenceId}-${issue.field}-${issue.date}`} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{issue.ruleLabel}</Badge>
                        <Badge variant="outline">
                          {issue.field === "startDate"
                            ? t("calendar.academicYearTools.issueFieldStart")
                            : issue.field === "endDate"
                              ? t("calendar.academicYearTools.issueFieldEnd")
                              : t("calendar.academicYearTools.issueFieldRange")}
                        </Badge>
                        <span className="text-sm font-medium">{issue.eventName}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t(`calendar.academicYearTools.issueMessages.${issue.rule}`, { holidayName: issue.ruleLabel })}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("calendar.academicYearTools.issueOccurrence")} {issue.occurrenceDescription || "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("calendar.academicYearTools.issueDate")} {new Date(issue.date).toLocaleString("pt-PT")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("calendar.academicYearTools.reportEmpty")}
              </p>
            )}
          </div>

          <ModalFooter className="shrink-0">
            <Button type="button" variant="outline" onClick={() => setIsReportOpen(false)}>
              {t("common.actions.close")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
