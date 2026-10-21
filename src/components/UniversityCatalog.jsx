import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { UNIVERSITIES, REGIONS, FACULTIES } from '../data/universities';
import { 
  Building2, 
  MapPin, 
  Award, 
  Star, 
  GraduationCap, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  Filter,
  DollarSign
} from 'lucide-react';

export default function UniversityCatalog({ searchQuery, selectedRegion, setSelectedRegion }) {
  const { setSelectedUniversity, setSelectedProgram, setIsApplyModalOpen } = useApp();
  const [selectedFaculty, setSelectedFaculty] = useState('Barchasi');
  const [sortBy, setSortBy] = useState('ranking'); // 'ranking' | 'fee-asc' | 'fee-desc'

  const filteredUniversities = useMemo(() => {
    return UNIVERSITIES.filter(uni => {
      // Region filter
      if (selectedRegion !== 'Barchasi' && uni.region !== selectedRegion) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = uni.name.toLowerCase().includes(q) || uni.fullName.toLowerCase().includes(q);
        const matchesProgram = uni.programs.some(p => p.name.toLowerCase().includes(q));
        const matchesRegion = uni.region.toLowerCase().includes(q);
        if (!matchesName && !matchesProgram && !matchesRegion) return false;
      }
      // Faculty filter
      if (selectedFaculty !== 'Barchasi') {
        const matchesFaculty = uni.programs.some(p => {
          if (selectedFaculty.includes("IT") && (p.name.includes("Dasturiy") || p.name.includes("Axborot") || p.name.includes("Computer") || p.name.includes("intellekt"))) return true;
          if (selectedFaculty.includes("Iqtisodiyot") && (p.name.includes("moliya") || p.name.includes("Bank") || p.name.includes("Finance") || p.name.includes("Iqtisodiyot"))) return true;
          if (selectedFaculty.includes("Pedagogika") && (p.name.includes("ta'lim") || p.name.includes("Ingliz") || p.name.includes("filologiya"))) return true;
          if (selectedFaculty.includes("Tibbiyot") && (p.name.includes("Davolash") || p.name.includes("Stomatologiya") || p.name.includes("Farmatsiya"))) return true;
          if (selectedFaculty.includes("Biznes") && (p.name.includes("biznes") || p.name.includes("menejment") || p.name.includes("turizm") || p.name.includes("Marketing") || p.name.includes("Entrepreneurship"))) return true;
          return false;
        });
        if (!matchesFaculty) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'ranking') return a.ranking.localRank - b.ranking.localRank;
      if (sortBy === 'fee-asc') return a.tuitionFeeMin - b.tuitionFeeMin;
      if (sortBy === 'fee-desc') return b.tuitionFeeMin - a.tuitionFeeMin;
      return 0;
    });
  }, [selectedRegion, searchQuery, selectedFaculty, sortBy]);

  const handleApplyClick = (uni, program = null) => {
    setSelectedUniversity(uni);
    setSelectedProgram(program || uni.programs[0]);
    setIsApplyModalOpen(true);
  };

  const handleDetailClick = (uni) => {
    setSelectedUniversity(uni);
  };

  return (
    <section id="catalog-section" className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Filters Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Akkreditatsiyadan o'tgan Nodavlat OTMlar</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {filteredUniversities.length} ta mavjud
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            QS va O'zbekiston milliy reytingidagi rasmiy litsenziyaga ega OTMlar ro'yxati
          </p>
        </div>

        {/* Sort and Major Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-xs">
            <span className="text-slate-500 font-medium">Saralash:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ranking">Reyting bo'yicha (Top 1-10)</option>
              <option value="fee-asc">Kontrakt: Arzondan qimmatga</option>
              <option value="fee-desc">Kontrakt: Qimmatdan arzonga</option>
            </select>
          </div>
        </div>
      </div>

      {/* Region Badges Filter */}
      <div className="flex items-center space-x-2 overflow-x-auto py-4">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2 hidden sm:inline">
          Hudud:
        </span>
        {REGIONS.map(region => (
          <button
            key={region}
            onClick={() => setSelectedRegion(region)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedRegion === region
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-102'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {region}
          </button>
        ))}
      </div>

      {/* University Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {filteredUniversities.map(uni => (
          <div
            key={uni.id}
            className="group bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative"
          >
            {/* Top Cover Image */}
            <div className="relative h-44 w-full overflow-hidden bg-slate-100">
              <img
                src={uni.coverImage}
                alt={uni.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
              
              {/* Ranking Badge */}
              <div className="absolute top-3 left-3 flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur text-slate-900 text-xs font-bold shadow-md">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>#{uni.ranking.localRank} Reyting</span>
              </div>

              {/* QS Stars */}
              <div className="absolute top-3 right-3 flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-xs font-bold shadow-md">
                <Star className="w-3 h-3 fill-current" />
                <span>{uni.ranking.qsStars} Yulduz</span>
              </div>

              {/* University Title over Cover */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="text-[11px] font-medium text-indigo-200 uppercase tracking-wider block">
                  {uni.region} viloyati
                </span>
                <h3 className="text-lg font-bold leading-snug line-clamp-1">{uni.name}</h3>
              </div>
            </div>

            {/* Body Info */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                  {uni.shortDescription}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium uppercase">Yillik Kontrakt</span>
                    <span className="font-bold text-slate-800">
                      {(uni.tuitionFeeMin / 1000000).toFixed(1)} - {(uni.tuitionFeeMax / 1000000).toFixed(1)} mln so'm
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium uppercase">Grant Imkoniyati</span>
                    <span className="font-bold text-emerald-600 line-clamp-1">
                      {uni.grantOpportunity}
                    </span>
                  </div>
                </div>

                {/* Programs Previews */}
                <div className="mb-4">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Asosiy Yo'nalishlar ({uni.programs.length}):
                  </span>
                  <div className="space-y-1.5">
                    {uni.programs.slice(0, 3).map(prog => (
                      <div
                        key={prog.id}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50/70 hover:bg-indigo-50/50 transition-colors"
                      >
                        <span className="font-medium text-slate-700 line-clamp-1">
                          {prog.name}
                        </span>
                        <span className="text-slate-400 text-[11px] font-semibold whitespace-nowrap ml-2">
                          {(prog.tuition / 1000000).toFixed(1)} mln
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center space-x-2">
                <button
                  onClick={() => handleDetailClick(uni)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors text-center"
                >
                  Batafsil
                </button>

                <button
                  onClick={() => handleApplyClick(uni)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-100 flex items-center justify-center space-x-1.5 transition-all"
                >
                  <span>1-Klikda topshirish</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        ))}
      </div>

    </section>
  );
}
