import { UserMemoryItem, UserProfile } from '../types';

const MEMORY_STORAGE_KEY = 'alpha_ai_user_memory';
const PROFILE_STORAGE_KEY = 'alpha_ai_user_profile';

export class MemoryManager {
  public static getMemories(): UserMemoryItem[] {
    try {
      const data = localStorage.getItem(MEMORY_STORAGE_KEY);
      if (data) {
        const parsed: UserMemoryItem[] = JSON.parse(data);
        return parsed.map(m => ({
          ...m,
          createdAt: m.createdAt || new Date().toISOString(),
          updatedAt: m.updatedAt || m.createdAt || new Date().toISOString()
        }));
      }
      const initialDate = new Date().toISOString();
      return [
        {
          id: 'mem-1',
          key: 'User Name',
          value: 'Anshu',
          category: 'preference',
          createdAt: initialDate,
          updatedAt: initialDate
        },
        {
          id: 'mem-2',
          key: 'Preferred Stream / Field',
          value: 'Maharashtra Board Class 12 Science & Coding (React, Flutter, Python)',
          category: 'preference',
          createdAt: initialDate,
          updatedAt: initialDate
        },
        {
          id: 'mem-3',
          key: 'Preferred Language',
          value: 'Simple natural Hinglish',
          category: 'instruction',
          createdAt: initialDate,
          updatedAt: initialDate
        }
      ];
    } catch (e) {
      return [];
    }
  }

  public static saveMemories(memories: UserMemoryItem[]): void {
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
    } catch (e) {
      console.error('Failed to save user memories', e);
    }
  }

  public static addMemory(
    key: string, 
    value: string, 
    category: UserMemoryItem['category'] = 'general'
  ): UserMemoryItem {
    const memories = this.getMemories();
    const now = new Date().toISOString();
    const newItem: UserMemoryItem = {
      id: `mem-${Date.now()}`,
      key: key.trim(),
      value: value.trim(),
      category,
      createdAt: now,
      updatedAt: now
    };
    memories.unshift(newItem);
    this.saveMemories(memories);
    return newItem;
  }

  public static updateMemory(
    id: string,
    key: string,
    value: string,
    category: UserMemoryItem['category'] = 'general'
  ): UserMemoryItem | null {
    const memories = this.getMemories();
    const index = memories.findIndex(m => m.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString();
    memories[index] = {
      ...memories[index],
      key: key.trim(),
      value: value.trim(),
      category,
      updatedAt: now
    };

    this.saveMemories(memories);
    return memories[index];
  }

  public static deleteMemory(id: string): void {
    const memories = this.getMemories().filter(m => m.id !== id);
    this.saveMemories(memories);
  }

  public static clearAllMemories(): void {
    localStorage.removeItem(MEMORY_STORAGE_KEY);
  }

  public static exportMemoriesJSON(): string {
    const memories = this.getMemories();
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      count: memories.length,
      memories
    }, null, 2);
  }

  public static importMemoriesJSON(jsonString: string): { success: boolean; count: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      const itemsToImport = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.memories) ? parsed.memories : null);
      
      if (!itemsToImport) {
        return { success: false, count: 0, error: 'Invalid JSON structure. Expected array or memories field.' };
      }

      const current = this.getMemories();
      const existingIds = new Set(current.map(m => m.id));
      let importedCount = 0;

      const now = new Date().toISOString();
      for (const rawItem of itemsToImport) {
        if (rawItem.key && rawItem.value) {
          const id = rawItem.id && !existingIds.has(rawItem.id) ? rawItem.id : `mem-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const category: UserMemoryItem['category'] = ['preference', 'fact', 'instruction', 'general'].includes(rawItem.category) ? rawItem.category : 'general';
          
          current.unshift({
            id,
            key: String(rawItem.key).trim(),
            value: String(rawItem.value).trim(),
            category,
            createdAt: rawItem.createdAt || now,
            updatedAt: rawItem.updatedAt || rawItem.createdAt || now
          });
          importedCount++;
        }
      }

      this.saveMemories(current);
      return { success: true, count: importedCount };
    } catch (err: any) {
      return { success: false, count: 0, error: err?.message || 'Failed to parse JSON file.' };
    }
  }

  public static autoExtractAndSave(text: string): UserMemoryItem | null {
    if (!text || text.length < 10) return null;
    
    // Check patterns like "remember that...", "my favorite...", "i prefer...", "call me..."
    const lower = text.toLowerCase();
    let extractedKey = '';
    let extractedVal = '';
    let category: UserMemoryItem['category'] = 'preference';

    if (lower.includes('my name is ') || lower.includes('call me ')) {
      const nameMatch = text.match(/(?:my name is|call me)\s+([A-Za-z0-9\s]+)(?:\.|$|,)/i);
      if (nameMatch) {
        extractedKey = 'User Name';
        extractedVal = nameMatch[1].trim();
        category = 'fact';
      }
    } else if (lower.includes('i prefer ') || lower.includes('my preference is ')) {
      const prefMatch = text.match(/(?:i prefer|my preference is)\s+(.+?)(?:\.|$)/i);
      if (prefMatch) {
        extractedKey = 'User Preference';
        extractedVal = prefMatch[1].trim();
        category = 'preference';
      }
    } else if (lower.includes('remember that ') || lower.includes('note that ')) {
      const remMatch = text.match(/(?:remember that|note that)\s+(.+?)(?:\.|$)/i);
      if (remMatch) {
        extractedKey = 'User Instruction';
        extractedVal = remMatch[1].trim();
        category = 'instruction';
      }
    }

    if (extractedKey && extractedVal) {
      // Check if duplicate key/val already exists
      const current = this.getMemories();
      const duplicate = current.find(m => m.key.toLowerCase() === extractedKey.toLowerCase() && m.value.toLowerCase() === extractedVal.toLowerCase());
      if (!duplicate) {
        return this.addMemory(extractedKey, extractedVal, category);
      }
    }

    return null;
  }

  public static formatMemoriesForPrompt(): string {
    const memories = this.getMemories();
    if (memories.length === 0) return '';
    return '\nSaved User Memory & Preferences:\n' + memories.map(m => `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}`).join('\n') + '\n';
  }

  public static getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return {
      id: 'usr-default',
      name: 'Anshu',
      email: 'anshu@anshu.ai',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      preferredLanguage: 'Hinglish',
      provider: 'guest',
      isLoggedIn: true,
      joinedAt: new Date().toISOString()
    };
  }

  public static saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save user profile', e);
    }
  }
}

export const memoryManager = MemoryManager;


