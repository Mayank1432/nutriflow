export const safeJsonParse = <T>(raw: string | null): T | null => {
  if (raw === null || raw.trim() === "") {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const safeJsonStringify = (value: unknown): string | null => {
  try {
    const serialized = JSON.stringify(value);
    return typeof serialized === "string" ? serialized : null;
  } catch {
    return null;
  }
};
