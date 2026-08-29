import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { notify } from "@/lib/notify";
import { Card, Button, Input, Label, Badge } from "@/components/ui";
import { formatGems } from "@/lib/utils";
import {
  useAdminGetEixDeposits,
  useAdminApproveEixDeposit,
  useAdminRejectEixDeposit,
  useAdminGetEixScreenshot,
  useAdminGetPowerCards,
  useAdminCreatePowerCard,
  useAdminUpdatePowerCard,
  useAdminDeletePowerCard,
  useAdminGetApplications,
  useAdminApproveApplication,
  useAdminRejectApplication,
  useAdminGetAirdropProjects,
  useAdminCreateAirdropProject,
  useAdminUpdateAirdropProject,
  useAdminDeleteAirdropProject,
} from "@workspace/api-client-react";
import { Check, X, Eye, Plus, Trash2, Rocket, Zap, Coins } from "lucide-react";

function LoadingText() {
  return <p className="text-muted-foreground text-sm py-8 text-center">Loading…</p>;
}

// ═══════════════════════════════════════════════════════════════════
// EIX Deposits
// ═══════════════════════════════════════════════════════════════════

export function AdminEixDeposits() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminGetEixDeposits();
  const { mutate: approve } = useAdminApproveEixDeposit();
  const { mutate: reject } = useAdminRejectEixDeposit();
  const { mutate: getScreenshot } = useAdminGetEixScreenshot();
  const [viewing, setViewing] = useState<string | null>(null);

  if (isLoading) return <LoadingText />;
  if (!data?.length) return <p className="text-muted-foreground text-sm py-8 text-center">No EIX deposits.</p>;

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-muted-foreground">
            <tr>
              {["User", "Currency", "USD", "EIX", "Status", "TX Hash", "Date", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{d.username}</td>
                <td className="px-4 py-3 uppercase">{d.currency}</td>
                <td className="px-4 py-3 font-mono">${d.amountUsd}</td>
                <td className="px-4 py-3 font-mono text-primary">{d.eixAmount.toFixed(2)}</td>
                <td className="px-4 py-3"><Badge variant={d.status === "approved" ? "default" : d.status === "pending" ? "secondary" : "destructive"}>{d.status}</Badge></td>
                <td className="px-4 py-3 font-mono text-xs max-w-[120px] truncate">{d.txHash ?? "—"}</td>
                <td className="px-4 py-3 text-xs whitespace-nowrap">{format(new Date(d.createdAt), "MMM d, HH:mm")}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {d.hasScreenshot && (
                      <Button size="sm" variant="ghost" onClick={() => getScreenshot({ id: d.id }, { onSuccess: (r) => setViewing(r.screenshotData) })}>
                        <Eye size={14} />
                      </Button>
                    )}
                    {d.status === "pending" && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => approve({ id: d.id }, { onSuccess: () => { notify.success("Approved", "EIX credited to user."); queryClient.invalidateQueries({ queryKey: ["/api/admin/eix-deposits"] }); } })}>
                          <Check size={14} className="text-emerald-500" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => reject({ id: d.id }, { onSuccess: () => { notify.success("Rejected", "EIX deposit rejected."); queryClient.invalidateQueries({ queryKey: ["/api/admin/eix-deposits"] }); } })}>
                          <X size={14} className="text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <img src={viewing} alt="Proof" className="max-h-[80vh] rounded-lg" />
        </div>
      )}
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Power Card Catalog
// ═══════════════════════════════════════════════════════════════════

export function AdminPowerCards() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminGetPowerCards();
  const { mutate: create } = useAdminCreatePowerCard();
  const { mutate: update } = useAdminUpdatePowerCard();
  const { mutate: remove } = useAdminDeletePowerCard();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", description: "", powerValue: "", eixCost: "", upgradeEixCost: "", maxUpgradeLevel: "10", tier: "common" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    create(
      {
        code: form.code, name: form.name, description: form.description,
        powerValue: Number(form.powerValue), eixCost: Number(form.eixCost),
        upgradeEixCost: Number(form.upgradeEixCost) || Number(form.eixCost),
        maxUpgradeLevel: Number(form.maxUpgradeLevel), tier: form.tier,
      },
      {
        onSuccess: () => { notify.success("Created", "Power Card added."); setShowForm(false); setForm({ code: "", name: "", description: "", powerValue: "", eixCost: "", upgradeEixCost: "", maxUpgradeLevel: "10", tier: "common" }); queryClient.invalidateQueries({ queryKey: ["/api/admin/power-cards"] }); },
        onError: (err: any) => notify.error("Failed", err.message),
      }
    );
  };

  if (isLoading) return <LoadingText />;

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm((s) => !s)}><Plus size={16} /> Add Power Card</Button>
      {showForm && (
        <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border border-border rounded-lg bg-secondary/30">
          <Label>Code<Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></Label>
          <Label>Name<Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Label>
          <Label>Tier<Input value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} /></Label>
          <Label>Power Value<Input type="number" value={form.powerValue} onChange={(e) => setForm({ ...form, powerValue: e.target.value })} required /></Label>
          <Label>EIX Cost<Input type="number" value={form.eixCost} onChange={(e) => setForm({ ...form, eixCost: e.target.value })} required /></Label>
          <Label>Upgrade Cost<Input type="number" value={form.upgradeEixCost} onChange={(e) => setForm({ ...form, upgradeEixCost: e.target.value })} /></Label>
          <Label>Max Level<Input type="number" value={form.maxUpgradeLevel} onChange={(e) => setForm({ ...form, maxUpgradeLevel: e.target.value })} /></Label>
          <Label className="col-span-2 md:col-span-3">Description<Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Label>
          <Button type="submit" className="col-span-2 md:col-span-3">Create Card</Button>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data ?? []).map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold flex items-center gap-2"><Zap size={14} className="text-primary" /> {c.name}</p>
                <p className="text-xs text-muted-foreground">{c.code} • {c.tier}</p>
              </div>
              <Badge>{c.isActive ? "active" : "inactive"}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
              <span>Power: <b>{formatGems(Math.floor(c.powerValue))}</b></span>
              <span>Cost: <b>{c.eixCost} EIX</b></span>
              <span>Upgrade: <b>{c.upgradeEixCost} EIX</b></span>
              <span>Max Lv: <b>{c.maxUpgradeLevel}</b></span>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => update({ id: c.id, isActive: !c.isActive }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/power-cards"] }) })}>
                {c.isActive ? "Deactivate" : "Activate"}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => remove({ id: c.id }, { onSuccess: () => { notify.success("Deleted", "Power Card removed."); queryClient.invalidateQueries({ queryKey: ["/api/admin/power-cards"] }); } })}>
                <Trash2 size={14} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Project Applications
// ═══════════════════════════════════════════════════════════════════

export function AdminApplications() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminGetApplications();
  const { mutate: approve } = useAdminApproveApplication();
  const { mutate: reject } = useAdminRejectApplication();

  if (isLoading) return <LoadingText />;
  if (!data?.length) return <p className="text-muted-foreground text-sm py-8 text-center">No project applications.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {data.map((a) => (
        <Card key={a.id} className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-bold flex items-center gap-2"><Rocket size={14} className="text-primary" /> {a.projectName}</p>
            <Badge variant={a.status === "approved" ? "default" : a.status === "pending" ? "secondary" : "destructive"}>{a.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{a.teamName} • {a.contactEmail}</p>
          <div className="grid grid-cols-2 gap-1 text-sm">
            <span>Token: <b>{a.tokenSymbol}</b></span>
            <span>Chain: <b>{a.chain}</b></span>
            <span>Supply: <b>{formatGems(Math.floor(a.totalSupply))}</b></span>
            <span>Community: <b>{a.communityAllocationPct}%</b></span>
            <span>Reward/block: <b>{formatGems(Math.floor(a.rewardPerBlock))}</b></span>
            <span>Epoch: <b>{a.epochHours}h</b></span>
          </div>
          {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
          {a.status === "pending" && (
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => approve({ id: a.id }, { onSuccess: () => { notify.success("Approved", "Airdrop campaign created."); queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] }); queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] }); } })}>
                <Check size={14} /> Approve & Launch
              </Button>
              <Button size="sm" variant="destructive" onClick={() => reject({ id: a.id }, { onSuccess: () => { notify.success("Rejected", "Application rejected."); queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] }); } })}>
                <X size={14} /> Reject
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Airdrop Projects
// ═══════════════════════════════════════════════════════════════════

export function AdminAirdropProjects() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminGetAirdropProjects();
  const { mutate: create } = useAdminCreateAirdropProject();
  const { mutate: update } = useAdminUpdateAirdropProject();
  const { mutate: remove } = useAdminDeleteAirdropProject();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", tokenSymbol: "", tokenName: "", totalSupply: "", communityAllocationPct: "50", rewardPerBlock: "5000", epochHours: "24", description: "", chain: "BSC" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    create(form as any, {
      onSuccess: () => { notify.success("Created", "Airdrop campaign launched."); setShowForm(false); queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] }); },
      onError: (err: any) => notify.error("Failed", err.message),
    });
  };

  if (isLoading) return <LoadingText />;

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm((s) => !s)}><Plus size={16} /> Create Campaign</Button>
      {showForm && (
        <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border border-border rounded-lg bg-secondary/30">
          <Label>Name<Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Label>
          <Label>Token Symbol<Input value={form.tokenSymbol} onChange={(e) => setForm({ ...form, tokenSymbol: e.target.value })} required /></Label>
          <Label>Token Name<Input value={form.tokenName} onChange={(e) => setForm({ ...form, tokenName: e.target.value })} /></Label>
          <Label>Total Supply<Input type="number" value={form.totalSupply} onChange={(e) => setForm({ ...form, totalSupply: e.target.value })} required /></Label>
          <Label>Community %<Input type="number" value={form.communityAllocationPct} onChange={(e) => setForm({ ...form, communityAllocationPct: e.target.value })} /></Label>
          <Label>Reward/Block<Input type="number" value={form.rewardPerBlock} onChange={(e) => setForm({ ...form, rewardPerBlock: e.target.value })} /></Label>
          <Label>Epoch (h)<Input type="number" value={form.epochHours} onChange={(e) => setForm({ ...form, epochHours: e.target.value })} /></Label>
          <Label>Chain<Input value={form.chain} onChange={(e) => setForm({ ...form, chain: e.target.value })} /></Label>
          <Label className="col-span-2 md:col-span-3">Description<Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Label>
          <Button type="submit" className="col-span-2 md:col-span-3">Launch Campaign</Button>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data ?? []).map((p) => (
          <Card key={p.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold flex items-center gap-2"><Coins size={14} className="text-primary" /> {p.name}</p>
                <p className="text-xs text-muted-foreground">{p.tokenSymbol} • {p.chain} • Block #{p.currentBlockNumber}</p>
              </div>
              <Badge>{p.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
              <span>Supply: <b>{formatGems(Math.floor(p.totalSupply))}</b></span>
              <span>Reward: <b>{formatGems(Math.floor(p.rewardPerBlock))}</b></span>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => update({ id: p.id, status: p.status === "active" ? "paused" : "active" }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] }) })}>
                {p.status === "active" ? "Pause" : "Activate"}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => remove({ id: p.id }, { onSuccess: () => { notify.success("Deleted", "Project removed."); queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] }); } })}>
                <Trash2 size={14} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
