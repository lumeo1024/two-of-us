const COUPLE_START_DATE = "2026-06-08T14:59:00+08:00";
const SUPABASE_URL = "https://kdmwfcpzbqpxmdudswuf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YvmO4rjd55nVj-zrtP4Bcw_SdSM0OdM";
const REMOTE_STATE_ID = "main";
const REMOTE_TABLE = "two_of_us_state";

const basePeople = [
  { id: "me", color: "#bd4f61", soft: "#fde7eb" },
  { id: "her", color: "#4f8a7b", soft: "#e0f1ec" }
];

const seedData = {
  profiles: {
    me: "第一个人",
    her: "第二个人"
  },
  checkins: [],
  memories: [],
  wishes: [],
  anniversaries: [{ title: "在一起纪念日", date: "2026-06-08" }],
  letters: [],
  photos: []
};

const storageKey = "two-of-us-data-v4";
const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

let state = structuredClone(seedData);
let lastRemoteUpdatedAt = "";
let remoteAvailable = false;
let saveQueue = Promise.resolve();

function normalizeState(value) {
  return {
    ...structuredClone(seedData),
    ...(value || {}),
    profiles: { ...seedData.profiles, ...(value?.profiles || {}) },
    anniversaries: value?.anniversaries?.length ? value.anniversaries : seedData.anniversaries,
    checkins: Array.isArray(value?.checkins) ? value.checkins : [],
    memories: Array.isArray(value?.memories) ? value.memories : [],
    wishes: Array.isArray(value?.wishes) ? value.wishes : [],
    letters: Array.isArray(value?.letters) ? value.letters : [],
    photos: Array.isArray(value?.photos) ? value.photos : []
  };
}

function loadLocalState() {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return structuredClone(seedData);

  try {
    return normalizeState(JSON.parse(stored));
  } catch {
    return structuredClone(seedData);
  }
}

function saveLocalState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

async function loadRemoteState() {
  if (!supabaseClient) return null;

  const { data, error } = await supabaseClient
    .from(REMOTE_TABLE)
    .select("data, updated_at")
    .eq("id", REMOTE_STATE_ID)
    .maybeSingle();

  if (error) {
    console.warn("Supabase 读取失败，当前使用本地数据。请确认已执行 supabase-setup.sql。", error);
    remoteAvailable = false;
    updateSyncStatus("Supabase 未连接，当前为本地暂存");
    return null;
  }

  remoteAvailable = true;
  updateSyncStatus("Supabase 已连接，数据会自动同步");

  if (!data) {
    await saveRemoteState();
    return null;
  }

  lastRemoteUpdatedAt = data.updated_at || "";
  return normalizeState(data.data);
}

function saveState() {
  saveLocalState();
  if (!supabaseClient || !remoteAvailable) return;

  saveQueue = saveQueue
    .then(() => saveRemoteState())
    .catch((error) => {
      console.warn("Supabase 保存失败，数据已暂存在本地。", error);
      remoteAvailable = false;
      updateSyncStatus("Supabase 保存失败，当前为本地暂存");
    });
}

async function saveRemoteState() {
  const updatedAt = new Date().toISOString();
  const { error } = await supabaseClient.from(REMOTE_TABLE).upsert({
    id: REMOTE_STATE_ID,
    data: state,
    updated_at: updatedAt
  });

  if (error) throw error;
  lastRemoteUpdatedAt = updatedAt;
  updateSyncStatus("已同步到 Supabase");
}

async function refreshRemoteState() {
  if (!supabaseClient || !remoteAvailable) return;

  const { data, error } = await supabaseClient
    .from(REMOTE_TABLE)
    .select("data, updated_at")
    .eq("id", REMOTE_STATE_ID)
    .maybeSingle();

  if (error || !data?.updated_at || data.updated_at <= lastRemoteUpdatedAt) return;

  lastRemoteUpdatedAt = data.updated_at;
  state = normalizeState(data.data);
  saveLocalState();
  syncProfileForm();
  populatePersonSelects();
  renderAll();
}

function subscribeToRemoteState() {
  if (!supabaseClient || !remoteAvailable) return;

  supabaseClient
    .channel("two-of-us-state")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: REMOTE_TABLE, filter: `id=eq.${REMOTE_STATE_ID}` },
      (payload) => {
        if (!payload.new?.data || !payload.new?.updated_at || payload.new.updated_at <= lastRemoteUpdatedAt) return;
        lastRemoteUpdatedAt = payload.new.updated_at;
        state = normalizeState(payload.new.data);
        saveLocalState();
        syncProfileForm();
        populatePersonSelects();
        renderAll();
      }
    )
    .subscribe();
}

function updateSyncStatus(message) {
  const status = document.querySelector("#syncStatus");
  if (status) status.textContent = message;
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
    const latestCheckin = [...state.checkins].filter((item) => item.person === person.id).sort(latestFirst)[0];

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
    ["#personSelect", "#memoryPersonSelect", "#letterFromSelect", "#letterToSelect", "#wishOwnerSelect"].map(
      (selector) => {
        const element = document.querySelector(selector);
        return [selector, element?.value];
      }
    )
  );
  const simpleOptions = people.map((person) => `<option value="${person.id}">${person.name}</option>`).join("");
  const ownerOptions = `<option value="both">一起负责</option>${simpleOptions}`;

  ["#personSelect", "#memoryPersonSelect", "#letterFromSelect", "#letterToSelect"].forEach((selector) => {
    const select = document.querySelector(selector);
    select.innerHTML = simpleOptions;
    if (previousValues.get(selector)) select.value = previousValues.get(selector);
  });
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
  setDefaultDates();

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

async function initApp() {
  state = loadLocalState();

  const remoteState = await loadRemoteState();
  if (remoteState) {
    state = remoteState;
    saveLocalState();
  }

  syncProfileForm();
  populatePersonSelects();
  bindForms();
  renderAll();
  subscribeToRemoteState();

  setInterval(renderTimeTogether, 30000);
  setInterval(refreshRemoteState, 8000);
}

initApp();
