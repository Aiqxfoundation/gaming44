import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetEixDeposits } from "@workspace/api-client-react";
import { notify } from "@/lib/notify";

const EIX_WALLET_KEY = ["/api/eix/wallet"];
const POLL_INTERVAL = 5000;

// Minimal shape of the deposit items we watch — keeps this hook decoupled
// from the generated API types while staying type-safe.
interface EixDepositStatus {
  id: number;
  status: string;
  eixAmount: number;
}

/**
 * Keeps the EIX balance live across the whole app.
 *
 * When the user has pending EIX deposits, this polls the deposit history. The
 * moment a deposit transitions pending → approved (admin approval), it
 * refetches the shared EIX wallet query so every page that reads the balance
 * updates immediately, and notifies the user.
 *
 * Mounted once globally (in Layout), so it runs on every authenticated page.
 */
export function useEixBalanceSync() {
  const queryClient = useQueryClient();
  const { data: deposits } = useGetEixDeposits();
  const prevStatusRef = useRef<Record<number, string>>({});

  const depositList = (deposits ?? []) as EixDepositStatus[];
  const hasPending = depositList.some((d) => d.status === "pending");

  // Poll deposit history only while there are pending deposits.
  useEffect(() => {
    if (!hasPending) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/eix/deposits"] });
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [hasPending, queryClient]);

  // Detect pending → approved transitions and refresh the balance.
  useEffect(() => {
    if (!deposits) return;
    const prev = prevStatusRef.current;
    for (const d of depositList) {
      const prevStatus = prev[d.id];
      if (prevStatus === "pending" && d.status === "approved") {
        // Force-refetch the shared wallet query so the balance updates
        // everywhere immediately, even on pages not currently observing it.
        queryClient.refetchQueries({ queryKey: EIX_WALLET_KEY });
        notify.success(
          "EIX Purchase Approved",
          `${d.eixAmount.toFixed(2)} EIX credited to your balance.`,
        );
      }
      prev[d.id] = d.status;
    }
  }, [depositList, deposits, queryClient]);
}
