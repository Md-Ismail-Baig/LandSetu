import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Repeat, 
  Scissors, 
  ShieldCheck, 
  Settings, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

const MODULE_CONFIGS = {
  'document-verification': {
    title: 'Document Verification Engine',
    subtitle: 'OCR & Cross-Registry Validation of Land Documents',
    icon: FileText,
    color: 'from-blue-600 to-indigo-800',
    description: 'Automated extraction and validation of Registered Sale Deeds, Encumbrance Certificates (EC), and Revenue Mutation Orders against the ULPIN-anchored multi-department ledger.',
    features: [
      'Automated OCR & Named Entity Recognition for Title Deeds',
      'Cross-check against Inspector General of Registration (IGR) DB',
      'Municipal property tax receipt authenticity verification',
      'Tamper-evident record matching with state registries',
    ],
  },
  'land-transfer': {
    title: 'Land Sale & Transfer Protocol',
    subtitle: 'Digital Title Mutation & Conveyance Registration',
    icon: Repeat,
    color: 'from-purple-600 to-indigo-900',
    description: 'Integrated title conveyance protocol coordinating Sub-Registrar execution, digital stamp duty settlement, automated Encumbrance check, and instant revenue mutation.',
    features: [
      'Pre-transfer automatic encumbrance and court stay check',
      'Digital deed draft generation with ULPIN geospatial coordinates',
      'Simultaneous IGR deed registration & Revenue Department mutation',
      'Automated updating of municipal property tax ownership records',
    ],
  },
  'parcel-subdivision': {
    title: 'Cadastral Parcel Subdivision Engine',
    subtitle: 'GIS Boundary Partitioning & Child ULPIN Generation',
    icon: Scissors,
    color: 'from-amber-600 to-orange-800',
    description: 'Spatial subdivision tool allowing surveyors and revenue officers to bifurcate parcel polygons, recalculate exact land areas, and issue immutable child ULPIN identifiers.',
    features: [
      'Interactive polygon splitting with coordinate snap',
      'Automated spatial area conservation check (A = A1 + A2)',
      'Algorithmic issuance of child ULPIN standard identifiers',
      'Parent-to-child lineage recording across departmental ledgers',
    ],
  },
  'blockchain-audit': {
    title: 'Cryptographic Audit Ledger',
    subtitle: 'Tamper-Evident Transaction Ledger for Land Governance',
    icon: ShieldCheck,
    color: 'from-emerald-600 to-teal-900',
    description: 'Cryptographic ledger recording every mutation, deed transfer, subdivision, and verification decision with SHA-256 block hashing and tamper verification.',
    features: [
      'SHA-256 transaction hash chaining with previous block links',
      'Independent cryptographic tamper verification utility',
      'Decentralized audit trail for municipal and revenue events',
      'Exportable cryptographically-signed Certificate of Title',
    ],
  },
  'admin': {
    title: 'Platform Administration & Role Governance',
    subtitle: 'System Health, Role Delegation, and API Analytics',
    icon: Settings,
    color: 'from-slate-700 to-slate-900',
    description: 'Administrative console for managing digital public infrastructure health, inspecting API telemetry, configuring departmental sync intervals, and managing RBAC policies.',
    features: [
      'Real-time departmental API health & synchronization telemetry',
      'RBAC role delegation and credential security governance',
      'Platform-wide audit log export and compliance reporting',
      'Cadastral database backup and state registry sync control',
    ],
  },
};

export default function PlaceholderPage({ moduleId }) {
  const navigate = useNavigate();
  const config = MODULE_CONFIGS[moduleId] || {
    title: 'Governance Service',
    subtitle: 'Digital Public Infrastructure Feature',
    icon: Sparkles,
    color: 'from-slate-700 to-slate-900',
    description: 'This module is currently being prepared for deployment.',
    features: ['Workflow framework active', 'Database schemas initialized', 'API contracts defined'],
  };

  const Icon = config.icon;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      {/* Hero Banner */}
      <div className={`bg-gradient-to-r ${config.color} rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden`}>
        <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 w-fit mb-3 border border-white/20">
          <Clock className="h-3.5 w-3.5" />
          <span>Module in Preparation</span>
        </div>

        <div className="flex items-start space-x-4">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/20 shrink-0">
            <Icon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif">{config.title}</h2>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 font-medium">{config.subtitle}</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-200 mt-4 leading-relaxed max-w-2xl">
          {config.description}
        </p>
      </div>

      {/* Planned Feature Blueprint */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          <span>Service Capabilities</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {config.features.map((feat, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 flex items-start space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-slate-700 font-medium">{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notice & Back Action */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="text-slate-700 flex items-start space-x-2">
          <Info className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <strong className="text-emerald-950 font-bold block mb-0.5">Service Framework Active:</strong>
            <span>
              This module is currently being prepared for deployment. You can create and track requests for this service in the <strong>Service Requests Hub</strong>.
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => navigate('/service-requests')}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm transition flex items-center space-x-1.5"
          >
            <span>Open Service Requests</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
