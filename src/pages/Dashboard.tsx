import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDoctorsBySales } from '../hooks/useDoctors';
import { useVisitsBySales } from '../hooks/useVisits';
import { useProfile } from '../hooks/useProfiles';
import { useTenderPermissions } from '../hooks/useTenderPermissions';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, Users, TrendingUp, Pill, Building2, Target, Database } from 'lucide-react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO, isSameDay } from 'date-fns';
import BottomNav from '../components/BottomNav';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: doctors, isLoading: loadingDoctors } = useDoctorsBySales(user?.id);
  const { data: visits, isLoading: loadingVisits } = useVisitsBySales(user?.id);
  const tenderPermissions = useTenderPermissions();

  const thisMonthVisits = useMemo(() => {
    if (!visits) return [];
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return visits.filter((visit) => {
      const visitDate = parseISO(visit.visit_date);
      return visitDate >= monthStart && visitDate <= monthEnd;
    });
  }, [visits]);

  const chartData = useMemo(() => {
    if (!visits) return [];

    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map((date) => {
      const dayVisits = visits.filter((visit) =>
        isSameDay(parseISO(visit.visit_date), date)
      );

      return {
        name: format(date, 'EEE'),
        visits: dayVisits.length,
      };
    });
  }, [visits]);

  const activeDoctors = useMemo(() => {
    return doctors?.filter((d) => d.status === 'active').length || 0;
  }, [doctors]);

  const hospitalsCoverage = useMemo(() => {
    if (!doctors) return 0;
    const uniqueHospitalIds = new Set(
      doctors.map((d) => d.hospital_id).filter((id) => id)
    );
    return uniqueHospitalIds.size;
  }, [doctors]);

  const outcomeData = useMemo(() => {
    if (!thisMonthVisits) return [];

    const outcomeCounts = thisMonthVisits.reduce(
      (acc, visit) => {
        acc[visit.outcome] = (acc[visit.outcome] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(outcomeCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
      value,
    }));
  }, [thisMonthVisits]);

  const productMentionData = useMemo(() => {
    if (!thisMonthVisits) return [];

    const productCounts = thisMonthVisits.reduce(
      (acc, visit) => {
        if (visit.products_discussed && Array.isArray(visit.products_discussed)) {
          visit.products_discussed.forEach((product) => {
            acc[product] = (acc[product] || 0) + 1;
          });
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(productCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [thisMonthVisits]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 p-2 rounded-lg">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">PharmaCRM</h1>
                <p className="text-xs text-slate-500">{profile?.full_name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Welcome back!
          </h2>
          <p className="text-slate-600">Here's your performance overview</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-semibold text-slate-700">
                This Month
              </h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {loadingVisits ? '...' : thisMonthVisits.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total visits</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-semibold text-slate-700">
                Active Doctors
              </h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {loadingDoctors ? '...' : activeDoctors}
            </p>
            <p className="text-xs text-slate-500 mt-1">In your territory</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-700">
                Hospital Coverage
              </h3>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {loadingDoctors ? '...' : hospitalsCoverage}
            </p>
            <p className="text-xs text-slate-500 mt-1">Unique hospitals</p>
          </div>

          {tenderPermissions.canAccessTenderAnalytics && (
            <div
              onClick={() => navigate('/tender-analytics')}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm border border-blue-400 p-4 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-white" />
                <h3 className="text-sm font-semibold text-white">
                  Tender Analytics
                </h3>
              </div>
              <p className="text-2xl font-bold text-white">
                New
              </p>
              <p className="text-xs text-blue-100 mt-1">
                Search tender data and pricing
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-semibold text-slate-900">
              Visits Last 7 Days
            </h3>
          </div>
          {loadingVisits ? (
            <div className="h-48 flex items-center justify-center text-slate-400">
              Loading...
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="visits" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400">
              No visit data available
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-slate-900">
              Visit Outcomes (This Month)
            </h3>
          </div>
          {loadingVisits ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              Loading...
            </div>
          ) : outcomeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No outcome data available
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Pill className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-semibold text-slate-900">
              Top Products Discussed (This Month)
            </h3>
          </div>
          {loadingVisits ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              Loading...
            </div>
          ) : productMentionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productMentionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No product data available
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
