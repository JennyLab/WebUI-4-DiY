// Map of custom emoji shortcodes to Unicode emojis
const emojiMap = {
  ':smile:': '😊',
  ':joy:': '😂',
  ':heart:': '❤️',
  ':thumbsup:': '👍',
  ':thumbsdown:': '👎',
  ':fire:': '🔥',
  ':tada:': '🎉',
  ':check:': '✅',
  ':x:': '❌',
  ':100:': '💯',
  ':thinking:': '🤔',
  ':eyes:': '👀',
  ':rocket:': '🚀',
  ':wave:': '👋',
  ':clap:': '👏',
  ':pray:': '🙏',
  ':crown:': '👑',
  ':gem:': '💎',
  ':star:': '⭐',
  ':sparkles:': '✨',
  ':zap:': '⚡',
  ':sunglasses:': '😎',
  ':rainbow:': '🌈',
  ':unicorn:': '🦄',
  // Add more emoji mappings as needed
};

export function formatEmoji(text) {
  let formattedText = text;
  
  // Replace all emoji shortcodes with their Unicode equivalents
  Object.entries(emojiMap).forEach(([shortcode, emoji]) => {
    const regex = new RegExp(shortcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    formattedText = formattedText.replace(regex, emoji);
  });
  
  return formattedText;
}

export function formatMentions(content, allUsernames) {
  // Replace @username with span element
  return content.replace(/@(\w+)/g, (match, username) => {
    if (allUsernames.includes(username)) {
      return `<span class="mention">@${username}</span>`;
    }
    return match;
  });
}