import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  // MFA
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled || false);
  const [mfaSetup, setMfaSetup] = useState(null);
  const [mfaToken, setMfaToken] = useState('');
  const [settingUpMfa, setSettingUpMfa] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setMfaEnabled(res.data.mfaEnabled);
    } catch (error) { console.error(error); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('passwordMismatch'));
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error(t('passwordTooShort'));
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success(t('passwordChanged'));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || t('error'));
    } finally {
      setChangingPassword(false);
    }
  };

  const startMfaSetup = async () => {
    setSettingUpMfa(true);
    try {
      const res = await api.post('/auth/mfa/setup');
      setMfaSetup(res.data);
    } catch (error) {
      toast.error(t('error'));
      setSettingUpMfa(false);
    }
  };

  const verifyMfa = async () => {
    if (!mfaToken || mfaToken.length !== 6) {
      toast.error(t('invalidMfaCode'));
      return;
    }
    try {
      await api.post('/auth/mfa/verify', { token: mfaToken });
      toast.success(t('mfaEnabled'));
      setMfaEnabled(true);
      setMfaSetup(null);
      setMfaToken('');
      setSettingUpMfa(false);
    } catch (error) {
      toast.error(error.response?.data?.error || t('invalidMfaCode'));
    }
  };

  const disableMfa = async () => {
    if (!confirm(t('confirmDisableMfa'))) return;
    try {
      await api.post('/auth/mfa/disable');
      toast.success(t('mfaDisabled'));
      setMfaEnabled(false);
    } catch (error) {
      toast.error(t('error'));
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('profile')}</h2>

      <div className="space-y-5">
        {/* User Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">{user?.name}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('changePassword')}</h3>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('currentPassword')}</label>
              <input type="password" value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({...prev, currentPassword: e.target.value}))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('newPassword')}</label>
              <input type="password" value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({...prev, newPassword: e.target.value}))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" required minLength={8} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('confirmPassword')}</label>
              <input type="password" value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({...prev, confirmPassword: e.target.value}))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" required minLength={8} />
            </div>
            <button type="submit" disabled={changingPassword}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {changingPassword ? t('loading') : t('changePassword')}
            </button>
          </form>
        </div>

        {/* MFA */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('twoFactorAuth')}</h3>

          {mfaEnabled ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <p className="text-sm text-green-700 font-medium">{t('mfaActive')}</p>
              </div>
              <button onClick={disableMfa}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors">
                {t('disableMfa')}
              </button>
            </div>
          ) : settingUpMfa && mfaSetup ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{t('mfaInstructions')}</p>
              <div className="flex justify-center">
                <img src={mfaSetup.qrCode} alt="MFA QR Code" className="w-48 h-48 rounded-lg border border-gray-200" />
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">{t('manualCode')}:</p>
                <code className="text-sm font-mono text-gray-800 select-all">{mfaSetup.secret}</code>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('verificationCode')}</label>
                <div className="flex gap-2">
                  <input type="text" value={mfaToken} onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000" maxLength={6}
                    className="w-40 px-4 py-2 border border-gray-300 rounded-lg text-sm text-center tracking-widest font-mono" />
                  <button onClick={verifyMfa}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    {t('verify')}
                  </button>
                  <button onClick={() => { setSettingUpMfa(false); setMfaSetup(null); setMfaToken(''); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    {t('cancel')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-3">{t('mfaDescription')}</p>
              <button onClick={startMfaSetup}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                {t('enableMfa')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
