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
    console.log('=== WORD CLOUD START ===');
    
    // Clear previous
    d3.select(selector).selectAll('*').remove();

    // Get top 50 words
    const words = Object.entries(wordFrequencies)
        .slice(0, 50)
        .map(([word, freq]) => ({ text: word, size: freq }));

    console.log('Total words to render:', words.length);
    console.log('Sample words:', words.slice(0, 3).map(w => `${w.text}:${w.size}`));

    // Get container
    const container = document.querySelector(selector);
    if (!container) {
        console.error('ERROR: Container not found:', selector);
        return;
    }

    // Fixed dimensions
    const width = Math.max(container.offsetWidth || 800, 700);
    const height = 600;

    console.log('Canvas dimensions:', width, 'x', height);

    // Create SVG
    const svg = d3.select(selector)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)')
        .style('border', '3px solid #00acc1')
        .style('border-radius', '10px')
        .style('display', 'block');

    console.log('SVG created');

    // Vibrant colors
    const colors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
                    '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a',
                    '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];

    // Grid: 10 columns x 5 rows = 50 words
    const cols = 10;
    const rows = 5;
    
    // Add padding
    const padding = { top: 60, bottom: 40, left: 20, right: 20 };
    const gridWidth = width - padding.left - padding.right;
    const gridHeight = height - padding.top - padding.bottom;
    
    const cellWidth = gridWidth / cols;
    const cellHeight = gridHeight / rows;

    console.log('Grid layout:', cols, 'x', rows);
    console.log('Cell size:', cellWidth.toFixed(1), 'x', cellHeight.toFixed(1));

    // VERY SMALL font sizes to guarantee all words fit
    const minFreq = d3.min(words, d => d.size) || 1;
    const maxFreq = d3.max(words, d => d.size) || 10;
    
    // Super conservative: 8-12px only
    const maxFontSize = 12;
    const minFontSize = 8;

    console.log('Frequency range:', minFreq, '-', maxFreq);
    console.log('Font size range:', minFontSize, '-', maxFontSize, 'px');

    const fontSize = d3.scaleLinear()
        .domain([minFreq, maxFreq])
        .range([minFontSize, maxFontSize]);

    // Title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .attr('font-size', '20px')
        .attr('font-weight', 'bold')
        .attr('fill', '#00695c')
        .text('Top 50 Most Common Words');

    // Render all 50 words in grid
    console.log('Rendering', words.length, 'words...');
    
    const textElements = svg.selectAll('.word')
        .data(words)
        .enter()
        .append('text')
        .attr('class', 'word-cloud-word')
        .attr('x', (d, i) => {
            const col = i % cols;
            return padding.left + col * cellWidth + cellWidth / 2;
        })
        .attr('y', (d, i) => {
            const row = Math.floor(i / cols);
            return padding.top + row * cellHeight + cellHeight / 2;
        })
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', d => fontSize(d.size) + 'px')
        .attr('font-weight', '600')
        .attr('fill', (d, i) => colors[i % colors.length])
        .style('cursor', 'pointer')
        .text(d => {
            // Truncate if needed
            const fs = fontSize(d.size);
            const maxChars = Math.floor(cellWidth / (fs * 0.45));
            if (d.text.length > maxChars) {
                return d.text.substring(0, maxChars - 1) + '.';
            }
            return d.text;
        })
        .on('mouseover', function() {
            d3.select(this).style('opacity', 0.7);
        })
        .on('mouseout', function() {
            d3.select(this).style('opacity', 1);
        });

    console.log('Text elements created:', textElements.size());

    // Add tooltips
    textElements.append('title')
        .text(d => `${d.text}: ${d.size} occurrences`);

    // Grid lines for debugging (optional - comment out in production)
    /*
    for (let i = 0; i <= cols; i++) {
        svg.append('line')
            .attr('x1', padding.left + i * cellWidth)
            .attr('y1', padding.top)
            .attr('x2', padding.left + i * cellWidth)
            .attr('y2', padding.top + gridHeight)
            .attr('stroke', '#ccc')
            .attr('stroke-width', 1);
    }
    for (let i = 0; i <= rows; i++) {
        svg.append('line')
            .attr('x1', padding.left)
            .attr('y1', padding.top + i * cellHeight)
            .attr('x2', padding.left + gridWidth)
            .attr('y2', padding.top + i * cellHeight)
            .attr('stroke', '#ccc')
            .attr('stroke-width', 1);
    }
    */

    // Footer
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height - 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('fill', '#00695c')
        .text(`All ${words.length} words displayed | Font: ${minFontSize}-${maxFontSize}px`);

    console.log('✓ Word cloud rendering complete');
    console.log('=== WORD CLOUD END ===');
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
