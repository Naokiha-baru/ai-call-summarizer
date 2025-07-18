
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { ApiKeyPanel } from './components/ApiKeyPanel';
import { summarizeCall, transcribeAndSummarizeAudio } from './services/geminiService';
import type { Summary } from './types';

function App() {
  const [transcript, setTranscript] = useState<string>('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleSaveApiKey = useCallback((key: string) => {
    if (key.trim()) {
      setApiKey(key);
      localStorage.setItem('gemini_api_key', key);
      alert('APIキーを保存しました。');
    }
  }, []);
  
  const handleClearApiKey = useCallback(() => {
      setApiKey(null);
      localStorage.removeItem('gemini_api_key');
      alert('APIキーを削除しました。');
  }, []);


  const handleSummarize = useCallback(async () => {
    if (!apiKey) {
      setError('APIキーが設定されていません。上の入力欄から設定してください。');
      return;
    }
    if (!transcript.trim() && !audioFile) {
      setError('要約するテキストを入力、録音、または音声ファイルをアップロードしてください。');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSummary(null);

    const fileToBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
      });

    try {
      let result;
      if (audioFile) {
        const base64Audio = await fileToBase64(audioFile);
        result = await transcribeAndSummarizeAudio(apiKey, base64Audio, audioFile.type);
      } else {
        result = await summarizeCall(apiKey, transcript);
      }
      setSummary(result);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : '要約の生成中に不明なエラーが発生しました。';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [transcript, audioFile, apiKey]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <ApiKeyPanel
            initialKey={apiKey}
            onSave={handleSaveApiKey}
            onClear={handleClearApiKey}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <InputPanel
            transcript={transcript}
            setTranscript={setTranscript}
            onSummarize={handleSummarize}
            isLoading={isLoading}
            audioFile={audioFile}
            setAudioFile={setAudioFile}
            isApiKeySet={!!apiKey}
          />
          <OutputPanel
            summary={summary}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </main>
    </div>
  );
}

export default App;