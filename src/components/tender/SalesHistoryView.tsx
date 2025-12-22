import { useState, useMemo, useRef } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenderPermissions } from '../../hooks/useTenderPermissions';
import {
  useTenders,
  useUniqueCustomers,
  useUniqueManufacturers,
  useUniqueProducts,
  useTenderSearchQuota,
  useIncrementSearchQuota,
  useLogTenderSearch,
} from '../../hooks/useTenders';

export default function SalesHistoryView() {
  const { user } = useAuth();
  const permissions = useTenderPermissions();
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [manufacturerSearch, setManufacturerSearch] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const lastSearchRef = useRef<string>('');

  const { data: quota, refetch: refetchQuota } = useTenderSearchQuota(user?.id);
  const { data: customers } = useUniqueCustomers();
  const { data: manufacturers } = useUniqueManufacturers();
  const { data: products } = useUniqueProducts();
  const incrementQuota = useIncrementSearchQuota();
  const logSearch = useLogTenderSearch();

  const filters = useMemo(() => {
    // Only apply filters after search button is clicked
    if (!hasSearched) return undefined;
    return {
      customerName: selectedCustomer || undefined,
      manufacturer: selectedManufacturer || undefined,
      productKeyword: selectedProduct || undefined,
    };
  }, [selectedCustomer, selectedManufacturer, selectedProduct, hasSearched]);

  const { data: tenders, isLoading, refetch } = useTenders(filters);

  const filteredCustomers = useMemo(() => {
    if (!customers || !customerSearch) return [];
    return customers
      .filter((c) => c.toLowerCase().includes(customerSearch.toLowerCase()))
      .slice(0, 10);
  }, [customers, customerSearch]);

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

  const totalValue = useMemo(() => {
    if (!tenders) return 0;
    return tenders.reduce((sum, t) => sum + t.winning_value, 0);
  }, [tenders]);

  const quotaExceeded =
    permissions.hasSearchQuota && quota && quota.searches_used >= quota.searches_limit;

  const handleSearch = async () => {
    // Check quota BEFORE incrementing
    if (quotaExceeded) {
      alert('Daily search quota exceeded. Please contact admin for reset.');
      return;
    }

    // Create a unique key for this search to prevent duplicate logs
    const searchKey = `${selectedCustomer || ''}-${selectedManufacturer || ''}-${selectedProduct || ''}`;
    
    // Set hasSearched first so filters are applied
    setHasSearched(true);

    // Increment quota and check if it exceeds limit AFTER incrementing
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

    // Refetch with new filters and wait for results (only if quota check passed)
    const { data: freshTenders } = await refetch();
    
    // Log the search with fresh results (only log if it's a new search to avoid duplicate logs)
    if (user?.id && lastSearchRef.current !== searchKey) {
      lastSearchRef.current = searchKey;
      try {
        await logSearch.mutateAsync({
          user_id: user.id,
          customer_filter: selectedCustomer || undefined,
          manufacturer_filter: selectedManufacturer || undefined,
          product_filter: selectedProduct || undefined,
          results_count: freshTenders?.length || 0,
        });
      } catch (error: any) {
        // Log error but don't block the search
        console.error('Failed to log search:', error);
      }
    }
  };

  const toggleCardExpansion = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatValue = (value: number) => {
    return (value / 1_000_000_000).toFixed(2);
  };

  const getUnitLabel = (capacity: number) => {
    return capacity <= 2000 ? 'Chai' : 'Can';
  };

  return (
    <div className="space-y-6">
      {permissions.hasSearchQuota && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Daily Search Quota</p>
              <p className="text-2xl font-bold text-slate-900">
                {quota?.searches_used || 0} / {quota?.searches_limit || 10}
              </p>
            </div>
            {quotaExceeded && (
              <AlertCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
          {quotaExceeded && (
            <p className="mt-2 text-sm text-red-600 font-medium">
              Daily quota exceeded. Contact admin for reset.
            </p>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Customer Name
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer..."
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setSelectedCustomer('');
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {customerSearch && filteredCustomers.length > 0 && (
            <div className="mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredCustomers.map((customer, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setCustomerSearch(customer);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm text-slate-700 border-b border-slate-100 last:border-b-0"
                >
                  {customer}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <button
          onClick={handleSearch}
          disabled={quotaExceeded || isLoading}
          className="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
        >
          <Search className="w-5 h-5 inline mr-2" />
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {hasSearched && (
        <>
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-sm p-6 text-white">
            <p className="text-sm font-medium mb-1 opacity-90">Total Value</p>
            <p className="text-4xl font-bold">{formatValue(totalValue)} Tỷ</p>
            <p className="text-sm mt-2 opacity-90">
              {tenders?.length || 0} results found
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-pulse" />
              <p className="text-slate-500">Loading results...</p>
            </div>
          ) : tenders && tenders.length > 0 ? (
            <div className="space-y-4">
              {tenders.map((tender) => {
                const isExpanded = expandedCards.has(tender.id);
                return (
                  <div
                    key={tender.id}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"
                  >
                    <div className="mb-3">
                      <h3 className="font-bold text-slate-900 text-lg mb-1">
                        {tender.customer_name}
                      </h3>
                      <p className="text-xs text-slate-600 mb-2">
                        {tender.tender_package_name}
                      </p>
                      <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                        {formatValue(tender.winning_value)} Tỷ
                      </div>
                    </div>

                    <p className="text-slate-700 mb-2 font-medium">
                      {tender.product_name}
                    </p>

                    <div className="bg-slate-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-slate-600 mb-1">
                        <span className="font-semibold">Winning Bidder:</span>{' '}
                        {tender.winning_company}
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center mb-3">
                      <div className="bg-blue-50 rounded-lg p-2">
                        <p className="text-xs text-slate-600 mb-1">Brand</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {tender.manufacturer}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <p className="text-xs text-slate-600 mb-1">Capacity</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {tender.capacity}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <p className="text-xs text-slate-600 mb-1">Unit Price</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {tender.unit_price.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <p className="text-xs text-slate-600 mb-1">Qty</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {tender.winning_quantity} {getUnitLabel(tender.capacity)}
                        </p>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-200 pt-3 space-y-2">
                        {tender.winning_config && (
                          <div>
                            <p className="text-xs text-slate-600 mb-1">Configuration</p>
                            <p className="text-sm text-slate-900">{tender.winning_config}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-slate-600 mb-1">Time</p>
                          <p className="text-sm text-slate-900">
                            {tender.month}/{tender.year}
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => toggleCardExpansion(tender.id)}
                      className="w-full mt-2 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4 inline mr-1" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 inline mr-1" />
                          Show Details
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
              <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No results found</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
