import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReveal } from '../hooks/useReveal';

/* ---------------------------------------------------------------------------
   MediScan home page — direction "Colour chapters" (seed 1330060451).

   The idea: the four urgency levels MediScan sorts a patient into become the
   chapters the page is built from. Blue, amber, orange and red are the exact
   colours ConditionCard.tsx puts on a real result, so by the time a patient
   reaches their own answer they already know what the colour is telling them.
   Colour here is information, not decoration.

   House style: flat fields, no gradients, no shadows at rest, no hairline
   rules, no icon cards, no uppercase micro-labels. Two typefaces (Noto Serif
   for display, Noto Sans for text) because they are the only families that
   cover all nine scripts the language switcher offers.
--------------------------------------------------------------------------- */

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/* The one live thing: a patient types what they feel and sees that MediScan
   genuinely holds that symptom. Read-only; it calls the existing
   GET /api/symptoms endpoint and changes no behaviour anywhere else. */
const SymptomFinder: React.FC = () => {
  const [all, setAll] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`${API}/api/symptoms`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((list: string[]) => {
        if (live && Array.isArray(list)) setAll(list);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return all.filter((s) => s.toLowerCase().includes(q)).slice(0, 6);
  }, [query, all]);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="w-full max-w-xl">
      <label htmlFor="symptom-find" className="block text-body text-field-low-ink">
        What are you feeling right now?
      </label>

      <input
        id="symptom-find"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="headache, fever, chest pain"
        autoComplete="off"
        aria-describedby="symptom-find-note"
        className="mt-4 w-full bg-paper px-5 py-4 text-body text-onink placeholder:text-ink-soft focus:outline-none"
      />

      <div className="mt-5 min-h-[9.5rem]" aria-live="polite">
        {!hasQuery && (
          <p id="symptom-find-note" className="text-body text-field-low-ink">
            {all.length > 0
              ? `Start typing and we will show you which of our ${all.length} symptoms match.`
              : 'Start typing to search the symptom list.'}
          </p>
        )}

        {hasQuery && matches.length > 0 && (
          <ul className="space-y-2">
            {matches.map((m) => (
              <li key={m} className="text-body text-field-low-ink">
                {m}
              </li>
            ))}
          </ul>
        )}

        {hasQuery && matches.length === 0 && !failed && all.length > 0 && (
          <p className="text-body text-field-low-ink">
            Nothing matches that word. Try a simpler one, like pain or cough.
          </p>
        )}

        {failed && (
          <p className="text-body text-field-low-ink">
            The symptom list is offline just now. You can still open the checker.
          </p>
        )}
      </div>

      <Link
        to="/symptom-checker"
        className="mt-6 inline-block bg-paper px-8 py-4 text-body font-semibold text-onink transition-[background-color,transform] hover:bg-paper-step active:translate-y-px"
      >
        Start a check
      </Link>
    </div>
  );
};

/* A real fragment of the product, marked data-ui so it keeps the interface
   conventions (fills, chips) the house rules otherwise ban on the page. */
const ResultFragment: React.FC<{
  name: string;
  match: string;
  badge: string;
  badgeClass: string;
  barClass: string;
  inkClass: string;
  steps: string[];
}> = ({ name, match, badge, badgeClass, barClass, inkClass, steps }) => (
  <div className="w-full max-w-sm">
    <div data-ui className="w-full bg-white p-5 text-left">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-[1.0625rem] font-semibold leading-snug text-slate-900">{name}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.8125rem] font-medium ${badgeClass}`}>
          {badge}
        </span>
      </div>
      <p className="mt-3 text-[0.9375rem] text-slate-600">
        <span className="tabular font-semibold text-slate-900">{match}</span> match with your symptoms
      </p>
      <div className="mt-2 h-2 w-full bg-slate-100">
        <div className={`h-2 ${barClass}`} style={{ width: match }} />
      </div>
    </div>

    {/* What a patient is told to do next. Order is carried by the words, so
        the list is never numbered. */}
    <ul className={`mt-8 space-y-4 ${inkClass}`}>
      {steps.map((s) => (
        <li key={s} className="text-body">
          {s}
        </li>
      ))}
    </ul>
  </div>
);

const HomePage: React.FC = () => {
  useReveal();

  return (
    <div className="bg-paper">
      {/* ------------------------------------------------------------------
          CHAPTER 0 — paper. The first screen: what this is, and one thing
          the visitor can do without leaving.
      ------------------------------------------------------------------ */}
      <section className="bg-paper">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 lg:grid-cols-12">
          <div className="col-span-1 px-6 py-20 sm:px-10 lg:col-span-6 lg:py-32 lg:pl-12 lg:pr-16">
            <h1 data-reveal className="font-display text-display text-onink">Tell us what hurts.</h1>
            <p data-reveal data-reveal-delay="90" className="mt-10 max-w-xl text-lead text-onink">
              MediScan checks what you are feeling against 773 conditions and tells you how soon
              to see someone. It is free, it keeps your answers on your own device, and it speaks
              12 Indian languages.
            </p>
            <p data-reveal data-reveal-delay="170" className="mt-6 max-w-xl text-body text-ink-soft">
              It is not a diagnosis. It is a way to find out whether you need a doctor this week,
              today, or right now.
            </p>
          </div>

          <div className="col-span-1 bg-field-low px-6 py-16 sm:px-10 lg:col-span-6 lg:py-32 lg:pl-16 lg:pr-12">
            <SymptomFinder />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          CHAPTER 1 — paper step. How it works: three tiles that grow, so
          order is carried by size rather than by numbering.
      ------------------------------------------------------------------ */}
      <section className="bg-paper-step px-6 py-24 sm:px-10 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1400px]">
          <h2 data-reveal className="font-display text-head max-w-2xl text-onink">
            Three steps, about two minutes.
          </h2>

          <div className="mt-16 grid grid-cols-1 items-end gap-3 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <div data-reveal className="flex h-[30vh] min-h-[200px] items-center justify-center bg-field-low p-6">
                <div data-ui className="w-full bg-white p-4 text-left">
                  <p className="text-[0.9375rem] text-slate-500">Selected</p>
                  <p className="mt-2 text-[0.9375rem] font-medium text-slate-900">Sharp Chest Pain</p>
                  <p className="mt-1 text-[0.9375rem] font-medium text-slate-900">Breathing Fast</p>
                </div>
              </div>
              <h3 data-reveal data-reveal-delay="60" className="mt-6 text-lead text-onink">You describe it</h3>
              <p data-reveal data-reveal-delay="140" className="mt-3 max-w-xs text-body text-ink-soft">
                Pick from 377 symptoms, or just say them out loud in your own language.
              </p>
            </div>

            <div className="lg:col-span-4">
              <div data-reveal data-reveal-delay="90" className="flex h-[44vh] min-h-[280px] items-center justify-center bg-field-medium p-6">
                <div data-ui className="w-full max-w-xs bg-white p-4 text-left">
                  <p className="text-[0.9375rem] text-slate-500">Body system</p>
                  <p className="mt-2 text-[0.9375rem] font-semibold text-slate-900">Cardiovascular</p>
                  <p className="mt-3 text-[0.9375rem] text-slate-600">9 other systems set aside</p>
                </div>
              </div>
              <h3 data-reveal data-reveal-delay="60" className="mt-6 text-lead text-onink">We narrow it down</h3>
              <p data-reveal data-reveal-delay="140" className="mt-3 max-w-sm text-body text-ink-soft">
                Your symptoms are sorted into one of ten body systems first, so conditions from
                everywhere else drop out before anything is ranked.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div data-reveal data-reveal-delay="180" className="flex h-[60vh] min-h-[360px] items-center justify-center bg-field-high p-6">
                <div data-ui className="w-full max-w-sm bg-white p-5 text-left">
                  <p className="text-[0.9375rem] text-slate-500">Most likely</p>
                  <p className="mt-2 text-[1.0625rem] font-semibold text-slate-900">Angina</p>
                  <p className="mt-4 text-[0.9375rem] text-slate-500">Also consider</p>
                  <p className="mt-2 text-[0.9375rem] text-slate-900">Pericarditis</p>
                  <p className="mt-1 text-[0.9375rem] text-slate-900">Panic attack</p>
                </div>
              </div>
              <h3 data-reveal data-reveal-delay="60" className="mt-6 text-lead text-onink">You get three answers</h3>
              <p data-reveal data-reveal-delay="140" className="mt-3 max-w-md text-body text-ink-soft">
                One most-likely condition, two more to weigh against it, and a plain instruction
                about how soon to see a doctor. Doctors work from a shortlist too.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          CHAPTERS 2-5 — the urgency scale, one field each. This is the idea
          of the page: these four colours are the ones a real result wears.
      ------------------------------------------------------------------ */}
      <section className="bg-field-low px-6 py-24 sm:px-10 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <h2 data-reveal className="font-display text-head text-field-low-ink">Blue means it can wait.</h2>
            <p data-reveal data-reveal-delay="90" className="mt-8 max-w-xl text-lead text-field-low-ink">
              See a doctor when it suits you.
            </p>
            <p data-reveal data-reveal-delay="170" className="mt-6 max-w-xl text-body text-field-low-ink">
              Most of what people check turns out to be this. MediScan says so plainly instead of
              listing frightening possibilities, because the useful answer is often that nothing
              needs to happen today.
            </p>
          </div>
          <div data-reveal="aside" data-reveal-delay="140" className="flex lg:col-span-5 lg:justify-end">
            <ResultFragment
              name="Seasonal allergic rhinitis"
              match="71%"
              badge="Low Urgency"
              badgeClass="text-blue-800 bg-blue-50"
              barClass="bg-blue-800"
              inkClass="text-field-low-ink"
              steps={[
                'Read what the condition usually involves, in plain language.',
                'Keep the check, so you can show how long it has gone on.',
                'Book a routine appointment if it has not settled in a week.',
              ]}
            />
          </div>
        </div>
      </section>

      <section className="bg-field-medium px-6 py-24 sm:px-10 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <h2 data-reveal className="font-display text-head text-field-medium-ink">
              Amber means book this week.
            </h2>
            <p data-reveal data-reveal-delay="90" className="mt-8 max-w-xl text-lead text-field-medium-ink">
              Worth a proper appointment, not an emergency.
            </p>
            <p data-reveal data-reveal-delay="170" className="mt-6 max-w-xl text-body text-field-medium-ink">
              You get a summary you can hand over or send as a PDF, so the doctor starts from what
              you already told us rather than from the beginning.
            </p>
          </div>
          <div data-reveal="aside" data-reveal-delay="140" className="flex lg:col-span-5 lg:justify-end">
            <ResultFragment
              name="Iron deficiency anaemia"
              match="64%"
              badge="Medium Urgency"
              badgeClass="text-amber-800 bg-amber-50"
              barClass="bg-amber-800"
              inkClass="text-field-medium-ink"
              steps={[
                'Export the one-page summary before the appointment.',
                'Add the medicines you are already taking.',
                'Search the directory for a doctor in the right specialty.',
              ]}
            />
          </div>
        </div>
      </section>

      <section className="bg-field-high px-6 py-24 sm:px-10 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <h2 data-reveal className="font-display text-head text-field-high-ink">Orange means today.</h2>
            <p data-reveal data-reveal-delay="90" className="mt-8 max-w-xl text-lead text-field-high-ink">
              Be seen before the day is out.
            </p>
            <p data-reveal data-reveal-delay="170" className="mt-6 max-w-xl text-body text-field-high-ink">
              The doctor directory opens from the result with the nearest clinics, so finding
              someone is the next tap rather than a separate search.
            </p>
          </div>
          <div data-reveal="aside" data-reveal-delay="140" className="flex lg:col-span-5 lg:justify-end">
            <ResultFragment
              name="Acute pyelonephritis"
              match="58%"
              badge="High Urgency"
              badgeClass="text-orange-800 bg-orange-50"
              barClass="bg-orange-800"
              inkClass="text-field-high-ink"
              steps={[
                'Open the directory and find the nearest clinic still open.',
                'Take the summary with you rather than starting again.',
                'Go to an emergency department if it gets worse while you wait.',
              ]}
            />
          </div>
        </div>
      </section>

      <section className="bg-field-emergency px-6 py-24 sm:px-10 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <h2 data-reveal className="font-display text-head text-field-emergency-ink">Red means now.</h2>
            <p data-reveal data-reveal-delay="90" className="mt-8 max-w-xl text-lead text-field-emergency-ink">
              Stop reading and go to a hospital.
            </p>
            <p data-reveal data-reveal-delay="170" className="mt-6 max-w-xl text-body text-field-emergency-ink">
              When the answer is red, MediScan stops ranking conditions and says one thing only. A
              symptom checker that buries an emergency inside a list of possibilities has failed.
            </p>
          </div>
          <div data-reveal="aside" data-reveal-delay="140" className="flex lg:col-span-5 lg:justify-end">
            <ResultFragment
              name="Myocardial infarction"
              match="52%"
              badge="Emergency"
              badgeClass="text-red-800 bg-red-50"
              barClass="bg-red-800"
              inkClass="text-field-emergency-ink"
              steps={[
                'Go to the nearest emergency department, or call for an ambulance.',
                'Do not drive yourself.',
                'The check will still be here afterwards. It can wait. This cannot.',
              ]}
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          CHAPTER 6 — paper. What else it does, as plain filled panels
          rather than a row of icon cards.
      ------------------------------------------------------------------ */}
      <section className="bg-paper px-6 py-24 sm:px-10 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1400px]">
          <h2 data-reveal className="font-display text-head max-w-2xl text-onink">What else it does for you.</h2>

          <div className="mt-16 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div data-reveal className="bg-paper-step p-8">
              <h3 data-reveal className="text-lead text-onink">Twelve languages</h3>
              <p data-reveal data-reveal-delay="90" className="mt-4 text-body text-ink-soft">
                Hindi, Bengali, Telugu, Marathi, Tamil, Gujarati, Kannada, Malayalam, Punjabi,
                Assamese, Odia and English. The whole interface moves, not only the labels.
              </p>
            </div>
            <div data-reveal className="bg-paper-step p-8">
              <h3 data-reveal className="text-lead text-onink">Say it out loud</h3>
              <p data-reveal data-reveal-delay="90" className="mt-4 text-body text-ink-soft">
                Speak your symptoms instead of typing them. Useful if you are unwell, or if reading
                a long list in a second language is the harder way round.
              </p>
            </div>
            <div data-reveal className="bg-paper-step p-8">
              <h3 data-reveal className="text-lead text-onink">Works without signal</h3>
              <p data-reveal data-reveal-delay="90" className="mt-4 text-body text-ink-soft">
                Install it once and it keeps working offline. Your history stays on your device
                rather than on somebody else&rsquo;s server.
              </p>
            </div>
            <div data-reveal className="bg-paper-step p-8">
              <h3 data-reveal className="text-lead text-onink">A record over time</h3>
              <p data-reveal data-reveal-delay="90" className="mt-4 text-body text-ink-soft">
                Every check is kept, so you can show a doctor how long something has been going on
                instead of trying to remember.
              </p>
            </div>
            <div data-reveal className="bg-paper-step p-8">
              <h3 data-reveal className="text-lead text-onink">Medicines you are taking</h3>
              <p data-reveal data-reveal-delay="90" className="mt-4 text-body text-ink-soft">
                Log doses and keep them beside your symptoms, where they are actually useful to
                whoever sees you next.
              </p>
            </div>
            <div data-reveal className="bg-paper-step p-8">
              <h3 data-reveal className="text-lead text-onink">Something to hand over</h3>
              <p data-reveal data-reveal-delay="90" className="mt-4 text-body text-ink-soft">
                Export a one-page summary with your symptoms, the shortlist and the dates, ready
                for the consultation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          CHAPTER 7 — two figures on two fields.
      ------------------------------------------------------------------ */}
      <section className="bg-paper">
        <h2 className="sr-only">How much MediScan knows</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="bg-field-low px-6 py-20 sm:px-10 lg:px-12 lg:py-28">
            <p data-reveal data-reveal-delay="0" className="font-display text-head tabular text-field-low-ink">773</p>
            <p data-reveal data-reveal-delay="120" className="mt-6 max-w-sm text-body text-field-low-ink">
              conditions it can rank, from a public dataset of real symptom and disease records.
            </p>
          </div>
          <div className="bg-field-medium px-6 py-20 sm:px-10 lg:px-12 lg:py-28">
            <p data-reveal data-reveal-delay="0" className="font-display text-head tabular text-field-medium-ink">377</p>
            <p data-reveal data-reveal-delay="120" className="mt-6 max-w-sm text-body text-field-medium-ink">
              symptoms you can describe, in plain words rather than medical ones.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          CHAPTER 8 — the questions people actually have before trusting it.
      ------------------------------------------------------------------ */}
      <section className="bg-paper px-6 py-24 sm:px-10 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 data-reveal className="font-display text-head text-onink lg:sticky lg:top-28">
              Before you trust it.
            </h2>
          </div>

          <div className="space-y-2 lg:col-span-8">
            {[
              {
                q: 'Is this a diagnosis?',
                a: 'No, and it should never be read as one. MediScan ranks what your symptoms are consistent with and tells you how soon to see somebody. Only a doctor who can examine you can diagnose you.',
              },
              {
                q: 'Where do my answers go?',
                a: 'Your symptoms and your history are kept in your own browser. There is no account required to run a check, and nothing is sold to anyone.',
              },
              {
                q: 'What is it actually doing?',
                a: 'It sorts your symptoms into one of ten body systems, then ranks conditions within that system by how well they fit what you described. Narrowing first is what stops unrelated conditions appearing in your shortlist.',
              },
              {
                q: 'How accurate is it?',
                a: 'It is built on a public dataset of symptom and disease records, and it reports a percentage match rather than a certainty. Treat a high match as a reason to see somebody, not as an answer.',
              },
              {
                q: 'What if it says Emergency?',
                a: 'Go to a hospital. Do not wait to read the rest of the result, and do not use the app to decide whether the warning is serious enough.',
              },
              {
                q: 'Can I use it for someone else?',
                a: 'Yes. Answer for the person who is unwell rather than for yourself, and take the summary with you when you go.',
              },
            ].map(({ q, a }) => (
              <details key={q} name="mediscan-faq" className="group bg-paper-step p-6 transition-colors hover:bg-[rgb(var(--paper-step))]/70">
                <summary className="cursor-pointer list-none text-lead text-onink marker:content-none">
                  {q}
                </summary>
                <p className="mt-4 max-w-2xl text-body text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          CHAPTER 9 — the close, on the ink field the footer continues.
      ------------------------------------------------------------------ */}
      <section className="bg-field-close px-6 py-28 sm:px-10 lg:px-12 lg:py-36">
        <div className="mx-auto max-w-[1400px]">
          <h2 data-reveal className="font-display text-display max-w-3xl text-field-close-ink">
            Find out in two minutes.
          </h2>
          <p data-reveal data-reveal-delay="90" className="mt-10 max-w-xl text-lead text-field-close-ink">
            No account, no cost, and nothing leaves your phone.
          </p>
          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              to="/symptom-checker"
              className="bg-paper px-8 py-4 text-body font-semibold text-onink transition-[background-color,transform] hover:bg-paper-step active:translate-y-px"
            >
              Start a check
            </Link>
            {/* A plain link, not a second button: Tailwind's ring utilities
                compile to box-shadow, and one filled action per screen is the
                house rule. */}
            <Link
              to="/doctors"
              className="px-2 py-4 text-body font-semibold text-field-close-ink underline underline-offset-8 transition-opacity hover:opacity-70"
            >
              Find a doctor instead
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
