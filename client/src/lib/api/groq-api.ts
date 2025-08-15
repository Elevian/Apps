import Groq from 'groq-sdk'

// Groq API Configuration with proper Vite env handling
declare const process: any

const getEnvVar = (key: string): string | undefined => {
  if (typeof window !== 'undefined') {
    // Browser environment
    return (window as any).__VITE_ENV__?.[key] || 
           (globalThis as any).__VITE_ENV__?.[key]
  }
  return undefined
}

const GROQ_API_KEY = getEnvVar('VITE_GROQ_API_KEY')
const GROQ_MODEL = 'llama3-8b-8192' // Fast and efficient model for character analysis

// Initialize Groq client if API key is available
let groqClient: any = null
if (GROQ_API_KEY) {
  try {
    groqClient = new Groq({
      apiKey: GROQ_API_KEY,
      dangerouslyAllowBrowser: true // Enable browser usage
    })
  } catch (error) {
    console.warn('Groq SDK not available:', error)
  }
}

export interface Character {
  id: string
  name: string
  aliases: string[]
  countGuess: number
}

export interface GroqAnalysisResult {
  characters: Character[]
  summary: string
  confidence: number
}

/**
 * Extract characters from text using Groq's LLM
 */
export async function extractCharactersWithGroq(
  text: string,
  bookTitle?: string
): Promise<GroqAnalysisResult | null> {
  if (!groqClient || !GROQ_API_KEY) {
    console.log('Groq API not configured, skipping LLM analysis')
    return null
  }

  try {
    console.log('🤖 Starting Groq character extraction...')
    
    // Truncate text for efficiency (Groq has context limits)
    const maxLength = 4000
    const textToAnalyze = text.length > maxLength 
      ? text.substring(0, maxLength) + '...'
      : text

    const prompt = `
Analyze this literary text and extract the main characters. Return a JSON response with this exact structure:

{
  "characters": [
    {
      "id": "character_1",
      "name": "Primary Name",
      "aliases": ["Alternative Name 1", "Alternative Name 2"],
      "countGuess": estimated_mention_count
    }
  ],
  "summary": "Brief summary of the text",
  "confidence": confidence_score_0_to_1
}

Instructions:
- Extract only major characters (not minor mentions)
- Include common nicknames and titles as aliases
- Estimate mention count based on importance
- Focus on characters with dialogue or significant narrative presence
- Return valid JSON only, no other text

Text to analyze:
${bookTitle ? `Title: ${bookTitle}\n\n` : ''}${textToAnalyze}`

    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a literary analysis expert. Extract character information from text and return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: GROQ_MODEL,
      temperature: 0.1, // Low temperature for consistent results
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from Groq API')
    }

    console.log('🤖 Groq raw response:', response)

    // Parse JSON response
    const result = JSON.parse(response) as GroqAnalysisResult
    
    // Validate and clean the result
    if (!result.characters || !Array.isArray(result.characters)) {
      throw new Error('Invalid character array in response')
    }

    // Ensure proper character structure
    result.characters = result.characters.map((char, index) => ({
      id: char.id || `character_${index + 1}`,
      name: char.name || 'Unknown Character',
      aliases: Array.isArray(char.aliases) ? char.aliases : [],
      countGuess: typeof char.countGuess === 'number' ? char.countGuess : 1
    }))

    console.log(`✅ Groq extracted ${result.characters.length} characters`)
    return result

  } catch (error) {
    console.error('❌ Groq character extraction failed:', error)
    return null
  }
}

/**
 * Generate reading guide summary using Groq
 */
export async function generateReadingGuide(
  text: string,
  characters: Character[]
): Promise<string | null> {
  if (!groqClient || !GROQ_API_KEY) {
    return null
  }

  try {
    const characterNames = characters.slice(0, 5).map(c => c.name).join(', ')
    
    const prompt = `
Create a brief reading guide for this literary text. Focus on:
- Main plot points
- Key character relationships
- Important themes
- Notable quotes or moments

Keep it concise (2-3 paragraphs) and engaging.

Main characters: ${characterNames}

Text excerpt:
${text.substring(0, 2000)}...`

    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a literature teacher creating engaging reading guides.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: GROQ_MODEL,
      temperature: 0.3,
      max_tokens: 500
    })

    return completion.choices[0]?.message?.content || null

  } catch (error) {
    console.error('❌ Groq reading guide generation failed:', error)
    return null
  }
}

/**
 * Analyze quote sentiment using Groq (alternative to AFINN)
 */
export async function analyzeQuoteSentiment(
  quote: string,
  speaker: string
): Promise<{ sentiment: number; confidence: number } | null> {
  if (!groqClient || !GROQ_API_KEY) {
    return null
  }

  try {
    const prompt = `
Analyze the sentiment of this quote and return a JSON response:

{
  "sentiment": sentiment_score_from_negative_1_to_positive_1,
  "confidence": confidence_0_to_1
}

Consider context, tone, and emotional impact. Return only valid JSON.

Speaker: ${speaker}
Quote: "${quote}"`

    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a sentiment analysis expert. Analyze quotes and return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: GROQ_MODEL,
      temperature: 0.1,
      max_tokens: 100,
      response_format: { type: 'json_object' }
    })

    const response = completion.choices[0]?.message?.content
    if (!response) return null

    const result = JSON.parse(response)
    return {
      sentiment: Number(result.sentiment) || 0,
      confidence: Number(result.confidence) || 0
    }

  } catch (error) {
    console.error('❌ Groq sentiment analysis failed:', error)
    return null
  }
}

/**
 * Check if Groq API is available and configured
 */
export function isGroqAvailable(): boolean {
  return !!(groqClient && GROQ_API_KEY)
}

/**
 * Get Groq configuration status
 */
export function getGroqStatus(): {
  configured: boolean
  model: string
  keyPresent: boolean
} {
  return {
    configured: !!groqClient,
    model: GROQ_MODEL,
    keyPresent: !!GROQ_API_KEY
  }
}
