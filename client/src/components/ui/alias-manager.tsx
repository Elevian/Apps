import { useState, useEffect, ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  X, 
  Edit3, 
  Save, 
  RefreshCw, 
  Users, 
  Hash,
  Trash2,
  Download,
  Upload
} from 'lucide-react'
import { Character } from '@/lib/api/schemas'
import { toast } from 'sonner'

export interface EditableCharacter extends Character {
  id: string
  isEditing: boolean
  tempName: string
  tempAliases: string[]
}

export interface AliasManagerProps {
  characters: Character[]
  onCharactersUpdate: (characters: Character[]) => void
  onRecalculate?: () => void
  isRecalculating?: boolean
  className?: string
}

export function AliasManager({
  characters,
  onCharactersUpdate,
  onRecalculate,
  isRecalculating = false,
  className
}: AliasManagerProps) {
  const [editableCharacters, setEditableCharacters] = useState<EditableCharacter[]>([])
  const [newCharacterName, setNewCharacterName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // Initialize editable characters when characters prop changes
  useEffect(() => {
    setEditableCharacters(characters.map((char, index) => ({
      ...char,
      id: `char-${index}`,
      isEditing: false,
      tempName: char.name,
      tempAliases: [...char.aliases]
    })))
  }, [characters])

  /**
   * Start editing a character
   */
  const startEditing = (id: string) => {
    setEditableCharacters(prev => prev.map(char => 
      char.id === id 
        ? { ...char, isEditing: true, tempName: char.name, tempAliases: [...char.aliases] }
        : { ...char, isEditing: false }
    ))
  }

  /**
   * Save character edits
   */
  const saveCharacter = (id: string) => {
    setEditableCharacters(prev => {
      const updated = prev.map(char => {
        if (char.id === id) {
          return {
            ...char,
            name: char.tempName.trim(),
            aliases: char.tempAliases.filter(alias => alias.trim() !== ''),
            isEditing: false
          }
        }
        return char
      })
      
      // Update parent component
      const updatedCharacters = updated.map(({ id, isEditing, tempName, tempAliases, ...char }) => char)
      onCharactersUpdate(updatedCharacters)
      
      return updated
    })

    toast.success('Character updated successfully')
  }

  /**
   * Cancel editing
   */
  const cancelEditing = (id: string) => {
    setEditableCharacters(prev => prev.map(char => 
      char.id === id 
        ? { ...char, isEditing: false, tempName: char.name, tempAliases: [...char.aliases] }
        : char
    ))
  }

  /**
   * Update temporary name
   */
  const updateTempName = (id: string, name: string) => {
    setEditableCharacters(prev => prev.map(char => 
      char.id === id ? { ...char, tempName: name } : char
    ))
  }

  /**
   * Add alias to character
   */
  const addAlias = (id: string) => {
    setEditableCharacters(prev => prev.map(char => 
      char.id === id ? { ...char, tempAliases: [...char.tempAliases, ''] } : char
    ))
  }

  /**
   * Update alias
   */
  const updateAlias = (id: string, aliasIndex: number, value: string) => {
    setEditableCharacters(prev => prev.map(char => {
      if (char.id === id) {
        const newAliases = [...char.tempAliases]
        newAliases[aliasIndex] = value
        return { ...char, tempAliases: newAliases }
      }
      return char
    }))
  }

  /**
   * Remove alias
   */
  const removeAlias = (id: string, aliasIndex: number) => {
    setEditableCharacters(prev => prev.map(char => {
      if (char.id === id) {
        const newAliases = char.tempAliases.filter((_, index) => index !== aliasIndex)
        return { ...char, tempAliases: newAliases }
      }
      return char
    }))
  }

  /**
   * Delete character
   */
  const deleteCharacter = (id: string) => {
    setEditableCharacters(prev => {
      const updated = prev.filter(char => char.id !== id)
      const updatedCharacters = updated.map(({ id, isEditing, tempName, tempAliases, ...char }) => char)
      onCharactersUpdate(updatedCharacters)
      return updated
    })
    toast.success('Character deleted')
  }

  /**
   * Add new character
   */
  const addNewCharacter = () => {
    if (!newCharacterName.trim()) {
      toast.error('Please enter a character name')
      return
    }

    const newCharacter: EditableCharacter = {
      id: `char-${Date.now()}`,
      name: newCharacterName.trim(),
      aliases: [],
      importance: 50,
      mentions: 0,
      isEditing: false,
      tempName: newCharacterName.trim(),
      tempAliases: []
    }

    setEditableCharacters(prev => {
      const updated = [...prev, newCharacter]
      const updatedCharacters = updated.map(({ id, isEditing, tempName, tempAliases, ...char }) => char)
      onCharactersUpdate(updatedCharacters)
      return updated
    })

    setNewCharacterName('')
    setShowAddForm(false)
    toast.success('Character added successfully')
  }

  /**
   * Export characters to JSON
   */
  const exportCharacters = () => {
    const data = JSON.stringify(editableCharacters.map(({ id, isEditing, tempName, tempAliases, ...char }) => char), null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'characters.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Characters exported')
  }

  /**
   * Import characters from JSON
   */
  const importCharacters = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as Character[]
        setEditableCharacters(imported.map((char, index) => ({
          ...char,
          id: `char-${Date.now()}-${index}`,
          isEditing: false,
          tempName: char.name,
          tempAliases: [...char.aliases]
        })))
        onCharactersUpdate(imported)
        toast.success(`Imported ${imported.length} characters`)
      } catch (error) {
        toast.error('Failed to import characters')
      }
    }
    reader.readAsText(file)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Character Alias Manager
            <Badge variant="secondary" className="ml-2">
              {editableCharacters.length} characters
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".json"
              onChange={importCharacters}
              className="hidden"
              id="import-characters"
            />
            <label htmlFor="import-characters">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-1" />
                  Import
                </span>
              </Button>
            </label>
            
            <Button variant="outline" size="sm" onClick={exportCharacters}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            
            {onRecalculate && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRecalculate}
                disabled={isRecalculating}
              >
                {isRecalculating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    Recalculating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Recalculate
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add New Character */}
        <div className="space-y-2">
          <AnimatePresence>
            {showAddForm ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg"
              >
                <Input
                  placeholder="Enter character name..."
                  value={newCharacterName}
                  onChange={(e) => setNewCharacterName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addNewCharacter()
                    if (e.key === 'Escape') setShowAddForm(false)
                  }}
                  autoFocus
                />
                <Button size="sm" onClick={addNewCharacter}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAddForm(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Character
              </Button>
            )}
          </AnimatePresence>
        </div>

        <Separator />

        {/* Character List */}
        <div className="space-y-3">
          <AnimatePresence>
            {editableCharacters.map((character) => (
              <motion.div
                key={character.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border rounded-lg p-4 space-y-3"
              >
                {character.isEditing ? (
                  // Edit Mode
                  <div className="space-y-3">
                    {/* Character Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Character Name</label>
                      <Input
                        value={character.tempName}
                        onChange={(e) => updateTempName(character.id, e.target.value)}
                        placeholder="Character name..."
                      />
                    </div>

                    {/* Aliases */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Aliases</label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addAlias(character.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Alias
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {character.tempAliases.map((alias, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={alias}
                              onChange={(e) => updateAlias(character.id, index, e.target.value)}
                              placeholder="Alias name..."
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAlias(character.id, index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" onClick={() => saveCharacter(character.id)}>
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => cancelEditing(character.id)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{character.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {character.mentions} mentions
                          </span>
                          <span>Importance: {character.importance}%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(character.id)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCharacter(character.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Aliases Display */}
                    {character.aliases.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">Aliases:</span>
                        <div className="flex flex-wrap gap-1">
                          {character.aliases.map((alias, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {alias}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {editableCharacters.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No characters found. Add characters manually or run analysis to extract them automatically.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact version for smaller spaces
export function CompactAliasManager({
  characters,
  onCharactersUpdate,
  onRecalculate,
  isRecalculating = false,
  className
}: AliasManagerProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isExpanded) {
    return (
      <div className={`flex items-center justify-between p-3 border rounded-lg bg-muted/30 ${className}`}>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">{characters.length} characters</span>
          {characters.some(c => c.aliases.length > 0) && (
            <Badge variant="secondary" className="text-xs">
              {characters.reduce((sum, c) => sum + c.aliases.length, 0)} aliases
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {onRecalculate && (
            <Button size="sm" variant="ghost" onClick={onRecalculate} disabled={isRecalculating}>
              <RefreshCw className={`h-3 w-3 ${isRecalculating ? 'animate-spin' : ''}`} />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setIsExpanded(true)}>
            <Edit3 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <AliasManager
      characters={characters}
      onCharactersUpdate={onCharactersUpdate}
      onRecalculate={onRecalculate}
      isRecalculating={isRecalculating}
      className={className}
    />
  )
}
