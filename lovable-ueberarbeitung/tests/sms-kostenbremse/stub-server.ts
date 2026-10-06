export const kopf: Record<string, string> = { "x-forwarded-for": "203.0.113.7" };
export const getRequestHeader = (k: string) => kopf[k];
