import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { DomainError } from "@/server/shared/domain-error";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(error: unknown) {
  if (error instanceof DomainError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? null,
        },
      },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Dados inválidos",
          details: z.treeifyError(error)
        },
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Erro interno no servidor",
      },
    },
    { status: 500 },
  );
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new DomainError("VALIDATION_ERROR", 400, "JSON inválido no corpo da requisição");
  }
}

