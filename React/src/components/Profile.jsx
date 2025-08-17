import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { ChevronDown, UploadCloud, CheckCircle, XCircle, Info, Trash2 } from 'lucide-react';
import userService from '../services/userService';

const Profile = () => {
  const { theme } = useContext(ThemeContext);
  const isDarkMode = theme === 'dark';

  const [userData, setUserData] = useState({
    email: '',
    username: '',
    role: '',
    active: true,
    avatar: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Fetch user data
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await userService.getProfile();
      if (response.success) {
        setUserData(response.data);
      } else {
        setError(response.message || "An error occurred while retrieving data.");
      }
    } catch (err) {
      setError("Unable to retrieve your profile. Please log in again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (file) => {
    try {
      setUploadingAvatar(true);
      setError(null);
      const response = await userService.uploadAvatar(file);
      if (response.success) {
        const avatarUrl = response.data.avatarUrl || (response.data.user && response.data.user.avatar);
        if (avatarUrl) {
          setUserData((prevData) => ({ ...prevData, avatar: avatarUrl }));
        } else {
          setError("Avatar upload succeeded but no URL was returned");
        }
      } else {
        setError(response.message || "Failed to upload avatar");
      }
    } catch (err) {
      setError(`Avatar upload failed: ${err.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error && !error.includes('avatar')) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'}`}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} p-8`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">👤 Profile Settings</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage your personal and account information.
          </p>
        </div>

        {/* Main Content */}
        <div className={`p-8 rounded-2xl shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200">
              {userData.avatar ? (
                <img src={userData.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl font-medium text-gray-400">
                    {userData.username ? userData.username.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
              )}
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 flex items-center justify-center transition-all duration-200 cursor-pointer"
              >
                <span className="text-white font-medium">
                  {uploadingAvatar ? 'Uploading...' : <UploadCloud size={24} />}
                </span>
                <input
                  id="avatar-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files[0] && handleAvatarUpload(e.target.files[0])}
                />
              </label>
            </div>
            {error && (
              <div className="mt-4 text-center text-red-500 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Personal Details */}
          <div className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={userData.username}
                onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                className={`w-full p-3 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                className={`w-full p-3 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
              <div className="relative">
                <select
                  className={`w-full p-3 rounded-lg border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  } appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                  defaultValue="English (US)"
                >
                  <option>English (US)</option>
                </select>
                <ChevronDown
                  size={18}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                />
              </div>
            </div>

            {/* Time Zone */}
            <div>
              <label className="block text-sm font-medium mb-2">Time Zone</label>
              <div className="relative">
                <select
                  className={`w-full p-3 rounded-lg border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                  } appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                  defaultValue="(GMT-05:00) Eastern Time – New York"
                >
                  <option>(GMT-05:00) Eastern Time – New York</option>
                </select>
                <ChevronDown
                  size={18}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                />
              </div>
            </div>

            {/* Work Hours */}
            <div>
              <label className="block text-sm font-medium mb-2">Work Hours</label>
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <select
                    className={`w-full p-3 rounded-lg border ${
                      isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                    } appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                    defaultValue="8:00 AM"
                  >
                    <option>8:00 AM</option>
                  </select>
                  <ChevronDown
                    size={18}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  />
                </div>
                <span className="text-gray-500">to</span>
                <div className="relative flex-1">
                  <select
                    className={`w-full p-3 rounded-lg border ${
                      isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
                    } appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                    defaultValue="9:00 PM"
                  >
                    <option>9:00 PM</option>
                  </select>
                  <ChevronDown
                    size={18}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;