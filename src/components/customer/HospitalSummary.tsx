import { useState } from 'react';
import { Loader2, FileText, AlertCircle, Sparkles, Activity, Calendar, Clock, User } from 'lucide-react';
import { useVisitsByHospital } from '../../hooks/useVisits';

interface HospitalSummaryProps {
  hospitalId: string;
}

export default function HospitalSummary({ hospitalId }: HospitalSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const { data: visits, isLoading: isLoadingLog } = useVisitsByHospital(hospitalId);
  const recentLogs = visits && visits.length > 0 ? visits.slice(0, 3) : [];

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setSummaryError(null);

    try {
      if (!visits || visits.length === 0) {
        throw new Error('No visit data available for this hospital');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hospital-summary`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hospitalId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || 'AI Service is currently unavailable';
        
        // Provide user-friendly message for rate limits
        if (errorMessage.includes('rate limit') || errorMessage.includes('Too Many Requests')) {
          throw new Error('The AI service is temporarily busy. Please wait a moment and try again.');
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSummary(data.summary || 'Summary generated successfully');
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-slate-700">AI Hospital Report</h3>
        </div>

        <div className="p-5">
          {!summary ? (
            <div className="text-center py-4">
              <p className="text-slate-500 text-sm mb-4">
                Generate a concise summary of all activities and status for this hospital.
              </p>

              {summaryError && (
                 <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4"/> {summaryError}
                 </div>
              )}

              {isLoadingLog ? (
                <div className="text-slate-400 text-sm">Loading visit data...</div>
              ) : !visits || visits.length === 0 ? (
                <div className="text-slate-400 text-sm mb-4">No visit data available to generate summary</div>
              ) : (
                <button
                  onClick={handleGenerateSummary}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing Data...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Generate Summary
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
               <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">
                    {summary}
                  </div>
                  <button
                    onClick={() => setSummary(null)}
                    className="text-xs text-emerald-600 hover:underline mt-3 font-medium"
                  >
                    Refresh / Generate New
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-500" />
            <h3 className="font-semibold text-slate-700">Latest Activity</h3>
          </div>
        </div>

        <div>
          {isLoadingLog ? (
            <div className="p-8 text-center">
               <Loader2 className="w-6 h-6 text-slate-300 animate-spin mx-auto mb-2" />
               <span className="text-slate-400 text-sm">Loading logs...</span>
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No visit logs found for this hospital.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 flex flex-col items-center justify-center bg-blue-50 border border-blue-100 text-blue-700 rounded-lg p-2 w-14 h-14">
                       <Calendar className="w-4 h-4 mb-0.5" />
                       <span className="text-xs font-bold">
                         {new Date(log.visit_date).getDate()}
                       </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-slate-900 text-sm">
                          Visit - {log.doctor?.name || 'Unknown Doctor'}
                        </h4>
                        <span className="flex items-center text-xs text-slate-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(log.visit_date)}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                        {log.notes || 'No notes available'}
                      </p>

                      <div className="flex items-center gap-3 text-xs">
                        {log.sales && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <User className="w-3 h-3" />
                            <span>{log.sales.full_name}</span>
                          </div>
                        )}
                        {log.outcome && (
                          <span className={`px-2 py-0.5 rounded-full ${
                            log.outcome === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                            log.outcome === 'negative' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {log.outcome}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
