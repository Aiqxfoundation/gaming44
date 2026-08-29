import React, { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { notify } from "@/lib/notify";
import { useSubmitProjectApplication } from "@workspace/api-client-react";
import { ArrowLeft, Send, Rocket } from "lucide-react";

export default function ProjectApplyPage() {
  const { mutate, isPending } = useSubmitProjectApplication();
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    teamName: "", contactEmail: "", projectName: "", tokenSymbol: "", tokenName: "",
    totalSupply: "", communityAllocationPct: "50", rewardPerBlock: "5000",
    epochHours: "24", description: "", website: "", chain: "BSC",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      {
        teamName: form.teamName, contactEmail: form.contactEmail,
        projectName: form.projectName, tokenSymbol: form.tokenSymbol,
        tokenName: form.tokenName, totalSupply: Number(form.totalSupply),
        communityAllocationPct: Number(form.communityAllocationPct),
        rewardPerBlock: Number(form.rewardPerBlock),
        epochHours: Number(form.epochHours), description: form.description,
        website: form.website, chain: form.chain,
      },
      {
        onSuccess: () => {
          notify.success("Application Submitted!", "Our team will review your project and reach out.");
          setDone(true);
        },
        onError: (err: any) => notify.error("Submission Failed", err.message),
      }
    );
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-full bg-orange-500/15 flex items-center justify-center mb-6">
          <Rocket className="text-orange-400" size={36} />
        </motion.div>
        <h1 className="text-2xl font-black text-white text-center">Application Received!</h1>
        <p className="text-sm text-white/50 text-center mt-2 max-w-sm">
          Thank you for applying to the EthicX Global Airdrop ecosystem. Our team will review your project and contact you at the email you provided.
        </p>
        <Link href="/" className="mt-6 h-11 px-6 rounded-xl bg-orange-500 text-black font-bold text-sm flex items-center gap-2">
          Back to App
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8">
        <Link href="/" className="flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6">
          <ArrowLeft size={16} /> Back to App
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 border border-orange-500/20 mb-6"
          style={{ background: "linear-gradient(135deg, rgba(255,149,0,0.10), rgba(10,11,17,0.6))" }}>
          <div className="flex items-center gap-2 mb-1">
            <Rocket className="text-orange-400" size={18} />
            <span className="text-xs font-bold uppercase tracking-widest text-orange-400/80">For Project Teams</span>
          </div>
          <h1 className="text-2xl font-black text-white">List Your Airdrop</h1>
          <p className="text-xs text-white/40 mt-1">Apply to distribute your token to the EthicX community. Approved projects launch a campaign inside the ecosystem.</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Team Name *"><Input value={form.teamName} onChange={(e) => set("teamName", e.target.value)} required /></Field>
          <Field label="Contact Email *"><Input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} required /></Field>
          <Field label="Project Name *"><Input value={form.projectName} onChange={(e) => set("projectName", e.target.value)} required /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Token Symbol *"><Input value={form.tokenSymbol} onChange={(e) => set("tokenSymbol", e.target.value)} required /></Field>
            <Field label="Token Name *"><Input value={form.tokenName} onChange={(e) => set("tokenName", e.target.value)} required /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total Supply *"><Input type="number" value={form.totalSupply} onChange={(e) => set("totalSupply", e.target.value)} required /></Field>
            <Field label="Community Allocation %"><Input type="number" value={form.communityAllocationPct} onChange={(e) => set("communityAllocationPct", e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reward Per Block"><Input type="number" value={form.rewardPerBlock} onChange={(e) => set("rewardPerBlock", e.target.value)} /></Field>
            <Field label="Epoch (hours)"><Input type="number" value={form.epochHours} onChange={(e) => set("epochHours", e.target.value)} /></Field>
          </div>
          <Field label="Blockchain"><Input value={form.chain} onChange={(e) => set("chain", e.target.value)} /></Field>
          <Field label="Website"><Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" /></Field>
          <Field label="Description"><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} /></Field>

          <button type="submit" disabled={isPending}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            <Send size={16} /> {isPending ? "Submitting…" : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-white/50 font-semibold">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full h-11 rounded-lg border border-border bg-input px-3 text-sm text-white placeholder:text-white/30 focus:border-orange-500 outline-none" />;
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-orange-500 outline-none" />;
}
