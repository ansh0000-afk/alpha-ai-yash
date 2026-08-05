import jsPDF from 'jspdf';
import { ChatSession } from '../types';

/**
 * Formats a ChatSession object into clean plain text for export.
 */
export function formatChatAsText(session: ChatSession): string {
  const header = `==================================================\n` +
                 `ALPHA AI CHAT SESSION EXPORT\n` +
                 `==================================================\n` +
                 `Title: ${session.title || 'Untitled Session'}\n` +
                 `Session ID: ${session.id}\n` +
                 `Created At: ${session.createdAt ? new Date(session.createdAt).toLocaleString() : 'N/A'}\n` +
                 `Updated At: ${session.updatedAt ? new Date(session.updatedAt).toLocaleString() : 'N/A'}\n` +
                 `Total Messages: ${session.messages?.length || 0}\n` +
                 `==================================================\n\n`;

  if (!session.messages || session.messages.length === 0) {
    return header + '(No messages in this chat session)';
  }

  const messagesText = session.messages.map((msg, index) => {
    const roleName = msg.role === 'user' ? 'USER' : msg.role === 'assistant' ? 'ALPHA AI' : 'SYSTEM';
    const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '';
    let msgStr = `[${index + 1}] ${roleName} (${timestamp})\n`;
    if (msg.model) msgStr += `Model: ${msg.model}\n`;
    msgStr += `--------------------------------------------------\n`;
    msgStr += `${msg.content || ''}\n`;

    if (msg.groundingSources && msg.groundingSources.length > 0) {
      msgStr += `\nGrounding Sources:\n`;
      msg.groundingSources.forEach((src) => {
        msgStr += ` - ${src.title} (${src.url})\n`;
      });
    }

    if (msg.attachedDoc) {
      msgStr += `\nAttached Document: ${msg.attachedDoc.name} (${msg.attachedDoc.size} bytes)\n`;
    }

    if (msg.toolExecutions && msg.toolExecutions.length > 0) {
      msgStr += `\nTool Executions: ${msg.toolExecutions.map(t => t.name).join(', ')}\n`;
    }

    msgStr += `\n`;
    return msgStr;
  }).join('\n');

  return header + messagesText;
}

/**
 * Utility to trigger browser file download given a blob or string.
 */
export function downloadFile(content: string | Blob, fileName: string, mimeType: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports a chat session to a TXT file download.
 */
export function exportChatToTXT(session: ChatSession): void {
  const textContent = formatChatAsText(session);
  const safeTitle = (session.title || 'chat-session').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  downloadFile(textContent, `${safeTitle}.txt`, 'text/plain;charset=utf-8');
}

/**
 * Exports a chat session to a styled PDF file download using jsPDF.
 */
export function exportChatToPDF(session: ChatSession): void {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('ALPHA AI CHAT EXPORT', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  const exportDate = new Date().toLocaleDateString();
  const sessionTitle = session.title || 'Untitled Session';
  doc.text(`Title: ${sessionTitle}  |  Exported: ${exportDate}`, margin, 20);

  y = 35;

  const checkPageOverflow = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 10) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const messages = session.messages || [];

  if (messages.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('No messages found in this chat session.', margin, y);
  } else {
    messages.forEach((msg, idx) => {
      const isUser = msg.role === 'user';
      const roleText = isUser ? 'USER' : msg.role === 'assistant' ? 'ALPHA AI' : 'SYSTEM';
      const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

      // Header row for message
      checkPageOverflow(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      if (isUser) {
        doc.setTextColor(99, 102, 241); // indigo-500
      } else if (msg.role === 'assistant') {
        doc.setTextColor(168, 85, 247); // purple-500
      } else {
        doc.setTextColor(100, 116, 139); // slate-500
      }
      doc.text(`[${idx + 1}] ${roleText}`, margin, y);

      if (timeStr) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`${timeStr}`, margin + 35, y);
      }
      y += 6;

      // Message Content
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);

      const splitText = doc.splitTextToSize(msg.content || '(empty content)', contentWidth);
      const textHeight = splitText.length * 4.2;

      checkPageOverflow(textHeight + 6);
      doc.text(splitText, margin, y);
      y += textHeight + 4;

      // Grounding sources if present
      if (msg.groundingSources && msg.groundingSources.length > 0) {
        checkPageOverflow(8);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        const sourceTitles = msg.groundingSources.map(s => s.title).join(', ');
        const wrappedSources = doc.splitTextToSize(`Sources: ${sourceTitles}`, contentWidth);
        doc.text(wrappedSources, margin, y);
        y += (wrappedSources.length * 3.8) + 2;
      }

      // Attached document label if present
      if (msg.attachedDoc) {
        checkPageOverflow(6);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Attached Doc: ${msg.attachedDoc.name}`, margin, y);
        y += 5;
      }

      // Separator Line
      checkPageOverflow(8);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    });
  }

  // Page Numbers Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${totalPages} - Alpha AI Chat Session`, pageWidth / 2, pageHeight - 7, { align: 'center' });
  }

  const safeTitle = (session.title || 'chat-session').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  doc.save(`${safeTitle}.pdf`);
}

/**
 * Export a chat session in PDF, TXT, or both formats.
 */
export function exportChatSession(session: ChatSession, format: 'pdf' | 'txt' | 'both' = 'both'): void {
  if (format === 'txt' || format === 'both') {
    exportChatToTXT(session);
  }
  if (format === 'pdf' || format === 'both') {
    if (format === 'both') {
      setTimeout(() => {
        exportChatToPDF(session);
      }, 250);
    } else {
      exportChatToPDF(session);
    }
  }
}
