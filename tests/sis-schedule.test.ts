import assert from "node:assert/strict";
import test from "node:test";
import { calendar } from "../lib/ics";
import {
  countdown,
  dayStatus,
  generalCalendarDays,
  sisDays,
  sisStatus,
} from "../lib/sis-schedule";

test("status changes exactly at each start and end in Brasília time", () => {
  const cases = [
    ["2026-10-23T07:29:59-03:00", "upcoming"],
    ["2026-10-23T07:30:00-03:00", "first-live"],
    ["2026-10-23T12:59:59-03:00", "first-live"],
    ["2026-10-23T13:00:00-03:00", "between-days"],
    ["2026-10-24T07:29:59-03:00", "between-days"],
    ["2026-10-24T07:30:00-03:00", "second-live"],
    ["2026-10-24T11:59:59-03:00", "second-live"],
    ["2026-10-24T12:00:00-03:00", "finished"],
  ];
  for (const [time, phase] of cases)
    assert.equal(sisStatus(Date.parse(time)).phase, phase, time);
  assert.equal(
    sisStatus(Date.parse("2026-10-24T10:30:00Z")).phase,
    "second-live",
  );
  assert.equal(
    dayStatus(sisDays[0], Date.parse(sisDays[0].ends_at)),
    "Encerrado",
  );
  assert.equal(
    dayStatus(sisDays[1], Date.parse(sisDays[0].ends_at)),
    "Agendado",
  );
});

test("countdown never goes negative", () => {
  const start = sisDays[0].starts_at;
  assert.equal(
    countdown(start, Date.parse(start) - 86401000),
    "1d 00h 00min 01s",
  );
  assert.equal(countdown(start, Date.parse(start) + 1000), "00h 00min 00s");
});

test("calendar exports the two general days, respects filters and links to agenda", () => {
  const events = generalCalendarDays({});
  assert.equal(events.length, 2);
  assert.equal(generalCalendarDays({ day: "2026-10-23" }).length, 1);
  assert.equal(generalCalendarDays({ day: "2026-10-25" }).length, 0);
  assert.equal(generalCalendarDays({ category: "csnu" }).length, 0);
  const ics = calendar(events, "https://sisnoticias.vercel.app");
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2);
  for (const line of [
    "DTSTART:20261023T103000Z",
    "DTEND:20261023T160000Z",
    "DTSTART:20261024T103000Z",
    "DTEND:20261024T150000Z",
    "URL:https://sisnoticias.vercel.app/agenda",
  ])
    assert.ok(ics.includes(line), line);
  assert.ok(!ics.includes("/sessao/sis-2026"));
});
