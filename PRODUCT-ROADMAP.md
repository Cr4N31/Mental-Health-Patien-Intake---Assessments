# PranatiX product roadmap

**Status:** Proposed sequence, based on the PranatiX Product Documentation (v1.0 MVP) and the current Mental Notes workspace.

## Product direction

Mental Notes is the existing product foundation and the Journal module is one part of the larger PranatiX experience. The product documentation groups the experience into four connected modules:

1. **Echo** — conversational emotional support and the main activation path.
2. **Reflections** — journaling, mood tracking, and insights. The current Mental Notes Journal work is the foundation for this module.
3. **Resonance** — anonymous peer sharing, reactions, comments, and moderation.
4. **Allies** — discovery and booking with verified mental health professionals.

The intended loop is **Echo → Reflections → Resonance → Allies**. Keep the current Expo app as the mobile shell, then add modules as independently navigable features over shared authentication, API, data, safety, and design foundations.

## Current baseline

- `mental_notes/expo-mobile` is a React Native / Expo Router application with native authentication, profile/settings, PHQ-9/GAD-7 screening, results, and history.
- The app talks to an Express/MongoDB API using a bearer token stored in Expo SecureStore.
- The mounted backend currently exposes auth and patient assessments.
- Therapist, client, and note models/routes are present, but the therapist-side routes are explicitly not mounted in `server/server.js`. They are a useful starting point for the clinical workflow, not a complete or currently available product module.
- The root README and development summary describe an earlier backend/frontend state and do not fully reflect the newer Expo app. Reconcile project documentation as part of the foundation work.
- The product PDF is a first-draft product direction. It names features and principles, but does not settle clinical protocols, data retention, moderation operations, professional verification criteria, jurisdictional requirements, or detailed booking/payment behavior.

## Recommended roadmap

### Phase 0 — Product and platform foundation

**Goal:** Make the existing app a safe, coherent host for multiple modules before adding high-risk interactions.

- Reconcile product naming and scope: Mental Notes as the current app/workspace and PranatiX as the broader product, or settle the final naming before user-facing expansion.
- Audit current Expo routes, auth state, API configuration, navigation, and design tokens; define a module-aware home/navigation model that preserves the existing screening workflows.
- Reconcile the root README, development summary, and migration plan with the actual Expo and server state.
- Define shared account/profile, consent, data export/deletion, notification preferences, and module access patterns.
- Write privacy and safety requirements before storing conversational content: data classification, retention/deletion, access controls, encryption, logging redaction, crisis response boundaries, and consent language.
- Map the current assessment models/routes to therapist/client data needs. Resolve whether this is a single patient account model or two distinct user roles before reactivating therapist routes; avoid implicitly joining patient and clinician records.

**Exit criteria:** One documented app architecture and API boundary; user roles and data ownership are explicit; privacy/safety requirements and open decisions are recorded; current Expo screening experience remains reachable.

### Phase 1 — Reflections: complete the Journal module

**Goal:** Turn the current Journal work into the first complete product pillar and source of structured wellness data.

- Inventory what is already implemented in the Journal module and keep working flows intact.
- Provide create, edit, date-based browse, and delete for private journal entries, with prompt-based and free-writing options.
- Add a lightweight daily mood check-in, mood scale, optional emotion tags, and optional note.
- Add clear empty, loading, offline/error, and saved states; support local draft recovery if compatible with the current architecture.
- Build basic weekly summaries and transparent pattern highlights only after adequate history exists. Make suggestions gentle, explain the data window, and avoid diagnosis or claims of clinical inference.
- Add user controls for deleting entries and associated mood data.

**Exit criteria:** Journal and mood data are private to the account; users can review and delete them; summaries can be traced to visible records and do not present themselves as diagnoses.

### Phase 2 — Echo: bounded AI companion

**Goal:** Deliver the primary expression and activation path with clear, tested limits.

- Define the first-use flow, conversation lifecycle, prompt modes, and user controls (new chat, history, delete, stop/clear context).
- Implement a backend-mediated AI service; keep provider credentials off-device and isolate model calls from the mobile client.
- Use an explicit consent step before sending sensitive text to an AI provider. State what is sent, stored, and retained.
- Establish an empathetic, non-clinical response policy: acknowledge, validate, offer a small next step; no diagnosis, treatment claims, or fabricated professional credentials.
- Add crisis and high-risk handling designed with qualified clinical/safety input, including clear limits and region-appropriate emergency/support resources. Do not rely on the model alone to detect or manage emergencies.
- Add rate limits, cost controls, abuse monitoring that minimizes sensitive logging, and fallback/error behavior.
- Build an opt-in bridge from a conversation to a private Journal entry; never silently use Journal history as model context.

**Exit criteria:** A user can start and delete a conversation; AI use and data handling are disclosed; backend controls access and cost; safety behavior has a documented review and escalation path.

### Phase 3 — Allies: professional discovery and connection

**Goal:** Offer a trustworthy human-support path before introducing open peer interaction.

- Decide the initial service model: directory/referral, consultation request, or in-app booking. Start with one narrow geography and a manually curated provider cohort.
- Define credential checks, renewal/revocation, specialties, availability, transparent pricing, and complaint handling with qualified operational/legal input.
- Build professional profiles, searchable/filterable discovery, and a low-friction contact or booking request.
- Make recommendations user-controlled and non-coercive. Any contextual nudge should be explainable and should not infer a diagnosis from mood or chat content.
- Add appointment status, cancellation/support handling, and clear boundaries around what the platform does and does not provide.
- Only add payments or commissions after provider operations and the booking journey are validated.

**Exit criteria:** Provider credentials and status are auditable; users can understand price and next steps before requesting support; no automated pattern trigger is treated as clinical triage.

### Phase 4 — Resonance: anonymous community, behind a safety gate

**Goal:** Enable supportive peer connection only when moderation and anonymity are operationally real.

- Specify the anonymity model and threat cases. Separate public pseudonyms/content from account identity; prevent accidental identity exposure in APIs, logs, analytics, and support tooling.
- Start with a small, moderated cohort and limited post formats. Add feed, anonymous posting/commenting, and supportive reactions without public popularity rankings.
- Build report/block controls, moderation queues, content policies, escalation procedures, appeal handling, and staffed coverage expectations before opening posting broadly.
- Add rate limits, spam/abuse controls, crisis-content handling, and a visible route to immediate support.
- Measure safety and quality (report rates, time to review, harmful-content recurrence, user-reported sense of safety), not only posting volume.

**Exit criteria:** Moderation has named ownership and response targets; reports and blocks work end to end; anonymity claims match the technical data model; crisis and harmful-content procedures have been exercised.

### Phase 5 — Connect the loop and learn

**Goal:** Make the four modules feel like one product and improve based on user outcomes.

- Add explicit transitions: Echo → optional Journal reflection; Resonance → optional private reflection; Reflections → user-directed Allies discovery.
- Add a calm home screen with one primary action and secondary module entry points, consistent with the PDF's home UX direction.
- Instrument privacy-minimized product analytics for activation, meaningful interactions, retention, and support discovery. Do not include journal/chat content in analytics.
- Run a closed beta with a narrow student/early-professional cohort; conduct usability and safety reviews before growth campaigns.
- Review accessibility, localization, account deletion, incident response, and release operations across all modules.

**Exit criteria:** Users can move between modules without repeated onboarding; each transition is optional and understandable; product and safety metrics inform the next release.

## Cross-cutting workstreams

| Workstream | Needed across | Minimum direction |
|---|---|---|
| Identity and authorization | All phases | Define patient/member and professional roles, ownership checks, and least-privilege access before exposing therapist routes. |
| Privacy and data lifecycle | Journal, Echo, Allies, Resonance | Minimize collection; document purpose, retention, deletion, export, and third-party processing for each data type. |
| Safety and clinical boundaries | Echo, Allies, Resonance | Use qualified review for crisis handling and professional claims; maintain clear non-diagnostic product language. |
| Observability | All phases | Track service health and aggregate product events while redacting sensitive content and credentials. |
| Accessibility and inclusive UX | All phases | Support assistive technology, readable contrast, low cognitive load, and respectful non-clinical language. |
| Operations | Allies, Resonance, launch | Assign owners and response expectations for provider verification, user reports, incidents, and support requests. |

## Suggested sequencing and dependencies

```text
Phase 0: Foundation and decisions
        ↓
Phase 1: Reflections / Journal completion
        ↓
Phase 2: Echo (bounded AI)
        ↓
Phase 3: Allies (curated human support)
        ↓
Phase 4: Resonance (only after moderation readiness)
        ↓
Phase 5: Cross-module loop, beta learning, expansion
```

Phases can overlap for design discovery, but implementation should respect these dependencies. In particular, privacy and safety decisions precede sensitive data flows; moderation readiness precedes public community posting; provider verification precedes provider discovery or booking.

## Decisions to resolve before implementation

1. Is **PranatiX** the final product name, with **Mental Notes** retained as the Journal/module name or repository name?
2. Is the initial audience adult-only? The product personas include users as young as 16, which changes consent, privacy, and safety requirements.
3. Is the current assessment app a distinct patient-facing product, or is it intended to become part of the unified PranatiX member experience?
4. Which launch country/region and language should guide crisis resources, privacy review, professional credentials, and booking operations?
5. For Echo, which AI provider/data-retention terms are acceptable, and will conversation history be stored by default?
6. For Allies, is the first release a directory/referral or an actual booking/payment marketplace?
7. Who owns moderation and crisis escalation coverage before Resonance opens to users?

## First implementation slice

Start with **Phase 0 plus a Journal/Reflections gap review**. Produce a short architecture decision record for roles/data ownership, a data inventory for journal and assessment records, and an Expo route/API map. Then implement only the highest-priority Journal gaps. This stabilizes the existing app and creates the user-owned history that later modules can connect to with explicit consent.

## Source notes

- Product direction: `PranatiX Product Documentation.pdf` (v1.0 MVP, first draft), especially sections 5–8 and 12.
- Repository evidence: `mental_notes/expo-mobile`, `mental_notes/server/server.js`, `mental_notes/server/models`, `mental_notes/server/routes`, and `mental_notes/MIGRATION_PLAN.md`.
- This roadmap is a proposed delivery sequence, not a claim that the PDF's feature descriptions or suggested benchmarks have been validated.
