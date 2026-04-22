"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Control, type FieldPath, useForm } from "react-hook-form";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "@/i18n/use-translations";
import {
  createUserRequest,
  deleteUserRequest,
  updateUserRequest,
} from "@/features/admin-users/client-requests";
import {
  createUserFormSchema,
  editUserFormSchema,
  EMPTY_CREATE_FORM,
  normalizePicturePath,
  parseCreateUserPayload,
  toEditFormValues,
  type TCreateUserFormValues,
  type TEditUserFormValues,
} from "@/features/admin-users/schemas";
import { updateUserPayloadSchema } from "@/shared/user/schemas";
import type { TUserRole, IUserUpdatePayload, IUserWithEmail } from "@/shared/user/types";

interface UserManagementProps {
  initialUsers: IUserWithEmail[];
  currentUserId: string;
}

type UserFormMode = "create" | "edit";

type UserFormBaseValues = {
  name: string;
  email: string;
  role: TUserRole;
  picturePath: string;
  password: string;
};

interface UserFormFieldsProps<TValues extends UserFormBaseValues> {
  control: Control<TValues>;
  mode: UserFormMode;
}

function UserFormFields<TValues extends UserFormBaseValues>({
  control,
  mode,
}: UserFormFieldsProps<TValues>) {
  const { t } = useTranslations();
  const idPrefix = mode === "create" ? "create-user" : "edit-user";

  const roleOptions: Array<{ value: TUserRole; label: string }> = [
    { value: "viewer", label: t("common.roles.viewer") },
    { value: "editor", label: t("common.roles.editor") },
    { value: "admin", label: t("common.roles.admin") },
  ];

  return (
    <>
      <FormField
        control={control}
        name={"name" as FieldPath<TValues>}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>
              {mode === "create"
                ? t("users.management.create.fields.name")
                : t("users.management.edit.fields.name")}
            </FormLabel>
            <FormControl>
              <Input id={`${idPrefix}-name`} {...field} className={fieldState.invalid ? "border-destructive" : ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={"email" as FieldPath<TValues>}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>
              {mode === "create"
                ? t("users.management.create.fields.email")
                : t("users.management.edit.fields.email")}
            </FormLabel>
            <FormControl>
              <Input id={`${idPrefix}-email`} type="email" {...field} className={fieldState.invalid ? "border-destructive" : ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={"role" as FieldPath<TValues>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {mode === "create"
                ? t("users.management.create.fields.role")
                : t("users.management.edit.fields.role")}
            </FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={`${idPrefix}-role`} className="w-full">
                  <SelectValue
                    placeholder={
                      mode === "create"
                        ? t("users.management.create.fields.role")
                        : t("users.management.edit.fields.role")
                    }
                  />
                </SelectTrigger>
                <SelectContent position="popper">
                  {roleOptions.map((roleOption) => (
                    <SelectItem key={roleOption.value} value={roleOption.value}>
                      {roleOption.label}
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
        control={control}
        name={"picturePath" as FieldPath<TValues>}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>
              {mode === "create"
                ? t("users.management.create.fields.picturePath")
                : t("users.management.edit.fields.picturePath")}
            </FormLabel>
            <FormControl>
              <Input
                id={`${idPrefix}-picture-path`}
                placeholder={
                  mode === "create"
                    ? t("users.management.create.fields.picturePlaceholder")
                    : t("users.management.edit.fields.picturePlaceholder")
                }
                {...field}
                className={fieldState.invalid ? "border-destructive" : ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={"password" as FieldPath<TValues>}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>
              {mode === "create"
                ? t("users.management.create.fields.password")
                : t("users.management.edit.fields.password")}
            </FormLabel>
            <FormControl>
              <Input
                id={`${idPrefix}-password`}
                type="password"
                placeholder={
                  mode === "create"
                    ? undefined
                    : t("users.management.edit.fields.passwordPlaceholder")
                }
                {...field}
                className={fieldState.invalid ? "border-destructive" : ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

const sortUsers = (users: IUserWithEmail[]) => {
  return [...users].sort((left, right) => left.name.localeCompare(right.name));
};

const getMessageFromError = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

const getValidationMessage = (issues: { message?: string }[], fallback: string) => {
  const firstIssueMessage = issues[0]?.message?.trim();
  return firstIssueMessage && firstIssueMessage.length > 0 ? firstIssueMessage : fallback;
};

export function UserManagement({ initialUsers, currentUserId }: UserManagementProps) {
  const { t } = useTranslations();
  const [users, setUsers] = useState<IUserWithEmail[]>(() => sortUsers(initialUsers));
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const createForm = useForm<TCreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: EMPTY_CREATE_FORM,
  });

  const editForm = useForm<TEditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: EMPTY_CREATE_FORM,
  });

  const editingUser = useMemo(
    () => users.find((user) => user.id === editingUserId) ?? null,
    [users, editingUserId],
  );

  const resetEditing = () => {
    setEditingUserId(null);
    editForm.reset(EMPTY_CREATE_FORM);
  };

  const handleCreateUser = createForm.handleSubmit(async (values) => {
    const payload = parseCreateUserPayload(values);
    try {
      const createdUser = await createUserRequest(payload);
      setUsers((current) => sortUsers([...current, createdUser]));
      createForm.reset(EMPTY_CREATE_FORM);
      toast.success(t("users.management.create.success"));
    } catch (error) {
      toast.error(getMessageFromError(error, t("users.management.create.error")));
    }
  }, () => {
    const firstMessage = Object.values(createForm.formState.errors)[0]?.message;
    toast.error(firstMessage || t("users.management.create.validation"));
  });

  const handleStartEdit = (user: IUserWithEmail) => {
    setEditingUserId(user.id);
    editForm.reset(toEditFormValues(user));
  };

  const handleSaveEdit = editForm.handleSubmit(async (values) => {
    if (!editingUser) {
      return;
    }

    const candidatePayload: IUserUpdatePayload = {};

    if (values.name !== editingUser.name) {
      candidatePayload.name = values.name;
    }

    if (values.email !== editingUser.email) {
      candidatePayload.email = values.email;
    }

    if (values.role !== editingUser.role) {
      candidatePayload.role = values.role;
    }

    const normalizedPicturePath = normalizePicturePath(values.picturePath);
    if (normalizedPicturePath !== editingUser.picturePath) {
      candidatePayload.picturePath = normalizedPicturePath;
    }

    if (values.password.trim().length > 0) {
      candidatePayload.password = values.password;
    }

    if (Object.keys(candidatePayload).length === 0) {
      toast.info(t("users.management.edit.noChanges"));
      return;
    }

    const parsedPayload = updateUserPayloadSchema.safeParse(candidatePayload);
    if (!parsedPayload.success) {
      toast.error(
        getValidationMessage(parsedPayload.error.issues, t("users.management.edit.validation")),
      );
      return;
    }

    const payload = parsedPayload.data;

    setBusyUserId(editingUser.id);

    try {
      const updated = await updateUserRequest(editingUser.id, payload);
      setUsers((current) =>
        sortUsers(current.map((candidate) => (candidate.id === updated.id ? updated : candidate))),
      );
      resetEditing();
      toast.success(t("users.management.edit.success"));
    } catch (error) {
      toast.error(getMessageFromError(error, t("users.management.edit.error")));
    } finally {
      setBusyUserId(null);
    }
  }, () => {
    const firstMessage = Object.values(editForm.formState.errors)[0]?.message;
    toast.error(firstMessage || t("users.management.edit.validation"));
  });

  const handleDeleteUser = async (user: IUserWithEmail) => {
    if (!window.confirm(t("users.management.delete.confirmation", { name: user.name }))) {
      return;
    }

    setBusyUserId(user.id);

    try {
      await deleteUserRequest(user.id);
      setUsers((current) => current.filter((candidate) => candidate.id !== user.id));
      if (editingUserId === user.id) {
        resetEditing();
      }
      toast.success(t("users.management.delete.success"));
    } catch (error) {
      toast.error(getMessageFromError(error, t("users.management.delete.error")));
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <section className="space-y-6 rounded-xl border bg-background p-4 shadow-sm">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">{t("users.management.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("users.management.description")}
        </p>
      </header>

      <Form {...createForm}>
        <form className="grid gap-3 rounded-lg border p-4 md:grid-cols-2 xl:grid-cols-5" onSubmit={handleCreateUser}>
          <UserFormFields control={createForm.control} mode="create" />

          <div className="md:col-span-2 xl:col-span-5">
            <Button type="submit" disabled={createForm.formState.isSubmitting}>
              {createForm.formState.isSubmitting
                ? t("users.management.create.submitting")
                : t("users.management.create.submit")}
            </Button>
          </div>
        </form>
      </Form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-190 text-left text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-3 py-2 font-medium">{t("users.management.table.headers.name")}</th>
              <th className="px-3 py-2 font-medium">{t("users.management.table.headers.email")}</th>
              <th className="px-3 py-2 font-medium">{t("users.management.table.headers.role")}</th>
              <th className="px-3 py-2 font-medium">{t("users.management.table.headers.picture")}</th>
              <th className="px-3 py-2 font-medium">{t("users.management.table.headers.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isBusy = busyUserId === user.id;
              const isSelf = user.id === currentUserId;

              return (
                <tr key={user.id} className="border-t align-top">
                  <td className="px-3 py-2">{user.name}</td>
                  <td className="px-3 py-2">{user.email}</td>
                  <td className="px-3 py-2">{t(`common.roles.${user.role}`)}</td>
                  <td className="px-3 py-2">{user.picturePath ?? t("users.management.table.emptyPicture")}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleStartEdit(user)}
                      >
                        {t("common.actions.edit")}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isBusy || isSelf}
                        onClick={() => handleDeleteUser(user)}
                      >
                        {t("common.actions.delete")}
                      </Button>
                    </div>
                    {isSelf ? (
                      <p className="mt-1 text-xs text-muted-foreground">{t("users.management.cannotDeleteSelf")}</p>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingUser ? (
        <section className="space-y-3 rounded-lg border p-4">
          <h2 className="font-medium">{t("users.management.editing", { name: editingUser.name })}</h2>
          <Form {...editForm}>
            <form className="space-y-3" onSubmit={handleSaveEdit}>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <UserFormFields control={editForm.control} mode="edit" />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={busyUserId === editingUser.id || editForm.formState.isSubmitting}
                >
                  {t("common.actions.saveChanges")}
                </Button>
                <Button type="button" variant="outline" onClick={resetEditing}>
                  {t("common.actions.cancel")}
                </Button>
              </div>
            </form>
          </Form>
        </section>
      ) : null}
    </section>
  );
}

