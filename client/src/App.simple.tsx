import React, { useState } from 'react'

// Super simple working app for testing
export default function App() {
  const [bookId, setBookId] = useState('84')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzeBook = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Step 1: Resolve book
      console.log('Resolving book:', bookId)
      const resolveResponse = await fetch(`/api/gutenberg/resolve/${bookId}`)
      if (!resolveResponse.ok) {
        throw new Error(`Failed to resolve book: ${resolveResponse.statusText}`)
      }
      const bookInfo = await resolveResponse.json()
      console.log('Book resolved:', bookInfo)

      // Step 2: Fetch text
      console.log('Fetching text...')
      const textResponse = await fetch(`/api/gutenberg/text/${bookId}`)
      if (!textResponse.ok) {
        throw new Error(`Failed to fetch text: ${textResponse.statusText}`)
      }
      const textData = await textResponse.json()
      console.log('Text fetched:', textData.title, textData.wordCount, 'words')

      // Step 3: Analyze characters
      console.log('Analyzing characters...')
      const analysisResponse = await fetch('/api/analyze/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textData.text,
          mode: 'auto',
          max_characters: 20
        })
      })
      
      if (!analysisResponse.ok) {
        throw new Error(`Failed to analyze: ${analysisResponse.statusText}`)
      }
      
      const analysisData = await analysisResponse.json()
      console.log('Analysis complete:', analysisData)

      setResult({
        book: textData,
        analysis: analysisData
      })

    } catch (err) {
      console.error('Analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1>📚 Gutenberg Character Analysis</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="bookId" style={{ display: 'block', marginBottom: '5px' }}>
          Book ID:
        </label>
        <input
          id="bookId"
          type="text"
          value={bookId}
          onChange={(e) => setBookId(e.target.value)}
          placeholder="84, 1342, or 2701"
          style={{
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginRight: '10px',
            width: '200px'
          }}
        />
        <button
          onClick={analyzeBook}
          disabled={loading || !bookId}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Analyzing...' : 'Analyze Book'}
        </button>
      </div>

      {loading && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f0f8ff', 
          border: '1px solid #007bff',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>🔄 Analysis in Progress...</h3>
          <p>This may take a few moments. Please wait.</p>
        </div>
      )}

      {error && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#ffe6e6', 
          border: '1px solid #ff0000',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#e6ffe6', 
          border: '1px solid #00aa00',
          borderRadius: '4px'
        }}>
          <h3>✅ Analysis Complete</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <h4>📖 Book Information</h4>
            <p><strong>Title:</strong> {result.book.title}</p>
            <p><strong>Author:</strong> {result.book.author}</p>
            <p><strong>Word Count:</strong> {result.book.wordCount.toLocaleString()}</p>
          </div>

          <div>
            <h4>👥 Characters Found</h4>
            {result.analysis.characters?.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
                {result.analysis.characters.map((char: any, index: number) => (
                  <div key={index} style={{
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}>
                    <strong>{char.name}</strong>
                    {char.aliases?.length > 0 && (
                      <div style={{ fontSize: '0.9em', color: '#666' }}>
                        Aliases: {char.aliases.join(', ')}
                      </div>
                    )}
                    <div style={{ fontSize: '0.8em', color: '#888' }}>
                      Mentions: {char.mentions || 'N/A'} | 
                      Importance: {((char.importance || 0) * 100).toFixed(0)}%
                    </div>
                    {char.description && (
                      <div style={{ fontSize: '0.9em', marginTop: '5px', fontStyle: 'italic' }}>
                        {char.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No characters found in the analysis.</p>
            )}
          </div>

          <div style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
            <p>Analysis method: {result.analysis.method}</p>
            <p>Processing time: {result.analysis.processing_time_ms}ms</p>
          </div>
        </div>
      )}

      <div style={{ marginTop: '40px', fontSize: '0.8em', color: '#888' }}>
        <p>📚 Try these sample books:</p>
        <ul>
          <li><strong>84</strong> - Frankenstein by Mary Shelley</li>
          <li><strong>1342</strong> - Pride and Prejudice by Jane Austen</li>
          <li><strong>2701</strong> - Moby Dick by Herman Melville</li>
        </ul>
      </div>
    </div>
  )
}
