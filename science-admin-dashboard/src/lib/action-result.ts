import { getErrorMessage } from "@/lib/api";

export type ActionResult<T> =
    | { ok: true; data: T; message?: string }
    | { ok: false; error: string };

export async function toActionResult<T>(callback: () => Promise<T>): Promise<ActionResult<T>> {
    try {
        const data = await callback();
        return { ok: true, data };
    } catch (error) {
        return { ok: false, error: getErrorMessage(error) };
    }
}