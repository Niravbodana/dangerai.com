/** Indian festival & fasting hints for meal planning (2026). */

export const FESTIVAL_CALENDAR = [
  { date: "2026-01-14", name: "Makar Sankranti", nameHi: "मकर संक्रांति", tags: ["festive", "sweet"], noOnionGarlic: false },
  { date: "2026-01-26", name: "Republic Day", nameHi: "गणतंत्र दिवस", tags: ["festive"], noOnionGarlic: false },
  { date: "2026-02-14", name: "Mahashivratri", nameHi: "महाशिवरात्रि", tags: ["fasting"], noOnionGarlic: true },
  { date: "2026-03-14", name: "Holi", nameHi: "होली", tags: ["festive", "sweet"], noOnionGarlic: false },
  { date: "2026-03-30", name: "Ugadi / Gudi Padwa", nameHi: "उगादी", tags: ["festive"], noOnionGarlic: false },
  { date: "2026-04-02", name: "Ram Navami", nameHi: "राम नवमी", tags: ["fasting"], noOnionGarlic: true },
  { date: "2026-04-14", name: "Baisakhi / Vishu", nameHi: "बैसाखी", tags: ["festive"], noOnionGarlic: false },
  { date: "2026-08-15", name: "Independence Day", nameHi: "स्वतंत्रता दिवस", tags: ["festive"], noOnionGarlic: false },
  { date: "2026-08-28", name: "Janmashtami", nameHi: "जन्माष्टमी", tags: ["fasting", "sweet"], noOnionGarlic: true },
  { date: "2026-09-14", name: "Ganesh Chaturthi", nameHi: "गणेश चतुर्थी", tags: ["festive", "sweet"], noOnionGarlic: false },
  { date: "2026-10-02", name: "Gandhi Jayanti", nameHi: "गांधी जयंती", tags: ["festive"], noOnionGarlic: false },
  { date: "2026-10-20", name: "Dussehra", nameHi: "दशहरा", tags: ["festive"], noOnionGarlic: false },
  { date: "2026-11-08", name: "Diwali", nameHi: "दीवाली", tags: ["festive", "sweet"], noOnionGarlic: false },
  { date: "2026-11-09", name: "Govardhan Puja", nameHi: "गोवर्धन पूजा", tags: ["festive"], noOnionGarlic: false },
  { date: "2026-11-11", name: "Bhai Dooj", nameHi: "भाई दूज", tags: ["festive"], noOnionGarlic: false },
];

/** Weekday fast rules (0=Sun). Tuesday/Saturday common no-onion-garlic days. */
export const WEEKDAY_FAST_RULES = {
  2: { label: "Tuesday fast", noOnionGarlic: true },
  6: { label: "Saturday fast", noOnionGarlic: true },
};

export function getFestivalForDate(dateStr) {
  return FESTIVAL_CALENDAR.find((f) => f.date === dateStr) || null;
}

export function getUpcomingFestivals(withinDays = 21) {
  const now = new Date();
  const limit = withinDays * 86400000;
  return FESTIVAL_CALENDAR.filter((f) => {
    const t = new Date(f.date).getTime();
    return t >= now.getTime() - 86400000 && t - now.getTime() <= limit;
  });
}

export function getDayPlanningHints(dateStr) {
  const festival = getFestivalForDate(dateStr);
  const d = new Date(dateStr);
  const weekday = WEEKDAY_FAST_RULES[d.getDay()];
  return {
    festival,
    weekdayFast: weekday || null,
    noOnionGarlic: Boolean(festival?.noOnionGarlic || weekday?.noOnionGarlic),
    preferSweet: Boolean(festival?.tags?.includes("sweet")),
    preferFestive: Boolean(festival?.tags?.includes("festive")),
  };
}
