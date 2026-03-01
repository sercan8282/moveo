const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// LogiPro Template - Complete Logistics Website
const logiProTemplate = {
  name: 'LogiPro',
  slug: 'logipro',
  description: 'Professionele logistics & transport template met moderne styling, complete pagina\'s en animaties',
  thumbnail: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
  category: 'logistics',
  version: '1.0.0',
  isActive: true,
  data: {
    // Theme Configuration
    theme: {
      primaryColor: '#f26522',
      secondaryColor: '#0a1628',
      accentColor: '#1a365d',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      headerBg: '#0a1628',
      footerBg: '#0a1628',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '8px',
      buttonStyle: 'rounded'
    },

    // Site Settings
    settings: {
      siteName: 'LogiPro Transport',
      siteDescription: 'Betrouwbare transport en logistieke oplossingen voor uw bedrijf',
      logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&q=80',
      favicon: '/favicon.ico',
      email: 'info@logipro.nl',
      phone: '+31 (0)20 123 4567',
      address: 'Transportweg 123, 1043 AB Amsterdam',
      socials: {
        facebook: 'https://facebook.com/logipro',
        linkedin: 'https://linkedin.com/company/logipro',
        twitter: 'https://twitter.com/logipro',
        instagram: 'https://instagram.com/logipro'
      }
    },

    // Homepage Configuration
    homepage: {
      sections: [
        // Hero Section
        {
          id: 'hero',
          type: 'hero',
          order: 1,
          enabled: true,
          data: {
            title: 'Betrouwbare Transport & Logistiek',
            subtitle: 'Wij leveren uw goederen veilig en op tijd, waar dan ook',
            backgroundImage: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1920&q=80',
            overlayOpacity: 0.7,
            ctaButtons: [
              { text: 'Offerte Aanvragen', link: '/offerte', style: 'primary' },
              { text: 'Onze Diensten', link: '/diensten', style: 'outline' }
            ],
            animation: 'fadeInUp'
          }
        },

        // Stats Section
        {
          id: 'stats',
          type: 'stats',
          order: 2,
          enabled: true,
          data: {
            backgroundColor: '#f26522',
            textColor: '#ffffff',
            stats: [
              { number: '25+', label: 'Jaar Ervaring', icon: 'clock' },
              { number: '500+', label: 'Tevreden Klanten', icon: 'users' },
              { number: '10K+', label: 'Leveringen', icon: 'truck' },
              { number: '50+', label: 'Voertuigen', icon: 'package' }
            ],
            animation: 'countUp'
          }
        },

        // About Preview Section
        {
          id: 'about-preview',
          type: 'content-image',
          order: 3,
          enabled: true,
          data: {
            title: 'Over LogiPro',
            subtitle: 'Uw Partner in Transport',
            content: 'Met meer dan 25 jaar ervaring in de transport- en logistieke sector, bieden wij betrouwbare en efficiënte oplossingen voor al uw vervoersbehoeften. Ons toegewijde team staat klaar om uw goederen veilig en op tijd te leveren.',
            image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80',
            imagePosition: 'right',
            ctaButton: { text: 'Meer Over Ons', link: '/over-ons' },
            features: [
              { icon: 'check', text: 'GPS Tracking' },
              { icon: 'check', text: '24/7 Beschikbaar' },
              { icon: 'check', text: 'Verzekerd Transport' }
            ],
            animation: 'fadeIn'
          }
        },

        // Services Grid Section
        {
          id: 'services',
          type: 'services-grid',
          order: 4,
          enabled: true,
          data: {
            title: 'Onze Diensten',
            subtitle: 'Complete logistieke oplossingen voor ieder bedrijf',
            services: [
              {
                icon: 'truck',
                title: 'Wegtransport',
                description: 'Nationaal en internationaal wegtransport met moderne vrachtwagens',
                image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&q=80',
                link: '/diensten/wegtransport'
              },
              {
                icon: 'package',
                title: 'Warehousing',
                description: 'Veilige opslag en voorraadbeheer in moderne magazijnen',
                image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&q=80',
                link: '/diensten/warehousing'
              },
              {
                icon: 'globe',
                title: 'Internationale Verzending',
                description: 'Wereldwijde verzending via zee, lucht en land',
                image: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c1?w=600&q=80',
                link: '/diensten/internationaal'
              },
              {
                icon: 'clock',
                title: 'Express Levering',
                description: 'Snelle leveringen voor tijdkritische zendingen',
                image: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=600&q=80',
                link: '/diensten/express'
              },
              {
                icon: 'shield',
                title: 'Waardetransport',
                description: 'Beveiligd transport voor waardevolle goederen',
                image: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=600&q=80',
                link: '/diensten/waardetransport'
              },
              {
                icon: 'recycle',
                title: 'Retourlogistiek',
                description: 'Efficiënte afhandeling van retourzendingen',
                image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80',
                link: '/diensten/retourlogistiek'
              }
            ],
            columns: 3,
            animation: 'fadeInUp'
          }
        },

        // Why Choose Us Section
        {
          id: 'why-us',
          type: 'features',
          order: 5,
          enabled: true,
          data: {
            title: 'Waarom LogiPro?',
            subtitle: 'Ontdek wat ons onderscheidt',
            backgroundColor: '#f8f9fa',
            features: [
              {
                icon: 'award',
                title: 'Kwaliteitsgarantie',
                description: 'ISO 9001 gecertificeerd met focus op kwaliteit en veiligheid'
              },
              {
                icon: 'map-pin',
                title: 'Realtime Tracking',
                description: 'Volg uw zending 24/7 met onze geavanceerde GPS tracking'
              },
              {
                icon: 'users',
                title: 'Ervaren Team',
                description: 'Professionele chauffeurs met jarenlange ervaring'
              },
              {
                icon: 'headphones',
                title: 'Persoonlijke Service',
                description: 'Dedicated accountmanager voor al uw vragen'
              }
            ],
            animation: 'fadeIn'
          }
        },

        // CTA Banner Section
        {
          id: 'cta-banner',
          type: 'cta',
          order: 6,
          enabled: true,
          data: {
            title: 'Klaar om te starten?',
            subtitle: 'Vraag vandaag nog een vrijblijvende offerte aan',
            backgroundImage: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1920&q=80',
            overlayColor: '#0a1628',
            overlayOpacity: 0.85,
            ctaButton: { text: 'Offerte Aanvragen', link: '/offerte', style: 'primary' },
            animation: 'fadeIn'
          }
        },

        // Testimonials Section
        {
          id: 'testimonials',
          type: 'testimonials',
          order: 7,
          enabled: true,
          data: {
            title: 'Wat Onze Klanten Zeggen',
            subtitle: 'Ervaringen van tevreden klanten',
            testimonials: [
              {
                name: 'Jan de Vries',
                company: 'Import BV',
                text: 'LogiPro heeft onze supply chain getransformeerd. Betrouwbaar, efficient en altijd bereikbaar.',
                rating: 5,
                image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80'
              },
              {
                name: 'Maria Janssen',
                company: 'Webshop Plus',
                text: 'Al 5 jaar onze logistieke partner. Uitstekende service en scherpe prijzen.',
                rating: 5,
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80'
              },
              {
                name: 'Peter Bakker',
                company: 'Tech Solutions',
                text: 'De GPS tracking en klantenservice zijn echt top. Aanrader voor elk bedrijf.',
                rating: 5,
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80'
              }
            ],
            animation: 'fadeInUp'
          }
        },

        // Partners/Clients Section
        {
          id: 'partners',
          type: 'logos',
          order: 8,
          enabled: true,
          data: {
            title: 'Vertrouwd Door',
            logos: [
              { name: 'Partner 1', image: 'https://via.placeholder.com/150x60?text=Partner+1' },
              { name: 'Partner 2', image: 'https://via.placeholder.com/150x60?text=Partner+2' },
              { name: 'Partner 3', image: 'https://via.placeholder.com/150x60?text=Partner+3' },
              { name: 'Partner 4', image: 'https://via.placeholder.com/150x60?text=Partner+4' },
              { name: 'Partner 5', image: 'https://via.placeholder.com/150x60?text=Partner+5' }
            ],
            animation: 'fadeIn'
          }
        },

        // Newsletter Section
        {
          id: 'newsletter',
          type: 'newsletter',
          order: 9,
          enabled: true,
          data: {
            title: 'Blijf Op De Hoogte',
            subtitle: 'Schrijf je in voor onze nieuwsbrief',
            backgroundColor: '#0a1628',
            textColor: '#ffffff',
            buttonText: 'Inschrijven',
            placeholderText: 'Uw e-mailadres',
            animation: 'fadeIn'
          }
        }
      ]
    },

    // Pages
    pages: [
      // About Page - Over Ons
      {
        title: 'Over Ons',
        slug: 'over-ons',
        metaTitle: 'Over LogiPro - Uw Transport Partner',
        metaDescription: 'Leer meer over LogiPro, uw betrouwbare partner voor transport en logistiek sinds 1998.',
        template: 'default',
        status: 'published',
        content: {
          blocks: [
            {
              type: 'hero-page',
              data: {
                title: 'Over LogiPro',
                subtitle: 'Uw betrouwbare partner sinds 1998',
                backgroundImage: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1920&q=80'
              }
            },
            {
              type: 'content-section',
              data: {
                title: 'Onze Geschiedenis',
                content: `
                  <p>LogiPro is opgericht in 1998 met een simpele missie: betrouwbaar transport leveren tegen eerlijke prijzen. Wat begon als een klein familiebedrijf met twee vrachtwagens, is uitgegroeid tot een van de toonaangevende transportbedrijven in de Benelux.</p>
                  <p>Vandaag de dag beschikken wij over een moderne vloot van meer dan 50 voertuigen en een team van 75+ professionals die dagelijks klaarstaan om uw goederen veilig en op tijd te leveren.</p>
                `,
                image: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800&q=80',
                imagePosition: 'right'
              }
            },
            {
              type: 'values-grid',
              data: {
                title: 'Onze Kernwaarden',
                values: [
                  { icon: 'shield', title: 'Betrouwbaarheid', description: 'Wij doen wat we beloven, iedere keer weer' },
                  { icon: 'zap', title: 'Efficiëntie', description: 'Slimme routes en optimale planning' },
                  { icon: 'heart', title: 'Klantgerichtheid', description: 'Uw succes is ons succes' },
                  { icon: 'leaf', title: 'Duurzaamheid', description: 'Milieubewust ondernemen voor de toekomst' }
                ]
              }
            },
            {
              type: 'team-section',
              data: {
                title: 'Ons Team',
                subtitle: 'Maak kennis met de mensen achter LogiPro',
                team: [
                  {
                    name: 'Willem Jansen',
                    role: 'Directeur',
                    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',
                    bio: 'Sinds 1998 aan het roer van LogiPro'
                  },
                  {
                    name: 'Sandra de Groot',
                    role: 'Operations Manager',
                    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
                    bio: '15 jaar ervaring in logistics'
                  },
                  {
                    name: 'Mark Visser',
                    role: 'Fleet Manager',
                    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
                    bio: 'Verantwoordelijk voor onze vloot'
                  }
                ]
              }
            },
            {
              type: 'stats-section',
              data: {
                stats: [
                  { number: '25+', label: 'Jaar Ervaring' },
                  { number: '75+', label: 'Medewerkers' },
                  { number: '50+', label: 'Voertuigen' },
                  { number: '500+', label: 'Klanten' }
                ]
              }
            },
            {
              type: 'cta-section',
              data: {
                title: 'Wilt u samenwerken?',
                subtitle: 'Neem contact met ons op voor een vrijblijvend gesprek',
                button: { text: 'Contact Opnemen', link: '/contact' }
              }
            }
          ]
        }
      },

      // Services Page - Diensten
      {
        title: 'Diensten',
        slug: 'diensten',
        metaTitle: 'Onze Diensten - LogiPro Transport & Logistiek',
        metaDescription: 'Ontdek ons complete aanbod aan transport en logistieke diensten. Van wegtransport tot warehousing.',
        template: 'default',
        status: 'published',
        content: {
          blocks: [
            {
              type: 'hero-page',
              data: {
                title: 'Onze Diensten',
                subtitle: 'Complete logistieke oplossingen voor uw bedrijf',
                backgroundImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&q=80'
              }
            },
            {
              type: 'intro-text',
              data: {
                content: 'LogiPro biedt een breed scala aan transport- en logistieke diensten. Of u nu nationaal of internationaal wilt verzenden, grote of kleine volumes heeft, wij hebben de oplossing die bij uw bedrijf past.'
              }
            },
            {
              type: 'services-detail',
              data: {
                services: [
                  {
                    id: 'wegtransport',
                    title: 'Wegtransport',
                    icon: 'truck',
                    image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&q=80',
                    description: 'Ons wegtransport dekt heel Europa. Met een moderne vloot en ervaren chauffeurs garanderen wij veilig en tijdig transport van uw goederen.',
                    features: [
                      'Nationaal en internationaal',
                      'Full-truck en groupage',
                      'ADR gecertificeerd',
                      'Temperatuur gecontroleerd'
                    ]
                  },
                  {
                    id: 'warehousing',
                    title: 'Warehousing',
                    icon: 'package',
                    image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
                    description: 'Onze moderne magazijnen bieden veilige opslag en efficiënt voorraadbeheer. Inclusief pick & pack services.',
                    features: [
                      '10.000m² opslagruimte',
                      'WMS systeem',
                      'Pick & Pack',
                      '24/7 beveiligd'
                    ]
                  },
                  {
                    id: 'internationaal',
                    title: 'Internationale Verzending',
                    icon: 'globe',
                    image: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c1?w=800&q=80',
                    description: 'Wereldwijde verzending via alle modaliteiten. Zee, lucht en landtransport naar elke bestemming.',
                    features: [
                      'Zeevracht',
                      'Luchtvracht',
                      'Douane afhandeling',
                      'Import/Export'
                    ]
                  },
                  {
                    id: 'express',
                    title: 'Express Levering',
                    icon: 'clock',
                    image: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800&q=80',
                    description: 'Voor tijdkritische zendingen bieden wij express en same-day delivery opties.',
                    features: [
                      'Same-day delivery',
                      'Next-day delivery',
                      'Dedicated transport',
                      'Real-time tracking'
                    ]
                  }
                ]
              }
            },
            {
              type: 'cta-section',
              data: {
                title: 'Welke dienst past bij u?',
                subtitle: 'Vraag een vrijblijvende offerte aan',
                button: { text: 'Offerte Aanvragen', link: '/offerte' }
              }
            }
          ]
        }
      },

      // Contact Page
      {
        title: 'Contact',
        slug: 'contact',
        metaTitle: 'Contact - LogiPro Transport',
        metaDescription: 'Neem contact op met LogiPro voor al uw transport en logistieke vragen.',
        template: 'contact',
        status: 'published',
        content: {
          blocks: [
            {
              type: 'hero-page',
              data: {
                title: 'Contact',
                subtitle: 'Wij staan voor u klaar',
                backgroundImage: 'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1920&q=80'
              }
            },
            {
              type: 'contact-info',
              data: {
                title: 'Neem Contact Op',
                subtitle: 'Ons team staat klaar om u te helpen',
                info: [
                  { icon: 'map-pin', title: 'Adres', value: 'Transportweg 123\n1043 AB Amsterdam' },
                  { icon: 'phone', title: 'Telefoon', value: '+31 (0)20 123 4567' },
                  { icon: 'mail', title: 'E-mail', value: 'info@logipro.nl' },
                  { icon: 'clock', title: 'Openingstijden', value: 'Ma-Vr: 08:00 - 18:00\nZa: 09:00 - 13:00' }
                ]
              }
            },
            {
              type: 'contact-form',
              data: {
                title: 'Stuur ons een bericht',
                fields: ['name', 'email', 'phone', 'subject', 'message'],
                submitText: 'Verstuur Bericht'
              }
            },
            {
              type: 'map',
              data: {
                address: 'Transportweg 123, Amsterdam',
                zoom: 15,
                height: 400
              }
            }
          ]
        }
      },

      // Quote Page - Offerte
      {
        title: 'Offerte Aanvragen',
        slug: 'offerte',
        metaTitle: 'Offerte Aanvragen - LogiPro Transport',
        metaDescription: 'Vraag een vrijblijvende offerte aan voor transport en logistieke diensten.',
        template: 'quote',
        status: 'published',
        content: {
          blocks: [
            {
              type: 'hero-page',
              data: {
                title: 'Offerte Aanvragen',
                subtitle: 'Ontvang binnen 24 uur een vrijblijvende offerte',
                backgroundImage: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1920&q=80'
              }
            },
            {
              type: 'quote-form',
              data: {
                title: 'Vertel ons over uw zending',
                steps: [
                  { title: 'Uw Gegevens', fields: ['company', 'name', 'email', 'phone'] },
                  { title: 'Ophaallocatie', fields: ['pickup_address', 'pickup_date'] },
                  { title: 'Afleverlocatie', fields: ['delivery_address', 'delivery_date'] },
                  { title: 'Zending Details', fields: ['weight', 'dimensions', 'goods_type', 'special_requirements'] }
                ],
                submitText: 'Offerte Aanvragen'
              }
            },
            {
              type: 'benefits-sidebar',
              data: {
                title: 'Waarom LogiPro?',
                benefits: [
                  { icon: 'check', text: 'Vrijblijvende offerte' },
                  { icon: 'check', text: 'Reactie binnen 24 uur' },
                  { icon: 'check', text: 'Scherpe prijzen' },
                  { icon: 'check', text: 'Verzekerd transport' },
                  { icon: 'check', text: 'Persoonlijke service' }
                ]
              }
            }
          ]
        }
      },

      // Blog Page
      {
        title: 'Blog',
        slug: 'blog',
        metaTitle: 'Blog - LogiPro Transport & Logistiek',
        metaDescription: 'Lees het laatste nieuws en tips over transport, logistiek en supply chain management.',
        template: 'blog',
        status: 'published',
        content: {
          blocks: [
            {
              type: 'hero-page',
              data: {
                title: 'Blog',
                subtitle: 'Nieuws, tips en inzichten uit de logistieke wereld',
                backgroundImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80'
              }
            },
            {
              type: 'blog-grid',
              data: {
                postsPerPage: 9,
                showCategories: true,
                showSearch: true
              }
            }
          ]
        }
      },

      // Privacy Policy
      {
        title: 'Privacybeleid',
        slug: 'privacy',
        metaTitle: 'Privacybeleid - LogiPro',
        metaDescription: 'Lees ons privacybeleid over hoe wij omgaan met uw persoonlijke gegevens.',
        template: 'default',
        status: 'published',
        content: {
          blocks: [
            {
              type: 'hero-page',
              data: {
                title: 'Privacybeleid',
                subtitle: 'Hoe wij omgaan met uw gegevens',
                backgroundImage: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80'
              }
            },
            {
              type: 'text-content',
              data: {
                content: `
                  <h2>1. Inleiding</h2>
                  <p>LogiPro respecteert uw privacy en draagt zorg voor de bescherming van uw persoonlijke gegevens. Dit privacybeleid beschrijft hoe wij omgaan met uw persoonsgegevens.</p>
                  
                  <h2>2. Welke gegevens verzamelen wij?</h2>
                  <p>Wij verzamelen de volgende categorieën persoonsgegevens:</p>
                  <ul>
                    <li>Contactgegevens (naam, e-mail, telefoonnummer)</li>
                    <li>Adresgegevens voor verzending</li>
                    <li>Bedrijfsgegevens</li>
                    <li>Communicatiehistorie</li>
                  </ul>
                  
                  <h2>3. Waarvoor gebruiken wij uw gegevens?</h2>
                  <p>Uw gegevens worden gebruikt voor:</p>
                  <ul>
                    <li>Het uitvoeren van transport opdrachten</li>
                    <li>Communicatie over uw zendingen</li>
                    <li>Facturatie</li>
                    <li>Klantenservice</li>
                  </ul>
                  
                  <h2>4. Bewaartermijn</h2>
                  <p>Wij bewaren uw gegevens niet langer dan noodzakelijk voor de doeleinden waarvoor ze zijn verzameld.</p>
                  
                  <h2>5. Uw rechten</h2>
                  <p>U heeft recht op inzage, correctie en verwijdering van uw persoonsgegevens. Neem contact met ons op via privacy@logipro.nl.</p>
                  
                  <h2>6. Contact</h2>
                  <p>Voor vragen over dit privacybeleid kunt u contact opnemen via privacy@logipro.nl.</p>
                `
              }
            }
          ]
        }
      },

      // Terms & Conditions
      {
        title: 'Algemene Voorwaarden',
        slug: 'voorwaarden',
        metaTitle: 'Algemene Voorwaarden - LogiPro',
        metaDescription: 'Lees onze algemene voorwaarden voor transport en logistieke diensten.',
        template: 'default',
        status: 'published',
        content: {
          blocks: [
            {
              type: 'hero-page',
              data: {
                title: 'Algemene Voorwaarden',
                subtitle: 'Onze leveringsvoorwaarden',
                backgroundImage: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80'
              }
            },
            {
              type: 'text-content',
              data: {
                content: `
                  <h2>Artikel 1 - Definities</h2>
                  <p>In deze algemene voorwaarden wordt verstaan onder:</p>
                  <ul>
                    <li>LogiPro: de besloten vennootschap LogiPro B.V.</li>
                    <li>Opdrachtgever: de natuurlijke of rechtspersoon die een opdracht verstrekt</li>
                    <li>Zending: de goederen die worden vervoerd</li>
                  </ul>
                  
                  <h2>Artikel 2 - Toepasselijkheid</h2>
                  <p>Deze algemene voorwaarden zijn van toepassing op alle aanbiedingen, offertes en overeenkomsten tussen LogiPro en opdrachtgever.</p>
                  
                  <h2>Artikel 3 - Offertes en Prijzen</h2>
                  <p>Alle offertes zijn vrijblijvend en 30 dagen geldig, tenzij anders vermeld. Prijzen zijn exclusief BTW.</p>
                  
                  <h2>Artikel 4 - Uitvoering</h2>
                  <p>LogiPro zal de opdracht naar beste inzicht en vermogen uitvoeren conform de geldende normen.</p>
                  
                  <h2>Artikel 5 - Aansprakelijkheid</h2>
                  <p>De aansprakelijkheid van LogiPro is beperkt tot het bedrag dat in het desbetreffende geval door de verzekering wordt uitgekeerd.</p>
                  
                  <h2>Artikel 6 - Overmacht</h2>
                  <p>In geval van overmacht is LogiPro niet gehouden tot vergoeding van schade.</p>
                `
              }
            }
          ]
        }
      }
    ],

    // Blog Posts
    posts: [
      {
        title: '5 Tips voor Efficiënt Voorraadbeheer',
        slug: '5-tips-efficient-voorraadbeheer',
        excerpt: 'Ontdek hoe u uw voorraad optimaal kunt beheren en kosten kunt besparen.',
        content: `
          <p>Efficiënt voorraadbeheer is essentieel voor elk bedrijf. Hier zijn vijf tips die u direct kunt toepassen:</p>
          
          <h2>1. Gebruik een WMS Systeem</h2>
          <p>Een Warehouse Management System geeft u real-time inzicht in uw voorraad en optimaliseert uw processen.</p>
          
          <h2>2. ABC Analyse</h2>
          <p>Categoriseer uw producten op basis van omloopsnelheid en waarde voor optimale opslaglocaties.</p>
          
          <h2>3. Just-in-Time Levering</h2>
          <p>Werk samen met betrouwbare leveranciers voor tijdige levering en minimale voorraadkosten.</p>
          
          <h2>4. Regelmatige Inventarisatie</h2>
          <p>Voer regelmatig cyclustellingen uit om uw voorraadnauwkeurigheid te waarborgen.</p>
          
          <h2>5. Analyseer Historische Data</h2>
          <p>Gebruik data-analyse om vraagpatronen te voorspellen en voorraadniveaus te optimaliseren.</p>
        `,
        featuredImage: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
        category: 'Tips',
        status: 'published'
      },
      {
        title: 'De Toekomst van Transport: Elektrische Vrachtwagens',
        slug: 'toekomst-transport-elektrische-vrachtwagens',
        excerpt: 'Hoe elektrische vrachtwagens de transportsector gaan veranderen.',
        content: `
          <p>De transportsector staat aan de vooravond van een revolutie. Elektrische vrachtwagens worden steeds populairder en bieden veel voordelen.</p>
          
          <h2>Lagere Operationele Kosten</h2>
          <p>Elektrische vrachtwagens hebben lagere brandstof- en onderhoudskosten dan diesel voertuigen.</p>
          
          <h2>Milieuvriendelijk</h2>
          <p>Zero-emissie transport draagt bij aan een schonere toekomst en voldoet aan strenger wordende emissienormen.</p>
          
          <h2>LogiPro's Investering in Duurzaamheid</h2>
          <p>Wij investeren actief in elektrische voertuigen en hebben als doel om in 2030 50% van onze vloot elektrisch te hebben.</p>
        `,
        featuredImage: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&q=80',
        category: 'Nieuws',
        status: 'published'
      },
      {
        title: 'Brexit en de Impact op Internationaal Transport',
        slug: 'brexit-impact-internationaal-transport',
        excerpt: 'Wat betekent Brexit voor uw internationale zendingen naar het VK?',
        content: `
          <p>Brexit heeft grote veranderingen gebracht voor het transport tussen de EU en het Verenigd Koninkrijk.</p>
          
          <h2>Nieuwe Douaneformaliteiten</h2>
          <p>Alle zendingen naar het VK vereisen nu douanedocumentatie. LogiPro verzorgt dit volledig voor u.</p>
          
          <h2>Langere Transittijden</h2>
          <p>Door de extra controles kan transport naar het VK langer duren. Plan hier rekening mee.</p>
          
          <h2>Hoe Wij U Helpen</h2>
          <p>Ons team van specialisten begeleidt u door alle nieuwe procedures en zorgt voor een soepele afhandeling.</p>
        `,
        featuredImage: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c1?w=800&q=80',
        category: 'Nieuws',
        status: 'published'
      }
    ],

    // Menus
    menus: {
      header: {
        name: 'Hoofdmenu',
        items: [
          { title: 'Home', url: '/', order: 1 },
          { title: 'Over Ons', url: '/over-ons', order: 2 },
          { 
            title: 'Diensten', 
            url: '/diensten', 
            order: 3,
            children: [
              { title: 'Wegtransport', url: '/diensten#wegtransport', order: 1 },
              { title: 'Warehousing', url: '/diensten#warehousing', order: 2 },
              { title: 'Internationaal', url: '/diensten#internationaal', order: 3 },
              { title: 'Express Levering', url: '/diensten#express', order: 4 }
            ]
          },
          { title: 'Blog', url: '/blog', order: 4 },
          { title: 'Contact', url: '/contact', order: 5 },
          { title: 'Offerte', url: '/offerte', order: 6, highlight: true }
        ]
      },
      footer: {
        columns: [
          {
            title: 'Navigatie',
            items: [
              { title: 'Home', url: '/' },
              { title: 'Over Ons', url: '/over-ons' },
              { title: 'Diensten', url: '/diensten' },
              { title: 'Contact', url: '/contact' }
            ]
          },
          {
            title: 'Diensten',
            items: [
              { title: 'Wegtransport', url: '/diensten#wegtransport' },
              { title: 'Warehousing', url: '/diensten#warehousing' },
              { title: 'Internationaal', url: '/diensten#internationaal' },
              { title: 'Express Levering', url: '/diensten#express' }
            ]
          },
          {
            title: 'Legal',
            items: [
              { title: 'Privacybeleid', url: '/privacy' },
              { title: 'Algemene Voorwaarden', url: '/voorwaarden' }
            ]
          }
        ]
      }
    },

    // Footer Configuration
    footer: {
      logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&q=80',
      description: 'LogiPro is uw betrouwbare partner voor transport en logistiek. Met meer dan 25 jaar ervaring staan wij garant voor veilig en tijdig transport.',
      columns: 4,
      showSocials: true,
      showNewsletter: true,
      contactInfo: {
        address: 'Transportweg 123, 1043 AB Amsterdam',
        phone: '+31 (0)20 123 4567',
        email: 'info@logipro.nl'
      },
      openingHours: [
        { days: 'Maandag - Vrijdag', hours: '08:00 - 18:00' },
        { days: 'Zaterdag', hours: '09:00 - 13:00' },
        { days: 'Zondag', hours: 'Gesloten' }
      ],
      copyright: '© 2024 LogiPro B.V. Alle rechten voorbehouden.',
      backgroundColor: '#0a1628',
      textColor: '#ffffff'
    }
  }
};

async function seedTemplates() {
  console.log('🎨 Seeding templates...');

  try {
    // Check if template already exists
    const existingTemplate = await prisma.template.findUnique({
      where: { slug: logiProTemplate.slug }
    });

    if (existingTemplate) {
      // Update existing template
      await prisma.template.update({
        where: { slug: logiProTemplate.slug },
        data: {
          name: logiProTemplate.name,
          description: logiProTemplate.description,
          thumbnail: logiProTemplate.thumbnail,
          category: logiProTemplate.category,
          version: logiProTemplate.version,
          data: logiProTemplate.data,
          isActive: logiProTemplate.isActive
        }
      });
      console.log('✅ Updated existing LogiPro template');
    } else {
      // Create new template
      await prisma.template.create({
        data: logiProTemplate
      });
      console.log('✅ Created LogiPro template');
    }

    console.log('🎉 Template seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedTemplates()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedTemplates, logiProTemplate };
