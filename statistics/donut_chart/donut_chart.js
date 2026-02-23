/* ── donut.js ── */

const DONUT_R = 56;
const DONUT_CIRC = 2 * Math.PI * DONUT_R;
const DONUT_GAP  = (2.2 / 360) * DONUT_CIRC;
const DONUT_MAX_SHOWN = 4;
const DONUT_COLORS = ['#6366f1','#7c3aed','#22c55e','#ef4444','#f59e0b'];
const DONUT_COLOR_OTHERS = '#3f3f46';

const DONUT_PROJECTS = [
  { name: 'Website Redesign' },
  { name: 'Mobile App'       },
  { name: 'Backend API'      },
  { name: 'Marketing'        },
  { name: 'Analytics'        },
  { name: 'Design System'    },
  { name: 'DevOps'           },
  { name: 'Customer Portal'  },
  { name: 'Internal Tools'   },
];

const DONUT_DATA = {
  week: {
    tasks: [14, 9, 11, 6, 4, 3, 5, 2, 1],
    focus: [5.5, 3.5, 4.5, 2.0, 1.5, 1.0, 2.0, 0.5, 0.5],
  },
  month: {
    tasks: [52, 38, 44, 21, 17, 12, 19, 8, 6],
    focus: [21.0, 15.5, 18.0, 8.0, 6.5, 5.0, 7.5, 3.0, 2.5],
  },
  year: {
    tasks: [310, 240, 280, 120, 95, 74, 110, 48, 36],
    focus: [124, 96, 112, 48, 38, 30, 44, 19, 14],
  },
};

const DONUT_PERIOD_LABEL = { week: 'Last 7 days', month: 'Last 30 days', year: 'Last 12 months' };
const DONUT_METRIC_LABEL = { tasks: 'Tasks', focus: 'Focus hours' };
const DONUT_METRIC_UNIT  = { tasks: ' tasks', focus: 'h' };
const DONUT_METRIC_CLASS = { tasks: 'active-tasks', focus: 'active-focus' };

let donutPeriod = 'week';
let donutMetric = 'tasks';
let donutCircles  = [];
let donutLegItems = [];

function setDonutPeriod(p, btn) {
  donutPeriod = p;
  document.querySelectorAll('.donut-period-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDonut();
}

function setDonutMetric(m, btn) {
  donutMetric = m;
  document.getElementById('donutBtnTasks').className = 'metric-btn';
  document.getElementById('donutBtnFocus').className = 'metric-btn';
  btn.classList.add(DONUT_METRIC_CLASS[m]);
  renderDonut();
}

function donutFmtVal(v) {
  return donutMetric === 'focus' ? v.toFixed(1) + 'h' : v + ' tasks';
}

function donutSetCenter(num, color) {
  const unit = donutMetric === 'focus' ? 'hours' : 'tasks';
  const el   = document.getElementById('donutCenterValue');
  el.innerHTML = `${num}<span class="unit">${unit}</span>`;
  el.style.color = color || '';
}

function donutBuildSegments(vals) {
  const indexed = vals.map((v,i) => ({i,v})).sort((a,b) => b.v - a.v);
  if (indexed.length <= DONUT_MAX_SHOWN) {
    return indexed.map(({i,v}, si) => ({ name: DONUT_PROJECTS[i].name, value:v, color: DONUT_COLORS[si % DONUT_COLORS.length], isOthers:false }));
  }
  const top  = indexed.slice(0, DONUT_MAX_SHOWN);
  const rest = indexed.slice(DONUT_MAX_SHOWN);
  const segs = top.map(({i,v}, si) => ({ name: DONUT_PROJECTS[i].name, value:v, color: DONUT_COLORS[si % DONUT_COLORS.length], isOthers:false }));
  segs.push({
    name: `Others (${rest.length})`,
    value: rest.reduce((a,b) => a+b.v, 0),
    color: DONUT_COLOR_OTHERS,
    isOthers: true,
    children: rest.map(({i,v}) => ({ name: DONUT_PROJECTS[i].name, value:v })),
  });
  return segs;
}

function donutActivate(i, segs) {
  const seg = segs[i];
  const svg = document.getElementById('donutSvg');
  svg.classList.add('has-hover');
  donutCircles[i].classList.add('hovered');
  const num = donutMetric === 'focus' ? seg.value.toFixed(1) : seg.value;
  donutSetCenter(num, seg.color);
  document.getElementById('donutCenterLabel').textContent = seg.isOthers ? 'Others' : seg.name;
  donutLegItems.forEach((el,j) => {
    el.classList.toggle('active', j === i);
    el.querySelector('.donut-legend-dot').style.boxShadow = j === i ? `0 0 8px ${seg.color}` : 'none';
  });
}

function donutDeactivate(total) {
  document.getElementById('donutSvg').classList.remove('has-hover');
  donutCircles.forEach(c => c.classList.remove('hovered'));
  const num = donutMetric === 'focus' ? total.toFixed(1) : total;
  donutSetCenter(num, '');
  document.getElementById('donutCenterLabel').textContent = 'Total';
  donutLegItems.forEach(el => {
    el.classList.remove('active');
    el.querySelector('.donut-legend-dot').style.boxShadow = 'none';
  });
}

function renderDonut() {
  const vals  = DONUT_DATA[donutPeriod][donutMetric];
  const total = vals.reduce((a,b)=>a+b,0);
  const segs  = donutBuildSegments(vals);
  const svg   = document.getElementById('donutSvg');
  const legEl = document.getElementById('donutLegend');

  document.getElementById('donutSubtitle').textContent    = `${DONUT_PERIOD_LABEL[donutPeriod]} · ${DONUT_METRIC_LABEL[donutMetric]}`;
  document.getElementById('donutFooterValue').textContent = donutFmtVal(total);
  document.getElementById('donutFooterValue').style.color = donutMetric === 'tasks' ? '#818cf8' : 'var(--accent-green)';

  donutSetCenter(donutMetric === 'focus' ? total.toFixed(1) : total, '');
  document.getElementById('donutCenterLabel').textContent = 'Total';

  donutCircles.forEach(c => c.remove());
  donutCircles  = [];
  legEl.innerHTML = '';
  donutLegItems   = [];

  let offset = 0;

  segs.forEach((seg, i) => {
    const pct = seg.value / total;
    const len = pct * DONUT_CIRC - DONUT_GAP;

    const ns  = 'http://www.w3.org/2000/svg';
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', 74);
    circle.setAttribute('cy', 74);
    circle.setAttribute('r', DONUT_R);
    circle.classList.add('donut-segment');
    circle.style.stroke = seg.color;
    circle.style.strokeDasharray  = `0 ${DONUT_CIRC}`;
    circle.style.strokeDashoffset = -offset;
    svg.appendChild(circle);
    donutCircles.push(circle);

    requestAnimationFrame(() => {
      setTimeout(() => { circle.style.strokeDasharray = `${len} ${DONUT_CIRC}`; }, 30 + i * 80);
    });

    offset += pct * DONUT_CIRC;

    circle.addEventListener('mouseenter', () => donutActivate(i, segs));
    circle.addEventListener('mouseleave', () => donutDeactivate(total));

    // Legend row
    const item = document.createElement('div');
    item.className = 'donut-legend-item' + (seg.isOthers ? ' others-row' : '');
    item.innerHTML = `
      <div class="donut-legend-dot" style="background:${seg.color}"></div>
      <div class="donut-legend-name">${seg.name}</div>
      <div class="donut-legend-val">${donutFmtVal(seg.value)}</div>
    `;

    legEl.appendChild(item);
    donutLegItems.push(item);

    item.addEventListener('mouseenter', () => donutActivate(i, segs));
    item.addEventListener('mouseleave', () => donutDeactivate(total));
  });
}