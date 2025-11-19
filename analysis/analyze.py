#!/usr/bin/env python3
"""
Distant reading analysis of preprocessed text corpus.
Performs bag of words, sentiment analysis, style analysis, and topic modeling.
"""

import json
import re
from collections import Counter, defaultdict
from pathlib import Path
import string

import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import spacy
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt_tab')

try:
    nltk.data.find('taggers/averaged_perceptron_tagger')
except LookupError:
    nltk.download('averaged_perceptron_tagger')

try:
    nltk.data.find('taggers/averaged_perceptron_tagger_eng')
except LookupError:
    nltk.download('averaged_perceptron_tagger_eng')

# Try to load spaCy model (optional, fall back to NLTK if not available)
try:
    nlp = spacy.load('en_core_web_sm')
    USE_SPACY = True
except OSError:
    print("spaCy model not available, using NLTK for POS tagging...")
    USE_SPACY = False
    nlp = None


class TextAnalyzer:
    """Analyzes a single text for various linguistic features."""

    def __init__(self, text_id, title, author, author_key):
        self.text_id = text_id
        self.title = title
        self.author = author
        self.author_key = author_key
        self.text = ""
        self.tokens = []
        self.stop_words = set(stopwords.words('english'))
        self.sentiment_analyzer = SentimentIntensityAnalyzer()

    def load_text(self, filepath):
        """Load preprocessed text."""
        with open(filepath, 'r', encoding='utf-8') as f:
            self.text = f.read()

    def tokenize(self):
        """Tokenize text into words using NLTK."""
        # Convert to lowercase and tokenize
        tokens = word_tokenize(self.text.lower())

        # Filter: keep only alphabetic tokens, remove stopwords and punctuation
        self.tokens = [
            token for token in tokens
            if token.isalpha() and token not in self.stop_words
        ]

        # Also keep all tokens (with stopwords) for some metrics
        self.all_tokens = [
            token for token in word_tokenize(self.text.lower())
            if token.isalpha()
        ]

        return self.tokens

    def bag_of_words(self, top_n=50):
        """Create bag of words with frequency counts (top 50)."""
        if not self.tokens:
            self.tokenize()

        # Additional words to filter out beyond stopwords
        additional_filters = {'like', 'may', 'one', 'upon', 'shall', 'would', 'could'}

        # Filter tokens
        filtered_tokens = [token for token in self.tokens if token not in additional_filters]

        word_freq = Counter(filtered_tokens)
        return {
            'total_words': len(self.tokens),
            'unique_words': len(set(self.tokens)),
            'word_frequencies': dict(word_freq.most_common(top_n))
        }

    def sentiment_analysis(self):
        """Perform VADER sentiment analysis."""
        # For very large texts, use sampling approach for performance
        text_sample = self.text[:50000] if len(self.text) > 50000 else self.text
        sentences = sent_tokenize(text_sample)

        # Analyze sample of sentences (up to 100)
        sentence_scores = [
            self.sentiment_analyzer.polarity_scores(sent)
            for sent in sentences[:100]
        ]

        # Calculate average sentiment per sentence
        if sentence_scores:
            avg_compound = sum(s['compound'] for s in sentence_scores) / len(sentence_scores)
            avg_pos = sum(s['pos'] for s in sentence_scores) / len(sentence_scores)
            avg_neg = sum(s['neg'] for s in sentence_scores) / len(sentence_scores)
            avg_neu = sum(s['neu'] for s in sentence_scores) / len(sentence_scores)
        else:
            avg_compound = avg_pos = avg_neg = avg_neu = 0

        overall_scores = {
            'compound': round(avg_compound, 4),
            'pos': round(avg_pos, 4),
            'neg': round(avg_neg, 4),
            'neu': round(avg_neu, 4)
        }

        return {
            'overall': overall_scores,
            'average_per_sentence': overall_scores,
            'total_sentences_analyzed': len(sentence_scores)
        }

    def vocabulary_richness(self):
        """Calculate lexical diversity and vocabulary richness metrics."""
        if not self.all_tokens:
            self.tokenize()

        total_tokens = len(self.all_tokens)
        unique_tokens = len(set(self.all_tokens))

        # Type-Token Ratio (TTR) - basic lexical diversity
        ttr = unique_tokens / total_tokens if total_tokens > 0 else 0

        # Hapax legomena (words appearing once) - lexical richness
        word_freq = Counter(self.all_tokens)
        hapax = sum(1 for count in word_freq.values() if count == 1)
        hapax_percentage = (hapax / unique_tokens * 100) if unique_tokens > 0 else 0

        # Yule's K - more sophisticated lexical diversity measure
        if total_tokens > 0:
            freq_spectrum = Counter(word_freq.values())
            M1 = sum(i * freq for i, freq in freq_spectrum.items())
            M2 = sum(i * i * freq for i, freq in freq_spectrum.items())
            yules_k = 10000 * (M2 - M1) / (M1 * M1) if M1 > 0 else 0
        else:
            yules_k = 0

        # Average word length - another richness indicator
        avg_word_length = sum(len(word) for word in self.all_tokens) / total_tokens if total_tokens > 0 else 0

        return {
            'total_tokens': total_tokens,
            'unique_tokens': unique_tokens,
            'type_token_ratio': round(ttr, 4),
            'hapax_legomena': hapax,
            'hapax_percentage': round(hapax_percentage, 2),
            'yules_k': round(yules_k, 2),
            'average_word_length': round(avg_word_length, 2),
            'lexical_diversity': round(ttr, 4)  # Same as TTR, for clarity
        }

    def pos_distribution(self):
        """Calculate parts of speech distribution using spaCy or NLTK."""
        if not self.all_tokens:
            self.tokenize()

        # Sample for performance (max 10,000 tokens)
        import random
        sample_size = min(10000, len(self.all_tokens))
        if len(self.all_tokens) > 10000:
            sample_tokens = random.sample(self.all_tokens, sample_size)
        else:
            sample_tokens = self.all_tokens

        if USE_SPACY and nlp:
            # Use spaCy
            sample_text = ' '.join(sample_tokens)
            doc = nlp(sample_text)
            pos_counts = Counter(token.pos_ for token in doc)

            # Group into categories
            pos_categories = {
                'nouns': pos_counts.get('NOUN', 0) + pos_counts.get('PROPN', 0),
                'verbs': pos_counts.get('VERB', 0),
                'adjectives': pos_counts.get('ADJ', 0),
                'adverbs': pos_counts.get('ADV', 0),
                'pronouns': pos_counts.get('PRON', 0),
                'prepositions': pos_counts.get('ADP', 0),
                'conjunctions': pos_counts.get('CCONJ', 0) + pos_counts.get('SCONJ', 0),
                'determiners': pos_counts.get('DET', 0),
                'other': sum(pos_counts.values()) - (
                    pos_counts.get('NOUN', 0) + pos_counts.get('PROPN', 0) +
                    pos_counts.get('VERB', 0) + pos_counts.get('ADJ', 0) +
                    pos_counts.get('ADV', 0) + pos_counts.get('PRON', 0) +
                    pos_counts.get('ADP', 0) + pos_counts.get('CCONJ', 0) +
                    pos_counts.get('SCONJ', 0) + pos_counts.get('DET', 0)
                )
            }
            total = len(doc)
        else:
            # Use NLTK as fallback
            tagged = nltk.pos_tag(sample_tokens)
            pos_counts = Counter(tag for word, tag in tagged)

            # Group into categories (NLTK tags)
            pos_categories = {
                'nouns': 0,
                'verbs': 0,
                'adjectives': 0,
                'adverbs': 0,
                'pronouns': 0,
                'prepositions': 0,
                'conjunctions': 0,
                'determiners': 0,
                'other': 0
            }

            for tag, count in pos_counts.items():
                if tag.startswith('NN'):
                    pos_categories['nouns'] += count
                elif tag.startswith('VB'):
                    pos_categories['verbs'] += count
                elif tag.startswith('JJ'):
                    pos_categories['adjectives'] += count
                elif tag.startswith('RB'):
                    pos_categories['adverbs'] += count
                elif tag.startswith('PR'):
                    pos_categories['pronouns'] += count
                elif tag in ('IN', 'TO'):
                    pos_categories['prepositions'] += count
                elif tag.startswith('CC'):
                    pos_categories['conjunctions'] += count
                elif tag.startswith('DT') or tag.startswith('WDT'):
                    pos_categories['determiners'] += count
                else:
                    pos_categories['other'] += count

            total = len(tagged)

        # Convert to percentages
        pos_percentages = {
            category: round(count / total * 100, 2) if total > 0 else 0
            for category, count in pos_categories.items()
        }

        return {
            'counts': pos_categories,
            'percentages': pos_percentages,
            'total_tagged': total
        }

    def topic_modeling(self, n_topics=3, n_top_words=10):
        """Perform LDA topic modeling on the text."""
        if not self.text:
            return {'topics': [], 'error': 'No text available'}

        # Split text into chunks for better topic detection
        sentences = sent_tokenize(self.text[:100000])  # Limit for performance

        if len(sentences) < n_topics:
            n_topics = max(1, len(sentences))

        # Use CountVectorizer with English stop words
        vectorizer = CountVectorizer(
            max_features=1000,
            stop_words='english',
            min_df=2,
            max_df=0.8
        )

        try:
            doc_term_matrix = vectorizer.fit_transform(sentences)

            # Perform LDA
            lda = LatentDirichletAllocation(
                n_components=n_topics,
                random_state=42,
                max_iter=20
            )
            lda.fit(doc_term_matrix)

            # Extract topics
            feature_names = vectorizer.get_feature_names_out()
            topics = []

            for topic_idx, topic in enumerate(lda.components_):
                top_word_indices = topic.argsort()[-n_top_words:][::-1]
                top_words = [feature_names[i] for i in top_word_indices]
                topic_weights = [round(float(topic[i]), 4) for i in top_word_indices]

                topics.append({
                    'topic_id': topic_idx + 1,
                    'top_words': top_words,
                    'weights': topic_weights
                })

            return {
                'topics': topics,
                'n_topics': n_topics,
                'n_documents': len(sentences)
            }
        except Exception as e:
            return {
                'topics': [],
                'error': f'Topic modeling failed: {str(e)}'
            }

    def analyze(self):
        """Run complete analysis."""
        return {
            'metadata': {
                'id': self.text_id,
                'title': self.title,
                'author': self.author,
                'author_key': self.author_key
            },
            'bag_of_words': self.bag_of_words(top_n=50),
            'sentiment': self.sentiment_analysis(),
            'vocabulary_richness': self.vocabulary_richness(),
            'style': self.pos_distribution(),
            'topics': self.topic_modeling()
        }


def aggregate_by_author(analyses):
    """Aggregate word frequencies and metrics by author."""
    author_data = defaultdict(lambda: {
        'texts': [],
        'all_tokens': [],
        'metadata': {}
    })

    # Collect all tokens per author
    for analysis in analyses:
        author_key = analysis['metadata']['author_key']
        author = analysis['metadata']['author']

        author_data[author_key]['texts'].append(analysis['metadata']['id'])
        author_data[author_key]['metadata'] = {
            'author': author,
            'author_key': author_key
        }

    # Load texts again for author aggregation
    script_dir = Path(__file__).parent.parent
    processed_dir = script_dir / 'processed'

    for txt_file in processed_dir.glob('*.txt'):
        text_id = txt_file.stem
        matching_analysis = next(
            (a for a in analyses if a['metadata']['id'] == text_id),
            None
        )

        if matching_analysis:
            author_key = matching_analysis['metadata']['author_key']

            # Load and tokenize
            with open(txt_file, 'r', encoding='utf-8') as f:
                text = f.read()

            stop_words = set(stopwords.words('english'))
            tokens = word_tokenize(text.lower())
            filtered_tokens = [
                token for token in tokens
                if token.isalpha() and token not in stop_words
            ]

            author_data[author_key]['all_tokens'].extend(filtered_tokens)

    # Calculate aggregate statistics
    author_aggregates = {}
    for author_key, data in author_data.items():
        tokens = data['all_tokens']
        word_freq = Counter(tokens)

        author_aggregates[author_key] = {
            'metadata': data['metadata'],
            'texts': data['texts'],
            'total_words': len(tokens),
            'unique_words': len(set(tokens)),
            'word_frequencies': dict(word_freq.most_common(50))
        }

    return author_aggregates


def main():
    """Main analysis pipeline."""
    script_dir = Path(__file__).parent.parent
    processed_dir = script_dir / 'processed'
    results_dir = script_dir / 'results'
    results_dir.mkdir(exist_ok=True)

    # Metadata mapping
    metadata_map = {
        'pg12241': ('Poems by Emily Dickinson, Third Series', 'Emily Dickinson', 'dickinson'),
        'pg12242': ('Poems by Emily Dickinson, Three Series, Complete', 'Emily Dickinson', 'dickinson'),
        'pg2679': ('Poems by Emily Dickinson, Series Two', 'Emily Dickinson', 'dickinson'),
        'pg37452': ('The Poetical Works of Elizabeth Barrett Browning, Volume 1', 'Elizabeth Barrett Browning', 'browning'),
        'pg33363': ('The Poetical Works of Elizabeth Barrett Browning, Volume 2', 'Elizabeth Barrett Browning', 'browning'),
        'pg31015': ('The Poetical Works of Elizabeth Barrett Browning, Volume 4', 'Elizabeth Barrett Browning', 'browning'),
        'pg13018': ('The Letters of Elizabeth Barrett Browning, Volume 1', 'Elizabeth Barrett Browning', 'browning'),
        'pg2303': ('Legends and Lyrics, Part 1', 'Adelaide Anne Procter', 'procter'),
        'pg2304': ('Legends and Lyrics, Part 2', 'Adelaide Anne Procter', 'procter')
    }

    print("Starting distant reading analysis...")
    print("=" * 60)

    all_analyses = []

    # Analyze each text
    for txt_file in sorted(processed_dir.glob('*.txt')):
        text_id = txt_file.stem
        title, author, author_key = metadata_map.get(
            text_id,
            ('Unknown', 'Unknown', 'unknown')
        )

        print(f"\nAnalyzing: {title}")
        print(f"Author: {author}")

        analyzer = TextAnalyzer(text_id, title, author, author_key)
        analyzer.load_text(txt_file)
        analysis = analyzer.analyze()

        all_analyses.append(analysis)

        print(f"  ✓ Words: {analysis['bag_of_words']['total_words']:,}")
        print(f"  ✓ Unique: {analysis['bag_of_words']['unique_words']:,}")
        print(f"  ✓ Sentiment (compound): {analysis['sentiment']['overall']['compound']:.3f}")
        print(f"  ✓ Lexical Diversity: {analysis['vocabulary_richness']['lexical_diversity']:.3f}")
        print(f"  ✓ Topics: {len(analysis['topics'].get('topics', []))}")

    # Aggregate by author
    print("\n" + "=" * 60)
    print("Aggregating by author...")
    author_aggregates = aggregate_by_author(all_analyses)

    for author_key, data in author_aggregates.items():
        print(f"\n{data['metadata']['author']}:")
        print(f"  ✓ Total words: {data['total_words']:,}")
        print(f"  ✓ Unique words: {data['unique_words']:,}")
        print(f"  ✓ Texts: {len(data['texts'])}")

    # Prepare final output
    output = {
        'corpus_name': 'Distant Reading: 19th Century Women Poets',
        'texts': all_analyses,
        'authors': author_aggregates,
        'summary': {
            'total_texts': len(all_analyses),
            'authors': [
                {
                    'name': data['metadata']['author'],
                    'key': author_key,
                    'text_count': len(data['texts'])
                }
                for author_key, data in author_aggregates.items()
            ]
        }
    }

    # Save to JSON
    output_file = results_dir / 'analysis.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 60)
    print(f"✓ Analysis complete! Results saved to: {output_file}")
    print(f"  Total texts analyzed: {len(all_analyses)}")
    print(f"  Authors: {len(author_aggregates)}")

    return output


if __name__ == '__main__':
    main()
