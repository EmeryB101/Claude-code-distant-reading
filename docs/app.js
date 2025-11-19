// Load data and initialize
let analysisData = null;

window.addEventListener('DOMContentLoaded', () => {
    if (typeof EMBEDDED_DATA !== 'undefined') {
        analysisData = EMBEDDED_DATA;
        initializeApp();
    } else {
        console.error('Data not loaded');
    }
});

function initializeApp() {
    // Filter out Unknown texts
    const texts = analysisData.texts.filter(t => t.metadata.author !== 'Unknown');

    // Populate dropdowns
    const textSelect = document.getElementById('textSelect');
    const text1Select = document.getElementById('text1Select');
    const text2Select = document.getElementById('text2Select');

    texts.forEach(text => {
        const option = new Option(text.metadata.title, text.metadata.id);
        textSelect.add(option.cloneNode(true));
        text1Select.add(option.cloneNode(true));
        text2Select.add(option.cloneNode(true));
    });
}

function switchMode(mode) {
    const singleView = document.getElementById('singleView');
    const compareView = document.getElementById('compareView');
    const singleBtn = document.getElementById('singleViewBtn');
    const compareBtn = document.getElementById('compareViewBtn');

    if (mode === 'single') {
        singleView.style.display = 'block';
        compareView.style.display = 'none';
        singleBtn.classList.add('btn-primary');
        singleBtn.classList.remove('btn-outline-primary');
        compareBtn.classList.remove('btn-primary');
        compareBtn.classList.add('btn-outline-primary');
    } else {
        singleView.style.display = 'none';
        compareView.style.display = 'block';
        singleBtn.classList.remove('btn-primary');
        singleBtn.classList.add('btn-outline-primary');
        compareBtn.classList.add('btn-primary');
        compareBtn.classList.remove('btn-outline-primary');
    }
}

function displayText() {
    const textId = document.getElementById('textSelect').value;
    if (!textId) {
        document.getElementById('textDisplay').innerHTML = '';
        return;
    }

    const text = analysisData.texts.find(t => t.metadata.id === textId);
    if (!text) return;

    const html = `
        <div class="row">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        <h4 class="mb-0">Metadata</h4>
                    </div>
                    <div class="card-body">
                        <div class="metric-row">
                            <span class="metric-label">Title:</span>
                            <span class="metric-value">${text.metadata.title}</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Author:</span>
                            <span class="metric-value">${text.metadata.author}</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Total Words:</span>
                            <span class="metric-value">${text.bag_of_words.total_words.toLocaleString()}</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Unique Words:</span>
                            <span class="metric-value">${text.bag_of_words.unique_words.toLocaleString()}</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Lexical Diversity:</span>
                            <span class="metric-value">${text.vocabulary_richness.lexical_diversity}</span>
                        </div>
                        <div class="metric-row">
                            <span class="metric-label">Sentiment (Compound):</span>
                            <span class="metric-value">${text.sentiment.overall.compound}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        <h4 class="mb-0">Top 50 Words</h4>
                    </div>
                    <div class="card-body">
                        <div id="wordCloud"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        <h4 class="mb-0">Style Analysis (Parts of Speech)</h4>
                    </div>
                    <div class="card-body">
                        <div id="styleChart"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        <h4 class="mb-0">Topics</h4>
                    </div>
                    <div class="card-body" id="topicsDisplay">
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('textDisplay').innerHTML = html;

    // Render visualizations with slight delay to ensure DOM is ready
    setTimeout(() => {
        renderWordCloud(text.bag_of_words.word_frequencies, '#wordCloud');
        renderStyleChart(text.style, '#styleChart');
        renderTopics(text.topics, '#topicsDisplay');
    }, 100);
}

function renderWordCloud(wordFrequencies, selector) {
    // Clear previous
    d3.select(selector).selectAll('*').remove();

    // Get top 50 words
    const words = Object.entries(wordFrequencies).map(([word, freq]) => ({
        text: word,
        size: freq
    }));

    console.log('Rendering word cloud with', words.length, 'words');

    // Get container dimensions
    const container = document.querySelector(selector);
    if (!container) {
        console.error('Container not found:', selector);
        return;
    }

    const width = container.offsetWidth || 800;
    const height = 600;  // Increased height for better spacing

    console.log('Container dimensions:', width, 'x', height);

    // Create SVG
    const svg = d3.select(selector)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', '#f8f9fa')
        .style('border', '1px solid #dee2e6')
        .style('border-radius', '8px');

    // Color scale - vibrant colors
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
                    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B3D9'];

    // Find min/max frequencies
    const minFreq = d3.min(words, d => d.size);
    const maxFreq = d3.max(words, d => d.size);

    console.log('Frequency range:', minFreq, 'to', maxFreq);

    // Grid layout: 10 columns x 5 rows for 50 words
    const cols = 10;
    const rows = 5;
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    console.log('Cell dimensions:', cellWidth, 'x', cellHeight);

    // Calculate max font size that fits in cell
    const maxFontSize = Math.min(cellHeight * 0.6, cellWidth * 0.15, 24);
    const minFontSize = Math.max(maxFontSize * 0.4, 10);

    console.log('Font size range:', minFontSize, 'to', maxFontSize);

    // Font size scale based on frequency
    const fontSize = d3.scaleLinear()
        .domain([minFreq, maxFreq])
        .range([minFontSize, maxFontSize]);

    // Render words in grid
    const textElements = svg.selectAll('text')
        .data(words.slice(0, 50))  // Ensure exactly 50 words
        .enter()
        .append('text')
        .attr('class', 'word-cloud-word')
        .attr('x', (d, i) => (i % cols) * cellWidth + cellWidth / 2)
        .attr('y', (d, i) => Math.floor(i / cols) * cellHeight + cellHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', d => fontSize(d.size) + 'px')
        .attr('font-weight', 'bold')
        .attr('fill', (d, i) => colors[i % colors.length])
        .style('cursor', 'pointer')
        .text(d => {
            // Truncate long words to fit in cell
            const maxChars = Math.floor(cellWidth / (fontSize(d.size) * 0.6));
            return d.text.length > maxChars ? d.text.substring(0, maxChars) + '...' : d.text;
        });

    // Add tooltips
    textElements.append('title')
        .text(d => `${d.text}: ${d.size} occurrences`);

    // Add word count indicator
    svg.append('text')
        .attr('x', width - 10)
        .attr('y', height - 10)
        .attr('text-anchor', 'end')
        .attr('font-size', '11px')
        .attr('fill', '#6c757d')
        .text(`${words.length} words displayed`);

    console.log('Word cloud rendered successfully with', words.length, 'words');
}

function renderStyleChart(style, selector) {
    // Clear previous
    d3.select(selector).selectAll('*').remove();

    // Prepare data
    const data = Object.entries(style.percentages).map(([key, value]) => ({
        category: key.charAt(0).toUpperCase() + key.slice(1),
        percentage: value
    })).filter(d => d.percentage > 0).sort((a, b) => b.percentage - a.percentage);

    // Set up dimensions
    const margin = {top: 20, right: 30, bottom: 80, left: 60};
    const container = document.querySelector(selector);
    const width = (container.offsetWidth || 800) - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(selector)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleBand()
        .range([0, width])
        .padding(0.2)
        .domain(data.map(d => d.category));

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(data, d => d.percentage) * 1.1]);

    // Color scale
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe',
                    '#43e97b', '#38f9d7', '#fa709a', '#fee140'];

    // Bars
    svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.category))
        .attr('y', d => y(d.percentage))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.percentage))
        .attr('fill', (d, i) => colors[i % colors.length])
        .attr('rx', 4)
        .style('opacity', 0.9);

    // Add value labels on bars
    svg.selectAll('.label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'label')
        .attr('x', d => x(d.category) + x.bandwidth() / 2)
        .attr('y', d => y(d.percentage) - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text(d => d.percentage.toFixed(1) + '%');

    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .style('font-size', '11px');

    // Y axis
    svg.append('g')
        .call(d3.axisLeft(y).ticks(10).tickFormat(d => d + '%'))
        .style('font-size', '11px');

    // Y axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text('Percentage (%)');
}

function renderTopics(topics, selector) {
    if (!topics.topics || topics.topics.length === 0) {
        document.getElementById(selector.replace('#', '')).innerHTML = '<p class="text-muted">No topics available</p>';
        return;
    }

    let html = '';
    topics.topics.forEach(topic => {
        html += `<div class="mb-3">
            <h6><strong>Topic ${topic.topic_id}</strong></h6>
            <div>`;
        topic.top_words.forEach(word => {
            html += `<span class="topic-badge">${word}</span>`;
        });
        html += `</div></div>`;
    });

    document.getElementById(selector.replace('#', '')).innerHTML = html;
}

function compareTexts() {
    const text1Id = document.getElementById('text1Select').value;
    const text2Id = document.getElementById('text2Select').value;

    if (!text1Id || !text2Id) {
        document.getElementById('comparisonDisplay').innerHTML = '';
        return;
    }

    const text1 = analysisData.texts.find(t => t.metadata.id === text1Id);
    const text2 = analysisData.texts.find(t => t.metadata.id === text2Id);

    if (!text1 || !text2) return;

    const html = `
        <div class="comparison-section">
            <h4 class="mb-4 text-center">Side-by-Side Comparison</h4>

            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header"><strong>${text1.metadata.title}</strong></div>
                        <div class="card-body">
                            <div class="metric-row">
                                <span class="metric-label">Author:</span>
                                <span class="metric-value">${text1.metadata.author}</span>
                            </div>
                            <div class="metric-row">
                                <span class="metric-label">Words:</span>
                                <span class="metric-value">${text1.bag_of_words.total_words.toLocaleString()}</span>
                            </div>
                            <div class="metric-row">
                                <span class="metric-label">Unique:</span>
                                <span class="metric-value">${text1.bag_of_words.unique_words.toLocaleString()}</span>
                            </div>
                            <div class="metric-row">
                                <span class="metric-label">Lexical Diversity:</span>
                                <span class="metric-value">${text1.vocabulary_richness.lexical_diversity}</span>
                            </div>
                            <div class="metric-row">
                                <span class="metric-label">Sentiment:</span>
                                <span class="metric-value">${text1.sentiment.overall.compound}</span>
                            </div>
                        </div>
                    </div>
                    <div class="card mt-3">
                        <div class="card-header"><strong>Top 50 Words</strong></div>
                        <div class="card-body">
                            <div id="wordCloud1"></div>
                        </div>
                    </div>
                    <div class="card mt-3">
                        <div class="card-header"><strong>Topics</strong></div>
                        <div class="card-body" id="topics1"></div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header"><strong>${text2.metadata.title}</strong></div>
                        <div class="card-body">
                            <div class="metric-row">
                                <span class="metric-label">Author:</span>
                                <span class="metric-value">${text2.metadata.author}</span>
                            </div>
                            <div class="metric-row">
                                <span class="metric-label">Words:</span>
                                <span class="metric-value">${text2.bag_of_words.total_words.toLocaleString()}</span>
                            </div>
                            <div class="metric-row">
                                <span class="metric-label">Unique:</span>
                                <span class="metric-value">${text2.bag_of_words.unique_words.toLocaleString()}</span>
                            </div>
                            <div class="metric-row">
                                <span class="metric-label">Lexical Diversity:</span>
                                <span class="metric-value">${text2.vocabulary_richness.lexical_diversity}</span>
                            </div>
                            <div class="metric-row">
                                <span class="metric-label">Sentiment:</span>
                                <span class="metric-value">${text2.sentiment.overall.compound}</span>
                            </div>
                        </div>
                    </div>
                    <div class="card mt-3">
                        <div class="card-header"><strong>Top 50 Words</strong></div>
                        <div class="card-body">
                            <div id="wordCloud2"></div>
                        </div>
                    </div>
                    <div class="card mt-3">
                        <div class="card-header"><strong>Topics</strong></div>
                        <div class="card-body" id="topics2"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('comparisonDisplay').innerHTML = html;

    // Render visualizations with delay
    setTimeout(() => {
        renderWordCloud(text1.bag_of_words.word_frequencies, '#wordCloud1');
        renderWordCloud(text2.bag_of_words.word_frequencies, '#wordCloud2');
        renderTopics(text1.topics, '#topics1');
        renderTopics(text2.topics, '#topics2');
    }, 200);
}
