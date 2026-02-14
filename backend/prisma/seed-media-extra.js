const { PrismaClient } = require('@prisma/client');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// ============================================================
// HIGH-QUALITY FREE TRUCK & TRANSPORT PHOTOS (Unsplash - free)
// ============================================================
const EXTRA_PHOTOS = [
  // --- Vrachtwagens (trucks) ---
  {
    url: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1920&h=1080&fit=crop&q=90',
    name: 'vrachtwagen-snelweg.jpg',
    alt: 'Witte vrachtwagen op de snelweg',
    category: 'vrachtwagen'
  },
  {
    url: 'https://images.unsplash.com/photo-1562674506-60fafe0ffa0d?w=1920&h=1080&fit=crop&q=90',
    name: 'vrachtwagen-rood.jpg',
    alt: 'Rode vrachtwagen op een bergweg',
    category: 'vrachtwagen'
  },
  {
    url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1920&h=1080&fit=crop&q=90',
    name: 'vrachtwagen-vloot.jpg',
    alt: 'Vloot van vrachtwagens geparkeerd',
    category: 'vrachtwagen'
  },
  {
    url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c6?w=1920&h=1080&fit=crop&q=90',
    name: 'vrachtwagen-zonsondergang.jpg',
    alt: 'Vrachtwagen bij zonsondergang op de weg',
    category: 'vrachtwagen'
  },
  {
    url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1920&h=1280&fit=crop&q=90',
    name: 'vrachtwagen-container.jpg',
    alt: 'Container vrachtwagen op transport route',
    category: 'vrachtwagen'
  },
  {
    url: 'https://images.unsplash.com/photo-1591768793355-74d04bb6608f?w=1920&h=1080&fit=crop&q=90',
    name: 'vrachtwagen-laden.jpg',
    alt: 'Vrachtwagen wordt geladen bij magazijn',
    category: 'vrachtwagen'
  },
  {
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&h=1080&fit=crop&q=90',
    name: 'vrachtwagen-highway.jpg',
    alt: 'Vrachtwagen op de autosnelweg',
    category: 'vrachtwagen'
  },
  {
    url: 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?w=1920&h=1080&fit=crop&q=90',
    name: 'vrachtwagen-europa.jpg',
    alt: 'Europese vrachtwagen op internationale route',
    category: 'vrachtwagen'
  },
  // --- Motorwagens ---
  {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&h=1080&fit=crop&q=90',
    name: 'motorwagen-bezorging.jpg',
    alt: 'Bezorgwagen voor expreslevering',
    category: 'motorwagen'
  },
  {
    url: 'https://images.unsplash.com/photo-1609093375232-aacd5ba4f3ae?w=1920&h=1080&fit=crop&q=90',
    name: 'motorwagen-wit.jpg',
    alt: 'Witte bestelwagen voor goederenvervoer',
    category: 'motorwagen'
  },
  {
    url: 'https://images.unsplash.com/photo-1632865023913-6a38daf0d1d1?w=1920&h=1080&fit=crop&q=90',
    name: 'motorwagen-stad.jpg',
    alt: 'Motorwagen in de stad voor distributie',
    category: 'motorwagen'
  },
  {
    url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1920&h=1080&fit=crop&q=90',
    name: 'motorwagen-transport.jpg',
    alt: 'Motorwagen voor regionaal transport',
    category: 'motorwagen'
  },
  // --- Extra transport / logistics ---
  {
    url: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=1920&h=1080&fit=crop&q=90',
    name: 'warehouse-groot.jpg',
    alt: 'Groot distributiecentrum met pallets',
    category: 'logistics'
  },
  {
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&h=1280&fit=crop&q=90',
    name: 'transport-panorama.jpg',
    alt: 'Panorama van transportvloot',
    category: 'logistics'
  },
  {
    url: 'https://images.unsplash.com/photo-1473445730015-841f29a9490b?w=1920&h=1080&fit=crop&q=90',
    name: 'snelweg-luchtfoto.jpg',
    alt: 'Luchtfoto van snelweg met verkeer',
    category: 'logistics'
  },
  {
    url: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=1920&h=1080&fit=crop&q=90',
    name: 'containerschip-haven.jpg',
    alt: 'Containerschip in de haven',
    category: 'logistics'
  }
];

// ============================================================
// FREE TRANSPORT VIDEOS (Pexels - free for commercial use)
// Using HD 1080p versions to keep file sizes reasonable
// ============================================================
const TRANSPORT_VIDEOS = [
  {
    url: 'https://videos.pexels.com/video-files/17899033/17899033-hd_1920_1080_24fps.mp4',
    name: 'vrachtwagen-rijdend.mp4',
    alt: 'Vrachtwagen rijdt over de weg',
    category: 'vrachtwagen',
    credit: 'Pexels'
  },
  {
    url: 'https://videos.pexels.com/video-files/6193732/6193732-hd_1920_1080_30fps.mp4',
    name: 'trucks-terminal.mp4',
    alt: 'Vrachtwagenrij bij containerterminal',
    category: 'vrachtwagen',
    credit: 'Pexels'
  },
  {
    url: 'https://videos.pexels.com/video-files/4320049/4320049-hd_1920_1080_30fps.mp4',
    name: 'cargo-truck-highway.mp4',
    alt: 'Cargo vrachtwagen op de snelweg',
    category: 'vrachtwagen',
    credit: 'Pexels'
  },
  {
    url: 'https://videos.pexels.com/video-files/10472290/10472290-hd_1920_1080_25fps.mp4',
    name: 'laden-vrachtwagen.mp4',
    alt: 'Goederen laden in vrachtwagen',
    category: 'logistics',
    credit: 'Pexels'
  },
  {
    url: 'https://videos.pexels.com/video-files/4440958/4440958-hd_1920_1080_25fps.mp4',
    name: 'bezorging-pakketten.mp4',
    alt: 'Pakketbezorging en logistiek',
    category: 'motorwagen',
    credit: 'Pexels'
  },
  {
    url: 'https://videos.pexels.com/video-files/855778/855778-hd_1920_1080_30fps.mp4',
    name: 'verkeer-stad.mp4',
    alt: 'Stadsverkeer met vrachtwagens',
    category: 'logistics',
    credit: 'Pexels'
  }
];

// ============================================================
// Download helpers
// ============================================================
function downloadFile(url, dest, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));

    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, {
      headers: { 'User-Agent': 'Moveo-CMS/1.0' },
      timeout: 120000 // 2 min timeout for videos
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
      file.on('finish', () => {
        file.close();
        resolve();
      });
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

async function seedExtraMedia() {
  console.log('📸 Starting extra media download...\n');

  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  // ========== PHOTOS ==========
  console.log('🖼️  Downloading high-quality transport photos...');
  let photoCount = 0;
  for (const img of EXTRA_PHOTOS) {
    const filePath = path.join(uploadDir, img.name);

    // Check if already downloaded
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
      console.log(`  ⏭️  ${img.name} already exists`);
      // Ensure DB record exists
      await ensureMediaRecord(img, filePath, 'image/jpeg');
      photoCount++;
      continue;
    }

    try {
      console.log(`  📥 Downloading ${img.name}...`);
      await downloadFile(img.url, filePath);
      const stats = fs.statSync(filePath);
      if (stats.size < 1000) {
        console.warn(`  ⚠️  ${img.name} too small (${stats.size} bytes), skipping`);
        try { fs.unlinkSync(filePath); } catch(e) {}
        continue;
      }
      console.log(`  ✅ ${img.name} (${(stats.size / 1024).toFixed(0)} KB)`);
      await ensureMediaRecord(img, filePath, 'image/jpeg');
      photoCount++;
    } catch (error) {
      console.warn(`  ⚠️  Could not download ${img.name}: ${error.message}`);
    }
  }
  console.log(`\n📊 Photos: ${photoCount}/${EXTRA_PHOTOS.length} downloaded\n`);

  // ========== VIDEOS ==========
  console.log('🎬 Downloading transport videos (this may take a few minutes)...');
  let videoCount = 0;
  for (const vid of TRANSPORT_VIDEOS) {
    const filePath = path.join(uploadDir, vid.name);

    // Check if already downloaded
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 10000) {
      console.log(`  ⏭️  ${vid.name} already exists`);
      await ensureMediaRecord(vid, filePath, 'video/mp4');
      videoCount++;
      continue;
    }

    try {
      console.log(`  📥 Downloading ${vid.name}...`);
      await downloadFile(vid.url, filePath);
      const stats = fs.statSync(filePath);
      if (stats.size < 10000) {
        console.warn(`  ⚠️  ${vid.name} too small (${stats.size} bytes), skipping`);
        try { fs.unlinkSync(filePath); } catch(e) {}
        continue;
      }
      const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
      console.log(`  ✅ ${vid.name} (${sizeMB} MB)`);
      await ensureMediaRecord(vid, filePath, 'video/mp4');
      videoCount++;
    } catch (error) {
      console.warn(`  ⚠️  Could not download ${vid.name}: ${error.message}`);
    }
  }
  console.log(`\n📊 Videos: ${videoCount}/${TRANSPORT_VIDEOS.length} downloaded`);

  console.log('\n🎉 Extra media download completed!');
  console.log(`   Total: ${photoCount} photos + ${videoCount} videos`);
}

async function ensureMediaRecord(item, filePath, mimeType) {
  const existing = await prisma.media.findFirst({ where: { filename: item.name } });
  if (existing) return existing;

  const stats = fs.statSync(filePath);
  const isVideo = mimeType.startsWith('video/');

  const media = await prisma.media.create({
    data: {
      filename: item.name,
      originalName: item.name,
      mimeType: mimeType,
      size: stats.size,
      path: `/uploads/${item.name}`,
      altText: item.alt,
      width: isVideo ? 1920 : 1920,
      height: isVideo ? 1080 : 1080
    }
  });

  return media;
}

seedExtraMedia()
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
