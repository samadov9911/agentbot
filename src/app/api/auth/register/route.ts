import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateToken, generateCuid } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, company } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const token = generateToken();
    const userId = generateCuid();

    const user = await db.user.create({
      data: {
        id: userId,
        email,
        name: name || null,
        company: company || null,
        passwordHash,
      },
    });

    // Create demo period (7 days)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await db.demoPeriod.create({
      data: {
        userId: user.id,
        startsAt: now,
        expiresAt,
        isActive: true,
      },
    });

    await db.subscription.create({
      data: {
        userId: user.id,
        plan: 'demo',
        status: 'active',
        startsAt: now,
        expiresAt,
      },
    });

    // Seed bot templates if needed
    const templateCount = await db.botTemplate.count();
    if (templateCount === 0) {
      await seedTemplates();
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role,
        language: user.language,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
      },
      token,
      demoExpiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function seedTemplates() {
  const templates = [
    {
      niche: 'salon', name: 'Beauty Salon', icon: '✂️',
      greeting: 'Здравствуйте! Добро пожаловать в {company_name}. Я помогу записать вас на услуги.',
      faq: JSON.stringify([
        { question: 'Какие услуги вы предлагаете?', answer: 'Стрижки, окрашивание, укладки, маникюр, педикюр.' },
        { question: 'Как записаться?', answer: 'Скажите, какая услуга вам нужна!' },
        { question: 'Какие цены?', answer: 'Стрижка от 1500₽, окрашивание от 3000₽, маникюр от 1000₽.' },
      ]),
      colors: JSON.stringify({ primary: '#ec4899', secondary: '#f472b6' }),
    },
    {
      niche: 'medical', name: 'Medical Clinic', icon: '🏥',
      greeting: 'Здравствуйте! Я помощник клиники {company_name}. Помогу записать на приём.',
      faq: JSON.stringify([
        { question: 'Какие врачи принимают?', answer: 'Терапевты, стоматологи, кардиологи.' },
        { question: 'Как записаться?', answer: 'Назовите специалиста и удобное время.' },
      ]),
      colors: JSON.stringify({ primary: '#10b981', secondary: '#34d399' }),
    },
    {
      niche: 'restaurant', name: 'Restaurant', icon: '🍽️',
      greeting: 'Добро пожаловать в {company_name}! Забронировать столик?',
      faq: JSON.stringify([
        { question: 'Как забронировать?', answer: 'Назовите дату, время и количество гостей.' },
        { question: 'Средний чек?', answer: '1500-2500₽ на человека.' },
      ]),
      colors: JSON.stringify({ primary: '#f59e0b', secondary: '#fbbf24' }),
    },
    {
      niche: 'realEstate', name: 'Real Estate', icon: '🏠',
      greeting: 'Здравствуйте! Я агент {company_name}. Помогу подобрать недвижимость.',
      faq: JSON.stringify([
        { question: 'Какие объекты?', answer: 'Квартиры, дома и коммерческая недвижимость.' },
      ]),
      colors: JSON.stringify({ primary: '#6366f1', secondary: '#818cf8' }),
    },
    {
      niche: 'education', name: 'Education', icon: '📚',
      greeting: 'Здравствуйте! Добро пожаловать в {company_name}. Расскажу о курсах.',
      faq: JSON.stringify([
        { question: 'Какие курсы?', answer: 'Программирование, дизайн, маркетинг, языки.' },
      ]),
      colors: JSON.stringify({ primary: '#3b82f6', secondary: '#60a5fa' }),
    },
    {
      niche: 'fitness', name: 'Fitness', icon: '💪',
      greeting: 'Привет! Я помощник фитнес-клуба {company_name}. Запишу на тренировку!',
      faq: JSON.stringify([
        { question: 'Какие абонементы?', answer: 'Месячный, квартальный и годовой.' },
      ]),
      colors: JSON.stringify({ primary: '#ef4444', secondary: '#f87171' }),
    },
    {
      niche: 'consulting', name: 'Consulting', icon: '💼',
      greeting: 'Здравствуйте! Ассистент {company_name}. Чем помочь?',
      faq: JSON.stringify([
        { question: 'Какие услуги?', answer: 'Юридические, бухгалтерские, бизнес-консультации.' },
      ]),
      colors: JSON.stringify({ primary: '#0ea5e9', secondary: '#38bdf8' }),
    },
    {
      niche: 'ecommerce', name: 'E-commerce', icon: '🛒',
      greeting: 'Здравствуйте! Помощник магазина {company_name}. Помогу с заказом!',
      faq: JSON.stringify([
        { question: 'Как сделать заказ?', answer: 'Расскажите, что вас интересует.' },
      ]),
      colors: JSON.stringify({ primary: '#8b5cf6', secondary: '#a78bfa' }),
    },
    {
      niche: 'other', name: 'General Business', icon: '🏢',
      greeting: 'Здравствуйте! Ассистент {company_name}. Чем могу помочь?',
      faq: JSON.stringify([{ question: 'Как связаться?', answer: 'Напишите здесь, и мы ответим!' }]),
      colors: JSON.stringify({ primary: '#64748b', secondary: '#94a3b8' }),
    },
  ];

  await db.botTemplate.createMany({ data: templates });
}
