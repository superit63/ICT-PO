import { useState } from 'react';
import { useHospitals } from '../hooks/useHospitals';
import { useDoctorsByHospital } from '../hooks/useDoctors';
import { Building2, Users, FileText, ChevronRight, X, Phone, Mail, Briefcase, Stethoscope, Plus } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import DoctorDetailModal from '../components/customer/DoctorDetailModal';
import HospitalSummary from '../components/customer/HospitalSummary';
import AddDoctorModal from '../components/customer/AddDoctorModal';

type TabType = 'doctors' | 'summary';

export default function Customers() {
  const { data: hospitals, isLoading: hospitalsLoading } = useHospitals();
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('doctors');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [showAddDoctor, setShowAddDoctor] = useState(false);

  // Hook handles data fetching based on ID
  const { data: doctors, isLoading: doctorsLoading } = useDoctorsByHospital(selectedHospitalId || undefined);

  const selectedHospital = hospitals?.find(h => h.id === selectedHospitalId);

  // --- Helper Functions with Safety Checks ---
  const getDoctorRoleLabel = (role: string | null | undefined) => {
    if (!role) return 'Bác Sĩ'; 
    const roleMap: Record<string, string> = {
      trưởng_khoa: 'Trưởng Khoa',
      phó_khoa: 'Phó Khoa',
      bác_sĩ: 'Bác Sĩ',
      điều_dưỡng: 'Điều Dưỡng',
      kỹ_sư: 'Kỹ Sư',
    };
    return roleMap[role] || role;
  };

  const getRoleIcon = (role: string | null | undefined) => {
    if (!role) return <Stethoscope className="w-4 h-4" />;
    if (role.includes('trưởng') || role.includes('phó')) {
      return <Briefcase className="w-4 h-4" />;
    }
    return <Stethoscope className="w-4 h-4" />;
  };

  // --- VIEW 1: Hospital List ---
  if (!selectedHospitalId) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-lg mx-auto px-4">
            <div className="h-16 flex items-center">
              <h1 className="text-xl font-bold text-slate-900">Customers</h1>
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-2">Select a Hospital</h2>
            <p className="text-sm text-slate-500">Choose a hospital to view customers and summaries</p>
          </div>

          {hospitalsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-400">Loading hospitals...</div>
            </div>
          ) : !hospitals || hospitals.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <p className="text-slate-500">No hospitals available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hospitals.map((hospital) => (
                <button
                  key={hospital.id}
                  onClick={() => setSelectedHospitalId(hospital.id)}
                  className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:border-emerald-300 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-slate-900 truncate">
                          {hospital.name}
                        </h3>
                        <p className="text-sm text-slate-500 truncate">
                          {hospital.city}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>

        {/* Floating Add Doctor Button */}
        <button
          onClick={() => setShowAddDoctor(true)}
          className="fixed bottom-24 right-4 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-30"
          aria-label="Add Doctor"
        >
          <Plus className="w-6 h-6" />
        </button>

        {showAddDoctor && (
          <AddDoctorModal
            onClose={() => setShowAddDoctor(false)}
          />
        )}

        <BottomNav />
      </div>
    );
  }

  // --- VIEW 2: Detail View (Tabs) ---
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4">
          <div className="h-16 flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedHospitalId(null);
                setActiveTab('doctors');
              }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-slate-900 truncate">
                {selectedHospital?.name || 'Hospital Details'}
              </h1>
              <p className="text-xs text-slate-500">{selectedHospital?.city}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('doctors')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-medium transition-all ${
                activeTab === 'doctors'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Doctors</span>
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-medium transition-all ${
                activeTab === 'summary'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Summary</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-6">
        {activeTab === 'doctors' && (
          <>
            {doctorsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-400">Loading doctors...</div>
              </div>
            ) : !doctors || doctors.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                <p className="text-slate-500">No doctors in this hospital</p>
              </div>
            ) : (
              <div className="space-y-3">
                {doctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    onClick={() => setSelectedDoctorId(doctor.id)}
                    className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:border-emerald-300 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-slate-900 mb-1">
                          {doctor.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          {getRoleIcon(doctor.doctor_role)}
                          <span>{getDoctorRoleLabel(doctor.doctor_role)}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {doctor.department && (
                        <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                          <Building2 className="w-3 h-3" />
                          {doctor.department}
                        </span>
                      )}
                      {doctor.phone && (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                          <Phone className="w-3 h-3" />
                          Available
                        </span>
                      )}
                      {doctor.email && (
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                          <Mail className="w-3 h-3" />
                          Email
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'summary' && selectedHospitalId && (
          <HospitalSummary hospitalId={selectedHospitalId} />
        )}
      </main>

      {selectedDoctorId && (
        <DoctorDetailModal
          doctorId={selectedDoctorId}
          onClose={() => setSelectedDoctorId(null)}
        />
      )}

      {showAddDoctor && (
        <AddDoctorModal
          hospitalId={selectedHospitalId || undefined}
          onClose={() => setShowAddDoctor(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}