// Super simple mock API that always works - no complex types or dependencies

export const simpleApi = {
  // Always return success for book resolution  
  async resolve(id: string) {
    await new Promise(resolve => setTimeout(resolve, 300)) // Simulate network delay
    
    const books: Record<string, any> = {
      '84': { title: 'Frankenstein', author: 'Mary Shelley' },
      '1342': { title: 'Pride and Prejudice', author: 'Jane Austen' },
      '2701': { title: 'Moby Dick', author: 'Herman Melville' }
    }
    
    const book = books[id] || { title: `Book ${id}`, author: 'Unknown Author' }
    
    return {
      id,
      url: `https://www.gutenberg.org/files/${id}/${id}.txt`,
      title: book.title,
      author: book.author,
      timestamp: new Date().toISOString()
    }
  },

  // Always return success for book text
  async fetchText(id: string) {
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate download
    
    const mockTexts: Record<string, string> = {
      '84': `Victor Frankenstein, a young scientist, becomes obsessed with creating life. He succeeds in creating a creature, but horrified by his creation, he abandons it. The Monster, intelligent but hideous, seeks revenge against Victor for abandoning him. Elizabeth Lavenza, Victor's fiancée, becomes a victim of the Monster's rage. Henry Clerval, Victor's best friend, also falls victim to the creature. The novel explores themes of scientific responsibility and the consequences of playing God. Robert Walton tells the story through letters to his sister. The Monster demands Victor create a companion, but Victor ultimately refuses. The story ends tragically with both creator and creature destroyed by their mutual obsession.`,
      
      '1342': `Elizabeth Bennet, an intelligent young woman, meets the proud Mr. Darcy at a ball. Initially put off by his arrogance, Elizabeth gradually discovers Darcy's true character. Jane Bennet, Elizabeth's sister, falls in love with Mr. Bingley, Darcy's friend. Mr. Bennet, their father, watches the romantic entanglements with amusement. Mrs. Bennet is obsessed with marrying off her daughters. Mr. Wickham, a charming soldier, initially seems appealing but proves deceptive. Lady Catherine de Bourgh opposes Darcy's interest in Elizabeth. Through misunderstandings and revelations, Elizabeth and Darcy overcome their pride and prejudice to find true love. The novel satirizes the marriage customs and social expectations of Regency England.`,
      
      '2701': `Ishmael, the narrator, decides to go to sea and joins the crew of the Pequod. Captain Ahab commands the ship with a monomaniacal obsession to kill Moby Dick, the white whale that destroyed his leg. Queequeg, a harpooner from the South Seas, becomes Ishmael's close friend. Starbuck, the first mate, questions Ahab's dangerous quest. Stubb and Flask serve as second and third mates. The crew hunts whales across the Pacific while Ahab pursues his personal vendetta. Fedallah, a mysterious Parsee, serves as Ahab's personal harpooner and oracle. The novel explores themes of fate, obsession, and man's relationship with nature. The story climaxes when the Pequod finally encounters Moby Dick, resulting in the destruction of the ship and all hands except Ishmael.`
    }
    
    const text = mockTexts[id] || `This is a sample text for book ${id}. It contains characters like Alice, Bob, Charlie, and Diana who interact throughout the story. Alice says "Hello Bob!" and Bob replies "Nice to see you, Alice." Charlie mentions Diana frequently, and they have conversations about various topics. The story explores themes of friendship and adventure.`
    
    const books: Record<string, any> = {
      '84': { title: 'Frankenstein', author: 'Mary Shelley' },
      '1342': { title: 'Pride and Prejudice', author: 'Jane Austen' },
      '2701': { title: 'Moby Dick', author: 'Herman Melville' }
    }
    
    const book = books[id] || { title: `Book ${id}`, author: 'Unknown Author' }
    
    return {
      id,
      title: book.title,
      author: book.author,
      text,
      wordCount: text.split(/\s+/).length,
      timestamp: new Date().toISOString(),
      textLength: text.length
    }
  },

  // Always return success for character analysis
  async analyzeCharacters(request: any) {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate analysis
    
    const mockCharacters: Record<string, any[]> = {
      '84': [
        { name: 'Victor Frankenstein', aliases: ['Victor', 'Frankenstein'], importance: 0.9, mentions: 45, description: 'The scientist who creates the monster' },
        { name: 'The Monster', aliases: ['Creature', 'Fiend'], importance: 0.8, mentions: 35, description: 'Victor\'s abandoned creation seeking revenge' },
        { name: 'Elizabeth Lavenza', aliases: ['Elizabeth'], importance: 0.6, mentions: 25, description: 'Victor\'s fiancée and adopted sister' },
        { name: 'Henry Clerval', aliases: ['Clerval', 'Henry'], importance: 0.5, mentions: 20, description: 'Victor\'s best friend' },
        { name: 'Robert Walton', aliases: ['Walton'], importance: 0.4, mentions: 15, description: 'Arctic explorer who tells the story' }
      ],
      '1342': [
        { name: 'Elizabeth Bennet', aliases: ['Elizabeth', 'Lizzy', 'Eliza'], importance: 0.9, mentions: 50, description: 'The intelligent and independent heroine' },
        { name: 'Mr. Darcy', aliases: ['Darcy', 'Fitzwilliam Darcy'], importance: 0.8, mentions: 40, description: 'The proud wealthy gentleman' },
        { name: 'Jane Bennet', aliases: ['Jane'], importance: 0.6, mentions: 30, description: 'Elizabeth\'s gentle elder sister' },
        { name: 'Mr. Bingley', aliases: ['Bingley', 'Charles Bingley'], importance: 0.5, mentions: 25, description: 'Darcy\'s friend and Jane\'s love interest' },
        { name: 'Mr. Bennet', aliases: ['Mr. Bennet'], importance: 0.4, mentions: 20, description: 'The witty father of the Bennet sisters' }
      ],
      '2701': [
        { name: 'Ishmael', aliases: ['Narrator'], importance: 0.9, mentions: 40, description: 'The narrator and sailor' },
        { name: 'Captain Ahab', aliases: ['Ahab'], importance: 0.8, mentions: 35, description: 'The obsessed captain hunting Moby Dick' },
        { name: 'Queequeg', aliases: ['Queequeq'], importance: 0.6, mentions: 25, description: 'The noble harpooner and Ishmael\'s friend' },
        { name: 'Starbuck', aliases: ['First Mate'], importance: 0.5, mentions: 20, description: 'The cautious first mate' },
        { name: 'Moby Dick', aliases: ['White Whale', 'The Whale'], importance: 0.7, mentions: 30, description: 'The legendary white whale' }
      ]
    }
    
    const characters = mockCharacters[request.text?.includes('Victor') ? '84' : 
                                    request.text?.includes('Elizabeth') ? '1342' : 
                                    request.text?.includes('Ishmael') ? '2701' : '84'] || mockCharacters['84']
    
    return {
      success: true,
      characters,
      method: 'mock',
      processing_time_ms: 1000,
      text_length: request.text?.length || 1000,
      total_characters: characters.length,
      timestamp: new Date().toISOString()
    }
  },

  // Health check always succeeds
  async health() {
    return {
      compromise: true,
      ollama: false,
      timestamp: new Date().toISOString()
    }
  }
}
