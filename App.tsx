
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { ApiKeyPanel } from './components/ApiKeyPanel';
import { summarizeCallStream, transcribeAndSummarizeAudioStream } from './services/geminiService';

function App() {
  const [transcript, setTranscript] = useState<string>('');
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('gemini-api-key'));

  const handleSaveApiKey = useCallback((key: string) => {
    if (key.trim()) {
      const trimmedKey = key.trim();
      localStorage.setItem('gemini-api-key', trimmedKey);
      setApiKey(trimmedKey);
    }
  }, []);

  const handleClearApiKey = useCallback(() => {
    localStorage.removeItem('gemini-api-key');
    setApiKey(null);
  }, []);


  const handleSummarize = useCallback(async () => {
    if (!apiKey) {
      setError('Gemini APIキーを設定してください。');
      return;
    }
    if (!transcript.trim() && !audioFile) {
      setError('要約するテキストを入力、録音、または音声ファイルをアップロードしてください。');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSummary(''); // Start with an empty string for streaming

    const fileToBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
      });

    try {
      const stream = audioFile
        ? transcribeAndSummarizeAudioStream(apiKey, await fileToBase64(audioFile), audioFile.type)
        : summarizeCallStream(apiKey, transcript);

      let fullResponse = "";
      for await (const chunk of stream) {
        fullResponse += chunk;
        setSummary(fullResponse);
      }

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
        <div className="space-y-8">
          <ApiKeyPanel
            initialKey={apiKey}
            onSave={handleSaveApiKey}
            onClear={handleClearApiKey}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <InputPanel
              transcript={transcript}
              setTranscript={setTranscript}
              onSummarize={handleSummarize}
              isLoading={isLoading}
              audioFile={audioFile}
              setAudioFile={setAudioFile}
            />
            <OutputPanel
              streamingContent={summary}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
