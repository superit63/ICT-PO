import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDoctorsBySales, useCreateDoctor } from '../hooks/useDoctors';
import { useHospitals } from '../hooks/useHospitals';
import { Building2, Phone, Mail, Clock, AlertTriangle, Plus, X, Loader2 } from 'lucide-react';
import { formatDistanceToNow, parseISO, differenceInDays } from 'date-fns';
import BottomNav from '../components/BottomNav';
import { DoctorRole, DoctorStatus } from '../types/database';

export default function Doctors() {
  const { user } = useAuth();
  const { data: doctors, isLoading } = useDoctorsBySales(user?.id);
  const { data: hospitals } = useHospitals();
  const createDoctor = useCreateDoctor();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    hospital_id: '',
    department: '',
    doctor_role: 'bác_sĩ' as DoctorRole,
    phone: '',
    email: '',
    status: 'potential' as DoctorStatus,
  });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const sortedDoctors = useMemo(() => {
    if (!doctors) return [];

    const now = new Date();

    return [...doctors].sort((a, b) => {
      const aDays = a.last_visit_at
        ? differenceInDays(now, parseISO(a.last_visit_at))
        : Infinity;
      const bDays = b.last_visit_at
        ? differenceInDays(now, parseISO(b.last_visit_at))
        : Infinity;

      return bDays - aDays;
    });
  }, [doctors]);

  const getDaysSinceLastVisit = (lastVisitAt: string | null) => {
    if (!lastVisitAt) return null;
    return differenceInDays(new Date(), parseISO(lastVisitAt));
  };

  const getDoctorRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      trưởng_khoa: 'Trưởng Khoa',
      phó_khoa: 'Phó Khoa',
      bác_sĩ: 'Bác Sĩ',
      điều_dưỡng: 'Điều Dưỡng',
      kỹ_sư: 'Kỹ Sư',
    };
    return roleMap[role] || role;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700';
      case 'potential':
        return 'bg-blue-100 text-blue-700';
      case 'churned':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Doctor name is required');
      return;
    }

    if (!formData.hospital_id) {
      setError('Please select a hospital');
      return;
    }

    if (!formData.department.trim()) {
      setError('Department is required');
      return;
    }

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await createDoctor.mutateAsync({
        ...formData,
        assigned_sales_id: user.id,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
      });

      setShowModal(false);
      setFormData({
        name: '',
        hospital_id: '',
        department: '',
        doctor_role: 'bác_sĩ',
        phone: '',
        email: '',
        status: 'potential',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create doctor');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4">
          <div className="h-16 flex items-center">
            <h1 className="text-xl font-bold text-slate-900">My Doctors</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-400">Loading doctors...</div>
          </div>
        ) : !doctors || doctors.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <p className="text-slate-500">No doctors assigned yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDoctors.map((doctor) => {
              const daysSinceVisit = getDaysSinceLastVisit(doctor.last_visit_at);
              const isOverdue = daysSinceVisit !== null && daysSinceVisit > 21;

              return (
                <div
                  key={doctor.id}
                  className={`bg-white rounded-xl shadow-sm p-4 transition-all ${
                    isOverdue
                      ? 'border-2 border-red-400'
                      : 'border border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {doctor.name}
                        </h3>
                        {isOverdue && (
                          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600">
                        {getDoctorRoleLabel(doctor.doctor_role)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(
                        doctor.status
                      )}`}
                    >
                      {doctor.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Building2 className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        {doctor.hospital?.name || 'Unknown Hospital'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="font-medium">Dept:</span>
                      <span>{doctor.department}</span>
                    </div>

                    {doctor.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{doctor.phone}</span>
                      </div>
                    )}

                    {doctor.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{doctor.email}</span>
                      </div>
                    )}
                  </div>

                  <div
                    className={`flex items-center gap-2 text-sm pt-3 border-t ${
                      isOverdue
                        ? 'border-red-200 text-red-700 font-semibold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    {doctor.last_visit_at ? (
                      <span>
                        Last visit: {daysSinceVisit} days ago
                        {isOverdue && ' (Overdue!)'}
                      </span>
                    ) : (
                      <span className="text-slate-500">Never visited</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-30"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Add New Doctor</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Doctor Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Dr. Nguyen Van A"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hospital *
                </label>
                <select
                  value={formData.hospital_id}
                  onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  required
                >
                  <option value="">Select a hospital...</option>
                  {hospitals?.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Department *
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Khoa Tim Mạch"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Role *
                </label>
                <select
                  value={formData.doctor_role}
                  onChange={(e) => setFormData({ ...formData, doctor_role: e.target.value as DoctorRole })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  required
                >
                  <option value="trưởng_khoa">Trưởng Khoa</option>
                  <option value="phó_khoa">Phó Khoa</option>
                  <option value="bác_sĩ">Bác Sĩ</option>
                  <option value="điều_dưỡng">Điều Dưỡng</option>
                  <option value="kỹ_sư">Kỹ Sư</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as DoctorStatus })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  required
                >
                  <option value="potential">Potential</option>
                  <option value="active">Active</option>
                  <option value="churned">Churned</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0912345678"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="doctor@hospital.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Create Doctor'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
