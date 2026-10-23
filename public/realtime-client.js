import { upload } from "@vercel/blob/client";

export function subscribeToChanges(_config, onEvent, onStatus) {
  let stopped = false;
  let initialized = false;
  let cursor = "0";
  let timer;

  async function poll() {
    if (stopped) return;
    let delay = 2000;
    try {
      const response = await fetch(`/api/sync-events?after=${encodeURIComponent(cursor)}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Unable to load live updates.");
      if (!Array.isArray(payload.events) || typeof payload.lastEventId !== "string") {
        throw new Error("The live update response was invalid.");
      }

      if (!initialized) {
        cursor = payload.lastEventId;
        initialized = payload.events.length === 0;
        if (initialized) onStatus("SUBSCRIBED");
        else delay = 0;
      } else {
        for (const event of payload.events) {
          if (typeof event.id !== "string" || typeof event.event !== "string") {
            throw new Error("The live update response contained an invalid event.");
          }
          cursor = event.id;
          onEvent(event.event);
        }
        if (payload.events.length === 100) delay = 0;
        onStatus("SUBSCRIBED");
      }
    } catch (error) {
      onStatus("CHANNEL_ERROR");
      console.error("Unable to poll cloud live updates:", error);
      delay = 5000;
    }
    if (!stopped) timer = setTimeout(poll, delay);
  }

  void poll();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}

export async function uploadWorkFile(ticket, file) {
  return upload(ticket.storagePath, file, {
    access: "private",
    handleUploadUrl: ticket.uploadTokenUrl,
    clientPayload: JSON.stringify({ ticketId: ticket.ticketId }),
    contentType: file.type,
    multipart: file.size > 4 * 1024 * 1024,
  });
}
