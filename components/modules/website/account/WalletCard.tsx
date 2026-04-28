"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { usePayOS } from "@payos/payos-checkout";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  History,
  Info,
  Landmark,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BankSelect from "./BankSelect";
import OtpActionModal from "./OtpActionModal";
import Loading from "../../custom/Loading";
import Toast from "../../custom/Toast";

type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  bankName?: string | null;
  bankAccount?: string | null;
  accountHolder?: string | null;
  feeAmount?: number | null;
  amountNet?: number | null;
  rejectReason?: string | null;
};

type SavedBankAccount = {
  id: number;
  bankName: string;
  bankAccount: string;
  bankAccountHolder: string;
  isDefault: boolean;
};

type WalletData = {
  balance: number;
  email?: string;
  bankInfo?: {
    bankName: string;
    bankAccount: string;
    bankAccountHolder: string;
    isConfigured: boolean;
  };
  bankAccounts?: SavedBankAccount[];
  transactions: WalletTransaction[];
};

type WalletConfig = {
  feePercent: number;
};

type WalletPanel = "history" | "deposit" | "withdraw";
const MIN_WITHDRAW_AMOUNT = 50000;

const DEPOSIT_DENOMINATIONS = [
  { value: 10000, label: "10K" },
  { value: 20000, label: "20K" },
  { value: 50000, label: "50K" },
  { value: 100000, label: "100K" },
  { value: 200000, label: "200K" },
  { value: 500000, label: "500K" },
  { value: 1000000, label: "1M" },
  { value: 2000000, label: "2M" },
  { value: 5000000, label: "5M" },
  { value: 10000000, label: "10M" },
];

function makeIdempotencyKey() {
  return `dep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function maskBankAccount(value: string) {
  const account = value.trim();
  if (account.length <= 6) return account;
  return `${account.slice(0, 3)}******${account.slice(-3)}`;
}

function formatVND(amount: number) {
  return amount.toLocaleString("vi-VN");
}

export default function WalletCard() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [withdrawOtpOpen, setWithdrawOtpOpen] = useState(false);
  const [walletConfig, setWalletConfig] = useState<WalletConfig | null>(null);

  const { language } = useSelector((state: IRootState) => state.settings);

  const savedBanks = useMemo(() => wallet?.bankAccounts || [], [wallet?.bankAccounts]);

  const currentPanel: WalletPanel = showDeposit ? "deposit" : showWithdraw ? "withdraw" : "history";
  const availableBalance = Number(wallet?.balance || 0);
  const canOpenWithdraw = !wallet || (availableBalance >= MIN_WITHDRAW_AMOUNT && savedBanks.length > 0);
  const feePercent = walletConfig?.feePercent ?? 1;
  const feeMultiplier = feePercent / 100;
  const withdrawBlockedMessage =
    savedBanks.length === 0
      ? t(language, "walletNoBankAccount")
      : availableBalance <= 0
      ? t(language, "walletNoBalanceWithdraw")
      : t(language, "walletMinWithdraw").replace("{{amount}}", `${MIN_WITHDRAW_AMOUNT.toLocaleString(language === "vi" ? "vi-VN" : "en-US")}đ`);

  const applySavedBank = useCallback((bank: SavedBankAccount) => {
    setBankName(bank.bankName || "");
    setBankAccount(bank.bankAccount || "");
    setAccountHolder(bank.bankAccountHolder || "");
  }, []);

  const activatePanel = useCallback((panel: WalletPanel, syncHash = true, silent = false) => {
    if (panel === "withdraw" && wallet) {
      if (savedBanks.length === 0) {
        setShowDeposit(false);
        setShowWithdraw(false);
        if (!silent) {
toast.custom(<Toast message={t(language, "walletNoBankAccount")} status="error" />);
        }
        if (syncHash && typeof window !== "undefined") {
          window.history.replaceState(null, "", window.location.pathname);
        }
        return;
      }
      if (availableBalance < MIN_WITHDRAW_AMOUNT) {
        setShowDeposit(false);
        setShowWithdraw(false);
        if (!silent) {
          toast.custom(<Toast message={withdrawBlockedMessage} status="error" />);
        }
        if (syncHash && typeof window !== "undefined") {
          window.history.replaceState(null, "", window.location.pathname);
        }
        return;
      }
    }

    if (panel === "deposit") {
      setShowDeposit(true);
      setShowWithdraw(false);
    } else if (panel === "withdraw") {
      setShowWithdraw(true);
      setShowDeposit(false);
    } else {
      setShowDeposit(false);
      setShowWithdraw(false);
    }

    if (!syncHash || typeof window === "undefined") {
      return;
    }

    const nextHash = panel === "history" ? "" : `#${panel}`;
    window.history.replaceState(null, "", `${window.location.pathname}${nextHash}`);
  }, [availableBalance, wallet, savedBanks, withdrawBlockedMessage]);

  const syncPanelFromHash = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hash = window.location.hash.replace("#", "").trim().toLowerCase();
    if (hash === "deposit") {
      activatePanel("deposit", false, true);
      return;
    }

    if (hash === "withdraw") {
      activatePanel("withdraw", false, true);
      return;
    }

    activatePanel("history", false, true);
  }, [activatePanel]);

  const loadWallet = useCallback(async () => {
    setLoading(true);
    try {
      const [walletRes, configRes] = await Promise.all([
        axios.get("/api/wallet"),
        axios.get("/api/wallet/fee"),
      ]);
      const data = (walletRes.data?.data || null) as WalletData | null;
      const config = (configRes.data?.data || null) as WalletConfig | null;
      setWallet(data);
      setWalletConfig(config);

      if (data?.bankInfo) {
        setBankName(data.bankInfo.bankName || "");
        setBankAccount(data.bankInfo.bankAccount || "");
        setAccountHolder(data.bankInfo.bankAccountHolder || "");
      }

      if (!data?.bankInfo?.isConfigured && Array.isArray(data?.bankAccounts) && data.bankAccounts.length > 0) {
        const defaultBank = data.bankAccounts.find((item) => item.isDefault) || data.bankAccounts[0];
        applySavedBank(defaultBank);
      }
    } catch {
      toast.custom(<Toast message={t(language, "walletLoadFail")} status="error" />);
    } finally {
      setLoading(false);
    }
  }, [applySavedBank]);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    syncPanelFromHash();
    window.addEventListener("hashchange", syncPanelFromHash);
    return () => window.removeEventListener("hashchange", syncPanelFromHash);
  }, [syncPanelFromHash]);

  useEffect(() => {
    if (!loading && wallet && currentPanel === "withdraw") {
      if (savedBanks.length === 0 || availableBalance < MIN_WITHDRAW_AMOUNT) {
        activatePanel("history", true, true);
      }
    }
  }, [activatePanel, availableBalance, currentPanel, loading, wallet, savedBanks.length]);

  const stats = useMemo(() => {
    const transactions = wallet?.transactions || [];
    const totalDeposit = transactions
      .filter((item) => item.amount > 0)
      .reduce((sum, item) => sum + item.amount, 0);

    const pendingWithdraw = transactions
      .filter((item) => item.type.startsWith("withdraw_request") && item.status === "pending")
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);

    const totalWithdrawn = transactions
      .filter((item) => item.amount < 0 && ["completed", "approved", "success"].includes(item.status))
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);

    return {
      balance: Number(wallet?.balance || 0),
      totalDeposit,
      pendingWithdraw,
      totalWithdrawn,
      transactionCount: transactions.length,
    };
  }, [wallet?.balance, wallet?.transactions]);

  const handleDeposit = async () => {
    const amount = Number(depositAmount);
    if (!amount || amount < 10000) {
      toast.custom(<Toast message={t(language, "walletMinDeposit")} status="error" />);
      return;
    }

    setSubmitting(true);
    try {
      const returnUrl = `${window.location.origin}/account/wallet#deposit`;
      const response = await axios.post("/api/wallet/deposit", {
        amount,
        returnUrl,
        idempotencyKey: makeIdempotencyKey(),
      });

      const checkoutUrl = response.data?.checkoutUrl || response.data?.data?.checkoutUrl;
      if (checkoutUrl) {
        const { open } = usePayOS({
          RETURN_URL: returnUrl,
          ELEMENT_ID: "payos-checkout-iframe",
          CHECKOUT_URL: checkoutUrl,
          onSuccess: (event) => {
            toast.custom(<Toast message={t(language, "walletDepositSuccess")} status="success" />);
            setDepositAmount("");
            activatePanel("history");
            void loadWallet();
          },
          onCancel: (event) => {
            toast.custom(<Toast message={t(language, "walletDepositFail") || "Đã hủy nạp tiền"} status="error" />);
          },
          onExit: (event) => {
            // User closed the popup
          }
        });
        open();
        return;
      }

      toast.custom(<Toast message={t(language, "walletDepositSuccess")} status="success" />);
      setDepositAmount("");
      activatePanel("history");
      await loadWallet();
    } catch (error) {
      const responseData = (error as { response?: { data?: Record<string, any> } })?.response?.data;
      const payosDetail =
        String(responseData?.details?.payos?.desc || "").trim() ||
        String(responseData?.details?.payos?.message || "").trim() ||
        String(responseData?.details?.payos?.error || "").trim();
      const fallbackMessage = String(responseData?.message || "").trim();

      toast.custom(
        <Toast
          message={payosDetail || fallbackMessage || t(language, "walletDepositFail")}
          status="error"
        />
      );
    } finally {
      setSubmitting(false);
    }
  };

  const validateWithdrawData = () => {
    if (availableBalance < MIN_WITHDRAW_AMOUNT) {
      toast.custom(<Toast message={withdrawBlockedMessage} status="error" />);
      return false;
    }

    const amount = Number(withdrawAmount);
    if (!amount || amount < MIN_WITHDRAW_AMOUNT) {
toast.custom(
            <Toast
              message={t(language, "walletMinWithdraw").replace("{{amount}}", `${MIN_WITHDRAW_AMOUNT.toLocaleString(language === "vi" ? "vi-VN" : "en-US")}đ`)}
              status="error"
            />
          );
      return false;
    }

    if (amount > availableBalance) {
toast.custom(
            <Toast
              message={`${t(language, "walletInsufficientBalance")}. ${t(language, "walletCurrentBalance")}: ${availableBalance.toLocaleString(language === "vi" ? "vi-VN" : "en-US")}đ`}
              status="error"
            />
          );
      return false;
    }

    if (savedBanks.length === 0) {
      toast.custom(<Toast message={t(language, "walletNoBankAccount")} status="error" />);
      return false;
    }

    const isSavedAccount = savedBanks.some(
      (b) => b.bankAccount === bankAccount.trim() && b.bankName === bankName.trim()
    );
    if (!isSavedAccount) {
      toast.custom(<Toast message={t(language, "walletSelectSavedBank")} status="error" />);
      return false;
    }

    if (!bankAccount.trim() || !bankName.trim() || !accountHolder.trim()) {
      toast.custom(<Toast message={t(language, "walletSelectBank")} status="error" />);
      return false;
    }

    if (!wallet?.email?.trim()) {
      toast.custom(<Toast message={t(language, "profileEmailNotFoundOtp")} status="error" />);
      return false;
    }

    return true;
  };

  const openWithdrawOtp = () => {
    if (!validateWithdrawData()) {
      return;
    }

    setWithdrawOtpOpen(true);
  };

  const submitWithdrawWithOtp = async (otpCode: string) => {
    const amount = Number(withdrawAmount);
    const isSavedAccount = savedBanks.some(
      (b) => b.bankAccount === bankAccount.trim() && b.bankName === bankName.trim()
    );
    if (!isSavedAccount || !bankAccount.trim() || !bankName.trim() || !accountHolder.trim()) {
      return false;
    }

    setSubmitting(true);
    try {
      const response = await axios.post("/api/wallet/withdraw", {
        amount,
        bankAccount: bankAccount.trim(),
        bankName: bankName.trim(),
        accountHolder: accountHolder.trim(),
        otpCode,
      });

      toast.custom(
        <Toast
          message={response.data?.message || t(language, "walletWithdrawRequested")}
          status="success"
        />
      );

      setWithdrawAmount("");
      setWithdrawOtpOpen(false);
      activatePanel("history");
      await loadWallet();
      return true;
    } catch (error) {
      toast.custom(
        <Toast
          message={
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            t(language, "walletWithdrawFail")
          }
          status="error"
        />
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    if (
      type.startsWith("deposit") ||
      type.startsWith("order_payment_received") ||
      type.startsWith("withdraw_refund")
    ) {
      return <ArrowDownLeft className="h-4 w-4 text-emerald-600" />;
    }

    if (type.startsWith("withdraw")) {
      return <ArrowUpRight className="h-4 w-4 text-rose-600" />;
    }

    if (type.startsWith("product_bump")) {
      return <TrendingUp className="h-4 w-4 text-blue-600" />;
    }

    return <Wallet className="h-4 w-4 text-gray-600" />;
  };

  const getTransactionLabel = (type: string) => {
    if (type.startsWith("deposit")) return t(language, "txTypeDeposit");
    if (type.startsWith("withdraw_request")) return t(language, "txTypeWithdrawRequest");
    if (type.startsWith("withdraw_refund")) return t(language, "txTypeWithdrawRefund");
    if (type.startsWith("withdraw")) return t(language, "txTypeWithdraw");
    if (type.startsWith("order_payment_received")) return t(language, "txTypeOrderPaymentReceived");
    if (type.startsWith("order_payment")) return t(language, "txTypeOrderPayment");
    if (type.startsWith("purchase_pending_hold")) return t(language, "txTypePurchasePendingHold");
    if (type.startsWith("purchase_completed")) return t(language, "txTypePurchaseCompleted");
    if (type.startsWith("purchase_refunded")) return t(language, "txTypePurchaseRefunded");
    if (type.startsWith("admin_deposit")) return t(language, "txTypeAdminDeposit");
    if (type.startsWith("admin_deduct")) return t(language, "txTypeAdminDeduct");
    if (type.startsWith("product_bump")) return t(language, "txTypeProductBump");
    if (type.startsWith("vip_subscription")) return t(language, "txTypeVipSubscription");
    if (type.startsWith("purchase_cancelled")) return t(language, "txTypePurchaseCancelled");
    return type;
  };

  const getStatusLabel = (status: string) => {
    if (["completed", "success", "approved"].includes(status)) return t(language, "txStatusCompleted");
    if (status === "pending") return t(language, "txStatusPending");
    if (status === "rejected") return t(language, "txStatusRejected");
    if (status === "cancelled") return t(language, "txStatusCancelled");
    return t(language, "txStatusFailed");
  };

  const getStatusClass = (status: string) => {
    if (["completed", "success", "approved"].includes(status)) return "text-emerald-600 bg-emerald-50";
    if (status === "pending") return "text-amber-600 bg-amber-50";
    if (status === "rejected" || status === "cancelled") return "text-slate-500 bg-slate-50";
    return "text-rose-600 bg-rose-50";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Loading isLoading={loading} />
      </div>
    );
  }

  return (
    <>
      <div id="payos-checkout-iframe"></div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* ───────── WALLET HEADER ───────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 p-6 text-white">
          {/* Decorative elements */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-emerald-50">{t(language, "walletTitle")}</span>
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight break-all">{formatVND(stats.balance)}đ</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t(language, "walletSecurityNote")}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={submitting}
                onClick={() => activatePanel(currentPanel === "deposit" ? "history" : "deposit")}
                className={cn(
                  "group flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold shadow-lg transition-all duration-200",
                  currentPanel === "deposit"
                    ? "bg-white text-emerald-700 shadow-white/30 hover:bg-emerald-50"
                    : "bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                  currentPanel === "deposit" ? "bg-emerald-100" : "bg-white/20"
                )}>
                  <Plus className="h-4 w-4" />
                </div>
                {t(language, "walletDeposit")}
              </button>

              <button
                type="button"
                disabled={submitting || !canOpenWithdraw}
                onClick={() => activatePanel(currentPanel === "withdraw" ? "history" : "withdraw")}
                className={cn(
                  "group flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold shadow-lg transition-all duration-200",
                  currentPanel === "withdraw"
                    ? "bg-white text-amber-700 shadow-white/30 hover:bg-amber-50"
                    : "bg-white/20 text-white backdrop-blur-sm hover:bg-white/30",
                  !canOpenWithdraw && "cursor-not-allowed opacity-50"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                  currentPanel === "withdraw" ? "bg-amber-100" : "bg-white/20"
                )}>
                  <Minus className="h-4 w-4" />
                </div>
                {t(language, "walletWithdraw")}
              </button>
            </div>
          </div>

          {!canOpenWithdraw && (
            <div className="relative mt-3 rounded-xl bg-white/10 px-4 py-2 text-xs text-amber-100 backdrop-blur-sm">
              <Info className="mr-1.5 inline h-3.5 w-3.5" />
              {withdrawBlockedMessage}
            </div>
          )}
        </div>

        {/* ───────── STATS ROW ───────── */}
        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white p-3 sm:p-4 lg:grid-cols-4">
          {[
            { label: t(language, "walletTotalDeposit"), value: stats.totalDeposit, color: "text-emerald-600", icon: <ArrowDownLeft className="h-4 w-4" /> },
            { label: t(language, "walletPendingWithdraw"), value: stats.pendingWithdraw, color: "text-amber-600", icon: <Clock3 className="h-4 w-4" /> },
            { label: t(language, "walletCompletedWithdraw"), value: stats.totalWithdrawn, color: "text-rose-600", icon: <ArrowUpRight className="h-4 w-4" /> },
            { label: t(language, "walletTotalTransactions"), value: stats.transactionCount, color: "text-primary-600", icon: <History className="h-4 w-4" />, isCurrency: false },
          ].map((stat, idx) => {
            const display = stat.isCurrency === false ? String(stat.value) : `${formatVND(stat.value)}đ`;
            return (
              <div key={idx} className="group min-w-0 rounded-2xl border border-slate-100 bg-white p-3 sm:p-4 transition-all duration-200 hover:border-slate-200 hover:shadow-md">
                <div className="mb-2 flex items-center gap-2">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50", stat.color)}>
                    {stat.icon}
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate">{stat.label}</p>
                <p
                  className={cn("mt-1 text-sm sm:text-base lg:text-lg font-bold truncate", stat.color)}
                  title={display}
                >
                  {display}
                </p>
              </div>
            );
          })}
        </div>

        {/* ───────── TAB BAR ───────── */}
        <div className="border-b border-slate-100 bg-white px-4 py-3">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50/80 p-1">
            {[
              { key: "history" as WalletPanel, label: t(language, "walletHistoryTab"), icon: <History className="h-4 w-4" />, disabled: false },
              { key: "deposit" as WalletPanel, label: t(language, "walletDepositTab"), icon: <Plus className="h-4 w-4" />, disabled: false },
              { key: "withdraw" as WalletPanel, label: t(language, "walletWithdrawTab"), icon: <Minus className="h-4 w-4" />, disabled: !canOpenWithdraw },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                disabled={tab.disabled}
                onClick={() => activatePanel(tab.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                  currentPanel === tab.key
                    ? "bg-white text-primary-700 shadow-md shadow-slate-200/50"
                    : "text-slate-500 hover:text-slate-800",
                  tab.disabled && "cursor-not-allowed opacity-40"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ───────── DEPOSIT PANEL ───────── */}
        {currentPanel === "deposit" && (
          <div className="border-b border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 p-6">
            {/* Header */}
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-200">
                <CreditCard className="h-7 w-7 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">{t(language, "walletDepositTitle")}</h4>
                <p className="mt-0.5 text-sm text-slate-500">
                  {t(language, "walletDepositDesc")}
                </p>
              </div>
              <div className="ml-auto hidden items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 sm:flex">
                <Zap className="h-3.5 w-3.5 text-emerald-700" />
                <span className="text-xs font-semibold text-emerald-700">{t(language, "walletAutoCredit")}</span>
              </div>
            </div>

            {/* Denomination Grid */}
            <div className="mb-5">
              <p className="mb-3 text-sm font-semibold text-slate-700">{t(language, "walletQuickDenomination")}</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {DEPOSIT_DENOMINATIONS.map((denom) => {
                  const isSelected = depositAmount === String(denom.value);
                  return (
                    <button
                      key={denom.value}
                      type="button"
                      onClick={() => setDepositAmount(String(denom.value))}
                      className={cn(
                        "group relative flex flex-col items-center justify-center rounded-2xl border-2 px-3 py-4 text-center transition-all duration-200",
                        isSelected
                          ? "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100"
                          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute -right-1.5 -top-1.5">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        </div>
                      )}
                      <span className={cn(
                        "text-lg font-extrabold transition-colors",
                        isSelected ? "text-emerald-700" : "text-slate-800 group-hover:text-emerald-700"
                      )}>
                        {denom.label}
                      </span>
                      <span className={cn(
                        "mt-0.5 text-[11px] transition-colors",
                        isSelected ? "text-emerald-600" : "text-slate-400"
                      )}>
                        {formatVND(denom.value)}đ
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Amount + Submit */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-2 text-sm font-semibold text-slate-700">{t(language, "walletCustomAmount")}</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    min={10000}
                    step={1000}
                    placeholder={t(language, "walletEnterAmount")}
                    value={depositAmount}
                    onChange={(event) => setDepositAmount(event.target.value)}
                    className="h-14 rounded-xl border-slate-200 bg-slate-50 pl-4 pr-12 text-lg font-bold text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">{t(language, "walletVND")}</span>
                </div>
                <Button
                  onClick={handleDeposit}
                  disabled={submitting || !depositAmount}
                  className="h-14 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-8 text-base font-bold shadow-lg shadow-emerald-200 transition-all hover:from-emerald-700 hover:to-teal-600 hover:shadow-xl disabled:opacity-50 sm:min-w-52"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {t(language, "processingLabel")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      {t(language, "walletDepositButton")} {depositAmount ? `${formatVND(Number(depositAmount))}đ` : t(language, "walletDepositMoney")}
                    </span>
                  )}
                </Button>
              </div>

              {/* Info badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {t(language, "walletMinDepositBadge")}
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t(language, "walletPayOSSecurity")}
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs text-purple-700">
                  <Zap className="h-3.5 w-3.5" />
                  {t(language, "walletInstantCredit")}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────── WITHDRAW PANEL ───────── */}
        {currentPanel === "withdraw" && (
          <div className="border-b border-amber-100 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/30 p-6">
            {/* Header */}
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-200">
                <Banknote className="h-7 w-7 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">{t(language, "walletWithdrawToBank")}</h4>
                <p className="mt-0.5 text-sm text-slate-500">
                  {t(language, "walletWithdrawManualDesc")}
                </p>
              </div>
            </div>

            {!canOpenWithdraw ? (
              <div className="rounded-2xl border border-amber-200 bg-white p-6 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                  <Landmark className="h-8 w-8 text-amber-400" />
                </div>
                <p className="text-sm font-semibold text-amber-700">{withdrawBlockedMessage}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {t(language, "walletDepositFirst")}
                </p>
                <div className="mt-4">
                  <Button type="button" onClick={() => activatePanel("deposit")} className="rounded-xl px-6">
                    <Plus className="mr-1.5 h-4 w-4" />
                    {t(language, "walletDepositNow")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Process Steps */}
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                  {[
                    { step: 1, label: t(language, "profileStepInputInfo") },
                    { step: 2, label: t(language, "profileOtpVerify") },
                    { step: 3, label: t(language, "walletStepAdmin") },
                  ].map((s, idx) => (
                    <React.Fragment key={s.step}>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-xs font-bold text-white shadow-sm">
                          {s.step}
                        </div>
                        <span className="hidden text-xs font-medium text-slate-600 sm:inline">{s.label}</span>
                      </div>
                      {idx < 2 && <ChevronRight className="h-4 w-4 text-slate-300" />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Bank Account Info */}
                {savedBanks.length > 0 ? (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs text-emerald-700">
                    <BadgeCheck className="h-4 w-4" />
                    {t(language, "walletSelectSavedBankNote")}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
                    <Landmark className="h-4 w-4" />
                    {t(language, "walletNoBankSaved")}{" "}
                    <Link href="/account/bank" className="font-semibold hover:underline">
                      {t(language, "walletAddAccount")}
                    </Link>{" "}
                    {t(language, "walletToWithdraw")}
                  </div>
                )}

                {/* Saved Banks Quick Select */}
                {savedBanks.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="mb-3 text-sm font-semibold text-slate-700">{t(language, "walletQuickSelectBank")}</p>
                    <div className="flex flex-wrap gap-2">
                      {savedBanks.map((item) => {
                        const isActive = item.bankAccount === bankAccount && item.bankName === bankName;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => applySavedBank(item)}
                            className={cn(
                              "flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all duration-200",
                              isActive
                                ? "border-primary-500 bg-primary-50 text-primary-700 shadow-md shadow-primary-100"
                                : "border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:bg-primary-50/50"
                            )}
                          >
                            <Landmark className={cn("h-4 w-4", isActive ? "text-primary-600" : "text-slate-400")} />
                            <span>{item.bankName} • {maskBankAccount(item.bankAccount)}</span>
{item.isDefault && (
                                <span className="rounded-md bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold text-primary-700">
                                  {t(language, "walletDefault")}
                                </span>
                            )}
                            {isActive && <CheckCircle2 className="h-4 w-4 text-primary-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Withdraw Form */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  {savedBanks.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 py-6 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                        <Landmark className="h-8 w-8 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{t(language, "walletNoBankAccountWithdraw")}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {t(language, "walletAddBankAtProfile")}{" "}
                          <Link href="/account/bank" className="font-semibold text-primary-600 hover:underline">
                            {t(language, "walletBankProfile")}
                          </Link>{" "}
                          {t(language, "walletBeforeWithdraw")}
                        </p>
                      </div>
                      <Link
                        href="/account/bank"
                        className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
                      >
                        <Landmark className="h-4 w-4" />
                        {t(language, "walletAddBankAccountBtn")}
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Amount */}
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t(language, "walletWithdrawAmountLabel")}</label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={MIN_WITHDRAW_AMOUNT}
                            max={availableBalance}
                            step={1000}
                            placeholder={`${t(language, "walletMinimum")} ${formatVND(MIN_WITHDRAW_AMOUNT)}đ`}
                            value={withdrawAmount}
                            onChange={(event) => setWithdrawAmount(event.target.value)}
                            className="h-14 rounded-xl border-slate-200 bg-slate-50 pl-4 pr-12 text-lg font-bold text-slate-900 placeholder:text-sm placeholder:font-normal placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                          />
<span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">{t(language, "walletVND")}</span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <p className="text-xs text-slate-400">{t(language, "walletWithdrawFee")}: {feePercent}%</p>
                          <button
                            type="button"
                            onClick={() => setWithdrawAmount(String(availableBalance))}
                            className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline"
                          >
                            {t(language, "walletWithdrawMax")}: {formatVND(availableBalance)}đ
                          </button>
                        </div>
                      </div>

                      {/* Account Number - Readonly, selected from saved */}
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t(language, "walletAccountNumber")}</label>
                        <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-base font-medium text-slate-500">
                          <Landmark className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
                          {bankAccount ? (
                            <span className="text-slate-700">{bankAccount}</span>
                          ) : (
                            <span className="text-slate-400">{t(language, "walletNotSelectedBank")}</span>
                          )}
                        </div>
                      </div>

                      {/* Account Holder - Readonly */}
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t(language, "walletAccountHolderLabel")}</label>
                        <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-base font-medium text-slate-500">
                          <Landmark className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
                          {accountHolder ? (
                            <span className="uppercase text-slate-700">{accountHolder}</span>
                          ) : (
                            <span className="text-slate-400">{t(language, "walletNotSelectedBank")}</span>
                          )}
                        </div>
                      </div>

                      {/* Withdraw Summary */}
                      {withdrawAmount && Number(withdrawAmount) >= MIN_WITHDRAW_AMOUNT && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                          <p className="mb-2 text-xs font-semibold text-amber-700">{t(language, "walletWithdrawSummary")}</p>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-600">{t(language, "walletWithdrawAmountLabel")}</span>
                              <span className="font-bold text-slate-900">{formatVND(Number(withdrawAmount))}đ</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">{t(language, "walletFeeLabel")} ({feePercent}%)</span>
                              <span className="font-medium text-rose-600">-{formatVND(Math.round(Number(withdrawAmount) * feeMultiplier))}đ</span>
                            </div>
                            <div className="border-t border-amber-200 pt-1">
                              <div className="flex justify-between">
                                <span className="font-semibold text-slate-700">{t(language, "walletNetLabel")}</span>
                                <span className="text-lg font-extrabold text-emerald-600">
                                  {formatVND(Math.round(Number(withdrawAmount) * (1 - feeMultiplier)))}đ
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Submit */}
                      <Button
                        onClick={openWithdrawOtp}
                        disabled={submitting || !bankAccount.trim()}
                        className="h-14 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-base font-bold shadow-lg shadow-amber-200 transition-all hover:from-amber-600 hover:to-orange-600 hover:shadow-xl disabled:opacity-50"
                      >
                        {submitting ? (
                          <span className="flex items-center gap-2">
<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              {t(language, "processingLabel")}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
<ShieldCheck className="h-5 w-5" />
                              {t(language, "walletOtpAndSubmitWithdraw")}
                          </span>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Safety info */}
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                  <div className="text-xs text-slate-500">
                    <p className="mb-1 font-semibold text-slate-600">{t(language, "walletSecurityWithdrawTitle")}</p>
                    <p>{t(language, "walletSecurityWithdrawDesc")}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ───────── TRANSACTION HISTORY ───────── */}
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <History className="h-5 w-5 text-slate-400" />
              {t(language, "walletTransactionHistory")}
            </h4>
            {wallet?.transactions && wallet.transactions.length > 0 && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {wallet.transactions.length} {t(language, "walletTransactionUnit")}
              </span>
            )}
          </div>

          {wallet?.transactions && wallet.transactions.length > 0 ? (
            <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
              {wallet.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="group flex items-start justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 transition-all duration-200 hover:border-slate-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
                      tx.amount >= 0 ? "bg-emerald-50" : "bg-rose-50"
                    )}>
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{getTransactionLabel(tx.type)}</p>

                      {/* Withdrawal details */}
                      {tx.type.startsWith("withdraw") && (
                        <div className="mt-1 space-y-0.5">
                          {tx.bankName && tx.bankAccount && (
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">
                              {tx.bankName} • {tx.bankAccount}
                            </p>
                          )}
                          {tx.feeAmount != null && tx.amountNet != null && (
                            <p className="text-xs text-slate-400">
                              {t(language, "txWithdrawAmount")} {Math.abs(tx.amount).toLocaleString("vi-VN")}đ · {t(language, "txWithdrawFee")} {tx.feeAmount.toLocaleString("vi-VN")}đ · {t(language, "txWithdrawNet")} <span className="font-medium text-emerald-600">{tx.amountNet.toLocaleString("vi-VN")}đ</span>
                            </p>
                          )}
                          {tx.status === "rejected" && tx.rejectReason && (
                            <p className="text-xs text-rose-500">{t(language, "txRejectReason")}: {tx.rejectReason}</p>
                          )}
                          {tx.status === "pending" && tx.feeAmount != null && (
                            <p className="text-xs text-amber-500">{t(language, "txWithdrawNet")} ({t(language, "txWithdrawPending")}): {tx.amountNet?.toLocaleString("vi-VN")}đ</p>
                          )}
                        </div>
                      )}

                      {/* Deposit details */}
                      {tx.type.startsWith("deposit") && tx.status === "completed" && (
                        <p className="text-xs text-emerald-500 mt-0.5">{t(language, "txDepositSuccess")}</p>
                      )}

                      {/* VIP subscription */}
                      {tx.type.startsWith("vip_subscription") && (
                        <p className="text-xs text-slate-400 mt-0.5">{t(language, "txVipSubscription")}</p>
                      )}

                      {/* Product bump */}
                      {tx.type.startsWith("product_bump") && (
                        <p className="text-xs text-slate-400 mt-0.5">{t(language, "txProductBumpFee")}</p>
                      )}

                      <p className="text-xs text-slate-400 mt-1">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <p
                      className={cn(
                        "text-sm font-bold",
                        tx.amount >= 0 ? "text-emerald-600" : "text-rose-600"
                      )}
                    >
                      {tx.amount >= 0 ? "+" : ""}
                      {tx.amount.toLocaleString("vi-VN")}đ
                    </p>
                    <span className={cn(
                      "inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold mt-1",
                      getStatusClass(tx.status)
                    )}>
                      {getStatusLabel(tx.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-gradient-to-b from-slate-50 to-white p-10 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                <Wallet className="h-10 w-10 text-slate-300" />
              </div>
              <p className="text-base font-semibold text-slate-600">{t(language, "walletNoTransactions")}</p>
              <p className="mt-1 text-sm text-slate-400">{t(language, "walletDepositToStart")}</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  onClick={() => activatePanel("deposit")}
                  className="h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 font-bold shadow-lg shadow-emerald-200"
                >
                  <Banknote className="mr-1.5 h-4 w-4" />
                  {t(language, "walletDepositNow")}
                </Button>
                <Link
                  href="/products"
                  className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-primary-600"
                >
                  {t(language, "walletBuyProducts")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <OtpActionModal
        open={withdrawOtpOpen}
        email={String(wallet?.email || "")}
        purpose="withdraw_request"
        title={t(language, "walletOtpWithdrawTitle")}
        description={t(language, "walletOtpWithdrawDescFull")}
        confirmLabel={t(language, "walletOtpWithdrawConfirm")}
        onClose={() => setWithdrawOtpOpen(false)}
        onConfirm={submitWithdrawWithOtp}
      />
    </>
  );
}
