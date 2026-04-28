"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import {
  BadgeCheck,
  Building2,
  Check,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  IdCard,
  ImagePlus,
  KeyRound,
  Landmark,
  Loader2,
  ShieldCheck,
  Store,
  Trash2,
  Upload,
  UserCircle2,
  X,
} from "lucide-react";
import { User as TUser } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BankSelect from "./BankSelect";
import OtpActionModal from "./OtpActionModal";
import Toast from "../../custom/Toast";
import { useSelector } from "react-redux";
import { IRootState } from "@/store";
import { t } from "@/lib/i18n";
import { LanguageCode } from "@/store/settingsSlice";

type ProfileSection = "account" | "bank" | "kyc";
type OtpPurpose = "change_password" | "bank_link" | "withdraw_request";
type SellerStatus = "not_submitted" | "pending" | "approved" | "rejected";

type BankAccountItem = {
  id: number;
  bankName: string;
  bankAccount: string;
  bankAccountHolder: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type KycSubmission = {
  id: number;
  fullName: string;
  documentType: string;
  documentNumber: string;
  documentFrontUrl: string;
  documentBackUrl: string | null;
  selfieUrl: string | null;
  status: SellerStatus;
  adminNote: string | null;
  createdAt: string;
};

type OtpModalState = {
  open: boolean;
  email: string;
  purpose: OtpPurpose;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (otpCode: string) => Promise<boolean>;
};

const DEFAULT_OTP_MODAL: OtpModalState = {
  open: false,
  email: "",
  purpose: "change_password",
  title: "",
  description: "",
  confirmLabel: "",
  onConfirm: async () => false,
};

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;

function maskBankAccount(account: string) {
  const clean = account.trim();
  if (clean.length <= 6) return clean;
  return `${clean.slice(0, 3)}******${clean.slice(-3)}`;
}

function getStatusMeta(status: SellerStatus, language: LanguageCode) {
  if (status === "approved") {
    return {
      label: t(language, "profileKycVerified"),
      className: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    };
  }

  if (status === "pending") {
    return {
      label: t(language, "profileKycPending"),
      className: "bg-amber-100 text-amber-700 border border-amber-200",
    };
  }

  if (status === "rejected") {
    return {
      label: t(language, "profileKycRejected"),
      className: "bg-rose-100 text-rose-700 border border-rose-200",
    };
  }

  return {
    label: t(language, "profileKycNotSubmitted"),
    className: "bg-slate-100 text-slate-700 border border-slate-200",
  };
}

export default function Profile({
  user,
  section = "account",
}: {
  user: TUser;
  section?: ProfileSection;
}) {
  const userId = Number(user?._id || 0);
  const { language } = useSelector((state: IRootState) => state.settings);
  const [name, setName] = useState(String(user?.name || ""));
  const [email, setEmail] = useState(String(user?.email || "").trim().toLowerCase());
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const [bankLoading, setBankLoading] = useState(section === "bank");
  const [bankSubmitting, setBankSubmitting] = useState(false);
  const [bankEmail, setBankEmail] = useState(String(user?.email || "").trim().toLowerCase());
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);
  const [bankName, setBankName] = useState(String(user?.bankInfo?.bankName || ""));
  const [bankAccount, setBankAccount] = useState(String(user?.bankInfo?.bankAccount || ""));
  const [bankAccountHolder, setBankAccountHolder] = useState(
    String(user?.bankInfo?.bankAccountHolder || "")
  );
  const [setDefaultAfterAdd, setSetDefaultAfterAdd] = useState(
    !(user?.bankAccounts && user.bankAccounts.length > 0)
  );

  const [kycLoading, setKycLoading] = useState(section === "kyc");
  const [sellerSubmitting, setSellerSubmitting] = useState(false);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [sellerStatus, setSellerStatus] = useState<SellerStatus>(
    (user?.sellerVerification?.status as SellerStatus) || "not_submitted"
  );
  const [kycLatest, setKycLatest] = useState<KycSubmission | null>(null);
  const [fullName, setFullName] = useState(String(user?.name || ""));
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentFrontUrl, setDocumentFrontUrl] = useState("");
  const [documentBackUrl, setDocumentBackUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");

  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);

  const [otpModal, setOtpModal] = useState<OtpModalState>(DEFAULT_OTP_MODAL);

  const roleLabel = useMemo(() => {
    const normalizedRole = String(user?.role || "user").trim().toLowerCase();
    if (normalizedRole === "admin") return t(language, "profileRoleAdmin");
    return t(language, "profileRoleMember");
  }, [user?.role, language]);

  const statusMeta = useMemo(() => getStatusMeta(sellerStatus, language), [sellerStatus, language]);

  const defaultBank = useMemo(() => {
    if (bankAccounts.length === 0) return null;
    return bankAccounts.find((item) => item.isDefault) || bankAccounts[0];
  }, [bankAccounts]);

  const openOtpModal = (payload: Omit<OtpModalState, "open">) => {
    setOtpModal({ ...payload, open: true });
  };

  const closeOtpModal = () => {
    setOtpModal(DEFAULT_OTP_MODAL);
  };

  const handleKycUpload = async (
    file: File,
    setUrl: (url: string) => void,
    setUploading: (v: boolean) => void
  ) => {
    setUploading(true);
    try {
      // Upload trực tiếp lên server (server proxy lên R2 - tránh CORS)
      const uploadForm = new FormData();
      uploadForm.append("file", file);
      uploadForm.append("folder", "kyc");
      const uploadRes = await axios.post("/api/upload-direct", uploadForm);
      const uploadedUrl = uploadRes.data?.data?.publicUrl;

      if (!uploadedUrl) {
        toast.custom(<Toast message={uploadRes.data?.message || t(language, "profileUploadFail")} status="error" />);
        return;
      }
      setUrl(uploadedUrl);
    } catch {
      toast.custom(<Toast message={t(language, "profileUploadImageFail")} status="error" />);
    } finally {
      setUploading(false);
    }
  };

  const handleKycFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setUrl: (url: string) => void,
    setUploading: (v: boolean) => void
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void handleKycUpload(file, setUrl, setUploading);
  };

  const loadBankData = useCallback(async () => {
    setBankLoading(true);
    try {
      const response = await axios.get("/api/account/bank");
      const data = response.data?.data || {};

      const nextAccounts: BankAccountItem[] = Array.isArray(data?.accounts)
        ? data.accounts.map((item: any) => ({
            id: Number(item?.id || 0),
            bankName: String(item?.bankName || ""),
            bankAccount: String(item?.bankAccount || ""),
            bankAccountHolder: String(item?.bankAccountHolder || ""),
            isDefault: Boolean(item?.isDefault),
            createdAt: item?.createdAt,
            updatedAt: item?.updatedAt,
          }))
        : [];

      setBankAccounts(nextAccounts.filter((item) => item.id > 0));
      setBankEmail(String(data?.email || user?.email || "").trim().toLowerCase());

      if (nextAccounts.length === 0) {
        setSetDefaultAfterAdd(true);
      }
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t(language, "profileBankLoadFail");
      toast.custom(<Toast message={message} status="error" />);
    } finally {
      setBankLoading(false);
    }
  }, [user?.email]);

  const loadKycData = useCallback(async () => {
    setKycLoading(true);

    try {
      const [sellerResponse, kycResponse] = await Promise.all([
        axios.get("/api/seller/verification"),
        axios.get("/api/kyc"),
      ]);

      const sellerData = sellerResponse.data?.data;
      const kycData = kycResponse.data?.data as KycSubmission | null;

      const nextStatus =
        (sellerData?.status as SellerStatus | undefined) ||
        ((user?.sellerVerification?.status as SellerStatus | undefined) ?? "not_submitted");

      setSellerStatus(nextStatus);
      setKycLatest(kycData || null);

      if (kycData) {
        setFullName(String(kycData.fullName || user?.name || ""));
        setDocumentNumber(String(kycData.documentNumber || ""));
        setDocumentFrontUrl(String(kycData.documentFrontUrl || ""));
        setDocumentBackUrl(String(kycData.documentBackUrl || ""));
        setSelfieUrl(String(kycData.selfieUrl || ""));
      }
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t(language, "profileKycLoadFail");
      toast.custom(<Toast message={message} status="error" />);
    } finally {
      setKycLoading(false);
    }
  }, [user?.name, user?.sellerVerification?.status]);

  useEffect(() => {
    if (section === "bank") {
      void loadBankData();
    }
  }, [section, loadBankData]);

  useEffect(() => {
    if (section === "kyc") {
      void loadKycData();
    }
  }, [section, loadKycData]);

  const submitProfile = async (otpCode = "") => {
    if (!Number.isFinite(userId) || userId <= 0) {
      toast.custom(<Toast message={t(language, "profileUserNotFound")} status="error" />);
      return false;
    }

    setProfileSubmitting(true);
    try {
      const response = await axios.put("/api/account/profile", {
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: newPassword.trim(),
        otpCode,
      });

      toast.custom(
        <Toast message={response.data?.message || t(language, "profileUpdateSuccess")} status="success" />
      );

      setNewPassword("");
      setConfirmPassword("");
      return true;
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t(language, "profileUpdateFail");
      toast.custom(<Toast message={message} status="error" />);
      return false;
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.custom(<Toast message={t(language, "profileFillNameEmail")} status="error" />);
      return;
    }

    const hasPasswordChange = newPassword.trim().length > 0 || confirmPassword.trim().length > 0;

    if (!hasPasswordChange) {
      await submitProfile();
      return;
    }

    if (!PASSWORD_RULE.test(newPassword.trim())) {
      toast.custom(
        <Toast
          message={t(language, "profileNewPasswordMin")}
          status="error"
        />
      );
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      toast.custom(<Toast message={t(language, "profileConfirmMismatch")} status="error" />);
      return;
    }

    openOtpModal({
      email: String(user?.email || "").trim().toLowerCase(),
      purpose: "change_password",
      title: t(language, "profileOtpChangePassword"),
      description:
        t(language, "profileOtpChangePasswordDesc"),
      confirmLabel: "Xác thực và đổi mật khẩu",
      onConfirm: async (otpCode: string) => submitProfile(otpCode),
    });
  };

  const handleAddBank = async () => {
    if (!bankName.trim() || !bankAccount.trim() || !bankAccountHolder.trim()) {
      toast.custom(<Toast message={t(language, "profileFillBankInfo")} status="error" />);
      return;
    }

    if (!bankEmail.trim()) {
      toast.custom(<Toast message={t(language, "profileEmailNotFoundOtp")} status="error" />);
      return;
    }

    openOtpModal({
      email: bankEmail,
      purpose: "bank_link",
      title: t(language, "profileOtpAddBank"),
      description:
        t(language, "profileOtpAddBankDesc"),
      confirmLabel: t(language, "profileVerifyAndSaveBank"),
      onConfirm: async (otpCode: string) => {
        setBankSubmitting(true);
        try {
          const response = await axios.post("/api/account/bank", {
            bankName: bankName.trim(),
            bankAccount: bankAccount.trim(),
            bankAccountHolder: bankAccountHolder.trim(),
            setDefault: setDefaultAfterAdd,
            otpCode,
          });

          toast.custom(
            <Toast
              message={response.data?.message || t(language, "profileBankSaveSuccess")}
              status="success"
            />
          );

          setBankAccount("");
          setBankAccountHolder("");
          if (setDefaultAfterAdd) {
            setSetDefaultAfterAdd(false);
          }

          await loadBankData();
          return true;
        } catch (error) {
          const message =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            t(language, "profileBankSaveFail");
          toast.custom(<Toast message={message} status="error" />);
          return false;
        } finally {
          setBankSubmitting(false);
        }
      },
    });
  };

  const handleSetDefaultBank = async (accountId: number) => {
    if (!accountId) {
      return;
    }

    setBankSubmitting(true);
    try {
      const response = await axios.patch("/api/account/bank", {
        action: "set_default",
        accountId,
      });

      toast.custom(
        <Toast message={response.data?.message || t(language, "profileDefaultBankUpdated")} status="success" />
      );

      await loadBankData();
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t(language, "profileDefaultBankFail");
      toast.custom(<Toast message={message} status="error" />);
    } finally {
      setBankSubmitting(false);
    }
  };

  const handleRegisterSeller = async () => {
    if (!fullName.trim() || !documentNumber.trim() || !documentFrontUrl.trim()) {
      toast.custom(
        <Toast message={t(language, "profileFillKycRequired")} status="error" />
      );
      return;
    }

    setSellerSubmitting(true);
    try {
      // Step 1: Register seller profile
      await axios.post("/api/seller/verification");

      // Step 2: Submit KYC
      await axios.post("/api/kyc", {
        fullName: fullName.trim(),
        documentType: "cccd",
        documentNumber: documentNumber.trim(),
        documentFrontUrl: documentFrontUrl.trim(),
        documentBackUrl: documentBackUrl.trim() || null,
        selfieUrl: selfieUrl.trim() || null,
      });

      toast.custom(
        <Toast message={t(language, "profileSellerRegisterSuccess")} status="success" />
      );
      await loadKycData();
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t(language, "profileSellerRegisterFail");
      toast.custom(<Toast message={message} status="error" />);
    } finally {
      setSellerSubmitting(false);
    }
  };

  const handleSubmitKyc = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!fullName.trim() || !documentNumber.trim() || !documentFrontUrl.trim()) {
      toast.custom(<Toast message={t(language, "profileFillKycFields")} status="error" />);
      return;
    }

    setKycSubmitting(true);
    try {
      const response = await axios.post("/api/kyc", {
        fullName: fullName.trim(),
        documentType: "cccd",
        documentNumber: documentNumber.trim(),
        documentFrontUrl: documentFrontUrl.trim(),
        documentBackUrl: documentBackUrl.trim() || null,
        selfieUrl: selfieUrl.trim() || null,
      });

      toast.custom(<Toast message={response.data?.message || t(language, "profileKycSubmitSuccess")} status="success" />);
      await loadKycData();
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t(language, "profileKycSubmitFail");
      toast.custom(<Toast message={message} status="error" />);
    } finally {
      setKycSubmitting(false);
    }
  };

  const renderAccountSection = () => {
    return (
      <div className="space-y-4">
        <form onSubmit={handleSaveProfile} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-2">
            <UserCircle2 className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-slate-900">{t(language, "profileAccountInfo")}</h3>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t(language, "profileFullNameLabel")}</label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t(language, "profileFullNamePlaceholder")}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t(language, "profileLoginEmail")}</label>
              <div className="flex h-11 items-center rounded-lg border border-slate-200 bg-slate-100 px-4">
                <span className="text-sm font-medium text-slate-700">{email || "—"}</span>
              </div>
              <p className="text-xs text-slate-500">Email bảo mật dùng để nhận OTP cho đổi mật khẩu, ngân hàng, rút tiền.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t(language, "profileNewPasswordChange")}</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder={t(language, "profileEnterNewPassword")}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t(language, "profileConfirmNewPassword")}</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={t(language, "profileConfirmNewPasswordPlaceholder")}
                className="h-11"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={profileSubmitting} className="h-11 px-5">
              {profileSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t(language, "profileSaveProfile")}
            </Button>
            <Link
              href="/forgot-password"
              className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <KeyRound className="mr-1 h-4 w-4" />
              {t(language, "profileForgotPasswordOtp")}
            </Link>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            {t(language, "profileOtpSecurityNote")}
          </div>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900 mb-3">{t(language, "profileQuickNav")}</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link
              href="/account/bank"
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition-colors hover:border-primary-200 hover:bg-primary-50"
            >
              {t(language, "profileBankInfoTitle")}
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/account/kyc"
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition-colors hover:border-primary-200 hover:bg-primary-50"
            >
              {t(language, "profileKycTitle")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const renderBankSection = () => {
    if (bankLoading) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-center gap-2 py-10 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t(language, "profileLoadingBanks")}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Landmark className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-slate-900">{t(language, "profileDefaultWithdrawBank")}</h3>
          </div>

          {defaultBank ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold">{defaultBank.bankName}</p>
              <p className="mt-1">{maskBankAccount(defaultBank.bankAccount)} • {defaultBank.bankAccountHolder}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">{t(language, "profileNoDefaultBank")}</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-slate-900">{t(language, "profileSavedBanksList")}</h3>
          </div>

          {bankAccounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              {t(language, "profileNoSavedBanks")}
            </div>
          ) : (
            <div className="space-y-2">
              {bankAccounts.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.bankName}</p>
                    <p className="text-sm text-slate-600">{maskBankAccount(item.bankAccount)} • {item.bankAccountHolder}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.isDefault ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {t(language, "profileSetDefault")}
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={bankSubmitting}
                        onClick={() => void handleSetDefaultBank(item.id)}
                      >
                        {t(language, "profileMakeDefault")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-slate-900">{t(language, "profileAddNewBank")}</h3>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="text-sm font-medium text-slate-700 mb-2 block">{t(language, "profileBankName")}</label>
              <BankSelect value={bankName} onChange={setBankName} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">{t(language, "profileBankAccountNumber")}</label>
              <Input
                value={bankAccount}
                onChange={(event) => setBankAccount(event.target.value)}
                placeholder={t(language, "profileBankAccountPlaceholder")}
                className="h-12"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">{t(language, "profileBankHolderName")}</label>
              <Input
                value={bankAccountHolder}
                onChange={(event) => setBankAccountHolder(event.target.value)}
                placeholder={t(language, "profileBankHolderPlaceholder")}
                className="h-12"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={setDefaultAfterAdd}
              onChange={(event) => setSetDefaultAfterAdd(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            {t(language, "profileSetDefaultAfterAdd")}
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" disabled={bankSubmitting} onClick={() => void handleAddBank()} className="h-11 px-5">
              {bankSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t(language, "profileVerifyAndSaveBank")}
            </Button>
            <p className="text-xs text-slate-500">{t(language, "profileOtpAddBankNote")}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderKycSection = () => {
    if (kycLoading) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-center gap-2 py-10 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t(language, "profileLoadingData")}
          </div>
        </div>
      );
    }

    const isApproved = sellerStatus === "approved";
    const isPending = sellerStatus === "pending";
    const isRejected = sellerStatus === "rejected";
    const isNotSubmitted = sellerStatus === "not_submitted";

    return (
      <div className="space-y-4">
        {/* Header Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
              <Store className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Đăng ký bán hàng</h2>
              <p className="text-sm text-slate-500">Hoàn tất đăng ký và xác minh để bắt đầu bán hàng trên hệ thống</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              !isNotSubmitted ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
            }`}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold">
                {!isNotSubmitted ? <Check className="h-3 w-3" /> : "1"}
              </span>
              {t(language, "profileStepInputInfo")}
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              isApproved ? "bg-emerald-100 text-emerald-700" : isPending ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
            }`}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold">
                {isApproved ? <Check className="h-3 w-3" /> : "2"}
              </span>
              {t(language, "profileStepAdminReview")}
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              isApproved ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold">
                {isApproved ? <Check className="h-3 w-3" /> : "3"}
              </span>
              {t(language, "profileStepStartSelling")}
            </div>
          </div>

          {/* Status Banner */}
          {isApproved && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-emerald-800 flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> {t(language, "profileAccountApproved")}</span>
              </div>
              <p className="mt-1 text-sm text-emerald-700">
                {t(language, "profileAccountApprovedDesc")}
              </p>
            </div>
          )}

          {isPending && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2">
                <CircleAlert className="h-5 w-5 text-amber-600" />
                <span className="font-semibold text-amber-800">{t(language, "profilePendingReview")}</span>
              </div>
              <p className="mt-1 text-sm text-amber-700">
                {t(language, "profilePendingReviewDesc")}
              </p>
            </div>
          )}

          {isRejected && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-center gap-2">
                <CircleAlert className="h-5 w-5 text-rose-600" />
                <span className="font-semibold text-rose-800">{t(language, "profileRejected")}</span>
              </div>
              <p className="mt-1 text-sm text-rose-700">
                Hồ sơ đăng ký bán hàng của bạn đã bị từ chối. Vui lòng kiểm tra lại thông tin và gửi lại.
              </p>
              {kycLatest?.adminNote && (
                <p className="mt-2 text-sm text-rose-800 font-medium">
                  {t(language, "profileRejectionReason")} {kycLatest.adminNote}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Registration Form - show when not approved or rejected (can resubmit) */}
        {(isNotSubmitted || isRejected) && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <IdCard className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-900">Thông tin đăng ký bán hàng</h3>
            </div>

            <p className="text-sm text-slate-600 -mt-2">
              Điền đầy đủ thông tin bên dưới và gửi đăng ký. Admin sẽ xét duyệt hồ sơ của bạn trước khi bạn có thể bắt đầu bán hàng.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Họ và tên đầy đủ <span className="text-rose-500">*</span></label>
                <Input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="h-11"
                />
                <p className="text-xs text-slate-400">Trùng khớp với tên trên CCCD/CMND</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Số CCCD/CMND <span className="text-rose-500">*</span></label>
                <Input
                  value={documentNumber}
                  onChange={(event) => setDocumentNumber(event.target.value)}
                  placeholder="001234567890"
                  className="h-11"
                />
                <p className="text-xs text-slate-400">12 số trên căn cước công dân</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Ảnh mặt trước CCCD */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Ảnh mặt trước CCCD <span className="text-rose-500">*</span>
                </label>
                {documentFrontUrl ? (
                  <div className="relative w-full max-w-xs rounded-xl border border-slate-200 overflow-hidden">
                    <Image src={documentFrontUrl} alt="Mặt trước CCCD" className="w-full h-40 object-cover" width={320} height={160} />
                    <button
                      type="button"
                      onClick={() => setDocumentFrontUrl("")}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-slate-600 hover:bg-white hover:text-rose-600 shadow transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full max-w-xs h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploadingFront ? (
                        <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
                      ) : (
                        <Upload className="h-8 w-8 text-slate-400 mb-2" />
                      )}
                      <p className="text-sm text-slate-500">
                        {uploadingFront ? t(language, "profileUploading") : t(language, "profileClickToSelectImage")}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{t(language, "profileImageFormatNote")}</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleKycFileChange(e, setDocumentFrontUrl, setUploadingFront)}
                    />
                  </label>
                )}
                <p className="text-xs text-slate-400">{t(language, "profileFrontIdTip")}</p>
              </div>

              {/* Ảnh mặt sau CCCD */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  {t(language, "profileBackIdLabel")} <span className="text-slate-400">{t(language, "profileOptionalLabel")}</span>
                </label>
                {documentBackUrl ? (
                  <div className="relative w-full max-w-xs rounded-xl border border-slate-200 overflow-hidden">
                    <Image src={documentBackUrl} alt="Mặt sau CCCD" className="w-full h-40 object-cover" width={320} height={160} />
                    <button
                      type="button"
                      onClick={() => setDocumentBackUrl("")}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-slate-600 hover:bg-white hover:text-rose-600 shadow transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full max-w-xs h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploadingBack ? (
                        <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
                      ) : (
                        <ImagePlus className="h-8 w-8 text-slate-400 mb-2" />
                      )}
                      <p className="text-sm text-slate-500">
                        {uploadingBack ? t(language, "profileUploading") : t(language, "profileClickToSelectImage")}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{t(language, "profileImageFormatNote")}</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleKycFileChange(e, setDocumentBackUrl, setUploadingBack)}
                    />
                  </label>
                )}
              </div>

              {/* Ảnh selfie */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  {t(language, "profileSelfieIdLabel")} <span className="text-slate-400">{t(language, "profileOptionalLabel")}</span>
                </label>
                {selfieUrl ? (
                  <div className="relative w-full max-w-xs rounded-xl border border-slate-200 overflow-hidden">
                    <Image src={selfieUrl} alt="Selfie" className="w-full h-40 object-cover" width={320} height={160} />
                    <button
                      type="button"
                      onClick={() => setSelfieUrl("")}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-slate-600 hover:bg-white hover:text-rose-600 shadow transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full max-w-xs h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploadingSelfie ? (
                        <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
                      ) : (
                        <UserCircle2 className="h-8 w-8 text-slate-400 mb-2" />
                      )}
                      <p className="text-sm text-slate-500">
                        {uploadingSelfie ? t(language, "profileUploading") : t(language, "profileClickToSelectImage")}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{t(language, "profileImageFormatNote")}</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleKycFileChange(e, setSelfieUrl, setUploadingSelfie)}
                    />
                  </label>
                )}
                <p className="text-xs text-slate-400">{t(language, "profileSelfieIdTip")}</p>
              </div>
            </div>

            <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4 text-sm text-indigo-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5"><ClipboardList className="h-4 w-4" /> {t(language, "profileImportantNote")}:</p>
              <ul className="list-disc list-inside space-y-0.5 text-indigo-700">
              <li>Ảnh CCCD sẽ được xóa tự động sau khi admin duyệt hoặc từ chối để bảo vệ dữ liệu</li>
                <li>Hồ sơ sẽ được xét duyệt trong vòng 1-24 giờ làm việc</li>
                <li>Sau khi duyệt, bạn mới có thể đăng bán sản phẩm trên hệ thống</li>
                <li>Mọi giao dịch bán hàng đều được bảo vệ bởi hệ thống escrow</li>
              </ul>
            </div>

            <Button
              type="button"
              disabled={sellerSubmitting}
              onClick={() => void handleRegisterSeller()}
              className="h-12 px-6 text-base"
            >
              {sellerSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Store className="mr-2 h-4 w-4" />}
              {sellerSubmitting ? t(language, "profileSendingRegistration") : t(language, "profileSubmitRegistration")}
            </Button>
          </div>
        )}

        {/* KYC History - show when pending */}
        {isPending && kycLatest && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <IdCard className="h-5 w-5 text-slate-600" />
              <h3 className="text-base font-semibold text-slate-900">{t(language, "profileSubmittedInfo")}</h3>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-2">
              <p><span className="font-medium">{t(language, "profileFullNameColon")}</span> {kycLatest.fullName}</p>
              <p><span className="font-medium">{t(language, "profileIdNumberColon")}</span> {kycLatest.documentNumber}</p>
              <p><span className="font-medium">{t(language, "profileSubmittedDateColon")}</span> {new Date(kycLatest.createdAt).toLocaleString("vi-VN")}</p>
              <p><span className="font-medium">{t(language, "profileStatusColon")}</span> <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span></p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 p-5 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src={
                user?.image
                  ? user.image
                  : "https://cdn-icons-png.flaticon.com/128/236/236831.png"
              }
              alt="avatar"
              width={70}
              height={70}
              className="h-[70px] w-[70px] rounded-full border border-white/40 bg-white/20"
            />
            <div>
              <p className="text-2xl font-bold leading-tight">{name || t(language, "profileUserFallback")}</p>
              <p className="text-sm text-white/90">{email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">{roleLabel}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                  {statusMeta.label}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white/10 px-3 py-2 text-xs text-white/90">
            {t(language, "profileOtpSecurityNote")}
          </div>
        </div>
      </div>

      {section === "account" ? renderAccountSection() : null}
      {section === "bank" ? renderBankSection() : null}
      {section === "kyc" ? renderKycSection() : null}



      <OtpActionModal
        open={otpModal.open}
        email={otpModal.email}
        purpose={otpModal.purpose}
        title={otpModal.title}
        description={otpModal.description}
        confirmLabel={otpModal.confirmLabel}
        onClose={closeOtpModal}
        onConfirm={otpModal.onConfirm}
      />
    </div>
  );
}
