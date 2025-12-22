import { X, Building2, Phone, Mail, Briefcase, Calendar, Clock, Activity, TrendingUp, User } from 'lucide-react';
import { useDoctor } from '../../hooks/useDoctors';
import { useDoctorVisitsThisMonth, useVisitsByDoctor } from '../../hooks/useVisits';
import { formatDistanceToNow, parseISO, differenceInDays } from 'date-fns';

interface DoctorDetailModalProps {
  doctorId: string;
  onClose: () => void;
}

export default function DoctorDetailModal({ doctorId, onClose }: DoctorDetailModalProps) {
  const { data: doctor, isLoading } = useDoctor(doctorId);
  const { data: visitsThisMonth, isLoading: visitsLoading } = useDoctorVisitsThisMonth(doctorId);
  const { data: recentVisits, isLoading: recentVisitsLoading } = useVisitsByDoctor(doctorId);
  
  const latestVisits = recentVisits ? recentVisits.slice(0, 5) : [];
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
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
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'potential':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'churned':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getDaysSinceLastVisit = (lastVisitAt: string | null) => {
    if (!lastVisitAt) return null;
    return differenceInDays(new Date(), parseISO(lastVisitAt));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-900">Doctor Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="text-slate-400">Loading doctor details...</div>
          </div>
        ) : !doctor ? (
          <div className="p-8 text-center">
            <div className="text-slate-400">Doctor not found</div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {doctor.name}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Briefcase className="w-4 h-4" />
                    <span className="font-medium">
                      {getDoctorRoleLabel(doctor.doctor_role)}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-sm font-medium px-3 py-1.5 rounded-full border ${getStatusColor(
                    doctor.status
                  )}`}
                >
                  {doctor.status}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Contact Information
                </h4>

                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">
                      {doctor.hospital?.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {doctor.hospital?.city}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="text-sm text-slate-700">
                    <span className="font-medium">Department:</span> {doctor.department}
                  </div>
                </div>

                {doctor.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <a
                      href={`tel:${doctor.phone}`}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      {doctor.phone}
                    </a>
                  </div>
                )}

                {doctor.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <a
                      href={`mailto:${doctor.email}`}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium truncate"
                    >
                      {doctor.email}
                    </a>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Visit History
                </h4>

                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div className="text-sm text-slate-700">
                    <span className="font-medium">Visits this month:</span>{' '}
                    <span className="text-emerald-600 font-bold">
                      {visitsLoading ? '...' : visitsThisMonth}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    {doctor.last_visit_at ? (
                      <>
                        <div className="text-sm font-medium text-slate-900">
                          Last visit: {getDaysSinceLastVisit(doctor.last_visit_at)} days ago
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDistanceToNow(parseISO(doctor.last_visit_at), {
                            addSuffix: true,
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-slate-500">No visits recorded yet</div>
                    )}
                  </div>
                </div>

                {doctor.last_visit_at && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <div className="text-sm text-slate-700">
                      <span className="font-medium">Last visited:</span>{' '}
                      {new Date(doctor.last_visit_at).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Recent Visit Logs
                </h4>

                {recentVisitsLoading ? (
                  <div className="text-center py-4">
                    <div className="text-slate-400 text-sm">Loading visit logs...</div>
                  </div>
                ) : latestVisits.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 text-sm">
                    No visit logs found for this doctor.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {latestVisits.map((visit) => (
                      <div key={visit.id} className="bg-white rounded-lg p-3 border border-slate-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-900">
                              {formatDate(visit.visit_date)}
                            </span>
                          </div>
                          {visit.outcome && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              visit.outcome === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                              visit.outcome === 'negative' ? 'bg-red-100 text-red-700' :
                              visit.outcome === 'follow_up_needed' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {visit.outcome}
                            </span>
                          )}
                        </div>
                        
                        {visit.notes && (
                          <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                            {visit.notes}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {visit.sales && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{visit.sales.full_name}</span>
                            </div>
                          )}
                          {visit.sales && visit.products_discussed && Array.isArray(visit.products_discussed) && visit.products_discussed.length > 0 && (
                            <span className="text-slate-400">•</span>
                          )}
                          {visit.products_discussed && Array.isArray(visit.products_discussed) && visit.products_discussed.length > 0 && (
                            <span>
                              {visit.products_discussed.length} product{visit.products_discussed.length > 1 ? 's' : ''} discussed
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
