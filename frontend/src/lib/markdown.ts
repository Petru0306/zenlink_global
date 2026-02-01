/**
 * Simple markdown renderer for chat messages
 * Supports: headings, bold, lists, line breaks
 */

export function renderMarkdown(text: string): string {
  if (!text) return '';
  
  let html = text;
  
  // Escape HTML first
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Headings (### Title) - must be before other processing
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="font-semibold text-lg mt-4 mb-2 text-white">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="font-semibold text-xl mt-4 mb-2 text-white">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="font-semibold text-2xl mt-4 mb-2 text-white">$1</h1>');
  
  // Emoji + text patterns (🧾 Segment summary)
  html = html.replace(/^([🧾❓🧠🧩⚠️✅])\s+(.+)$/gm, '<div class="flex items-center gap-2 my-2"><span class="text-xl">$1</span><span>$2</span></div>');
  
  // Bold (**text**)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
  
  // Process numbered lists line by line
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inList = false;
  let listItems: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    
    if (numberedMatch) {
      if (!inList) {
        inList = true;
        listItems = [];
      }
      listItems.push(`<li class="ml-4 mb-1">${numberedMatch[2]}</li>`);
    } else {
      if (inList && listItems.length > 0) {
        processedLines.push(`<ol class="list-decimal list-inside space-y-1 my-2">${listItems.join('')}</ol>`);
        listItems = [];
        inList = false;
      }
      processedLines.push(line);
    }
  }
  
  if (inList && listItems.length > 0) {
    processedLines.push(`<ol class="list-decimal list-inside space-y-1 my-2">${listItems.join('')}</ol>`);
  }
  
  html = processedLines.join('\n');
  
  // Process bullet lists line by line
  const bulletLines = html.split('\n');
  const bulletProcessed: string[] = [];
  let inBulletList = false;
  let bulletItems: string[] = [];
  
  for (let i = 0; i < bulletLines.length; i++) {
    const line = bulletLines[i];
    const bulletMatch = line.match(/^[-•]\s+(.+)$/);
    
    if (bulletMatch && !line.includes('<ol') && !line.includes('<ul') && !line.includes('<li')) {
      if (!inBulletList) {
        inBulletList = true;
        bulletItems = [];
      }
      bulletItems.push(`<li class="ml-4 mb-1">${bulletMatch[1]}</li>`);
    } else {
      if (inBulletList && bulletItems.length > 0) {
        bulletProcessed.push(`<ul class="list-disc list-inside space-y-1 my-2">${bulletItems.join('')}</ul>`);
        bulletItems = [];
        inBulletList = false;
      }
      bulletProcessed.push(line);
    }
  }
  
  if (inBulletList && bulletItems.length > 0) {
    bulletProcessed.push(`<ul class="list-disc list-inside space-y-1 my-2">${bulletItems.join('')}</ul>`);
  }
  
  html = bulletProcessed.join('\n');
  
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p class="my-2">');
  html = html.replace(/\n/g, '<br>');
  
  // Wrap in div if not already wrapped
  if (!html.trim().startsWith('<')) {
    html = `<div class="my-2">${html}</div>`;
  } else if (!html.includes('<div') && !html.includes('<p') && !html.includes('<h')) {
    html = `<div class="my-2">${html}</div>`;
  }
  
  return html;
}
