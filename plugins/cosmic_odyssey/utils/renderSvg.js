/// Render SVG module
import { JSDOM } from 'jsdom';

export function renderAIRadarChart(data, title) {
  // Create DOM
  const { window } = new JSDOM();
  const document = window.document;

  // Size
  const centerX = 170;
  const centerY = 170;
  const radius = 120;

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '340');
  svg.setAttribute('height', '340');

  // Draw axis
  for (let i = 0; i < data.length; i++) {
    const angle = (Math.PI * 2 * i) / data.length;
    const x = centerX + radius * Math.sin(angle);
    const y = centerY - radius * Math.cos(angle);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', centerX.toString());
    line.setAttribute('y1', centerY.toString());
    line.setAttribute('x2', x.toString());
    line.setAttribute('y2', y.toString());
    line.setAttribute('stroke', '#fff');
    line.setAttribute('stroke-width', '2');

    svg.appendChild(line);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.innerHTML = title[i];
    text.setAttribute('fill', '#fff');
    text.setAttribute('stroke', 'none');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('alignment-baseline', 'middle');
    text.setAttribute('x', (x + 30 * Math.sin(angle)).toString());
    text.setAttribute('y', (y - 30 * Math.cos(angle)).toString());
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('font-size', '24px');
    text.setAttribute('font-family', 'smiley');

    const tspan = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'tspan'
    );
    if (data[i] < 0.25) {
      tspan.innerHTML = ' C';
      tspan.setAttribute('fill', '#22c55e');
    } else if (data[i] < 0.5) {
      tspan.innerHTML = ' B';
      tspan.setAttribute('fill', 'yellow');
    } else if (data[i] < 0.75) {
      tspan.innerHTML = ' A';
      tspan.setAttribute('fill', 'orange');
    } else {
      tspan.innerHTML = ' S';
      tspan.setAttribute('fill', 'red');
    }
    tspan.setAttribute('font-size', '26px');
    tspan.setAttribute('alignment-baseline', 'middle');

    text.appendChild(tspan);
    svg.appendChild(text);
  }

  // Draw grid
  for (let i = 1; i < 5; i++) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let pathData = '';
    for (let j = 0; j < data.length; j++) {
      const angle = (Math.PI * 2 * j) / data.length;
      const value = i / 4;
      const x = centerX + radius * Math.sin(angle) * value;
      const y = centerY - radius * Math.cos(angle) * value;
      pathData += j === 0 ? `M ${x},${y}` : `L ${x},${y} `;
    }
    pathData += 'Z';

    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#fff');
    path.setAttribute('stroke-width', '2');

    svg.appendChild(path);
  }

  // Draw radar
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  let pathData = '';
  for (let i = 0; i < data.length; i++) {
    const angle = (Math.PI * 2 * i) / data.length;
    const value = data[i];
    const x = centerX + radius * Math.sin(angle) * value;
    const y = centerY - radius * Math.cos(angle) * value;
    pathData += i === 0 ? `M ${x},${y}` : `L ${x},${y} `;
  }
  pathData += 'Z';

  path.setAttribute('d', pathData);
  path.setAttribute('fill', '#f004');
  path.setAttribute('stroke', '#f00');
  path.setAttribute('stroke-width', '3');

  svg.appendChild(path);

  return svg.outerHTML;
}
