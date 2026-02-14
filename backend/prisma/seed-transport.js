const { PrismaClient } = require('@prisma/client');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Free Unsplash images (via Unsplash Source - no API key needed)
const TRANSPORT_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=800&fit=crop',
    name: 'hero-transport.jpg',
    alt: 'Moderne transportvloot op snelweg',
    usage: 'hero'
  },
  {
    url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&h=800&fit=crop',
    name: 'wegtransport.jpg',
    alt: 'Vrachtwagen op de weg',
    usage: 'wegtransport'
  },
  {
    url: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=1200&h=800&fit=crop',
    name: 'warehouse.jpg',
    alt: 'Groot magazijn met pallets',
    usage: 'warehousing'
  },
  {
    url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1200&h=800&fit=crop',
    name: 'logistics.jpg',
    alt: 'Logistiek distributiecentrum',
    usage: 'logistics'
  },
  {
    url: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&h=800&fit=crop',
    name: 'team-transport.jpg',
    alt: 'Professioneel transportteam',
    usage: 'about'
  },
  {
    url: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=1200&h=800&fit=crop',
    name: 'international.jpg',
    alt: 'Containerschip op zee',
    usage: 'international'
  },
  {
    url: 'https://images.unsplash.com/photo-1616432043562-3671ea2e5242?w=1200&h=800&fit=crop',
    name: 'delivery-van.jpg',
    alt: 'Express bezorgdienst',
    usage: 'express'
  },
  {
    url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=1200&h=800&fit=crop',
    name: 'supply-chain.jpg',
    alt: 'Supply chain management',
    usage: 'supply-chain'
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, { 
      headers: { 'User-Agent': 'Moveo-CMS/1.0' },
      timeout: 30000
    }, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
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
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });

    request.on('timeout', () => {
      request.destroy();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(new Error('Download timeout'));
    });
  });
}

async function downloadImages() {
  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const mediaRecords = [];
  
  for (const img of TRANSPORT_IMAGES) {
    const filePath = path.join(uploadDir, img.name);
    
    // Check if already downloaded
    if (fs.existsSync(filePath)) {
      console.log(`  ⏭️  ${img.name} already exists`);
      const stats = fs.statSync(filePath);
      mediaRecords.push({
        filename: img.name,
        originalName: img.name,
        mimeType: 'image/jpeg',
        size: stats.size,
        path: `/uploads/${img.name}`,
        altText: img.alt,
        width: 1200,
        height: 800,
        usage: img.usage
      });
      continue;
    }

    try {
      console.log(`  📥 Downloading ${img.name}...`);
      await downloadFile(img.url, filePath);
      const stats = fs.statSync(filePath);
      console.log(`  ✅ ${img.name} (${(stats.size / 1024).toFixed(0)} KB)`);
      
      mediaRecords.push({
        filename: img.name,
        originalName: img.name,
        mimeType: 'image/jpeg',
        size: stats.size,
        path: `/uploads/${img.name}`,
        altText: img.alt,
        width: 1200,
        height: 800,
        usage: img.usage
      });
    } catch (error) {
      console.warn(`  ⚠️  Could not download ${img.name}: ${error.message}`);
      // Create placeholder record anyway
      mediaRecords.push({
        filename: img.name,
        originalName: img.name,
        mimeType: 'image/jpeg',
        size: 0,
        path: `/uploads/${img.name}`,
        altText: img.alt,
        width: 1200,
        height: 800,
        usage: img.usage
      });
    }
  }

  return mediaRecords;
}

async function seedTransportContent() {
  console.log('🚛 Starting Moveo Transport content seed...\n');
  
  // 1. Download images
  console.log('📸 Downloading transport images...');
  const mediaRecords = await downloadImages();
  
  // 2. Insert media records into DB
  console.log('\n📦 Inserting media records...');
  const mediaMap = {};
  for (const record of mediaRecords) {
    const existing = await prisma.media.findFirst({ where: { filename: record.filename } });
    if (existing) {
      mediaMap[record.usage] = existing.id;
    } else {
      const media = await prisma.media.create({
        data: {
          filename: record.filename,
          originalName: record.originalName,
          mimeType: record.mimeType,
          size: record.size,
          path: record.path,
          altText: record.altText,
          width: record.width,
          height: record.height
        }
      });
      mediaMap[record.usage] = media.id;
    }
  }
  console.log('✅ Media records inserted\n');

  // 3. Create homepage sections (only if none exist)
  console.log('🏠 Checking homepage sections...');
  const existingHomepageSections = await prisma.homepageSection.count();
  if (existingHomepageSections > 0) {
    console.log('✅ Homepage sections already exist, skipping\n');
  } else {
  await prisma.homepageSection.createMany({
    data: [
      {
        type: 'hero',
        title: 'Moveo Transport & Logistiek',
        subtitle: 'Betrouwbaar transport door heel Europa. Veilig, snel en duurzaam.',
        sortOrder: 0,
        visible: true,
        settings: {
          imageUrl: `/uploads/hero-transport.jpg`,
          textAlign: 'center',
          height: 'large',
          showButton: true,
          buttonText: 'Offerte aanvragen',
          buttonUrl: '/contact'
        },
        content: { text: '' }
      },
      {
        type: 'featured',
        title: 'Onze Diensten',
        subtitle: 'Wij bieden een compleet pakket transport- en logistieke oplossingen',
        sortOrder: 1,
        visible: true,
        settings: { columns: 3, style: 'cards' },
        content: {
          items: [
            { 
              title: 'Wegtransport', 
              description: 'Nationaal en internationaal wegtransport met onze moderne vloot. Van deellading tot compleet transport.',
              icon: 'truck',
              imageUrl: `/uploads/wegtransport.jpg`
            },
            { 
              title: 'Warehousing', 
              description: 'Veilige opslag in onze moderne magazijnen. Cross-docking, orderpicking en voorraadbeheer.',
              icon: 'warehouse',
              imageUrl: `/uploads/warehouse.jpg`
            },
            { 
              title: 'Supply Chain', 
              description: 'Complete supply chain oplossingen. Van planning tot uitvoering, wij optimaliseren uw logistiek.',
              icon: 'link',
              imageUrl: `/uploads/supply-chain.jpg`
            }
          ]
        }
      },
      {
        type: 'content',
        title: 'Waarom Moveo?',
        subtitle: null,
        sortOrder: 2,
        visible: true,
        settings: { layout: 'text-image', imagePosition: 'right', imageUrl: `/uploads/team-transport.jpg` },
        content: { 
          text: `<p>Moveo Transport is al meer dan 20 jaar uw betrouwbare partner in transport en logistiek. Met een moderne vloot van meer dan 50 voertuigen bedienen wij klanten door heel Europa.</p>
<ul>
<li><strong>24/7 beschikbaar</strong> - Ons team staat dag en nacht voor u klaar</li>
<li><strong>Track & Trace</strong> - Real-time inzicht in uw zendingen</li>
<li><strong>ISO 9001 gecertificeerd</strong> - Kwaliteit staat bij ons voorop</li>
<li><strong>Duurzaam</strong> - Euro 6 motoren en CO2-compensatie</li>
</ul>` 
        }
      },
      {
        type: 'featured',
        title: 'Moveo in cijfers',
        subtitle: null,
        sortOrder: 3,
        visible: true,
        settings: { columns: 4, style: 'stats' },
        content: {
          items: [
            { title: '50+', description: 'Voertuigen', icon: 'truck' },
            { title: '20+', description: 'Jaar ervaring', icon: 'calendar' },
            { title: '2.500+', description: 'Tevreden klanten', icon: 'users' },
            { title: '15.000+', description: 'Leveringen per jaar', icon: 'package' }
          ]
        }
      },
      {
        type: 'cta',
        title: 'Klaar om uw transport te optimaliseren?',
        subtitle: 'Vraag vandaag nog een vrijblijvende offerte aan en ontdek wat Moveo voor u kan betekenen.',
        sortOrder: 4,
        visible: true,
        settings: {
          imageUrl: `/uploads/logistics.jpg`,
          buttonText: 'Neem contact op',
          buttonUrl: '/contact'
        },
        content: {}
      }
    ]
  });
  console.log('✅ Homepage sections created\n');
  }

  // 4. Create pages (only if they don't exist yet)
  console.log('📄 Checking transport pages...');
  
  const existingPages = await prisma.page.findMany({ select: { slug: true } });
  const existingSlugs = new Set(existingPages.map(p => p.slug));
  
  const pages = [
    {
      title: 'Home',
      slug: 'home',
      content: { blocks: [] },
      status: 'PUBLISHED',
      sortOrder: 0,
      template: 'default',
      metaTitle: 'Moveo Transport & Logistiek | Betrouwbaar transport door Europa',
      metaDescription: 'Moveo Transport & Logistiek verzorgt betrouwbaar wegtransport, warehousing en supply chain oplossingen door heel Europa.'
    },
    {
      title: 'Over ons',
      slug: 'over-ons',
      content: {
        html: `
<div class="page-section">
  <img src="/uploads/team-transport.jpg" alt="Het Moveo team" class="w-full rounded-xl mb-8 shadow-lg" />
  
  <h2>Wie zijn wij?</h2>
  <p>Moveo Transport & Logistiek is opgericht in 2004 met een duidelijke missie: betrouwbaar, flexibel en duurzaam transport verzorgen voor bedrijven in heel Europa. Wat begon met een kleine vloot van drie vrachtwagens, is uitgegroeid tot een volwaardig transport- en logistiekbedrijf met meer dan 50 voertuigen en 100 medewerkers.</p>
  
  <h2>Onze missie</h2>
  <p>Wij geloven dat transport meer is dan het verplaatsen van goederen van A naar B. Het gaat om betrouwbaarheid, veiligheid en een duurzame toekomst. Daarom investeren wij continu in:</p>
  <ul>
    <li><strong>Moderne vloot</strong> - Al onze voertuigen voldoen aan de strenge Euro 6-normen</li>
    <li><strong>Chauffeurstraining</strong> - Onze chauffeurs volgen regelmatig bijscholing in veilig en zuinig rijden</li>
    <li><strong>Technologie</strong> - GPS tracking, digitale vrachtbrieven en real-time communicatie</li>
    <li><strong>Duurzaamheid</strong> - CO2-compensatie, HVO-brandstof en onderzoek naar elektrisch transport</li>
  </ul>

  <h2>Ons team</h2>
  <p>Achter Moveo staat een team van bevlogen professionals. Van onze ervaren chauffeurs en planners tot ons klantenserviceteam – iedereen draagt bij aan het succes van uw transport. Wij werken met korte communicatielijnen, waardoor u altijd snel antwoord krijgt op uw vragen.</p>

  <h2>Certificeringen</h2>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
    <div class="bg-gray-50 rounded-lg p-6 text-center">
      <div class="text-3xl font-bold text-blue-600 mb-2">ISO 9001</div>
      <p class="text-sm text-gray-600">Kwaliteitsmanagement</p>
    </div>
    <div class="bg-gray-50 rounded-lg p-6 text-center">
      <div class="text-3xl font-bold text-blue-600 mb-2">ISO 14001</div>
      <p class="text-sm text-gray-600">Milieumanagement</p>
    </div>
    <div class="bg-gray-50 rounded-lg p-6 text-center">
      <div class="text-3xl font-bold text-blue-600 mb-2">AEO</div>
      <p class="text-sm text-gray-600">Authorized Economic Operator</p>
    </div>
  </div>
</div>`
      },
      status: 'PUBLISHED',
      sortOrder: 1,
      template: 'default',
      featuredImageId: mediaMap['about'] || null,
      metaTitle: 'Over ons | Moveo Transport & Logistiek',
      metaDescription: 'Leer meer over Moveo Transport, ons team, onze missie en certificeringen. Al meer dan 20 jaar uw betrouwbare transportpartner.'
    },
    {
      title: 'Diensten',
      slug: 'diensten',
      content: {
        html: `
<div class="page-section">
  <p class="text-xl text-gray-600 mb-12">Van nationaal wegtransport tot complete supply chain oplossingen – Moveo biedt een breed scala aan transport- en logistieke diensten.</p>

  <div class="service-block mb-12">
    <img src="/uploads/wegtransport.jpg" alt="Wegtransport" class="w-full rounded-xl mb-6 shadow-lg" />
    <h2>🚛 Wegtransport</h2>
    <p>Onze kernactiviteit is het verzorgen van wegtransport door heel Europa. Met onze moderne vloot van meer dan 50 voertuigen – van bestelwagens tot opleggers – kunnen wij elke transportvraag aan.</p>
    <ul>
      <li><strong>Nationaal transport</strong> - Dagelijkse ritten door heel Nederland en België</li>
      <li><strong>Internationaal transport</strong> - Vaste lijndiensten naar Duitsland, Frankrijk, Spanje, Italië en Scandinavië</li>
      <li><strong>Deelladingen (LTL)</strong> - Efficiënt transport van kleinere zendingen</li>
      <li><strong>Compleet transport (FTL)</strong> - Dedicated voertuigen voor uw lading</li>
      <li><strong>Groupage</strong> - Combineer uw zending met andere voor een scherpe prijs</li>
    </ul>
  </div>

  <div class="service-block mb-12">
    <img src="/uploads/warehouse.jpg" alt="Warehousing" class="w-full rounded-xl mb-6 shadow-lg" />
    <h2>🏭 Warehousing & Opslag</h2>
    <p>In ons moderne distributiecentrum van 15.000m² bieden wij flexibele opslagoplossingen voor uw producten.</p>
    <ul>
      <li><strong>Bulk- en palletopslag</strong> - Flexibele ruimte-indeling</li>
      <li><strong>Cross-docking</strong> - Snelle overslag zonder opslag</li>
      <li><strong>Orderpicking</strong> - Nauwkeurige samenstelling van orders</li>
      <li><strong>Voorraadbeheer</strong> - Real-time inzicht via ons WMS systeem</li>
      <li><strong>Value Added Services</strong> - Ompakken, labelen, kwaliteitscontrole</li>
    </ul>
  </div>

  <div class="service-block mb-12">
    <img src="/uploads/international.jpg" alt="Internationaal transport" class="w-full rounded-xl mb-6 shadow-lg" />
    <h2>🌍 Internationaal Transport</h2>
    <p>Dankzij ons uitgebreide Europese netwerk verzorgen wij betrouwbaar internationaal transport met vaste transitietijden.</p>
    <ul>
      <li><strong>Europa dekkend</strong> - Vaste lijndiensten naar 25+ landen</li>
      <li><strong>Douane</strong> - Complete douaneafhandeling in-house</li>
      <li><strong>ADR transport</strong> - Gecertificeerd vervoer van gevaarlijke stoffen</li>
      <li><strong>Geconditioneerd transport</strong> - Temperatuurgecontroleerd vervoer</li>
    </ul>
  </div>

  <div class="service-block mb-12">
    <img src="/uploads/delivery-van.jpg" alt="Express bezorging" class="w-full rounded-xl mb-6 shadow-lg" />
    <h2>⚡ Express & Koerier</h2>
    <p>Spoed? Geen probleem! Met onze express-service bezorgen wij uw zending dezelfde dag of de volgende ochtend.</p>
    <ul>
      <li><strong>Same-day delivery</strong> - Ophalen en bezorgen op dezelfde dag</li>
      <li><strong>Next-morning delivery</strong> - Gegarandeerd voor 09:00 bezorgd</li>
      <li><strong>Dedicated koeriersdienst</strong> - Eén voertuig, één zending</li>
      <li><strong>24/7 beschikbaar</strong> - Ook 's avonds en in het weekend</li>
    </ul>
  </div>

  <div class="service-block mb-12">
    <img src="/uploads/supply-chain.jpg" alt="Supply Chain" class="w-full rounded-xl mb-6 shadow-lg" />
    <h2>🔗 Supply Chain Management</h2>
    <p>Wij ontzorgen u met complete supply chain oplossingen, van planning tot uitvoering.</p>
    <ul>
      <li><strong>Transportplanning</strong> - Optimale route- en ladingplanning</li>
      <li><strong>Track & Trace</strong> - Real-time zichtbaarheid van al uw zendingen</li>
      <li><strong>Rapportage</strong> - Maandelijkse KPI-rapportages en analyses</li>
      <li><strong>Advies</strong> - Supply chain optimalisatie en kostenreductie</li>
    </ul>
  </div>

  <div class="bg-blue-50 rounded-xl p-8 text-center">
    <h3 class="text-2xl font-bold text-blue-900 mb-4">Interesse in onze diensten?</h3>
    <p class="text-blue-700 mb-6">Neem contact met ons op voor een vrijblijvend gesprek en een offerte op maat.</p>
    <a href="/contact" class="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">Contact opnemen</a>
  </div>
</div>`
      },
      status: 'PUBLISHED',
      sortOrder: 2,
      template: 'full-width',
      metaTitle: 'Diensten | Moveo Transport & Logistiek',
      metaDescription: 'Ontdek onze transport- en logistieke diensten: wegtransport, warehousing, internationaal transport, express koeriersdienst en supply chain management.'
    },
    {
      title: 'Vloot',
      slug: 'vloot',
      content: {
        html: `
<div class="page-section">
  <p class="text-xl text-gray-600 mb-12">Onze moderne vloot van meer dan 50 voertuigen staat garant voor betrouwbaar en duurzaam transport.</p>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
    <div class="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      <div class="bg-blue-600 text-white p-6">
        <div class="text-4xl mb-2">🚚</div>
        <h3 class="text-xl font-bold">Bestelwagens</h3>
      </div>
      <div class="p-6">
        <p class="text-gray-600 mb-4">Ideaal voor expresleveringen en kleinere zendingen in de Benelux.</p>
        <ul class="space-y-2 text-sm text-gray-600">
          <li>✅ Laadvermogen tot 1.200 kg</li>
          <li>✅ Laadvolume tot 14m³</li>
          <li>✅ Laadklep beschikbaar</li>
        </ul>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      <div class="bg-blue-600 text-white p-6">
        <div class="text-4xl mb-2">🚛</div>
        <h3 class="text-xl font-bold">Bakwagens</h3>
      </div>
      <div class="p-6">
        <p class="text-gray-600 mb-4">De werkpaarden van onze vloot voor nationaal en kort internationaal transport.</p>
        <ul class="space-y-2 text-sm text-gray-600">
          <li>✅ Laadvermogen tot 12.000 kg</li>
          <li>✅ Laadvolume tot 45m³</li>
          <li>✅ Hydraulische laadklep</li>
        </ul>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      <div class="bg-blue-600 text-white p-6">
        <div class="text-4xl mb-2">🚜</div>
        <h3 class="text-xl font-bold">Trekker-opleggers</h3>
      </div>
      <div class="p-6">
        <p class="text-gray-600 mb-4">Voor groot volume transport en internationale ritten. Diverse opleggers beschikbaar.</p>
        <ul class="space-y-2 text-sm text-gray-600">
          <li>✅ Laadvermogen tot 24.000 kg</li>
          <li>✅ Schuifzeilen, koelopleggers</li>
          <li>✅ Mega trailers (100m³)</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="bg-gray-50 rounded-xl p-8">
    <h3 class="text-2xl font-bold mb-6">Duurzaamheid van onze vloot</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h4 class="font-semibold text-lg mb-3">🌱 Euro 6 emissieklasse</h4>
        <p class="text-gray-600">100% van onze vloot voldoet aan de strengste Europese emissienormen. Wij investeren voortdurend in de nieuwste motorentechnologie.</p>
      </div>
      <div>
        <h4 class="font-semibold text-lg mb-3">♻️ HVO-brandstof</h4>
        <p class="text-gray-600">Een groeiend deel van onze vloot rijdt op HVO (Hydrotreated Vegetable Oil), waarmee we de CO2-uitstoot met 90% verlagen.</p>
      </div>
      <div>
        <h4 class="font-semibold text-lg mb-3">📊 Boordcomputers</h4>
        <p class="text-gray-600">Alle voertuigen zijn uitgerust met het nieuwste fleet management systeem voor optimale route- en brandstofplanning.</p>
      </div>
      <div>
        <h4 class="font-semibold text-lg mb-3">🔋 Elektrisch transport</h4>
        <p class="text-gray-600">In 2025 zijn wij gestart met onze eerste elektrische bestelwagens voor stadslogistiek. Doel: 30% elektrisch in 2028.</p>
      </div>
    </div>
  </div>
</div>`
      },
      status: 'PUBLISHED',
      sortOrder: 3,
      template: 'default',
      metaTitle: 'Onze Vloot | Moveo Transport & Logistiek',
      metaDescription: 'Ontdek de moderne en duurzame vloot van Moveo Transport. Van bestelwagens tot trekker-opleggers, alles Euro 6.'
    },
    {
      title: 'Contact',
      slug: 'contact',
      content: {
        html: `<p>Heeft u een vraag, wilt u een offerte aanvragen of wilt u meer weten over onze diensten? Neem gerust contact met ons op. Wij reageren binnen 24 uur op werkdagen.</p>`,
        showContactForm: true,
        showMap: true,
        address: 'Transportweg 15, 3045 NB Rotterdam',
        companyInfo: {
          name: 'Moveo Transport & Logistiek B.V.',
          address: 'Transportweg 15',
          postalCode: '3045 NB',
          city: 'Rotterdam',
          country: 'Nederland',
          phone: '+31 (0)10 234 5678',
          email: 'info@moveo-bv.nl',
          kvk: '12345678',
          btw: 'NL001234567B01',
          openingHours: [
            { day: 'Maandag - Vrijdag', hours: '07:00 - 18:00' },
            { day: 'Zaterdag', hours: '08:00 - 12:00' },
            { day: 'Zondag', hours: 'Gesloten' }
          ]
        }
      },
      status: 'PUBLISHED',
      sortOrder: 4,
      template: 'contact',
      metaTitle: 'Contact | Moveo Transport & Logistiek',
      metaDescription: 'Neem contact op met Moveo Transport voor een offerte of meer informatie. Bel +31 (0)10 234 5678 of vul ons contactformulier in.'
    }
  ];

  for (const pageData of pages) {
    if (!existingSlugs.has(pageData.slug)) {
      await prisma.page.create({ data: pageData });
      console.log(`  + Created page: ${pageData.title}`);
    }
  }
  console.log('✅ Transport pages checked (existing pages preserved)\n');

  // 5. Create blog posts (only if none exist)
  console.log('📝 Checking blog posts...');
  const existingPosts = await prisma.post.count();
  if (existingPosts > 0) {
    console.log('✅ Blog posts already exist, skipping\n');
  } else {
  const posts = [
    {
      title: 'Moveo breidt vloot uit met 10 nieuwe Euro 6 vrachtwagens',
      slug: 'vloot-uitbreiding-2026',
      header: 'Investering in de toekomst van duurzaam transport',
      status: 'PUBLISHED',
      headerImageId: mediaMap['wegtransport'] || null,
      content: {
        html: `<p>Wij zijn verheugd om aan te kondigen dat Moveo Transport haar vloot heeft uitgebreid met 10 splinternieuwe Euro 6 vrachtwagens. Deze investering van meer dan €2 miljoen onderstreept ons commitment aan duurzaam en betrouwbaar transport.</p>

<h2>Waarom deze investering?</h2>
<p>De toename in vraag naar betrouwbaar transport in Europa heeft ons doen besluiten om flink te investeren in ons wagenpark. De nieuwe voertuigen zijn uitgerust met de nieuwste technologie op het gebied van veiligheid en brandstofefficiëntie.</p>

<h2>Duurzaamheid voorop</h2>
<p>Alle nieuwe vrachtwagens zijn geschikt voor HVO-brandstof, waarmee de CO2-uitstoot met tot 90% wordt verminderd ten opzichte van reguliere diesel. Daarnaast zijn ze standaard uitgerust met:</p>
<ul>
  <li>Adaptieve cruise control</li>
  <li>Lane departure warning</li>
  <li>Emergency brake assist</li>
  <li>Digitale tachograaf</li>
</ul>

<p>Met deze uitbreiding kunnen wij onze klanten nog beter bedienen en bijdragen aan een schonere toekomst.</p>`
      }
    },
    {
      title: 'Moveo opent nieuw distributiecentrum in Rotterdam',
      slug: 'nieuw-distributiecentrum-rotterdam',
      header: '15.000m² extra opslagruimte voor onze klanten',
      status: 'PUBLISHED',
      headerImageId: mediaMap['warehousing'] || null,
      content: {
        html: `<p>Per 1 maart 2026 opent Moveo Transport een gloednieuw distributiecentrum aan de Transportweg in Rotterdam. Met 15.000m² aan opslagruimte kunnen wij onze klanten nog beter bedienen.</p>

<h2>State-of-the-art faciliteiten</h2>
<p>Het nieuwe distributiecentrum beschikt over:</p>
<ul>
  <li><strong>Klimaatbeheer</strong> - Temperatuurgecontroleerde zones voor gevoelige producten</li>
  <li><strong>WMS-systeem</strong> - Volledig geautomatiseerd warehouse management</li>
  <li><strong>40 laaddocks</strong> - Voor snelle en efficiënte handling</li>
  <li><strong>Beveiligingssysteem</strong> - 24/7 camerabewaking en toegangscontrole</li>
</ul>

<h2>Strategische locatie</h2>
<p>De locatie is gekozen vanwege de uitstekende bereikbaarheid via de A15 en A16, nabijheid van de Rotterdamse haven en het treinspoor. Dit verkort de transitietijden en verlaagt de transportkosten voor onze klanten.</p>`
      }
    },
    {
      title: 'Tips voor efficiënt supply chain management',
      slug: 'tips-supply-chain-management',
      header: 'Optimaliseer uw logistiek met deze 5 praktische tips',
      status: 'PUBLISHED',
      headerImageId: mediaMap['supply-chain'] || null,
      content: {
        html: `<p>Een efficiënte supply chain is cruciaal voor het succes van uw bedrijf. In dit artikel delen wij 5 praktische tips om uw logistieke processen te optimaliseren.</p>

<h2>1. Investeer in real-time data</h2>
<p>Zonder goede data kunt u geen goede beslissingen nemen. Investeer in systemen die real-time inzicht geven in uw voorraden, zendingen en performance. Bij Moveo bieden wij onze klanten toegang tot ons track & trace platform.</p>

<h2>2. Kies de juiste transportpartner</h2>
<p>Uw transportpartner is een verlengstuk van uw bedrijf. Kies voor een partner die meedenkt, flexibel is en investeert in kwaliteit en duurzaamheid.</p>

<h2>3. Optimaliseer uw voorraad</h2>
<p>Te veel voorraad kost geld, te weinig kost omzet. Werk samen met uw transportpartner om de ideale voorraadniveaus te bepalen en just-in-time leveringen te realiseren.</p>

<h2>4. Denk aan duurzaamheid</h2>
<p>Duurzaamheid is niet alleen goed voor het milieu, maar ook voor uw portemonnee. Efficiëntere routes, hogere beladingsgraden en schonere voertuigen verlagen de kosten én de CO2-uitstoot.</p>

<h2>5. Meet en verbeter continu</h2>
<p>Stel KPI's op, meet uw prestaties en bespreek deze regelmatig met uw logistieke partners. Continue verbetering leidt tot lagere kosten en betere service.</p>

<p><em>Wilt u meer weten over hoe Moveo uw supply chain kan optimaliseren? <a href="/contact">Neem contact met ons op</a> voor een vrijblijvend adviesgesprek.</em></p>`
      }
    }
  ];

  for (const postData of posts) {
    await prisma.post.create({ data: postData });
  }
  console.log('✅ Blog posts created\n');
  }

  // 6. Create menus (only if none exist)
  console.log('🔗 Checking menus...');
  const existingMenus = await prisma.menu.count();
  if (existingMenus > 0) {
    console.log('✅ Menus already exist, skipping\n');
  } else {

  const headerMenu = await prisma.menu.create({
    data: {
      name: 'Hoofdmenu',
      location: 'header',
      items: {
        create: [
          { label: 'Home', url: '/', sortOrder: 0 },
          { label: 'Diensten', url: '/diensten', sortOrder: 1 },
          { label: 'Offerte Transport', url: '/calculator', sortOrder: 2 },
          { label: 'Vloot', url: '/vloot', sortOrder: 3 },
          { label: 'Over ons', url: '/over-ons', sortOrder: 4 },
          { label: 'Blog', url: '/blog', sortOrder: 5 },
          { label: 'Contact', url: '/contact', sortOrder: 6 }
        ]
      }
    }
  });

  await prisma.menu.create({
    data: {
      name: 'Footer Navigatie',
      location: 'footer-1',
      items: {
        create: [
          { label: 'Home', url: '/', sortOrder: 0 },
          { label: 'Diensten', url: '/diensten', sortOrder: 1 },
          { label: 'Vloot', url: '/vloot', sortOrder: 2 },
          { label: 'Over ons', url: '/over-ons', sortOrder: 3 },
          { label: 'Contact', url: '/contact', sortOrder: 4 }
        ]
      }
    }
  });

  await prisma.menu.create({
    data: {
      name: 'Footer Diensten',
      location: 'footer-2',
      items: {
        create: [
          { label: 'Wegtransport', url: '/diensten', sortOrder: 0 },
          { label: 'Warehousing', url: '/diensten', sortOrder: 1 },
          { label: 'Express & Koerier', url: '/diensten', sortOrder: 2 },
          { label: 'Internationaal', url: '/diensten', sortOrder: 3 },
          { label: 'Supply Chain', url: '/diensten', sortOrder: 4 }
        ]
      }
    }
  });

  await prisma.menu.create({
    data: { name: 'Footer Contact', location: 'footer-3' }
  });
  console.log('✅ Menus created\n');
  }

  // 7. Create footer (only if none exist)
  console.log('🦶 Checking footer columns...');
  const existingFooter = await prisma.footerColumn.count();
  if (existingFooter > 0) {
    console.log('✅ Footer already exists, skipping\n');
  } else {
  await prisma.footerColumn.createMany({
    data: [
      {
        columnNum: 1,
        title: 'Moveo Transport',
        content: { 
          text: '<p>Moveo Transport & Logistiek is uw betrouwbare partner voor transport door heel Europa. Met meer dan 20 jaar ervaring staan wij garant voor kwaliteit.</p><p class="mt-4"><strong>ISO 9001</strong> | <strong>ISO 14001</strong> | <strong>AEO</strong></p>' 
        },
        sortOrder: 0
      },
      {
        columnNum: 2,
        title: 'Diensten',
        content: { text: '' },
        sortOrder: 1
      },
      {
        columnNum: 3,
        title: 'Contact',
        content: { 
          text: `<p>📍 Transportweg 15<br/>3045 NB Rotterdam</p>
<p>📞 +31 (0)10 234 5678<br/>📧 info@moveo-bv.nl</p>
<p class="mt-2"><strong>Openingstijden:</strong><br/>Ma-Vr: 07:00 - 18:00<br/>Za: 08:00 - 12:00</p>` 
        },
        sortOrder: 2
      }
    ]
  });
  console.log('✅ Footer created\n');
  }

  // 8. Create settings (only if they don't exist)
  console.log('⚙️ Updating settings...');
  const settingsData = [
    { key: 'site_name', value: 'Moveo Transport & Logistiek' },
    { key: 'site_description', value: 'Betrouwbaar transport door heel Europa' },
    { key: 'site_language', value: 'nl' },
    { key: 'footer_copyright', value: `© ${new Date().getFullYear()} Moveo Transport & Logistiek B.V. Alle rechten voorbehouden.` },
    { key: 'posts_per_page', value: 10 },
    { key: 'admin_language', value: 'nl' },
    { key: 'company_address', value: 'Transportweg 15, 3045 NB Rotterdam' },
    { key: 'company_phone', value: '+31 (0)10 234 5678' },
    { key: 'company_email', value: 'info@moveo-bv.nl' },
    { key: 'google_maps_address', value: 'Transportweg 15, 3045 NB Rotterdam, Netherlands' },
    { key: 'company_info', value: {
      name: 'Moveo Transport & Logistiek B.V.',
      address: 'Transportweg 15',
      postalCode: '3045 NB',
      city: 'Rotterdam',
      country: 'Nederland',
      phone: '+31 (0)10 234 5678',
      email: 'info@moveo-bv.nl',
      kvk: '12345678',
      btw: 'NL001234567B01',
      mapAddress: 'Transportweg 15, 3045 NB Rotterdam, Netherlands',
      openingHours: [
        { day: 'Maandag - Vrijdag', hours: '07:00 - 18:00' },
        { day: 'Zaterdag', hours: '08:00 - 12:00' },
        { day: 'Zondag', hours: 'Gesloten' }
      ]
    }}
  ];

  for (const s of settingsData) {
    const existing = await prisma.setting.findUnique({ where: { key: s.key } });
    if (!existing) {
      await prisma.setting.create({ data: s });
      console.log(`  + Created setting: ${s.key}`);
    }
  }
  console.log('✅ Settings checked (existing values preserved)\n');

  // ========== VEHICLE TYPES ==========
  console.log('🚛 Seeding vehicle types...');
  const vehicleTypesData = [
    {
      name: 'Vrachtwagen',
      slug: 'vrachtwagen',
      description: 'Standaard vrachtwagen voor groot transport',
      icon: '🚛',
      pricePerKmDomestic: 1.85,
      pricePerKmInternational: 2.25,
      expressSurchargePercent: 25,
      minPrice: 150,
      tollMultiplier: 2.5,
      additionalCosts: [
        { name: 'Brandstoftoeslag', amount: 15, enabled: true },
        { name: 'Tolkosten (indicatief)', amount: 0, enabled: false }
      ],
      sortOrder: 0
    },
    {
      name: 'Motorwagen',
      slug: 'motorwagen',
      description: 'Middelgrote motorwagen voor flexibel transport',
      icon: '🚚',
      pricePerKmDomestic: 1.45,
      pricePerKmInternational: 1.85,
      expressSurchargePercent: 20,
      minPrice: 100,
      tollMultiplier: 2.0,
      additionalCosts: [
        { name: 'Brandstoftoeslag', amount: 10, enabled: true }
      ],
      sortOrder: 1
    },
    {
      name: 'Bestelbus',
      slug: 'bestelbus',
      description: 'Lichte bestelbus voor kleinere zendingen',
      icon: '🚐',
      pricePerKmDomestic: 0.95,
      pricePerKmInternational: 1.35,
      expressSurchargePercent: 15,
      minPrice: 75,
      tollMultiplier: 1.0,
      additionalCosts: [],
      sortOrder: 2
    },
    {
      name: 'Koelwagen',
      slug: 'koelwagen',
      description: 'Gekoeld transport voor temperatuurgevoelige goederen',
      icon: '🧊',
      pricePerKmDomestic: 2.25,
      pricePerKmInternational: 2.75,
      expressSurchargePercent: 30,
      minPrice: 200,
      tollMultiplier: 2.5,
      additionalCosts: [
        { name: 'Koeling energie', amount: 25, enabled: true },
        { name: 'Brandstoftoeslag', amount: 15, enabled: true }
      ],
      sortOrder: 3
    },
    {
      name: 'Dieplader',
      slug: 'dieplader',
      description: 'Speciaal transport voor zware en grote lading',
      icon: '🏗️',
      pricePerKmDomestic: 3.50,
      pricePerKmInternational: 4.25,
      expressSurchargePercent: 35,
      minPrice: 500,
      tollMultiplier: 3.5,
      additionalCosts: [
        { name: 'Begeleiding', amount: 150, enabled: true },
        { name: 'Vergunning', amount: 75, enabled: true },
        { name: 'Brandstoftoeslag', amount: 25, enabled: true }
      ],
      sortOrder: 4
    }
  ];

  for (const vt of vehicleTypesData) {
    const existing = await prisma.vehicleType.findUnique({ where: { slug: vt.slug } });
    if (!existing) {
      await prisma.vehicleType.create({ data: vt });
      console.log(`  + Created vehicle type: ${vt.name}`);
    }
  }
  console.log('✅ Vehicle types checked (existing values preserved)\n');

  console.log('🎉 Transport content seed completed!');
}

seedTransportContent()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
