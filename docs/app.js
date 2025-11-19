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
                        <h4 class="mb-0">📊 Metadata</h4>
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
                        <h4 class="mb-0">☁️ Top 50 Words</h4>
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
                        <h4 class="mb-0">📝 Style Analysis (Parts of Speech)</h4>
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
                        <h4 class="mb-0">🔍 Topics</h4>
                    </div>
                    <div class="card-body" id="topicsDisplay">
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('textDisplay').innerHTML = html;

    // Render visualizations
    setTimeout(() => {
        renderWordCloud(text.bag_of_words.word_frequencies, '#wordCloud');
        renderStyleChart(text.style, '#styleChart');
        renderTopics(text.topics, '#topicsDisplay');
    }, 100);
}

function renderWordCloud(wordFrequencies, selector) {
    console.log('========================================');
    console.log('WORD CLOUD: Starting render');
    console.log('Selector:', selector);
    
    const container = document.querySelector(selector);
    if (!container) {
        console.error('ERROR: Container not found');
        return;
    }
    
    container.innerHTML = '';
    
    // Get top 50 words
    const top50 = Object.entries(wordFrequencies).slice(0, 50);
    console.log('Words to render:', top50.length);
    
    if (top50.length === 0) {
        container.innerHTML = '<p style="color: red; font-weight: bold;">No words found!</p>';
        return;
    }
    
    // Get frequency range
    const frequencies = top50.map(([w, f]) => f);
    const minFreq = Math.min(...frequencies);
    const maxFreq = Math.max(...frequencies);
    console.log('Frequency range:', minFreq, '-', maxFreq);
    
    // Colors
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B3D9', '#EC7063', '#5DADE2', '#48C9B0', '#F39C12', '#AF7AC5'];
    
    // Build HTML with VERY SMALL fonts
    let html = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.2);">
            <div style="background: rgba(0,0,0,0.3); color: white; padding: 12px; border-radius: 8px; text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 15px;">
                Top 50 Words
            </div>
            <div style="display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px;">`;
    
    top50.forEach(([word, freq], idx) => {
        // VERY SMALL fonts: 6-10px
        const normalized = maxFreq === minFreq ? 0.5 : (freq - minFreq) / (maxFreq - minFreq);
        const fontSize = 6 + (normalized * 4); // 6-10px range
        const color = colors[idx % colors.length];
        
        html += `
            <div style="
                background: white;
                padding: 4px 2px;
                border-radius: 6px;
                text-align: center;
                font-size: ${fontSize}px;
                font-weight: bold;
                color: ${color};
                min-height: 35px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 1px 3px rgba(0,0,0,0.15);
                cursor: pointer;
                word-break: break-word;
                line-height: 1.2;
            " 
            title="${word}: ${freq}"
            onmouseover="this.style.transform='scale(1.08)'; this.style.zIndex='10';"
            onmouseout="this.style.transform='scale(1)'; this.style.zIndex='1';">
                ${word}
            </div>`;
    });
    
    html += `
            </div>
            <div style="color: white; text-align: center; margin-top: 12px; font-size: 13px; font-weight: bold;">
                All ${top50.length} words displayed (6-10px fonts)
            </div>
        </div>`;
    
    container.innerHTML = html;
    console.log('✓ Word cloud rendered successfully');
    console.log('✓ All', top50.length, 'words inserted');
    console.log('========================================');
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

    // Gradient colors
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
        .attr('rx', 6)
        .style('opacity', 0.9);

    // Value labels
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
        .style('fill', '#333')
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
        html += `<div class="mb-4">
            <h6 style="color: #667eea;"><strong>📌 Topic ${topic.topic_id}</strong></h6>
            <div>`;
        topic.top_words.forEach((word, idx) => {
            const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe'];
            html += `<span class="topic-badge" style="background: ${colors[idx % colors.length]};">${word}</span>`;
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
            <h4 class="mb-4 text-center" style="color: #667eea;">🔄 Side-by-Side Comparison</h4>

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
                        <div class="card-header"><strong>☁️ Top 50 Words</strong></div>
                        <div class="card-body">
                            <div id="wordCloud1"></div>
                        </div>
                    </div>
                    <div class="card mt-3">
                        <div class="card-header"><strong>🔍 Topics</strong></div>
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
                        <div class="card-header"><strong>☁️ Top 50 Words</strong></div>
                        <div class="card-body">
                            <div id="wordCloud2"></div>
                        </div>
                    </div>
                    <div class="card mt-3">
                        <div class="card-header"><strong>🔍 Topics</strong></div>
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
    }, 200);
}
