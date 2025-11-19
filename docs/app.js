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

    // Render visualizations
    renderWordCloud(text.bag_of_words.word_frequencies, '#wordCloud');
    renderStyleChart(text.style, '#styleChart');
    renderTopics(text.topics, '#topicsDisplay');
}

function renderWordCloud(wordFrequencies, selector) {
    // Clear previous
    d3.select(selector).selectAll('*').remove();

    // Get top 50 words
    const words = Object.entries(wordFrequencies).map(([word, freq]) => ({
        text: word,
        size: freq
    }));

    // Set up dimensions
    const width = document.querySelector(selector).offsetWidth;
    const height = 400;

    // Create SVG
    const svg = d3.select(selector)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Find min/max frequencies
    const minFreq = d3.min(words, d => d.size);
    const maxFreq = d3.max(words, d => d.size);

    // Font size scale
    const fontSize = d3.scalePow()
        .exponent(0.5)
        .domain([minFreq, maxFreq])
        .range([16, 60]);

    // Simple scatter layout for word cloud
    words.forEach((word, i) => {
        const angle = (i / words.length) * 2 * Math.PI;
        const radius = 50 + Math.random() * 150;
        word.x = width/2 + Math.cos(angle) * radius;
        word.y = height/2 + Math.sin(angle) * radius;
    });

    // Render words
    svg.selectAll('text')
        .data(words)
        .enter()
        .append('text')
        .attr('class', 'word-cloud-word')
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('text-anchor', 'middle')
        .attr('font-size', d => fontSize(d.size) + 'px')
        .attr('font-weight', 'bold')
        .attr('fill', (d, i) => color(i))
        .text(d => d.text)
        .append('title')
        .text(d => `${d.text}: ${d.size}`);
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
    const margin = {top: 20, right: 30, bottom: 60, left: 60};
    const width = document.querySelector(selector).offsetWidth - margin.left - margin.right;
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
        .padding(0.1)
        .domain(data.map(d => d.category));

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(data, d => d.percentage)]);

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

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
        .attr('fill', (d, i) => color(i))
        .style('opacity', 0.8);

    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

    // Y axis
    svg.append('g')
        .call(d3.axisLeft(y).ticks(10));

    // Y axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
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
            <h6>Topic ${topic.topic_id}</h6>
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
            <h4 class="mb-4 text-center">Comparison</h4>

            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">${text1.metadata.title}</div>
                        <div class="card-body">
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
                        <div class="card-header">Word Cloud</div>
                        <div class="card-body">
                            <div id="wordCloud1"></div>
                        </div>
                    </div>
                    <div class="card mt-3">
                        <div class="card-header">Topics</div>
                        <div class="card-body" id="topics1"></div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">${text2.metadata.title}</div>
                        <div class="card-body">
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
                        <div class="card-header">Word Cloud</div>
                        <div class="card-body">
                            <div id="wordCloud2"></div>
                        </div>
                    </div>
                    <div class="card mt-3">
                        <div class="card-header">Topics</div>
                        <div class="card-body" id="topics2"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('comparisonDisplay').innerHTML = html;

    // Render visualizations
    setTimeout(() => {
        renderWordCloud(text1.bag_of_words.word_frequencies, '#wordCloud1');
        renderWordCloud(text2.bag_of_words.word_frequencies, '#wordCloud2');
        renderTopics(text1.topics, '#topics1');
        renderTopics(text2.topics, '#topics2');
    }, 100);
}
