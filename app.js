const COUPLE_START_DATE = "2025-10-01T20:00:00+08:00";

const basePeople = [
  { id: "me", color: "#bd4f61", soft: "#fde7eb" },
  { id: "her", color: "#4f8a7b", soft: "#e0f1ec" }
];

const seedData = {
  profiles: {
    me: "Lumeo",
    her: "小朋友"
  },
  checkins: [
    {
      person: "me",
      date: "2026-06-07",
      mood: "想见面",
      energy: 84,
      updatedAt: "2026-06-07T20:00:00+08:00",
      note: "今天最开心的是想到周末可以一起吃饭。"
    },
    {
      person: "her",
      date: "2026-06-07",
      mood: "被惦记",
      energy: 88,
      updatedAt: "2026-06-07T20:05:00+08:00",
      note: "希望下次见面可以慢慢散步，不赶时间。"
    }
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
    { title: "拍一组正式合照", owner: "her", status: "计划中", nextStep: "先一起挑拍摄风格" },
    { title: "做一次双人晚餐", owner: "me", status: "已完成", nextStep: "下次换一道新菜" }
  ],
  anniversaries: [
    { title: "在一起纪念日", date: "2025-10-01" },
    { title: "第一次旅行", date: "2026-04-05" },
    { title: "爱人的生日", date: "2026-09-18" }
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
      body: "谢谢你一直认真回应情绪，这件事真的会被感觉到。"
    }
  ],
  photos: [
    {
      id: "seed-photo-1",
      title: "第一张照片",
      caption: "可以从这里开始慢慢补上你们真正的照片。",
      src: "./assets/hero-memory-journal.png",
      createdAt: "2026-06-09T00:00:00+08:00"
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

function getPeople() {
  return basePeople.map((person) => ({
    ...person,
    name: state.profiles?.[person.id] || seedData.profiles[person.id]
  }));
}

function personById(id) {
  const people = getPeople();
  return people.find((person) => person.id === id) || people[0];
}

function ownerLabel(owner) {
  if (owner === "both") return "一起";
  return personById(owner).name;
}

function latestFirst(a, b) {
  const dateCompare = b.date.localeCompare(a.date);
  if (dateCompare !== 0) return dateCompare;
  return (b.updatedAt || "").localeCompare(a.updatedAt || "");
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
  const people = getPeople();
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
  const people = getPeople();
  const grid = document.querySelector("#personGrid");
  grid.innerHTML = "";

  people.forEach((person) => {
    const latestCheckin = [...state.checkins]
      .filter((item) => item.person === person.id)
      .sort(latestFirst)[0];

    const card = document.createElement("article");
    card.className = "person-card";
    card.style.setProperty("--person-color", person.color);
    card.style.setProperty("--person-soft", person.soft);
    card.innerHTML = `
      <div class="person-top">
        <span class="avatar">${person.name.slice(0, 1)}</span>
        <div>
          <h3>${escapeHtml(person.name)}</h3>
          <p>${latestCheckin ? formatDate(latestCheckin.date) : "还没有记录"}</p>
        </div>
      </div>
      <strong>${latestCheckin ? escapeHtml(latestCheckin.mood) : "等待出现"}</strong>
      <p class="editable-note">${latestCheckin ? escapeHtml(latestCheckin.note) : "今天还没有留下想说的话。"}</p>
      <div class="energy-row">
        <span>能量 ${latestCheckin ? latestCheckin.energy : 0}%</span>
      </div>
    `;
    grid.appendChild(card);
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
        <div>
          <strong>${escapeHtml(wish.title)}</strong>
          <p>负责人：${ownerLabel(wish.owner)} · 备注：${escapeHtml(wish.nextStep || "待补充")}</p>
        </div>
        <button class="small-button" type="button" aria-label="推进愿望状态">推进</button>
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

function renderPhotos() {
  const wall = document.querySelector("#photoWall");
  wall.innerHTML = "";

  [...state.photos]
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .forEach((photo) => {
      const card = document.createElement("figure");
      card.className = "photo-card";
      card.innerHTML = `
        <img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.title || "照片墙照片")}" />
        <figcaption>
          <strong>${escapeHtml(photo.title || "未命名照片")}</strong>
          <span>${escapeHtml(photo.caption || "没有备注")}</span>
        </figcaption>
        <button class="small-button photo-delete" type="button" aria-label="删除照片">删除</button>
      `;
      card.querySelector("button").addEventListener("click", () => deletePhoto(photo.id));
      wall.appendChild(card);
    });
}

function advanceWish(wish) {
  const order = ["想做", "计划中", "已完成"];
  const currentIndex = order.indexOf(wish.status);
  wish.status = order[Math.min(currentIndex + 1, order.length - 1)];
  saveState();
  renderWishes();
}

function deletePhoto(id) {
  state.photos = state.photos.filter((photo) => photo.id !== id);
  saveState();
  renderPhotos();
}

function populatePersonSelects() {
  const people = getPeople();
  const previousValues = new Map(
    ["#personSelect", "#memoryPersonSelect", "#letterFromSelect", "#letterToSelect", "#wishOwnerSelect"]
      .map((selector) => {
        const element = document.querySelector(selector);
        return [selector, element?.value];
      })
  );
  const simpleOptions = people.map((person) => `<option value="${person.id}">${person.name}</option>`).join("");
  const ownerOptions = `<option value="both">一起负责</option>${simpleOptions}`;

  ["#personSelect", "#memoryPersonSelect", "#letterFromSelect", "#letterToSelect"].forEach(
    (selector) => {
      const select = document.querySelector(selector);
      select.innerHTML = simpleOptions;
      if (previousValues.get(selector)) select.value = previousValues.get(selector);
    }
  );
  const wishOwnerSelect = document.querySelector("#wishOwnerSelect");
  wishOwnerSelect.innerHTML = ownerOptions;
  if (previousValues.get("#wishOwnerSelect")) wishOwnerSelect.value = previousValues.get("#wishOwnerSelect");
  if (!previousValues.get("#letterToSelect")) {
    document.querySelector("#letterToSelect").value = people[1]?.id || people[0].id;
  }
}

function syncProfileForm() {
  const profileForm = document.querySelector("#profileForm");
  profileForm.elements.meName.value = state.profiles?.me || seedData.profiles.me;
  profileForm.elements.herName.value = state.profiles?.her || seedData.profiles.her;
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

  document.querySelector("#profileForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.profiles = {
      me: data.meName.trim() || seedData.profiles.me,
      her: data.herName.trim() || seedData.profiles.her
    };
    saveState();
    populatePersonSelects();
    renderAll();
  });

  document.querySelector("#checkinForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const nextCheckin = { ...data, energy: Number(data.energy), updatedAt: new Date().toISOString() };
    const existingIndex = state.checkins.findIndex((item) => item.person === data.person && item.date === data.date);
    if (existingIndex >= 0) {
      state.checkins[existingIndex] = nextCheckin;
    } else {
      state.checkins.push(nextCheckin);
    }
    saveState();
    event.currentTarget.reset();
    setDefaultDates();
    populatePersonSelects();
    renderAll();
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

  document.querySelector("#photoForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const file = form.elements.photo.files[0];
    if (!file) return;

    const src = await fileToCompressedDataUrl(file);
    state.photos.push({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title: data.title.trim() || "未命名照片",
      caption: data.caption.trim(),
      src,
      createdAt: new Date().toISOString()
    });
    saveState();
    form.reset();
    renderPhotos();
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

function fileToCompressedDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("照片读取失败"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("照片加载失败"));
      image.onload = () => {
        const maxSize = 1400;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderAll() {
  renderTimeTogether();
  renderParticipation();
  renderNextAnniversary();
  renderPeople();
  renderWishes();
  renderMemories();
  renderLetters();
  renderPhotos();
}

syncProfileForm();
populatePersonSelects();
bindForms();
renderAll();
setInterval(renderTimeTogether, 30000);
