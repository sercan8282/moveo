import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function SiteManager() {
  const { t } = useLanguage();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dockerStatus, setDockerStatus] = useState(null);
  const [images, setImages] = useState([]);
  const [buildStatus, setBuildStatus] = useState({ building: false });
  const [showForm, setShowForm] = useState(false);
  const [deploying, setDeploying] = useState({});
  const [form, setForm] = useState({
    name: '',
    domain: '',
    description: '',
    adminEmail: ''
  });
  
  // Modal states
  const [credentialsModal, setCredentialsModal] = useState({ show: false, data: null });
  const [confirmModal, setConfirmModal] = useState({ 
    show: false, 
    title: '', 
    message: '', 
    confirmText: 'Bevestigen',
    confirmClass: 'bg-red-600 hover:bg-red-700',
    onConfirm: null 
  });

  useEffect(() => {
    loadData();
    // Poll for status updates every 10 seconds
    const interval = setInterval(() => {
      loadSites();
      loadBuildStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [sitesRes, dockerRes, imagesRes, buildRes] = await Promise.all([
        api.get('/sites'),
        api.get('/sites/docker-status'),
        api.get('/sites/images').catch(() => ({ data: [] })),
        api.get('/sites/images/status').catch(() => ({ data: { building: false } }))
      ]);
      setSites(sitesRes.data);
      setDockerStatus(dockerRes.data);
      setImages(imagesRes.data);
      setBuildStatus(buildRes.data);
    } catch (error) {
      toast.error('Kon data niet laden');
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async () => {
    try {
      const res = await api.get('/sites');
      setSites(res.data);
    } catch (error) {
      // Silent fail for polling
    }
  };

  const loadBuildStatus = async () => {
    try {
      const res = await api.get('/sites/images/status');
      setBuildStatus(res.data);
      // Also refresh images after build completes
      if (!res.data.building && buildStatus.building) {
        const imagesRes = await api.get('/sites/images');
        setImages(imagesRes.data);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleBuildImages = async () => {
    setConfirmModal({
      show: true,
      title: '🔨 Images Herbouwen',
      message: 'Dit herbouwt de Docker images met de nieuwste code.\n\n⏱️ Dit kan 5-10 minuten duren.\n\nNa het bouwen kun je sites updaten met de "Rebuild" knop.',
      confirmText: 'Images Bouwen',
      confirmClass: 'bg-purple-600 hover:bg-purple-700',
      onConfirm: async () => {
        try {
          await api.post('/sites/images/build');
          toast.success('Image build gestart! Dit kan enkele minuten duren.');
          setBuildStatus({ building: true, lastBuild: new Date() });
        } catch (error) {
          toast.error(error.response?.data?.error || 'Build mislukt');
        }
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.adminEmail) {
      toast.error('Naam en admin e-mail zijn verplicht');
      return;
    }

    try {
      const res = await api.post('/sites', form);
      toast.success('Site aangemaakt! Klik op Deploy om te starten.');
      setSites([res.data, ...sites]);
      setShowForm(false);
      setForm({ name: '', domain: '', description: '', adminEmail: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Fout bij aanmaken');
    }
  };

  const handleDeploy = async (site) => {
    setDeploying(prev => ({ ...prev, [site.id]: true }));
    try {
      await api.post(`/sites/${site.id}/deploy`);
      toast.success('Deployment gestart! Dit kan enkele minuten duren.');
      loadSites();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Deployment mislukt');
    } finally {
      setDeploying(prev => ({ ...prev, [site.id]: false }));
    }
  };

  const handleStop = async (site) => {
    setConfirmModal({
      show: true,
      title: 'Site Stoppen',
      message: `Weet je zeker dat je "${site.name}" wilt stoppen? De site is dan niet meer bereikbaar.`,
      confirmText: 'Stoppen',
      confirmClass: 'bg-orange-600 hover:bg-orange-700',
      onConfirm: async () => {
        try {
          await api.post(`/sites/${site.id}/stop`);
          toast.success('Site gestopt');
          loadSites();
        } catch (error) {
          toast.error('Kon site niet stoppen');
        }
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const handleStart = async (site) => {
    try {
      await api.post(`/sites/${site.id}/start`);
      toast.success('Site gestart');
      loadSites();
    } catch (error) {
      toast.error('Kon site niet starten');
    }
  };

  const handleDelete = async (site) => {
    setConfirmModal({
      show: true,
      title: '⚠️ Site Permanent Verwijderen',
      message: `WAARSCHUWING: Dit verwijdert "${site.name}" permanent inclusief:\n\n• Alle database gegevens\n• Geüploade bestanden\n• Docker containers en volumes\n\nDit kan NIET ongedaan worden gemaakt!`,
      confirmText: 'Permanent Verwijderen',
      confirmClass: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        try {
          await api.delete(`/sites/${site.id}`);
          toast.success('Site verwijderd');
          setSites(sites.filter(s => s.id !== site.id));
        } catch (error) {
          toast.error('Kon site niet verwijderen');
        }
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const handleRebuild = async (site) => {
    setConfirmModal({
      show: true,
      title: '🔄 Site Herbouwen',
      message: `Dit herbouwt "${site.name}" met de nieuwste updates.\n\n✓ Database blijft behouden\n✓ Uploads blijven behouden\n✓ Instellingen blijven behouden\n\nDe site is even niet bereikbaar tijdens het herbouwen.`,
      confirmText: 'Herbouwen',
      confirmClass: 'bg-blue-600 hover:bg-blue-700',
      onConfirm: async () => {
        try {
          await api.post(`/sites/${site.id}/rebuild`);
          toast.success('Rebuild gestart! Dit kan enkele minuten duren.');
          loadSites();
        } catch (error) {
          toast.error(error.response?.data?.error || 'Rebuild mislukt');
        }
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const showCredentials = async (site) => {
    try {
      const res = await api.get(`/sites/${site.id}/credentials`);
      setCredentialsModal({ show: true, data: res.data });
    } catch (error) {
      toast.error('Kon credentials niet ophalen');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-gray-100 text-gray-700',
      DEPLOYING: 'bg-yellow-100 text-yellow-700 animate-pulse',
      REBUILDING: 'bg-blue-100 text-blue-700 animate-pulse',
      RUNNING: 'bg-green-100 text-green-700',
      STOPPED: 'bg-orange-100 text-orange-700',
      ERROR: 'bg-red-100 text-red-700'
    };
    const labels = {
      PENDING: 'Wacht op Deploy',
      DEPLOYING: 'Deploying...',
      REBUILDING: 'Herbouwen...',
      RUNNING: 'Actief',
      STOPPED: 'Gestopt',
      ERROR: 'Fout'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sites Beheer</h1>
          <p className="text-gray-500 mt-1">Deploy en beheer meerdere websites</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={!dockerStatus?.connected}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nieuwe Site
        </button>
      </div>

      {/* Docker Status */}
      <div className={`p-4 rounded-lg ${dockerStatus?.connected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${dockerStatus?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <div>
            <p className="font-medium">
              {dockerStatus?.connected ? 'Docker verbonden' : 'Docker niet verbonden'}
            </p>
            {dockerStatus?.connected && (
              <p className="text-sm text-gray-600">
                {dockerStatus.containers} containers • {dockerStatus.images} images • v{dockerStatus.serverVersion}
              </p>
            )}
            {!dockerStatus?.connected && (
              <p className="text-sm text-red-600">
                {dockerStatus?.error || 'Controleer of Docker socket is gemount'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Images & Build Section */}
      {dockerStatus?.connected && (
        <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-purple-900">Docker Images</p>
              <div className="flex flex-wrap items-center gap-4 mt-1">
                {Array.isArray(images) && images.length > 0 ? (
                  images.map((img, i) => (
                    <span key={i} className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded">
                      {img.tags?.[0]} • {img.id} • {img.size}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-purple-600">Geen Moveo images gevonden</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-purple-600 mb-1">Images herbouwen vanuit terminal:</p>
              <code className="text-xs bg-purple-100 px-2 py-1 rounded text-purple-800">
                docker-compose build nginx site-backend
              </code>
            </div>
          </div>
          <div className="mt-3 p-2 rounded bg-blue-50 text-blue-700 text-xs">
            💡 <strong>Update workflow:</strong> 1) Code wijzigen → 2) Images herbouwen in terminal → 3) "Rebuild" klikken per site
          </div>
        </div>
      )}

      {/* Sites List */}
      {sites.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Geen sites</h3>
          <p className="mt-2 text-gray-500">Maak je eerste site aan om te beginnen</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sites.map(site => (
            <div key={site.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{site.name}</h3>
                      {getStatusBadge(site.status)}
                    </div>
                    {site.domain && (
                      <a 
                        href={`https://${site.domain}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm mt-1 block"
                      >
                        {site.domain}
                      </a>
                    )}
                    {site.description && (
                      <p className="text-gray-500 text-sm mt-2">{site.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span>Frontend: {site.nginxPort}</span>
                      <span>Container: {site.containerPrefix}</span>
                      <span>Admin: {site.adminEmail}</span>
                    </div>
                    
                    {/* Quick Links when running */}
                    {site.status === 'RUNNING' && (
                      <div className="flex items-center gap-3 mt-3">
                        <a
                          href={`http://localhost:${site.nginxPort}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100"
                        >
                          🌐 Frontend
                        </a>
                        {site.npmAdminPort && (
                          <a
                            href={`http://localhost:${site.npmAdminPort}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs hover:bg-purple-100"
                          >
                            🔧 NPM Admin
                          </a>
                        )}
                        {site.portainerPort && (
                          <a
                            href={`https://localhost:${site.portainerPort}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-50 text-cyan-700 rounded text-xs hover:bg-cyan-100"
                          >
                            🐳 Portainer
                          </a>
                        )}
                      </div>
                    )}
                    
                    {site.errorMessage && (
                      <div className="mt-3 p-2 bg-red-50 rounded text-red-600 text-sm">
                        <strong>Fout:</strong> {site.errorMessage}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {site.status === 'PENDING' && (
                      <button
                        onClick={() => handleDeploy(site)}
                        disabled={deploying[site.id]}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {deploying[site.id] ? 'Deploying...' : 'Deploy'}
                      </button>
                    )}
                    {site.status === 'ERROR' && (
                      <button
                        onClick={() => handleDeploy(site)}
                        disabled={deploying[site.id]}
                        className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700"
                      >
                        Opnieuw
                      </button>
                    )}
                    {site.status === 'RUNNING' && (
                      <>
                        <button
                          onClick={() => showCredentials(site)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                        >
                          Credentials
                        </button>
                        <button
                          onClick={() => handleRebuild(site)}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                        >
                          🔄 Rebuild
                        </button>
                        <button
                          onClick={() => handleStop(site)}
                          className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm hover:bg-orange-200"
                        >
                          Stop
                        </button>
                      </>
                    )}
                    {site.status === 'STOPPED' && (
                      <>
                        <button
                          onClick={() => handleStart(site)}
                          className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
                        >
                          Start
                        </button>
                        <button
                          onClick={() => handleRebuild(site)}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                        >
                          🔄 Rebuild
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(site)}
                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                    >
                      Verwijder
                    </button>
                  </div>
                </div>

                {/* Live Status */}
                {site.liveStatus && site.status !== 'PENDING' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2">Container Status:</p>
                    <div className="flex gap-3">
                      {Object.entries(site.liveStatus).map(([service, status]) => (
                        <div key={service} className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${
                            status.running ? 'bg-green-500' : 
                            status.error ? 'bg-red-500' : 'bg-gray-400'
                          }`}></div>
                          <span className="text-xs text-gray-600">{service}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Nieuwe Site Aanmaken</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site Naam *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Mijn Nieuwe Site"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domein (optioneel)
                  </label>
                  <input
                    type="text"
                    value={form.domain}
                    onChange={(e) => setForm(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="www.mijnsite.nl"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Configureer later in Nginx Proxy Manager
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beschrijving (optioneel)
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Website voor..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin E-mail *
                  </label>
                  <input
                    type="email"
                    value={form.adminEmail}
                    onChange={(e) => setForm(prev => ({ ...prev, adminEmail: e.target.value }))}
                    placeholder="admin@mijnsite.nl"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Login voor admin panel van deze site
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Aanmaken
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {credentialsModal.show && credentialsModal.data && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Site Credentials</h2>
                <button
                  onClick={() => setCredentialsModal({ show: false, data: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Site Informatie</h3>
                  <p className="font-semibold text-gray-900">{credentialsModal.data.name}</p>
                  <p className="text-sm text-gray-600">Poort: {credentialsModal.data.nginxPort}</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-700 mb-2">URLs</h3>
                  <div className="space-y-1">
                    <a 
                      href={credentialsModal.data.accessUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:underline text-sm"
                    >
                      🌐 {credentialsModal.data.accessUrl}
                    </a>
                    <a 
                      href={credentialsModal.data.adminUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block text-blue-600 hover:underline text-sm"
                    >
                      🔧 {credentialsModal.data.adminUrl}
                    </a>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-700 mb-2">Admin Login</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">E-mail:</span>
                      <code className="bg-white px-2 py-1 rounded text-sm font-mono">
                        {credentialsModal.data.adminEmail}
                      </code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Wachtwoord:</span>
                      <code className="bg-white px-2 py-1 rounded text-sm font-mono text-green-700">
                        {credentialsModal.data.adminPassword}
                      </code>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  💡 Wijzig het wachtwoord na eerste login
                </p>
              </div>

              <button
                onClick={() => setCredentialsModal({ show: false, data: null })}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{confirmModal.title}</h2>
              <p className="text-gray-600 whitespace-pre-line mb-6">{confirmModal.message}</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuleren
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 px-4 py-2 text-white rounded-lg ${confirmModal.confirmClass}`}
                >
                  {confirmModal.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
