import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "surface-iq",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
