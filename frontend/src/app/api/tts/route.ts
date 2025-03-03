import { NextResponse } from 'next/server'
import axios, { AxiosResponse } from "axios";

interface TTSRequest {
  text: string;
}

interface TTSResponse {
  audio: string;
  body?: string;
}

export async function POST(request: Request) {
  const lambdaUrl = `${process.env.NEXT_PUBLIC_LAMBDA_API_URL}`;
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  if (!lambdaUrl) {
    throw new Error('NEXT_PUBLIC_LAMBDA_API_URL is not defined');
  }
  const body: TTSRequest = await request.json();

  try {
    const response = await axios.post<TTSResponse>(
      lambdaUrl,
      { text: body.text },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        }
      }
    );

    const audioData = response.data.body ? 
      (typeof response.data.body === 'string' ? JSON.parse(response.data.body) : response.data.body) 
      : response.data;

    return NextResponse.json({ file_url: `data:audio/mp3;base64,${audioData.audio}` });

  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Full error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        requestUrl: lambdaUrl,
        requestBody: body
      });
      return NextResponse.json(
        { error: "Failed to process text-to-speech", details: error.response?.data },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
