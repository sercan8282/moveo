const { PrismaClient } = require('@prisma/client');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Replacement photos for the 6 that failed + the 1 failed video
const EXTRA_ITEMS = [
  // Vrachtwagen replacements
  {
    url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&h=1080&fit=crop&q=90',
    name: 'vrachtwagen-rood.jpg',
    alt: 'Rode vrachtwagen op de weg bij zonsondergang',
    mimeType: 'image/jpeg'
  },
  {
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1920&h=1080&fit=crop&q=90',
    name: 'vrachtwagen-zonsondergang.jpg',
    alt: 'Vrachtwagen op de weg bij avondlicht',
    mimeType: 'image/jpeg'
  },
  // Motorwagen replacements
  {
    url: 'https://images.unsplash.com/photo-1612810436521-3e2bf3412000?w=1920&h=1080&fit=crop&q=90',
    name: 'motorwagen-bezorging.jpg',
    alt: 'Moderne bestelwagen voor bezorging',
    mimeType: 'image/jpeg'
  },
  {
    url: 'https://images.unsplash.com/photo-1617886903355-9354053e1c75?w=1920&h=1080&fit=crop&q=90',
    name: 'motorwagen-wit.jpg',
    alt: 'Witte bestelwagen voor goederenvervoer',
    mimeType: 'image/jpeg'
  },
  {
    url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1920&h=1080&fit=crop&q=90',
    name: 'motorwagen-stad.jpg',
    alt: 'Bestelwagen in stedelijk gebied',
    mimeType: 'image/jpeg'
  },
  // Warehouse replacement
  {
    url: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&h=1080&fit=crop&q=90',
    name: 'warehouse-groot.jpg',
    alt: 'Groot magazijn met stellingen en dozen',
    mimeType: 'image/jpeg'
  },
  // Failed video retry
  {
    url: 'https://videos.pexels.com/video-files/17899033/17899033-hd_1920_1080_24fps.mp4',
    name: 'vrachtwagen-rijdend.mp4',
    alt: 'Vrachtwagen rijdt over de weg',
    mimeType: 'video/mp4'
  }
];

function downloadFile(url, dest, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.get(url, {
      headers: { 'User-Agent': 'Moveo-CMS/1.0' },
      timeout: 120000
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        try { fs.unlinkSync(dest); } catch(e) {}
        let redirectUrl = response.headers.location;
        if (redirectUrl.startsWith('/')) {
          const parsed = new URL(url);
          redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
        }
        return downloadFile(redirectUrl, dest, maxRedirects - 1).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(dest); } catch(e) {}
        return reject(new Error(`HTTP ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });
    request.on('error', (err) => {
      file.close();
      try { if (fs.existsSync(dest)) fs.unlinkSync(dest); } catch(e) {}
      reject(err);
    });
    request.on('timeout', () => {
      request.destroy();
      try { if (fs.existsSync(dest)) fs.unlinkSync(dest); } catch(e) {}
      reject(new Error('Download timeout'));
    });
  });
}

async function fixMissing() {
  console.log('🔧 Fixing missing media downloads...\n');
  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

  let success = 0;
  for (const item of EXTRA_ITEMS) {
    const filePath = path.join(uploadDir, item.name);

    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
      console.log(`  ⏭️  ${item.name} already exists`);
      success++;
      continue;
    }

    try {
      console.log(`  📥 Downloading ${item.name}...`);
      await downloadFile(item.url, filePath);
      const stats = fs.statSync(filePath);
      if (stats.size < 500) {
        console.warn(`  ⚠️  ${item.name} too small, skipping`);
        try { fs.unlinkSync(filePath); } catch(e) {}
        continue;
      }

      const sizeStr = item.mimeType.startsWith('video/')
        ? `${(stats.size / 1024 / 1024).toFixed(1)} MB`
        : `${(stats.size / 1024).toFixed(0)} KB`;
      console.log(`  ✅ ${item.name} (${sizeStr})`);

      // Ensure DB record
      const existing = await prisma.media.findFirst({ where: { filename: item.name } });
      if (!existing) {
        await prisma.media.create({
          data: {
            filename: item.name,
            originalName: item.name,
            mimeType: item.mimeType,
            size: stats.size,
            path: `/uploads/${item.name}`,
            altText: item.alt,
            width: 1920,
            height: 1080
          }
        });
      }
      success++;
    } catch (error) {
      console.warn(`  ⚠️  Could not download ${item.name}: ${error.message}`);
    }
  }

  console.log(`\n✅ Fixed: ${success}/${EXTRA_ITEMS.length}`);
}

fixMissing()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
