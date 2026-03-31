import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');

    if (niche) {
      const template = await db.botTemplate.findFirst({
        where: { niche, isActive: true },
      });

      if (!template) {
        return NextResponse.json({ template: null });
      }

      return NextResponse.json({
        template: {
          id: template.id,
          niche: template.niche,
          name: template.name,
          description: template.description,
          greeting: template.greeting,
          faq: template.faq ? JSON.parse(template.faq) : [],
          colors: template.colors ? JSON.parse(template.colors) : null,
          icon: template.icon,
        },
      });
    }

    const templates = await db.botTemplate.findMany({
      where: { isActive: true },
      orderBy: { niche: 'asc' },
    });

    return NextResponse.json({
      templates: templates.map(t => ({
        id: t.id,
        niche: t.niche,
        name: t.name,
        description: t.description,
        greeting: t.greeting,
        faq: t.faq ? JSON.parse(t.faq) : [],
        colors: t.colors ? JSON.parse(t.colors) : null,
        icon: t.icon,
      })),
    });
  } catch (error) {
    console.error('Templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
