import { prisma } from '../../services/prisma';
import { UpdateTemplateInput } from './template.schema';
import { Prisma } from '@prisma/client';
import { assertWeddingAccess } from '../../lib/wedding-access';

export async function getTemplateConfig(weddingId: string, userId: string, role: string) {
  await assertWeddingAccess(weddingId, userId, role);

  let config = await prisma.weddingTemplateConfig.findUnique({
    where: { weddingEventId: weddingId },
  });

  if (!config) {
    config = await prisma.weddingTemplateConfig.create({
      data: {
        weddingEventId: weddingId,
        templateKey: 'elegant',
        config: {},
      },
    });
  }

  return config;
}

export async function updateTemplateConfig(
  weddingId: string,
  userId: string,
  role: string,
  input: UpdateTemplateInput
) {
  await assertWeddingAccess(weddingId, userId, role);

  const existing = await prisma.weddingTemplateConfig.findUnique({
    where: { weddingEventId: weddingId },
  });

  if (existing) {
    const mergedConfig = {
      ...(existing.config as object),
      ...(input.config ?? {}),
    };

    return prisma.weddingTemplateConfig.update({
      where: { weddingEventId: weddingId },
      data: {
        ...(input.templateKey && { templateKey: input.templateKey }),
        config: mergedConfig as Prisma.InputJsonValue,
      },
    });
  }

  return prisma.weddingTemplateConfig.create({
    data: {
      weddingEventId: weddingId,
      templateKey: input.templateKey ?? 'elegant',
      config: (input.config ?? {}) as Prisma.InputJsonValue,
    },
  });
}
