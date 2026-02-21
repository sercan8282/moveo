/**
 * Docker Orchestrator Service
 * Manages deployment of new Moveo CMS sites as complete Docker stacks
 * Each site gets: PostgreSQL, Redis, Backend, Nginx, NPM, Portainer
 */

const Docker = require('dockerode');
const crypto = require('crypto');

// Docker client - connects to Docker daemon via socket
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Image names
const IMAGES = {
  nginx: 'moveo-nginx:latest',
  siteBackend: 'moveo-site-backend:latest',  // Site-specific backend (no multi-site management)
  postgres: 'postgres:16-alpine',
  redis: 'redis:7-alpine',
  npm: 'jc21/nginx-proxy-manager:latest',
  npmDb: 'jc21/mariadb-aria:latest',
  portainer: 'portainer/portainer-ce:latest'
};

/**
 * Generate a secure random string
 */
function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

/**
 * Generate a secure URL-safe password (no special chars that break DATABASE_URL)
 */
function generatePassword(length = 24) {
  // Only alphanumeric - safe for URLs and database connection strings
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

/**
 * Find multiple available ports starting from a base
 */
async function findAvailablePorts(count = 1, startPort = 8100) {
  const containers = await docker.listContainers({ all: true });
  const usedPorts = new Set();
  
  containers.forEach(container => {
    if (container.Ports) {
      container.Ports.forEach(port => {
        if (port.PublicPort) {
          usedPorts.add(port.PublicPort);
        }
      });
    }
  });
  
  const ports = [];
  let port = startPort;
  while (ports.length < count) {
    if (!usedPorts.has(port)) {
      ports.push(port);
    }
    port++;
  }
  return ports;
}

/**
 * Find single available port
 */
async function findAvailablePort(startPort = 8100) {
  const ports = await findAvailablePorts(1, startPort);
  return ports[0];
}

/**
 * Create a network if it doesn't exist
 */
async function ensureNetwork(networkName) {
  try {
    const networks = await docker.listNetworks();
    const exists = networks.some(n => n.Name === networkName);
    
    if (!exists) {
      await docker.createNetwork({
        Name: networkName,
        Driver: 'bridge'
      });
      console.log(`Created network: ${networkName}`);
    }
    return networkName;
  } catch (error) {
    console.error('Error ensuring network:', error);
    throw error;
  }
}

/**
 * Wait for container to be healthy
 */
async function waitForHealthy(containerId, timeout = 120000) {
  const startTime = Date.now();
  const container = docker.getContainer(containerId);
  let unhealthyCount = 0;
  const maxUnhealthyRetries = 3; // Allow some unhealthy states before failing
  
  while (Date.now() - startTime < timeout) {
    try {
      const info = await container.inspect();
      const health = info.State.Health;
      
      if (!health) {
        // No healthcheck, assume healthy after a short delay
        await new Promise(r => setTimeout(r, 5000));
        return true;
      }
      
      if (health.Status === 'healthy') {
        return true;
      }
      
      if (health.Status === 'unhealthy') {
        unhealthyCount++;
        console.log(`Container ${containerId.slice(0, 12)} unhealthy (attempt ${unhealthyCount}/${maxUnhealthyRetries})`);
        
        // Get the last health check log
        if (health.Log && health.Log.length > 0) {
          const lastLog = health.Log[health.Log.length - 1];
          console.log(`Health check output: ${lastLog.Output}`);
        }
        
        if (unhealthyCount >= maxUnhealthyRetries) {
          // Get container logs for debugging
          try {
            const logs = await container.logs({ stdout: true, stderr: true, tail: 20 });
            console.log(`Container logs:\n${logs.toString()}`);
          } catch (e) {
            console.log('Could not get container logs');
          }
          throw new Error(`Container ${containerId} is unhealthy after ${unhealthyCount} attempts`);
        }
      }
      
      await new Promise(r => setTimeout(r, 3000));
    } catch (error) {
      if (error.message.includes('unhealthy')) throw error;
      console.log(`Error checking container health: ${error.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  throw new Error(`Timeout waiting for container ${containerId} to be healthy`);
}

/**
 * Deploy a complete site stack
 */
async function deploySite(siteConfig) {
  const {
    name,
    slug,
    containerPrefix,
    dbPassword,
    jwtSecret,
    adminEmail,
    adminPassword
  } = siteConfig;

  const networkName = `${containerPrefix}_network`;
  const containers = {};
  
  // Find 5 available ports: nginx, npm-http, npm-https, npm-admin, portainer
  const [nginxPort, npmHttpPort, npmHttpsPort, npmAdminPort, portainerPort] = 
    await findAvailablePorts(5, 8100);

  const ports = {
    nginx: nginxPort,
    npmHttp: npmHttpPort,
    npmHttps: npmHttpsPort,
    npmAdmin: npmAdminPort,
    portainer: portainerPort
  };

  console.log(`[${slug}] Allocated ports:`, ports);

  // Stack labels for grouping in Portainer/Docker
  const stackLabels = (service) => ({
    'com.docker.compose.project': containerPrefix,
    'com.docker.compose.service': service,
    'moveo.site.slug': slug,
    'moveo.site.name': name
  });

  try {
    // Create network
    await ensureNetwork(networkName);

    // ===================
    // 1. Deploy PostgreSQL
    // ===================
    console.log(`[${slug}] Deploying PostgreSQL...`);
    const postgresContainer = await docker.createContainer({
      Image: IMAGES.postgres,
      name: `${containerPrefix}-postgres`,
      Labels: stackLabels('postgres'),
      Env: [
        `POSTGRES_USER=moveo`,
        `POSTGRES_PASSWORD=${dbPassword}`,
        `POSTGRES_DB=moveo_cms`
      ],
      HostConfig: {
        NetworkMode: networkName,
        RestartPolicy: { Name: 'unless-stopped' },
        Binds: [
          `${containerPrefix}_postgres_data:/var/lib/postgresql/data`
        ]
      },
      Healthcheck: {
        Test: ['CMD-SHELL', 'pg_isready -U moveo -d moveo_cms'],
        Interval: 5000000000,
        Timeout: 5000000000,
        Retries: 10
      }
    });
    await postgresContainer.start();
    containers.postgres = postgresContainer.id;
    await waitForHealthy(containers.postgres);
    console.log(`[${slug}] PostgreSQL healthy`);
    // Extra wait for postgres to be fully ready for connections
    await new Promise(r => setTimeout(r, 3000));

    // ===================
    // 2. Deploy Redis
    // ===================
    console.log(`[${slug}] Deploying Redis...`);
    const redisContainer = await docker.createContainer({
      Image: IMAGES.redis,
      name: `${containerPrefix}-redis`,
      Labels: stackLabels('redis'),
      HostConfig: {
        NetworkMode: networkName,
        RestartPolicy: { Name: 'unless-stopped' }
      },
      Healthcheck: {
        Test: ['CMD', 'redis-cli', 'ping'],
        Interval: 5000000000,
        Timeout: 5000000000,
        Retries: 5
      }
    });
    await redisContainer.start();
    containers.redis = redisContainer.id;
    await waitForHealthy(containers.redis);
    console.log(`[${slug}] Redis healthy`);

    // ===================
    // 3. Deploy Backend
    // ===================
    console.log(`[${slug}] Deploying Backend...`);
    const backendContainer = await docker.createContainer({
      Image: IMAGES.siteBackend,
      name: `${containerPrefix}-backend`,
      Labels: stackLabels('backend'),
      Env: [
        `DATABASE_URL=postgresql://moveo:${dbPassword}@${containerPrefix}-postgres:5432/moveo_cms?schema=public`,
        `REDIS_URL=redis://${containerPrefix}-redis:6379`,
        `JWT_SECRET=${jwtSecret}`,
        `JWT_EXPIRES_IN=7d`,
        `NODE_ENV=production`,
        `PORT=4000`,
        `SITE_NAME=${name}`,
        `ADMIN_EMAIL=${adminEmail}`,
        `ADMIN_PASSWORD=${adminPassword}`
      ],
      HostConfig: {
        NetworkMode: networkName,
        RestartPolicy: { Name: 'unless-stopped' },
        Binds: [
          `${containerPrefix}_uploads:/app/uploads`
        ]
      },
      Healthcheck: {
        Test: ['CMD-SHELL', 'node -e "const h=require(\'http\');h.get(\'http://localhost:4000/api/health\',(r)=>{process.exit(r.statusCode===200?0:1)}).on(\'error\',()=>process.exit(1))"'],
        Interval: 15000000000,      // 15 seconds
        Timeout: 10000000000,       // 10 seconds
        Retries: 30,                // 30 retries
        StartPeriod: 180000000000   // 3 minutes - migrations need time!
      }
    });
    await backendContainer.start();
    containers.backend = backendContainer.id;
    console.log(`[${slug}] Backend started, waiting for migrations and health check (this may take a few minutes)...`);
    await waitForHealthy(containers.backend, 600000); // 10 minutes max
    console.log(`[${slug}] Backend healthy`);

    // ===================
    // 4. Deploy Nginx (Frontend)
    // ===================
    console.log(`[${slug}] Deploying Nginx...`);
    const nginxContainer = await docker.createContainer({
      Image: IMAGES.nginx,
      name: `${containerPrefix}-nginx`,
      Labels: stackLabels('nginx'),
      Env: [
        `BACKEND_HOST=${containerPrefix}-backend`
      ],
      ExposedPorts: {
        '80/tcp': {}
      },
      HostConfig: {
        NetworkMode: networkName,
        RestartPolicy: { Name: 'unless-stopped' },
        PortBindings: {
          '80/tcp': [{ HostPort: String(nginxPort) }]
        },
        Binds: [
          `${containerPrefix}_uploads:/var/www/uploads:ro`
        ]
      }
    });
    await nginxContainer.start();
    containers.nginx = nginxContainer.id;
    console.log(`[${slug}] Nginx running on port ${nginxPort}`);

    // ===================
    // 5. Deploy NPM Database (MariaDB)
    // ===================
    console.log(`[${slug}] Deploying NPM Database...`);
    const npmDbPassword = generatePassword();
    const npmDbContainer = await docker.createContainer({
      Image: IMAGES.npmDb,
      name: `${containerPrefix}-npm-db`,
      Labels: stackLabels('npm-db'),
      Env: [
        `MYSQL_ROOT_PASSWORD=${npmDbPassword}`,
        `MYSQL_DATABASE=npm`,
        `MYSQL_USER=npm`,
        `MYSQL_PASSWORD=${npmDbPassword}`
      ],
      HostConfig: {
        NetworkMode: networkName,
        RestartPolicy: { Name: 'unless-stopped' },
        Binds: [
          `${containerPrefix}_npm_data:/var/lib/mysql`
        ]
      }
    });
    await npmDbContainer.start();
    containers.npmDb = npmDbContainer.id;
    // Wait for MariaDB to initialize
    await new Promise(r => setTimeout(r, 15000));
    console.log(`[${slug}] NPM Database running`);

    // ===================
    // 6. Deploy Nginx Proxy Manager
    // ===================
    console.log(`[${slug}] Deploying Nginx Proxy Manager...`);
    const npmContainer = await docker.createContainer({
      Image: IMAGES.npm,
      name: `${containerPrefix}-npm`,
      Labels: stackLabels('npm'),
      Env: [
        `DB_MYSQL_HOST=${containerPrefix}-npm-db`,
        `DB_MYSQL_PORT=3306`,
        `DB_MYSQL_USER=npm`,
        `DB_MYSQL_PASSWORD=${npmDbPassword}`,
        `DB_MYSQL_NAME=npm`
      ],
      ExposedPorts: {
        '80/tcp': {},
        '443/tcp': {},
        '81/tcp': {}
      },
      HostConfig: {
        NetworkMode: networkName,
        RestartPolicy: { Name: 'unless-stopped' },
        PortBindings: {
          '80/tcp': [{ HostPort: String(npmHttpPort) }],
          '443/tcp': [{ HostPort: String(npmHttpsPort) }],
          '81/tcp': [{ HostPort: String(npmAdminPort) }]
        },
        Binds: [
          `${containerPrefix}_npm_letsencrypt:/etc/letsencrypt`
        ]
      }
    });
    await npmContainer.start();
    containers.npm = npmContainer.id;
    console.log(`[${slug}] NPM running - Admin: http://localhost:${npmAdminPort}`);

    // ===================
    // 7. Deploy Portainer
    // ===================
    console.log(`[${slug}] Deploying Portainer...`);
    const portainerContainer = await docker.createContainer({
      Image: IMAGES.portainer,
      name: `${containerPrefix}-portainer`,
      Labels: stackLabels('portainer'),
      ExposedPorts: {
        '9443/tcp': {}
      },
      HostConfig: {
        NetworkMode: networkName,
        RestartPolicy: { Name: 'unless-stopped' },
        PortBindings: {
          '9443/tcp': [{ HostPort: String(portainerPort) }]
        },
        Binds: [
          '/var/run/docker.sock:/var/run/docker.sock',
          `${containerPrefix}_portainer_data:/data`
        ]
      }
    });
    await portainerContainer.start();
    containers.portainer = portainerContainer.id;
    console.log(`[${slug}] Portainer running - https://localhost:${portainerPort}`);

    // ===================
    // Deployment Complete!
    // ===================
    console.log(`[${slug}] ========================================`);
    console.log(`[${slug}] DEPLOYMENT COMPLETED SUCCESSFULLY!`);
    console.log(`[${slug}] ========================================`);
    console.log(`[${slug}] Frontend:    http://localhost:${nginxPort}`);
    console.log(`[${slug}] NPM Admin:   http://localhost:${npmAdminPort}`);
    console.log(`[${slug}]              Default login: admin@example.com / changeme`);
    console.log(`[${slug}] Portainer:   https://localhost:${portainerPort}`);
    console.log(`[${slug}] CMS Admin:   ${adminEmail}`);
    console.log(`[${slug}] ========================================`);

    return {
      success: true,
      containers,
      ports,
      credentials: {
        npmDefaultEmail: 'admin@example.com',
        npmDefaultPassword: 'changeme',
        cmsAdminEmail: adminEmail,
        cmsAdminPassword: adminPassword
      }
    };

  } catch (error) {
    console.error(`[${slug}] Deployment failed:`, error);
    
    // Cleanup containers on failure
    for (const [name, id] of Object.entries(containers)) {
      try {
        const container = docker.getContainer(id);
        await container.stop();
        await container.remove();
        console.log(`[${slug}] Cleaned up ${name} container`);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    // Cleanup volumes on failure (important: removes old credentials)
    const volumeNames = [
      `${containerPrefix}_postgres_data`,
      `${containerPrefix}_uploads`,
      `${containerPrefix}_npm_data`,
      `${containerPrefix}_npm_mysql`,
      `${containerPrefix}_portainer_data`
    ];
    for (const volumeName of volumeNames) {
      try {
        const volume = docker.getVolume(volumeName);
        await volume.remove();
        console.log(`[${slug}] Cleaned up volume ${volumeName}`);
      } catch (e) {
        // Ignore - volume might not exist
      }
    }
    
    throw error;
  }
}

/**
 * Stop a site's containers
 */
async function stopSite(containerPrefix) {
  const services = ['nginx', 'backend', 'postgres', 'redis', 'npm', 'npm-db', 'portainer'];
  const results = {};

  for (const service of services) {
    const containerName = `${containerPrefix}-${service}`;
    try {
      const container = docker.getContainer(containerName);
      await container.stop();
      results[service] = 'stopped';
    } catch (error) {
      results[service] = error.message;
    }
  }

  return results;
}

/**
 * Start a site's containers
 */
async function startSite(containerPrefix) {
  const services = ['postgres', 'redis', 'npm-db', 'backend', 'nginx', 'npm', 'portainer'];
  const results = {};

  for (const service of services) {
    const containerName = `${containerPrefix}-${service}`;
    try {
      const container = docker.getContainer(containerName);
      await container.start();
      results[service] = 'started';
      
      // Wait for health on critical services
      if (['postgres', 'redis', 'backend'].includes(service)) {
        await waitForHealthy(container.id, 60000);
        results[service] = 'healthy';
      }
    } catch (error) {
      results[service] = error.message;
    }
  }

  return results;
}

/**
 * Remove a site completely
 */
async function removeSite(containerPrefix) {
  const services = ['nginx', 'backend', 'npm', 'npm-db', 'portainer', 'postgres', 'redis'];
  const results = { containers: {}, volumes: {}, network: null };

  // Stop and remove containers
  for (const service of services) {
    const containerName = `${containerPrefix}-${service}`;
    try {
      const container = docker.getContainer(containerName);
      try { await container.stop(); } catch (e) { /* already stopped */ }
      await container.remove();
      results.containers[service] = 'removed';
    } catch (error) {
      results.containers[service] = error.message;
    }
  }

  // Remove volumes
  const volumes = ['postgres_data', 'uploads', 'npm_data', 'npm_letsencrypt', 'portainer_data'];
  for (const vol of volumes) {
    const volumeName = `${containerPrefix}_${vol}`;
    try {
      const volume = docker.getVolume(volumeName);
      await volume.remove();
      results.volumes[vol] = 'removed';
    } catch (error) {
      results.volumes[vol] = error.message;
    }
  }

  // Remove network
  try {
    const network = docker.getNetwork(`${containerPrefix}_network`);
    await network.remove();
    results.network = 'removed';
  } catch (error) {
    results.network = error.message;
  }

  return results;
}

/**
 * Get site status
 */
async function getSiteStatus(containerPrefix) {
  const services = ['nginx', 'backend', 'postgres', 'redis', 'npm', 'npm-db', 'portainer'];
  const status = {};

  for (const service of services) {
    const containerName = `${containerPrefix}-${service}`;
    try {
      const container = docker.getContainer(containerName);
      const info = await container.inspect();
      status[service] = {
        running: info.State.Running,
        health: info.State.Health?.Status || 'no-healthcheck',
        startedAt: info.State.StartedAt
      };
    } catch (error) {
      status[service] = { error: error.message };
    }
  }

  return status;
}

/**
 * Get all running sites
 */
async function listManagedSites() {
  const containers = await docker.listContainers({ all: true });
  const sites = {};

  containers.forEach(container => {
    const name = container.Names[0]?.replace('/', '');
    if (name && name.startsWith('site-') && name.includes('-nginx')) {
      const prefix = name.replace('-nginx', '');
      sites[prefix] = {
        status: container.State,
        ports: container.Ports
      };
    }
  });

  return sites;
}

/**
 * Check Docker connectivity
 */
async function checkDockerConnection() {
  try {
    const info = await docker.info();
    return {
      connected: true,
      containers: info.Containers,
      images: info.Images,
      serverVersion: info.ServerVersion
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}

module.exports = {
  deploySite,
  stopSite,
  startSite,
  removeSite,
  getSiteStatus,
  listManagedSites,
  checkDockerConnection,
  findAvailablePort,
  findAvailablePorts,
  generateSecret,
  generatePassword
};
