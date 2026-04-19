"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { loginFormSchema, type TLoginFormValues } from "@/features/auth/schemas";
import { requestJson } from "@/lib/api-client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<TLoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      staySignedIn: true,
    },
  });

  const onSubmit = async (values: TLoginFormValues) => {
    setError(null);

    try {
      await requestJson<{ user: unknown }>("/api/auth/loginaaa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      }, "Nao foi possivel autenticar.");

      router.replace("/");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro ao fazer login.");
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 rounded-xl border p-6 shadow-sm"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  className={fieldState.invalid ? "border-red-500" : ""}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  className={fieldState.invalid ? "border-red-500" : ""}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="staySignedIn"
          render={({ field }) => (
            <FormItem>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
                Manter sessao iniciada
              </label>
            </FormItem>
          )}
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "A entrar..." : "Entrar"}
        </Button>
      </form>
    </Form>
  );
}

