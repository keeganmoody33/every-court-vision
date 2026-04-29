function isoMinuteSlot(date: Date, slotMinutes: number) {
  const slotMs = slotMinutes * 60 * 1000;
  return new Date(Math.floor(date.getTime() / slotMs) * slotMs).toISOString();
}

export function manualAcquisitionKey(surfaceId: string, now = new Date()) {
  return `${surfaceId}:manual:${now.toISOString()}`;
}

export function cronAcquisitionKey(surfaceId: string, now = new Date()) {
  return `${surfaceId}:cron:${isoMinuteSlot(now, 15)}`;
}

export function backfillAcquisitionKey(surfaceId: string, now = new Date()) {
  return `${surfaceId}:backfill-${now.toISOString().slice(0, 10)}`;
}
