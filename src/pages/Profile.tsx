import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfiles';
import { Mail, MapPin, Phone, LogOut, User as UserIcon, Shield } from 'lucide-react';
import BottomNav from '../components/BottomNav';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile(user?.id);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4">
          <div className="h-16 flex items-center">
            <h1 className="text-xl font-bold text-slate-900">Profile</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-400">Loading profile...</div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center">
                  <UserIcon className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {profile?.full_name || 'User'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600 capitalize">
                      {profile?.role || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-4 border-b border-slate-200">
                  <Mail className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mb-1">Email</p>
                    <p className="text-sm text-slate-900 break-all">
                      {profile?.email || user?.email || 'N/A'}
                    </p>
                  </div>
                </div>

                {profile?.phone && (
                  <div className="flex items-start gap-3 pb-4 border-b border-slate-200">
                    <Phone className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">Phone</p>
                      <p className="text-sm text-slate-900">{profile.phone}</p>
                    </div>
                  </div>
                )}

                {profile?.territory_code && (
                  <div className="flex items-start gap-3 pb-4 border-b border-slate-200">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">Territory</p>
                      <p className="text-sm text-slate-900">
                        {profile.territory_code}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full bg-white hover:bg-slate-50 text-slate-900 font-semibold py-4 px-6 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
