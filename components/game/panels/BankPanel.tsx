"use client";

import { useCallback, useState } from "react";
import type { SaveState, Loan } from "@/lib/schema";
import {
  deposit,
  withdraw,
  createLoan,
  repayLoan,
} from "@/lib/economy";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast";
import { formatMoney, round2 } from "@/lib/utils";

interface BankPanelProps {
  state: SaveState;
  onUpdate: (fn: (prev: SaveState) => SaveState) => void;
  onClose: () => void;
}

export default function BankPanel({ state, onUpdate, onClose }: BankPanelProps) {
  const [transferAmount, setTransferAmount] = useState("");
  const [transferAccount, setTransferAccount] = useState<"cash" | "bank">("cash");

  const [loanAmount, setLoanAmount] = useState("");
  const [loanTerm, setLoanTerm] = useState("12");

  const [repaying, setRepaying] = useState<{ loanId: string | null; amount: string; account: "cash" | "bank" }>({
    loanId: null,
    amount: "",
    account: "bank",
  });

  const handleTransfer = useCallback(
    (type: "deposit" | "withdraw") => {
      const amount = round2(Number(transferAmount));
      if (!Number.isFinite(amount) || amount <= 0) {
        showToast({ kind: "error", message: "Enter a valid amount" });
        return;
      }
      try {
        let next: SaveState;
        if (type === "deposit") {
          if (state.player.cash < amount) throw new Error("Not enough cash.");
          next = deposit(state, amount);
          showToast({ kind: "saved", message: "Deposited " + formatMoney(amount) });
        } else {
          if (state.player.bankBalance < amount) throw new Error("Not enough bank balance.");
          next = withdraw(state, amount);
          showToast({ kind: "saved", message: "Withdrew " + formatMoney(amount) });
        }
        onUpdate(() => next);
        setTransferAmount("");
      } catch (e) {
        showToast({ kind: "error", message: e instanceof Error ? e.message : "Transfer failed" });
      }
    },
    [transferAmount, state, onUpdate]
  );

  const handleMax = useCallback(() => {
    setTransferAmount(
      transferAccount === "cash"
        ? String(state.player.cash)
        : String(state.player.bankBalance)
    );
  }, [transferAccount, state.player.cash, state.player.bankBalance]);

  const handleTakeLoan = useCallback(() => {
    const amount = round2(Number(loanAmount));
    const term = Number(loanTerm);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast({ kind: "error", message: "Enter a valid loan amount" });
      return;
    }
    try {
      const next = createLoan(state, amount, 0.09, term);
      onUpdate(() => next);
      setLoanAmount("");
      setLoanTerm("12");
      showToast({
        kind: "saved",
        message: "Loan of " + formatMoney(amount) + " received into bank",
      });
    } catch (e) {
      showToast({ kind: "error", message: e instanceof Error ? e.message : "Loan failed" });
    }
  }, [loanAmount, loanTerm, state, onUpdate]);

  const handleRepay = useCallback(() => {
    if (!repaying.loanId) return;
    const amount = round2(Number(repaying.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast({ kind: "error", message: "Enter a valid repayment amount" });
      return;
    }
    try {
      const next = repayLoan(state, repaying.loanId, amount, repaying.account);
      onUpdate(() => next);
      setRepaying({ loanId: null, amount: "", account: "bank" });
      showToast({ kind: "saved", message: "Repaid " + formatMoney(amount) });
    } catch (e) {
      showToast({ kind: "error", message: e instanceof Error ? e.message : "Repayment failed" });
    }
  }, [repaying, state, onUpdate]);

  const handleRepayFull = useCallback(
    (loan: Loan) => {
      const owed = loan.outstandingPrincipal + loan.outstandingInterest;
      if (owed <= 0) return;
      const account = state.player.bankBalance >= owed ? "bank" : "cash";
      if ((account === "bank" ? state.player.bankBalance : state.player.cash) < owed) {
        showToast({ kind: "error", message: "Not enough balance to repay in full" });
        return;
      }
      if (
        window.confirm("Repay the full outstanding amount of " + formatMoney(owed) + " for this loan?")
      ) {
        try {
          const next = repayLoan(state, loan.id, owed, account);
          onUpdate(() => next);
          showToast({ kind: "saved", message: "Loan repaid in full" });
        } catch (e) {
          showToast({ kind: "error", message: e instanceof Error ? e.message : "Repayment failed" });
        }
      }
    },
    [state, onUpdate]
  );

  const recentTx = state.transactions.slice(0, 12);

  return (
    <Panel
      title="Bank"
      subtitle="Deposits, withdrawals, loans, and repayment schedules. All amounts are virtual game currency (৳)."
      open
      onClose={onClose}
    >
      <div className="space-y-6">
        {/* Balances & transfers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-zinc-700 bg-[#12141b]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Wallet (Cash)</span>
              <span className="font-mono font-semibold text-orchid">{formatMoney(state.player.cash)}</span>
            </div>
            <div className="flex gap-2">
              <Input
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="Amount"
              />
              <Button size="sm" variant={transferAccount === "cash" ? "accent" : "outline"} onClick={() => setTransferAccount("cash")}>
                To Bank
              </Button>
              <Button size="sm" variant={transferAccount === "bank" ? "accent" : "outline"} onClick={() => setTransferAccount("bank")}>
                From Bank
              </Button>
            </div>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="ghost" onClick={handleMax} className="text-[11px]">
                Max
              </Button>
              <Button size="sm" onClick={() => handleTransfer(transferAccount === "cash" ? "deposit" : "withdraw")}>
                {transferAccount === "cash" ? "Deposit" : "Withdraw"}
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-700 bg-[#12141b]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Bank Balance</span>
              <span className="font-mono font-semibold text-glacial">{formatMoney(state.player.bankBalance)}</span>
            </div>
            <div className="text-xs text-zinc-500 mb-3">
              Loans are paid out to your bank and are a liability — not income.
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Active loans</span>
                <span className="font-mono">{state.loans.filter((l) => l.status === "active").length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Outstanding principal</span>
                <span className="font-mono text-zinc-200">
                  {formatMoney(
                    state.loans.reduce((s, l) => s + l.outstandingPrincipal, 0)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Accrued interest</span>
                <span className="font-mono text-zinc-200">
                  {formatMoney(
                    state.loans.reduce((s, l) => s + l.outstandingInterest, 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* New loan */}
        <div className="p-4 rounded-xl border border-zinc-700 bg-[#12141b]/60">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">New Loan</h3>
          <p className="text-xs text-zinc-500 mb-3">
            Interest: 9% p.a. simple interest on outstanding principal. Fictional game rate.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400">Amount (৳)</label>
              <Input value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400">Term (months)</label>
              <select
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
                className="h-10 rounded-md border border-zinc-600 bg-[#12141b] px-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-glacial"
              >
                <option value="6">6</option>
                <option value="12">12</option>
                <option value="24">24</option>
                <option value="36">36</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleTakeLoan}>
                Take Loan
              </Button>
            </div>
          </div>
        </div>

        {/* Existing loans */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-200">Your Loans</h3>
          {state.loans.length === 0 ? (
            <p className="text-xs text-zinc-500">No loans yet.</p>
          ) : (
            <div className="space-y-2">
              {state.loans.map((loan) => {
                const owed = loan.outstandingPrincipal + loan.outstandingInterest;
                return (
                  <div key={loan.id} className="p-3 rounded-lg border border-zinc-700 bg-[#12141b]">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div>
                        <div className="text-sm font-medium text-zinc-200">
                          Loan #{loan.id.slice(0, 6)}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {loan.annualRate * 100}% p.a. • {loan.termMonths} months •
                          {loan.status}
                        </div>
                      </div>
                      <Badge
                        variant={
                          loan.status === "paid"
                            ? "active"
                            : loan.status === "overdue"
                              ? "danger"
                              : "default"
                        }
                      >
                        {loan.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-zinc-500 block">Principal</span>
                        <span className="font-mono text-zinc-200">{formatMoney(loan.outstandingPrincipal)}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Accrued interest</span>
                        <span className="font-mono text-zinc-200">{formatMoney(loan.outstandingInterest)}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Total payable (orig.)</span>
                        <span className="font-mono text-zinc-200">{formatMoney(loan.totalPayable)}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Monthly installment</span>
                        <span className="font-mono text-zinc-200">{formatMoney(loan.monthlyInstallment)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[10px] text-zinc-500">Outstanding: {formatMoney(owed)}</span>
                      <div className="flex-1">
                        <Input
                          value={repaying.loanId === loan.id ? repaying.amount : ""}
                          onChange={(e) =>
                            setRepaying({
                              loanId: loan.id,
                              amount: e.target.value,
                              account: repaying.account,
                            })
                          }
                          placeholder="Amount"
                          className="h-8 text-xs"
                        />
                        <select
                          value={repaying.loanId === loan.id ? repaying.account : "bank"}
                          onChange={(e) =>
                            setRepaying({
                              loanId: loan.id,
                              amount: repaying.amount,
                              account: e.target.value as "cash" | "bank",
                            })
                          }
                          className="h-8 text-xs rounded-md border border-zinc-600 bg-[#12141b] px-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-glacial"
                        >
                          <option value="bank">Bank</option>
                          <option value="cash">Cash</option>
                        </select>
                      </div>
                      <Button size="sm" disabled={repaying.loanId !== loan.id} onClick={handleRepay} className="flex-1 text-[11px]">
                        Repay
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRepayFull(loan)} className="text-[11px] px-2">
                        Pay Full
                      </Button>
                    </div>
                    {loan.payments.length > 0 && (
                      <div className="mt-2 text-[10px] text-zinc-500">
                        {loan.payments.length} payment(s) • Last:
                        {loan.payments[loan.payments.length - 1].date.slice(0, 10)}
                      </div>
                    )}
                  </div>
                );
              }
              )}
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-200">Recent Transactions</h3>
          {recentTx.length === 0 ? (
            <p className="text-xs text-zinc-500">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-zinc-500">
                    <th className="text-left pb-1">Date</th>
                    <th className="text-left pb-1">Type</th>
                    <th className="text-left pb-1">Category</th>
                    <th className="text-right pb-1 pr-2">Amount</th>
                    <th className="text-right pb-1 pr-2">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map((tx) => (
                    <tr key={tx.id} className="border-b border-zinc-800">
                      <td className="py-1 text-zinc-400">{tx.date.slice(0, 10)}</td>
                      <td className="py-1 text-zinc-300 capitalize">{tx.type}</td>
                      <td className="py-1 text-zinc-500">{tx.category}</td>
                      <td className="py-1 text-right pr-2 font-mono">
                        {tx.type === "income" || tx.type === "loan" || tx.type === "sale" ? "+" : "−"}
                        {formatMoney(tx.amount)}
                      </td>
                      <td className="py-1 text-right pr-2 font-mono text-zinc-300">{formatMoney(tx.balanceAfter)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
