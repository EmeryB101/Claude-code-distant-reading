# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a text corpus for distant reading analysis, containing Project Gutenberg texts focused on 19th-century women poets. The repository contains raw text files suitable for computational literary analysis, text mining, and digital humanities research.

## Text Collection

The corpus includes works by three poets:

**Emily Dickinson:**
- `pg2679.txt` - Poems, Series Two
- `pg12241.txt` - Poems, Third Series
- `pg12242.txt` - Poems, Three Series Complete

**Elizabeth Barrett Browning:**
- `pg37452.txt` - Poetical Works, Volume 1
- `pg33363.txt` - Poetical Works, Volume 2
- `pg31015.txt` - Poetical Works, Volume 4
- `pg13018.txt` - Letters, Volume 1

**Adelaide Anne Procter:**
- `pg2303.txt` - Legends and Lyrics, Part 1
- `pg2304.txt` - Legends and Lyrics, Part 2

## Text Format

All files are UTF-8 encoded plain text with Project Gutenberg headers and footers. Each file begins with metadata (title, author, release date, language, credits) followed by the delimiter:

```
*** START OF THE PROJECT GUTENBERG EBOOK [TITLE] ***
```

And ends with:

```
*** END OF THE PROJECT GUTENBERG EBOOK [TITLE] ***
```

## Working with the Corpus

When adding analysis tools or scripts to this repository:

- Preserve the original `.txt` files unchanged for reproducibility
- Handle Project Gutenberg boilerplate (headers/footers) appropriately in processing
- Account for UTF-8 encoding and potential BOM (﻿) at file start
- Consider that different texts have varying structures (poems vs. prose letters)
- Maintain attribution to Project Gutenberg and original authors

## Potential Development Additions

This repository currently contains only source texts. Common additions might include:

- Python/R scripts for text analysis (word frequency, sentiment, stylometry)
- Jupyter notebooks for exploratory analysis
- Processed/cleaned versions of texts (with Gutenberg boilerplate removed)
- Metadata files cataloging the corpus
- Visualization outputs
- Requirements files for analysis dependencies
