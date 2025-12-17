import React, { useState, useEffect, useMemo } from 'react';
import { generateData } from '../services/mockDataService';
import { analyzeDataWithGemini } from '../services/geminiService';
import { AnalysisResult, AIInsight, DistrictStats, HouseholdStats } from '../types';
import { CompositionPieChart, DistrictCompositionChart } from './Charts';
import { AlertTriangle, TrendingUp, Truck, Leaf, RefreshCw, Trash2, BrainCircuit, Search, MapPin } from 'lucide-react';

const StatCard: React.FC<{ title: string; value: string; subtext?: string; icon: React.ReactNode; color: string }> = ({ title, value, subtext, icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${color} text-white`}>
      {icon}
    </div>
  </div>
);

const InsightCard: React.FC<{ insight: AIInsight }> = ({ insight }) => {
  const styles = {
    alert: 'bg-red-50 border-red-100 text-red-800',
    observation: 'bg-blue-50 border-blue-100 text-blue-800',
    recommendation: 'bg-green-50 border-green-100 text-green-800'
  };
  const icons = {
    alert: <AlertTriangle size={18} className="text-red-600" />,
    observation: <TrendingUp size={18} className="text-blue-600" />,
    recommendation: <BrainCircuit size={18} className="text-green-600" />
  };

  return (
    <div className={`p-4 rounded-lg border ${styles[insight.type]} mb-3`}>
      <div className="flex items-center gap-2 mb-2 font-semibold">
        {icons[insight.type]}
        <span>{insight.title}</span>
      </div>
      <p className="text-sm leading-relaxed opacity-90">{insight.content}</p>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'households'>('overview');
  const [filterDistrict, setFilterDistrict] = useState<string>('All');
  const [searchHousehold, setSearchHousehold] = useState('');

  // Initial Data Load
  useEffect(() => {
    const rawData = generateData();
    setData(rawData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AI Analysis Trigger
  useEffect(() => {
    if (data && process.env.API_KEY) {
      setLoadingInsights(true);
      analyzeDataWithGemini(data.districtStats)
        .then(setInsights)
        .finally(() => setLoadingInsights(false));
    }
  }, [data]);

  const filteredHouseholds = useMemo(() => {
    if (!data) return [];
    return data.householdStats.filter(h => {
      const matchDistrict = filterDistrict === 'All' || h.district === filterDistrict;
      const matchSearch = h.householdId.toLowerCase().includes(searchHousehold.toLowerCase());
      return matchDistrict && matchSearch;
    }).sort((a, b) => a.complianceScore - b.complianceScore); // Show worst compliance first
  }, [data, filterDistrict, searchHousehold]);

  if (!data) return <div className="flex items-center justify-center h-screen text-slate-400">Loading Smart City Data...</div>;

  const totalOrganic = data.districtStats.reduce((acc, d) => acc + d.weights.Organic, 0);
  const totalRecyclable = data.districtStats.reduce((acc, d) => acc + d.weights.Recyclable, 0);
  const totalResidual = data.districtStats.reduce((acc, d) => acc + d.weights.Residual, 0);
  const totalSystemWeight = totalOrganic + totalRecyclable + totalResidual;

  const pieData = [
    { name: 'Organic' as const, value: (totalOrganic / totalSystemWeight) * 100 },
    { name: 'Recyclable' as const, value: (totalRecyclable / totalSystemWeight) * 100 },
    { name: 'Residual' as const, value: (totalResidual / totalSystemWeight) * 100 },
  ];

  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Leaf className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Hanoi Waste Analytics</h1>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setSelectedView('overview')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedView === 'overview' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}
             >
               City Overview
             </button>
             <button 
                onClick={() => setSelectedView('households')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedView === 'households' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}
             >
               Household Monitor
             </button>
             <div className="h-6 w-px bg-slate-200 mx-2"></div>
             <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                IoT Stream Active
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Waste Collected" 
            value={`${(data.totalWeight / 1000).toFixed(1)} tons`} 
            subtext="Last 7 days"
            icon={<Truck className="w-6 h-6" />}
            color="bg-blue-500"
          />
          <StatCard 
            title="Avg Compliance Score" 
            value={`${data.averageCompliance.toFixed(1)}/100`} 
            subtext="Based on residual ratio"
            icon={<TrendingUp className="w-6 h-6" />}
            color={data.averageCompliance > 70 ? "bg-emerald-500" : "bg-amber-500"}
          />
          <StatCard 
            title="Recycling Rate" 
            value={`${((totalRecyclable / totalSystemWeight) * 100).toFixed(1)}%`} 
            subtext="Target: 30%"
            icon={<RefreshCw className="w-6 h-6" />}
            color="bg-cyan-500"
          />
          <StatCard 
            title="Flagged Households" 
            value={data.householdStats.filter(h => h.isFlagged).length.toString()} 
            subtext="High residual waste alert"
            icon={<AlertTriangle className="w-6 h-6" />}
            color="bg-red-500"
          />
        </div>

        {selectedView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Charts Area */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Composition Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-4">City-Wide Waste Composition</h2>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-full md:w-1/2">
                    <CompositionPieChart data={pieData} />
                  </div>
                  <div className="w-full md:w-1/2 space-y-4">
                     <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                           <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                             <span className="w-3 h-3 rounded-full bg-green-400"></span> Organic
                           </span>
                           <span className="text-slate-800 font-bold">{(totalOrganic).toFixed(0)} kg</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                           <div className="bg-green-400 h-full" style={{ width: `${pieData[0].value}%` }}></div>
                        </div>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                           <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                             <span className="w-3 h-3 rounded-full bg-blue-400"></span> Recyclable
                           </span>
                           <span className="text-slate-800 font-bold">{(totalRecyclable).toFixed(0)} kg</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                           <div className="bg-blue-400 h-full" style={{ width: `${pieData[1].value}%` }}></div>
                        </div>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                           <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                             <span className="w-3 h-3 rounded-full bg-red-400"></span> Residual
                           </span>
                           <span className="text-slate-800 font-bold">{(totalResidual).toFixed(0)} kg</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                           <div className="bg-red-400 h-full" style={{ width: `${pieData[2].value}%` }}></div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              {/* District Comparison */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-4">District Compliance Comparison</h2>
                <DistrictCompositionChart data={data.districtStats} />
              </div>

            </div>

            {/* Sidebar / AI Insights */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <BrainCircuit className="text-purple-600" />
                    AI Policy Insights
                  </h2>
                  {loadingInsights && <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>}
                </div>
                
                <div className="space-y-4">
                  {insights.length > 0 ? (
                    insights.map((insight, idx) => (
                      <InsightCard key={idx} insight={insight} />
                    ))
                  ) : (
                    !process.env.API_KEY ? (
                      <div className="text-center p-6 text-slate-400 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-sm">Gemini API Key missing.</p>
                        <p className="text-xs mt-2">Add API_KEY to .env to see AI insights.</p>
                      </div>
                    ) : (
                      <div className="text-center p-6 text-slate-400">
                        Initializing analysis model...
                      </div>
                    )
                  )}
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">District Alert Summary</h3>
                  {data.districtStats.map(d => (
                    <div key={d.name} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                      <span className="text-sm text-slate-600">{d.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400">
                          {d.flaggedHouseholdsCount} alerts
                        </span>
                        <div className={`w-2 h-2 rounded-full ${d.flaggedHouseholdsCount > 3 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'households' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-800">Household Monitor</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                   <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                      <input 
                        type="text" 
                        placeholder="Search ID..." 
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={searchHousehold}
                        onChange={(e) => setSearchHousehold(e.target.value)}
                      />
                   </div>
                   <select 
                      className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={filterDistrict}
                      onChange={(e) => setFilterDistrict(e.target.value)}
                   >
                      <option value="All">All Districts</option>
                      {data.districtStats.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                   </select>
                </div>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                   <tr>
                     <th className="px-6 py-3">Household ID</th>
                     <th className="px-6 py-3">District</th>
                     <th className="px-6 py-3 text-center">Compliance</th>
                     <th className="px-6 py-3 text-right">Organic %</th>
                     <th className="px-6 py-3 text-right">Recycle %</th>
                     <th className="px-6 py-3 text-right">Residual %</th>
                     <th className="px-6 py-3 text-center">Status</th>
                   </tr>
                 </thead>
                 <tbody>
                   {filteredHouseholds.map((h) => (
                     <tr key={h.householdId} className="border-b border-slate-100 hover:bg-slate-50">
                       <td className="px-6 py-4 font-medium text-slate-900">{h.householdId}</td>
                       <td className="px-6 py-4 flex items-center gap-2 text-slate-600">
                          <MapPin size={14} />
                          {h.district}
                       </td>
                       <td className="px-6 py-4 text-center">
                         <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                           h.complianceScore > 75 ? 'bg-green-100 text-green-700' :
                           h.complianceScore > 50 ? 'bg-yellow-100 text-yellow-700' :
                           'bg-red-100 text-red-700'
                         }`}>
                           {h.complianceScore.toFixed(0)}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-right">{h.composition.Organic.toFixed(1)}%</td>
                       <td className="px-6 py-4 text-right">{h.composition.Recyclable.toFixed(1)}%</td>
                       <td className="px-6 py-4 text-right font-medium text-slate-700">{h.composition.Residual.toFixed(1)}%</td>
                       <td className="px-6 py-4 text-center">
                          {h.isFlagged ? (
                             <span className="flex items-center justify-center gap-1 text-red-600 font-medium">
                                <AlertTriangle size={14} /> Flagged
                             </span>
                          ) : (
                             <span className="text-slate-400">-</span>
                          )}
                       </td>
                     </tr>
                   ))}
                   {filteredHouseholds.length === 0 && (
                     <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                           No households found matching your filters.
                        </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
             <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
                Showing {filteredHouseholds.length} records. Data is simulated for analytics prototyping.
             </div>
          </div>
        )}
      </main>
    </div>
  );
};
