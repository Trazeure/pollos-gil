import OpenAI from 'openai'

export function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.GOOGLE_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  })
}
