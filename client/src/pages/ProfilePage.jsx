import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import {
  User,
  Mail,
  Phone,
  Lock,
  Trash2,
  Camera,
  Moon,
  Sun,
  Calendar,
  Clock,
  Users,
  Package,
  Save,
  Edit2,
  X,
  LogOut
} from 'lucide-react';
import {
  getUserProfile,
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
  uploadProfilePicture,
  deleteUserProfile
} from '../services/api';
import { format } from 'date-fns';

const ProfilePage = () => {
  const { t } = useI18n();
  const { user, token, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ clientCount: 0, productCount: 0, documentCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit states
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordForEmail, setPasswordForEmail] = useState('');

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
    email: false
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Reset stats immediately when token changes (user logs in/out)
    // This prevents showing old user's counts
    setStats({ clientCount: 0, productCount: 0, documentCount: 0 });
    setProfile(null); // Clear profile to prevent showing old data
    if (token) {
      loadProfile();
    }
  }, [token]);

  const loadProfile = async () => {
    if (!token) {
      // Clear stats if no token
      setStats({ clientCount: 0, productCount: 0, documentCount: 0 });
      setProfile(null);
      return;
    }
    setLoading(true);
    setError(''); // Clear any previous errors
    try {
      // Reset stats BEFORE fetching to ensure no old values are shown
      setStats({ clientCount: 0, productCount: 0, documentCount: 0 });
      
      // Fetch fresh data from server (no caching)
      const data = await getUserProfile(token);
      
      // Only update if we got valid data
      if (data && data.user) {
        setProfile(data.user);
        // Set stats - ensure they're numbers, never undefined
        setStats({
          clientCount: typeof data.stats?.clientCount === 'number' ? data.stats.clientCount : 0,
          productCount: typeof data.stats?.productCount === 'number' ? data.stats.productCount : 0,
          documentCount: typeof data.stats?.documentCount === 'number' ? data.stats.documentCount : 0
        });
        setFullName(data.user.fullName || '');
        setPhone(data.user.phone || '');
        setEmail(data.user.email || '');
      } else {
        // Invalid response - reset everything
        setStats({ clientCount: 0, productCount: 0, documentCount: 0 });
        setProfile(null);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
      // Reset stats on error to prevent showing stale data
      setStats({ clientCount: 0, productCount: 0, documentCount: 0 });
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setError('');
    setSuccess('');
    try {
      const data = await updateUserProfile(token, { fullName, phone, darkMode: profile?.darkMode });
      setProfile(data.user);
      updateUser(data.user);
      setEditingProfile(false);
      setSuccess(t('profileUpdated') || 'Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleUpdateEmail = async () => {
    setError('');
    setSuccess('');
    if (!passwordForEmail) {
      setError(t('passwordRequired') || 'Password is required to change email');
      return;
    }
    try {
      await updateUserEmail(token, email, passwordForEmail);
      await loadProfile();
      setEditingEmail(false);
      setPasswordForEmail('');
      setSuccess(t('emailUpdated') || 'Email updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update email');
    }
  };

  const handleUpdatePassword = async () => {
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError(t('passwordsDoNotMatch') || 'Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError(t('passwordMinLength') || 'Password must be at least 6 characters');
      return;
    }
    try {
      await updateUserPassword(token, currentPassword, newPassword);
      setEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(t('passwordUpdated') || 'Password updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update password');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Clear previous errors
    setError('');
    setSuccess('');

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError(t('invalidImageType') || 'Please upload a JPG, PNG, or WebP image');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      setError(t('fileTooLarge') || 'File size must be less than 5MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Create preview first
    const reader = new FileReader();
    reader.onerror = () => {
      setError(t('imageReadError') || 'Failed to read image file');
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.onload = async (event) => {
      try {
        // Set preview immediately
        const previewUrl = event.target.result;
        setImagePreview(previewUrl);
        setImageLoading(true);

        // Upload the file
        const data = await uploadProfilePicture(token, file);
        
        // Ensure the URL is correct (backend returns /api/users/profile-pictures/...)
        let pictureUrl = data.profilePicture;
        if (pictureUrl && !pictureUrl.startsWith('/api') && !pictureUrl.startsWith('http')) {
          pictureUrl = `/api${pictureUrl}`;
        }
        
        // Update profile with new picture URL
        const updatedProfile = { ...profile, profilePicture: pictureUrl };
        setProfile(updatedProfile);
        updateUser(updatedProfile);
        
        // Wait for the new image to be available on server, then switch from preview
        // Use a small delay to ensure server has processed the file
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Clear preview and show success
        setImagePreview(null);
        setImageLoading(false);
        setSuccess(t('pictureUploaded') || 'Profile picture uploaded successfully');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.message || 'Failed to upload picture');
        setImagePreview(null);
        setImageLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    
    reader.readAsDataURL(file);
  };

  const handleToggleDarkMode = async () => {
    try {
      const data = await updateUserProfile(token, { darkMode: !profile?.darkMode });
      setProfile(data.user);
      updateUser(data.user);
      // Apply dark mode to document
      if (data.user.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (err) {
      setError(err.message || 'Failed to update theme');
    }
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm(t('confirmDeleteProfile') || 'Are you sure you want to delete your profile? This action cannot be undone.')) {
      return;
    }

    if (!window.confirm(t('confirmDeleteProfileFinal') || 'This will permanently delete your account and all associated data. Type DELETE to confirm.')) {
      return;
    }

    setError('');
    try {
      await deleteUserProfile(token);
      logout();
    } catch (err) {
      setError(err.message || 'Failed to delete profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{t('profileNotFound') || 'Profile not found'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <User className="w-8 h-8 text-primary" />
        {t('profile') || 'Profile'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Picture & Basic Info */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              {/* Profile Picture Container - Fixed Circular Size */}
              <div className="relative inline-block mb-4">
                {/* Circular Container - Fixed 120x120 */}
                <div className="profile-picture-container relative mx-auto">
                  {/* Image or Placeholder */}
                  <div className="w-full h-full rounded-full overflow-hidden border-4 border-primary bg-gray-100 flex items-center justify-center relative">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover animate-fadeIn"
                        style={{
                          objectFit: 'cover',
                          objectPosition: 'center'
                        }}
                        onError={(e) => {
                          // Only log error, don't show to user for preview
                          console.error('Preview image load error');
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : profile.profilePicture ? (
                      <img
                        key={profile.profilePicture} // Force re-render when URL changes
                        src={profile.profilePicture.startsWith('/api') ? profile.profilePicture : `/api${profile.profilePicture}`}
                        alt="Profile"
                        className="w-full h-full object-cover animate-fadeIn"
                        style={{
                          objectFit: 'cover',
                          objectPosition: 'center'
                        }}
                        onLoad={() => {
                          setImageLoading(false);
                          // Clear any previous errors on successful load
                          if (error && error.includes('image')) {
                            setError('');
                          }
                        }}
                        onError={(e) => {
                          // Only show error if it's not a preview and image actually fails
                          if (!imagePreview) {
                            console.error('Profile image load error:', profile.profilePicture);
                            // Don't set error immediately - might be temporary network issue
                            // Only show error after retry fails
                            const img = e.target;
                            img.style.display = 'none';
                            // Try to reload after a delay
                            setTimeout(() => {
                              if (img.src) {
                                img.src = img.src + '?t=' + Date.now();
                                img.style.display = 'block';
                              }
                            }, 1000);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-16 h-16 sm:w-20 sm:h-20 text-primary" />
                      </div>
                    )}
                    
                    {/* Loading Overlay */}
                    {imageLoading && (
                      <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {/* Camera/Edit Icon Overlay - Bottom Right */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageLoading}
                    className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2.5 sm:p-3 hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-10"
                    title={t('changePhoto') || 'Change Photo'}
                    aria-label={t('changePhoto') || 'Change Photo'}
                  >
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
              <h2 className="text-xl font-bold">{profile.fullName}</h2>
              <p className="text-gray-600 text-sm">{profile.email}</p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-gray-600">{t('clients') || 'Clients'}:</span>
                <span className="font-bold">{stats.clientCount}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-gray-600">{t('products') || 'Products'}:</span>
                <span className="font-bold">{stats.productCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Profile Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{t('accountInformation') || 'Account Information'}</h3>
              {!editingProfile && (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="text-primary hover:text-orange-600"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {editingProfile ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('fullName') || 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('phone') || 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateProfile}
                    className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {t('save') || 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingProfile(false);
                      setFullName(profile.fullName);
                      setPhone(profile.phone || '');
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    {t('cancel') || 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">{t('fullName') || 'Full Name'}</p>
                    <p className="font-medium">{profile.fullName}</p>
                  </div>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">{t('phone') || 'Phone Number'}</p>
                      <p className="font-medium">{profile.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Email */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Mail className="w-5 h-5" />
                {t('email') || 'Email'}
              </h3>
              {!editingEmail && (
                <button
                  onClick={() => setEditingEmail(true)}
                  className="text-primary hover:text-orange-600"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {editingEmail ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('newEmail') || 'New Email'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('currentPassword') || 'Current Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.email ? 'text' : 'password'}
                      value={passwordForEmail}
                      onChange={(e) => setPasswordForEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, email: !showPasswords.email })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPasswords.email ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateEmail}
                    className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-orange-600"
                  >
                    {t('update') || 'Update'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingEmail(false);
                      setEmail(profile.email);
                      setPasswordForEmail('');
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                  >
                    {t('cancel') || 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700">{profile.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Lock className="w-5 h-5" />
                {t('password') || 'Password'}
              </h3>
              {!editingPassword && (
                <button
                  onClick={() => setEditingPassword(true)}
                  className="text-primary hover:text-orange-600"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {editingPassword ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('currentPassword') || 'Current Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('newPassword') || 'New Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary pr-10"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('confirmPassword') || 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary pr-10"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdatePassword}
                    className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-orange-600"
                  >
                    {t('update') || 'Update'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingPassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                  >
                    {t('cancel') || 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">••••••••</p>
            )}
          </div>

          {/* Account Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-4">{t('accountDetails') || 'Account Details'}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">{t('accountCreated') || 'Account Created'}</p>
                  <p className="font-medium">
                    {profile.createdAt ? format(new Date(profile.createdAt), 'dd/MM/yyyy') : '-'}
                  </p>
                </div>
              </div>
              {profile.lastLogin && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">{t('lastLogin') || 'Last Login'}</p>
                    <p className="font-medium">
                      {format(new Date(profile.lastLogin), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {profile.darkMode ? (
                  <Moon className="w-5 h-5 text-primary" />
                ) : (
                  <Sun className="w-5 h-5 text-primary" />
                )}
                <div>
                  <h3 className="font-bold">{t('theme') || 'Theme'}</h3>
                  <p className="text-sm text-gray-600">
                    {profile.darkMode ? (t('darkMode') || 'Dark Mode') : (t('lightMode') || 'Light Mode')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  profile.darkMode ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profile.darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Logout */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-2">{t('logout') || 'Logout'}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('logoutDescription') || 'Sign out of your account'}
            </p>
            <button
              onClick={logout}
              className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-orange-600 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {t('logout') || 'Logout'}
            </button>
          </div>

          {/* Delete Profile */}
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
            <h3 className="text-lg font-bold text-red-600 mb-2">{t('deleteProfile') || 'Delete Profile'}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('deleteProfileWarning') || 'Once you delete your profile, there is no going back. Please be certain.'}
            </p>
            <button
              onClick={handleDeleteProfile}
              className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {t('deleteProfile') || 'Delete Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

