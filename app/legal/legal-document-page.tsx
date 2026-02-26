import Link from 'next/link';

import type { LegalDocument } from './legal-documents';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

interface LegalDocumentPageProps {
  document: LegalDocument;
}

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  return (
    <main className='min-h-screen bg-background text-foreground'>
      <div className='mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8'>
        <header className='mb-10 border-b pb-6'>
          <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>{document.title}</h1>
          <p className='mt-3 text-base leading-7 text-muted-foreground'>{document.summary}</p>
          <p className='mt-4 text-sm text-muted-foreground'>
            Effective date: {document.effectiveDate} | Last updated: {document.lastUpdated}
          </p>
        </header>

        <section className='mb-10 space-y-4'>
          {document.intro.map((paragraph) => (
            <p key={paragraph} className='text-base leading-7'>
              {paragraph}
            </p>
          ))}
        </section>

        <section className='mb-10 rounded-xl border p-5 sm:p-6'>
          <h2 className='text-lg font-medium'>Table of contents</h2>
          <ul className='mt-4 grid gap-2 text-sm sm:grid-cols-2'>
            {document.sections.map((section) => {
              const id = slugify(section.title);

              return (
                <li key={section.title}>
                  <a
                    href={`#${id}`}
                    className='text-muted-foreground transition-colors hover:text-foreground'
                  >
                    {section.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </section>

        <section className='space-y-10'>
          {document.sections.map((section) => {
            const id = slugify(section.title);

            return (
              <article key={section.title} id={id} className='scroll-mt-20'>
                <h2 className='text-xl font-semibold'>{section.title}</h2>
                <div className='mt-4 space-y-4'>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className='text-base leading-7'>
                      {paragraph}
                    </p>
                  ))}
                </div>
                {section.bullets && section.bullets.length > 0 ? (
                  <ul className='mt-4 list-disc space-y-2 pl-6'>
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className='text-base leading-7'>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            );
          })}
        </section>

        <section className='mt-12 space-y-4 border-t pt-6'>
          {document.closing.map((paragraph) => (
            <p key={paragraph} className='text-base leading-7'>
              {paragraph}
            </p>
          ))}
          {document.relatedLinks && document.relatedLinks.length > 0 ? (
            <div className='flex flex-wrap gap-4 pt-1'>
              {document.relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className='text-sm font-medium underline underline-offset-4'
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
