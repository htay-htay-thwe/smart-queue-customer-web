export function parseShopQr(raw: string): { shopId?: string; code?: string } {
  const value = raw.trim();
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    const data = parsed?.data ?? parsed;
    return { shopId: String(data?.shop_id ?? data?.shopId ?? "") || undefined, code: String(data?.queue_qr ?? data?.queueQr ?? "") || undefined };
  } catch {
    try {
      const url = new URL(value);
      return { shopId: url.searchParams.get("shop_id") || url.searchParams.get("shopId") || undefined, code: url.searchParams.get("queue_qr") || url.searchParams.get("code") || undefined };
    } catch { return {}; }
  }
}
