const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Public: Get page by slug
router.get('/pages/:slug', async (req, res) => {
  try {
    const page = await prisma.page.findUnique({
      where: { slug: req.params.slug }
    });

    if (!page || page.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Pagina niet gevonden' });
    }

    res.json({
      id: page.id,
      title: page.title,
      slug: page.slug,
      content: page.content,
      excerpt: page.excerpt,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      featuredImageId: page.featuredImageId,
      template: page.template
    });
  } catch (error) {
    console.error('Public get page error:', error);
    res.status(500).json({ error: 'Server fout' });
  }
});

// Public: Get all published pages (for nav)
router.get('/pages', async (req, res) => {
  try {
    const pages = await prisma.page.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, title: true, slug: true, parentId: true, sortOrder: true, excerpt: true },
      orderBy: { sortOrder: 'asc' }
    });
    res.json(pages);
  } catch (error) {
    console.error('Public get pages error:', error);
    res.status(500).json({ error: 'Server fout' });
  }
});

// Public: Get menu by location
router.get('/menus/:location', async (req, res) => {
  try {
    const menu = await prisma.menu.findFirst({
      where: { location: req.params.location },
      include: {
        items: {
          where: { parentId: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            children: { orderBy: { sortOrder: 'asc' } }
          }
        }
      }
    });

    if (!menu) {
      return res.json({ items: [] });
    }

    // Resolve page slugs for menu items
    const resolvedItems = await Promise.all(
      menu.items.map(async (item) => {
        let url = item.url;
        if (item.pageId) {
          const page = await prisma.page.findUnique({
            where: { id: item.pageId },
            select: { slug: true }
          });
          if (page) url = `/${page.slug}`;
        }
        const resolvedChildren = await Promise.all(
          (item.children || []).map(async (child) => {
            let childUrl = child.url;
            if (child.pageId) {
              const page = await prisma.page.findUnique({
                where: { id: child.pageId },
                select: { slug: true }
              });
              if (page) childUrl = `/${page.slug}`;
            }
            return { ...child, url: childUrl };
          })
        );
        return { ...item, url, children: resolvedChildren };
      })
    );

    res.json({ ...menu, items: resolvedItems });
  } catch (error) {
    console.error('Public get menu error:', error);
    res.status(500).json({ error: 'Server fout' });
  }
});

// Public: Get homepage
router.get('/homepage', async (req, res) => {
  try {
    const sections = await prisma.homepageSection.findMany({
      where: { visible: true },
      orderBy: { sortOrder: 'asc' }
    });
    res.json(sections);
  } catch (error) {
    console.error('Public get homepage error:', error);
    res.status(500).json({ error: 'Server fout' });
  }
});

// Public: Get active theme
router.get('/theme', async (req, res) => {
  try {
    const theme = await prisma.theme.findFirst({ where: { isActive: true } });
    res.json(theme || null);
  } catch (error) {
    console.error('Public get theme error:', error);
    res.status(500).json({ error: 'Server fout' });
  }
});

// Public: Get site settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    const result = {};
    settings.forEach(s => { result[s.key] = s.value; });
    res.json(result);
  } catch (error) {
    console.error('Public get settings error:', error);
    res.status(500).json({ error: 'Server fout' });
  }
});

// Public: Get published posts
router.get('/posts', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          title: true,
          slug: true,
          header: true,
          headerImageId: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.post.count({ where: { status: 'PUBLISHED' } })
    ]);

    res.json({
      data: posts,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    console.error('Public get posts error:', error);
    res.status(500).json({ error: 'Server fout' });
  }
});

// Public: Get single post
router.get('/posts/:slug', async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { slug: req.params.slug }
    });

    if (!post || post.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Bericht niet gevonden' });
    }

    res.json({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      header: post.header,
      headerImageId: post.headerImageId,
      createdAt: post.createdAt
    });
  } catch (error) {
    console.error('Public get post error:', error);
    res.status(500).json({ error: 'Server fout' });
  }
});

// Public: Get footer
router.get('/footer', async (req, res) => {
  try {
    const columns = await prisma.footerColumn.findMany({
      orderBy: { columnNum: 'asc' }
    });

    // Also get footer menus
    const footerMenus = await prisma.menu.findMany({
      where: { location: { startsWith: 'footer-' } },
      include: {
        items: {
          where: { parentId: null },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    // Resolve page URLs in footer menus
    for (const menu of footerMenus) {
      for (const item of menu.items) {
        if (item.pageId) {
          const page = await prisma.page.findUnique({
            where: { id: item.pageId },
            select: { slug: true }
          });
          if (page) item.url = `/${page.slug}`;
        }
      }
    }

    // Build a map of location -> menu items (e.g. 'footer-1' -> items)
    const menuMap = {};
    for (const menu of footerMenus) {
      menuMap[menu.location] = menu.items;
    }

    // Attach menu items to columns by matching footer-{columnNum}
    const enrichedColumns = columns.map(col => ({
      ...col,
      menuItems: menuMap[`footer-${col.columnNum}`] || []
    }));

    const copyright = await prisma.setting.findUnique({ where: { key: 'footer_copyright' } });

    res.json({
      columns: enrichedColumns,
      menus: footerMenus,
      copyright: copyright?.value || ''
    });
  } catch (error) {
    console.error('Public get footer error:', error);
    res.status(500).json({ error: 'Server fout' });
  }
});

// Public: Get media item
router.get('/media/:id', async (req, res) => {
  try {
    const media = await prisma.media.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!media) {
      return res.status(404).json({ error: 'Media niet gevonden' });
    }

    res.json(media);
  } catch (error) {
    console.error('Public get media error:', error);
    res.status(500).json({ error: 'Server fout' });
  }
});

module.exports = router;
