import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import {
  X,
  User,
  Palette,
  Camera,
  Check,
  Loader2,
  Sliders,
  Upload,
} from 'lucide-react';

const PRESET_AVATARS = [
  { label: 'Male avatar', url: '/avatars/male.svg' },
  { label: 'Female avatar', url: '/avatars/female.svg' },
];

const SettingsModal = () => {
  const { user, updateCurrentUser } = useAuth();
  const { isSettingsOpen, setIsSettingsOpen } = useChat();
  const { currentTheme, changeTheme, themes } = useTheme();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'theme'
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.profilePicture || '');
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const fileInputRef = useRef(null);

  if (!isSettingsOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSuccessToast('Please select a valid image file');
      setTimeout(() => setSuccessToast(''), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSuccessToast('Image size must be less than 5MB');
      setTimeout(() => setSuccessToast(''), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result);
      setSuccessToast('Photo uploaded from device!');
      setTimeout(() => setSuccessToast(''), 2500);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setSuccessToast('');

    try {
      const res = await api.put('/users/profile', {
        name: name.trim(),
        bio: bio.trim(),
        profilePicture: avatar.trim(),
      });

      if (res.data.success && res.data.user) {
        updateCurrentUser(res.data.user);
        setSuccessToast('Settings saved successfully!');
        setTimeout(() => setSuccessToast(''), 3000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setSuccessToast(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-lg bg-[#140e2b] border border-purple-900/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="h-14 px-5 border-b border-purple-900/40 flex items-center justify-between bg-[#191136]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            <h3 className="font-semibold text-white text-base">App & Profile Settings</h3>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/40 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b border-purple-900/30 bg-[#120b24] px-4 pt-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'text-white border-purple-500 bg-purple-900/20 rounded-t-lg'
                : 'text-purple-300/60 border-transparent hover:text-purple-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Bio</span>
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'theme'
                ? 'text-white border-purple-500 bg-purple-900/20 rounded-t-lg'
                : 'text-purple-300/60 border-transparent hover:text-purple-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme & Colors</span>
          </button>
        </div>

        {successToast && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-purple-900/90 border border-purple-400 text-white text-xs flex items-center justify-center gap-2 shadow-lg animate-fadeIn">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{successToast}</span>
          </div>
        )}

        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'profile' ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={
                        avatar ||
                        '/avatars/male.svg'
                      }
                      alt="Avatar Preview"
                      className="w-16 h-16 rounded-full object-cover bg-purple-950 border-2 border-purple-500/60 shadow-lg"
                    />
                    <div className="absolute bottom-0 right-0 p-1 bg-purple-600 rounded-full text-white shadow">
                      <Camera className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload from Device</span>
                      </button>

                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <p className="text-[11px] text-purple-300/50">
                      Upload from your device, choose a preset, or paste a URL
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-[11px] font-medium text-purple-300/70 block mb-1.5">
                    Select a Preset Avatar:
                  </span>
                  <div className="flex gap-2">
                    {PRESET_AVATARS.map(({ url, label }) => (
                      <button
                        key={url}
                        type="button"
                        aria-label={label}
                        onClick={() => setAvatar(url)}
                        className={`w-12 h-12 rounded-xl overflow-hidden border-2 p-0.5 transition-all cursor-pointer ${
                          avatar === url
                            ? 'border-purple-400 ring-2 ring-purple-600/50 scale-105'
                            : 'border-purple-900/40 hover:border-purple-500/50'
                        }`}
                      >
                        <img
                          src={url}
                          alt={label}
                          className="w-full h-full object-cover rounded-lg bg-purple-950/60"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="Or paste custom image URL (https://...)"
                    className="w-full px-3 py-2 bg-[#0c0819] border border-purple-900/40 rounded-xl text-white text-xs placeholder-purple-300/30 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  required
                  placeholder="Your display name"
                  className="w-full px-3.5 py-2.5 bg-[#0c0819] border border-purple-900/40 rounded-xl text-white text-sm placeholder-purple-300/30 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-purple-200">
                    Bio / Status
                  </label>
                  <span className="text-[11px] text-purple-300/50">
                    {bio.length}/150
                  </span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={150}
                  rows={3}
                  placeholder="Share a short bio or status..."
                  className="w-full px-3.5 py-2.5 bg-[#0c0819] border border-purple-900/40 rounded-xl text-white text-xs placeholder-purple-300/30 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-900/30">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-purple-800/40 text-purple-300 hover:text-white text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          ) : (
            /* Theme Chooser */
            <div className="space-y-4">
              <div>
                <p className="text-xs text-purple-300/80 mb-3">
                  Choose a color scheme for the application:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {themes.map((t) => {
                    const isSelected = currentTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => changeTheme(t.id)}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 text-left ${
                          isSelected
                            ? 'border-purple-400 bg-purple-950/40 shadow-lg shadow-purple-950/60'
                            : 'border-purple-900/40 hover:border-purple-700/60 bg-[#0d091a]'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-md ring-2 ring-white/10"
                          style={{ backgroundColor: t.previewColor }}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-white text-xs leading-tight">
                              {t.name}
                            </h4>
                            {isSelected && (
                              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-purple-300/60 mt-0.5 leading-snug">
                            {t.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

