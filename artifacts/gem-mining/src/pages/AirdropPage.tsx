import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { notify } from "@/lib/notify";
import { cn, formatGems } from "@/lib/utils";
import {
  useGetAirdropProjects,
  useGetAirdropProject,
  useGetAirdropBlocks,
  useContributeGems,
  useGetMyAirdropRewards,
  useGetMyContributions,
  useClaimAirdropReward,
  useGetEixWallet,
} from "@workspace/api-client-react";
import {
  ArrowLeft, Gift, Clock, Gem, TrendingUp, Trophy, Send, Sparkles, Check,
} from "lucide-react";

export default function AirdropPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<"projects" | "rewards" | "history">("projects");

  if (selectedId !== null) {
    return <ProjectDetail projectId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 border border-orange-500/20"
        style={{ background: "linear-gradient(135deg, rgba(255,149,0,0.10) 0%, rgba(10,11,17,0.6) 60%)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Gift className="text-orange-400" size={18} />
          <span className="text-xs font-bold uppercase tracking-widest text-orange-400/80">Global Airdrop</span>
        </div>
        <h1 className="text-2xl font-black text-white">Airdrop Farming</h1>
        <p className="text-xs text-white/40 mt-1">Mine Gems → Contribute to daily blocks → Earn partner tokens.</p>
      </motion.div>

      <div className="flex rounded-xl bg-card border border-border p-1">
        {([["projects", "Projects"], ["rewards", "My Rewards"], ["history", "History"]] as const).map(([k, label]) => (
          <button
            key={k} onClick={() => setTab(k)}
            className={cn("flex-1 h-9 rounded-lg text-xs font-bold transition-all",
              tab === k ? "bg-orange-500 text-black" : "text-white/50")}
          >{label}</button>
        ))}
      </div>

      {tab === "projects" && <ProjectsList onSelect={setSelectedId} />}
      {tab === "rewards" && <MyRewards />}
      {tab === "history" && <MyHistory />}
    </div>
  );
}

function ProjectsList({ onSelect }: { onSelect: (id: number) => void }) {
  const { data: projects, isLoading } = useGetAirdropProjects();
  if (isLoading) return <Spinner />;
  if (!projects?.length) {
    return (
      <div className="text-center py-12">
        <Sparkles className="mx-auto text-white/20 mb-3" size={40} />
        <p className="text-sm text-white/40">No airdrop campaigns live yet.</p>
        <p className="text-xs text-white/30 mt-1">New partner projects are coming soon.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {projects.map((p) => (
        <button
          key={p.id} onClick={() => onSelect(p.id)}
          className="w-full text-left rounded-2xl bg-card border border-border p-4 hover:border-orange-500/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400 font-black text-sm">
                {p.tokenSymbol.slice(0, 3)}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{p.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-white/40">{p.tokenSymbol} • {p.chain}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-orange-400 font-mono">{formatGems(Math.floor(p.rewardPerBlock))}</p>
              <p className="text-[10px] text-white/40">{p.tokenSymbol}/block</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 text-[10px] text-white/40">
            <span className="flex items-center gap-1"><Clock size={11} /> {p.epochHours}h epoch</span>
            <span>•</span>
            <span>Block #{p.currentBlockNumber}</span>
            <span>•</span>
            <span>{p.communityAllocationPct}% community</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function ProjectDetail({ projectId, onBack }: { projectId: number; onBack: () => void }) {
  const queryClient = useQueryClient();
  const { data: eixWallet } = useGetEixWallet();
  const { data: project, isLoading } = useGetAirdropProject(projectId);
  const { data: blocks } = useGetAirdropBlocks(projectId);
  const { mutate: contribute, isPending } = useContributeGems();
  const [gems, setGems] = useState("");

  const gemsBalance = eixWallet ? (eixWallet as any).gemsBalance : null;
  // gemsBalance isn't in eixWallet; fetch from wallet hook instead
  const block = project?.currentBlock;
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!block) return;
    const tick = () => setRemaining(Math.max(0, new Date(block.endsAt).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [block?.endsAt]);

  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    const g = Math.floor(Number(gems));
    if (!g || g < 1) { notify.error("Invalid Amount", "Enter a valid gem amount."); return; }
    contribute(
      { id: projectId, gems: g },
      {
        onSuccess: (data) => {
          notify.success("Gems Contributed!", `${formatGems(data.contributedGems)} gems added to this block.`);
          setGems("");
          queryClient.invalidateQueries({ queryKey: ["/api/airdrop/projects", projectId] });
          queryClient.invalidateQueries({ queryKey: ["/api/airdrop/projects", projectId, "blocks"] });
          queryClient.invalidateQueries({ queryKey: ["/api/eix/wallet"] });
          queryClient.invalidateQueries({ queryKey: ["/api/airdrop/my-contributions"] });
        },
        onError: (err: any) => notify.error("Contribution Failed", err.message),
      }
    );
  };

  if (isLoading || !project || !block) return <Spinner />;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5 pb-24">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-white/50 hover:text-white">
        <ArrowLeft size={16} /> Back to Airdrops
      </button>

      {/* Project header */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400 font-black">
            {project.tokenSymbol.slice(0, 3)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{project.name}</h2>
            <p className="text-xs text-white/40">{project.tokenName} ({project.tokenSymbol}) • {project.chain}</p>
          </div>
        </div>
        {project.description && <p className="text-xs text-white/50 mt-3">{project.description}</p>}
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <Mini label="Total Supply" value={formatGems(Math.floor(project.totalSupply))} />
          <Mini label="Community" value={`${project.communityAllocationPct}%`} />
          <Mini label="Per Block" value={`${formatGems(Math.floor(project.rewardPerBlock))}`} />
        </div>
      </div>

      {/* Current block */}
      <div className="rounded-2xl border border-orange-500/20 p-4" style={{ background: "linear-gradient(135deg, rgba(255,149,0,0.08), rgba(10,11,17,0.6))" }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-400/80">Block #{block.blockNumber}</span>
          <span className="text-xs text-white/40 font-mono">{h}h {m}m {s}s left</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <p className="text-[10px] uppercase text-white/40">Reward Pool</p>
            <p className="text-lg font-black text-orange-400 font-mono">{formatGems(Math.floor(block.rewardAmount))}</p>
            <p className="text-[10px] text-white/40">{project.tokenSymbol}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-white/40">Total Gems</p>
            <p className="text-lg font-black text-white font-mono">{formatGems(Math.floor(block.totalGems))}</p>
          </div>
        </div>
        <div className="mt-3 rounded-lg bg-black/30 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50">Your share</span>
            <span className="text-orange-400 font-bold font-mono">{project.mySharePct.toFixed(2)}%</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-white/50">Projected reward</span>
            <span className="text-white font-bold font-mono">{project.projectedReward.toFixed(4)} {project.tokenSymbol}</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-white/50">Your contribution</span>
            <span className="text-white font-mono">{formatGems(Math.floor(project.myContribution))} gems</span>
          </div>
        </div>
      </div>

      {/* Contribute form */}
      <form onSubmit={handleContribute} className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <label className="text-xs text-white/50 font-semibold flex items-center gap-1.5">
          <Gem size={13} className="text-orange-400" /> Contribute Gems to this block
        </label>
        <input
          type="number" value={gems} onChange={(e) => setGems(e.target.value)}
          placeholder="Amount of gems"
          className="w-full h-11 rounded-lg border border-border bg-input px-3 text-sm text-white"
        />
        <button
          type="submit" disabled={isPending}
          className="w-full h-11 rounded-xl bg-orange-500 text-black font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Send size={15} /> {isPending ? "Contributing…" : "Contribute Gems"}
        </button>
      </form>

      {/* Block history */}
      {blocks && blocks.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Clock size={14} className="text-orange-400" /> Block History
          </h3>
          <div className="space-y-2">
            {blocks.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl bg-card border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-white">Block #{b.blockNumber}</p>
                  <p className="text-xs text-white/40">{formatGems(Math.floor(b.totalGems))} gems</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-orange-400">{formatGems(Math.floor(b.rewardAmount))} {project.tokenSymbol}</p>
                  <span className={cn("text-[10px] uppercase font-bold", b.status === "open" ? "text-orange-400" : "text-white/30")}>{b.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MyRewards() {
  const queryClient = useQueryClient();
  const { data: rewards, isLoading } = useGetMyAirdropRewards();
  const { mutate: claim, isPending } = useClaimAirdropReward();
  if (isLoading) return <Spinner />;
  if (!rewards?.length) return <Empty icon={<Trophy size={40} />} text="No airdrop rewards yet." />;
  return (
    <div className="space-y-2">
      {rewards.map((r) => (
        <div key={r.id} className="flex items-center justify-between rounded-xl bg-card border border-border px-4 py-3">
          <div>
            <p className="text-sm font-bold text-white font-mono">{r.rewardAmount.toFixed(4)} {r.tokenSymbol}</p>
            <p className="text-xs text-white/40">{r.projectName ?? "Project"} • {r.gemsSharePct.toFixed(2)}% share</p>
          </div>
          {r.isClaimed ? (
            <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1"><Check size={12} /> claimed</span>
          ) : (
            <button
              onClick={() => claim({ id: r.id }, {
                onSuccess: () => {
                  notify.success("Reward Claimed!", `${r.rewardAmount.toFixed(4)} ${r.tokenSymbol} claimed.`);
                  queryClient.invalidateQueries({ queryKey: ["/api/airdrop/my-rewards"] });
                },
                onError: (err: any) => notify.error("Claim Failed", err.message),
              })}
              disabled={isPending}
              className="h-8 px-3 rounded-lg bg-orange-500/15 text-orange-400 text-xs font-bold disabled:opacity-50"
            >Claim</button>
          )}
        </div>
      ))}
    </div>
  );
}

function MyHistory() {
  const { data: contribs, isLoading } = useGetMyContributions();
  if (isLoading) return <Spinner />;
  if (!contribs?.length) return <Empty icon={<TrendingUp size={40} />} text="No contributions yet." />;
  return (
    <div className="space-y-2">
      {contribs.map((c) => (
        <div key={c.id} className="flex items-center justify-between rounded-xl bg-card border border-border px-4 py-3">
          <div>
            <p className="text-sm font-bold text-white font-mono">{formatGems(Math.floor(c.gemsAmount))} gems</p>
            <p className="text-xs text-white/40">{c.projectName ?? "Project"} • {c.tokenSymbol ?? ""}</p>
          </div>
          <span className="text-xs text-white/30">{new Date(c.contributedAt).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/20 p-2">
      <p className="text-[9px] uppercase text-white/40">{label}</p>
      <p className="text-xs font-bold text-white font-mono truncate">{value}</p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto text-white/20 mb-3 flex justify-center">{icon}</div>
      <p className="text-sm text-white/40">{text}</p>
    </div>
  );
}
