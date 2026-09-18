import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Layers, MapPin, Maximize2, ShieldCheck, AlertCircle } from 'lucide-react';

// Sub-component to fit map bounds automatically to the loaded GeoJSON polygon
function MapBoundsUpdater({ geoJson }) {
  const map = useMap();

  useEffect(() => {
    if (!geoJson || !map) return;

    try {
      const layer = L.geoJSON(geoJson);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 17,
          animate: true,
        });
      }
    } catch (err) {
      console.warn('Could not fit map bounds:', err);
    }
  }, [geoJson, map]);

  return null;
}

export default function ParcelMap({ geoJson, ulpin, parcel }) {
  if (!geoJson || !geoJson.geometry) {
    return (
      <div className="bg-slate-100 rounded-xl border border-slate-200 h-[380px] flex flex-col items-center justify-center p-6 text-slate-500">
        <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
        <h4 className="text-sm font-semibold text-slate-700">Geospatial Boundary Unavailable</h4>
        <p className="text-xs text-slate-500 mt-1 text-center">
          No registered GeoJSON geometry could be retrieved for ULPIN {ulpin}.
        </p>
      </div>
    );
  }

  // Calculate approximate center from first coordinate if available
  const coords = geoJson.geometry?.coordinates?.[0] || [];
  const defaultCenter = coords.length > 0 
    ? [coords[0][1], coords[0][0]] 
    : [12.8900, 77.5946];

  const geoJsonStyle = {
    color: '#059669', // Emerald stroke
    weight: 3,
    opacity: 0.9,
    fillColor: '#10b981', // Emerald fill
    fillOpacity: 0.35,
    dashArray: '2, 4',
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties || {};
    const popupContent = `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; padding: 4px; font-size: 12px;">
        <div style="font-weight: bold; color: #047857; margin-bottom: 2px;">
          ULPIN: ${props.ulpin || ulpin}
        </div>
        <div><strong>Survey No:</strong> ${props.survey_number || parcel?.survey_number || 'N/A'}</div>
        <div><strong>Village:</strong> ${props.village || parcel?.village || 'N/A'}</div>
        <div><strong>Area:</strong> ${props.area_hectares || parcel?.area_hectares || 'N/A'} Ha</div>
        <div style="color: #64748b; font-size: 10px; margin-top: 4px; border-top: 1px solid #e2e8f0; padding-top: 2px;">
          Demarcated Cadastral Boundary (Fictional Demo)
        </div>
      </div>
    `;
    layer.bindPopup(popupContent);

    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          weight: 4,
          fillOpacity: 0.55,
          dashArray: '',
        });
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle(geoJsonStyle);
      },
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Map Header bar */}
      <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <Layers className="h-4 w-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Interactive Cadastral GIS Viewer</span>
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded text-[10px] font-mono">
            CRS: EPSG:4326 (WGS84)
          </span>
        </div>
        <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Demarcated Boundary</span>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className="relative h-[380px] w-full z-0">
        <MapContainer
          center={defaultCenter}
          zoom={16}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          {/* OpenStreetMap standard clean raster tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* GeoJSON Parcel Polygon */}
          <GeoJSON
            key={ulpin}
            data={geoJson}
            style={() => geoJsonStyle}
            onEachFeature={onEachFeature}
          />

          {/* Bounds Auto-Fit Controller */}
          <MapBoundsUpdater geoJson={geoJson} />
        </MapContainer>

        {/* Map In-Overlay Badge */}
        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-xs border border-slate-300/80 rounded px-2.5 py-1 text-[10px] text-slate-600 shadow-sm max-w-[280px] leading-tight">
          <span className="font-semibold text-slate-800 block">Cadastral Boundary Overlay</span>
          Rendered from spatial GeoJSON coordinates.
        </div>
      </div>

      {/* Map Footer Bar with coordinates info */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-600 gap-1">
        <div className="flex items-center space-x-2 font-mono">
          <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
          <span>Centroid: Lat {defaultCenter[0].toFixed(4)}°N, Lon {defaultCenter[1].toFixed(4)}°E</span>
        </div>
        <div className="text-slate-500 italic">
          Click polygon to inspect boundary attributes
        </div>
      </div>
    </div>
  );
}
