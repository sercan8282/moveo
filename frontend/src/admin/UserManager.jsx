import { useState, useEffect } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function UserManager() {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'EDITOR' });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      toast.error('Name and email are required');
      return;
    }
    if (!editing && !form.password) {
      toast.error('Password is required for new users');
      return;
    }

    try {
      const data = { ...form };
      if (editing && !data.password) delete data.password;

      if (editing) {
        await api.put(`/users/${editing.id}`, data);
      } else {
        await api.post('/users', data);
      }
      toast.success(t('savedSuccess'));
      resetForm();
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || t('error'));
    }
  };

  const deleteUser = async (id) => {
    if (id === currentUser?.id) {
      toast.error(t('cantDeleteSelf'));
      return;
    }
    if (!confirm(t('confirmDelete'))) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success(t('deletedSuccess'));
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || t('error'));
    }
  };

  const handleEdit = (user) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', role: 'EDITOR' });
    setShowForm(false);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-700';
      case 'ADMIN': return 'bg-blue-100 text-blue-700';
      case 'EDITOR': return 'bg-green-100 text-green-700';
      case 'VIEWER': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t('users')}</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          + {t('newUser')}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('name')}</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('email')}</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('role')}</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">MFA</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('date')}</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                      {user.id === currentUser?.id && <span className="text-xs text-gray-400">(you)</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{user.email}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {user.mfaEnabled ? (
                      <span className="text-green-600 text-sm">✓ Active</span>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-800 text-sm mr-3">{t('edit')}</button>
                    {user.id !== currentUser?.id && (
                      <button onClick={() => deleteUser(user.id)} className="text-red-500 hover:text-red-700 text-sm">{t('delete')}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editing ? t('editUser') : t('newUser')}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
                <input type="text" value={form.name} onChange={(e) => setForm(prev => ({...prev, name: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                <input type="email" value={form.email} onChange={(e) => setForm(prev => ({...prev, email: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('password')} {editing && <span className="text-gray-400 text-xs">({t('leaveBlank')})</span>}
                </label>
                <input type="password" value={form.password} onChange={(e) => setForm(prev => ({...prev, password: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required={!editing} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('role')}</label>
                <select value={form.role} onChange={(e) => setForm(prev => ({...prev, role: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  disabled={editing?.id === currentUser?.id}>
                  <option value="VIEWER">Viewer</option>
                  <option value="EDITOR">Editor</option>
                  <option value="ADMIN">Admin</option>
                  {currentUser?.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Admin</option>}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">{t('cancel')}</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">{t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
