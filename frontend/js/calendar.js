document.addEventListener('DOMContentLoaded', async function () {

    document.getElementById('back-btn').addEventListener('click', function () {
        window.location.href = '/';  // Redirects to the main page (home)
    });
    
    const pathParts = window.location.pathname.split('/');
    const calendarId = pathParts[pathParts.length - 1];
    
    if (!calendarId) {
        console.error('Calendar ID not found in the URL.');
        return;
    }

    // Show the delete calendar button when the calendar is loaded
    const deleteCalendarBtn = document.getElementById('delete-calendar-btn');
    deleteCalendarBtn.classList.remove('hidden');  // Unhide the delete button
    
    deleteCalendarBtn.addEventListener('click', function () {
        // Show confirmation before deletion
        const confirmDelete = window.confirm('Vai tiešām vēlaties dzēst šo kalendāru? Šo darbību nevarēs atjaunot.');
        
        if (confirmDelete) {
            // Proceed to delete the calendar via API
            deleteCalendar(calendarId);
        }
    });
    
    async function deleteCalendar(calendarId) {
        try {
            const response = await fetch(`/api/kalendars/${calendarId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                // Redirect to the home page or show success message
                alert('Kalendārs tika dzēsts.');
                window.location.href = '/';  // Redirect to the home page after deletion
            } else {
                alert('Radās kļūda dzēšot kalendāru.');
            }
        } catch (error) {
            console.error('Error deleting calendar:', error);
            alert('Radās kļūda dzēšot kalendāru.', error);
        }
    }

    // Default current date and calendar color
    let currentDate = new Date();
    let calendarColor = '#007bff'; // Default color
    
    try {
        // Fetch calendar data from API
        const response = await fetch(`/api/kalendars/${calendarId}`);
        const calendarData = await response.json();
        if (!calendarData || !calendarData.color) {
            console.error('Calendar data or color not found.');
            return;
        }
    
        // Set the calendar's background color
        calendarColor = calendarData.color;
        document.documentElement.style.setProperty('--calendar-bg-color', calendarColor);
        document.documentElement.style.setProperty('--event-bg-color', calendarColor);
    
        // Fetch events for this calendar
        const eventResponse = await fetch(`/api/events/${calendarId}`);
        const events = await eventResponse.json();
        renderCalendar(currentDate, events, calendarColor);
    
    } catch (error) {
        console.error('Error fetching calendar data:', error);
    }

    function renderCalendar(currentDate, events, calendarColor) {
        const calendar = document.querySelector('.calendar');
        const monthYear = document.getElementById('month-year');
        const calendarControls = document.getElementById('calendar-controls');
        calendarControls.style.backgroundColor = calendarColor;
    
        calendar.innerHTML = '';
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
    
        monthYear.textContent = `${currentDate.toLocaleString('lv', { month: 'long' }).charAt(0).toUpperCase() + currentDate.toLocaleString('lv', { month: 'long' }).slice(1)} ${year}`;
    
        const daysOfWeek = ['Pirmdiena', 'Otrdiena', 'Trešdiena', 'Ceturdiena', 'Piektdiena', 'Sestdiena', 'Svētdiena']; // Changed order to Mon-Sun
        daysOfWeek.forEach(day => {
            const dayOfWeekElement = document.createElement('div');
            dayOfWeekElement.className = 'day-of-week';
            dayOfWeekElement.textContent = day;
            calendar.appendChild(dayOfWeekElement);
        });
    
        // Fill in the empty cells before the first day of the month
        const firstDayOffset = (firstDay === 0 ? 6 : firstDay - 1); // Adjust for Monday starting
        for (let i = 0; i < firstDayOffset; i++) {
            const emptyCell = document.createElement('div');
            calendar.appendChild(emptyCell);
        }
    
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            dayElement.textContent = i;
    
            const dayEvents = events.filter(event => event.day === i && event.month === (month + 1) && event.year === year);
            if (dayEvents.length > 0) {
                dayElement.classList.add('has-event');
            }
    
            dayElement.addEventListener('click', function () {
                displayEvents(i, calendarColor, dayEvents);
            });
    
            calendar.appendChild(dayElement);
        }
    }
    
    function displayEvents(day, calendarColor, dayEvents) {
        const days = document.querySelectorAll('.day');
        days.forEach(d => d.classList.remove('selected'));
    
        const selectedDay = [...days].find(d => d.textContent == day);
        selectedDay.classList.add('selected');
    
        const eventsContainer = document.getElementById('events');
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        eventsContainer.innerHTML = `<h3>Events for day ${day}</h3>`;
    
        if (dayEvents.length > 0) {
            dayEvents.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'event';
                eventElement.textContent = event.eventText;
    
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', async function () {
                    await fetch(`/api/events/${event._id}`, { method: 'DELETE' });
                    eventElement.remove();
                    updateEvents(day);
                });
    
                eventElement.appendChild(deleteButton);
                eventsContainer.appendChild(eventElement);
            });
        } else {
            selectedDay.classList.remove('has-event');
            selectedDay.style.backgroundColor = '';
            const noEventsMessage = document.createElement('p');
            noEventsMessage.textContent = 'No events for this day.';
            eventsContainer.appendChild(noEventsMessage);
        }
    }
    
    async function updateEvents(day) {
        const eventResponse = await fetch(`/api/events/${calendarId}`);
        const updatedEvents = await eventResponse.json();
        renderCalendar(currentDate, updatedEvents, calendarColor);
        const dayEvents = updatedEvents.filter(event => event.day === day && event.month === (currentDate.getMonth() + 1) && event.year === currentDate.getFullYear());
        displayEvents(day, calendarColor, dayEvents);
    }
    
    document.getElementById('add-event-btn').addEventListener('click', async function () {
        const eventInput = document.getElementById('event-input');
        const eventText = eventInput.value;
        const selectedDay = document.querySelector('.selected');
        if (!eventText || !selectedDay) return;
    
        const day = selectedDay.textContent;
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
    
        const response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                calendarId,
                day,
                month,
                year,
                eventText
            })
        });
    
        const newEvent = await response.json();
    
        // Fetch updated events
        const eventsResponse = await fetch(`/api/events/${calendarId}`);
        const updatedEvents = await eventsResponse.json();
    
        renderCalendar(currentDate, updatedEvents, calendarColor);
    
        // Find the day where the event was added and apply styles
        const dayElement = [...document.querySelectorAll('.day')].find(d => d.textContent == day);
        if (dayElement) {
            dayElement.classList.add('has-event');
            dayElement.style.backgroundColor = calendarColor; // Set background color
            dayElement.style.fontWeight = 'bold'; // Bold the day number
        }
    
        // Remove the "No events" message if it exists
        const noEventsMessage = document.querySelector('#events p');
        if (noEventsMessage) {
            noEventsMessage.remove();
        }
    
        // Append the new event to the events list
        const eventsContainer = document.getElementById('events');
        const eventElement = document.createElement('div');
        eventElement.className = 'event';
        eventElement.textContent = eventText;
    
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', async function () {
            await fetch(`/api/events/${newEvent._id}`, { method: 'DELETE' });
            eventElement.remove();
            updateEvents(day);
        });
    
        eventElement.appendChild(deleteButton);
        eventsContainer.appendChild(eventElement);
    
        // Clear the input field
        eventInput.value = '';
    });
    
    document.getElementById('prev-month').addEventListener('click', function () {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateEvents();
    });
    
    document.getElementById('next-month').addEventListener('click', function () {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateEvents();
    });
});
