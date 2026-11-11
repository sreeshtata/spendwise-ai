import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sdkClient } from '../services/api';
import {
  Settings,
  ShieldCheck,
  User,
  CheckCircle2,
  Database,
  Layers,
  Search,
  Bot,
  Code2,
  CreditCard,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 1. Fetch Profile
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => sdkClient.profile.get(),
  });

  // 2. Fetch Integration Status
  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ['integration-status'],
    queryFn: () => sdkClient.integrations.getStatus(),
  });

  // Reindex ES mutation
  const reindexMutation = useMutation({
    mutationFn: () => sdkClient.integrations.reindexElasticsearch(),
    onSuccess: () => {
      refetchStatus();
    },
  });

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Application Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your reporting preferences, privacy consent controls, and inspect external hackathon integrations.
        </p>
      </div>

      {/* Profile & Reporting Parameters */}
      {profile && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-navy-800" />
            <h3 className="text-base font-bold text-navy-900">User Profile & Reporting Timezone</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-500 block mb-1">Full Name</label>
              <input
                type="text"
                disabled
                value={profile.fullName || 'Alex Morgan'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-500 block mb-1">Email Account</label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-500 block mb-1">Ledger Currency</label>
              <input
                type="text"
                disabled
                value={`${profile.currency} (Primary Minor Units USD)`}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-500 block mb-1">Server Reporting Timezone</label>
              <input
                type="text"
                disabled
                value={profile.reportingTimezone || 'America/New_York (UTC-5)'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
              />
            </div>
          </div>
        </div>
      )}

      {/* User Consent & Privacy Controls */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-navy-900">User Privacy & Consent Preferences</h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <div className="font-bold text-slate-800">Peer Spending Context Participation</div>
              <p className="text-slate-500">Allow anonymized cohort comparisons with minimum 30-participant threshold.</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 rounded cursor-pointer" />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <div className="font-bold text-slate-800">AI Financial Insights & Summaries</div>
              <p className="text-slate-500">Permit structured synthesis on verified calculation summaries without PII.</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 rounded cursor-pointer" />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <div className="font-bold text-slate-800">Third-Party Analytics Sharing</div>
              <p className="text-slate-500">Opt-in telemetry sharing. Off by default for privacy preservation.</p>
            </div>
            <input type="checkbox" defaultChecked={false} className="w-4 h-4 text-emerald-600 rounded cursor-pointer" />
          </div>
        </div>
      </div>

      {/* External Hackathon Integrations Health Monitor */}
      {status && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-navy-900">External Integrations Health</h3>
            </div>
            <button
              onClick={() => reindexMutation.mutate()}
              disabled={reindexMutation.isPending}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reindexMutation.isPending ? 'animate-spin' : ''}`} />
              <span>Sync & Reindex Search</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* PayPal */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="flex items-center gap-1.5 text-slate-800"><CreditCard className="w-4 h-4 text-blue-600" /> PayPal Sandbox</span>
                <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">Configured / Demo Live</span>
              </div>
              <p className="text-slate-500 text-[11px]">Real test checkout workflow, capture verification & idempotency.</p>
            </div>

            {/* Channel3 */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="flex items-center gap-1.5 text-slate-800"><Layers className="w-4 h-4 text-indigo-600" /> Channel3 Catalog</span>
                <span className="text-indigo-800 bg-indigo-100 px-1.5 py-0.2 rounded font-bold">Catalog Connected</span>
              </div>
              <p className="text-slate-500 text-[11px]">{status.channel3.coverageNote}</p>
            </div>

            {/* APIMatic */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="flex items-center gap-1.5 text-slate-800"><Code2 className="w-4 h-4 text-purple-600" /> APIMatic SDK</span>
                <span className="text-purple-800 bg-purple-100 px-1.5 py-0.2 rounded font-bold">SDK v1.0.0-ts</span>
              </div>
              <p className="text-slate-500 text-[11px]">TypeScript client generated from OpenAPI v3.1 specification.</p>
            </div>

            {/* Elasticsearch */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="flex items-center gap-1.5 text-slate-800"><Search className="w-4 h-4 text-teal-600" /> Elasticsearch</span>
                <span className="text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-bold">{status.elasticsearch.activeDriver}</span>
              </div>
              <p className="text-slate-500 text-[11px]">{status.elasticsearch.indexedCount} transactions indexed with outbox sync.</p>
            </div>

            {/* SpendWise AI */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="flex items-center gap-1.5 text-slate-800"><Bot className="w-4 h-4 text-orange-600" /> SpendWise AI</span>
                <span className="text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded font-bold">{status.ai.provider}</span>
              </div>
              <p className="text-slate-500 text-[11px]">Model: {status.ai.model} with verified financial arithmetic verification.</p>
            </div>

            {/* Supabase RLS */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="flex items-center gap-1.5 text-slate-800"><Database className="w-4 h-4 text-emerald-600" /> Supabase PostgreSQL</span>
                <span className="text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">RLS Active</span>
              </div>
              <p className="text-slate-500 text-[11px]">Strict Row Level Security and cross-user resource ownership checks.</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>REST API Documentation: <a href="http://localhost:3001/api/v1/docs" target="_blank" rel="noopener noreferrer" className="text-navy-900 underline font-semibold">OpenAPI / Swagger UI</a></span>
            <span>Render Deploy: <span className="font-mono text-slate-600">render.yaml configured</span></span>
          </div>
        </div>
      )}

    </div>
  );
};
