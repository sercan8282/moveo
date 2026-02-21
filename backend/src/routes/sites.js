/**
 * Managed Sites API Routes
 * Handles CRUD operations and Docker orchestration for multi-site deployment
 * SUPER_ADMIN only
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const dockerOrchestrator = require('../services/dockerOrchestrator');

// Helper to generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * GET /api/sites/docker-status
 * Check if Docker is accessible (public endpoint - no auth required)
 */
router.get('/docker-status', async (req, res) => {
  try {
    const status = await dockerOrchestrator.checkDockerConnection();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// All other routes require SUPER_ADMIN
router.use(authenticate);
router.use(authorize('SUPER_ADMIN'));

/**
 * GET /api/sites
 * List all managed sites
 */
router.get('/', async (req, res) => {
  try {
    const sites = await prisma.managedSite.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Get live status for each site
    const sitesWithStatus = await Promise.all(
      sites.map(async (site) => {
        let liveStatus = null;
        if (site.status === 'RUNNING' || site.status === 'STOPPED') {
          try {
            liveStatus = await dockerOrchestrator.getSiteStatus(site.containerPrefix);
          } catch (e) {
            // Ignore status errors
          }
        }
        return { ...site, liveStatus };
      })
    );
    
    res.json(sitesWithStatus);
  } catch (error) {
    console.error('Error listing sites:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sites/:id
 * Get a single site with detailed status
 */
router.get('/:id', async (req, res) => {
  try {
    const site = await prisma.managedSite.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    // Get live container status
    let liveStatus = null;
    if (site.containerPrefix) {
      try {
        liveStatus = await dockerOrchestrator.getSiteStatus(site.containerPrefix);
      } catch (e) {
        liveStatus = { error: e.message };
      }
    }
    
    res.json({ ...site, liveStatus, adminPassword: undefined }); // Hide password
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sites
 * Create a new site (doesn't deploy yet)
 */
router.post('/', async (req, res) => {
  try {
    const { name, domain, description, adminEmail } = req.body;
    
    if (!name || !adminEmail) {
      return res.status(400).json({ error: 'Name and admin email are required' });
    }
    
    const slug = generateSlug(name);
    const containerPrefix = `site-${slug}`;
    
    // Find 5 available ports: nginx, npm-http, npm-https, npm-admin, portainer
    const [nginxPort, npmHttpPort, npmHttpsPort, npmAdminPort, portainerPort] = 
      await dockerOrchestrator.findAvailablePorts(5, 8100);
    
    // Generate credentials
    const dbPassword = dockerOrchestrator.generatePassword();
    const jwtSecret = dockerOrchestrator.generateSecret();
    const adminPassword = dockerOrchestrator.generatePassword();
    
    const site = await prisma.managedSite.create({
      data: {
        name,
        slug,
        domain: domain || null,
        description: description || null,
        status: 'PENDING',
        nginxPort,
        npmHttpPort,
        npmHttpsPort,
        npmAdminPort,
        portainerPort,
        containerPrefix,
        dbPassword,
        jwtSecret,
        adminEmail,
        adminPassword
      }
    });
    
    res.status(201).json({
      ...site,
      message: `Site created. Use POST /api/sites/${site.id}/deploy to deploy.`
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A site with this name already exists' });
    }
    console.error('Error creating site:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sites/:id/deploy
 * Deploy a pending site
 */
router.post('/:id/deploy', async (req, res) => {
  const siteId = parseInt(req.params.id);
  
  try {
    const site = await prisma.managedSite.findUnique({
      where: { id: siteId }
    });
    
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    if (site.status === 'RUNNING') {
      return res.status(400).json({ error: 'Site is already running' });
    }
    
    if (site.status === 'DEPLOYING') {
      return res.status(400).json({ error: 'Site is currently being deployed' });
    }
    
    // Update status to deploying
    await prisma.managedSite.update({
      where: { id: siteId },
      data: { status: 'DEPLOYING', errorMessage: null }
    });
    
    // Start deployment (async)
    res.json({ message: 'Deployment started', status: 'DEPLOYING' });
    
    // Deploy in background
    setImmediate(async () => {
      try {
        const result = await dockerOrchestrator.deploySite({
          name: site.name,
          slug: site.slug,
          containerPrefix: site.containerPrefix,
          dbPassword: site.dbPassword,
          jwtSecret: site.jwtSecret,
          adminEmail: site.adminEmail,
          adminPassword: site.adminPassword
        });
        
        await prisma.managedSite.update({
          where: { id: siteId },
          data: {
            status: 'RUNNING',
            // Update ports from deployment result
            nginxPort: result.ports.nginx,
            npmHttpPort: result.ports.npmHttp,
            npmHttpsPort: result.ports.npmHttps,
            npmAdminPort: result.ports.npmAdmin,
            portainerPort: result.ports.portainer,
            // Container IDs
            nginxContainerId: result.containers.nginx,
            backendContainerId: result.containers.backend,
            postgresContainerId: result.containers.postgres,
            redisContainerId: result.containers.redis,
            npmContainerId: result.containers.npm,
            npmDbContainerId: result.containers.npmDb,
            portainerContainerId: result.containers.portainer,
            lastHealthCheck: new Date()
          }
        });
        
        console.log(`[${site.slug}] Deployment completed successfully`);
      } catch (error) {
        console.error(`[${site.slug}] Deployment failed:`, error);
        await prisma.managedSite.update({
          where: { id: siteId },
          data: {
            status: 'ERROR',
            errorMessage: error.message
          }
        });
      }
    });
    
  } catch (error) {
    console.error('Error starting deployment:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sites/:id/stop
 * Stop a running site
 */
router.post('/:id/stop', async (req, res) => {
  try {
    const site = await prisma.managedSite.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    const results = await dockerOrchestrator.stopSite(site.containerPrefix);
    
    await prisma.managedSite.update({
      where: { id: site.id },
      data: { status: 'STOPPED' }
    });
    
    res.json({ message: 'Site stopped', results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sites/:id/start
 * Start a stopped site
 */
router.post('/:id/start', async (req, res) => {
  try {
    const site = await prisma.managedSite.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    const results = await dockerOrchestrator.startSite(site.containerPrefix);
    
    await prisma.managedSite.update({
      where: { id: site.id },
      data: { status: 'RUNNING', lastHealthCheck: new Date() }
    });
    
    res.json({ message: 'Site started', results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/sites/:id
 * Remove a site completely (containers + volumes)
 */
router.delete('/:id', async (req, res) => {
  try {
    const site = await prisma.managedSite.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    // Remove Docker resources
    const dockerResults = await dockerOrchestrator.removeSite(site.containerPrefix);
    
    // Remove from database
    await prisma.managedSite.delete({
      where: { id: site.id }
    });
    
    res.json({ message: 'Site removed', results: dockerResults });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/sites/:id
 * Update site details (domain, description)
 */
router.put('/:id', async (req, res) => {
  try {
    const { domain, description, name } = req.body;
    
    const site = await prisma.managedSite.update({
      where: { id: parseInt(req.params.id) },
      data: {
        domain: domain !== undefined ? domain : undefined,
        description: description !== undefined ? description : undefined,
        name: name !== undefined ? name : undefined
      }
    });
    
    res.json(site);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sites/:id/credentials
 * Get site credentials (admin only, for initial setup)
 */
router.get('/:id/credentials', async (req, res) => {
  try {
    const site = await prisma.managedSite.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        name: true,
        slug: true,
        nginxPort: true,
        adminEmail: true,
        adminPassword: true,
        domain: true
      }
    });
    
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    res.json({
      ...site,
      accessUrl: site.domain 
        ? `https://${site.domain}` 
        : `http://localhost:${site.nginxPort}`,
      adminUrl: site.domain
        ? `https://${site.domain}/admin`
        : `http://localhost:${site.nginxPort}/admin`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
