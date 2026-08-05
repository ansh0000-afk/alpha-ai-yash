import { ChatSession } from '../types';
import { formatChatAsText } from './export';

/**
 * Copies the complete conversation formatted text to the user's clipboard.
 */
export async function copyConversationToClipboard(session: ChatSession): Promise<boolean> {
  try {
    const text = formatChatAsText(session);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy conversation:', err);
    return false;
  }
}

/**
 * Shares a chat session using Web Share API or falls back to copying to clipboard.
 */
export async function shareChatSession(session: ChatSession): Promise<{ success: boolean; method: 'web-share' | 'clipboard' }> {
  const textContent = formatChatAsText(session);
  const title = session.title || 'Alpha AI Chat Export';
  const shareText = `Alpha AI Conversation: "${title}" (${session.messages?.length || 0} messages)\n\n${textContent.slice(0, 500)}...`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: shareText,
        url: window.location.href
      });
      return { success: true, method: 'web-share' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'web-share' };
      }
    }
  }

  // Fallback to clipboard
  const copied = await copyConversationToClipboard(session);
  return { success: copied, method: 'clipboard' };
}

/**
 * Formats date and time nicely for display (e.g., "Aug 4, 2026 at 10:05 AM").
 */
export function formatDateTime(isoString: string): string {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' • ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
}
