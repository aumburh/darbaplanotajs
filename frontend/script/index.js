document.addEventListener('DOMContentLoaded', () => {
            let allCalendars = [];

            if (!localStorage.getItem('token')) {
                window.location.href = '/login';
                return;
            }

            tailwind.config = { darkMode: 'class' };

            const colorPreviewBtn = document.getElementById('colorPreviewBtn');

            const themeToggle = document.getElementById('themeToggle');
            const themeIcon = document.getElementById('themeIcon');
            const body = document.body;
            const addCalendar = document.getElementById('addCalendar');
            const calendarList = document.getElementById('calendarList');
            const calendarModal = document.getElementById('calendarModal');
            const closeModal = document.getElementById('closeModal');
            const saveCalendar = document.getElementById('saveCalendar');
            const calendarName = document.getElementById('calendarName');
            const colorInput = document.getElementById('calendarColor');

            // Edit modal
            const editColorPreviewBtn = document.getElementById('editColorPreviewBtn');
            const editCalendarColor = document.getElementById('editCalendarColor');
            const editCalendarModal = document.getElementById('editCalendarModal');
            const editCalendarName = document.getElementById('editCalendarName');
            const saveEditCalendar = document.getElementById('saveEditCalendar');
            const closeEditModal = document.getElementById('closeEditModal');
            let editingCalendarId = null;

            // Share modal
            let sharingCalendar = null;
            const shareCalendarModal = document.getElementById('shareCalendarModal');
            const closeShareModal = document.getElementById('closeShareModal');
            const shareEmail = document.getElementById('shareEmail');
            const permEdit = document.getElementById('permEdit');
            const permDelete = document.getElementById('permDelete');
            const permRename = document.getElementById('permRename');
            const permAddEvent = document.getElementById('permAddEvent');
            const permDeleteEvent = document.getElementById('permDeleteEvent');
            const permEditEvent = document.getElementById('permEditEvent');
            const addShareUser = document.getElementById('addShareUser');
            const sharedUsersList = document.getElementById('sharedUsersList');


            colorPreviewBtn.addEventListener('click', () => colorInput.click());
            colorInput.addEventListener('input', () => {
                colorPreviewBtn.style.background = colorInput.value;
            });

            // Color preview for edit modal
            editColorPreviewBtn.addEventListener('click', () => editCalendarColor.click());
            editCalendarColor.addEventListener('input', () => {
                editColorPreviewBtn.style.background = editCalendarColor.value;
            });


            function openEditModal(calendar) {
                editingCalendarId = calendar._id;
                editCalendarName.value = calendar.name;
                editCalendarColor.value = calendar.color;
                editColorPreviewBtn.style.background = calendar.color;
                editCalendarModal.classList.remove('hidden');
            }

            // 
            closeEditModal.onclick = () => editCalendarModal.classList.add('hidden');
            saveEditCalendar.onclick = async () => {
                const token = localStorage.getItem('token');
                await fetch(`/api/kalendars/${editingCalendarId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        name: editCalendarName.value,
                        color: editCalendarColor.value
                    })
                });
                editCalendarModal.classList.add('hidden');
                fetchCalendars();
            };

            // Theme toggle
            themeToggle.addEventListener('click', () => {
                body.classList.toggle('dark');
                themeIcon.className = body.classList.contains('dark')
                    ? 'fa-solid fa-sun text-xl'
                    : 'fa-regular fa-moon text-xl';
                localStorage.setItem('theme', body.classList.contains('dark') ? 'dark' : 'light');
            });
            if (localStorage.getItem('theme') === 'dark') {
                body.classList.add('dark');
                themeIcon.className = 'fa-solid fa-sun text-xl';
            } else {
                themeIcon.className = 'fa-regular fa-moon text-xl';
            }

            // Modal open/close
            addCalendar.addEventListener('click', () => {
                calendarModal.classList.remove('hidden');
                setTimeout(() => calendarName.focus(), 100);
            });
            closeModal.addEventListener('click', () => {
                calendarModal.classList.add('hidden');
            });
            window.addEventListener('keydown', (e) => {
                if (!calendarModal.classList.contains('hidden') && e.key === 'Escape') {
                    calendarModal.classList.add('hidden');
                }
                if (!editCalendarModal.classList.contains('hidden') && e.key === 'Escape') {
                    editCalendarModal.classList.add('hidden');
                }
                if (!shareCalendarModal.classList.contains('hidden') && e.key === 'Escape') {
                    shareCalendarModal.classList.add('hidden');
                }
            });

            // Add calendar
            saveCalendar.addEventListener('click', async () => {
                const name = calendarName.value.trim();
                const color = colorInput.value || '#2563eb';
                if (!name) return;

                const newCalendar = { name, color };
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch('/api/kalendars', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify(newCalendar)
                    });
                    calendarModal.classList.add('hidden');
                    calendarName.value = "";
                    colorInput.value = "#2563eb";
                    fetchCalendars();
                } catch (error) {
                    alert('Neizdevās izveidot kalendāru.');
                }
            });

            // Render calendar button
            function addCalendarButton(calendar) {
                const btn = document.createElement('div');
                btn.className = 'calendar-button flex items-center gap-4 px-0 py-0 rounded-xl font-semibold shadow bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-700 transition overflow-hidden relative group';
                btn.style.minHeight = '60px';

                // Color circle
                const colorCircle = document.createElement('span');
                colorCircle.className = 'inline-block w-5 h-5 rounded-full border-2 border-white shadow mr-3 ml-4';
                colorCircle.style.backgroundColor = calendar.color;
                btn.appendChild(colorCircle);

                // Calendar name (click to open)
                const nameBtn = document.createElement('button');
                nameBtn.textContent = calendar.name;
                nameBtn.className = 'flex-1 text-left px-6 py-4 text-lg font-medium hover:underline';
                nameBtn.onclick = () => window.location.href = `/kalendars/${calendar._id}`;
                btn.appendChild(nameBtn);

                // Actions
                const actions = document.createElement('div');
                actions.className = 'flex items-center gap-2 pr-4';

                // Edit button
                const editBtn = document.createElement('button');
                editBtn.title = 'Rediģēt';
                editBtn.className = 'text-blue-500 hover:text-blue-700 p-2 rounded transition';
                editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
                editBtn.onclick = () => openEditModal(calendar);
                actions.appendChild(editBtn);

                // Delete button
                const delBtn = document.createElement('button');
                delBtn.title = 'Dzēst';
                delBtn.className = 'text-red-500 hover:text-red-700 p-2 rounded transition';
                delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
                delBtn.onclick = async () => {
                    if (confirm('Dzēst šo kalendāru?')) {
                        const token = localStorage.getItem('token');
                        await fetch(`/api/kalendars/${calendar._id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': 'Bearer ' + token }
                        });
                        fetchCalendars();
                    }
                };
                actions.appendChild(delBtn);

                // Share button
                const shareBtn = document.createElement('button');
                shareBtn.title = 'Dalīties';
                shareBtn.className = 'text-green-500 hover:text-green-700 p-2 rounded transition';
                shareBtn.innerHTML = '<i class="fa-solid fa-user-group"></i>';
                shareBtn.onclick = () => openShareModal(calendar);
                actions.appendChild(shareBtn);

                btn.appendChild(actions);
                calendarList.appendChild(btn);
            }

            // Fetch calendars
            async function fetchCalendars() {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch('/api/kalendars', {
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    });
                    allCalendars = await response.json();
                    calendarList.innerHTML = '';
                    allCalendars.forEach(addCalendarButton);
                } catch (error) {
                    calendarList.innerHTML = '<span class="text-red-500">Neizdevās ielādēt kalendārus.</span>';
                }
            }

            // Search bar
            const searchBar = document.getElementById('searchBar');
            searchBar.addEventListener('input', () => {
                const query = searchBar.value.trim().toLowerCase();
                calendarList.innerHTML = '';
                allCalendars
                    .filter(cal => cal.name.toLowerCase().includes(query))
                    .forEach(addCalendarButton);
            });

            // Logout
            const logoutButton = document.getElementById('logoutButton');
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem('token');
                window.location.href = '/login';
            });

            // Share modal logic
            function openShareModal(calendar) {
                sharingCalendar = calendar;
                shareCalendarModal.classList.remove('hidden');
                loadSharedUsers();
            }
            closeShareModal.onclick = () => shareCalendarModal.classList.add('hidden');
            addShareUser.onclick = async () => {
                const token = localStorage.getItem('token');
                await fetch(`/api/kalendars/${sharingCalendar._id}/share`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        email: shareEmail.value,
                        permissions: {
                            edit: permEdit.checked,
                            delete: permDelete.checked,
                            rename: permRename.checked,
                            addEvent: permAddEvent.checked,
                            deleteEvent: permDeleteEvent.checked,
                            editEvent: permEditEvent.checked
                        }
                    })
                });
                shareEmail.value = '';
                loadSharedUsers();
            };
            let allSharedUsers = []; // Store all users for filtering

            async function loadSharedUsers() {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/kalendars/${sharingCalendar._id}`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const cal = await res.json();
                allSharedUsers = cal.sharedWith || [];
                renderSharedUsersList('');
            }

            function renderSharedUsersList(search) {
                sharedUsersList.innerHTML = '';
                const searchLower = search.trim().toLowerCase();
                allSharedUsers
                    .filter(sw => {
                        const email = (sw.user.email || sw.user || '').toLowerCase();
                        const username = (sw.user.username || '').toLowerCase();
                        return !searchLower || email.includes(searchLower) || username.includes(searchLower);
                    })
                    .forEach(sw => {
                        const div = document.createElement('div');
                        div.className = "flex flex-col bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 mb-2";

                        const email = sw.user.email || sw.user;
                        const username = sw.user.username ? ` (${sw.user.username})` : '';

                        // Top row: user info and actions
                        const topRow = document.createElement('div');
                        topRow.className = "flex items-center justify-between";

                        topRow.innerHTML = `
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-user text-gray-500"></i>
                    <span class="font-medium text-gray-800 dark:text-gray-100">${email}${username}</span>
                </div>
            `;

                        // Remove button
                        const removeBtn = document.createElement('button');
                        removeBtn.className = "px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 text-xs flex items-center";
                        removeBtn.innerHTML = '<i class="fa-solid fa-user-xmark"></i>';
                        removeBtn.onclick = async () => {
                            const token = localStorage.getItem('token');
                            await fetch(`/api/kalendars/${sharingCalendar._id}/share`, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + token
                                },
                                body: JSON.stringify({ email: sw.user.email || sw.user })
                            });
                            loadSharedUsers();
                        };
                        topRow.appendChild(removeBtn);

                        // Edit permissions button
                        const editBtn = document.createElement('button');
                        editBtn.className = "ml-2 px-2 py-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 text-xs flex items-center gap-1";
                        editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
                        topRow.appendChild(editBtn);

                        div.appendChild(topRow);

                        // Permissions editor (hidden by default)
                        const permEditor = document.createElement('div');
                        permEditor.className = "flex flex-wrap gap-3 mt-2 items-center";
                        permEditor.style.display = "none";

                        // Permission checkboxes
                        const perms = [
                            { key: 'edit', label: 'Rediģēt' },
                            { key: 'delete', label: 'Dzēst' },
                            { key: 'rename', label: 'Pārsaukt' },
                            { key: 'addEvent', label: 'Pievienot notikumu' },
                            { key: 'deleteEvent', label: 'Dzēst notikumu' },
                            { key: 'editEvent', label: 'Rediģēt notikumu' }
                        ];
                        const permInputs = {};
                        perms.forEach(p => {
                            const label = document.createElement('label');
                            label.className = "flex items-center gap-1 text-sm";
                            const input = document.createElement('input');
                            input.type = "checkbox";
                            input.checked = sw.permissions && sw.permissions[p.key];
                            permInputs[p.key] = input;
                            label.appendChild(input);
                            label.appendChild(document.createTextNode(p.label));
                            permEditor.appendChild(label);
                        });

                        // Save button
                        const saveBtn = document.createElement('button');
                        saveBtn.className = "ml-4 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold";
                        saveBtn.textContent = "Saglabāt";
                        saveBtn.onclick = async () => {
                            const token = localStorage.getItem('token');
                            await fetch(`/api/kalendars/${sharingCalendar._id}/share`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + token
                                },
                                body: JSON.stringify({
                                    email: sw.user.email || sw.user,
                                    permissions: {
                                        edit: permInputs.edit.checked,
                                        delete: permInputs.delete.checked,
                                        rename: permInputs.rename.checked,
                                        addEvent: permInputs.addEvent.checked,
                                        deleteEvent: permInputs.deleteEvent.checked,
                                        editEvent: permInputs.editEvent.checked
                                    }
                                })
                            });
                            loadSharedUsers();
                        };
                        permEditor.appendChild(saveBtn);

                        div.appendChild(permEditor);

                        // Toggle permission editor
                        editBtn.onclick = () => {
                            permEditor.style.display = permEditor.style.display === "none" ? "flex" : "none";
                        };

                        sharedUsersList.appendChild(div);
                    });
            }

            // Add event listener for search
            document.getElementById('sharedUsersSearch').addEventListener('input', function () {
                renderSharedUsersList(this.value);
            });

            fetchCalendars();
        });