'use client';

import React, { useState, useEffect } from "react";
import apiClient from '@utilis/apiClient';
import { API_ENDPOINTS, AUTH_APP_CODE } from '@constants/api';
import { PrimaryBtn, SecondaryBtn } from "@components/Button";
import { ConfirmationPopUp } from "@components/ConfirmationPopUp";
import { useRouter } from "next/navigation";
import { safeToastError, safeToastSuccess } from "@utilis/toastHelper";
import { motion, AnimatePresence } from "framer-motion";

interface DeleteAccountFlowProps {
  onClose: () => void;
}

type DeleteFlowStep =
  | 'confirm'
  | 'checklist'
  | 'reason'
  | 'captcha'
  | 'finalPhrase'
  | 'review'
  | 'cooldown'
  | 'processing'
  | 'result';

type OperationStatus = 'pending' | 'running' | 'success' | 'failed';

interface DeletionOperation {
  key: 'revokeAccess' | 'deleteAppUser' | 'clearLocalData';
  label: string;
  required: boolean;
  status: OperationStatus;
  error?: string;
}

const FINAL_PHRASE = 'DELETE MY ACCOUNT';
const COOLDOWN_SECONDS = 8;
const REASONS = [
  'Privacy concerns',
  'Duplicate account',
  'No longer needed',
  'Moving to another product',
  'Other',
] as const;

const INITIAL_OPERATIONS: DeletionOperation[] = [
  { key: 'revokeAccess', label: 'Revoke authentication access', required: true, status: 'pending' },
  { key: 'deleteAppUser', label: 'Delete application user data', required: false, status: 'pending' },
  { key: 'clearLocalData', label: 'Clear local session data', required: true, status: 'pending' },
];

const getApiErrorMessage = (err: unknown) => {
  if (!err || typeof err !== 'object') return '';
  const r = (err as { response?: { data?: { message?: unknown } } }).response;
  const m = r?.data?.message;
  return typeof m === 'string' ? m : '';
};

const getApiErrorStatus = (err: unknown) => {
  if (!err || typeof err !== 'object') return undefined;
  return (err as { response?: { status?: number } }).response?.status;
};

export default function DeleteAccountFlow({ onClose }: DeleteAccountFlowProps) {
  const [step, setStep] = useState<DeleteFlowStep>('confirm');
  const [checklist, setChecklist] = useState({ irreversible: false, dataDeletion: false, signOutDevices: false });
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [finalPhraseInput, setFinalPhraseInput] = useState('');
  const [selectedReason, setSelectedReason] = useState<(typeof REASONS)[number] | ''>('');
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [operations, setOperations] = useState<DeletionOperation[]>(INITIAL_OPERATIONS);
  const [resultMessage, setResultMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
  const router = useRouter();

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(code);
    setCaptchaInput("");
  };

  const updateOperation = (key: DeletionOperation['key'], status: OperationStatus, errorMessage?: string) => {
    setOperations((prev) =>
      prev.map((op) => op.key === key ? { ...op, status, error: errorMessage } : op)
    );
  };

  useEffect(() => {
    if (step === 'captcha') { generateCaptcha(); setError(''); }
    if (step === 'reason' || step === 'finalPhrase' || step === 'review') setError('');
    if (step === 'cooldown') { setCooldown(COOLDOWN_SECONDS); setError(''); }
  }, [step]);

  useEffect(() => {
    if (step !== 'cooldown' || submitting || cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((p) => p - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [step, cooldown, submitting]);

  useEffect(() => {
    if (step !== 'result' || submitting) return;
    const allRequiredPassed = operations.filter((o) => o.required).every((o) => o.status === 'success');
    if (!allRequiredPassed) return;
    setCountdown(5);
    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          // Defer navigation out of the state updater so we don't trigger a
          // Router state update while React is rendering this component.
          window.setTimeout(() => router.push('/pages/login'), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, submitting, operations, router]);

  const handleConfirmYes = () => { setError(''); setStep('checklist'); };
  const handleClose = () => onClose();

  const handleReasonContinue = () => {
    if (!selectedReason) { setError('Please select a reason before continuing.'); return; }
    if (selectedReason === 'Other' && customReason.trim().length < 10) {
      setError('Please enter at least 10 characters for custom reason.'); return;
    }
    setError(''); setStep('captcha');
  };

  const handleCaptchaContinue = () => {
    if (captchaInput.trim() !== captcha) {
      setError("❌ Invalid CAPTCHA. Please try again."); generateCaptcha(); return;
    }
    setError(''); setStep('finalPhrase');
  };

  const handleFinalPhraseNext = () => {
    if (finalPhraseInput.trim().toUpperCase() !== FINAL_PHRASE) {
      setError(`Please type "${FINAL_PHRASE}" exactly to continue.`); return;
    }
    setError(''); setStep('review');
  };

  const executeDeletionFlow = async () => {
    setSubmitting(true);
    setStep('processing');
    setOperations(INITIAL_OPERATIONS.map((o) => ({ ...o })));

    if (!navigator.onLine) {
      const msg = 'You are offline. Connect to the internet and try again.';
      updateOperation('revokeAccess', 'failed', msg);
      setResultMessage(msg); setError(msg); safeToastError(msg);
      setStep('result'); setSubmitting(false); return;
    }

    try {
      const userId = localStorage.getItem("user_id");
      let deleteAppUserFailed = false;

      updateOperation('revokeAccess', 'running');
      try {
        await apiClient.delete(API_ENDPOINTS.AUTH.DELETE_ACCOUNT, { headers: { "app-code": AUTH_APP_CODE } });
        updateOperation('revokeAccess', 'success');
      } catch (err) {
        const status = getApiErrorStatus(err);
        const message = getApiErrorMessage(err);
        const failMsg = status === 404 ? message || 'This account no longer has access to the app.'
          : status === 401 ? 'Session expired. Please log in again.'
          : message || 'Failed to revoke account access.';
        updateOperation('revokeAccess', 'failed', failMsg);
        throw new Error(failMsg);
      }

      updateOperation('deleteAppUser', 'running');
      if (userId) {
        try {
          await apiClient.delete(API_ENDPOINTS.USERS.DELETE_USER(userId));
          updateOperation('deleteAppUser', 'success');
        } catch (err) {
          const message = getApiErrorMessage(err) || 'Unable to delete app-level profile data.';
          updateOperation('deleteAppUser', 'failed', message);
          deleteAppUserFailed = true;
        }
      } else {
        updateOperation('deleteAppUser', 'failed', 'No local user id found for app-level cleanup.');
        deleteAppUserFailed = true;
      }

      updateOperation('clearLocalData', 'running');
      localStorage.clear();
      updateOperation('clearLocalData', 'success');

      const successMessage = deleteAppUserFailed
        ? 'Account access deleted. Some secondary cleanup steps need support follow-up.'
        : 'Your account has been deleted successfully.';
      setResultMessage(successMessage); setError(''); safeToastSuccess(successMessage);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete account. Please try again later.';
      setResultMessage(message); setError(message); safeToastError(message);
    } finally {
      setStep('result'); setSubmitting(false);
    }
  };

  const checklistComplete = Object.values(checklist).every(Boolean);
  const reasonText = selectedReason === 'Other' ? customReason.trim() : selectedReason;
  const requiredFailed = operations.filter((o) => o.required).some((o) => o.status === 'failed');
  const optionalFailed = operations.filter((o) => !o.required).some((o) => o.status === 'failed');
  const hardSuccess = !requiredFailed && step === 'result';

  const statusColor = (status: OperationStatus) =>
    status === 'success' ? 'text-green-600'
    : status === 'failed' ? 'text-red-600'
    : status === 'running' ? 'text-blue-600'
    : 'text-gray-500';

  return (
    <div className="flex flex-col gap-4 w-[26rem]">
      <AnimatePresence mode="wait">
        {step === 'confirm' && (
          <motion.div key="confirm"
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }} transition={{ duration: 0.2 }}
            className="w-full"
          >
            <ConfirmationPopUp
              message={
                <p className="text-gray-800 font-medium text-center leading-relaxed">
                  Are you sure you want to delete your account? <br />
                  <span className="font-bold text-red-600">
                    All your quotations, data, and account information will be permanently erased.
                  </span> <br />
                  This action cannot be undone.
                </p>
              }
              onYes={handleConfirmYes}
              onNo={handleClose}
            />
          </motion.div>
        )}

        {step === 'checklist' && (
          <motion.div key="checklist"
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }} transition={{ duration: 0.2 }}
            className="p-6 bg-white rounded-2xl w-full"
          >
            <h3 className="text-xl font-bold text-red-600 mb-2 text-center">Deletion Checklist</h3>
            <p className="text-sm text-gray-600 text-center mb-4">Please acknowledge all points before continuing.</p>
            <div className="space-y-3 mb-5 text-sm text-gray-700">
              {[
                { key: 'irreversible', label: 'I understand this action is permanent and cannot be undone.' },
                { key: 'dataDeletion', label: 'I understand quotations, invoices, and account-linked data will be removed.' },
                { key: 'signOutDevices', label: 'I understand I will be signed out from this app immediately.' },
              ].map((item) => (
                <label key={item.key} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox"
                    checked={checklist[item.key as keyof typeof checklist]}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                    className="mt-1"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-center gap-3">
              <PrimaryBtn label="Continue" onClick={() => setStep('reason')} disabled={!checklistComplete} />
              <SecondaryBtn label="Back" onClick={() => setStep('confirm')} />
            </div>
          </motion.div>
        )}

        {step === 'reason' && (
          <motion.div key="reason"
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }} transition={{ duration: 0.2 }}
            className="p-6 bg-white rounded-2xl w-full"
          >
            <h3 className="text-xl font-bold text-red-600 mb-2 text-center">Reason for Deletion</h3>
            <p className="text-sm text-gray-600 text-center mb-4">Select a reason before you proceed.</p>
            <div className="space-y-2 mb-4">
              {REASONS.map((reason) => (
                <label key={reason} className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="radio" name="delete-reason" checked={selectedReason === reason} onChange={() => setSelectedReason(reason)} />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
            {selectedReason === 'Other' && (
              <textarea value={customReason} onChange={(e) => setCustomReason(e.target.value)} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Tell us why you want to delete this account..."
              />
            )}
            {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
            <div className="flex justify-center gap-3">
              <PrimaryBtn label="Continue" onClick={handleReasonContinue} />
              <SecondaryBtn label="Back" onClick={() => setStep('checklist')} />
            </div>
          </motion.div>
        )}

        {step === 'captcha' && (
          <motion.div key="captcha"
            initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -40 }} transition={{ duration: 0.25 }}
            className="p-6 bg-white/90 backdrop-blur-xl rounded-2xl w-full"
          >
            <h3 className="text-2xl font-bold text-red-600 mb-2 text-center">⚠️ Security Verification</h3>
            <p className="text-sm text-gray-600 text-center mb-4">Type the code below to continue.</p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 px-6 py-3 font-extrabold text-2xl tracking-widest rounded-lg shadow-md select-none">
                {captcha}
              </div>
              <button type="button" onClick={generateCaptcha} disabled={submitting}
                className="text-sm text-indigo-600 font-medium hover:underline disabled:opacity-50">
                Refresh
              </button>
            </div>
            <div className="relative mb-4">
              <input type="text" value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)}
                disabled={submitting}
                className="peer w-full border border-gray-300 rounded-lg px-4 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <label className="absolute left-4 top-2 text-xs text-gray-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm transition-all">
                Enter CAPTCHA
              </label>
            </div>
            {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
            <div className="flex justify-center gap-3">
              <PrimaryBtn label="Verify" onClick={handleCaptchaContinue} disabled={submitting} />
              <SecondaryBtn label="Back" onClick={() => setStep('reason')} disabled={submitting} />
            </div>
          </motion.div>
        )}

        {step === 'finalPhrase' && (
          <motion.div key="finalPhrase"
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }} transition={{ duration: 0.2 }}
            className="p-6 bg-white/90 backdrop-blur-xl rounded-2xl w-full"
          >
            <h3 className="text-xl font-bold text-red-600 mb-2 text-center">Final Confirmation</h3>
            <p className="text-sm text-gray-600 text-center mb-3">
              Type <span className="font-bold text-gray-800">{FINAL_PHRASE}</span> to authorize deletion.
            </p>
            <input type="text" value={finalPhraseInput} onChange={(e) => setFinalPhraseInput(e.target.value)}
              disabled={submitting}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
            <div className="flex justify-center gap-3">
              <PrimaryBtn label="Continue" onClick={handleFinalPhraseNext} disabled={submitting} />
              <SecondaryBtn label="Back" onClick={() => setStep('captcha')} disabled={submitting} />
            </div>
          </motion.div>
        )}

        {step === 'review' && (
          <motion.div key="review"
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }} transition={{ duration: 0.2 }}
            className="p-6 bg-white rounded-2xl w-full"
          >
            <h3 className="text-xl font-bold text-red-600 mb-2 text-center">Review Deletion Plan</h3>
            <p className="text-sm text-gray-600 text-center mb-4">Please review the final details before execution.</p>
            <div className="space-y-2 text-sm mb-4">
              <div className="border rounded-lg p-3 bg-gray-50">
                <p className="font-semibold text-gray-800">Reason</p>
                <p className="text-gray-600 mt-1">{reasonText || 'Not provided'}</p>
              </div>
              <div className="border rounded-lg p-3 bg-gray-50">
                <p className="font-semibold text-gray-800">Execution Stages</p>
                <ul className="list-disc ml-5 text-gray-600 mt-1">
                  {INITIAL_OPERATIONS.map((o) => <li key={o.key}>{o.label}</li>)}
                </ul>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
            <div className="flex justify-center gap-3">
              <PrimaryBtn label="Approve and Continue" onClick={() => setStep('cooldown')} />
              <SecondaryBtn label="Back" onClick={() => setStep('finalPhrase')} />
            </div>
          </motion.div>
        )}

        {step === 'cooldown' && (
          <motion.div key="cooldown"
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }} transition={{ duration: 0.2 }}
            className="p-6 bg-white rounded-2xl w-full"
          >
            <h3 className="text-xl font-bold text-red-600 mb-2 text-center">Security Cooldown</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Wait {cooldown}s before final deletion. This gives you one last chance to stop.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-5 overflow-hidden">
              <div className="h-2 bg-red-500 transition-all duration-1000"
                style={{ width: `${((COOLDOWN_SECONDS - cooldown) / COOLDOWN_SECONDS) * 100}%` }}
              />
            </div>
            <div className="flex justify-center gap-3">
              <PrimaryBtn
                label={cooldown > 0 ? `Delete in ${cooldown}s` : 'Delete Now'}
                onClick={executeDeletionFlow}
                disabled={cooldown > 0 || submitting}
              />
              <SecondaryBtn label="Back" onClick={() => setStep('review')} disabled={submitting} />
            </div>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div key="processing"
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }} transition={{ duration: 0.2 }}
            className="p-6 bg-white rounded-2xl w-full"
          >
            <h3 className="text-xl font-bold text-red-600 mb-3 text-center">Processing Deletion</h3>
            <p className="text-sm text-gray-600 text-center mb-4">Please wait while we run all deletion stages.</p>
            <div className="space-y-3 text-sm">
              {operations.map((op) => (
                <div key={op.key} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-700">{op.label}</span>
                    <span className={`font-semibold ${statusColor(op.status)}`}>{op.status.toUpperCase()}</span>
                  </div>
                  {op.error && <p className="text-xs text-red-500 mt-1">{op.error}</p>}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div key="result"
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }} transition={{ duration: 0.2 }}
            className="p-6 bg-white rounded-2xl w-full"
          >
            <h3 className={`text-xl font-bold mb-2 text-center ${hardSuccess ? 'text-green-600' : 'text-red-600'}`}>
              {hardSuccess ? 'Deletion Completed' : 'Deletion Needs Attention'}
            </h3>
            <p className="text-sm text-gray-700 text-center mb-4">{resultMessage}</p>
            {hardSuccess && (
              <p className="text-xs text-gray-500 text-center mb-3">Redirecting to login in {countdown}s.</p>
            )}
            {!hardSuccess && optionalFailed && (
              <p className="text-xs text-orange-600 text-center mb-3">
                Some non-critical cleanup steps failed. Contact support if needed.
              </p>
            )}
            <div className="flex justify-center gap-3">
              {!hardSuccess && (
                <PrimaryBtn label={submitting ? 'Retrying...' : 'Retry Required Steps'} onClick={executeDeletionFlow} disabled={submitting} />
              )}
              <SecondaryBtn label={hardSuccess ? 'Close' : 'Dismiss'} onClick={handleClose} disabled={submitting} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
