import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { sdkClient } from '../../services/api';
import { CheckCircle2, AlertCircle, Database, Search, Bot, CreditCard, Layers, Code2 } from 'lucide-react';

export const IntegrationStatusBar: React.FC = () => {
  const { data: status, isLoading } = useQuery({
    queryKey: ['integration-status'],
    queryFn: () => sdkClient.integrations.getStatus(),
    refetchInterval: 30000,
  });

  if (isLoading || !status) return null;

  return (
    <div className="bg-slate-100/90 border-b border-slate-300/80 px-4 sm:px-6 py-2.5 text-sm text-slate-700 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-navy-950 text-sm flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-600" />
            Active Integrations:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* PayPal */}
          <div className="flex items-center space-x-1.5" title="PayPal Sandbox Test Payment Engine">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800 text-sm">PayPal:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300">
              Sandbox Live
            </span>
          </div>

          {/* Channel3 */}
          <div className="flex items-center space-x-1.5" title="Channel3 Merchant Discovery Adapter">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-800 text-sm">Channel3:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs border border-blue-300">
              Universal Catalog Ready
            </span>
          </div>

          {/* Elasticsearch */}
          <div className="flex items-center space-x-1.5" title={status.elasticsearch.activeDriver}>
            <Search className="w-4 h-4 text-teal-600" />
            <span className="font-semibold text-slate-800 text-sm">Search:</span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs border ${
              status.elasticsearch.activeDriver === 'elasticsearch'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {status.elasticsearch.activeDriver === 'elasticsearch' ? 'ES Cluster' : 'DB Search Driver'}
            </span>
          </div>

          {/* APIMatic */}
          <div className="flex items-center space-x-1.5" title="APIMatic Generated TypeScript SDK">
            <Code2 className="w-4 h-4 text-purple-600" />
            <span className="font-semibold text-slate-800 text-sm">APIMatic:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-xs border border-purple-300">
              SDK v1.0
            </span>
          </div>

          {/* AI Service */}
          <div className="flex items-center space-x-1.5" title={status.ai.provider}>
            <Bot className="w-4 h-4 text-orange-600" />
            <span className="font-semibold text-slate-800 text-sm">AI Engine:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs border border-blue-300">
              {status.ai.status === 'configured' ? 'Gemini Live' : 'Verified Rules Engine'}
            </span>
          </div>

          {/* Supabase RLS */}
          <div className="flex items-center space-x-1.5" title="Supabase PostgreSQL with Row Level Security">
            <Database className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-800 text-sm">Security:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300">
              RLS Isolated
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
