// Embedded analysis data
let analysisData = null;

// Load data from JSON file
async function loadData() {
    try {
        const response = await fetch('../results/analysis.json');
        analysisData = await response.json();
        initializeApp();
    } catch (error) {
        console.error('Error loading data:', error);
        // Show error message to user
        document.querySelector('.content-area').innerHTML =
            '<div style="padding: 2rem; color: #e74c3c;"><h2>Error Loading Data</h2><p>Could not load analysis.json. Please ensure the file exists in the results directory.</p></div>';
    }
}

// Initialize the application
function initializeApp() {
    renderNavigation();
    renderOverview();
    setupEventListeners();
}

// Render navigation lists
function renderNavigation() {
    const textList = document.getElementById('text-list');
    const authorList = document.getElementById('author-list');

    // Filter out the "Unknown" entry (requirements.txt)
    const texts = analysisData.texts.filter(t => t.metadata.author !== 'Unknown');

    // Render text list
    texts.forEach(text => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = text.metadata.title;
        button.dataset.textId = text.metadata.id;
        button.addEventListener('click', () => showTextView(text.metadata.id));
        li.appendChild(button);
        textList.appendChild(li);
    });

    // Render author list
    Object.keys(analysisData.authors).forEach(authorKey => {
        const author = analysisData.authors[authorKey];
        if (authorKey === 'unknown') return; // Skip unknown

        const li = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = author.metadata.author;
        button.dataset.authorKey = authorKey;
        button.addEventListener('click', () => showAuthorView(authorKey));
        li.appendChild(button);
        authorList.appendChild(li);
    });

    // Add comparison checkboxes
    renderComparisonCheckboxes();
}

// Render comparison checkboxes
function renderComparisonCheckboxes() {
    const compareSelections = document.getElementById('compare-selections');
    const texts = analysisData.texts.filter(t => t.metadata.author !== 'Unknown');

    compareSelections.innerHTML = '<p style="margin: 0.5rem 0; font-weight: 600;">Select texts:</p>';

    texts.forEach(text => {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.marginBottom = '0.3rem';
        label.style.fontSize = '0.85rem';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = text.metadata.id;
        checkbox.dataset.title = text.metadata.title;

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + text.metadata.title.substring(0, 30) + '...'));

        compareSelections.appendChild(label);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchTab(tabName);
        });
    });

    // Compare button
    document.getElementById('compare-btn').addEventListener('click', showCompareView);
}

// Show overview
function renderOverview() {
    const overviewStats = document.querySelector('.overview-stats');
    const texts = analysisData.texts.filter(t => t.metadata.author !== 'Unknown');

    const totalWords = texts.reduce((sum, t) => sum + t.bag_of_words.total_words, 0);
    const authorsHtml = analysisData.summary.authors
        .filter(a => a.key !== 'unknown')
        .map(a => '<p>' + a.name + ': <span class="stat-value">' + a.text_count + ' texts</span></p>')
        .join('');

    overviewStats.innerHTML =
        '<div class="stat-card">' +
            '<h3>Corpus</h3>' +
            '<p><span class="stat-value">' + analysisData.corpus_name + '</span></p>' +
            '<p>Total texts: <span class="stat-value">' + texts.length + '</span></p>' +
        '</div>' +
        '<div class="stat-card">' +
            '<h3>Authors</h3>' +
            authorsHtml +
        '</div>' +
        '<div class="stat-card">' +
            '<h3>Total Words</h3>' +
            '<p><span class="stat-value">' + totalWords.toLocaleString() + '</span></p>' +
            '<p style="font-size: 0.85rem; color: #7f8c8d;">Across all texts (excluding stopwords)</p>' +
        '</div>';
}

// Show text view
function showTextView(textId) {
    const text = analysisData.texts.find(t => t.metadata.id === textId);
    if (!text) return;

    // Switch to text view
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('text-view').classList.add('active');

    // Update title
    document.getElementById('text-title').textContent = text.metadata.title;

    // Highlight active nav item
    document.querySelectorAll('.nav-list button').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-text-id="' + textId + '"]').classList.add('active');

    // Show metadata tab by default
    switchTab('metadata');
    renderMetadata(text);
}

// Show author view
function showAuthorView(authorKey) {
    const author = analysisData.authors[authorKey];
    if (!author) return;

    // Switch to text view (reuse for author)
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('text-view').classList.add('active');

    // Update title
    document.getElementById('text-title').textContent = author.metadata.author + ' (Aggregate)';

    // Highlight active nav item
    document.querySelectorAll('.nav-list button').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-author-key="' + authorKey + '"]').classList.add('active');

    // Show metadata tab with author aggregate data
    switchTab('metadata');
    renderAuthorMetadata(author);

    // Show word cloud tab with author data
    document.querySelector('[data-tab="wordcloud"]').addEventListener('click', () => {
        renderWordCloud(author.word_frequencies, author.metadata.author);
    }, { once: true });
}

// Render metadata
function renderMetadata(text) {
    const content = document.getElementById('metadata-content');
    const vocab = text.vocabulary_richness;
    const bow = text.bag_of_words;

    content.innerHTML =
        '<h3>' + text.metadata.title + '</h3>' +
        '<p><strong>Author:</strong> ' + text.metadata.author + '</p>' +
        '<p><strong>Text ID:</strong> ' + text.metadata.id + '</p>' +
        '<h4 style="margin-top: 1.5rem;">Word Statistics</h4>' +
        '<p><strong>Total Words:</strong> ' + bow.total_words.toLocaleString() + '</p>' +
        '<p><strong>Unique Words:</strong> ' + bow.unique_words.toLocaleString() + '</p>' +
        '<p><strong>Type-Token Ratio:</strong> ' + vocab.type_token_ratio + '</p>' +
        '<p><strong>Hapax Legomena:</strong> ' + vocab.hapax_legomena + ' (' + vocab.hapax_percentage + '%)</p>' +
        '<p><strong>Yule\'s K:</strong> ' + vocab.yules_k + '</p>' +
        '<h4 style="margin-top: 1.5rem;">Sentiment (VADER)</h4>' +
        '<p><strong>Compound:</strong> ' + text.sentiment.overall.compound + '</p>' +
        '<p><strong>Positive:</strong> ' + text.sentiment.overall.pos + '</p>' +
        '<p><strong>Negative:</strong> ' + text.sentiment.overall.neg + '</p>' +
        '<p><strong>Neutral:</strong> ' + text.sentiment.overall.neu + '</p>';

    // Setup word cloud rendering when tab is clicked
    document.querySelector('[data-tab="wordcloud"]').addEventListener('click', () => {
        renderWordCloud(text.bag_of_words.word_frequencies, text.metadata.title);
    }, { once: true });

    // Setup sentiment chart when tab is clicked
    document.querySelector('[data-tab="sentiment"]').addEventListener('click', () => {
        renderSentimentTab(text);
    }, { once: true });

    // Setup style chart when tab is clicked
    document.querySelector('[data-tab="style"]').addEventListener('click', () => {
        renderStyleTab(text);
    }, { once: true });
}

// Render author metadata
function renderAuthorMetadata(author) {
    const content = document.getElementById('metadata-content');

    const textsHtml = author.texts.map(textId => {
        const text = analysisData.texts.find(t => t.metadata.id === textId);
        return '<li>' + (text ? text.metadata.title : textId) + '</li>';
    }).join('');

    content.innerHTML =
        '<h3>' + author.metadata.author + '</h3>' +
        '<p><strong>Texts Included:</strong> ' + author.texts.length + '</p>' +
        '<h4 style="margin-top: 1.5rem;">Aggregate Word Statistics</h4>' +
        '<p><strong>Total Words:</strong> ' + author.total_words.toLocaleString() + '</p>' +
        '<p><strong>Unique Words:</strong> ' + author.unique_words.toLocaleString() + '</p>' +
        '<h4 style="margin-top: 1.5rem;">Included Texts</h4>' +
        '<ul style="margin-left: 1.5rem;">' + textsHtml + '</ul>';
}

// Switch tab
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

    document.querySelector('[data-tab="' + tabName + '"]').classList.add('active');
    document.getElementById('tab-' + tabName).classList.add('active');
}

// Render word cloud
function renderWordCloud(wordFrequencies, title) {
    const canvas = document.getElementById('wordcloud-canvas');
    const wordList = document.getElementById('word-list');

    // Prepare data for word cloud
    const wordData = Object.entries(wordFrequencies).map(([word, freq]) => [word, freq * 3]);

    // Clear previous word cloud
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Generate word cloud
    if (typeof WordCloud !== 'undefined') {
        WordCloud(canvas, {
            list: wordData,
            gridSize: 8,
            weightFactor: 3,
            fontFamily: 'Georgia, serif',
            color: () => {
                const colors = ['#34495e', '#2c3e50', '#3498db', '#2980b9', '#16a085', '#27ae60'];
                return colors[Math.floor(Math.random() * colors.length)];
            },
            rotateRatio: 0.3,
            backgroundColor: '#ffffff'
        });
    } else {
        ctx.font = '20px Georgia';
        ctx.fillStyle = '#2c3e50';
        ctx.fillText('Word cloud library not loaded', 50, 100);
    }

    // Render word list
    wordList.innerHTML = '<h4 style="margin-bottom: 1rem;">Top Words</h4>';
    Object.entries(wordFrequencies).slice(0, 50).forEach(([word, freq]) => {
        const div = document.createElement('div');
        div.className = 'word-item';
        div.innerHTML = '<span class="word">' + word + '</span><span class="freq">' + freq + '</span>';
        wordList.appendChild(div);
    });
}

// Render sentiment tab
function renderSentimentTab(text) {
    const content = document.getElementById('sentiment-content');
    const sent = text.sentiment.overall;

    content.innerHTML =
        '<h3>Sentiment Analysis (VADER)</h3>' +
        '<div class="metric">' +
            '<span class="metric-label">Compound Score:</span>' +
            '<span class="metric-value">' + sent.compound + '</span>' +
        '</div>' +
        '<div class="metric">' +
            '<span class="metric-label">Positive:</span>' +
            '<span class="metric-value">' + sent.pos + '</span>' +
        '</div>' +
        '<div class="metric">' +
            '<span class="metric-label">Negative:</span>' +
            '<span class="metric-value">' + sent.neg + '</span>' +
        '</div>' +
        '<div class="metric">' +
            '<span class="metric-label">Neutral:</span>' +
            '<span class="metric-value">' + sent.neu + '</span>' +
        '</div>' +
        '<p style="margin-top: 1rem; font-size: 0.9rem; color: #7f8c8d;">' +
            'Sentences analyzed: ' + text.sentiment.total_sentences_analyzed +
        '</p>';

    // Render chart
    const ctx = document.getElementById('sentiment-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Positive', 'Negative', 'Neutral'],
            datasets: [{
                label: 'Sentiment Scores',
                data: [sent.pos, sent.neg, sent.neu],
                backgroundColor: ['#27ae60', '#e74c3c', '#95a5a6']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Sentiment Distribution',
                    font: { family: 'Georgia', size: 16 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1
                }
            }
        }
    });
}

// Render style tab
function renderStyleTab(text) {
    const content = document.getElementById('style-content');
    const vocab = text.vocabulary_richness;
    const pos = text.pos_distribution;

    content.innerHTML =
        '<h3>Vocabulary Richness</h3>' +
        '<div class="metric">' +
            '<span class="metric-label">Type-Token Ratio:</span>' +
            '<span class="metric-value">' + vocab.type_token_ratio + '</span>' +
        '</div>' +
        '<div class="metric">' +
            '<span class="metric-label">Hapax Legomena:</span>' +
            '<span class="metric-value">' + vocab.hapax_legomena + ' (' + vocab.hapax_percentage + '%)</span>' +
        '</div>' +
        '<div class="metric">' +
            '<span class="metric-label">Yule\'s K:</span>' +
            '<span class="metric-value">' + vocab.yules_k + '</span>' +
        '</div>' +
        '<h3 style="margin-top: 2rem;">Parts of Speech Distribution</h3>' +
        '<p style="margin-top: 0.5rem; font-size: 0.9rem; color: #7f8c8d;">' +
            'Based on ' + pos.total_tagged.toLocaleString() + ' tagged tokens' +
        '</p>';

    // Render POS chart
    const ctx = document.getElementById('pos-chart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(pos.percentages),
            datasets: [{
                data: Object.values(pos.percentages),
                backgroundColor: [
                    '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
                    '#9b59b6', '#1abc9c', '#34495e', '#e67e22', '#95a5a6'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { font: { family: 'Georgia' } }
                },
                title: {
                    display: true,
                    text: 'Parts of Speech (%)',
                    font: { family: 'Georgia', size: 16 }
                }
            }
        }
    });
}

// Show compare view
function showCompareView() {
    const checkboxes = document.querySelectorAll('#compare-selections input[type="checkbox"]:checked');

    if (checkboxes.length < 2) {
        alert('Please select at least 2 texts to compare');
        return;
    }

    const selectedIds = Array.from(checkboxes).map(cb => cb.value);
    const selectedTexts = selectedIds.map(id => analysisData.texts.find(t => t.metadata.id === id));

    // Switch to compare view
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('compare-view').classList.add('active');

    // Render comparison
    renderComparison(selectedTexts);
}

// Render comparison
function renderComparison(texts) {
    const content = document.getElementById('comparison-content');

    const wordCountItems = texts.map(t =>
        '<div class="comparison-item">' +
            '<h4>' + t.metadata.title + '</h4>' +
            '<p><strong>Total:</strong> ' + t.bag_of_words.total_words.toLocaleString() + '</p>' +
            '<p><strong>Unique:</strong> ' + t.bag_of_words.unique_words.toLocaleString() + '</p>' +
            '<p><strong>TTR:</strong> ' + t.vocabulary_richness.type_token_ratio + '</p>' +
        '</div>'
    ).join('');

    const sentimentItems = texts.map(t =>
        '<div class="comparison-item">' +
            '<h4>' + t.metadata.title + '</h4>' +
            '<p><strong>Compound:</strong> ' + t.sentiment.overall.compound + '</p>' +
            '<p><strong>Positive:</strong> ' + t.sentiment.overall.pos + '</p>' +
            '<p><strong>Negative:</strong> ' + t.sentiment.overall.neg + '</p>' +
        '</div>'
    ).join('');

    const wordsItems = texts.map(t => {
        const topWords = Object.entries(t.bag_of_words.word_frequencies)
            .slice(0, 10)
            .map(([word, freq]) => '<li>' + word + ' (' + freq + ')</li>')
            .join('');

        return '<div class="comparison-item">' +
            '<h4>' + t.metadata.title + '</h4>' +
            '<ul style="margin-left: 1rem; font-size: 0.9rem;">' + topWords + '</ul>' +
        '</div>';
    }).join('');

    content.innerHTML =
        '<div class="comparison-section">' +
            '<h3>Word Count Comparison</h3>' +
            '<div class="comparison-grid">' + wordCountItems + '</div>' +
        '</div>' +
        '<div class="comparison-section">' +
            '<h3>Sentiment Comparison</h3>' +
            '<div class="comparison-grid">' + sentimentItems + '</div>' +
        '</div>' +
        '<div class="comparison-section">' +
            '<h3>Top 10 Words Comparison</h3>' +
            '<div class="comparison-grid">' + wordsItems + '</div>' +
        '</div>';
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', loadData);
