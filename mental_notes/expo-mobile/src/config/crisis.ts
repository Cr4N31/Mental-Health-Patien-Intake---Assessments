// Support resources shown when a journal entry or mood note suggests distress.
//
// Fill this list with resources you have verified yourself: call or check each
// one, and confirm it is current and works for your users' country. Do not ship
// this feature publicly with an empty or unchecked list.
//
// Example shape:
//   { label: "Name of the service", phone: "+000 000 000 000", note: "Hours or how it helps" }

export type CrisisResource = { label: string; phone?: string; note?: string };

export const CRISIS_RESOURCES: CrisisResource[] = [];

export const EMERGENCY_NOTE =
  "If you are in immediate danger, contact your local emergency services right now.";
