"use client"

import { useState } from "react";
import axios from "axios";
import 'dotenv/config';

interface TTSResponse {
  file_url: string;
}

const Home = () => {
  const [text, setText] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleConvert = async () => {
    try {
      const response = await axios.post<TTSResponse>(
        `${process.env.NEXT_PUBLIC_LAMBDA_API_URL}`,
        { text },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY
          }
        }
      );
      setAudioUrl(response.data.file_url);
    } catch (error) {
      console.error("Error converting text to speech:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-3xl w-full mx-auto p-8">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          Cloud Text-to-Speech App
        </h1>
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to convert to speech"
            className="w-full h-40 p-4 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none placeholder-gray-400"
          />
          <button
            onClick={handleConvert}
            className="mt-4 w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Convert to Speech
          </button>

          {audioUrl && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Converted Speech:
              </h2>
              <div className="bg-gray-700 p-4 rounded-lg">
                <audio
                  controls
                  src={audioUrl}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
