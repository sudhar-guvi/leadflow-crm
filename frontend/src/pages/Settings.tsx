import React from 'react';
import { Settings as SettingsIcon, User, Bell, Shield } from 'lucide-react';

const Settings: React.FC = () => {
  const appName = import.meta.env.VITE_APP_NAME || 'LeadFlow CRM';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold">Profile</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Manage your profile information</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl">
                RS
              </div>
              <div>
                <p className="font-medium">Rahul Sharma</p>
                <p className="text-sm text-gray-500">BD Executive</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              <p>Email: rahul@leadflow.com</p>
              <p>Phone: +91 98765 43210</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Configure notification preferences</p>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm">Email notifications</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm">Push notifications</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm">Daily summary</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
          </div>
        </div>

        {/* Security */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold">Security</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Manage security settings</p>
          <div className="space-y-3">
            <button className="btn btn-outline btn-sm w-full">Change Password</button>
            <button className="btn btn-outline btn-sm w-full">Enable 2FA</button>
          </div>
        </div>

        {/* App Info */}
        <div className="card p-6 md:col-span-2 lg:col-span-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold">Application Info</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">App Name</p>
              <p className="font-medium">{appName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Version</p>
              <p className="font-medium">v1.0.0</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Environment</p>
              <p className="font-medium capitalize">Development</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">API URL</p>
              <p className="font-medium text-sm truncate">http://localhost:4000/api</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
