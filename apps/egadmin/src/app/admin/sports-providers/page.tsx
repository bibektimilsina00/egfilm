'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Power, X, Loader2, CheckCircle, AlertCircle, ArrowUp, ArrowDown, Radio } from 'lucide-react';

type Row = {
    id: string;
    kind: string;
    name: string;
    baseUrl: string | null;
    apiKey: string | null; // masked from API
    hasApiKey: boolean;
    isEnabled: boolean;
    sortOrder: number;
    lastChecked: string | null;
    lastStatus: string | null;
    lastResponseTime: number | null;
};

const KINDS = ['sportsrc', 'streamed', 'esportex'] as const;

function statusIcon(s: string | null) {
    if (s === 'healthy') return <CheckCircle size={16} className="text-green-400" />;
    if (s === 'degraded') return <AlertCircle size={16} className="text-yellow-400" />;
    if (s === 'offline') return <AlertCircle size={16} className="text-red-400" />;
    return <Radio size={16} className="text-gray-500" />;
}

function statusText(r: Row) {
    if (!r.lastChecked) return <span className="text-gray-500 text-xs">Not tested</span>;
    return (
        <span className="text-xs text-gray-400 flex items-center gap-1.5">
            {statusIcon(r.lastStatus)}
            <span className="text-gray-300">{r.lastStatus ?? 'unknown'}</span>
            {typeof r.lastResponseTime === 'number' && (
                <span className="text-gray-500">· {r.lastResponseTime}ms</span>
            )}
        </span>
    );
}

const emptyForm = { kind: 'sportsrc' as string, name: '', baseUrl: '', apiKey: '', isEnabled: true };

export default function SportsProvidersPage() {
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [formErr, setFormErr] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        try {
            const r = await fetch('/api/admin/sports-providers');
            const d = await r.json();
            setRows(d.providers || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function toggle(id: string, isEnabled: boolean) {
        await fetch(`/api/admin/sports-providers/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isEnabled }),
        });
        load();
    }

    async function move(id: string, delta: number) {
        const idx = rows.findIndex((r) => r.id === id);
        const swap = rows[idx + delta];
        if (!swap) return;
        await Promise.all([
            fetch(`/api/admin/sports-providers/${rows[idx].id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sortOrder: swap.sortOrder }),
            }),
            fetch(`/api/admin/sports-providers/${swap.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sortOrder: rows[idx].sortOrder }),
            }),
        ]);
        load();
    }

    async function del(id: string) {
        if (!confirm('Delete this provider?')) return;
        await fetch(`/api/admin/sports-providers/${id}`, { method: 'DELETE' });
        load();
    }

    async function test(id: string) {
        setTestingId(id);
        try {
            await fetch(`/api/admin/sports-providers/${id}/test`, { method: 'POST' });
            load();
        } finally {
            setTestingId(null);
        }
    }

    function openEdit(r: Row) {
        setEditingId(r.id);
        setForm({
            kind: r.kind,
            name: r.name,
            baseUrl: r.baseUrl ?? '',
            apiKey: '', // never prefill masked value
            isEnabled: r.isEnabled,
        });
        setShowAdd(true);
    }

    function openAdd() {
        setEditingId(null);
        setForm(emptyForm);
        setShowAdd(true);
    }

    function closeModal() {
        setShowAdd(false);
        setEditingId(null);
        setFormErr(null);
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setFormErr(null);
        const body: any = {
            kind: form.kind,
            name: form.name.trim(),
            baseUrl: form.baseUrl.trim() || null,
            isEnabled: form.isEnabled,
        };
        // Only send apiKey if user typed a new one — empty keeps the existing.
        if (form.apiKey.trim()) body.apiKey = form.apiKey.trim();

        const url = editingId ? `/api/admin/sports-providers/${editingId}` : '/api/admin/sports-providers';
        const method = editingId ? 'PATCH' : 'POST';
        const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!r.ok) {
            const err = await r.json().catch(() => ({}));
            setFormErr(err.error || `Request failed (${r.status})`);
            return;
        }
        closeModal();
        load();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Radio size={28} /> Sports Providers
                    </h1>
                    <p className="text-gray-400 mt-2">Manage upstream sources for live matches. Order = priority.</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                    <Plus size={20} />
                    Add Provider
                </button>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                ) : rows.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        No providers configured. Click Add Provider.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-950 text-gray-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="text-left px-4 py-3 w-8">#</th>
                                <th className="text-left px-4 py-3">Name</th>
                                <th className="text-left px-4 py-3">Kind</th>
                                <th className="text-left px-4 py-3">Base URL</th>
                                <th className="text-left px-4 py-3">Health</th>
                                <th className="text-left px-4 py-3">Enabled</th>
                                <th className="px-4 py-3 w-64"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {rows.map((r, i) => (
                                <tr key={r.id} className="hover:bg-gray-800/40">
                                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                                    <td className="px-4 py-3">
                                        <div className="text-white font-medium">{r.name}</div>
                                        {r.hasApiKey && <div className="text-xs text-blue-400 mt-1">🔑 key set</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-xs">
                                            {r.kind}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-400 font-mono max-w-xs truncate" title={r.baseUrl ?? ''}>
                                        {r.baseUrl || <span className="text-gray-600">default</span>}
                                    </td>
                                    <td className="px-4 py-3">{statusText(r)}</td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => toggle(r.id, !r.isEnabled)}
                                            className={`p-1.5 rounded-lg transition-colors ${r.isEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}
                                            title={r.isEnabled ? 'Enabled' : 'Disabled'}
                                        >
                                            <Power size={16} />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 justify-end">
                                            <button
                                                onClick={() => move(r.id, -1)}
                                                disabled={i === 0}
                                                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 disabled:opacity-30"
                                                title="Move up"
                                            ><ArrowUp size={14} /></button>
                                            <button
                                                onClick={() => move(r.id, 1)}
                                                disabled={i === rows.length - 1}
                                                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 disabled:opacity-30"
                                                title="Move down"
                                            ><ArrowDown size={14} /></button>
                                            <button
                                                onClick={() => test(r.id)}
                                                disabled={testingId === r.id}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-xs font-medium"
                                            >
                                                {testingId === r.id ? 'Testing…' : 'Test'}
                                            </button>
                                            <button
                                                onClick={() => openEdit(r)}
                                                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400"
                                                title="Edit"
                                            ><Edit size={14} /></button>
                                            <button
                                                onClick={() => del(r.id)}
                                                className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                                                title="Delete"
                                            ><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showAdd && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-lg w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-800">
                            <h2 className="text-xl font-bold text-white">
                                {editingId ? 'Edit Provider' : 'Add Provider'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={submit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Kind</label>
                                <select
                                    value={form.kind}
                                    onChange={(e) => setForm({ ...form, kind: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                                >
                                    {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                                    placeholder="e.g. streamed.pk"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Base URL</label>
                                <input
                                    value={form.baseUrl}
                                    onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                                    placeholder="Leave blank for kind default"
                                />
                            </div>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={form.isEnabled}
                                    onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <span className="text-gray-300">Enabled</span>
                            </label>
                            {formErr && <div className="text-red-400 text-sm">{formErr}</div>}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                >
                                    {editingId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
