const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || 'Admin@2026!Secure',
      12
    );

    await prisma.user.create({
      data: {
        email: process.env.ADMIN_EMAIL || 'admin@moveo-bv.nl',
        password: hashedPassword,
        name: process.env.ADMIN_NAME || 'Administrator',
        role: 'SUPER_ADMIN',
        active: true
      }
    });
    console.log('✅ Admin user created');
  } else {
    console.log('ℹ️  Admin user already exists, skipping');
  }

  // Seed default theme
  const existingTheme = await prisma.theme.findFirst({ where: { isActive: true } });
  if (!existingTheme) {
    await prisma.theme.createMany({
      data: [
        {
          name: 'Modern Blauw',
          isActive: true,
          colors: {
            primary: '#1e40af',
            primaryLight: '#3b82f6',
            primaryDark: '#1e3a8a',
            secondary: '#0f172a',
            accent: '#06b6d4',
            background: '#ffffff',
            backgroundAlt: '#f8fafc',
            surface: '#ffffff',
            surfaceHover: '#f1f5f9',
            text: '#0f172a',
            textLight: '#64748b',
            textInverse: '#ffffff',
            border: '#e2e8f0',
            borderDark: '#cbd5e1',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
            headerBg: '#1e40af',
            headerText: '#ffffff',
            footerBg: '#0f172a',
            footerText: '#e2e8f0',
            navBg: '#ffffff',
            navText: '#0f172a',
            navHover: '#1e40af',
            buttonPrimary: '#1e40af',
            buttonPrimaryText: '#ffffff',
            buttonSecondary: '#64748b',
            buttonSecondaryText: '#ffffff',
            linkColor: '#1e40af',
            linkHover: '#3b82f6'
          },
          fonts: {
            heading: "'Inter', sans-serif",
            body: "'Inter', sans-serif",
            mono: "'JetBrains Mono', monospace"
          }
        },
        {
          name: 'Donker Thema',
          isActive: false,
          colors: {
            primary: '#3b82f6',
            primaryLight: '#60a5fa',
            primaryDark: '#2563eb',
            secondary: '#1e293b',
            accent: '#06b6d4',
            background: '#0f172a',
            backgroundAlt: '#1e293b',
            surface: '#1e293b',
            surfaceHover: '#334155',
            text: '#e2e8f0',
            textLight: '#94a3b8',
            textInverse: '#0f172a',
            border: '#334155',
            borderDark: '#475569',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
            headerBg: '#0f172a',
            headerText: '#e2e8f0',
            footerBg: '#020617',
            footerText: '#94a3b8',
            navBg: '#1e293b',
            navText: '#e2e8f0',
            navHover: '#3b82f6',
            buttonPrimary: '#3b82f6',
            buttonPrimaryText: '#ffffff',
            buttonSecondary: '#475569',
            buttonSecondaryText: '#e2e8f0',
            linkColor: '#60a5fa',
            linkHover: '#93c5fd'
          },
          fonts: {
            heading: "'Inter', sans-serif",
            body: "'Inter', sans-serif",
            mono: "'JetBrains Mono', monospace"
          }
        },
        {
          name: 'Minimalistisch',
          isActive: false,
          colors: {
            primary: '#18181b',
            primaryLight: '#3f3f46',
            primaryDark: '#09090b',
            secondary: '#71717a',
            accent: '#a1a1aa',
            background: '#ffffff',
            backgroundAlt: '#fafafa',
            surface: '#ffffff',
            surfaceHover: '#f4f4f5',
            text: '#18181b',
            textLight: '#71717a',
            textInverse: '#ffffff',
            border: '#e4e4e7',
            borderDark: '#d4d4d8',
            success: '#22c55e',
            warning: '#eab308',
            error: '#ef4444',
            info: '#6366f1',
            headerBg: '#ffffff',
            headerText: '#18181b',
            footerBg: '#18181b',
            footerText: '#d4d4d8',
            navBg: '#ffffff',
            navText: '#18181b',
            navHover: '#3f3f46',
            buttonPrimary: '#18181b',
            buttonPrimaryText: '#ffffff',
            buttonSecondary: '#71717a',
            buttonSecondaryText: '#ffffff',
            linkColor: '#18181b',
            linkHover: '#3f3f46'
          },
          fonts: {
            heading: "'Inter', sans-serif",
            body: "'Inter', sans-serif",
            mono: "'JetBrains Mono', monospace"
          }
        },
        {
          name: 'Warm',
          isActive: false,
          colors: {
            primary: '#b45309',
            primaryLight: '#d97706',
            primaryDark: '#92400e',
            secondary: '#78350f',
            accent: '#ea580c',
            background: '#fffbeb',
            backgroundAlt: '#fef3c7',
            surface: '#ffffff',
            surfaceHover: '#fef9c3',
            text: '#451a03',
            textLight: '#92400e',
            textInverse: '#ffffff',
            border: '#fde68a',
            borderDark: '#fcd34d',
            success: '#16a34a',
            warning: '#ca8a04',
            error: '#dc2626',
            info: '#0284c7',
            headerBg: '#78350f',
            headerText: '#fef3c7',
            footerBg: '#451a03',
            footerText: '#fde68a',
            navBg: '#fffbeb',
            navText: '#451a03',
            navHover: '#b45309',
            buttonPrimary: '#b45309',
            buttonPrimaryText: '#ffffff',
            buttonSecondary: '#92400e',
            buttonSecondaryText: '#ffffff',
            linkColor: '#b45309',
            linkHover: '#d97706'
          },
          fonts: {
            heading: "'Playfair Display', serif",
            body: "'Inter', sans-serif",
            mono: "'JetBrains Mono', monospace"
          }
        }
      ]
    });
    console.log('✅ Themes created');
  }

  // Seed default settings
  const existingSettings = await prisma.setting.findFirst();
  if (!existingSettings) {
    await prisma.setting.createMany({
      data: [
        { key: 'site_name', value: JSON.stringify(process.env.SITE_NAME || 'moveo-bv.nl') },
        { key: 'site_description', value: JSON.stringify('Welkom bij Moveo') },
        { key: 'site_language', value: JSON.stringify(process.env.DEFAULT_LANGUAGE || 'nl') },
        { key: 'footer_copyright', value: JSON.stringify(`© ${new Date().getFullYear()} moveo-bv.nl. Alle rechten voorbehouden.`) },
        { key: 'posts_per_page', value: JSON.stringify(10) },
        { key: 'admin_language', value: JSON.stringify('nl') }
      ]
    });
    console.log('✅ Default settings created');
  }

  // Seed default menus
  const existingMenu = await prisma.menu.findFirst();
  if (!existingMenu) {
    const headerMenu = await prisma.menu.create({
      data: {
        name: 'Hoofdmenu',
        location: 'header',
        items: {
          create: [
            { label: 'Home', url: '/', sortOrder: 0 },
            { label: 'Over ons', url: '/over-ons', sortOrder: 1 },
            { label: 'Contact', url: '/contact', sortOrder: 2 }
          ]
        }
      }
    });

    await prisma.menu.create({
      data: { name: 'Footer Kolom 1', location: 'footer-1' }
    });
    await prisma.menu.create({
      data: { name: 'Footer Kolom 2', location: 'footer-2' }
    });
    await prisma.menu.create({
      data: { name: 'Footer Kolom 3', location: 'footer-3' }
    });
    console.log('✅ Default menus created');
  }

  // Seed default homepage sections
  const existingHomepage = await prisma.homepageSection.findFirst();
  if (!existingHomepage) {
    await prisma.homepageSection.createMany({
      data: [
        {
          type: 'hero',
          title: 'Welkom bij Moveo',
          subtitle: 'Uw partner in digitale oplossingen',
          sortOrder: 0,
          visible: true,
          settings: {
            backgroundImage: null,
            backgroundColor: null,
            textAlign: 'center',
            height: 'large',
            showButton: true,
            buttonText: 'Meer weten',
            buttonUrl: '/over-ons'
          },
          content: { text: 'Wij bouwen moderne en betrouwbare digitale oplossingen voor uw bedrijf.' }
        },
        {
          type: 'featured',
          title: 'Onze diensten',
          subtitle: null,
          sortOrder: 1,
          visible: true,
          settings: { columns: 3, style: 'cards' },
          content: {
            items: [
              { title: 'Webontwikkeling', description: 'Moderne websites en applicaties op maat.', icon: 'globe' },
              { title: 'Consultancy', description: 'Strategisch advies voor uw digitale transformatie.', icon: 'lightbulb' },
              { title: 'Ondersteuning', description: '24/7 support en onderhoud van uw systemen.', icon: 'headset' }
            ]
          }
        },
        {
          type: 'content',
          title: 'Over Moveo',
          subtitle: null,
          sortOrder: 2,
          visible: true,
          settings: { layout: 'text-image', imagePosition: 'right' },
          content: { text: '<p>Moveo is een toonaangevend bedrijf dat zich richt op het leveren van digitale oplossingen van de hoogste kwaliteit.</p>' }
        }
      ]
    });
    console.log('✅ Homepage sections created');
  }

  // Seed footer columns
  const existingFooter = await prisma.footerColumn.findFirst();
  if (!existingFooter) {
    await prisma.footerColumn.createMany({
      data: [
        {
          columnNum: 1,
          title: 'Over Moveo',
          content: { text: '<p>Moveo is uw partner in digitale oplossingen. Wij bouwen moderne websites en applicaties.</p>' },
          sortOrder: 0
        },
        {
          columnNum: 2,
          title: 'Navigatie',
          content: { text: '' },
          menuId: null,
          sortOrder: 1
        },
        {
          columnNum: 3,
          title: 'Contact',
          content: { text: '<p>Email: info@moveo-bv.nl<br/>Telefoon: +31 (0)20 123 4567</p>' },
          sortOrder: 2
        }
      ]
    });
    console.log('✅ Footer columns created');
  }

  // Seed default pages
  const existingPage = await prisma.page.findFirst();
  if (!existingPage) {
    await prisma.page.createMany({
      data: [
        {
          title: 'Home',
          slug: 'home',
          content: { blocks: [] },
          status: 'PUBLISHED',
          sortOrder: 0,
          metaTitle: 'Home - moveo-bv.nl',
          metaDescription: 'Welkom bij Moveo, uw partner in digitale oplossingen.'
        },
        {
          title: 'Over ons',
          slug: 'over-ons',
          content: {
            blocks: [
              { type: 'paragraph', content: '<p>Welkom bij de Over Ons pagina van Moveo.</p>' }
            ]
          },
          status: 'PUBLISHED',
          sortOrder: 1,
          metaTitle: 'Over ons - moveo-bv.nl',
          metaDescription: 'Leer meer over Moveo en ons team.'
        },
        {
          title: 'Contact',
          slug: 'contact',
          content: {
            blocks: [
              { type: 'paragraph', content: '<p>Neem contact met ons op via het onderstaande formulier.</p>' }
            ]
          },
          status: 'PUBLISHED',
          sortOrder: 2,
          metaTitle: 'Contact - moveo-bv.nl',
          metaDescription: 'Neem contact op met Moveo.'
        }
      ]
    });
    console.log('✅ Default pages created');
  }

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
