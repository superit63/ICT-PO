import { useMemo, useState, useRef } from 'react';
import { TrendingUp, ChevronDown, ChevronUp, Search, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenderPermissions } from '../../hooks/useTenderPermissions';
import {
  useTenders,
  useUniqueManufacturers,
  useUniqueProducts,
  useUniqueCapacities,
  useTenderSearchQuota,
  useIncrementSearchQuota,
  useLogTenderSearch,
} from '../../hooks/useTenders';

interface ProductPriceStats {
  productKey: string; // productName + capacity
  productName: string;
  capacity: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  medianPrice: number;
  count: number;
  tenderIds: string[];
}

export default function PriceAnalysisView() {
  const { user } = useAuth();
  const permissions = useTenderPermissions();
  const [manufacturerSearch, setManufacturerSearch] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState<number | ''>('');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Ref helps track previous searches, but we won't let it block execution anymore
  const lastSearchRef = useRef<string>('');

  const { data: quota, refetch: refetchQuota } = useTenderSearchQuota(user?.id);
  const { data: manufacturers } = useUniqueManufacturers();
  const { data: products } = useUniqueProducts();
  const { data: capacities } = useUniqueCapacities(selectedProduct || undefined);
  const incrementQuota = useIncrementSearchQuota();
  const logSearch = useLogTenderSearch();

  const filters = useMemo(() => {
    const hasFilters = selectedManufacturer || selectedProduct || selectedCapacity;
    if (!hasFilters && !hasSearched) return undefined;
    return {
      manufacturer: selectedManufacturer || undefined,
      productKeyword: selectedProduct || undefined,
      capacity: selectedCapacity !== '' ? selectedCapacity as number : undefined,
    };
  }, [selectedManufacturer, selectedProduct, selectedCapacity, hasSearched]);

  const { data: tenders, isLoading, refetch } = useTenders(filters);

  const filteredManufacturers = useMemo(() => {
    if (!manufacturers || !manufacturerSearch) return [];
    return manufacturers
      .filter((m) => m.toLowerCase().includes(manufacturerSearch.toLowerCase()))
      .slice(0, 10);
  }, [manufacturers, manufacturerSearch]);

  const filteredProducts = useMemo(() => {
    if (!products || !productSearch) return [];
    return products
      .filter((p) => p.toLowerCase().includes(productSearch.toLowerCase()))
      .slice(0, 10);
  }, [products, productSearch]);

  const priceStats = useMemo(() => {
    if (!tenders) return [];

    // Group by product name AND capacity
    const groupedByProductAndCapacity = tenders.reduce((acc, tender) => {
      const key = `${tender.product_name}_${tender.capacity}`;
      if (!acc[key]) {
        acc[key] = {
          productName: tender.product_name,
          capacity: tender.capacity,
          prices: [],
          tenderIds: [],
        };
      }
      // Store original prices
      acc[key].prices.push(tender.unit_price);
      acc[key].tenderIds.push(tender.id);
      return acc;
    }, {} as Record<string, { productName: string; capacity: number; prices: number[]; tenderIds: string[] }>);

    const stats: ProductPriceStats[] = Object.entries(groupedByProductAndCapacity)
      .map(([key, data]) => {
        // Filter out invalid data (zero or negative prices)
        const validPrices = data.prices.filter((price) => price > 0);

        if (validPrices.length === 0) return null;

        const sortedPrices = [...validPrices].sort((a, b) => a - b);
        const sum = sortedPrices.reduce((s, p) => s + p, 0);
        const median =
          sortedPrices.length % 2 === 0
            ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
            : sortedPrices[Math.floor(sortedPrices.length / 2)];

        return {
          productKey: key,
          productName: data.productName,
          capacity: data.capacity,
          minPrice: Math.min(...validPrices),
          maxPrice: Math.max(...validPrices),
          avgPrice: sum / validPrices.length,
          medianPrice: median,
          count: validPrices.length,
          tenderIds: data.tenderIds,
        };
      })
      .filter((stat): stat is ProductPriceStats => stat !== null);

    return stats.sort((a, b) => b.count - a.count);
  }, [tenders]);

  const getRelatedTenders = (productKey: string) => {
    if (!tenders) return [];
    const stats = priceStats.find((s) => s.productKey === productKey);
    if (!stats) return [];
    
    // Filter tenders for this specific product AND capacity
    const productCapacityTenders = tenders.filter(
      (t) => stats.tenderIds.includes(t.id) && t.capacity === stats.capacity
    );
    
    if (productCapacityTenders.length === 0) return [];
    
    // Get 3 most recent tenders
    const recentTenders = [...productCapacityTenders]
      .sort((a, b) => b.year - a.year || b.month - a.month)
      .slice(0, 3)
      .map((tender) => ({ tender, type: 'recent' as const }));
    
    // Get tender with max price (for this product+capacity)
    const maxPriceTender = productCapacityTenders.reduce((max, tender) => 
      tender.unit_price > max.unit_price ? tender : max
    );
    
    // Get tender with min price (for this product+capacity)
    const minPriceTender = productCapacityTenders.reduce((min, tender) => 
      tender.unit_price < min.unit_price ? tender : min
    );
    
    // Combine: 3 recent + 1 max + 1 min, then remove duplicates by id
    const allTenders = [
      ...recentTenders,
      { tender: maxPriceTender, type: 'max' as const },
      { tender: minPriceTender, type: 'min' as const },
    ];
    
    const uniqueMap = new Map();
    allTenders.forEach((item) => {
      if (!uniqueMap.has(item.tender.id)) {
        uniqueMap.set(item.tender.id, item);
      } else {
        // If already exists, preserve the type if it's max or min
        const existing = uniqueMap.get(item.tender.id);
        if (item.type === 'max' || item.type === 'min') {
          uniqueMap.set(item.tender.id, item);
        }
      }
    });
    
    // Ensure we have exactly 5 tenders: prioritize max/min, then fill with recent
    const result = Array.from(uniqueMap.values());
    
    // If we have less than 5, add more recent ones (excluding already included ones)
    if (result.length < 5) {
      const includedIds = new Set(result.map((item) => item.tender.id));
      const additionalRecent = productCapacityTenders
        .filter((t) => !includedIds.has(t.id))
        .sort((a, b) => b.year - a.year || b.month - a.month)
        .slice(0, 5 - result.length)
        .map((tender) => ({ tender, type: 'recent' as const }));
      result.push(...additionalRecent);
    }
    
    // Limit to 5 tenders total
    return result.slice(0, 5);
  };

  const getUnitLabel = (capacity: number) => {
    return capacity <= 2000 ? 'Chai' : 'Can';
  };

  const formatValue = (value: number) => {
    return (value / 1_000_000_000).toFixed(2);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN');
  };

  const getPricePercentage = (price: number, min: number, max: number) => {
    if (max === min) return 50;
    return ((price - min) / (max - min)) * 100;
  };

  const quotaExceeded =
    permissions.hasSearchQuota && quota && quota.searches_used >= quota.searches_limit;

  // --- FIXED HANDLE SEARCH FUNCTION ---
  const handleSearch = async () => {
    // 1. Check if quota is ALREADY exceeded before starting
    if (quotaExceeded) {
      alert('Daily search quota exceeded. Please contact admin for reset.');
      return;
    }

    // Create a unique key for this search
    const searchKey = `${selectedManufacturer || ''}-${selectedProduct || ''}-${selectedCapacity || ''}`;
    
    // Set hasSearched so filters are applied
    setHasSearched(true);

    // 2. Increment quota and check if it exceeds limit AFTER incrementing
    if (permissions.hasSearchQuota && user?.id) {
      try {
        // Increment the quota - this will create a record if it doesn't exist
        const updatedQuotaData = await incrementQuota.mutateAsync(user.id);
        
        // The mutation's onSuccess already invalidates the query, but we refetch to get fresh data
        const { data: updatedQuota } = await refetchQuota();
        
        // Use the data from mutation if refetch didn't return it yet
        const finalQuota = updatedQuota || updatedQuotaData;
        
        // Check if quota is NOW exceeded after incrementing
        // Use > (not >=) because if searches_used equals limit, that's the last allowed search
        if (finalQuota && finalQuota.searches_used > finalQuota.searches_limit) {
          alert('Daily search quota exceeded. Please contact admin for reset.');
          return;
        }
        
      } catch (error: any) {
        // Log the detailed error for debugging
        console.error('Failed to increment quota:', error);
        console.error('Error details:', {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
        });
        
        // Show more informative error message
        const errorMessage = error?.message || 'Unknown error';
        alert(`Failed to update search quota: ${errorMessage}. Please check console for details or contact admin.`);
        return;
      }
    }

    // 3. Fetch data (only if quota check passed)
    const { data: freshTenders } = await refetch();
    
    // 4. Log the search history
    if (user?.id) {
      lastSearchRef.current = searchKey;
      await logSearch.mutateAsync({
        user_id: user.id,
        manufacturer_filter: selectedManufacturer || undefined,
        product_filter: selectedProduct || undefined,
        results_count: freshTenders?.length || 0,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Price Analysis</h2>
        <p className="text-sm text-slate-600">
          Search by manufacturer and/or product name
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        {permissions.hasSearchQuota && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Daily Search Quota</p>
                <p className="text-lg font-semibold text-blue-600">
                  {quota?.searches_used || 0} / {quota?.searches_limit || 10}
                </p>
              </div>
            </div>
            {quotaExceeded && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Daily quota exceeded. Contact admin for reset.</span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Manufacturer
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search manufacturer..."
                value={manufacturerSearch}
                onChange={(e) => {
                  setManufacturerSearch(e.target.value);
                  setSelectedManufacturer('');
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {manufacturerSearch && filteredManufacturers.length > 0 && (
              <div className="mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredManufacturers.map((manufacturer, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedManufacturer(manufacturer);
                      setManufacturerSearch(manufacturer);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm text-slate-700 border-b border-slate-100 last:border-b-0"
                  >
                    {manufacturer}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Product Name
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search product..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setSelectedProduct('');
                  setSelectedCapacity(''); // Reset capacity when product changes
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {productSearch && filteredProducts.length > 0 && (
              <div className="mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.map((product, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedProduct(product);
                      setProductSearch(product);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm text-slate-700 border-b border-slate-100 last:border-b-0"
                  >
                    {product}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Capacity (ml)
            </label>
            <select
              value={selectedCapacity}
              onChange={(e) => setSelectedCapacity(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={!selectedProduct}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              <option value="">All</option>
              {capacities?.map((cap, idx) => (
                <option key={idx} value={cap}>
                  {cap} ml
                </option>
              ))}
            </select>
            {!selectedProduct && (
              <p className="text-xs text-slate-500 mt-1">Select a product first</p>
            )}
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={quotaExceeded || isLoading}
          className="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          <Search className="w-5 h-5 inline mr-2" />
          Search
        </button>
      </div>

      {hasSearched && (!tenders || tenders.length === 0) ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No tender data available for analysis</p>
        </div>
      ) : hasSearched && priceStats.length > 0 ? (
        priceStats.map((stats) => {
          const isExpanded = expandedProduct === stats.productKey;
          const minPercent = 0;
          const avgPercent = getPricePercentage(stats.avgPrice, stats.minPrice, stats.maxPrice);
          const medianPercent = getPricePercentage(stats.medianPrice, stats.minPrice, stats.maxPrice);
          const maxPercent = 100;

          return (
            <div
              key={stats.productKey}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"
            >
              <div className="mb-4">
                <h3 className="font-bold text-slate-900 mb-1">{stats.productName}</h3>
                <p className="text-sm text-slate-600">
                  Capacity: {Math.round(stats.capacity)}
                  <span className="text-xs ml-1">ml</span> | {stats.count} tenders
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Analysis for {Math.round(stats.capacity)}ml capacity
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-1">Min Price</p>
                    <p className="text-lg font-bold text-red-600">
                      {formatPrice(stats.minPrice)}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-1">Max Price</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {formatPrice(stats.maxPrice)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-1">Average</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatPrice(Math.ceil(stats.avgPrice))}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-1">Median</p>
                    <p className="text-lg font-bold text-amber-600">
                      {formatPrice(stats.medianPrice)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-slate-600 mb-2 font-medium">Price Range</p>
                <div className="relative h-8 bg-gradient-to-r from-red-200 via-amber-200 to-emerald-200 rounded-full overflow-hidden">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-1 h-full bg-red-600"
                    style={{ left: `${minPercent}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-red-600 whitespace-nowrap">
                      Min
                    </div>
                  </div>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-1 h-full bg-blue-600"
                    style={{ left: `${avgPercent}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-blue-600 whitespace-nowrap">
                      Avg
                    </div>
                  </div>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-1 h-full bg-amber-600"
                    style={{ left: `${medianPercent}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-amber-600 whitespace-nowrap">
                      Med
                    </div>
                  </div>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-1 h-full bg-emerald-600"
                    style={{ left: `${maxPercent}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-emerald-600 whitespace-nowrap">
                      Max
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  setExpandedProduct(isExpanded ? null : stats.productKey)
                }
                className="w-full py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 inline mr-1" />
                    Hide Tender Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 inline mr-1" />
                    Show Tender Details
                  </>
                )}
              </button>

              {isExpanded && (
                <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                  {getRelatedTenders(stats.productKey).map((item) => {
                    const { tender, type } = item;
                    const getTypeLabel = () => {
                      if (type === 'max') return { text: 'Max Price', color: 'bg-emerald-100 text-emerald-700' };
                      if (type === 'min') return { text: 'Min Price', color: 'bg-red-100 text-red-700' };
                      return null;
                    };
                    const typeLabel = getTypeLabel();
                    
                    return (
                      <div
                        key={tender.id}
                        className="bg-slate-50 rounded-lg p-3 text-sm"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">
                              {tender.customer_name}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {tender.tender_package_name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            {typeLabel && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeLabel.color}`}>
                                {typeLabel.text}
                              </span>
                            )}
                            <p className="text-xs text-slate-600 whitespace-nowrap">
                              {tender.month}/{tender.year}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <p className="text-slate-600">
                              {tender.winning_company}
                            </p>
                            <p className="font-bold text-blue-600">
                              {formatPrice(tender.unit_price)}
                            </p>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <p className="text-slate-500">
                              Quantity: {tender.winning_quantity} {getUnitLabel(tender.capacity)}
                            </p>
                            <p className="text-slate-500 font-medium">
                              Value: {formatValue(tender.winning_value)} Tỷ
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      ) : null}
    </div>
  );
}