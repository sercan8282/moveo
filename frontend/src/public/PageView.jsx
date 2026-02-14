import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import ContactForm from '../components/ContactForm';
import GoogleMap from '../components/GoogleMap';
import BlockRenderer from '../components/BlockRenderer';

export default function PageView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState({});
  const [showMap, setShowMap] = useState(true);
  const [mapAddress, setMapAddress] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/public/pages/${slug}`)
      .then(res => {
        setPage(res.data);
        document.title = (res.data.metaTitle || res.data.title) + ' | Moveo Transport';
      })
      .catch(error => {
        if (error.response?.status === 404) {
          navigate('/404', { replace: true });
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Load contact info when page is a contact template
  useEffect(() => {
    if (!page) return;
    if (page.template !== 'contact') return;

    const pageContent = typeof page.content === 'string' ? JSON.parse(page.content) : (page.content || {});
    api.get('/public/settings')
      .then(res => {
        const ci = res.data?.company_info || pageContent.companyInfo || {};
        setCompanyInfo(ci);
        setMapAddress(ci.mapAddress || (ci.address || '') + ', ' + (ci.postalCode || '') + ' ' + (ci.city || ''));
        setShowMap(pageContent.showMap !== false);
      })
      .catch(() => {
        setCompanyInfo(pageContent.companyInfo || {});
        setMapAddress(pageContent.address || '');
      });
  }, [page]);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;
  }

  if (!page) return null;

  const pageContent = typeof page.content === 'string' ? JSON.parse(page.content) : (page.content || {});
  const isBuilder = pageContent.mode === 'builder' && Array.isArray(pageContent.rows) && pageContent.rows.length > 0;
  const htmlContent = pageContent.html || '';
  const isContact = page.template === 'contact';

  // Contact template
  if (isContact) {
    return (
      <div className="animate-fade-in">
        {/* Page Header */}
        <div className="py-12 md:py-16" style={{ backgroundColor: 'var(--color-primary, #2563eb)' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white">{page.title}</h1>
            {htmlContent && (
              <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">{htmlContent.replace(/<[^>]*>/g, '')}</p>
            )}
          </div>
        </div>

        {/* Contact Content */}
        <div className="py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Contact Info */}
              <div className="lg:col-span-1 space-y-6">
                {companyInfo.name && (
                  <div>
                    <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text, #0f172a)' }}>
                      {companyInfo.name}
                    </h3>
                  </div>
                )}

                <div className="space-y-4">
                  {companyInfo.address && (
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📍</span>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--color-text, #0f172a)' }}>Adres</p>
                        <p style={{ color: 'var(--color-text-light, #64748b)' }}>
                          {companyInfo.address}<br/>
                          {companyInfo.postalCode} {companyInfo.city}<br/>
                          {companyInfo.country}
                        </p>
                      </div>
                    </div>
                  )}

                  {companyInfo.phone && (
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📞</span>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--color-text, #0f172a)' }}>Telefoon</p>
                        <a href={`tel:${companyInfo.phone}`} className="hover:underline" style={{ color: 'var(--color-primary, #2563eb)' }}>
                          {companyInfo.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {companyInfo.email && (
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📧</span>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--color-text, #0f172a)' }}>E-mail</p>
                        <a href={`mailto:${companyInfo.email}`} className="hover:underline" style={{ color: 'var(--color-primary, #2563eb)' }}>
                          {companyInfo.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {companyInfo.kvk && (
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🏛️</span>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--color-text, #0f172a)' }}>KvK / BTW</p>
                        <p style={{ color: 'var(--color-text-light, #64748b)' }}>
                          KvK: {companyInfo.kvk}<br/>
                          BTW: {companyInfo.btw}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {companyInfo.openingHours && companyInfo.openingHours.length > 0 && (
                  <div className="mt-6 p-5 rounded-xl" style={{ backgroundColor: 'var(--color-surface, #f8fafc)' }}>
                    <h4 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text, #0f172a)' }}>
                      🕐 Openingstijden
                    </h4>
                    <div className="space-y-2">
                      {companyInfo.openingHours.map((oh, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span style={{ color: 'var(--color-text, #0f172a)' }}>{oh.day}</span>
                          <span className="font-medium" style={{ color: 'var(--color-text-light, #64748b)' }}>{oh.hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <div className="p-6 md:p-8 rounded-xl border" style={{ 
                  backgroundColor: 'var(--color-surface, #fff)', 
                  borderColor: 'var(--color-border, #e2e8f0)' 
                }}>
                  <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text, #0f172a)' }}>
                    Stuur ons een bericht
                  </h3>
                  <ContactForm />
                </div>
              </div>
            </div>

            {/* Google Maps */}
            {showMap && mapAddress && (
              <div className="mt-12">
                <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text, #0f172a)' }}>
                  📍 Onze locatie
                </h3>
                <GoogleMap address={mapAddress} height="450px" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Builder page
  if (isBuilder) {
    return (
      <div className="animate-fade-in">
        {/* Optional page header for non-hero pages */}
        {pageContent.rows[0]?.columns?.[0]?.blocks?.[0]?.type !== 'hero' && (
          <div className="py-12 md:py-16" style={{ backgroundColor: 'var(--color-surface, #f8fafc)' }}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--color-text, #0f172a)' }}>
                {page.title}
              </h1>
              {page.excerpt && (
                <p className="mt-4 text-lg" style={{ color: 'var(--color-text-light, #64748b)' }}>
                  {page.excerpt}
                </p>
              )}
            </div>
          </div>
        )}
        <BlockRenderer rows={pageContent.rows} />
      </div>
    );
  }

  // Default page template
  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="py-12 md:py-16" style={{ backgroundColor: 'var(--color-surface, #f8fafc)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--color-text, #0f172a)' }}>
            {page.title}
          </h1>
          {page.excerpt && (
            <p className="mt-4 text-lg" style={{ color: 'var(--color-text-light, #64748b)' }}>
              {page.excerpt}
            </p>
          )}
        </div>
      </div>

      {/* Page Content */}
      <div className={`py-12 ${page.template === 'full-width' ? '' : 'max-w-4xl mx-auto'} px-4 sm:px-6 lg:px-8`}>
        {page.featuredImageId && (
          <img 
            src={`/api/uploads/${page.featuredImageId}`} 
            alt={page.title}
            className="w-full rounded-xl mb-8 shadow-lg"
          />
        )}
        <div className="prose prose-lg max-w-none page-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
    </div>
  );
}
