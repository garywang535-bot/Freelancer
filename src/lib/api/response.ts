import { NextResponse } from "next/server";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  success: false;
  error: string;
  code?: string;
};

export function ok<T>(
  data: T,
  init?: ResponseInit & { meta?: Record<string, unknown> }
) {
  const { meta, ...responseInit } = init ?? {};
  return NextResponse.json(
    { success: true, data, ...(meta ? { meta } : {}) } satisfies ApiSuccess<T>,
    responseInit
  );
}

export function fail(error: string, status = 400, code?: string) {
  return NextResponse.json(
    { success: false, error, code } satisfies ApiError,
    { status }
  );
}
