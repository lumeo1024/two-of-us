const COUPLE_START_DATE = "2025-10-01T20:00:00+08:00";

const people = [
  { id: "me", name: "我", color: "#bd4f61", soft: "#fde7eb" },
  { id: "her", name: "她", color: "#4f8a7b", soft: "#e0f1ec" }
];

const seedData = {
  checkins: [
    {
      person: "me",
      date: "2026-06-07",
      mood: "想见面",
      energy: 84,
      note: "今天最开心的是想到周末可以一起吃饭。"
    },
    {
      person: "her",
      date: "2026-06-07",
      mood: "被惦记",
      energy: 88,
      note: "希望下次见面可以慢慢散步，不赶时间。"
    }
  ],
  affection: [
    { person: "me", date: "2026-06-01", spark: 92, comfort: 90, understood: 86 },
    { person: "her", date: "2026-06-01", spark: 90, comfort: 92, understood: 88 },
    { person: "me", date: "2026-06-07", spark: 95, comfort: 91, understood: 90 },
    { person: "her", date: "2026-06-07", spark: 93, comfort: 94, understood: 91 }
  ],
  memories: [
    {
      person: "me",
      title: "第一次认真计划未来",
      date: "2026-02-14",
      tag: "纪念",
      body: "把想去的城市、想吃的店、想看的电影都写了下来，突然觉得以后变得很具体。"
    },
    {
      person: "her",
      title: "雨后的散步",
      date: "2026-01-20",
      tag: "日常",
      body: "没有特别安排，只是走了很久。路灯、风和一句没说完的话，都很值得记住。"
    }
  ],
  wishes: [
    { title: "一起去海边看日出", owner: "both", status: "想做", nextStep: "先选一个周末" },
    { title: "拍一组正式合照", owner: "her", status: "计划中", nextStep: "她来挑风格，我来预约" },
    { title: "做一次双人晚餐", owner: "me", status: "已完成", nextStep: "下次换一道新菜" }
  ],
  anniversaries: [
    { title: "在一起纪念日", date: "2025-10-01" },
    { title: "第一次旅行", date: "2026-04-05" },
    { title: "她的生日", date: "2026-09-18" }
  ],
  letters: [
    {
      from: "me",
      to: "her",
      title: "给未来的我们",
      openDate: "2026-10-01",
      body: "希望那天打开的时候，我们还能因为这些小事笑出来。"
    },
    {
      from: "her",
      to: "me",
      title: "今天的夸奖",
      openDate: "2026-06-01",
      body: "谢谢你一直认真回应我的情绪，这件事我有感觉到。"
    }
  ]
};

const storageKey = "two-of-us-data-v2";
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

function personById(id) {
  return people.find((person) => person.id === id) || people[0];
}

function ownerLabel(owner) {
  if (owner === "both") return "两个人";
  return personById(owner).name;
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(`${dateString}T00:00:00`));
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

function renderParticipation() {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const recent = state.checkins.filter((item) => new Date(`${item.date}T00:00:00`) >= since);
  const uniquePeople = new Set(recent.map((item) => item.person));
  document.querySelector("#participationScore").textContent = `${uniquePeople.size} / ${people.length}`;
  document.querySelector("#participationMeta").textContent =
    recent.length > 0 ? `最近 7 天共有 ${recent.length} 条同步。` : "这一周还没有同步记录。";
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

function renderPeople() {
  const grid = document.querySelector("#personGrid");
  grid.innerHTML = "";

  people.forEach((person) => {
    const latestCheckin = [...state.checkins]
      .filter((item) => item.person === person.id)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    const latestAffection = [...state.affection]
      .filter((item) => item.person === person.id)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    const average = latestAffection
      ? Math.round((latestAffection.spark + latestAffection.comfort + latestAffection.understood) / 3)
      : 0;

    const card = document.createElement("article");
    card.className = "person-card";
    card.style.setProperty("--person-color", person.color);
    card.style.setProperty("--person-soft", person.soft);
    card.innerHTML = `
      <div class="person-top">
        <span class="avatar">${person.name.slice(0, 1)}</span>
        <div>
          <h3>${person.name}的今日状态</h3>
          <p>${latestCheckin ? formatDate(latestCheckin.date) : "还没有记录"}</p>
        </div>
      </div>
      <strong>${latestCheckin ? escapeHtml(latestCheckin.mood) : "等待出现"}</strong>
      <p>${latestCheckin ? escapeHtml(latestCheckin.note) : "今天还没有留下想说的话。"}</p>
      <div class="energy-row">
        <span>能量 ${latestCheckin ? latestCheckin.energy : 0}%</span>
        <span>好感 ${average}%</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderAffection() {
  const radar = document.querySelector("#affectionRadar");
  const legend = document.querySelector("#affectionLegend");
  radar.innerHTML = "";
  legend.innerHTML = "";

  const metrics = [
    ["spark", "心动"],
    ["comfort", "安心"],
    ["understood", "被理解"]
  ];

  people.forEach((person) => {
    const latest = [...state.affection]
      .filter((item) => item.person === person.id)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    metrics.forEach(([key, label]) => {
      const value = latest ? latest[key] : 0;
      const item = document.createElement("div");
      item.className = "radar-item";
      item.innerHTML = `
        <div class="radar-label">
          <span>${person.name} · ${label}</span>
          <strong>${value}</strong>
        </div>
        <div class="meter"><span style="width:${value}%; background:${person.color}"></span></div>
      `;
      radar.appendChild(item);
    });

    const badge = document.createElement("span");
    badge.innerHTML = `<i style="background:${person.color}"></i>${person.name}`;
    legend.appendChild(badge);
  });

  const latestScores = people
    .map((person) =>
      [...state.affection].filter((item) => item.person === person.id).sort((a, b) => b.date.localeCompare(a.date))[0]
    )
    .filter(Boolean);
  const average =
    latestScores.length === 0
      ? 0
      : Math.round(
          latestScores.reduce((sum, item) => sum + item.spark + item.comfort + item.understood, 0) /
            (latestScores.length * 3)
        );
  document.querySelector("#affectionSummary").textContent = `当前共同温度 ${average}%`;
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
        <div>
          <strong>${escapeHtml(wish.title)}</strong>
          <p>负责人：${ownerLabel(wish.owner)} · 下一步：${escapeHtml(wish.nextStep || "待补充")}</p>
        </div>
        <button type="button" aria-label="推进愿望状态">推进</button>
      `;
      card.querySelector("button").addEventListener("click", () => advanceWish(wish));
      column.appendChild(card);
    });

    board.appendChild(column);
  });
}

function renderMemories() {
  const list = document.querySelector("#memoryList");
  list.innerHTML = "";

  [...state.memories]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((memory) => {
      const person = personById(memory.person);
      const item = document.createElement("article");
      item.className = "timeline-item";
      item.style.setProperty("--person-color", person.color);
      item.innerHTML = `
        <div class="item-meta">
          <span>${formatDate(memory.date)}</span>
          <span class="pill">${person.name}记录</span>
          <span class="pill">${escapeHtml(memory.tag || "回忆")}</span>
        </div>
        <h3>${escapeHtml(memory.title)}</h3>
        <p>${escapeHtml(memory.body)}</p>
      `;
      list.appendChild(item);
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
        <span>${personById(letter.from).name} 写给 ${personById(letter.to).name}</span>
        <span class="pill">${canOpen ? "已解锁" : "未到日期"} · ${formatDate(letter.openDate)}</span>
      </div>
      <h3>${escapeHtml(letter.title)}</h3>
      <p>${canOpen ? escapeHtml(letter.body) : "这封留言会在设定日期之后显示内容。"}</p>
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

function populatePersonSelects() {
  const simpleOptions = people.map((person) => `<option value="${person.id}">${person.name}</option>`).join("");
  const ownerOptions = `<option value="both">两个人一起</option>${simpleOptions}`;

  ["#personSelect", "#affectionPersonSelect", "#memoryPersonSelect", "#letterFromSelect", "#letterToSelect"].forEach(
    (selector) => {
      document.querySelector(selector).innerHTML = simpleOptions;
    }
  );
  document.querySelector("#wishOwnerSelect").innerHTML = ownerOptions;
  document.querySelector("#letterToSelect").value = people[1]?.id || people[0].id;
}

function bindForms() {
  const today = new Date().toISOString().slice(0, 10);
  document.querySelectorAll('input[type="date"]').forEach((input) => {
    if (!input.value) input.value = today;
  });

  const energyRange = document.querySelector('#checkinForm input[name="energy"]');
  energyRange.addEventListener("input", () => {
    document.querySelector("#energyOutput").textContent = energyRange.value;
  });

  document.querySelector("#checkinForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.checkins.push({ ...data, energy: Number(data.energy) });
    saveState();
    event.currentTarget.reset();
    setDefaultDates();
    renderPeople();
    renderParticipation();
  });

  const affectionForm = document.querySelector("#affectionForm");
  ["spark", "comfort", "understood"].forEach((name) => {
    const range = affectionForm.elements[name];
    range.addEventListener("input", () => {
      document.querySelector(`#${name}Output`).textContent = range.value;
    });
  });

  affectionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.affection.push({
      ...data,
      spark: Number(data.spark),
      comfort: Number(data.comfort),
      understood: Number(data.understood)
    });
    saveState();
    renderAffection();
    renderPeople();
  });

  document.querySelector("#wishForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.wishes.push(data);
    saveState();
    event.currentTarget.reset();
    renderWishes();
  });

  document.querySelector("#memoryForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.memories.push(data);
    saveState();
    event.currentTarget.reset();
    setDefaultDates();
    renderMemories();
  });

  document.querySelector("#letterForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.letters.push(data);
    saveState();
    event.currentTarget.reset();
    setDefaultDates();
    renderLetters();
  });
}

function setDefaultDates() {
  const today = new Date().toISOString().slice(0, 10);
  document.querySelectorAll('input[type="date"]').forEach((input) => {
    if (!input.value) input.value = today;
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
  renderParticipation();
  renderNextAnniversary();
  renderPeople();
  renderAffection();
  renderWishes();
  renderMemories();
  renderLetters();
}

populatePersonSelects();
bindForms();
renderAll();
setInterval(renderTimeTogether, 30000);
