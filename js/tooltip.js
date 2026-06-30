let activeTooltip = null;
let tooltipTimeout = null;

function showTooltip(word, meaning, source, x, y) {
    if (activeTooltip) activeTooltip.remove();
    if (tooltipTimeout) clearTimeout(tooltipTimeout);

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip-box';

    const viewportHeight = window.innerHeight;
    const position = y > viewportHeight / 2 ? 'top' : 'bottom';
    if (position === 'bottom') tooltip.classList.add('bottom');

    let sourceText = '';
    if (source === 'notebook') sourceText = '📔 Từ NotebookLM';
    else if (source === 'google') sourceText = '🌐 Google Dịch';
    else if (source === 'manual') sourceText = '📝 Từ do bạn nhập';

    tooltip.innerHTML = `
        <span class="tooltip-word">${word}</span>
        <span class="tooltip-meaning">${meaning}</span>
        ${sourceText ? `<div class="tooltip-source">${sourceText}</div>` : ''}
    `;

    document.body.appendChild(tooltip);
    activeTooltip = tooltip;

    const tooltipWidth = tooltip.offsetWidth;
    let left = x - tooltipWidth / 2;
    left = Math.max(10, Math.min(left, window.innerWidth - tooltipWidth - 10));

    let top;
    if (position === 'bottom') top = y + 20;
    else top = y - tooltip.offsetHeight - 20;

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';

    tooltipTimeout = setTimeout(() => {
        if (activeTooltip) {
            activeTooltip.style.animation = 'tooltipFadeIn 0.2s ease reverse';
            setTimeout(() => {
                if (activeTooltip) { activeTooltip.remove(); activeTooltip = null; }
            }, 200);
        }
    }, 4000);
}

document.addEventListener('click', function(e) {
    if (activeTooltip && !e.target.closest('.korean-word')) {
        activeTooltip.remove(); activeTooltip = null;
        if (tooltipTimeout) clearTimeout(tooltipTimeout);
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && activeTooltip) {
        activeTooltip.remove(); activeTooltip = null;
        if (tooltipTimeout) clearTimeout(tooltipTimeout);
    }
});
