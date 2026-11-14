export const site = {
  name: 'Stefan Malinovic',
  brand: 'Steppenwolf',
  title: 'The Designer',
  email: 'stefans.malinovic@gmail.com',
  location: 'Belgrade, Serbia',
  cv: '/cv/stefan-malinovic-level-design-cv.pdf',
  portfolio: '/cv/stefan-malinovic-portfolio.pdf',
  // Sizes shown next to the download buttons (checked against public/cv).
  cvSize: '85 KB',
  portfolioSize: '3.5 MB',
  socials: [
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/stefan-malinovic-91702b163/',
    },
    { label: 'ArtStation', href: 'https://www.artstation.com/steppenvvolf/' },
    { label: 'GitHub', href: 'https://github.com/Steppenvvolf' },
  ],
  // Newest first, from the Oct 2026 CV.
  studios: ['RedSixteen', 'MILC / Welt der Wunder', 'PlayStudios', 'Ubisoft'],
};
export const categories = [
  { id: 'all', label: 'All' },
  { id: 'games', label: 'Games' },
  { id: 'experiments', label: 'Experiments' },
  { id: 'product', label: 'Product design' },
] as const;
