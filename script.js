const API_URL = 'https://script.google.com/macros/s/AKfycbzIyBeXAVeSLtxW8jR9OnQL_Iz6cawGiaZSlkoZ2hTYy5dwo-0n_GH6F15H7tfXojIl/exec';
  (data.players || []).forEach(player => tbody.appendChild(buildAdminRow(player)));
  adminLoaded = true;
  adminDirty = false;
  updateUnsavedIndicator();
  updatePlayerCount();
}

function buildAdminRow(player = {}) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td contenteditable="true">${escapeHtml(player.name || '')}</td>
    <td contenteditable="true">${Number(player.skill) || 0}</td>
    <td><button class="admin-inline-btn remove">Remove</button></td>
    <td><button class="admin-inline-btn reset-pin">RESET PIN</button></td>
    <td>${escapeHtml(player.pinStatus || 'NOT CREATED')}</td>
  `;

  row.querySelector('.remove').addEventListener('click', () => {
    row.remove();
    markAdminDirty();
    updatePlayerCount();
  });

  row.querySelector('.reset-pin').addEventListener('click', async () => {
    const name = row.cells[0].innerText.trim();
    if (!name) {
      alert('Player name is required first.');
      return;
    }
    const password = prompt('Enter Admin Password');
    if (!password) return;

    const data = await api({ action: 'resetPlayerPin', playerName: name, password });
    if (!data.ok) {
      alert(data.error || 'Could not reset PIN.');
      return;
    }

    row.cells[4].innerText = 'NOT CREATED';
    alert(data.message || 'PIN reset.');
  });

  row.cells[0].addEventListener('input', markAdminDirty);
  row.cells[1].addEventListener('input', markAdminDirty);
  return row;
}

function addAdminPlayerRow() {
  const tbody = document.querySelector('#adminTable tbody');
  tbody.appendChild(buildAdminRow({ name: '', skill: 0, pinStatus: 'NOT CREATED' }));
  markAdminDirty();
  updatePlayerCount();
}

function updatePlayerCount() {
  const rows = document.querySelectorAll('#adminTable tbody tr').length;
  document.getElementById('playerCount').textContent = `Players: ${rows}`;
}

function markAdminDirty() {
  adminDirty = true;
  updateUnsavedIndicator();
}

function updateUnsavedIndicator() {
  document.getElementById('unsavedIndicator').style.display = adminDirty ? 'inline-block' : 'none';
}

async function saveAdminPlayers() {
  const password = prompt('Enter Admin Password');
  if (!password) return;

  const players = Array.from(document.querySelectorAll('#adminTable tbody tr')).map(row => ({
    name: row.cells[0].innerText.trim(),
    skill: Number(row.cells[1].innerText.trim()) || 0,
    pin: row.cells[4].innerText.trim() === 'ACTIVE' ? '' : '',
    active: true
  })).filter(p => p.name);

  const data = await api({ action: 'savePlayersAdmin', password, players });
  if (!data.ok) {
    alert(data.error || 'Could not save players.');
    return;
  }

  alert(data.message || 'Players saved successfully.');
  adminDirty = false;
  updateUnsavedIndicator();
  adminLoaded = false;
  await loadAdminPlayers();
  await loadInitialData();
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}/${date.getFullYear()}, ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function pad2(num) {
  return String(num).padStart(2, '0');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
