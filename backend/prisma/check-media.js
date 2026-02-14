const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const m = await p.media.findMany({
    where: {
      OR: [
        { mimeType: 'video/mp4' },
        { filename: { startsWith: 'vrachtwagen' } },
        { filename: { startsWith: 'motorwagen' } },
        { filename: { startsWith: 'warehouse-groot' } },
        { filename: { startsWith: 'transport-panorama' } },
        { filename: { startsWith: 'snelweg' } },
        { filename: { startsWith: 'containerschip' } }
      ]
    },
    select: { id: true, filename: true, mimeType: true, size: true },
    orderBy: { filename: 'asc' }
  });

  console.log('--- NEW MEDIA IN DATABASE ---');
  var photos = 0, videos = 0;
  m.forEach(function(x) {
    var sizeStr = x.mimeType.startsWith('video/')
      ? (x.size / 1024 / 1024).toFixed(1) + ' MB'
      : (x.size / 1024).toFixed(0) + ' KB';
    var type = x.mimeType.startsWith('video/') ? 'VIDEO' : 'PHOTO';
    console.log('#' + x.id + ' | ' + type + ' | ' + x.filename + ' | ' + sizeStr);
    if (type === 'VIDEO') videos++;
    else photos++;
  });
  console.log('\nTotal: ' + photos + ' photos + ' + videos + ' videos = ' + m.length + ' items');
}

check().catch(console.error).finally(function() { p.$disconnect(); });
