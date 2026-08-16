import React, { useState } from 'react';
import { User, Lock, Save, ShieldAlert, CheckCircle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function StudentSettingsSection({ user, onProfileUpdate }) {
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    grade: user?.grade || '',
    board: user?.board || '',
    school: user?.school || '',
    address: user?.address || '',
    learningGoal: user?.learningGoal || ''
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileSuccess(false);

    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (res.ok) {
        const updated = await res.json();
        setProfileSuccess(true);
        if (onProfileUpdate) onProfileUpdate(updated);
      } else {
        const err = await res.json();
        alert(err.message || 'Profile update failed');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordSuccess(false);

    try {
      const token = localStorage.getItem('verifiedtutor-token');
      const res = await fetch(`${API}/api/v1/profile/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (res.ok) {
        setPasswordSuccess(true);
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const err = await res.json();
        alert(err.message || 'Password update failed');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Account Settings</h2>
        <p className="text-sm text-slate-500 font-medium">Manage your personal profile and password security</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Profile Info Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm border-b border-slate-50 pb-3">
            <User size={16} className="text-emerald-700" />
            Personal Details
          </div>

          {profileSuccess && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex items-center gap-2 text-emerald-800 text-[11px] font-bold">
              <CheckCircle size={14} className="text-emerald-600" />
              Profile details updated successfully!
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Phone (Mobile)</label>
              <input
                type="tel"
                required
                value={profileData.mobile}
                onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                className="w-full border-slate-200 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Class / Grade</label>
                <input
                  type="text"
                  value={profileData.grade}
                  onChange={(e) => setProfileData({ ...profileData, grade: e.target.value })}
                  placeholder="e.g. 10th"
                  className="w-full border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Board</label>
                <input
                  type="text"
                  value={profileData.board}
                  onChange={(e) => setProfileData({ ...profileData, board: e.target.value })}
                  placeholder="e.g. CBSE / ICSE"
                  className="w-full border-slate-200 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">School Name</label>
              <input
                type="text"
                value={profileData.school}
                onChange={(e) => setProfileData({ ...profileData, school: e.target.value })}
                className="w-full border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Address</label>
              <input
                type="text"
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                className="w-full border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Learning Goals</label>
              <textarea
                rows="3"
                value={profileData.learningGoal}
                onChange={(e) => setProfileData({ ...profileData, learningGoal: e.target.value })}
                className="w-full border-slate-200 rounded-xl"
                placeholder="What subjects do you wish to excel in..."
              ></textarea>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full bg-[#056852] hover:bg-[#045242] text-white py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <Save size={13} /> {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 h-fit">
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm border-b border-slate-50 pb-3">
            <Lock size={16} className="text-emerald-700" />
            Security & Password
          </div>

          {passwordSuccess && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex items-center gap-2 text-emerald-800 text-[11px] font-bold">
              <CheckCircle size={14} className="text-emerald-600" />
              Password updated successfully!
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                className="w-full border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">New Password</label>
              <input
                type="password"
                required
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full border-slate-200 rounded-xl"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full bg-[#056852] hover:bg-[#045242] text-white py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <Save size={13} /> {isUpdatingPassword ? 'Updating Password...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
