'use client';

import type { InvitationData, TemplateKey } from '@/types';
import { ElegantTemplate } from '@/components/templates/elegant';
import { MinimalTemplate } from '@/components/templates/minimal';
import { FloralTemplate } from '@/components/templates/floral';
import { NoirEleganceTemplate } from '@/components/templates/noir-elegance';
import { TemplateMusicWrapper } from '@/components/wedding/template-music-wrapper';

interface TemplateRendererProps {
  data: InvitationData;
}

const templateMap: Record<TemplateKey, React.ComponentType<{ data: InvitationData }>> = {
  elegant: ElegantTemplate,
  minimal: MinimalTemplate,
  floral: FloralTemplate,
  'noir-elegance': NoirEleganceTemplate,
};

const SELF_MANAGED_MUSIC: TemplateKey[] = ['noir-elegance'];

export function TemplateRenderer({ data }: TemplateRendererProps) {
  const TemplateComponent = templateMap[data.template.key] || ElegantTemplate;

  if (SELF_MANAGED_MUSIC.includes(data.template.key)) {
    return <TemplateComponent data={data} />;
  }

  return (
    <TemplateMusicWrapper data={data} accentColor={data.template.config.primaryColor || '#1a1a1a'}>
      <TemplateComponent data={data} />
    </TemplateMusicWrapper>
  );
}
