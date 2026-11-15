import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Gamepad2, ArrowRight, AlertCircle, Loader2, Upload } from 'lucide-react';

const PRESET_AVATARS = [
  { label: 'Male avatar', url: '/avatars/male.svg' },
  { label: 'Female avatar', url: '/avatars/female.svg' },
];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: 'Hey there! Ready to chat and play!',
    profilePicture: PRESET_AVATARS[0].url,
  });
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [readingPhoto, setReadingPhoto] = useState(false);
  const photoReader = useRef(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (localError) setLocalError('');
  };

  const handleSelectAvatar = (url) => {
    photoReader.current?.abort();
    setReadingPhoto(false);
    setLocalError('');
    setFormData((prev) => ({ ...prev, profilePicture: url }));
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    photoReader.current?.abort();
    setReadingPhoto(false);
    if (!file.type.startsWith('image/')) {
      setLocalError('Please choose an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLocalError('Please choose an image smaller than 2 MB.');
      return;
    }
    setLocalError('');
    setReadingPhoto(true);
    const reader = new FileReader();
    photoReader.current = reader;
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, profilePicture: reader.result }));
      setReadingPhoto(false);
      photoReader.current = null;
    };
    reader.onerror = () => {
      setLocalError('Could not read the photo. Please try another image.');
      setReadingPhoto(false);
      photoReader.current = null;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setLocalError('');

    const res = await register({
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      profilePicture: formData.profilePicture,
      bio: formData.bio.trim(),
    });

    setSubmitting(false);

    if (res.success) {
      navigate('/');
    } else {
      setLocalError(res.message);
    }
  };

  return (
    <div className="auth-screen min-h-screen flex items-center justify-center bg-[#090614] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,58,220,0.25),rgba(255,255,255,0))] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="auth-brand inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-lg shadow-purple-600/30 mb-3 ring-1 ring-purple-400/30">
            <Gamepad2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Chat <span className="text-purple-400">&</span> Play
          </h1>
          <p className="text-sm text-purple-300/70 mt-1">
            Create your account to start messaging and gaming
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-[#130e26]/90 backdrop-blur-xl border border-purple-900/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-purple-950/50">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white">Get Started</h2>
            <p className="text-xs sm:text-sm text-purple-300/60 mt-1">
              Join the conversation and challenge your friends
            </p>
          </div>

          {localError && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
              <span>{localError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-medium text-purple-200/80 mb-2">
                Choose an Avatar
              </label>
              <div className="flex items-center justify-between gap-2 p-2.5 bg-[#0b0818] border border-purple-900/40 rounded-xl overflow-x-auto">
                {PRESET_AVATARS.map(({ url, label }) => (
                  <button
                    key={url}
                    type="button"
                    aria-label={label}
                    onClick={() => handleSelectAvatar(url)}
                    className={`relative p-1 rounded-full transition-transform hover:scale-105 flex-shrink-0 ${
                      formData.profilePicture === url
                        ? 'ring-2 ring-purple-400 bg-purple-600/20 scale-105'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={url}
                      alt={label}
                      className="w-10 h-10 rounded-full object-cover bg-purple-950/50"
                    />
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <img src={formData.profilePicture} alt="Selected profile" className="w-10 h-10 rounded-full object-cover bg-[#2c2c2e]" />
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 bg-[#2c2c2e] text-sm text-white cursor-pointer hover:bg-[#3a3a3c] focus-within:ring-2 focus-within:ring-blue-500">
                  <Upload className="w-4 h-4" />
                  <span>{readingPhoto ? 'Reading photo...' : 'Upload photo from device'}</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="sr-only" />
                </label>
              </div>
              <p className="mt-1.5 text-xs text-purple-300/60">Optional. Choose an image up to 2 MB.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-200/80 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rampal"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0b0818] border border-purple-900/40 rounded-xl text-white placeholder-purple-300/30 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-200/80 mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="rampal@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0b0818] border border-purple-900/40 rounded-xl text-white placeholder-purple-300/30 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-purple-200/80 mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 chars"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0b0818] border border-purple-900/40 rounded-xl text-white placeholder-purple-300/30 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-purple-200/80 mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0b0818] border border-purple-900/40 rounded-xl text-white placeholder-purple-300/30 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-200/80 mb-1.5">
                Bio / Status (Optional)
              </label>
              <input
                type="text"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="A short note about yourself"
                maxLength={100}
                className="w-full px-4 py-2 bg-[#0b0818] border border-purple-900/40 rounded-xl text-white placeholder-purple-300/30 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || readingPhoto}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all shadow-md shadow-purple-600/30 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-purple-900/20 text-center text-xs text-purple-300/60">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4 ml-1"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

