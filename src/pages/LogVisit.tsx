// src/pages/LogVisit.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDoctorsBySales } from '../hooks/useDoctors';
import { useCreateVisit } from '../hooks/useVisits';
import { useProducts } from '../hooks/useProducts';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { parseVisitNote, ParsedVisitData } from '../lib/gemini';
import { Mic, MicOff, Sparkles, Save, AlertCircle, Loader2, X } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { VisitOutcome } from '../types/database';

export default function LogVisit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: doctors } = useDoctorsBySales(user?.id);
  const { data: products } = useProducts();
  const createVisit = useCreateVisit();

  const {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const [manualText, setManualText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedVisitData | null>(null);
  const [error, setError] = useState('');

  // Form states
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [outcome, setOutcome] = useState<VisitOutcome>('neutral');
  const [notes, setNotes] = useState('');
  const [productsDiscussed, setProductsDiscussed] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Sync transcript to manualText only when listening acts active
  useEffect(() => {
    if (transcript) {
      setManualText(transcript);
    }
  }, [transcript]);

  const handleToggleRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setManualText('');
      startListening();
    }
  };

  const handleAnalyze = async () => {
    if (!manualText.trim()) {
      setError('Vui lòng nhập hoặc ghi âm nội dung chuyến thăm');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const validProducts = products?.map((p) => p.name) || [];
      const data = await parseVisitNote(manualText, validProducts);
      setParsedData(data);

      // Smart Logic: Tự động match bác sĩ trong database
      const matchedDoctor = doctors?.find(
        (d) =>
          d.name.toLowerCase().includes(data.doctor_name.toLowerCase()) ||
          data.doctor_name.toLowerCase().includes(d.name.toLowerCase())
      );

      if (matchedDoctor) {
        setSelectedDoctorId(matchedDoctor.id);
      }

      setOutcome(data.outcome);
      setNotes(data.notes);
      setProductsDiscussed(data.products_discussed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể phân tích nội dung');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDoctorId) {
      setError('Vui lòng chọn bác sĩ');
      return;
    }

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await createVisit.mutateAsync({
        doctor_id: selectedDoctorId,
        sales_id: user.id,
        visit_date: new Date().toISOString(),
        outcome,
        notes: notes || undefined,
        products_discussed:
          productsDiscussed.length > 0 ? productsDiscussed : undefined,
      });

      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu báo cáo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleProduct = (productName: string) => {
    setProductsDiscussed((prev) =>
      prev.includes(productName)
        ? prev.filter((p) => p !== productName)
        : [...prev, productName]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4">
          <div className="h-16 flex items-center">
            <h1 className="text-xl font-bold text-slate-900">Báo cáo Chuyến thăm</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {!isSupported && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-800">
              Trình duyệt không hỗ trợ ghi âm. Vui lòng nhập tay.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Bước 1: Nội dung (Ghi âm/Nhập liệu)
          </h2>

          <div className="space-y-4">
            <div className="flex gap-3">
              {isSupported && (
                <button
                  onClick={handleToggleRecording}
                  className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-6 h-6 text-white" />
                  ) : (
                    <Mic className="w-6 h-6 text-white" />
                  )}
                </button>
              )}

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !manualText.trim()}
                className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 disabled:from-slate-300 disabled:to-slate-300 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Phân tích bằng AI
                  </>
                )}
              </button>
            </div>

            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Ví dụ: Nay gặp bs Nam ở bv Chợ Rẫy, ổng khen Aniosgel tốt..."
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none resize-none"
              rows={6}
            />
            
            <p className="text-xs text-slate-400 italic">
               *Mẹo: Dùng "bs" cho Bác sĩ, "bv" cho Bệnh viện. AI sẽ tự sửa lỗi chính tả.
            </p>

            {isListening && (
              <p className="text-sm text-red-500 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                Đang ghi âm... (Nói to, rõ ràng)
              </p>
            )}
          </div>
        </div>

        {parsedData && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Bước 2: Xem lại & Lưu
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Bác sĩ *
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  required
                >
                  <option value="">Chọn bác sĩ...</option>
                  {doctors?.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.hospital?.name}
                    </option>
                  ))}
                </select>
                {parsedData.doctor_name && !selectedDoctorId && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                    ✨ AI gợi ý: {parsedData.doctor_name} ({parsedData.hospital_name})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Kết quả *
                </label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value as VisitOutcome)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  required
                >
                  <option value="positive">Tích cực (Positive)</option>
                  <option value="neutral">Bình thường (Neutral)</option>
                  <option value="negative">Tiêu cực (Negative)</option>
                  <option value="follow_up_needed">Cần theo dõi (Follow-up)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sản phẩm quan tâm
                </label>
                <div className="border border-slate-300 rounded-xl p-3 space-y-2 max-h-64 overflow-y-auto bg-slate-50">
                  {products && products.length > 0 ? (
                    <>
                      {products.map((product) => (
                        <label
                          key={product.id}
                          className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={productsDiscussed.includes(product.name)}
                            onChange={() => handleToggleProduct(product.name)}
                            className="w-4 h-4 text-emerald-500 border-slate-300 rounded focus:ring-2 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-slate-700">
                            {product.name}
                          </span>
                        </label>
                      ))}
                      <label className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={productsDiscussed.includes('Other')}
                          onChange={() => handleToggleProduct('Other')}
                          className="w-4 h-4 text-emerald-500 border-slate-300 rounded focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-slate-700">Khác (Other)</span>
                      </label>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500 p-2">
                      Đang tải danh sách sản phẩm...
                    </p>
                  )}
                </div>
                
                {productsDiscussed.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {productsDiscussed.map((product) => (
                      <span
                        key={product}
                        className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full"
                      >
                        {product}
                        <button
                          onClick={() => handleToggleProduct(product)}
                          className="hover:text-emerald-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ghi chú (Đã được AI viết lại)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú chi tiết..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none resize-none bg-emerald-50/50"
                  rows={6}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving || !selectedDoctorId}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Lưu Báo Cáo
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}