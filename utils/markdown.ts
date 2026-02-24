/**
 * Simple Markdown Renderer
 *
 * Converts basic markdown syntax to HTML for display purposes.
 * Handles: headers, bold, italic, lists, and line breaks.
 *
 * Note: This is a simple implementation for trusted content only.
 * For user-generated content, use a proper sanitization library.
 */

/**
 * Escapes HTML entities to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char] || char)
}

/**
 * Converts basic markdown to HTML
 * Supports: ### headers, **bold**, *italic*, - lists, line breaks
 */
export function renderMarkdown(markdown: string | undefined | null): string {
  if (!markdown) return ''

  // Escape HTML first for safety
  let html = escapeHtml(markdown)

  // Handle headers (###, ##, #)
  html = html.replace(/^###\s*(.+)$/gm, '<h4 class="font-semibold text-neutral-900 mt-4 mb-2">$1</h4>')
  html = html.replace(/^##\s*(.+)$/gm, '<h3 class="font-semibold text-neutral-900 mt-4 mb-2">$1</h3>')
  html = html.replace(/^#\s*(.+)$/gm, '<h2 class="font-semibold text-neutral-900 mt-4 mb-2">$1</h2>')

  // Handle bold (**text**)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')

  // Handle italic (*text*)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  // Handle unordered list items (- item)
  // First, wrap consecutive list items in <ul>
  const lines = html.split('\n')
  const processedLines: string[] = []
  let inList = false

  for (const line of lines) {
    const trimmed = line.trim()
    const isListItem = trimmed.startsWith('- ')

    if (isListItem) {
      if (!inList) {
        processedLines.push('<ul class="list-disc list-inside ml-2 space-y-1">')
        inList = true
      }
      // Convert list item
      const content = trimmed.slice(2)
      processedLines.push(`<li class="text-neutral-700">${content}</li>`)
    } else {
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      processedLines.push(line)
    }
  }

  // Close any open list
  if (inList) {
    processedLines.push('</ul>')
  }

  html = processedLines.join('\n')

  // Convert remaining newlines to <br> (but not between block elements)
  // Handle double newlines as paragraph breaks
  html = html.replace(/\n\n+/g, '</p><p class="mt-3">')
  html = html.replace(/\n/g, '<br>')

  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`
  }

  return html
}

/**
 * Strips markdown syntax and returns plain text
 */
export function stripMarkdown(markdown: string | undefined | null): string {
  if (!markdown) return ''

  let text = markdown

  // Remove headers
  text = text.replace(/^#{1,3}\s*/gm, '')

  // Remove bold/italic markers
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
  text = text.replace(/\*([^*]+)\*/g, '$1')

  // Remove list markers
  text = text.replace(/^-\s+/gm, '')

  // Normalize whitespace
  text = text.replace(/\n+/g, ' ').trim()

  return text
}
