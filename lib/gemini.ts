import { GoogleGenerativeAI } from '@google/generative-ai'

export function getGemini() {
  return new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? '')
}
