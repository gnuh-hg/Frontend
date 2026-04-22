import * as utils from '../../utils.js';
import { t, initI18n, onLangChange } from '../../i18n.js';

let BC_DATA = null;
let bcPeriod = 'month';

const BC_STEPS = 5;
const BC_CHART_H = 232; // 260px wrap - 28px label

function bcNiceMax(val) {
  if (val <= 0) return BC_STEPS * 20;
  const raw = val * 1.1;
  const mag = Math.pow(10, Math.floor(Math.log10(raw / BC_STEPS)));
  const niceSteps = [1, 2, 2.5, 5, 10];
  let step = mag;
  for (const s of niceSteps) {
    step = s * mag;
    if (step * BC_STEPS >= raw) break;
  }
  return step * BC_STEPS;
}

export { initBarChart, switchBcPeriod };

async function initBarChart() {
  await initI18n();

  if (utils.TEST) {
    BC_DATA = {
      week: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        projects: [
          {
            id: 'p1', name: 'Website Redesign', color: '#6366f1',
            data: [
              { on_time: 3, late: 1 }, { on_time: 5, late: 0 },
              { on_time: 2, late: 2 }, { on_time: 4, late: 1 },
              { on_time: 6, late: 0 }, { on_time: 1, late: 1 },
              { on_time: 0, late: 0 }
            ]
          },
          {
            id: 'p2', name: 'Backend API', color: '#22c55e',
            data: [
              { on_time: 2, late: 0 }, { on_time: 3, late: 1 },
              { on_time: 4, late: 0 }, { on_time: 1, late: 2 },
              { on_time: 3, late: 0 }, { on_time: 0, late: 0 },
              { on_time: 2, late: 1 }
            ]
          },
          {
            id: 'p3', name: 'Mobile App', color: '#7c3aed',
            data: [
              { on_time: 1, late: 1 }, { on_time: 0, late: 0 },
              { on_time: 3, late: 1 }, { on_time: 2, late: 0 },
              { on_time: 1, late: 2 }, { on_time: 2, late: 0 },
              { on_time: 1, late: 0 }
            ]
          },
          {
            id: 'p4', name: 'Marketing', color: '#ef4444',
            data: [
              { on_time: 0, late: 0 }, { on_time: 2, late: 1 },
              { on_time: 1, late: 0 }, { on_time: 0, late: 1 },
              { on_time: 2, late: 0 }, { on_time: 1, late: 0 },
              { on_time: 0, late: 0 }
            ]
          }
        ]
      },
      month: {
        labels: ['D.1', 'D.5', 'D.10', 'D.15', 'D.20', 'D.25', 'D.30'],
        projects: [
          {
            id: 'p1', name: 'Website Redesign', color: '#6366f1',
            data: [
              {on_time:2,late:0},{on_time:4,late:1},{on_time:3,late:2},
              {on_time:5,late:1},{on_time:2,late:1},{on_time:4,late:0},{on_time:3,late:1}
            ]
          },
          {
            id: 'p2', name: 'Backend API', color: '#22c55e',
            data: [
              {on_time:1,late:0},{on_time:3,late:1},{on_time:2,late:0},
              {on_time:4,late:1},{on_time:1,late:1},{on_time:3,late:0},{on_time:2,late:1}
            ]
          },
          {
            id: 'p3', name: 'Mobile App', color: '#7c3aed',
            data: [
              {on_time:0,late:0},{on_time:2,late:1},{on_time:1,late:1},
              {on_time:3,late:0},{on_time:2,late:1},{on_time:1,late:0},{on_time:2,late:0}
            ]
          }
        ]
      },
      year: {
        labels: [],
        projects: [
          {
            id: 'p1', name: 'Website Redesign', color: '#6366f1',
            data: [
              {on_time:12,late:3},{on_time:18,late:2},{on_time:15,late:5},{on_time:22,late:3},
              {on_time:19,late:4},{on_time:25,late:2},{on_time:20,late:6},{on_time:24,late:3},
              {on_time:28,late:4},{on_time:22,late:2},{on_time:26,late:3},{on_time:30,late:5}
            ]
          },
          {
            id: 'p2', name: 'Backend API', color: '#22c55e',
            data: [
              {on_time:8,late:2},{on_time:14,late:1},{on_time:11,late:3},{on_time:16,late:2},
              {on_time:13,late:1},{on_time:18,late:3},{on_time:15,late:2},{on_time:17,late:4},
              {on_time:20,late:2},{on_time:14,late:1},{on_time:18,late:2},{on_time:22,late:3}
            ]
          },
          {
            id: 'p3', name: 'Mobile App', color: '#7c3aed',
            data: [
              {on_time:5,late:2},{on_time:9,late:1},{on_time:7,late:3},{on_time:11,late:1},
              {on_time:8,late:2},{on_time:13,late:1},{on_time:10,late:3},{on_time:12,late:2},
              {on_time:15,late:1},{on_time:9,late:2},{on_time:11,late:1},{on_time:14,late:2}
            ]
          },
          {
            id: 'p4', name: 'Marketing', color: '#ef4444',
            data: [
              {on_time:3,late:1},{on_time:5,late:2},{on_time:4,late:1},{on_time:6,late:0},
              {on_time:4,late:2},{on_time:7,late:1},{on_time:5,late:2},{on_time:6,late:1},
              {on_time:8,late:0},{on_time:5,late:1},{on_time:6,late:2},{on_time:9,late:1}
            ]
          },
          {
            id: 'p5', name: 'DevOps', color: '#10b981',
            data: [
              {on_time:2,late:0},{on_time:4,late:1},{on_time:3,late:0},{on_time:5,late:1},
              {on_time:3,late:1},{on_time:6,late:0},{on_time:4,late:1},{on_time:5,late:0},
              {on_time:7,late:1},{on_time:4,late:0},{on_time:5,late:1},{on_time:8,late:0}
            ]
          }
        ]
      }
    };
    BC_DATA.year.labels = [
      t('statistics.month_jan'), t('statistics.month_feb'), t('statistics.month_mar'),
      t('statistics.month_apr'), t('statistics.month_may'), t('statistics.month_jun'),
      t('statistics.month_jul'), t('statistics.month_aug'), t('statistics.month_sep'),
      t('statistics.month_oct'), t('statistics.month_nov'), t('statistics.month_dec')
    ];
  } else {
    const section = document.querySelector('.bar-section');
    const ERROR_HTML = `
      <div class="stat-error-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <line x1="1" y1="1" x2="23" y2="23"/>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
        </svg>
        <p>${t('statistics.offline_title')}</p>
        <button class="stat-retry-btn" id="barRetry">${t('statistics.offline_retry')}</button>
      </div>`;
    try {
      const res = await utils.fetchWithAuth(`${utils.URL_API}/statistic/bar_chart`, {}, {
        onLoadStart: () => {
          section.style.position = 'relative';
          section.insertAdjacentHTML('beforeend', '<div class="stat-spinner-wrap"><div class="stat-spinner"></div></div>');
        },
        onLoadEnd: () => section.querySelector('.stat-spinner-wrap')?.remove(),
      });
      if (!res.ok) throw new Error(res.status);
      BC_DATA = await res.json();
    } catch (err) {
      section.querySelector('.stat-spinner-wrap')?.remove();
      if (err.message !== 'Unauthorized') {
        section.style.position = 'relative';
        section.insertAdjacentHTML('beforeend', ERROR_HTML);
        document.getElementById('barRetry')?.addEventListener('click', () => {
          section.querySelector('.stat-error-wrap')?.remove();
          initBarChart();
        });
      }
    }
  }

  if (BC_DATA) {
    renderBarChart();
    window.addEventListener('resize', () => renderBarChart());
  }
}

function switchBcPeriod(p, btn) {
  bcPeriod = p;
  document.querySelectorAll('.bc-period-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderBarChart();
}

function renderBarChart() {
  if (!BC_DATA) return;
  const d = BC_DATA[bcPeriod];
  const wrap = document.getElementById('bcColumnsWrap');
  const yAxis = document.getElementById('bcYAxis');
  const legend = document.getElementById('bcLegend');
  wrap.innerHTML = '';
  yAxis.innerHTML = '';
  legend.innerHTML = '';

  // Tính colW động: lấp đầy chiều rộng, tối đa 52px
  const MAX_COL_W = 52;
  const MIN_GAP   = 6;
  const n = d.labels.length;
  const containerW = wrap.getBoundingClientRect().width || 500;
  const naturalW = (containerW - MIN_GAP * (n - 1)) / n;
  const colW = Math.min(MAX_COL_W, Math.floor(naturalW));
  const isCapped = naturalW > MAX_COL_W;
  wrap.style.gap = isCapped ? '0px' : MIN_GAP + 'px';
  wrap.style.justifyContent = isCapped ? 'space-between' : 'flex-start';

  // Tính yMax động từ tổng pct mỗi cột
  const colTotals = d.labels.map((_, i) =>
    d.projects.reduce((sum, p) => {
      const total = p.data[i].on_time + p.data[i].late;
      if (total === 0) return sum;
      return sum + (p.data[i].on_time / total) * 100;
    }, 0)
  );
  const yMax = bcNiceMax(Math.max(...colTotals));
  const stepVal = yMax / BC_STEPS;

  // Y-axis labels (từ cao xuống thấp)
  for (let i = BC_STEPS; i >= 0; i--) {
    const div = document.createElement('div');
    div.className = 'bar-y-label';
    div.textContent = Math.round(stepVal * i) + '%';
    yAxis.appendChild(div);
  }

  // Grid lines theo yMax
  for (let i = 0; i <= BC_STEPS; i++) {
    const line = document.createElement('div');
    line.className = 'bar-grid-line';
    line.style.bottom = `calc(28px + ${(i / BC_STEPS) * BC_CHART_H}px)`;
    wrap.appendChild(line);
  }

  d.labels.forEach((label, i) => {
    const col = document.createElement('div');
    col.className = 'bar-col';
    col.style.width = colW + 'px';

    const segments = d.projects
      .map(p => {
        const total = p.data[i].on_time + p.data[i].late;
        const pct = total > 0 ? (p.data[i].on_time / total) * 100 : 0;
        return { ...p, pct, on_time: p.data[i].on_time, late: p.data[i].late, total };
      })
      .filter(p => p.total > 0)
      .sort((a, b) => b.pct - a.pct);

    if (segments.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'bar-col-empty';
      col.appendChild(empty);
    } else {
      segments.forEach(seg => {
        const div = document.createElement('div');
        div.className = 'bar-segment';
        div.style.height = (seg.pct / yMax * BC_CHART_H) + 'px';
        div.style.background = seg.color;
        div.style.transform = 'scaleY(0)';
        div.style.transition = `transform 0.45s cubic-bezier(0.4,0,0.2,1) ${i * 40}ms, filter 0.15s ease, opacity 0.15s ease`;
        div.addEventListener('mouseenter', (e) => {
          col.classList.add('has-hover');
          div.classList.add('hovered');
          bcShowTooltip(e, seg);
        });
        div.addEventListener('mousemove', (e) => bcMoveTooltip(e));
        div.addEventListener('mouseleave', () => {
          col.classList.remove('has-hover');
          div.classList.remove('hovered');
          bcHideTooltip();
        });
        col.appendChild(div);
      });
    }

    const labelDiv = document.createElement('div');
    labelDiv.className = 'bar-col-label';
    const labelStep = n > 20 ? 5 : n > 10 ? 3 : 1;
    if (i % labelStep === 0 || i === n - 1) labelDiv.textContent = label;
    col.appendChild(labelDiv);

    wrap.appendChild(col);
  });

  requestAnimationFrame(() => {
    wrap.querySelectorAll('.bar-segment').forEach(seg => {
      seg.style.transform = 'scaleY(1)';
    });
  });

  const MAX_LEGEND = 6;
  const seen = new Set();
  const legendProjects = d.projects.filter(p => p.data.some(pt => pt.on_time + pt.late > 0));
  const visible = legendProjects.slice(0, MAX_LEGEND);
  const hidden  = legendProjects.length - visible.length;

  visible.forEach(p => {
    if (seen.has(p.id)) return;
    seen.add(p.id);
    const item = document.createElement('div');
    item.className = 'bar-legend-item';
    item.innerHTML = `
      <div class="bar-legend-dot" style="background:${p.color}"></div>
      <span>${p.name}</span>
    `;
    legend.appendChild(item);
  });

  if (hidden > 0) {
    const more = document.createElement('div');
    more.className = 'bar-legend-more';
    more.textContent = `+${hidden} more`;
    legend.appendChild(more);
  }
}

function bcShowTooltip(e, seg) {
  const tip = document.getElementById('bcTooltip');
  document.getElementById('bcTtName').textContent = seg.name;
  document.getElementById('bcTtDot').style.background = seg.color;
  document.getElementById('bcTtPctLabel').textContent = t('statistics.bar.pct_label');
  document.getElementById('bcTtPct').textContent = seg.pct.toFixed(0) + '%';
  document.getElementById('bcTtOnTimeLabel').textContent = t('statistics.bar.on_time');
  document.getElementById('bcTtOnTime').textContent = seg.on_time + ' ' + t('statistics.bar.tasks');
  document.getElementById('bcTtLateLabel').textContent = t('statistics.bar.late');
  document.getElementById('bcTtLate').textContent = seg.late + ' ' + t('statistics.bar.tasks');
  tip.classList.add('show');
  bcMoveTooltip(e);
}

function bcMoveTooltip(e) {
  const tip = document.getElementById('bcTooltip');
  let left = e.clientX + 12;
  let top  = e.clientY - tip.offsetHeight / 2;
  if (left + tip.offsetWidth > window.innerWidth - 8) left = e.clientX - tip.offsetWidth - 12;
  if (top < 8) top = 8;
  if (top + tip.offsetHeight > window.innerHeight - 8) top = window.innerHeight - tip.offsetHeight - 8;
  tip.style.left = left + 'px';
  tip.style.top  = top + 'px';
}

function bcHideTooltip() {
  document.getElementById('bcTooltip').classList.remove('show');
}

onLangChange(() => {
  if (!BC_DATA) return;
  if (utils.TEST && BC_DATA.year) {
    BC_DATA.year.labels = [
      t('statistics.month_jan'), t('statistics.month_feb'), t('statistics.month_mar'),
      t('statistics.month_apr'), t('statistics.month_may'), t('statistics.month_jun'),
      t('statistics.month_jul'), t('statistics.month_aug'), t('statistics.month_sep'),
      t('statistics.month_oct'), t('statistics.month_nov'), t('statistics.month_dec')
    ];
  }
  renderBarChart();
});
