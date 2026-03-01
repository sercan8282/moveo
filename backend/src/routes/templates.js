const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { canAccess } = require('../middleware/roles');

const router = express.Router();
const prisma = new PrismaClient();

// Get all templates
router.get('/', authenticate, async (req, res) => {
  try {
    const templates = await prisma.template.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        thumbnail: true,
        category: true,
        version: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Fout bij ophalen templates' });
  }
});

// Get single template with full data
router.get('/:id', authenticate, async (req, res) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!template) {
      return res.status(404).json({ error: 'Template niet gevonden' });
    }
    res.json(template);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Fout bij ophalen template' });
  }
});

// Preview template (get data without applying)
router.get('/:id/preview', authenticate, async (req, res) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!template) {
      return res.status(404).json({ error: 'Template niet gevonden' });
    }
    res.json(template.data);
  } catch (error) {
    console.error('Preview template error:', error);
    res.status(500).json({ error: 'Fout bij voorvertonen template' });
  }
});

// Apply template to website (SUPER_ADMIN only)
router.post('/:id/apply', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const { preserveContent = false } = req.body;
    const template = await prisma.template.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template niet gevonden' });
    }

    const data = template.data;
    const results = {
      theme: null,
      pages: [],
      homepage: [],
      menus: [],
      footer: [],
      settings: []
    };

    // Store footer menu columns for use across sections
    let footerMenuColumns = [];

    // Start transaction for all changes
    await prisma.$transaction(async (tx) => {
      
      // 1. Apply theme
      if (data.theme) {
        // Deactivate all themes first
        await tx.theme.updateMany({
          where: { isActive: true },
          data: { isActive: false }
        });
        
        // Build theme colors object from template data
        const themeName = data.theme.name || template.name + ' Theme';
        const themeColors = data.theme.colors || {
          primary: data.theme.primaryColor || '#3b82f6',
          secondary: data.theme.secondaryColor || '#1e40af',
          accent: data.theme.accentColor || '#f59e0b',
          background: data.theme.backgroundColor || '#ffffff',
          text: data.theme.textColor || '#333333',
          headerBg: data.theme.headerBg || '#1e40af',
          footerBg: data.theme.footerBg || '#1e3a5f'
        };
        const themeFonts = data.theme.fonts || {
          fontFamily: data.theme.fontFamily || 'Inter, sans-serif'
        };
        
        // Create or update the template theme
        const theme = await tx.theme.upsert({
          where: { name: themeName },
          update: { 
            colors: themeColors,
            fonts: themeFonts,
            isActive: true
          },
          create: {
            name: themeName,
            colors: themeColors,
            fonts: themeFonts,
            isActive: true
          }
        });
        results.theme = theme.name;
      }

      // 2. Apply pages
      if (data.pages && !preserveContent) {
        for (const pageData of data.pages) {
          // Convert template blocks format to HTML content
          let pageContent = pageData.content;
          
          if (pageContent?.blocks && Array.isArray(pageContent.blocks)) {
            // Convert blocks to HTML
            const htmlParts = pageContent.blocks.map(block => {
              switch (block.type) {
                case 'hero-page':
                  return `<div class="page-hero" style="background-image: url('${block.data?.backgroundImage || ''}')">
                    <h1>${block.data?.title || ''}</h1>
                    <p>${block.data?.subtitle || ''}</p>
                  </div>`;
                case 'content-section':
                  return `<div class="content-section">
                    <h2>${block.data?.title || ''}</h2>
                    ${block.data?.content || ''}
                    ${block.data?.image ? `<img src="${block.data.image}" alt="${block.data?.title || ''}" />` : ''}
                  </div>`;
                case 'text-content':
                  return block.data?.content || '';
                case 'values-grid':
                  const values = block.data?.values || [];
                  return `<div class="values-grid">
                    <h2>${block.data?.title || ''}</h2>
                    <div class="grid">${values.map(v => `<div><h3>${v.title}</h3><p>${v.description}</p></div>`).join('')}</div>
                  </div>`;
                case 'team-section':
                  const team = block.data?.team || [];
                  return `<div class="team-section">
                    <h2>${block.data?.title || ''}</h2>
                    <p>${block.data?.subtitle || ''}</p>
                    <div class="team-grid">${team.map(t => `<div><img src="${t.image}" alt="${t.name}" /><h3>${t.name}</h3><p>${t.role}</p></div>`).join('')}</div>
                  </div>`;
                case 'services-detail':
                  const services = block.data?.services || [];
                  return `<div class="services-section">
                    ${services.map(s => `<div id="${s.id}"><h3>${s.title}</h3><img src="${s.image}" alt="${s.title}" /><p>${s.description}</p><ul>${(s.features || []).map(f => `<li>${f}</li>`).join('')}</ul></div>`).join('')}
                  </div>`;
                case 'cta-section':
                  return `<div class="cta-section">
                    <h2>${block.data?.title || ''}</h2>
                    <p>${block.data?.subtitle || ''}</p>
                    ${block.data?.button ? `<a href="${block.data.button.link}">${block.data.button.text}</a>` : ''}
                  </div>`;
                case 'stats-section':
                  const stats = block.data?.stats || [];
                  return `<div class="stats-section">${stats.map(s => `<div><strong>${s.number}</strong><span>${s.label}</span></div>`).join('')}</div>`;
                case 'intro-text':
                  return `<p class="intro">${block.data?.content || ''}</p>`;
                case 'contact-info':
                case 'contact-form':
                case 'map':
                case 'quote-form':
                case 'blog-grid':
                  // These are handled by templates, just store the block data
                  return '';
                default:
                  return block.data?.content || '';
              }
            }).filter(Boolean);
            
            pageContent = { html: htmlParts.join('\n') };
          }
          
          const page = await tx.page.upsert({
            where: { slug: pageData.slug },
            update: {
              title: pageData.title,
              content: pageContent,
              excerpt: pageData.excerpt,
              status: 'PUBLISHED',
              metaTitle: pageData.metaTitle,
              metaDescription: pageData.metaDescription,
              template: pageData.template || 'default',
              sortOrder: pageData.sortOrder || 0
            },
            create: {
              title: pageData.title,
              slug: pageData.slug,
              content: pageContent,
              excerpt: pageData.excerpt,
              status: 'PUBLISHED',
              metaTitle: pageData.metaTitle,
              metaDescription: pageData.metaDescription,
              template: pageData.template || 'default',
              sortOrder: pageData.sortOrder || 0
            }
          });
          results.pages.push(page.slug);
        }
      }

      // 3. Apply homepage sections
      if (data.homepage && !preserveContent) {
        // Clear existing homepage sections
        await tx.homepageSection.deleteMany({});
        
        // Handle both array format and object with sections property
        const sections = Array.isArray(data.homepage) ? data.homepage : (data.homepage.sections || []);
        
        for (const section of sections) {
          const created = await tx.homepageSection.create({
            data: {
              type: section.type,
              title: section.data?.title || section.title,
              subtitle: section.data?.subtitle || section.subtitle,
              content: section.data?.content || section.content,
              sortOrder: section.order || section.sortOrder || 0,
              visible: section.enabled !== false && section.visible !== false,
              settings: section.data || section.settings
            }
          });
          results.homepage.push(created.type);
        }
      }

      // 4. Apply menus
      if (data.menus && !preserveContent) {
        // Handle both array format and object with header/footer keys
        let menusToApply = [];
        
        if (Array.isArray(data.menus)) {
          menusToApply = data.menus;
        } else {
          // Convert object format to array
          if (data.menus.header) {
            menusToApply.push({
              name: data.menus.header.name || 'Hoofdmenu',
              location: 'header',
              items: data.menus.header.items?.map(item => ({
                label: item.title,
                url: item.url,
                sortOrder: item.order || 0,
                children: item.children?.map(child => ({
                  label: child.title,
                  url: child.url,
                  sortOrder: child.order || 0
                }))
              }))
            });
          }
          // Store footer columns for later use in footer section
          if (data.menus.footer && data.menus.footer.columns) {
            footerMenuColumns = data.menus.footer.columns;
          }
        }
        
        for (const menuData of menusToApply) {
          // Delete existing menu with same name
          await tx.menuItem.deleteMany({
            where: { menu: { name: menuData.name } }
          });
          await tx.menu.deleteMany({
            where: { name: menuData.name }
          });
          
          // Create new menu
          const menu = await tx.menu.create({
            data: {
              name: menuData.name,
              location: menuData.location
            }
          });
          
          // Create menu items
          if (menuData.items) {
            for (const item of menuData.items) {
              await createMenuItemsRecursive(tx, menu.id, item, null);
            }
          }
          results.menus.push(menu.name);
        }
      }

      // 5. Apply footer
      if (data.footer && !preserveContent) {
        // Clear existing footer columns
        await tx.footerColumn.deleteMany({});
        
        // Handle both array format and object format
        let footerColumns = [];
        
        if (Array.isArray(data.footer)) {
          footerColumns = data.footer;
        } else {
          // Convert object format to columns with proper HTML content
          
          // Column 1: Logo and description
          const logoUrl = data.footer.logo || '';
          const description = data.footer.description || '';
          const socials = data.settings?.socials || {};
          let col1Html = '';
          if (logoUrl) col1Html += `<img src="${logoUrl}" alt="Logo" class="h-12 mb-4" />\n`;
          if (description) col1Html += `<p class="mb-4">${description}</p>\n`;
          if (Object.keys(socials).length > 0) {
            col1Html += '<div class="flex gap-3 mt-4">';
            if (socials.facebook) col1Html += `<a href="${socials.facebook}" target="_blank" rel="noopener">Facebook</a>`;
            if (socials.linkedin) col1Html += `<a href="${socials.linkedin}" target="_blank" rel="noopener">LinkedIn</a>`;
            if (socials.twitter) col1Html += `<a href="${socials.twitter}" target="_blank" rel="noopener">Twitter</a>`;
            if (socials.instagram) col1Html += `<a href="${socials.instagram}" target="_blank" rel="noopener">Instagram</a>`;
            col1Html += '</div>';
          }
          footerColumns.push({
            columnNum: 1,
            title: 'Over Ons',
            content: col1Html,
            sortOrder: 1
          });
          
          // Column 2: Contact Info
          const contactInfo = data.footer.contactInfo || {};
          const address = contactInfo.address || data.settings?.address || '';
          const phone = contactInfo.phone || data.settings?.phone || '';
          const email = contactInfo.email || data.settings?.email || '';
          let col2Html = '';
          if (address) col2Html += `<p class="mb-2">📍 ${address}</p>\n`;
          if (phone) col2Html += `<p class="mb-2">📞 <a href="tel:${phone.replace(/\s/g, '')}">${phone}</a></p>\n`;
          if (email) col2Html += `<p class="mb-2">✉️ <a href="mailto:${email}">${email}</a></p>\n`;
          footerColumns.push({
            columnNum: 2,
            title: 'Contact',
            content: col2Html,
            sortOrder: 2
          });
          
          // Column 3: Opening Hours
          if (data.footer.openingHours && data.footer.openingHours.length > 0) {
            let col3Html = '<ul class="space-y-1">';
            for (const h of data.footer.openingHours) {
              col3Html += `<li><strong>${h.days}:</strong> ${h.hours}</li>\n`;
            }
            col3Html += '</ul>';
            footerColumns.push({
              columnNum: 3,
              title: 'Openingstijden',
              content: col3Html,
              sortOrder: 3
            });
          }
          
          // Column 4: Legal links
          let col4Html = '<nav class="space-y-2">';
          col4Html += '<a href="/voorwaarden" class="block hover:underline">Algemene Voorwaarden</a>\n';
          col4Html += '<a href="/privacy" class="block hover:underline">Privacybeleid</a>\n';
          col4Html += '</nav>';
          if (data.footer.copyright) {
            col4Html += `<p class="mt-4 text-sm opacity-70">${data.footer.copyright}</p>`;
          }
          footerColumns.push({
            columnNum: 4,
            title: 'Info',
            content: col4Html,
            sortOrder: 4
          });
          
          // Add footer menu columns (Snelle Links, Diensten, etc.)
          if (footerMenuColumns && footerMenuColumns.length > 0) {
            let colNum = 5;
            for (const menuCol of footerMenuColumns) {
              let menuHtml = '<nav class="space-y-2">';
              if (menuCol.items) {
                for (const item of menuCol.items) {
                  menuHtml += `<a href="${item.url}" class="block hover:underline">${item.title}</a>\n`;
                }
              }
              menuHtml += '</nav>';
              footerColumns.push({
                columnNum: colNum,
                title: menuCol.title || `Menu ${colNum}`,
                content: menuHtml,
                sortOrder: colNum
              });
              colNum++;
            }
          }
        }
        
        for (const column of footerColumns) {
          await tx.footerColumn.create({
            data: {
              columnNum: column.columnNum,
              title: column.title,
              content: column.content,
              menuId: column.menuId,
              sortOrder: column.sortOrder || 0
            }
          });
          results.footer.push(`Column ${column.columnNum}`);
        }
      }

      // 6. Apply settings
      if (data.settings) {
        // Flatten nested settings to key-value pairs
        const flattenSettings = (obj, prefix = '') => {
          const result = {};
          for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}_${key}` : key;
            if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
              Object.assign(result, flattenSettings(value, newKey));
            } else {
              result[newKey] = typeof value === 'string' ? value : JSON.stringify(value);
            }
          }
          return result;
        };
        
        const flatSettings = flattenSettings(data.settings);
        
        for (const [key, value] of Object.entries(flatSettings)) {
          await tx.setting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) }
          });
          results.settings.push(key);
        }
      }
    });

    res.json({
      success: true,
      message: `Template "${template.name}" succesvol toegepast`,
      applied: results
    });
  } catch (error) {
    console.error('Apply template error:', error);
    res.status(500).json({ error: 'Fout bij toepassen template: ' + error.message });
  }
});

// Helper function to create menu items recursively
async function createMenuItemsRecursive(tx, menuId, item, parentId) {
  const menuItem = await tx.menuItem.create({
    data: {
      menuId,
      parentId,
      label: item.label,
      url: item.url,
      sortOrder: item.sortOrder || 0,
      target: item.target || '_self',
      cssClass: item.cssClass,
      icon: item.icon,
      styles: item.styles
    }
  });
  
  if (item.children && item.children.length > 0) {
    for (const child of item.children) {
      await createMenuItemsRecursive(tx, menuId, child, menuItem.id);
    }
  }
  
  return menuItem;
}

// Create new template (SUPER_ADMIN only)
router.post('/', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const { name, slug, description, thumbnail, category, data } = req.body;
    
    const template = await prisma.template.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description,
        thumbnail,
        category: category || 'general',
        data
      }
    });
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Fout bij aanmaken template' });
  }
});

// Update template
router.put('/:id', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const { name, description, thumbnail, category, data, isActive } = req.body;
    
    const template = await prisma.template.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        description,
        thumbnail,
        category,
        data,
        isActive
      }
    });
    
    res.json(template);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Fout bij bijwerken template' });
  }
});

// Delete template
router.delete('/:id', authenticate, canAccess('settings'), async (req, res) => {
  try {
    await prisma.template.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Fout bij verwijderen template' });
  }
});

// Export current website as template
router.post('/export', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const { name, description, category } = req.body;
    
    // Gather all current website data
    const [theme, pages, homepage, menus, footer, settings] = await Promise.all([
      prisma.theme.findFirst({ where: { isActive: true } }),
      prisma.page.findMany({ where: { status: 'PUBLISHED' } }),
      prisma.homepageSection.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.menu.findMany({ include: { items: true } }),
      prisma.footerColumn.findMany({ orderBy: { columnNum: 'asc' } }),
      prisma.setting.findMany()
    ]);
    
    // Build template data structure
    const templateData = {
      theme: theme ? {
        name: theme.name,
        colors: theme.colors,
        fonts: theme.fonts
      } : null,
      pages: pages.map(p => ({
        title: p.title,
        slug: p.slug,
        content: p.content,
        excerpt: p.excerpt,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        template: p.template,
        sortOrder: p.sortOrder
      })),
      homepage: homepage.map(s => ({
        type: s.type,
        title: s.title,
        subtitle: s.subtitle,
        content: s.content,
        sortOrder: s.sortOrder,
        visible: s.visible,
        settings: s.settings
      })),
      menus: await Promise.all(menus.map(async m => {
        const items = await prisma.menuItem.findMany({
          where: { menuId: m.id, parentId: null },
          include: { children: { include: { children: true } } },
          orderBy: { sortOrder: 'asc' }
        });
        return {
          name: m.name,
          location: m.location,
          items: buildMenuTree(items)
        };
      })),
      footer: footer.map(f => ({
        columnNum: f.columnNum,
        title: f.title,
        content: f.content,
        sortOrder: f.sortOrder
      })),
      settings: settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {})
    };
    
    // Create the template
    const template = await prisma.template.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        description,
        category: category || 'custom',
        data: templateData
      }
    });
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Export template error:', error);
    res.status(500).json({ error: 'Fout bij exporteren template' });
  }
});

// Helper to build menu tree for export
function buildMenuTree(items) {
  return items.map(item => ({
    label: item.label,
    url: item.url,
    sortOrder: item.sortOrder,
    target: item.target,
    cssClass: item.cssClass,
    icon: item.icon,
    styles: item.styles,
    children: item.children ? buildMenuTree(item.children) : []
  }));
}

// Download template as JSON file
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template niet gevonden' });
    }
    
    // Create export object
    const exportData = {
      exportVersion: '1.0',
      exportDate: new Date().toISOString(),
      template: {
        name: template.name,
        slug: template.slug,
        description: template.description,
        thumbnail: template.thumbnail,
        category: template.category,
        version: template.version,
        data: template.data
      }
    };
    
    // Set headers for file download
    const filename = `${template.slug || template.name.toLowerCase().replace(/\s+/g, '-')}-template.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({ error: 'Fout bij downloaden template' });
  }
});

// Import template from JSON
router.post('/import', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const { templateData, overwrite = false } = req.body;
    
    if (!templateData) {
      return res.status(400).json({ error: 'Geen template data ontvangen' });
    }
    
    // Parse if string
    let data = typeof templateData === 'string' ? JSON.parse(templateData) : templateData;
    
    // Handle both direct template format and wrapped export format
    let template = data.template || data;
    
    if (!template.name) {
      return res.status(400).json({ error: 'Template naam is verplicht' });
    }
    
    // Check if template with same name exists
    const existing = await prisma.template.findFirst({
      where: { name: template.name }
    });
    
    if (existing && !overwrite) {
      return res.status(409).json({ 
        error: 'Template met deze naam bestaat al',
        existingId: existing.id,
        existingName: existing.name
      });
    }
    
    let result;
    if (existing && overwrite) {
      // Update existing
      result = await prisma.template.update({
        where: { id: existing.id },
        data: {
          slug: template.slug || template.name.toLowerCase().replace(/\s+/g, '-'),
          description: template.description,
          thumbnail: template.thumbnail,
          category: template.category || 'imported',
          version: template.version || '1.0',
          data: template.data,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new
      result = await prisma.template.create({
        data: {
          name: template.name,
          slug: template.slug || template.name.toLowerCase().replace(/\s+/g, '-'),
          description: template.description,
          thumbnail: template.thumbnail,
          category: template.category || 'imported',
          version: template.version || '1.0',
          data: template.data,
          isActive: true
        }
      });
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Import template error:', error);
    res.status(500).json({ error: 'Fout bij importeren template: ' + error.message });
  }
});

// Duplicate/clone a template
router.post('/:id/duplicate', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template niet gevonden' });
    }
    
    // Find unique name
    let newName = `${template.name} (kopie)`;
    let counter = 1;
    while (await prisma.template.findFirst({ where: { name: newName } })) {
      counter++;
      newName = `${template.name} (kopie ${counter})`;
    }
    
    const duplicate = await prisma.template.create({
      data: {
        name: newName,
        slug: newName.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, ''),
        description: template.description,
        thumbnail: template.thumbnail,
        category: template.category,
        version: '1.0',
        data: template.data,
        isActive: true
      }
    });
    
    res.status(201).json(duplicate);
  } catch (error) {
    console.error('Duplicate template error:', error);
    res.status(500).json({ error: 'Fout bij dupliceren template' });
  }
});

module.exports = router;
