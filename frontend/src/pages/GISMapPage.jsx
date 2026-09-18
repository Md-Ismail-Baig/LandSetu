import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getParcels, getParcelMap } from '../services/api';
import ParcelMap from '../components/ParcelMap';
import { Layers, MapPin, Search, ArrowRight, ExternalLink, ShieldCheck, Database } from 'lucide-react';

export default function GISMapPage() {
  const navigate = useNavigate();
  const [parcels, setParcels] = useState([]);
  const [selectedUlpin, setSelectedUlpin] = useState('KA0102030405');
  const [currentGeoJson, setCurrentGeoJson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllParcels = async () => {
      try {
        const res = await getParcels();
        setParcels(res.parcels || []);
      } catch (err) {
        console.error('Failed to load parcels:', err);
      }
    };
    fetchAllParcels();
  }, []);

  useEffect(() => {
    const fetchMapForUlpin = async () => {
      if (!selectedUlpin) return;
      setLoading(true);
      try {
        const geo = await getParcelMap(selectedUlpin);
        setCurrentGeoJson(geo);
      } catch (err) {
        console.error('Failed to load geojson:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMapForUlpin();
  }, [selectedUlpin]);

  const activeParcel = parcels.find((p) => p.ulpin === selectedUlpin) || parcels[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <Layers className="h-4 w-4" />
            <span>Cadastral GIS Map Explorer</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">
            Spatial Land Demarcation & Boundary Layer
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Interactive OpenStreetMap & Cadastral polygon overlay anchored to 14-digit ULPIN coordinates.
          </p>
        </div>

        {activeParcel && (
          <button
            onClick={() => navigate(`/search?ulpin=${activeParcel.ulpin}`)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5 shrink-0"
          >
            <span>Open Integrated View</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Main Map View & Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Parcel Selector List */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Cadastral Parcels ({parcels.length})
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-semibold">
              Karnataka Grid
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[480px]">
            {parcels.map((p) => {
              const isSelected = p.ulpin === selectedUlpin;
              return (
                <div
                  key={p.ulpin}
                  onClick={() => setSelectedUlpin(p.ulpin)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{p.ulpin}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                      Sy: {p.survey_number}
                    </span>
                  </div>
                  <div className="text-slate-800 font-semibold mt-1">{p.owner_name}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5 flex items-center space-x-1">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span>{p.village}, {p.district}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 pt-1.5 border-t border-slate-200/60">
                    <span>{p.area_hectares} Hectares</span>
                    <span className="font-medium text-emerald-700">{p.land_type}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Leaflet Interactive GIS Map */}
        <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <ParcelMap
            geoJson={currentGeoJson}
            ulpin={selectedUlpin}
            parcel={activeParcel}
          />
        </div>
      </div>
    </div>
  );
}
