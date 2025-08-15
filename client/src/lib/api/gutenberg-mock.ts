import { 
  BookResolve, 
  BookText, 
  BookPreview, 
  CharacterAnalysisResult,
  CharacterAnalysisRequest,
  AnalysisHealth
} from './schemas'

// Mock data that always works - no network required
const MOCK_BOOKS: Record<string, { title: string; author: string; text: string }> = {
  '84': {
    title: 'Frankenstein; Or, The Modern Prometheus',
    author: 'Mary Wollstonecraft Shelley',
    text: `FRANKENSTEIN OR, THE MODERN PROMETHEUS by Mary Wollstonecraft Shelley

CHAPTER I

It was on a dreary night of November that I beheld the accomplishment of my toils. With an anxiety that almost amounted to agony, I collected the instruments of life around me, that I might infuse a spark of being into the lifeless thing that lay at my feet. It was already one in the morning; the rain pattered dismally against the panes, and my candle was nearly burnt out, when, by the glimmer of the half-extinguished light, I saw the dull yellow eye of the creature open; it breathed hard, and a convulsive motion agitated its limbs.

How can I describe my emotions at this catastrophe, or how delineate the wretch whom with such infinite pains and care I had endeavoured to form? His limbs were in proportion, and I had selected his features as beautiful. Beautiful! Great God! His yellow skin scarcely covered the work of muscles and arteries beneath; his hair was of a lustrous black, and flowing; his teeth of a pearly whiteness; but these luxuriances only formed a more horrid contrast with his watery eyes, that seemed almost of the same colour as the dun-white sockets in which they were set, his shrivelled complexion and straight black lips.

Victor Frankenstein created a monster that would haunt him forever. The creature, abandoned by its creator, seeks revenge against Victor and those he loves. This tale explores themes of scientific responsibility, the nature of humanity, and the consequences of playing God. The monster learns to speak and read, becoming articulate in its demands for companionship. When Victor refuses to create a mate for the creature, it murders Victor's brother William, frames the innocent Justine, and later kills Victor's best friend Clerval and bride Elizabeth.

The main characters include Victor Frankenstein, the ambitious scientist; the Monster, his abandoned creation; Elizabeth Lavenza, Victor's adopted sister and fiancée; Alphonse Frankenstein, Victor's father; William Frankenstein, Victor's younger brother; Justine Moritz, the Frankenstein family servant; Robert Walton, the Arctic explorer who tells the story; Henry Clerval, Victor's best friend; and De Lacey, the blind man who shows kindness to the Monster.

"Beware; for I am fearless, and therefore powerful," warns the Monster. The story unfolds through letters from Walton to his sister, creating a frame narrative that adds depth to the tale. Victor's obsession with creating life leads to his downfall, while the Monster's quest for acceptance turns to revenge when society rejects him. The novel explores themes of isolation, revenge, the dangers of unchecked ambition, and what makes us human. Both creator and creature are ultimately destroyed by their obsession with each other, with Victor dying in pursuit of the Monster in the Arctic, and the Monster disappearing into the wilderness, promising to destroy itself.`
  },
  '1342': {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    text: `PRIDE AND PREJUDICE by Jane Austen

CHAPTER I

It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.

However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.

"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?"

Mr. Bennet replied that he had not.

"But it is," returned she; "for Mrs. Long has just been here, and she told me all about it."

Mr. Bennet made no answer.

"Do you not want to know who has taken it?" cried his wife impatiently.

"You want to tell me, and I have no objection to hearing it."

Elizabeth Bennet must navigate the complex world of 19th century English society, where marriage and social status are paramount. She encounters the proud and wealthy Mr. Darcy, initially disliking his arrogant demeanor. Through misunderstandings involving the charming but deceptive Wickham, and the interference of the proud Lady Catherine de Bourgh, Elizabeth and Darcy must overcome their initial prejudices to find true love.

The main characters include Elizabeth Bennet, the intelligent heroine; Mr. Fitzwilliam Darcy, the proud wealthy gentleman; Jane Bennet, Elizabeth's gentle sister; Mr. Charles Bingley, Jane's love interest; Mr. Bennet, the witty father; Mrs. Bennet, the marriage-obsessed mother; Mr. Wickham, the charming soldier; Lady Catherine de Bourgh, Darcy's imperious aunt; Mr. Collins, the ridiculous clergyman; Charlotte Lucas, Elizabeth's practical friend; Mary Bennet, the bookish sister; Catherine "Kitty" Bennet and Lydia Bennet, the youngest sisters.

The novel explores themes of class, marriage, and personal growth as Elizabeth learns not to judge by first impressions, and Darcy learns to be more humble and considerate. The famous opening line sets the tone for a story about marriage, money, and social expectations. Elizabeth's wit and independence make her a memorable heroine, while Darcy's transformation from apparent arrogance to genuine humility creates one of literature's great love stories.

"I could easily forgive his pride, if he had not mortified mine," Elizabeth reflects, capturing the essence of their relationship. The story unfolds through social gatherings, misunderstandings, and revelations, culminating in the realization that first impressions can be deceiving and that true love requires understanding and growth from both parties.`
  },
  '2701': {
    title: 'Moby Dick; Or, The Whale',
    author: 'Herman Melville',
    text: `MOBY DICK OR, THE WHALE by Herman Melville

CHAPTER 1. Loomings.

Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation.

Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people's hats off—then, I account it high time to get to sea as soon as possible.

Captain Ahab commands the Pequod in his monomaniacal quest to kill the white whale that took his leg. Ishmael befriends the harpooner Queequeg, and together they join the crew of this doomed voyage. The novel explores themes of obsession, fate, and man's relationship with nature. Ahab's pursuit of Moby Dick becomes a metaphor for the human condition and the futility of revenge against the natural world.

The main characters include Ishmael, the narrator and sailor; Captain Ahab, the obsessed captain seeking revenge against the white whale; Queequeg, the noble harpooner from the South Seas; Starbuck, the first mate who questions Ahab's quest; Stubb, the cheerful second mate; Flask, the third mate; Fedallah, Ahab's mysterious Parsee harpooner; Tashtego, the Native American harpooner; Daggoo, the African harpooner; and Moby Dick himself, the legendary white whale.

The story follows the crew of the Pequod as they hunt whales in the Pacific, but Ahab's true purpose is revenge against the white whale that destroyed his leg in a previous encounter. The novel is rich with symbolism, exploring themes of knowledge versus ignorance, fate versus free will, and civilization versus nature. Melville's detailed descriptions of whaling and maritime life create an epic tale of man against nature.

"From hell's heart I stab at thee; for hate's sake I spit my last breath at thee," Ahab declares in his final confrontation with Moby Dick. The whale represents the unknowable forces of nature and fate, while Ahab embodies human obsession and the desire to control the uncontrollable. The novel ends tragically with the destruction of the Pequod and all hands except Ishmael, who survives to tell the tale.`
  }
}

export class GutenbergApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'GutenbergApiError'
  }
}

// Mock API that always works instantly
export const gutenbergApi = {
  /**
   * Resolve book metadata (always succeeds with mock data)
   */
  async resolve(id: string): Promise<BookResolve> {
    console.log(`📚 [MOCK] Resolving book ${id}...`)
    
    const mockBook = MOCK_BOOKS[id]
    if (mockBook) {
      return {
        id,
        url: `https://www.gutenberg.org/ebooks/${id}`,
        title: mockBook.title,
        author: mockBook.author,
        timestamp: new Date().toISOString()
      }
    }

    // Fallback for unknown books
    return {
      id,
      url: `https://www.gutenberg.org/ebooks/${id}`,
      title: `Book ${id}`,
      author: 'Unknown Author',
      timestamp: new Date().toISOString()
    }
  },

  /**
   * Get book text (always succeeds with mock data)
   */
  async getText(id: string): Promise<BookText> {
    console.log(`📖 [MOCK] Getting text for book ${id}...`)
    
    const mockBook = MOCK_BOOKS[id]
    if (mockBook) {
      const wordCount = mockBook.text.split(/\s+/).length
      return {
        id,
        title: mockBook.title,
        author: mockBook.author,
        text: mockBook.text,
        wordCount,
        timestamp: new Date().toISOString(),
        textLength: mockBook.text.length
      }
    }

    // Fallback for unknown books
    const fallbackText = `This is a mock book with ID ${id}. No actual text content available.`
    return {
      id,
      title: `Book ${id}`,
      author: 'Unknown Author',
      text: fallbackText,
      wordCount: fallbackText.split(/\s+/).length,
      timestamp: new Date().toISOString(),
      textLength: fallbackText.length
    }
  },

  /**
   * Get book preview (always succeeds with mock data)
   */
  async getPreview(id: string, maxLength: number = 500): Promise<BookPreview> {
    console.log(`👀 [MOCK] Getting preview for book ${id}...`)
    
    const mockBook = MOCK_BOOKS[id]
    if (mockBook) {
      const preview = mockBook.text.substring(0, maxLength)
      const hasMore = mockBook.text.length > maxLength
      const wordCount = mockBook.text.split(/\s+/).length
      
      return {
        id,
        title: mockBook.title,
        author: mockBook.author,
        preview: preview + (hasMore ? '...' : ''),
        hasMore,
        wordCount,
        fullTextLength: mockBook.text.length,
        timestamp: new Date().toISOString()
      }
    }

    // Fallback for unknown books
    const fallbackPreview = `This is a mock book with ID ${id}. No actual preview available.`
    return {
      id,
      title: `Book ${id}`,
      author: 'Unknown Author',
      preview: fallbackPreview,
      hasMore: false,
      wordCount: fallbackPreview.split(/\s+/).length,
      fullTextLength: fallbackPreview.length,
      timestamp: new Date().toISOString()
    }
  }
}

// Mock Analysis API
export const analysisApi = {
  /**
   * Analyze characters in book text (always succeeds with mock data)
   */
  async analyzeCharacters(request: CharacterAnalysisRequest): Promise<CharacterAnalysisResult> {
    console.log(`🔍 [MOCK] Analyzing characters in text (${request.text.length} chars)...`)
    
    const bookId = request.text.includes('Frankenstein') ? '84' : 
                   request.text.includes('Pride') ? '1342' : 
                   request.text.includes('Moby') ? '2701' : '1'
    
    const mockBook = MOCK_BOOKS[bookId]
    const bookTitle = mockBook?.title || 'Mock Book'
    const bookAuthor = mockBook?.author || 'Mock Author'

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100))

    const mockResults: CharacterAnalysisResult = {
      success: true,
      characters: [
        {
          name: mockBook ? getMainCharacter(request.text) : 'Alice',
          aliases: mockBook ? getMainCharacterAliases(request.text) : ['A'],
          importance: 95,
          mentions: 25,
          description: 'Main protagonist of the story'
        },
        {
          name: mockBook ? getSecondCharacter(request.text) : 'Bob',
          aliases: [],
          importance: 80,
          mentions: 18,
          description: 'Secondary character with significant role'
        },
        {
          name: mockBook ? getThirdCharacter(request.text) : 'Charlie',
          aliases: [],
          importance: 65,
          mentions: 12,
          description: 'Supporting character'
        }
      ],
      method: 'ollama',
      processing_time_ms: 1000,
      text_length: request.text.length,
      total_characters: 3,
      timestamp: new Date().toISOString()
    }

    return mockResults
  },

  /**
   * Health check (always succeeds)
   */
  async health(): Promise<AnalysisHealth> {
    return {
      compromise: true,
      ollama: true,
      timestamp: new Date().toISOString()
    }
  }
}

// Helper functions for mock character data
function getMainCharacter(text: string): string {
  if (text.includes('Frankenstein')) return 'Victor Frankenstein'
  if (text.includes('Pride')) return 'Elizabeth Bennet'
  if (text.includes('Moby')) return 'Ishmael'
  return 'Alice'
}

function getMainCharacterAliases(text: string): string[] {
  if (text.includes('Frankenstein')) return ['Victor', 'Frankenstein']
  if (text.includes('Pride')) return ['Elizabeth', 'Lizzy', 'Eliza']
  if (text.includes('Moby')) return ['Narrator']
  return ['A']
}

function getSecondCharacter(text: string): string {
  if (text.includes('Frankenstein')) return 'The Monster'
  if (text.includes('Pride')) return 'Mr. Darcy'
  if (text.includes('Moby')) return 'Captain Ahab'
  return 'Bob'
}

function getThirdCharacter(text: string): string {
  if (text.includes('Frankenstein')) return 'Elizabeth Lavenza'
  if (text.includes('Pride')) return 'Jane Bennet'
  if (text.includes('Moby')) return 'Queequeg'
  return 'Charlie'
}
