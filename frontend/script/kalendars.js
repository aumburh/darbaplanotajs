        // --- Calendar App ---
        document.addEventListener('DOMContentLoaded', () => {
            // Get calendarId from URL
            const pathParts = window.location.pathname.split('/');
            const calendarId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
            if (!calendarId) return alert('Calendar ID not found.');

            let currentDate = new Date();
            let events = [];
            let calendarColor = '#3a7afe';

            // DOM elements
            const calendarEl = document.querySelector('.calendar');
            const monthYearEl = document.getElementById('month-year');
            const eventsEl = document.getElementById('events');
            const eventInput = document.getElementById('event-input');
            const eventForm = document.getElementById('event-form');

            // Go back button
            document.getElementById('back-btn').onclick = () => window.location.href = '/';

            // Fetch calendar color and events, then render
            async function loadCalendar() {
                try {
                    // Fetch calendar color
                    const calRes = await fetch(`/api/kalendars/${calendarId}`, {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        }
                    });
                    console.log('Calendar fetch status:', calRes.status);
                    const calData = await calRes.json();
                    console.log('Calendar data:', calData);

                    if (!calRes.ok) throw new Error(calData.message || 'Failed to fetch calendar');

                    calendarColor = calData?.color || '#3a7afe';
                    document.documentElement.style.setProperty('--main', calendarColor);
                    document.documentElement.style.setProperty('--event-bg', lightenColor(calendarColor, 70));
                    document.documentElement.style.setProperty('--hover-bg', lightenColor(calendarColor, 85));

                    // Fetch events
                    const evRes = await fetch(`/api/events/${calendarId}`, {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        }
                    });
                    console.log('Events fetch status:', evRes.status);
                    events = await evRes.json();
                    console.log('Events data:', events);

                    renderCalendar();
                } catch (e) {
                    console.error('Load calendar error:', e);
                    alert('Failed to load calendar.');
                }
            }

            // Render calendar grid
            function renderCalendar() {
                calendarEl.innerHTML = '';
                eventsEl.innerHTML = '';
                // Month/year label
                const month = currentDate.getMonth(), year = currentDate.getFullYear();
                monthYearEl.textContent = currentDate.toLocaleString('lv', { month: 'long', year: 'numeric' })
                    .replace(/^./, m => m.toUpperCase());

                // Days of week
                const daysOfWeek = ['P', 'O', 'T', 'C', 'P', 'S', 'Sv'];
                daysOfWeek.forEach(d => {
                    const el = document.createElement('div');
                    el.className = 'day-of-week'; el.textContent = d;
                    calendarEl.appendChild(el);
                });

                // Calculate offset for first day (Monday=0)
                const firstDay = new Date(year, month, 1).getDay();
                const offset = (firstDay === 0 ? 6 : firstDay - 1);
                for (let i = 0; i < offset; i++) calendarEl.appendChild(document.createElement('div'));

                // Days
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                for (let d = 1; d <= daysInMonth; d++) {
                    const el = document.createElement('div');
                    el.className = 'day';
                    el.textContent = d;
                    // Mark if has event
                    if (events.some(ev => ev.day === d && ev.month === month + 1 && ev.year === year))
                        el.classList.add('has-event');
                    // Click to select day and show events
                    el.onclick = () => selectDay(d);
                    calendarEl.appendChild(el);
                }
            }

            // Select a day, show its events
            function selectDay(day) {
                // Highlight selected
                document.querySelectorAll('.day').forEach(el => el.classList.remove('selected'));
                const dayEls = [...document.querySelectorAll('.day')];
                const selEl = dayEls.find(el => el.textContent == day);
                if (selEl) selEl.classList.add('selected');

                // Show events
                const month = currentDate.getMonth() + 1, year = currentDate.getFullYear();
                const dayEvents = events.filter(ev => ev.day === day && ev.month === month && ev.year === year);
                eventsEl.innerHTML = `<h3>Notikumi ${day}. datumā</h3>`;
                if (dayEvents.length) {
                    dayEvents.forEach(ev => {
                        const evEl = document.createElement('div');
                        evEl.className = 'event';
                        evEl.textContent = ev.eventText;
                        // Delete button
                        const delBtn = document.createElement('button');
                        delBtn.textContent = 'Delete';
                        delBtn.onclick = async () => {
                            await fetch(`/api/events/${ev._id}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                                }
                            });
                            await reloadEvents();
                            selectDay(day);
                        };
                        evEl.appendChild(delBtn);
                        eventsEl.appendChild(evEl);
                    });
                } else {
                    eventsEl.innerHTML += `<p>Šajā dienā nav notikumu.</p>`;
                }
            }

            // Add event
            eventForm.onsubmit = async e => {
                e.preventDefault();
                const text = eventInput.value.trim();
                const sel = document.querySelector('.day.selected');
                if (!text || !sel) return;
                const day = Number(sel.textContent), month = currentDate.getMonth() + 1, year = currentDate.getFullYear();
                await fetch('/api/events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    body: JSON.stringify({ calendarId, day, month, year, eventText: text })
                });
                eventInput.value = '';
                await reloadEvents();
                selectDay(day);
            };

            // Reload events from server
            async function reloadEvents() {
                const evRes = await fetch(`/api/events/${calendarId}`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });
                events = await evRes.json();
                renderCalendar();
            }

            function lightenColor(hex, percent) {
                hex = hex.replace(/^#/, '');
                if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
                const num = parseInt(hex, 16);
                let r = (num >> 16) + Math.round(2.55 * percent);
                let g = ((num >> 8) & 0x00FF) + Math.round(2.55 * percent);
                let b = (num & 0x0000FF) + Math.round(2.55 * percent);
                r = Math.min(255, Math.max(0, r));
                g = Math.min(255, Math.max(0, g));
                b = Math.min(255, Math.max(0, b));
                return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
            }

            // Month navigation
            document.getElementById('prev-month').onclick = async () => {
                currentDate.setMonth(currentDate.getMonth() - 1);
                renderCalendar();
                eventsEl.innerHTML = '';
            };
            document.getElementById('next-month').onclick = async () => {
                currentDate.setMonth(currentDate.getMonth() + 1);
                renderCalendar();
                eventsEl.innerHTML = '';
            };

            // Initial load
            loadCalendar();
        });