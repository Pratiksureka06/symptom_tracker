import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

/* ---------------------------------------------------------------------------
   Footer — blueprint "Name first, places under it".

   The name opens the footer instead of closing it, set large enough that the
   section crops the tops of the letters. No sitemap columns, no social row,
   no centred copyright stack, no rule above it: those are the shape every
   generated footer takes. The safety disclaimer is the one piece of real
   content here and it is given the width to actually be read.
--------------------------------------------------------------------------- */

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-field-close text-field-close-ink">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10 lg:px-12">
        {/* The wordmark, sliced by the top edge of the section. */}
        {/* Set to the page width, cropped by the bottom edge rather than the
            top: a wordmark sliced along its ascenders reads as a broken box. */}
        <div className="overflow-hidden pt-16" aria-hidden="true">
          <p className="font-display -mb-[0.12em] select-none text-[16vw] leading-[0.9] text-field-close-ink">
            MediScan
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 pb-4 lg:grid-cols-12">
          <nav aria-label="Footer" className="lg:col-span-5">
            <h2 className="sr-only">Go to</h2>
            <ul className="space-y-3">
              <li>
                <Link to="/symptom-checker" className="text-lead text-field-close-ink hover:underline">
                  Check a symptom
                </Link>
              </li>
              <li>
                <Link to="/doctors" className="text-lead text-field-close-ink hover:underline">
                  Find a doctor
                </Link>
              </li>
              <li>
                <Link to="/history" className="text-lead text-field-close-ink hover:underline">
                  Your past checks
                </Link>
              </li>
              <li>
                <Link to="/medication" className="text-lead text-field-close-ink hover:underline">
                  Your medicines
                </Link>
              </li>
            </ul>
          </nav>

          <div className="lg:col-span-7">
            <h2 className="text-lead text-field-close-ink">Please read this</h2>
            <p className="mt-4 max-w-xl text-body text-field-close-ink">{t('disclaimer')}</p>
            <p className="mt-4 max-w-xl text-body text-field-close-ink">
              MediScan ranks what your symptoms are consistent with. It cannot examine you, it does
              not know your history, and it is not a substitute for a doctor. If you think you are
              having an emergency, go to a hospital rather than finishing a check.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-4 py-10">
          <p className="text-small text-field-close-ink">
            A student project, {new Date().getFullYear()}. Built for coursework, not for clinical use.
          </p>
          <a href="#main-content" className="text-small text-field-close-ink hover:underline">
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
