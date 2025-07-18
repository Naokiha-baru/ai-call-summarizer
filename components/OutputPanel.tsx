
import React, { useState, useMemo } from 'react';
import type { Summary } from '../types';
import { Spinner } from './Spinner';

interface OutputPanelProps {
  streamingContent: string | null;
  isLoading: boolean;
  error: string | null;
}

// Helper component for the copy button, managing its own state.
const CopyButton: React.FC<{ textToCopy: string, disabled: boolean }> = ({ textToCopy, disabled }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!textToCopy || disabled) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Copy section to clipboard"
      disabled={disabled}
    >
      <i className={`fas ${copied ? 'fa-check text-green-500' : 'fa-copy'} mr-2`}></i>
      {copied ? 'コピー完了' : 'コピー'}
    </button>
  );
};

const OutputSection: React.FC<{ title: string; children: React.ReactNode; copyText: string; copyDisabled: boolean; }> = ({ title, children, copyText, copyDisabled }) => (
  <div className="mb-6">
    <div className="flex justify-between items-center border-b-2 border-indigo-200 dark:border-indigo-700 pb-2 mb-3">
      <h3 className="text-lg font-semibold text-indigo-500 dark:text-indigo-400">
        {title}
      </h3>
      {copyText && <CopyButton textToCopy={copyText} disabled={copyDisabled} />}
    </div>
    <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
      {children}
    </div>
  </div>
);

export const OutputPanel: React.FC<OutputPanelProps> = ({ streamingContent, isLoading, error }) => {

  const { summary, isFinal } = useMemo(() => {
    if (!streamingContent) return { summary: null, isFinal: false };
    try {
      const parsed = JSON.parse(streamingContent) as Summary;
      // A simple check to see if the object seems complete
      if (parsed.reconstructedConversation && parsed.summary && parsed.crmInput) {
        return { summary: parsed, isFinal: true };
      }
      return { summary: null, isFinal: false };
    } catch (e) {
      return { summary: null, isFinal: false };
    }
  }, [streamingContent]);

  const conversationText = summary 
    ? summary.reconstructedConversation.map(line => `${line.speaker} ${line.line}`).join('\n') 
    : '';

  const keyPointsText = summary 
    ? [
        `通話の目的: ${summary.summary.purpose}`,
        `お客様の主な要望・懸念: ${summary.summary.customerRequest}`,
        `オペレーターの対応内容: ${summary.summary.operatorResponse}`,
        `今後の対応／タスク: ${summary.summary.nextSteps}`
      ].join('\n')
    : '';

  const crmInputText = summary ? summary.crmInput || '特になし' : '';

  const renderContent = () => {
    if (isLoading && !streamingContent) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Spinner />
          <p className="mt-4 text-slate-500 dark:text-slate-400">AIが要約を生成中です...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          {error}
        </div>
      );
    }

    if (!streamingContent) {
       return (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
            <i className="fas fa-file-alt fa-3x mb-4"></i>
            <p>ここに要約結果が表示されます。</p>
          </div>
        );
    }

    if (isFinal && summary) {
      return (
        <>
          <OutputSection title="① 会話再構成" copyText={conversationText} copyDisabled={!isFinal}>
            <div className="space-y-2">
              {summary.reconstructedConversation.map((line, index) => (
                <p key={index}>
                  <span className="font-bold">{line.speaker}</span> {line.line}
                </p>
              ))}
            </div>
          </OutputSection>
          
          <OutputSection title="② 要点整理" copyText={keyPointsText} copyDisabled={!isFinal}>
            <ul className="space-y-2">
              <li><span className="font-semibold">通話の目的:</span> {summary.summary.purpose}</li>
              <li><span className="font-semibold">お客様の主な要望・懸念:</span> {summary.summary.customerRequest}</li>
              <li><span className="font-semibold">オペレーターの対応内容:</span> {summary.summary.operatorResponse}</li>
              <li><span className="font-semibold">今後の対応／タスク:</span> {summary.summary.nextSteps}</li>
            </ul>
          </OutputSection>

          <OutputSection title="③ CRM入力項目" copyText={crmInputText} copyDisabled={!isFinal}>
            <p className="whitespace-pre-wrap">{crmInputText}</p>
          </OutputSection>
        </>
      );
    }

    // Render streaming content
    return (
        <div className="space-y-2">
            <p className="text-indigo-400 font-semibold border-b-2 border-indigo-700 pb-2 mb-3">AIが応答を生成中...</p>
            <pre className="text-sm text-slate-400 whitespace-pre-wrap font-mono bg-slate-800/50 p-4 rounded-lg">{streamingContent}</pre>
        </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg relative h-full">
      <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">2. 要約結果</h2>
      <div className="h-[calc(100%-48px)] overflow-y-auto pr-2">
        {renderContent()}
      </div>
    </div>
  );
};
