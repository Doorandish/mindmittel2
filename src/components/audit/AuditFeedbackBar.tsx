'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  MessageSquarePlus,
  Send,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  X,
} from 'lucide-react';
import type { SupportedLocale } from '@/i18n/dictionaries';
import type { AuditVerdict } from '@/core/audit/decisionEvaluator';
import type {
  ClarificationChatMessage,
  DraftCompanyPrecedent,
} from '@/core/audit/learningLoop';

interface AuditFeedbackBarProps {
  locale: SupportedLocale;
  auditId?: string;
  auditProposal: string;
  verdict: AuditVerdict;
  alignmentScore: number;
  selectedModelId: string;
  defaultDepartment?: string;
  onPrecedentSubmitted?: () => void;
}

export function AuditFeedbackBar({
  locale,
  auditId,
  auditProposal,
  verdict,
  alignmentScore,
  selectedModelId,
  defaultDepartment = '*',
  onPrecedentSubmitted,
}: AuditFeedbackBarProps) {
  const isDe = locale === 'de';

  const [helpfulSaved, setHelpfulSaved] = useState(false);
  const [isSavingHelpful, setIsSavingHelpful] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ClarificationChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [quickChips, setQuickChips] = useState<string[]>([]);
  const [isClarifying, setIsClarifying] = useState(false);
  const [draft, setDraft] = useState<DraftCompanyPrecedent | null>(null);
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);
  const [submittedPending, setSubmittedPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleHelpfulClick() {
    if (helpfulSaved || isSavingHelpful) return;
    setIsSavingHelpful(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/brain/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'helpful',
          locale,
          auditId,
          modelUsed: selectedModelId,
          initialVerdict: verdict,
          initialScore: alignmentScore,
        }),
      });
      if (!res.ok) throw new Error('Feedback could not be recorded.');
      setHelpfulSaved(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error saving feedback.');
    } finally {
      setIsSavingHelpful(false);
    }
  }

  async function sendChatMessage(rawText: string) {
    const text = rawText.trim();
    if (!text || isClarifying) return;
    const nextMessages: ClarificationChatMessage[] = [
      ...messages,
      { role: 'user', text },
    ];
    setMessages(nextMessages);
    setInputText('');
    setQuickChips([]);
    setIsClarifying(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/brain/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'clarify',
          locale,
          auditId,
          auditProposal,
          defaultDepartment,
          messages: nextMessages,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Clarification request failed.');
      }
      setMessages([
        ...nextMessages,
        { role: 'assistant', text: data.assistantReply },
      ]);
      setQuickChips(Array.isArray(data.quickChips) ? data.quickChips : []);
      if (data.readyToSubmit && data.draftPrecedent) {
        setDraft(data.draftPrecedent);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to process feedback.'
      );
    } finally {
      setIsClarifying(false);
    }
  }

  async function handleSubmitPrecedent() {
    if (!draft || isSubmittingDraft) return;
    setIsSubmittingDraft(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/brain/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'submit_precedent',
          locale,
          auditId,
          modelUsed: selectedModelId,
          initialVerdict: verdict,
          initialScore: alignmentScore,
          draftPrecedent: draft,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to submit precedent.');
      }
      setSubmittedPending(true);
      onPrecedentSubmitted?.();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to submit precedent.'
      );
    } finally {
      setIsSubmittingDraft(false);
    }
  }

  return (
    <div className="mt-4 pt-3 border-t border-slate-200/80 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11.5px] font-medium text-slate-500">
          {isDe
            ? 'War diese Prüfung präzise für Ihr Unternehmen?'
            : 'Was this audit accurate for your company?'}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleHelpfulClick}
            disabled={helpfulSaved || isSavingHelpful}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              helpfulSaved
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
            }`}
          >
            {isSavingHelpful ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : helpfulSaved ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>
              {helpfulSaved
                ? isDe
                  ? 'Danke! Gespeichert'
                  : 'Thanks! Saved'
                : isDe
                ? 'Präzise & hilfreich'
                : 'Accurate & Helpful'}
            </span>
          </button>

          {!submittedPending ? (
            <button
              type="button"
              onClick={() => setChatOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                chatOpen
                  ? 'bg-blue-50 border-blue-300 text-blue-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-[#004ac6]" />
              <span>
                {isDe
                  ? 'Feedback / Ausnahme melden'
                  : 'Report Issue / Add Precedent'}
              </span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-900">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {isDe
                  ? 'Zur Freigabe an Firmen-Admin gesendet'
                  : 'Sent to Company Admin for approval'}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Guided Micro-Chat Drawer (ONLY opens when user clicks Report Issue / Add Precedent) */}
      {chatOpen && !submittedPending && (
        <div className="mt-3 rounded-xl border border-blue-200/80 bg-slate-50/80 p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#131b2e]">
              <Sparkles className="w-3.5 h-3.5 text-[#004ac6]" />
              <span>
                {isDe
                  ? 'Lern-Assistent: Ausnahme oder Korrektur strukturieren'
                  : 'Learning Assistant: Structure Exception or Correction'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="p-1 rounded hover:bg-slate-200/70 text-slate-500"
              aria-label="Close feedback assistant"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {messages.length === 0 && (
            <p className="text-xs text-slate-600 leading-relaxed">
              {isDe
                ? 'Beschreiben Sie kurz, was fehlte oder bereits intern genehmigt ist (z. B. „Wir haben eine M365-Betriebsvereinbarung“). Falls Angaben wie die Gültigkeitsdauer fehlen, fragt das System kurz nach.'
                : 'Briefly explain what was inaccurate or already internally approved (e.g. "We already have a Works Council agreement for M365"). If details like validity period are missing, the assistant will ask one quick follow-up.'}
            </p>
          )}

          {messages.length > 0 && (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`text-xs rounded-lg px-3 py-2 leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#004ac6] text-white ml-8'
                      : 'bg-white border border-slate-200 text-slate-800 mr-6'
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>
          )}

          {/* 1-Click Quick Validity Chips */}
          {quickChips.length > 0 && !draft && (
            <div className="flex flex-wrap gap-1.5">
              {quickChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => void sendChatMessage(chip)}
                  className="px-2.5 py-1 rounded-full bg-white border border-blue-200 text-[11px] font-semibold text-[#004ac6] hover:bg-blue-50 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Structured Draft Precedent Review Card */}
          {draft ? (
            <div className="rounded-xl bg-white border border-emerald-200 p-3 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                <span>
                  {isDe
                    ? 'Regel-Entwurf (zur Admin-Freigabe)'
                    : 'Draft Company Precedent (For Admin Review)'}
                </span>
                <span className="font-mono text-slate-500">
                  {draft.affectedLayer}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="block text-[11px] text-slate-600">
                  {isDe ? 'Titel' : 'Title'}
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) =>
                      setDraft({ ...draft, title: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </label>
                <label className="block text-[11px] text-slate-600">
                  {isDe
                    ? 'Gültig bis (YYYY-MM-DD oder leer = unbefristet)'
                    : 'Valid Until (YYYY-MM-DD or empty = indefinite)'}
                  <input
                    type="date"
                    value={draft.validUntil ?? ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        validUntil: e.target.value ? e.target.value : null,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </label>
              </div>

              <label className="block text-[11px] text-slate-600">
                {isDe ? 'Regel / Ausnahme' : 'Precedent / Exception Summary'}
                <textarea
                  rows={2}
                  value={draft.ruleSummary}
                  onChange={(e) =>
                    setDraft({ ...draft, ruleSummary: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900"
                />
              </label>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-slate-500">
                  {isDe
                    ? 'Wird erst nach Freigabe durch Ihren Firmen-Admin aktiv.'
                    : 'Only becomes active after your Company Admin approves it.'}
                </span>
                <button
                  type="button"
                  onClick={handleSubmitPrecedent}
                  disabled={isSubmittingDraft}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#004ac6] hover:bg-[#2563eb] text-white text-xs font-semibold shadow-sm"
                >
                  {isSubmittingDraft ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isDe
                      ? 'An Firmen-Admin senden'
                      : 'Submit for Admin Approval'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendChatMessage(inputText);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isDe
                    ? 'z. B. Wir haben bereits eine M365-Betriebsvereinbarung…'
                    : 'e.g. We already have a Works Council agreement for M365…'
                }
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004ac6]/30"
              />
              <button
                type="submit"
                disabled={isClarifying || !inputText.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#131b2e] hover:bg-[#004ac6] disabled:opacity-50 text-white text-xs font-semibold transition-colors"
              >
                {isClarifying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isDe ? 'Senden' : 'Send'}</span>
              </button>
            </form>
          )}

          {errorMsg && (
            <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
          )}
        </div>
      )}
    </div>
  );
}
