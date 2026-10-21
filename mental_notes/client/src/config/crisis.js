// Crisis resources shown on the result page when the self-harm question is
// answered above 0.
//
// Last checked: 21 October 2026. Sources:
//  - SURPIN numbers: LifeLine International (lifeline-international.com),
//    page updated June 2025
//  - Asido Foundation: same LifeLine International page
//  - She Writes Woman line: launched October 2020 (Nigeria Health Watch),
//    still listed as 24/7 toll-free on their funding material
//  - 112: adopted by the National Economic Council in April 2026 as the
//    single national emergency number; state rollout is still in progress
//
// IMPORTANT: phone lines change. Call each number yourself before launch and
// review this list every few months. Remove any entry that no longer answers.
export const CRISIS_REGION = "Nigeria";

export const CRISIS_RESOURCES = [
  {
    name: "Emergency services (112)",
    contact: "112",
    tel: "112",
    note: "Nigeria's toll-free national emergency number. Rollout across states is still in progress, so it may not connect everywhere.",
  },
  {
    name: "SURPIN suicide helpline",
    contact: "0800 078 7746",
    tel: "08000787746",
    note: "Toll-free, 24 hours. Other lines: 0903 440 0009, 0908 021 7555. Hausa: 0814 224 1007.",
  },
  {
    name: "She Writes Woman helpline",
    contact: "0800 800 2000",
    tel: "08008002000",
    note: "Toll-free, with trained counsellors.",
  },
  {
    name: "Asido Foundation",
    contact: "0902 808 0416",
    tel: "09028080416",
    note: "Call, SMS or WhatsApp. A counsellor calls you back for free.",
  },
];
