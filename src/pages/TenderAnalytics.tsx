import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, TrendingUp, Shield } from 'lucide-react';
import { useTenderPermissions } from '../hooks/useTenderPermissions';
import SalesHistoryView from '../components/tender/SalesHistoryView';
import PriceAnalysisView from '../components/tender/PriceAnalysisView';
import AdminDashboardView from '../components/tender/AdminDashboardView';
import BottomNav from '../components/BottomNav';

type ViewMode = 'history' | 'analysis' | 'admin';

export default function TenderAnalytics() {
  const navigate = useNavigate();
  const permissions = useTenderPermissions();
  const [viewMode, setViewMode] = useState<ViewMode>(
    permissions.canAccessAdminDashboard ? 'admin' : 'history'
  );

  if (!permissions.canAccessTenderAnalytics) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">
            You do not have permission to access Tender Analytics.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="bg-blue-500 p-2 rounded-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  Tender Analytics
                </h1>
                <p className="text-xs text-slate-500 capitalize">
                  {permissions.role.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {!permissions.canAccessAdminDashboard && (
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-lg mx-auto px-4">
            <div className="flex gap-2 py-3">
              <button
                onClick={() => setViewMode('history')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition ${
                  viewMode === 'history'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Database className="w-4 h-4 inline mr-2" />
                Sales History
              </button>
              <button
                onClick={() => setViewMode('analysis')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition ${
                  viewMode === 'analysis'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Price Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 py-6">
        {viewMode === 'history' && <SalesHistoryView />}
        {viewMode === 'analysis' && <PriceAnalysisView />}
        {viewMode === 'admin' && <AdminDashboardView />}
      </main>

      <BottomNav />
    </div>
  );
}
