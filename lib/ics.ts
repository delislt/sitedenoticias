type CalendarSession = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  updated_at: string;
  status: string;
  summary?: string;
};
const escapeText = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
const utc = (d: string) =>
  new Date(d)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
function fold(line: string) {
  let result = "";
  let length = 0;
  for (const char of line) {
    const bytes = Buffer.byteLength(char);
    if (length + bytes > 75) {
      result += "\r\n ";
      length = 1;
    }
    result += char;
    length += bytes;
  }
  return result;
}
export function calendar(sessions: CalendarSession[], base: string) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Jornal SIS//Agenda da Simulacao//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Agenda do SIS",
    "X-WR-TIMEZONE:America/Sao_Paulo",
  ];
  for (const s of sessions)
    lines.push(
      "BEGIN:VEVENT",
      "UID:" + s.id + "@sisnoticias.vercel.app",
      "DTSTAMP:" + utc(s.updated_at),
      "DTSTART:" + utc(s.starts_at),
      "DTEND:" + utc(s.ends_at),
      "SUMMARY:" + escapeText("SIS · " + s.title),
      "DESCRIPTION:" + escapeText("Simulação acadêmica. " + (s.summary || "")),
      "URL:" + base + "/sessao/" + s.id,
      "STATUS:" + (s.status === "cancelled" ? "CANCELLED" : "CONFIRMED"),
      "END:VEVENT",
    );
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
