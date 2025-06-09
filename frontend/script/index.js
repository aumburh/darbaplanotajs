/*
  Author: Rainers
  Enhanced Final Version by ChatGPT
  Last Updated: 2025-06-09
*/

let allCalendars = [];
let editingCalendarId = null;
let sharingCalendar = null;
let user = null;
let currentFilter = 'mine'; // Default filter


async function ensureAuthenticated() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return null;
  }
  const res = await fetch('/api/auth/me', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (res.ok) return await res.json();
  localStorage.removeItem('token');
  window.location.href = '/login';
  return null;
}

function setFilter(filter) {
  currentFilter = filter;
  createFilterButtons();
  renderCalendarList();
}

function createFilterButtons() {
  const container = document.getElementById('filterContainer');
  if (!container) return;
  container.innerHTML = '';

  const filters = [
    { id: 'mine', label: 'Personīgie' },
    { id: 'shared', label: 'Koplietotie' },
    { id: 'all', label: 'Visi' }
  ];

  filters.forEach(({ id, label }) => {
    const isActive = currentFilter === id;
    const btn = document.createElement('button');
    btn.textContent = label;
      btn.className = `
        w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition
        ${isActive 
          ? 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-100 font-semibold border-l-4 border-primary-500 pl-3'
          : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300'}
      `.trim();
    btn.addEventListener('click', () => setFilter(id));
    container.appendChild(btn);
  });
}

function showConfirmationModal({ title, message, onConfirm }) {
  const modal = document.getElementById('confirmationModal');
  const titleEl = document.getElementById('confirmTitle');
  const messageEl = document.getElementById('confirmMessage');
  const cancelBtn = document.getElementById('confirmCancel');
  const acceptBtn = document.getElementById('confirmAccept');

  titleEl.textContent = title;
  messageEl.textContent = message;

  modal.classList.remove('hidden');

  const cleanup = () => {
    modal.classList.add('hidden');
    acceptBtn.removeEventListener('click', handleAccept);
    cancelBtn.removeEventListener('click', handleCancel);
  };

  const handleAccept = () => {
    cleanup();
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => cleanup();

  acceptBtn.addEventListener('click', handleAccept);
  cancelBtn.addEventListener('click', handleCancel);
}

function renderSharedUsers(users, searchTerm = '', list, currentUserId, calendar) {
  list.innerHTML = '';

  users
    .filter(entry => {
      const sharedUser = entry.user;
      const display = sharedUser.email || sharedUser.username || '';
      return display.toLowerCase().includes(searchTerm);
    })
    .forEach(entry => {
      const sharedUser = entry.user;
      const permissions = entry.permissions || {};
      const isSelf = sharedUser._id === currentUserId;

      const wrapper = document.createElement('div');
      wrapper.className = 'flex flex-col gap-3 p-4 mb-4 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 shadow-sm';

      wrapper.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <div class="font-medium text-surface-800 dark:text-white text-sm">${sharedUser.email || sharedUser.username}</div>
          ${isSelf ? '' : `<button data-user="${sharedUser._id}" class="remove-user-btn text-red-600 hover:text-red-800"><i class="fas fa-trash"></i></button>`}
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          ${Object.entries(permissions).map(([key, val]) => {
            const id = `perm_${sharedUser._id}_${key}`;
            return `
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" id="${id}" class="peer hidden perm-checkbox" data-user="${sharedUser._id}" data-perm="${key}" ${val ? 'checked' : ''} ${isSelf ? 'disabled' : ''}>
                <div class="w-5 h-5 border-2 border-gray-300 rounded-md flex items-center justify-center peer-checked:bg-primary-500 peer-checked:border-primary-500 transition">
                  <i class="fas fa-check text-white text-xs hidden peer-checked:inline-block"></i>
                </div>
                <span class="text-sm text-gray-700 dark:text-gray-300">${key}</span>
              </label>
            `;
          }).join('')}
        </div>
      `;

      list.appendChild(wrapper);
    });

  // Set up permission update handlers
  list.querySelectorAll('.perm-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', async () => {
      const userId = checkbox.dataset.user;
      const identifier = users.find(sw => sw.user._id === userId)?.user.email || userId;
      const updated = {};
      list.querySelectorAll(`input[data-user='${userId}']`).forEach(cb => {
        updated[cb.dataset.perm] = cb.checked;
      });
      await fetch(`/api/kalendars/${calendar._id}/share`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ identifier, permissions: updated })
      });
    });
  });

  // Set up remove button handlers
  list.querySelectorAll('.remove-user-btn').forEach(btn => {
btn.addEventListener('click', async () => {
  const identifier = users.find(sw => sw.user._id === btn.dataset.user)?.user.email;
  if (!identifier) return;
  showConfirmationModal({
    title: 'Noņemt lietotāju?',
    message: `Vai tiešām vēlaties noņemt "${identifier}" no šī kalendāra?`,
    onConfirm: async () => {
      await fetch(`/api/kalendars/${calendar._id}/share`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ identifier })
      });
      await loadSharedUsers(calendar._id);
    }
  });
  await loadSharedUsers(calendar._id); // Refresh after removal
});
  });
}


function renderCalendarList() {
  const calendarList = document.getElementById('calendarList');
  if (!calendarList) return;
  calendarList.innerHTML = '';
  let filtered = [...allCalendars];
  if (currentFilter === 'mine') {
    filtered = filtered.filter(c => c.owner === user._id);
  } else if (currentFilter === 'shared') {
    filtered = filtered.filter(c => c.sharedWith?.some(sw => sw.user === user._id));
  }
  const searchBar = document.getElementById('searchBar');
  const sortCalendars = document.getElementById('sortCalendars');
  if (searchBar?.value.trim()) {
    const term = searchBar.value.toLowerCase();
    filtered = filtered.filter(c => c.name.toLowerCase().includes(term));
  }
  switch (sortCalendars?.value) {
    case 'newest': filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
    case 'oldest': filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
    case 'name': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
  }
  if (filtered.length === 0) {
    calendarList.innerHTML = '<p class="text-surface-500">Nav atrastu kalendāru</p>';
  } else {
    filtered.forEach(c => calendarList.appendChild(renderCalendar(c)));
  }
}

function formatEventLabel(count) {
  if (count > 9) return '9+ notikumi';
  if (count === 0) return '0 notikumu';
  if (count === 1) return '1 notikums';
  if (count >= 2 && count <= 9) return `${count} notikumi`;
}

function renderCalendar(calendar) {

const eventCount = calendar.eventCount || 0;
const label = formatEventLabel(eventCount);

  const el = document.createElement('div');
  
  el.className = 'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-5 py-4 transition hover:shadow-sm flex flex-col gap-2';
  el.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 rounded-full" style="background-color: ${calendar.color}"></div>
        <h3 class="text-base font-medium text-surface-900 dark:text-surface-100 cursor-pointer hover:underline calendar-name">${calendar.name}</h3>
      </div>
      <div class="relative">
        <button class="action-toggle w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-surface-700 text-surface-500 hover:text-primary-500">
          <i class="fas fa-ellipsis-v"></i>
        </button>
        <div class="absolute right-0 mt-2 hidden bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-lg shadow-md z-10 action-menu min-w-[140px]">
          <button class="block w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-surface-700 text-sm edit-btn">Rediģēt</button>
          <button class="block w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-surface-700 text-sm delete-btn">Dzēst</button>
          <button class="block w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-surface-700 text-sm share-btn">Dalīties</button>
        </div>
      </div>
    </div>
    <p class="text-sm text-gray-500 dark:text-gray-400 pl-6">${label}</p>
  `;
  const toggleBtn = el.querySelector('.action-toggle');
  const actionMenu = el.querySelector('.action-menu');
  const nameLink = el.querySelector('.calendar-name');

toggleBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.querySelectorAll('.action-menu').forEach(menu => {
    if (menu !== actionMenu) menu.classList.add('hidden');
  });
  actionMenu?.classList.toggle('hidden');
});

  document.addEventListener('click', (e) => {
    if (!el.contains(e.target)) actionMenu?.classList.add('hidden');
  });

el.querySelector('.edit-btn')?.addEventListener('click', () => {
  editingCalendarId = calendar._id;
  document.getElementById('editCalendarName').value = calendar.name;
  document.getElementById('editCalendarColor').value = calendar.color;
  document.getElementById('editModalCalendarName').textContent = `"${calendar.name}"`;
  updateColorButtons('.edit-color-btn', document.getElementById('editCalendarColor'));
  toggleModal(document.getElementById('editCalendarModal'), true);
});

  el.querySelector('.delete-btn')?.addEventListener('click', async () => {
showConfirmationModal({
  title: 'Dzēst kalendāru?',
  message: `Vai tiešām vēlaties dzēst "${calendar.name}"?`,
  onConfirm: async () => {
    const res = await fetch(`/api/kalendars/${calendar._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    if (res.ok) fetchCalendars();
    else alert('Dzēšana neizdevās.');
  }
});
  });

el.querySelector('.share-btn')?.addEventListener('click', () => {
  sharingCalendar = calendar._id;
  toggleModal(document.getElementById('shareCalendarModal'), true);
  document.getElementById('shareModalCalendarName').textContent = `"${calendar.name}"`;
  loadSharedUsers(calendar._id);
});


  nameLink?.addEventListener('click', () => {
    window.location.href = `/kalendars/${calendar._id}`;
  });

  return el;
}

async function loadSharedUsers(calendarId) {
  const res = await fetch(`/api/kalendars/${calendarId}`, {
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
  });
  if (!res.ok) return;

  const calendar = await res.json();
  const list = document.getElementById('sharedUsersList');
  const currentUserId = user._id;
  const searchInput = document.getElementById('sharedUsersSearch');

  if (!list || !searchInput) return;

  // Render all users first
  renderSharedUsers(calendar.sharedWith, '', list, currentUserId, calendar);

  // Clone search input to reset old listeners
  const newSearch = searchInput.cloneNode(true);
  searchInput.replaceWith(newSearch);

  newSearch.addEventListener('input', () => {
    const term = newSearch.value.trim().toLowerCase();
    renderSharedUsers(calendar.sharedWith, term, list, currentUserId, calendar);

let pendingRemoveUserId = null;
let pendingRemoveIdentifier = null;
let pendingRemoveCalendarId = null;

list.querySelectorAll('.remove-user-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const userId = btn.dataset.user;
    const sharedEntry = calendar.sharedWith.find(sw => sw.user._id === userId);
    if (!sharedEntry) return;

    const identifier = sharedEntry.user.email || sharedEntry.user.username;
    if (!identifier) return;

    showConfirmationModal({
      title: 'Noņemt lietotāju?',
      message: `Vai tiešām vēlaties noņemt "${identifier}" no šī kalendāra?`,
      onConfirm: async () => {
        await fetch(`/api/kalendars/${calendar._id}/share`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          },
          body: JSON.stringify({ identifier })
        });
        await loadSharedUsers(calendar._id);
        await fetchCalendars();
      }
    });
  });
});
  });
}




function updateColorButtons(selector, hiddenInput) {
  document.querySelectorAll(selector).forEach(btn => {
    btn.classList.remove('ring-2', 'ring-primary-500');
    if (btn.dataset.color === hiddenInput.value) {
      btn.classList.add('ring-2', 'ring-primary-500');
    }
    btn.addEventListener('click', () => {
      hiddenInput.value = btn.dataset.color;
      updateColorButtons(selector, hiddenInput);
    });
  });
}

function toggleModal(modal, show) {
  if (!modal) return;
  const panel = modal.querySelector('.transform');
  if (show) {
    modal.classList.remove('hidden');
    setTimeout(() => {
      panel?.classList.remove('translate-x-full');
    }, 10);
    document.body.style.overflow = 'hidden';
  } else {
    panel?.classList.add('translate-x-full');
    setTimeout(() => {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }, 300);
  }
}



function setupFilterHandlers() {
  document.getElementById('searchBar')?.addEventListener('input', renderCalendarList);
  document.getElementById('sortCalendars')?.addEventListener('change', renderCalendarList);
}

async function fetchCalendars() {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/kalendars', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  if (res.ok) {
    allCalendars = await res.json();
    createFilterButtons();
    renderCalendarList();
  }
}

function setupCalendarCreation() {
  const saveBtn = document.getElementById('saveCalendar');
  const cancelBtn = document.getElementById('cancelCreate');
  const nameInput = document.getElementById('calendarName');
  const colorInput = document.getElementById('calendarColor');

  updateColorButtons('.color-btn', colorInput);

  cancelBtn?.addEventListener('click', () => toggleModal(document.getElementById('calendarModal'), false));

  saveBtn?.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const color = colorInput.value;
    if (!name) return alert('Lūdzu ievadiet kalendāra nosaukumu.');
    const res = await fetch('/api/kalendars', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ name, color })
    });
    if (res.ok) {
      toggleModal(document.getElementById('calendarModal'), false);
      await fetchCalendars();
      nameInput.value = '';
      colorInput.value = '#3b82f6';
      updateColorButtons('.color-btn', colorInput);
    } else {
      alert('Neizdevās izveidot kalendāru.');
    }
  });
}

function setupCalendarEditing() {
  const saveEditBtn = document.getElementById('saveEditCalendar');
  const cancelEditBtn = document.getElementById('cancelEdit');
  const nameInput = document.getElementById('editCalendarName');
  const colorInput = document.getElementById('editCalendarColor');

  updateColorButtons('.edit-color-btn', colorInput);

  cancelEditBtn?.addEventListener('click', () => toggleModal(document.getElementById('editCalendarModal'), false));

  saveEditBtn?.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const color = colorInput.value;
    if (!name || !editingCalendarId) return;
    const res = await fetch(`/api/kalendars/${editingCalendarId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ name, color })
    });
    if (res.ok) {
      toggleModal(document.getElementById('editCalendarModal'), false);
      await fetchCalendars();
    } else {
      alert('Neizdevās saglabāt izmaiņas.');
    }
  });
}

function setupCalendarSharing() {
  const shareEmail = document.getElementById('shareEmail');
  const shareBtn = document.getElementById('addShareUser');
  const errorDisplay = document.getElementById('shareError');

  shareBtn?.addEventListener('click', async () => {
    const identifier = shareEmail.value.trim();
    if (!identifier || !sharingCalendar) return;

    // ✅ Collect checked permission values
    const permissions = {
      edit: document.getElementById('permEdit').checked,
      delete: document.getElementById('permDelete').checked,
      rename: document.getElementById('permRename').checked,
      addEvent: document.getElementById('permAddEvent').checked,
      deleteEvent: document.getElementById('permDeleteEvent').checked,
      editEvent: document.getElementById('permEditEvent').checked,
    };

    // ✅ Send identifier and permissions to backend
    const res = await fetch(`/api/kalendars/${sharingCalendar}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ identifier, permissions })
    });

    if (res.ok) {
      shareEmail.value = '';
      errorDisplay.classList.add('hidden');
      await loadSharedUsers(sharingCalendar);
      await fetchCalendars();
    } else {
      const { error } = await res.json();
      errorDisplay.textContent = error || 'Neizdevās pievienot lietotāju.';
      errorDisplay.classList.remove('hidden');
    }
  });
}


function setupUIHandlers() {
  // Logout
  document.getElementById('logoutButton')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  });

  // Open "Add Calendar" modal
  document.getElementById('addCalendar')?.addEventListener('click', () => {
    toggleModal(document.getElementById('calendarModal'), true);
  });

  // Close modals via close buttons (e.g. #closeShareModal)
document.querySelectorAll('[id^="close"]')?.forEach(btn => {
  btn.addEventListener('click', () => {
    const modalId = btn.getAttribute('data-modal');
    const modal = document.getElementById(modalId);
    toggleModal(modal, false);
  });
});


  // Close modals when clicking outside the modal panel (backdrop)
  window.addEventListener('click', (e) => {
    document.querySelectorAll('[id$="Modal"]').forEach(modal => {
      if (e.target === modal) {
        toggleModal(modal, false);
      }
    });
  });

  setupCalendarCreation();
  setupCalendarEditing();
  setupCalendarSharing();
}

document.addEventListener('DOMContentLoaded', async () => {
  user = await ensureAuthenticated();
  if (!user) return;
  setupUIHandlers();
  setupFilterHandlers();
  await fetchCalendars();
});

document.getElementById('cancelRemoveUser')?.addEventListener('click', () => {
  document.getElementById('confirmRemoveUserModal').classList.add('hidden');
  document.body.style.overflow = '';
});