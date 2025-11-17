#!/usr/bin/env python3
"""
Text preprocessing for Project Gutenberg corpus.
Removes headers/footers and cleans text while preserving structure.
"""

import os
import re
from pathlib import Path


def extract_gutenberg_text(content):
    """
    Extract the main text from Project Gutenberg file.
    Removes header and footer boilerplate.
    """
    # Find the start marker
    start_pattern = r'\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK .+ \*\*\*'
    end_pattern = r'\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK .+ \*\*\*'

    start_match = re.search(start_pattern, content)
    end_match = re.search(end_pattern, content)

    if start_match and end_match:
        # Extract text between markers
        text = content[start_match.end():end_match.start()]
    else:
        # If markers not found, return whole content (fallback)
        text = content

    return text.strip()


def clean_text(text):
    """
    Clean text while preserving line breaks and structure.
    """
    # Remove BOM if present
    text = text.replace('\ufeff', '')

    # Remove excessive whitespace but preserve line breaks
    lines = text.split('\n')
    cleaned_lines = [line.rstrip() for line in lines]

    # Remove multiple consecutive blank lines (keep max 2)
    result = []
    blank_count = 0
    for line in cleaned_lines:
        if line.strip() == '':
            blank_count += 1
            if blank_count <= 2:
                result.append(line)
        else:
            blank_count = 0
            result.append(line)

    return '\n'.join(result)


def get_metadata(filename):
    """
    Extract metadata based on filename (Project Gutenberg ID).
    """
    metadata = {
        'pg12241.txt': {
            'id': 'pg12241',
            'title': 'Poems by Emily Dickinson, Third Series',
            'author': 'Emily Dickinson',
            'author_key': 'dickinson'
        },
        'pg12242.txt': {
            'id': 'pg12242',
            'title': 'Poems by Emily Dickinson, Three Series, Complete',
            'author': 'Emily Dickinson',
            'author_key': 'dickinson'
        },
        'pg2679.txt': {
            'id': 'pg2679',
            'title': 'Poems by Emily Dickinson, Series Two',
            'author': 'Emily Dickinson',
            'author_key': 'dickinson'
        },
        'pg37452.txt': {
            'id': 'pg37452',
            'title': 'The Poetical Works of Elizabeth Barrett Browning, Volume 1',
            'author': 'Elizabeth Barrett Browning',
            'author_key': 'browning'
        },
        'pg33363.txt': {
            'id': 'pg33363',
            'title': 'The Poetical Works of Elizabeth Barrett Browning, Volume 2',
            'author': 'Elizabeth Barrett Browning',
            'author_key': 'browning'
        },
        'pg31015.txt': {
            'id': 'pg31015',
            'title': 'The Poetical Works of Elizabeth Barrett Browning, Volume 4',
            'author': 'Elizabeth Barrett Browning',
            'author_key': 'browning'
        },
        'pg13018.txt': {
            'id': 'pg13018',
            'title': 'The Letters of Elizabeth Barrett Browning, Volume 1',
            'author': 'Elizabeth Barrett Browning',
            'author_key': 'browning'
        },
        'pg2303.txt': {
            'id': 'pg2303',
            'title': 'Legends and Lyrics, Part 1',
            'author': 'Adelaide Anne Procter',
            'author_key': 'procter'
        },
        'pg2304.txt': {
            'id': 'pg2304',
            'title': 'Legends and Lyrics, Part 2',
            'author': 'Adelaide Anne Procter',
            'author_key': 'procter'
        }
    }
    return metadata.get(filename, {
        'id': filename.replace('.txt', ''),
        'title': 'Unknown',
        'author': 'Unknown',
        'author_key': 'unknown'
    })


def preprocess_file(input_path, output_path):
    """
    Preprocess a single file: remove boilerplate and clean.
    """
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract main text
    text = extract_gutenberg_text(content)

    # Clean text
    cleaned = clean_text(text)

    # Write to output
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(cleaned)

    return len(cleaned)


def main():
    """
    Preprocess all text files in the corpus.
    """
    script_dir = Path(__file__).parent.parent
    input_dir = script_dir
    output_dir = script_dir / 'processed'

    # Ensure output directory exists
    output_dir.mkdir(exist_ok=True)

    # Find all .txt files (excluding any in subdirectories)
    txt_files = sorted([f for f in input_dir.glob('*.txt')])

    print(f"Found {len(txt_files)} text files to preprocess")
    print("-" * 60)

    results = []
    for txt_file in txt_files:
        output_file = output_dir / txt_file.name
        char_count = preprocess_file(txt_file, output_file)

        metadata = get_metadata(txt_file.name)
        print(f"✓ {txt_file.name}")
        print(f"  → {metadata['title']}")
        print(f"  → {char_count:,} characters")

        results.append({
            'filename': txt_file.name,
            'metadata': metadata,
            'char_count': char_count
        })

    print("-" * 60)
    print(f"Preprocessing complete! Cleaned files saved to: {output_dir}")

    return results


if __name__ == '__main__':
    main()
