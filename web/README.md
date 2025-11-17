# Viewing the Visualization

## Quick Start

Simply open `index.html` in your web browser:

```bash
# On macOS
open index.html

# On Linux
xdg-open index.html

# On Windows
start index.html
```

Or double-click `index.html` in your file explorer.

## Features

- **Navigation**: Browse by individual text or author aggregate
- **Word Clouds**: Visual frequency distributions (click "Word Cloud" tab)
- **Sentiment Analysis**: VADER scores with charts (click "Sentiment" tab)
- **Style Analysis**: Vocabulary richness and POS distribution (click "Style" tab)
- **Comparison**: Select multiple texts and click "Compare Selected"

## How It Works

The visualization uses:
- **Embedded Data**: `data-embed.js` contains all analysis results
- **Chart.js**: For sentiment and POS charts (loaded from CDN)
- **wordcloud2.js**: For word clouds (loaded from CDN)

No server required! Everything works offline after the initial library downloads.

## Troubleshooting

**If you see "Error Loading Data":**
1. Make sure `data-embed.js` is in the same directory as `index.html`
2. Check browser console (F12) for errors
3. Try refreshing the page

**If word clouds don't appear:**
1. Click the "Word Cloud" tab (it generates on-demand)
2. Make sure you have internet connection for the CDN libraries
3. Check browser console for library loading errors

**If charts don't appear:**
1. Click the respective tab ("Sentiment" or "Style")
2. Ensure internet connection for Chart.js CDN
3. Check browser console for errors

## Browser Compatibility

Tested on:
- Chrome/Edge (recommended)
- Firefox
- Safari

Requires JavaScript enabled.
