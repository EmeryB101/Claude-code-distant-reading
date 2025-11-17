# Distant Reading: 19th Century Women Poets

A computational literary analysis project analyzing texts by Emily Dickinson, Elizabeth Barrett Browning, and Adelaide Anne Procter from Project Gutenberg.

## Overview

This project provides:
- **Python Analysis Pipeline**: Text preprocessing, bag-of-words analysis, VADER sentiment analysis, and stylometric analysis
- **Interactive Visualization**: Web-based interface for exploring word clouds, sentiment, style metrics, and text comparisons
- **Comprehensive Results**: JSON output with detailed metrics for each text and author aggregates

## Project Structure

```
/
├── analysis/
│   ├── preprocess.py      # Text cleaning and preprocessing
│   └── analyze.py          # Main analysis pipeline
├── processed/              # Cleaned text files
├── results/
│   └── analysis.json       # Complete analysis results
├── web/
│   ├── index.html          # Visualization interface
│   ├── styles.css          # Academic styling
│   └── app.js              # Interactive functionality
├── requirements.txt        # Python dependencies
└── [9 Project Gutenberg .txt files]
```

## Getting Started

### Prerequisites

- Python 3.8+
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Download required NLTK data (handled automatically by analyze.py)

### Running the Analysis

1. **Preprocess texts** (remove Project Gutenberg boilerplate):
```bash
python analysis/preprocess.py
```

2. **Run full analysis** (bag of words, sentiment, style):
```bash
python analysis/analyze.py
```

This generates `results/analysis.json` with all metrics.

### Viewing Results

Open `web/index.html` in a web browser. The interface provides:

- **Navigation by Text**: View individual text analyses
- **Navigation by Author**: View aggregated author statistics
- **Tabs for Each View**:
  - Overview: Metadata and word statistics
  - Word Cloud: Visual frequency distribution
  - Sentiment: VADER sentiment scores and charts
  - Style: Vocabulary richness and POS distribution
- **Comparison Mode**: Select multiple texts to compare side-by-side

## Analysis Details

### Text Preprocessing

- Removes Project Gutenberg headers/footers
- Preserves line breaks and poetic structure
- Cleans whitespace while maintaining formatting

### Bag of Words

- Uses NLTK English stopwords
- Generates frequency distributions per text and per author
- Top 100 most frequent words tracked

### Sentiment Analysis

- VADER (Valence Aware Dictionary and sEntiment Reasoner)
- Compound, positive, negative, and neutral scores
- Sentence-level analysis (sampled for performance)

### Style Analysis

**Vocabulary Richness:**
- Type-Token Ratio (TTR)
- Hapax Legomena count and percentage
- Yule's K lexical diversity measure

**Parts of Speech Distribution:**
- 9 major categories (nouns, verbs, adjectives, etc.)
- NLTK POS tagger
- Sampled for large texts (max 10,000 tokens)

## Corpus

### Texts Included

**Emily Dickinson:**
- Poems, Series Two
- Poems, Third Series
- Poems, Three Series Complete

**Elizabeth Barrett Browning:**
- Poetical Works, Volumes 1, 2, 4
- Letters, Volume 1

**Adelaide Anne Procter:**
- Legends and Lyrics, Parts 1 & 2

All texts from Project Gutenberg (public domain).

## Technical Notes

- Sentiment analysis uses first 50,000 characters for very large texts
- POS tagging samples maximum 10,000 tokens for performance
- Word clouds use wordcloud2.js library (CDN)
- Charts use Chart.js library (CDN)

## Future Enhancements

Potential additions:
- Topic modeling (LDA)
- Named entity recognition
- Stylometric authorship attribution
- Temporal analysis across author's works
- Network analysis of co-occurring words

## License

Code: MIT License
Texts: Public Domain (Project Gutenberg)

## Acknowledgments

- Project Gutenberg for text sources
- NLTK for NLP tools
- VADER sentiment analysis
- Chart.js and wordcloud2.js for visualizations
