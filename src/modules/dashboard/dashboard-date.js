import "server-only";

function getBangkokParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",

    year: "numeric",

    month: "2-digit",

    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return {
    year: Number(values.year),

    month: Number(values.month),

    day: Number(values.day),
  };
}

function toDateKey({ year, month, day }) {
  return [
    String(year).padStart(4, "0"),

    String(month).padStart(2, "0"),

    String(day).padStart(2, "0"),
  ].join("-");
}

function addDays(date, amount) {
  const copy = new Date(date.getTime());

  copy.setUTCDate(copy.getUTCDate() + amount);

  return copy;
}

function getBangkokDateKey(date) {
  return toDateKey(getBangkokParts(date));
}

export function resolveDashboardDateKeys(range) {
  const now = new Date();

  const todayKey = getBangkokDateKey(now);

  if (range === "today") {
    return [todayKey];
  }

  if (range === "month") {
    const { year, month, day } = getBangkokParts(now);

    const keys = [];

    for (let current = 1; current <= day; current += 1) {
      keys.push(
        toDateKey({
          year,
          month,
          day: current,
        }),
      );
    }

    return keys;
  }

  const days = range === "30d" ? 30 : 7;

  const keys = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    keys.push(getBangkokDateKey(addDays(now, -offset)));
  }

  return keys;
}
