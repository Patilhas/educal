interface ApiSuccessPayload<T> {
  data: T;
}

const MAX_ERROR_TEXT_LENGTH = 500;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const readResponseBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
};

const getMessageFromPayload = (payload: unknown): string | null => {
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const lower = trimmed.toLowerCase();
    if (lower.startsWith("<!doctype html") || lower.startsWith("<html")) {
      return null;
    }

    if (trimmed.length > MAX_ERROR_TEXT_LENGTH) {
      return null;
    }

    return trimmed;
  }

  if (!isRecord(payload)) {
    return null;
  }

  const error = payload.error;
  if (!isRecord(error)) {
    return null;
  }

  return typeof error.message === "string" && error.message.trim().length > 0
    ? error.message
    : null;
};

export const getApiErrorMessage = async (
  response: Response,
  fallbackMessage?: string,
): Promise<string> => {
  const payload = await readResponseBody(response);

  const statusFallbackMessage =
    response.status === 404
      ? "Endpoint nao encontrado"
      : "Falha ao comunicar com o backend";

  return getMessageFromPayload(payload) ?? fallbackMessage ?? statusFallbackMessage;
};

export const requestJson = async <T>(
  url: string,
  init?: RequestInit,
  fallbackMessage?: string,
): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, fallbackMessage));
  }

  const payload = (await readResponseBody(response)) as ApiSuccessPayload<T> | null;
  if (!payload || !isRecord(payload) || !("data" in payload)) {
    throw new Error("Resposta invalida do servidor");
  }

  return payload.data;
};




