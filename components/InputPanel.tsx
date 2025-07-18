
import React, { useCallback } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface InputPanelProps {
  transcript: string;
  setTranscript: (text: string) => void;
  onSummarize: () => void;
  isLoading: boolean;
  audioFile: File | null;
  setAudioFile: (file: File | null) => void;
  isApiKeySet: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({ transcript, setTranscript, onSummarize, isLoading, audioFile, setAudioFile, isApiKeySet }) => {
  const { isListening, error: speechError, startListening, stopListening } = useSpeechRecognition(setTranscript);

  const clearAudioFile = useCallback(() => {
    setAudioFile(null);
    const fileInput = document.getElementById('audio-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, [setAudioFile]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTranscript(newText);
    if (newText && audioFile) {
      clearAudioFile();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setTranscript(''); 
    }
  };

  const handleStartListening = () => {
    if (audioFile) {
        clearAudioFile();
    }
    startListening();
  };
  
  const hasText = transcript.trim().length > 0;
  const hasAudio = audioFile !== null;
  const canInteract = isApiKeySet && !isLoading;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">1. 通話記録を入力</h2>
      <div className="flex-grow flex flex-col">
        <textarea
          value={transcript}
          onChange={handleTextChange}
          placeholder={isApiKeySet ? "ここに通話記録を貼り付けるか、下のボタンで録音またはファイルをアップロードしてください..." : "APIキーを設定してください。"}
          className="w-full flex-grow p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition duration-200 text-sm disabled:bg-slate-200 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed"
          rows={12}
          disabled={!canInteract || isListening || hasAudio}
        />
        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Recording Controls */}
            {isListening ? (
              <button
                onClick={stopListening}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition animate-pulse"
              >
                <i className="fas fa-stop-circle"></i>
                録音停止
              </button>
            ) : (
              <button
                onClick={handleStartListening}
                disabled={!canInteract || hasText || hasAudio}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                <i className="fas fa-microphone"></i>
                録音開始
              </button>
            )}

            {/* File Upload Controls */}
            {hasAudio ? (
              <div className="flex items-center gap-2 text-sm bg-slate-100 dark:bg-slate-700 py-2 px-3 rounded-lg">
                <i className="fas fa-file-audio text-indigo-500"></i>
                <span className="truncate max-w-[120px] sm:max-w-[150px]">{audioFile.name}</span>
                <button onClick={clearAudioFile} className="ml-1 text-slate-500 hover:text-red-500 dark:hover:text-red-400">
                  <i className="fas fa-times-circle"></i>
                </button>
              </div>
            ) : (
              <label className={`flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg shadow-md transition ${!canInteract || isListening || hasText ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'}`}>
                <i className="fas fa-upload"></i>
                <span>ファイル選択</span>
                <input
                  type="file"
                  id="audio-file-input"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={!canInteract || isListening || hasText}
                />
              </label>
            )}
          </div>

          <button
            onClick={onSummarize}
            disabled={!canInteract || (!hasText && !hasAudio)}
            className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition"
          >
            {isLoading ? '要約中...' : '要約する'}
          </button>
        </div>
        <div className='mt-2 min-h-[20px]'>
            {isListening && <span className="text-sm text-slate-500 dark:text-slate-400">録音中...</span>}
            {speechError && <p className="text-red-500 text-sm">{speechError}</p>}
        </div>
      </div>
    </div>
  );
};