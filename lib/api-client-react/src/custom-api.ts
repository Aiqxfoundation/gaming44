import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

// ─── Types ──────────────────────────────────────────────────────────

export interface DepositAddress {
  id: number;
  address: string;
  label: string;
  network: string;
  isActive: boolean;
  createdAt: string;
}

export interface GeneratedAddress {
  id: number;
  address: string;
  label: string;
  network: string;
}

export interface AdminDepositFull {
  id: number;
  userId: number;
  username: string;
  amountUsdt: number;
  status: string;
  txHash: string | null;
  assignedAddress: string | null;
  hasScreenshot: boolean;
  screenshotData: string | null;
  createdAt: string;
  approvedAt: string | null;
}

export interface AdminWithdrawalFull {
  id: number;
  userId: number;
  username: string;
  currency: string;
  amount: number;
  walletAddress: string;
  status: string;
  createdAt: string;
  processedAt: string | null;
}

export interface AdminStatsFull {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalGemsMined: number;
  totalEtrConverted: number;
  totalEtrSupplyUsed: number;
  totalDepositsUsdt: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalAddresses: number;
  activeAddresses: number;
}

// ─── Referral types ─────────────────────────────────────────────────

export interface ReferralUser {
  username: string;
  isActive: boolean;
  isKycVerified: boolean;
  joinedAt: string;
  claimableGems: number;
  lockedGems: number;
}

export interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  totalRewardGems: number;
  totalClaimableGems: number;
  totalLockedGems: number;
  uplineIsVerified: boolean;
  level1: ReferralUser[];
  level2: ReferralUser[];
}

export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalRewardGems: number;
  totalClaimableGems: number;
  totalLockedGems: number;
  uplineIsVerified: boolean;
  level1: ReferralUser[];
  level2: ReferralUser[];
}

// ─── Deposit Address — Generate ────────────────────────────────────

export const useGenerateDepositAddress = (options?: { query?: any }) => {
  return useQuery<GeneratedAddress, Error>({
    queryKey: ["/api/deposits/generate-address"],
    queryFn: () => customFetch<GeneratedAddress>("/api/deposits/generate-address"),
    enabled: false,
    retry: false,
    ...options?.query,
  });
};

// ─── Admin: Deposit Addresses CRUD ─────────────────────────────────

export const useAdminGetAddresses = (options?: { query?: any }) => {
  return useQuery<DepositAddress[], Error>({
    queryKey: ["/api/admin/addresses"],
    queryFn: () => customFetch<DepositAddress[]>("/api/admin/addresses"),
    ...options?.query,
  });
};

export const useAdminAddAddress = (options?: any) => {
  return useMutation<DepositAddress, Error, { address: string; label: string; network: string }>({
    mutationFn: (data) =>
      customFetch<DepositAddress>("/api/admin/addresses", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options,
  });
};

export const useAdminUpdateAddress = (options?: any) => {
  return useMutation<DepositAddress, Error, { id: number; address?: string; label?: string; network?: string; isActive?: boolean }>({
    mutationFn: ({ id, ...data }) =>
      customFetch<DepositAddress>(`/api/admin/addresses/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    ...options,
  });
};

export const useAdminDeleteAddress = (options?: any) => {
  return useMutation<{ message: string }, Error, { id: number }>({
    mutationFn: ({ id }) =>
      customFetch<{ message: string }>(`/api/admin/addresses/${id}`, {
        method: "DELETE",
      }),
    ...options,
  });
};

// ─── Admin: Screenshot Management ──────────────────────────────────

export const useAdminDeleteDepositScreenshot = (options?: any) => {
  return useMutation<{ message: string }, Error, { depositId: number }>({
    mutationFn: ({ depositId }) =>
      customFetch<{ message: string }>(`/api/admin/deposits/${depositId}/screenshot`, {
        method: "DELETE",
      }),
    ...options,
  });
};

// ─── Admin: Full deposits (with screenshot data) ──────────────────

export const useAdminGetDepositsWithScreenshots = (options?: { query?: any }) => {
  return useQuery<AdminDepositFull[], Error>({
    queryKey: ["/api/admin/deposits"],
    queryFn: () => customFetch<AdminDepositFull[]>("/api/admin/deposits"),
    ...options?.query,
  });
};

// ─── Admin: Full withdrawals ──────────────────────────────────────

export const useAdminGetWithdrawalsFull = (options?: { query?: any }) => {
  return useQuery<AdminWithdrawalFull[], Error>({
    queryKey: ["/api/admin/withdrawals"],
    queryFn: () => customFetch<AdminWithdrawalFull[]>("/api/admin/withdrawals"),
    ...options?.query,
  });
};

// ─── Admin: Full stats ────────────────────────────────────────────

export const useAdminGetStatsFull = (options?: { query?: any }) => {
  return useQuery<AdminStatsFull, Error>({
    queryKey: ["/api/admin/stats"],
    queryFn: () => customFetch<AdminStatsFull>("/api/admin/stats"),
    ...options?.query,
  });
};

// ─── Admin: Approve/Reject deposits and withdrawals (wrappers) ───

export const useAdminApproveDepositFull = (options?: any) => {
  return useMutation<{ message: string }, Error, { depositId: number }>({
    mutationFn: ({ depositId }) =>
      customFetch<{ message: string }>(`/api/admin/deposits/${depositId}/approve`, {
        method: "POST",
      }),
    ...options,
  });
};

export const useAdminRejectDepositFull = (options?: any) => {
  return useMutation<{ message: string }, Error, { depositId: number }>({
    mutationFn: ({ depositId }) =>
      customFetch<{ message: string }>(`/api/admin/deposits/${depositId}/reject`, {
        method: "POST",
      }),
    ...options,
  });
};

export const useAdminApproveWithdrawalFull = (options?: any) => {
  return useMutation<{ message: string }, Error, { withdrawalId: number }>({
    mutationFn: ({ withdrawalId }) =>
      customFetch<{ message: string }>(`/api/admin/withdrawals/${withdrawalId}/approve`, {
        method: "POST",
      }),
    ...options,
  });
};

export const useAdminRejectWithdrawalFull = (options?: any) => {
  return useMutation<{ message: string }, Error, { withdrawalId: number }>({
    mutationFn: ({ withdrawalId }) =>
      customFetch<{ message: string }>(`/api/admin/withdrawals/${withdrawalId}/reject`, {
        method: "POST",
      }),
    ...options,
  });
};

// ─── Deposit: create with screenshot support ──────────────────────

export interface CreateDepositWithScreenshot {
  amountUsdt: number;
  txHash?: string;
  screenshotData?: string;
  assignedAddress?: string;
}

export interface DepositResponse {
  id: number;
  amountUsdt: number;
  status: string;
  txHash: string | null;
  assignedAddress: string | null;
  hasScreenshot: boolean;
  createdAt: string;
  approvedAt: string | null;
}

export const useCreateDepositFull = (options?: any) => {
  return useMutation<DepositResponse, Error, CreateDepositWithScreenshot>({
    mutationFn: (data) =>
      customFetch<DepositResponse>("/api/deposits", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options,
  });
};

export interface DepositHistoryItem {
  id: number;
  amountUsdt: number;
  status: string;
  txHash: string | null;
  assignedAddress: string | null;
  hasScreenshot: boolean;
  screenshotData: string | null;
  createdAt: string;
  approvedAt: string | null;
}

export const useGetDepositsFull = (options?: { query?: any }) => {
  return useQuery<DepositHistoryItem[], Error>({
    queryKey: ["/api/deposits"],
    queryFn: () => customFetch<DepositHistoryItem[]>("/api/deposits"),
    ...options?.query,
  });
};

// ─── Levels ──────────────────────────────────────────────────────

export interface LevelDefinition {
  level: number;
  name: string;
  unlockCost: number | null;
  investmentThreshold: number | null;
  description: string;
  gemsPerYear: number;
  usdtReturn: number | null;
  returnMultiplier: number;
  pickaxeImage: string;
}

export interface UnlockedLevel {
  level: number;
  additionalInvestment: number;
  unlockedAt: string;
}

export interface LevelsStatus {
  currentLevel: number;
  totalMiningPower: number;
  dailyGems: number;
  usdtBalance: number;
  unlockedLevels: UnlockedLevel[];
  levelDefinitions: LevelDefinition[];
}

export const useGetLevels = (options?: { query?: any }) => {
  return useQuery<LevelsStatus, Error>({
    queryKey: ["/api/levels"],
    queryFn: () => customFetch<LevelsStatus>("/api/levels"),
    ...options?.query,
  });
};

export const useUnlockLevel = (options?: any) => {
  return useMutation<{ message: string; newLevel: number; deducted: number; newUsdtBalance: number }, Error, { level: number }>({
    mutationFn: (data) =>
      customFetch("/api/levels/unlock", { method: "POST", body: JSON.stringify(data) }),
    ...options,
  });
};

export const useInvestInLevel = (options?: any) => {
  return useMutation<{ message: string; additionalUsdt: number; newUsdtBalance: number; newLevel: number; leveledUp: boolean }, Error, { additionalUsdt: number }>({
    mutationFn: (data) =>
      customFetch("/api/levels/invest", { method: "POST", body: JSON.stringify(data) }),
    ...options,
  });
};

// ─── Referrals ────────────────────────────────────────────────────────

export const useGetReferrals = (options?: { query?: any }) => {
  return useQuery<ReferralStats, Error>({
    queryKey: ["/api/referrals"],
    queryFn: () => customFetch<ReferralStats>("/api/referrals"),
    ...options?.query,
  });
};

export const useApplyReferral = (options?: any) => {
  return useMutation<{ message: string }, Error, { referralCode: string }>({
    mutationFn: (data) =>
      customFetch<{ message: string }>("/api/referrals/apply", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options,
  });
};

export const useClaimReferralGems = (options?: any) => {
  return useMutation<{ claimedGems: number; newGemsBalance: number; message: string }, Error, void>({
    mutationFn: () =>
      customFetch<{ claimedGems: number; newGemsBalance: number; message: string }>("/api/referrals/claim-gems", {
        method: "POST",
      }),
    ...options,
  });
};

// ─── Admin: Ban / Adjust balance ────────────────────────────────

export const useAdminBanUserFull = (options?: any) => {
  return useMutation<{ message: string }, Error, { userId: number; banned: boolean }>({
    mutationFn: ({ userId, banned }) =>
      customFetch<{ message: string }>(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        body: JSON.stringify({ banned }),
      }),
    ...options,
  });
};

export const useAdminAdjustBalance = (options?: any) => {
  return useMutation<{ message: string }, Error, { userId: number; gemsBalance?: number; etrBalance?: number; usdtBalance?: number }>({
    mutationFn: ({ userId, ...data }) =>
      customFetch<{ message: string }>(`/api/admin/users/${userId}/adjust-balance`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options,
  });
};

// ═══════════════════════════════════════════════════════════════════════
// ─── EIX (EthicX) — Base Currency & Ecosystem Fuel ────────────────────
// ═══════════════════════════════════════════════════════════════════════

export interface EixWallet {
  eixBalance: number;
  eixPriceUsd: number;
  powerCardPower: number;
  totalGemsContributed: number;
  totalAirdropRewards: number;
  claimableEixReferral: number;
}

export const useGetEixWallet = (options?: { query?: any }) => {
  return useQuery<EixWallet, Error>({
    queryKey: ["/api/eix/wallet"],
    queryFn: () => customFetch<EixWallet>("/api/eix/wallet"),
    ...options?.query,
  });
};

export interface EixDepositAddress {
  id: number;
  address: string;
  label: string;
  network: string;
}

export const useGetEixDepositAddresses = (options?: { query?: any }) => {
  return useQuery<EixDepositAddress[], Error>({
    queryKey: ["/api/eix/deposit-addresses"],
    queryFn: () => customFetch<EixDepositAddress[]>("/api/eix/deposit-addresses"),
    ...options?.query,
  });
};

export interface EixDepositHistoryItem {
  id: number;
  currency: string;
  amountCrypto: number | null;
  amountUsd: number;
  eixAmount: number;
  status: string;
  txHash: string | null;
  assignedAddress: string | null;
  hasScreenshot: boolean;
  createdAt: string;
  approvedAt: string | null;
}

export const useGetEixDeposits = (options?: { query?: any }) => {
  return useQuery<EixDepositHistoryItem[], Error>({
    queryKey: ["/api/eix/deposits"],
    queryFn: () => customFetch<EixDepositHistoryItem[]>("/api/eix/deposits"),
    ...options?.query,
  });
};

export interface CreateEixDeposit {
  currency: string;
  amountUsd: number;
  amountCrypto?: number;
  txHash?: string;
  screenshotData?: string;
  assignedAddress?: string;
}

export const useCreateEixDeposit = (options?: any) => {
  return useMutation<{ id: number; currency: string; amountUsd: number; eixAmount: number; status: string; createdAt: string }, Error, CreateEixDeposit>({
    mutationFn: (data) =>
      customFetch("/api/eix/deposits", { method: "POST", body: JSON.stringify(data) }),
    ...options,
  });
};

export const useDeleteEixDepositScreenshot = (options?: any) => {
  return useMutation<{ message: string }, Error, { id: number }>({
    mutationFn: ({ id }) =>
      customFetch<{ message: string }>(`/api/eix/deposits/${id}/screenshot`, { method: "DELETE" }),
    ...options,
  });
};

export const useClaimEixReferral = (options?: any) => {
  return useMutation<{ claimedEix: number; newEixBalance: number }, Error, void>({
    mutationFn: () =>
      customFetch<{ claimedEix: number; newEixBalance: number }>("/api/eix/referrals/claim", { method: "POST" }),
    ...options,
  });
};

export interface EixReferralRewardItem {
  id: number;
  refereeUserId: number;
  eixAmount: number;
  reason: string;
  isClaimed: boolean;
  createdAt: string;
}

export const useGetEixReferrals = (options?: { query?: any }) => {
  return useQuery<EixReferralRewardItem[], Error>({
    queryKey: ["/api/eix/referrals"],
    queryFn: () => customFetch<EixReferralRewardItem[]>("/api/eix/referrals"),
    ...options?.query,
  });
};

// ═══════════════════════════════════════════════════════════════════════
// ─── Power Cards ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export interface PowerCardCatalogItem {
  id: number;
  code: string;
  name: string;
  description: string;
  powerValue: number;
  eixCost: number;
  upgradeEixCost: number;
  maxUpgradeLevel: number;
  tier: string;
  imageUrl: string | null;
}

export const useGetPowerCards = (options?: { query?: any }) => {
  return useQuery<PowerCardCatalogItem[], Error>({
    queryKey: ["/api/power-cards"],
    queryFn: () => customFetch<PowerCardCatalogItem[]>("/api/power-cards"),
    ...options?.query,
  });
};

export interface OwnedPowerCard {
  id: number;
  cardId: number;
  upgradeLevel: number;
  unlockedAt: string;
  code: string;
  name: string;
  description: string;
  powerValue: number;
  eixCost: number;
  upgradeEixCost: number;
  maxUpgradeLevel: number;
  tier: string;
  imageUrl: string | null;
  currentPower: number;
}

export interface MyPowerCards {
  totalPower: number;
  cardCount: number;
  cards: OwnedPowerCard[];
}

export const useGetMyPowerCards = (options?: { query?: any }) => {
  return useQuery<MyPowerCards, Error>({
    queryKey: ["/api/power-cards/mine"],
    queryFn: () => customFetch<MyPowerCards>("/api/power-cards/mine"),
    ...options?.query,
  });
};

export const useUnlockPowerCard = (options?: any) => {
  return useMutation<{ message: string; cardId: number; upgradeLevel: number; newEixBalance: number; ownedId: number }, Error, { id: number }>({
    mutationFn: ({ id }) =>
      customFetch(`/api/power-cards/${id}/unlock`, { method: "POST" }),
    ...options,
  });
};

export const useUpgradePowerCard = (options?: any) => {
  return useMutation<{ message: string; ownedId: number; newUpgradeLevel: number; newPower: number; newEixBalance: number }, Error, { ownedId: number }>({
    mutationFn: ({ ownedId }) =>
      customFetch(`/api/power-cards/owned/${ownedId}/upgrade`, { method: "POST" }),
    ...options,
  });
};

// ═══════════════════════════════════════════════════════════════════════
// ─── Global Airdrop System ────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════

export interface AirdropProjectSummary {
  id: number;
  name: string;
  tokenSymbol: string;
  tokenName: string;
  totalSupply: number;
  communityAllocationPct: number;
  communityAllocationAmount: number;
  rewardPerBlock: number;
  epochHours: number;
  description: string;
  logoUrl: string | null;
  website: string | null;
  chain: string;
  currentBlockNumber: number;
  createdAt: string;
}

export const useGetAirdropProjects = (options?: { query?: any }) => {
  return useQuery<AirdropProjectSummary[], Error>({
    queryKey: ["/api/airdrop/projects"],
    queryFn: () => customFetch<AirdropProjectSummary[]>("/api/airdrop/projects"),
    ...options?.query,
  });
};

export interface AirdropBlockInfo {
  id: number;
  blockNumber: number;
  startsAt: string;
  endsAt: string;
  rewardAmount: number;
  totalGems: number;
}

export interface AirdropProjectDetail extends Omit<AirdropProjectSummary, "currentBlockNumber" | "createdAt"> {
  currentBlock: AirdropBlockInfo;
  myContribution: number;
  mySharePct: number;
  projectedReward: number;
}

export const useGetAirdropProject = (id: number, options?: { query?: any }) => {
  return useQuery<AirdropProjectDetail, Error>({
    queryKey: ["/api/airdrop/projects", id],
    queryFn: () => customFetch<AirdropProjectDetail>(`/api/airdrop/projects/${id}`),
    ...options?.query,
  });
};

export interface AirdropBlockHistoryItem {
  id: number;
  blockNumber: number;
  status: string;
  startsAt: string;
  endsAt: string;
  rewardAmount: number;
  totalGems: number;
  closedAt: string | null;
}

export const useGetAirdropBlocks = (id: number, options?: { query?: any }) => {
  return useQuery<AirdropBlockHistoryItem[], Error>({
    queryKey: ["/api/airdrop/projects", id, "blocks"],
    queryFn: () => customFetch<AirdropBlockHistoryItem[]>(`/api/airdrop/projects/${id}/blocks`),
    ...options?.query,
  });
};

export const useContributeGems = (options?: any) => {
  return useMutation<{ message: string; contributedGems: number; newGemsBalance: number }, Error, { id: number; gems: number }>({
    mutationFn: ({ id, gems }) =>
      customFetch(`/api/airdrop/projects/${id}/contribute`, { method: "POST", body: JSON.stringify({ gems }) }),
    ...options,
  });
};

export interface AirdropRewardItem {
  id: number;
  projectId: number;
  projectName: string | null;
  tokenSymbol: string;
  rewardAmount: number;
  gemsSharePct: number;
  isClaimed: boolean;
  distributedAt: string;
  claimedAt: string | null;
}

export const useGetMyAirdropRewards = (options?: { query?: any }) => {
  return useQuery<AirdropRewardItem[], Error>({
    queryKey: ["/api/airdrop/my-rewards"],
    queryFn: () => customFetch<AirdropRewardItem[]>("/api/airdrop/my-rewards"),
    ...options?.query,
  });
};

export interface GemContributionItem {
  id: number;
  projectId: number;
  projectName: string | null;
  tokenSymbol: string | null;
  gemsAmount: number;
  contributedAt: string;
}

export const useGetMyContributions = (options?: { query?: any }) => {
  return useQuery<GemContributionItem[], Error>({
    queryKey: ["/api/airdrop/my-contributions"],
    queryFn: () => customFetch<GemContributionItem[]>("/api/airdrop/my-contributions"),
    ...options?.query,
  });
};

export const useClaimAirdropReward = (options?: any) => {
  return useMutation<{ message: string; tokenSymbol: string; rewardAmount: number }, Error, { id: number }>({
    mutationFn: ({ id }) =>
      customFetch(`/api/airdrop/rewards/${id}/claim`, { method: "POST" }),
    ...options,
  });
};

// ─── Public Project Application ──────────────────────────────────────

export interface ProjectApplicationInput {
  teamName: string;
  contactEmail: string;
  projectName: string;
  tokenSymbol: string;
  tokenName: string;
  totalSupply: number;
  communityAllocationPct: number;
  rewardPerBlock: number;
  epochHours?: number;
  description?: string;
  website?: string;
  chain?: string;
}

export const useSubmitProjectApplication = (options?: any) => {
  return useMutation<{ id: number; status: string; message: string }, Error, ProjectApplicationInput>({
    mutationFn: (data) =>
      customFetch("/api/projects/apply", { method: "POST", body: JSON.stringify(data) }),
    ...options,
  });
};

// ═══════════════════════════════════════════════════════════════════════
// ─── Admin: EIX / Power Cards / Airdrop Projects ──────────────────────
// ═══════════════════════════════════════════════════════════════════════

export interface AdminEixDeposit {
  id: number;
  userId: number;
  username: string;
  currency: string;
  amountCrypto: number | null;
  amountUsd: number;
  eixAmount: number;
  status: string;
  txHash: string | null;
  assignedAddress: string | null;
  hasScreenshot: boolean;
  screenshotData: string | null;
  createdAt: string;
  approvedAt: string | null;
}

export const useAdminGetEixDeposits = (options?: { query?: any }) => {
  return useQuery<AdminEixDeposit[], Error>({
    queryKey: ["/api/admin/eix-deposits"],
    queryFn: () => customFetch<AdminEixDeposit[]>("/api/admin/eix-deposits"),
    ...options?.query,
  });
};

export const useAdminGetEixScreenshot = (options?: any) => {
  return useMutation<{ screenshotData: string | null }, Error, { id: number }>({
    mutationFn: ({ id }) =>
      customFetch<{ screenshotData: string | null }>(`/api/admin/eix-deposits/${id}/screenshot`),
    ...options,
  });
};

export const useAdminApproveEixDeposit = (options?: any) => {
  return useMutation<{ message: string }, Error, { id: number }>({
    mutationFn: ({ id }) =>
      customFetch<{ message: string }>(`/api/admin/eix-deposits/${id}/approve`, { method: "POST" }),
    ...options,
  });
};

export const useAdminRejectEixDeposit = (options?: any) => {
  return useMutation<{ message: string }, Error, { id: number }>({
    mutationFn: ({ id }) =>
      customFetch<{ message: string }>(`/api/admin/eix-deposits/${id}/reject`, { method: "POST" }),
    ...options,
  });
};

export interface AdminPowerCard {
  id: number;
  code: string;
  name: string;
  description: string;
  powerValue: number;
  eixCost: number;
  upgradeEixCost: number;
  maxUpgradeLevel: number;
  tier: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export const useAdminGetPowerCards = (options?: { query?: any }) => {
  return useQuery<AdminPowerCard[], Error>({
    queryKey: ["/api/admin/power-cards"],
    queryFn: () => customFetch<AdminPowerCard[]>("/api/admin/power-cards"),
    ...options?.query,
  });
};

export const useAdminCreatePowerCard = (options?: any) => {
  return useMutation<AdminPowerCard, Error, Partial<AdminPowerCard>>({
    mutationFn: (data) =>
      customFetch<AdminPowerCard>("/api/admin/power-cards", { method: "POST", body: JSON.stringify(data) }),
    ...options,
  });
};

export const useAdminUpdatePowerCard = (options?: any) => {
  return useMutation<AdminPowerCard, Error, { id: number; [k: string]: any }>({
    mutationFn: ({ id, ...data }) =>
      customFetch<AdminPowerCard>(`/api/admin/power-cards/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    ...options,
  });
};

export const useAdminDeletePowerCard = (options?: any) => {
  return useMutation<{ message: string }, Error, { id: number }>({
    mutationFn: ({ id }) =>
      customFetch<{ message: string }>(`/api/admin/power-cards/${id}`, { method: "DELETE" }),
    ...options,
  });
};

export interface AdminProjectApplication {
  id: number;
  teamName: string;
  contactEmail: string;
  projectName: string;
  tokenSymbol: string;
  tokenName: string;
  totalSupply: number;
  communityAllocationPct: number;
  rewardPerBlock: number;
  epochHours: number;
  description: string;
  website: string | null;
  chain: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
}

export const useAdminGetApplications = (options?: { query?: any }) => {
  return useQuery<AdminProjectApplication[], Error>({
    queryKey: ["/api/admin/applications"],
    queryFn: () => customFetch<AdminProjectApplication[]>("/api/admin/applications"),
    ...options?.query,
  });
};

export const useAdminApproveApplication = (options?: any) => {
  return useMutation<{ message: string; projectId: number }, Error, { id: number }>({
    mutationFn: ({ id }) =>
      customFetch<{ message: string; projectId: number }>(`/api/admin/applications/${id}/approve`, { method: "POST" }),
    ...options,
  });
};

export const useAdminRejectApplication = (options?: any) => {
  return useMutation<{ message: string }, Error, { id: number }>({
    mutationFn: ({ id }) =>
      customFetch<{ message: string }>(`/api/admin/applications/${id}/reject`, { method: "POST" }),
    ...options,
  });
};

export interface AdminAirdropProject {
  id: number;
  name: string;
  tokenSymbol: string;
  tokenName: string;
  totalSupply: number;
  communityAllocationPct: number;
  communityAllocationAmount: number;
  rewardPerBlock: number;
  epochHours: number;
  status: string;
  description: string;
  logoUrl: string | null;
  website: string | null;
  chain: string;
  applicationId: number | null;
  currentBlockNumber: number;
  createdAt: string;
}

export const useAdminGetAirdropProjects = (options?: { query?: any }) => {
  return useQuery<AdminAirdropProject[], Error>({
    queryKey: ["/api/admin/projects"],
    queryFn: () => customFetch<AdminAirdropProject[]>("/api/admin/projects"),
    ...options?.query,
  });
};

export const useAdminCreateAirdropProject = (options?: any) => {
  return useMutation<AdminAirdropProject, Error, { [k: string]: any }>({
    mutationFn: (data) =>
      customFetch<AdminAirdropProject>("/api/admin/projects", { method: "POST", body: JSON.stringify(data) }),
    ...options,
  });
};

export const useAdminUpdateAirdropProject = (options?: any) => {
  return useMutation<AdminAirdropProject, Error, { id: number; [k: string]: any }>({
    mutationFn: ({ id, ...data }) =>
      customFetch<AdminAirdropProject>(`/api/admin/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    ...options,
  });
};

export const useAdminDeleteAirdropProject = (options?: any) => {
  return useMutation<{ message: string }, Error, { id: number }>({
    mutationFn: ({ id }) =>
      customFetch<{ message: string }>(`/api/admin/projects/${id}`, { method: "DELETE" }),
    ...options,
  });
};
