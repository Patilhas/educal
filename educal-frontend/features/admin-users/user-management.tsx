"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const roleOptions: Array<{ value: TUserRole; label: string }> = [
    { value: "viewer", label: t("common.roles.viewer") },
    { value: "editor", label: t("common.roles.editor") },
    { value: "admin", label: t("common.roles.admin") },
  ];

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
      toast.info(t("users.management.edit.noChanges"))
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

      <form className="grid gap-3 rounded-lg border p-4 md:grid-cols-2 xl:grid-cols-5" onSubmit={handleCreateUser}>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="create-user-name">
            {t("users.management.create.fields.name")}
          </label>
          <Input id="create-user-name" {...createForm.register("name")} />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="create-user-email">
            {t("users.management.create.fields.email")}
          </label>
          <Input id="create-user-email" type="email" {...createForm.register("email")} />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="create-user-role">
            {t("users.management.create.fields.role")}
          </label>
          <select
            id="create-user-role"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            {...createForm.register("role")}
          >
            {roleOptions.map((roleOption) => (
              <option key={roleOption.value} value={roleOption.value}>
                {roleOption.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="create-user-picture-path">
            {t("users.management.create.fields.picturePath")}
          </label>
          <Input id="create-user-picture-path" placeholder={t("users.management.create.fields.picturePlaceholder")} {...createForm.register("picturePath")} />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="create-user-password">
            {t("users.management.create.fields.password")}
          </label>
          <Input id="create-user-password" type="password" {...createForm.register("password")} />
        </div>

        <div className="md:col-span-2 xl:col-span-5">
          <Button type="submit" disabled={createForm.formState.isSubmitting}>
            {createForm.formState.isSubmitting ? t("users.management.create.submitting") : t("users.management.create.submit")}
          </Button>
        </div>
      </form>

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
                  <td className="px-3 py-2">{user.role}</td>
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
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="edit-user-name">
                {t("users.management.edit.fields.name")}
              </label>
              <Input id="edit-user-name" {...editForm.register("name")} />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="edit-user-email">
                {t("users.management.edit.fields.email")}
              </label>
              <Input id="edit-user-email" type="email" {...editForm.register("email")} />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="edit-user-role">
                {t("users.management.edit.fields.role")}
              </label>
              <select
                id="edit-user-role"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                {...editForm.register("role")}
              >
                {roleOptions.map((roleOption) => (
                  <option key={roleOption.value} value={roleOption.value}>
                    {roleOption.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="edit-user-picture-path">
                {t("users.management.edit.fields.picturePath")}
              </label>
              <Input id="edit-user-picture-path" placeholder={t("users.management.edit.fields.picturePlaceholder")} {...editForm.register("picturePath")} />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="edit-user-password">
                {t("users.management.edit.fields.password")}
              </label>
              <Input
                id="edit-user-password"
                type="password"
                placeholder={t("users.management.edit.fields.passwordPlaceholder")}
                {...editForm.register("password")}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={busyUserId === editingUser.id || editForm.formState.isSubmitting}
            >
              {t("common.actions.saveChanges")}
            </Button>
            <Button type="button" variant="outline" onClick={resetEditing}>
              {t("common.actions.cancel")}
            </Button>
          </div>
        </section>
      ) : null}
    </section>
  );
}

