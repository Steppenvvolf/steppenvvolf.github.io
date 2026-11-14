import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/projects' }),
  schema: z
    .object({
      title: z.string(),
      tag: z.string(),
      // Short label for lists, e.g. "Hot-sauce e-shop".
      descriptor: z.string().optional(),
      studio: z.string().default(''),
      role: z.string().default(''),
      engine: z.string().default(''),
      year: z.string().default(''),
      platform: z.string().default(''),
      cover: z.string().default(''),
      coverAlt: z.string().default(''),
      // Optional 800 px variant of the cover for cards.
      coverSmall: z.string().optional(),
      // One plain sentence shown under the summary on the case page.
      note: z.string().optional(),
      // Scope / outcome table (label and value rows).
      facts: z
        .array(z.object({ label: z.string(), value: z.string() }))
        .min(1)
        .optional(),
      owned: z.string().default(''),
      brief: z.string().default(''),
      problem: z.string().default(''),
      approach: z.string().default(''),
      result: z.string().default(''),
      reflection: z.string().default(''),
      discipline: z.array(z.string()).default([]),
      category: z.enum(['games', 'experiments', 'product']),
      featured: z.boolean(),
      order: z.number(),
      summary: z.string(),
      published: z.boolean().default(false),
      gallery: z
        .array(
          z.object({
            title: z.string().optional(),
            src: z.string().refine((value) => value.trim().length > 0, {
              message: 'Gallery source must not be empty',
            }),
            alt: z.string().refine((value) => value.trim().length > 0, {
              message: 'Gallery alt text must not be empty',
            }),
            caption: z.string().refine((value) => value.trim().length > 0, {
              message: 'Gallery caption must not be empty',
            }),
          }),
        )
        .default([]),
      links: z
        .array(
          z.object({
            label: z.string(),
            url: z.url({ protocol: /^https?$/ }),
          }),
        )
        .optional(),
      // Product-design fields (rendered only when present).
      users: z.string().optional(),
      flow: z.array(z.string()).min(3).max(5).optional(),
      decisions: z
        .array(z.object({ title: z.string(), why: z.string() }))
        .min(2)
        .max(4)
        .optional(),
      iteration: z.string().optional(),
      iterationTitle: z.string().optional(),
      coverStat: z.object({ value: z.string(), label: z.string() }).optional(),
      approachItems: z.array(z.string()).optional(),
      coverFit: z.enum(['cover', 'contain']).default('cover'),
      // CSS object-position for the cover on cards and in the case hero.
      coverPosition: z.string().default('center'),
      // 'boards': short header, then presentation boards stacked full width.
      layout: z.enum(['case', 'boards']).default('case'),
      contentStatus: z.enum(['legacy', 'reviewed']).default('legacy'),
    })
    .strict()
    .superRefine((data, context) => {
      if (data.published) {
        const headerKeys = [
          'studio',
          'role',
          'engine',
          'year',
          'platform',
        ] as const;
        const proseKeys = ['owned', 'brief', 'problem', 'approach'] as const;
        const required =
          data.layout === 'boards'
            ? ([...headerKeys, 'brief'] as const)
            : ([...headerKeys, ...proseKeys] as const);
        for (const key of required) {
          if (!data[key].trim())
            context.addIssue({
              code: 'custom',
              path: [key],
              message: `${key} is required on published projects`,
            });
        }
      }
      if (Boolean(data.cover.trim()) !== Boolean(data.coverAlt.trim())) {
        context.addIssue({
          code: 'custom',
          path: ['coverAlt'],
          message:
            'Provide non-empty cover alt text when cover is set; leave both empty for a typography cover',
        });
      }
    }),
});

export const collections = { projects };
