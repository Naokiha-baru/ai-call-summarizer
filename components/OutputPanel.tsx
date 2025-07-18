
import React, { useState } from 'react';
import type { Summary } from '../types';
import { Spinner } from './Spinner';

interface OutputPanelProps {
  summary: Summary | null;
  isLoading: boolean;
  error: string | null;
}

const OutputSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-indigo-500 dark:text-indigo-400 border-b-2 border-indigo-200 dark:border-indigo-700 pb-2 mb-3">
      {title}
    </h3>
    <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
      {children}
    </div>
  </div>
);

export const OutputPanel: React.FC<OutputPanelProps> = ({ summary, isLoading, error }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!summary) return;

    const textToCopy = `
■ 会話再構成
${summary.reconstructedConversation.map(line => `${line.speaker} ${line.line}`).join('\n')}

■ 要点整理
- 通話の目的: ${summary.summary.purpose}
- お客様の主な要望・懸念: ${summary.summary.customerRequest}
- オペレーターの対応内容: ${summary.summary.operatorResponse}
- 今後の対応／タスク: ${summary.summary.nextSteps}

■ CRM入力項目
${summary.crmInput || '特になし'}
    `.trim();

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg relative h-full">
      <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">2. 要約結果</h2>
      <div className="h-[calc(100%-48px)] overflow-y-auto pr-2">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full">
            <Spinner />
            <p className="mt-4 text-slate-500 dark:text-slate-400">AIが要約を生成中です...</p>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            {error}
          </div>
        )}
        {!isLoading && !error && !summary && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
            <i className="fas fa-file-alt fa-3x mb-4"></i>
            <p>ここに要約結果が表示されます。</p>
          </div>
        )}
        {summary && (
          <>
            <button onClick={handleCopy} className="absolute top-6 right-6 px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition">
              <i className={`fas ${copied ? 'fa-check text-green-500' : 'fa-copy'} mr-1`}></i>
              {copied ? 'コピーしました' : 'コピー'}
            </button>
            
            <OutputSection title="① 会話再構成">
              <div className="space-y-2">
                {summary.reconstructedConversation.map((line, index) => (
                  <p key={index}>
                    <span className="font-bold">{line.speaker}</span> {line.line}
                  </p>
                ))}
              </div>
            </OutputSection>
            
            <OutputSection title="② 要点整理">
              <ul className="space-y-2 list-disc list-inside">
                <li><span className="font-semibold">通話の目的:</span> {summary.summary.purpose}</li>
                <li><span className="font-semibold">お客様の主な要望・懸念:</span> {summary.summary.customerRequest}</li>
                <li><span className="font-semibold">オペレーターの対応内容:</span> {summary.summary.operatorResponse}</li>
                <li><span className="font-semibold">今後の対応／タスク:</span> {summary.summary.nextSteps}</li>
              </ul>
            </OutputSection>

            <OutputSection title="③ CRM入力項目">
              <p>{summary.crmInput || '特になし'}</p>
            </OutputSection>
          </>
        )}
      </div>
    </div>
  );
};
