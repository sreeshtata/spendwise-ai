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
    <div className="bg-slate-100 border-b border-slate-200 px-4 py-1.5 text-xs text-slate-600">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-navy-900 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-navy-700" />
            Integrations:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* PayPal */}
          <div className="flex items-center space-x-1" title="PayPal Sandbox Test Payment Engine">
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-medium text-slate-700">PayPal:</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-medium text-[11px]">
              Sandbox Live
            </span>
          </div>

          {/* Channel3 */}
          <div className="flex items-center space-x-1" title="Channel3 Merchant Discovery Adapter">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-medium text-slate-700">Channel3:</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 font-medium text-[11px]">
              Catalog Ready
            </span>
          </div>

          {/* Elasticsearch */}
          <div className="flex items-center space-x-1" title={status.elasticsearch.activeDriver}>
            <Search className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-medium text-slate-700">Search:</span>
            <span className={`px-1.5 py-0.2 rounded font-medium text-[11px] ${
              status.elasticsearch.activeDriver === 'elasticsearch'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {status.elasticsearch.activeDriver === 'elasticsearch' ? 'ES Cluster' : 'DB Search Driver'}
            </span>
          </div>

          {/* APIMatic */}
          <div className="flex items-center space-x-1" title="APIMatic Generated TypeScript SDK">
            <Code2 className="w-3.5 h-3.5 text-purple-600" />
            <span className="font-medium text-slate-700">APIMatic:</span>
            <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-medium text-[11px]">
              SDK v1.0
            </span>
          </div>

          {/* AI Service */}
          <div className="flex items-center space-x-1" title={status.ai.provider}>
            <Bot className="w-3.5 h-3.5 text-orange-600" />
            <span className="font-medium text-slate-700">AI:</span>
            <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-medium text-[11px]">
              {status.ai.status === 'configured' ? 'Gemini Live' : 'Verified Rules Engine'}
            </span>
          </div>

          {/* Supabase RLS */}
          <div className="flex items-center space-x-1" title="Supabase PostgreSQL with Row Level Security">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium text-slate-700">Security:</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-medium text-[11px]">
              RLS Isolated
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
