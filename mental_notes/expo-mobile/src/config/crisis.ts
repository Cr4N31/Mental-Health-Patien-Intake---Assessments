export type CrisisResource = {
  label: string;
  note?: string;
  phone?: string;
};

export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    label: "Tele-MANAS (India national mental health helpline)",
    note: "Free, 24 hours a day, in many Indian languages. Run by the Government of India.",
    phone: "14416",
  },
  {
    label: "Tele-MANAS (toll-free alternative)",
    note: "Same service, full toll-free number.",
    phone: "1800 891 4416",
  },
  {
    label: "KIRAN mental health helpline",
    note: "Free, 24 hours a day. Run by the Ministry of Social Justice and Empowerment.",
    phone: "1800 599 0019",
  },
  {
    label: "National emergency number",
    note: "If you are in immediate danger. Free.",
    phone: "112",
  },
  // Add AASRA, iCall or Vandrevala Foundation here ONLY after you have
  // confirmed the number on their official website and by calling it.
];

export const EMERGENCY_NOTE =
  "If you are in immediate danger or have already hurt yourself, call 112 now or go to the nearest hospital emergency department. If you can, tell someone close to you what is happening.";
