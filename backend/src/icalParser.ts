export interface IcalEvent {
  summary: string;
  description?: string;
  date?: string;
}

function unfold(text: string): string[] {
  const rawLines = text.replace(/\r\n/g, '\n').split('\n');
  const lines: string[] = [];
  for (const line of rawLines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function unescape(v: string): string {
  return v.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/gi, '\n').replace(/\\\\/g, '\\');
}

function parseDate(value: string): string | undefined {
  const compact = value.replace(/[TZ]/g, '');
  if (compact.length >= 8) {
    const y = compact.slice(0, 4);
    const m = compact.slice(4, 6);
    const d = compact.slice(6, 8);
    if (/^\d{4}$/.test(y) && /^\d{2}$/.test(m) && /^\d{2}$/.test(d)) {
      return `${y}-${m}-${d}`;
    }
  }
  return undefined;
}

export function parseIcal(text: string): IcalEvent[] {
  const lines = unfold(text);
  const events: IcalEvent[] = [];
  let current: Partial<IcalEvent> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (trimmed === 'END:VEVENT') {
      if (current && current.summary) events.push(current as IcalEvent);
      current = null;
      continue;
    }
    if (!current) continue;

    const sep = line.indexOf(':');
    if (sep === -1) continue;
    const key = line.slice(0, sep);
    const value = line.slice(sep + 1);
    const baseKey = key.split(';')[0].toUpperCase();

    if (baseKey === 'SUMMARY') current.summary = unescape(value).trim();
    else if (baseKey === 'DESCRIPTION') current.description = unescape(value).trim();
    else if (baseKey === 'DTSTART') current.date = parseDate(value.trim());
  }

  return events;
}
