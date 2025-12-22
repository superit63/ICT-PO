import { useMemo } from 'react';
import { Shield, Users, TrendingUp, Clock, RotateCcw, Database, Search } from 'lucide-react';
import {
  useAllSearchLogs,
  useAllSearchQuotas,
  useResetUserQuota,
} from '../../hooks/useTenders';
import { format, parseISO } from 'date-fns';

export default function AdminDashboardView() {
  const { data: searchLogs } = useAllSearchLogs();
  const { data: quotas } = useAllSearchQuotas();
  const resetQuota = useResetUserQuota();

  const topCustomers = useMemo(() => {
    if (!searchLogs) return [];
    const customerCounts = searchLogs.reduce((acc, log) => {
      if (log.customer_filter) {
        acc[log.customer_filter] = (acc[log.customer_filter] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(customerCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [searchLogs]);

  const topBrands = useMemo(() => {
    if (!searchLogs) return [];
    const brandCounts = searchLogs.reduce((acc, log) => {
      if (log.manufacturer_filter) {
        acc[log.manufacturer_filter] = (acc[log.manufacturer_filter] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(brandCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [searchLogs]);

  const userStats = useMemo(() => {
    if (!quotas) return [];
    return quotas.map((quota) => {
      const userLogs = searchLogs?.filter((log) => log.user_id === quota.user_id) || [];
      const avgSearches = userLogs.length > 0 ? userLogs.length / 30 : 0;
      return {
        userId: quota.user_id,
        todayCount: quota.searches_used,
        limit: quota.searches_limit,
        avgSearches: avgSearches.toFixed(1),
        totalSearches: userLogs.length,
      };
    });
  }, [quotas, searchLogs]);

  const handleResetQuota = async (userId: string) => {
    if (confirm('Are you sure you want to reset this user\'s quota?')) {
      await resetQuota.mutateAsync(userId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        </div>
        <p className="text-sm opacity-90">Manage quotas and view analytics</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-slate-900">User Statistics</h3>
        </div>

        {userStats.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No user data available</p>
        ) : (
          <div className="space-y-3">
            {userStats.map((stat) => (
              <div
                key={stat.userId}
                className="bg-slate-50 rounded-lg p-4 border border-slate-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">User ID</p>
                    <p className="text-xs font-mono text-slate-500 truncate max-w-[200px]">
                      {stat.userId}
                    </p>
                  </div>
                  <button
                    onClick={() => handleResetQuota(stat.userId)}
                    className="px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition"
                    disabled={resetQuota.isPending}
                  >
                    <RotateCcw className="w-4 h-4 inline mr-1" />
                    Reset
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-xs text-slate-600 mb-1">Today</p>
                    <p className="text-lg font-bold text-slate-900">
                      {stat.todayCount}/{stat.limit}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-xs text-slate-600 mb-1">Avg/Day</p>
                    <p className="text-lg font-bold text-slate-900">{stat.avgSearches}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-xs text-slate-600 mb-1">Total</p>
                    <p className="text-lg font-bold text-slate-900">{stat.totalSearches}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-semibold text-slate-900">
              Top Searched Customers
            </h3>
          </div>
          {topCustomers.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No search data yet</p>
          ) : (
            <div className="space-y-2">
              {topCustomers.map((customer, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <p className="font-medium text-slate-900">{customer.name}</p>
                  </div>
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                    {customer.count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-slate-900">
              Top Searched Brands
            </h3>
          </div>
          {topBrands.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No search data yet</p>
          ) : (
            <div className="space-y-2">
              {topBrands.map((brand, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <p className="font-medium text-slate-900">{brand.name}</p>
                  </div>
                  <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                    {brand.count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-slate-900">
            Recent Activity
          </h3>
        </div>
        {!searchLogs || searchLogs.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {searchLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="flex gap-3 p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Search className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 mb-1">
                    Search Query
                  </p>
                  <div className="text-xs text-slate-600 space-y-1">
                    {log.customer_filter && (
                      <p>Customer: {log.customer_filter}</p>
                    )}
                    {log.manufacturer_filter && (
                      <p>Brand: {log.manufacturer_filter}</p>
                    )}
                    {log.product_filter && (
                      <p>Product: {log.product_filter}</p>
                    )}
                    <p className="text-slate-500">
                      Results: {log.results_count} |{' '}
                      {format(parseISO(log.created_at), 'MMM d, HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
