import * as chrono from "chrono-node";

export function parseDateTime(
  dateTimeStr: string,
): { date: Date; reference: string } | null {
  const parsed = chrono.parseDate(dateTimeStr);

  if (!parsed) {
    return null;
  }

  return {
    date: parsed,
    reference: dateTimeStr,
  };
}
