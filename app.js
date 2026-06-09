const COUPLE_START_DATE = "2025-10-01T20:00:00+08:00";

const seedData = {
  memories: [
    {
      title: "第一次认真计划未来",
      date: "2026-02-14",
      tag: "纪念",
      body: "把想去的城市、想吃的店、想看的电影都写了下来，突然觉得以后变得很具体。"
    },
    {
      title: "雨后的散步",
      date: "2026-01-20",
      tag: "日常",
      body: "没有特别安排，只是走了很久。路灯、风和一句句没说完的话，都很值得记住。"
    }
  ],
  affection: [
    { date: "2026-05-10", me: 90, her: 88, note: "一起做饭" },
    { date: "2026-05-17", me: 92, her: 90, note: "周末约会" },
    { date: "2026-05-24", me: 95, her: 93, note: "收到小惊喜" },
    { date: "2026-05-31", me: 94, her: 92, note: "聊了很多" },
    { date: "2026-06-05", me: 96, her: 94, note: "很安心的一天" }
  ],
  wishes: [
    { title: "一起去海边看日出", status: "想做" },
    { title: "拍一组正式合照", status: "计划中" },
    { title: "做一次双人晚餐", status: "已完成" }
  ],
  anniversaries: [
    { title: "在一起纪念日", date: "2025-10-01" },
    { title: "第一次旅行", date: "2026-04-05" },
    { title: "她的生日", date: "2026-09-18" }
  ],
  letters: [
    {
      title: "给未来的我们",
      openDate: "2026-10-01",
      body: "希望那天打开的时候，我们还能因为这些小事笑出来。"
    }
  ]
};

const storageKey = "two-of-us-data";
const state = loadState();

function loadState() {
  const stored = localStorage.getItem(storageKey);
  if (!stored) {
    localStorage.setItem(storageKey, JSON.stringify(seedData));
    return structuredClone(seedData);
  }

  try {
    return { ...structuredClone(seedData), ...JSON.parse(stored) };
  } catch {
    localStorage.setItem(storageKey, JSON.stringify(seedData));
    return structuredClone(seedData);
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(`${dateString}T00:00:00`));
}

function daysBetween(targetDate) {
  const today = new Date();
  const target = new Date(`${targetDate}T00:00:00`);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / 86400000);
}

function nextOccurrence(dateString) {
  const today = new Date();
  const source = new Date(`${dateString}T00:00:00`);
  let next = new Date(today.getFullYear(), source.getMonth(), source.getDate());

  if (next < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    next = new Date(today.getFullYear() + 1, source.getMonth(), source.getDate());
  }

  return next;
}

function renderTimeTogether() {
  const start = new Date(COUPLE_START_DATE);
  const now = new Date();
  const totalSeconds = Math.max(0, Math.floor((now - start) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  document.querySelector("#timeTogether").textContent = `${days} 天 ${hours} 小时 ${minutes} 分钟`;
}

function renderSweetness() {
  const latest = [...state.affection].sort((a, b) => b.date.localeCompare(a.date))[0];
  const score = latest ? Math.round((Number(latest.me) + Number(latest.her)) / 2) : 0;
  document.querySelector("#sweetnessScore").textContent = `${score}%`;
}

function renderNextAnniversary() {
  const next = state.anniversaries
    .map((item) => ({ ...item, nextDate: nextOccurrence(item.date) }))
    .sort((a, b) => a.nextDate - b.nextDate)[0];

  if (!next) return;

  const diff = Math.ceil((next.nextDate - new Date()) / 86400000);
  document.querySelector("#nextAnniversary").textContent = next.title;
  document.querySelector("#nextAnniversaryMeta").textContent =
    diff <= 0 ? "就是今天。" : `还有 ${diff} 天，日期 ${formatDate(next.nextDate.toISOString().slice(0, 10))}`;
}

function renderMemories() {
  const list = document.querySelector("#memoryList");
  list.innerHTML = "";

  [...state.memories]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((memory) => {
      const item = document.createElement("article");
      item.className = "timeline-item";
      item.innerHTML = `
        <div class="item-meta">
          <span>${formatDate(memory.date)}</span>
          <span class="pill">${memory.tag || "回忆"}</span>
        </div>
        <h3>${escapeHtml(memory.title)}</h3>
        <p>${escapeHtml(memory.body)}</p>
      `;
      list.appendChild(item);
    });
}

function renderAffection() {
  const chart = document.querySelector("#affectionChart");
  chart.innerHTML = "";

  [...state.affection]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-6)
    .forEach((record) => {
      const group = document.createElement("div");
      group.className = "bar-group";
      group.innerHTML = `
        <div class="bars">
          <div class="bar me" title="我：${record.me}" style="height:${record.me}%"></div>
          <div class="bar her" title="她：${record.her}" style="height:${record.her}%"></div>
        </div>
        <div class="bar-label">${record.date.slice(5)}</div>
      `;
      chart.appendChild(group);
    });
}

function renderWishes() {
  const board = document.querySelector("#wishBoard");
  const statuses = ["想做", "计划中", "已完成"];
  board.innerHTML = "";

  statuses.forEach((status) => {
    const column = document.createElement("section");
    const wishes = state.wishes.filter((wish) => wish.status === status);
    column.className = "wish-column";
    column.innerHTML = `<h3>${status}<span>${wishes.length}</span></h3>`;

    wishes.forEach((wish) => {
      const card = document.createElement("div");
      card.className = "wish-card";
      card.innerHTML = `
        <span>${escapeHtml(wish.title)}</span>
        <button type="button" aria-label="推进愿望状态">推进</button>
      `;
      card.querySelector("button").addEventListener("click", () => advanceWish(wish));
      column.appendChild(card);
    });

    board.appendChild(column);
  });
}

function renderAnniversaries() {
  const list = document.querySelector("#anniversaryList");
  list.innerHTML = "";

  state.anniversaries.forEach((item) => {
    const days = daysBetween(item.date);
    const card = document.createElement("article");
    card.className = "anniversary-card";
    card.innerHTML = `
      <span class="card-label">${formatDate(item.date)}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <strong>${days >= 0 ? `还有 ${days} 天` : `已经 ${Math.abs(days)} 天`}</strong>
      <p>${days >= 0 ? "靠近这一天的时候，可以提前准备一个小惊喜。" : "已经发生过的日子，也值得每年重新庆祝。"}</p>
    `;
    list.appendChild(card);
  });
}

function renderLetters() {
  const list = document.querySelector("#letterList");
  const today = new Date().toISOString().slice(0, 10);
  list.innerHTML = "";

  state.letters.forEach((letter) => {
    const canOpen = letter.openDate <= today;
    const item = document.createElement("article");
    item.className = `letter ${canOpen ? "" : "locked"}`;
    item.innerHTML = `
      <div class="item-meta">
        <span>${canOpen ? "已解锁" : "未到打开日期"}</span>
        <span class="pill">${formatDate(letter.openDate)}</span>
      </div>
      <h3>${escapeHtml(letter.title)}</h3>
      <p>${canOpen ? escapeHtml(letter.body) : "这封信会在设定日期之后显示内容。"}</p>
    `;
    list.appendChild(item);
  });
}

function advanceWish(wish) {
  const order = ["想做", "计划中", "已完成"];
  const currentIndex = order.indexOf(wish.status);
  wish.status = order[Math.min(currentIndex + 1, order.length - 1)];
  saveState();
  renderWishes();
}

function bindForms() {
  const today = new Date().toISOString().slice(0, 10);
  document.querySelectorAll('input[type="date"]').forEach((input) => {
    if (!input.value) input.value = today;
  });

  document.querySelector("#memoryForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.memories.push(data);
    saveState();
    event.currentTarget.reset();
    renderMemories();
  });

  const affectionForm = document.querySelector("#affectionForm");
  const meRange = affectionForm.elements.me;
  const herRange = affectionForm.elements.her;
  const syncOutputs = () => {
    document.querySelector("#meOutput").textContent = meRange.value;
    document.querySelector("#herOutput").textContent = herRange.value;
  };
  meRange.addEventListener("input", syncOutputs);
  herRange.addEventListener("input", syncOutputs);

  affectionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.affection.push({ ...data, me: Number(data.me), her: Number(data.her) });
    saveState();
    renderAffection();
    renderSweetness();
  });

  document.querySelector("#wishForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.wishes.push(data);
    saveState();
    event.currentTarget.reset();
    renderWishes();
  });

  document.querySelector("#letterForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.letters.push(data);
    saveState();
    event.currentTarget.reset();
    renderLetters();
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderAll() {
  renderTimeTogether();
  renderSweetness();
  renderNextAnniversary();
  renderMemories();
  renderAffection();
  renderWishes();
  renderAnniversaries();
  renderLetters();
}

bindForms();
renderAll();
setInterval(renderTimeTogether, 30000);
