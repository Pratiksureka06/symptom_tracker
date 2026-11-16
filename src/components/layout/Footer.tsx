import React from 'react';
import { Link } from 'react-router-dom';

/* ---------------------------------------------------------------------------
   Footer — blueprint "Name first, places under it".

   The name opens the footer instead of closing it, set large enough that the
   section crops the letters along the bottom. No sitemap columns, no social
   row, no centred copyright stack, no rule above it: those are the shape
   every generated footer takes.

   The links run the full width in two columns rather than sitting in one
   half, so the frame closes on both sides.
--------------------------------------------------------------------------- */

const links = [
  { to: '/symptom-checker', label: 'Check a symptom' },
  { to: '/doctors', label: 'Find a doctor' },
  { to: '/history', label: 'Your past checks' },
  { to: '/medication', label: 'Your medicines' },
  { to: '/analytics', label: 'Your health over time' },
  { to: '/my-consultations', label: 'Your consultations' },
];

const Footer: React.FC = () => {
  return (
    <footer className="bg-field-close text-field-close-ink">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10 lg:px-12">
        {/* The wordmark, cropped by the bottom edge of the section. */}
        <div className="overflow-hidden pt-16" aria-hidden="true">
          <p className="font-display -mb-[0.12em] select-none text-[16vw] leading-[0.9] text-field-close-ink">
            MediScan
          </p>
        </div>

        <nav aria-label="Footer" className="mt-16">
          <h2 className="sr-only">Go to</h2>
          <ul className="grid grid-cols-1 gap-x-12 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {links.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-lead text-field-close-ink hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-wrap items-baseline justify-between gap-4 py-12">
          <Link to="/symptom-checker" className="text-small text-field-close-ink hover:underline">
            Start a check
          </Link>
          <a href="#main-content" className="text-small text-field-close-ink hover:underline">
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
