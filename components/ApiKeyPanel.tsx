
import React, { useState, useEffect } from 'react';

interface ApiKeyPanelProps {
  initialKey: string | null;
  onSave: (key: string) => void;
  onClear: () => void;
}

export const ApiKeyPanel: React.FC<ApiKeyPanelProps> = ({ initialKey, onSave, onClear }) => {
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setInputKey(initialKey || '');
  }, [initialKey]);
  
  const handleSaveClick = () => {
    onSave(inputKey);
  };
  
  const isKeySaved = !!initialKey;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Gemini API Key</h2>
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
            <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="ここにAPIキーを入力してください"
                className="w-full p-3 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
            />
            <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                aria-label={showKey ? "Hide API key" : "Show API key"}
            >
                <i className={`fas ${showKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleSaveClick}
              className="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              保存
            </button>
            {isKeySaved && (
              <button
                onClick={onClear}
                className="flex-1 sm:flex-none px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              >
                クリア
              </button>
            )}
        </div>
      </div>
       {isKeySaved && (
         <p className="text-sm text-green-600 dark:text-green-400 mt-2">APIキーはブラウザに安全に保存されています。</p>
       )}
    </div>
  );
};
