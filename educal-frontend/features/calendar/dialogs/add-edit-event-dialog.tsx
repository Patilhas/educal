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
import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_KEYS,
  EVENT_CLASSIFICATIONS,
  EVENT_RESPONSIBLES,
  EVENT_STATUSES,
} from "@/features/calendar/constants";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { useDisclosure } from "@/features/calendar/hooks";
import type { IEvent } from "@/features/calendar/interfaces";
import { eventSchema, type TEventFormData } from "@/features/calendar/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  formatEventFromForm,
  getEventFormDefaults,
  getInitialDates,
  toInputDate,
} from "@/features/calendar/dialogs/add-edit-event-dialog-utils";

interface IProps {
  children: ReactNode;
  startDate?: Date;
  startTime?: { hour: number; minute: number };
  event?: IEvent;
}

export function AddEditEventDialog({
  children,
  startDate,
  startTime,
  event,
}: IProps) {
  const { isOpen, onClose, onToggle } = useDisclosure();
  const { addEvent, updateEvent } = useCalendar();
  const isEditing = !!event;

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

  const onSubmit = (values: TEventFormData) => {
    try {
      const formattedEvent: IEvent = formatEventFromForm({
        values,
        isEditing,
        event,
      });

      if (isEditing) {
        updateEvent(formattedEvent);
        toast.success("Evento atualizado com sucesso");
      } else {
        addEvent(formattedEvent);
        toast.success("Evento criado com sucesso");
      }

      onClose();
      form.reset();
    } catch (error) {
      console.error(`Error ${isEditing ? "editing" : "adding"} event:`, error);
      toast.error(
        `Nao foi possivel ${isEditing ? "editar" : "adicionar"} o evento`,
      );
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onToggle} modal={false}>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            {isEditing ? "Editar evento" : "Adicionar novo evento"}
          </ModalTitle>
          <ModalDescription>
            {isEditing
              ? "Altere os dados do evento existente."
              : "Crie um novo evento no calendário."}
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
                  <FormLabel className="required">Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Introduza o nome do evento"
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
                  <FormLabel className="required">Objetivo</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descreva o objetivo do evento"
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
                  <FormLabel>Dias entre ocorrências</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode="numeric"
                      placeholder="ex.: 30"
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
                    <FormLabel className="required">Categoria</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {EVENT_CATEGORY_KEYS.map((category) => (
                            <SelectItem value={category} key={category}>
                              {EVENT_CATEGORIES[category].label}
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
                    <FormLabel className="required">Classificação</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a classificação" />
                        </SelectTrigger>
                        <SelectContent>
                          {EVENT_CLASSIFICATIONS.map((classification) => (
                            <SelectItem value={classification} key={classification}>
                              {classification}
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
                    <FormLabel className="required">Estado</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {EVENT_STATUSES.map((status) => (
                            <SelectItem value={status} key={status}>
                              {status}
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
                    <FormLabel className="required">Responsável</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          {EVENT_RESPONSIBLES.map((responsible) => (
                            <SelectItem value={responsible} key={responsible}>
                              {responsible}
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
                <p className="text-sm font-medium">Ocorrências</p>
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
                  Adicionar ocorrência
                </Button>
              </div>

              {fields.map((occurrence, index) => (
                <div key={occurrence.id} className="space-y-3 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Ocorrência {index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                    >
                      Remover
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`occurrences.${index}.description`}
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="required">Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Descreva esta ocorrência"
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
                          <FormLabel className="required">Data de início</FormLabel>
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
                          <FormLabel className="required">Data de fim</FormLabel>
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
              Cancelar
            </Button>
          </ModalClose>
          <Button form="event-form" type="submit">
            {isEditing ? "Guardar alterações" : "Criar evento"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

