    // Initialize tailwind config for dark mode
    tailwind.config = {
        darkMode: 'class',
    };

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
    const colorPickerBtn = document.getElementById('colorPickerBtn');

    // Toggle theme functionality
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark');
        themeIcon.textContent = body.classList.contains('dark') ? '🌞' : '🌙';
        localStorage.setItem('theme', body.classList.contains('dark') ? 'dark' : 'light');
    });

    // Apply stored theme from localStorage
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark');
        themeIcon.textContent = '🌞';
    } else {
        themeIcon.textContent = '🌙';
    }

    // Open color picker when clicking the button
    colorPickerBtn.addEventListener('click', (event) => {
        colorInput.click();
    });

    // Update button background color when color picker changes
    colorInput.addEventListener("input", () => {
        colorPickerBtn.style.backgroundColor = colorInput.value;
    });

    // Open calendar modal
    addCalendar.addEventListener('click', () => {
        calendarModal.classList.remove('hidden');
    });

    // Close calendar modal
    closeModal.addEventListener('click', () => {
        calendarModal.classList.add('hidden');
    });

    // Create calendar and send data to backend
    saveCalendar.addEventListener('click', async () => {
        const name = calendarName.value.trim();
        const color = colorInput.value;

        if(color.value !== '#ffffff') {
            // allow
        } else {
           alert('balto nevar');
           color.value = '000000'; // set to black
        }

        if (name) {
            const newCalendar = {
                name: name,
                color: color
            };

            try {
                const response = await fetch('/calendars', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newCalendar)
                });

                const calendarData = await response.json();
                
                // Add the created calendar to the list
                const calendarButton = document.createElement('button');
                calendarButton.className = 'calendar-button';
                calendarButton.textContent = `${calendarData.name}`;
                calendarButton.style.backgroundColor = calendarData.color;
                
                // When clicked, open the calendar details
                calendarButton.addEventListener('click', function() {
                    window.open(`/kalendars/${calendarData._id}`, '_blank');
                });
                
                calendarList.appendChild(calendarButton);
                calendarModal.classList.add('hidden');

                // Reset input fields
                calendarName.value = "";
                colorInput.value = "#000000";
                colorPickerBtn.style.backgroundColor = "#000000";
            } catch (error) {
                console.error('Error creating calendar:', error);
            }
        }
    });

    // Fetch existing calendars from backend
    async function fetchCalendars() {
        try {
            const response = await fetch('/calendars');
            const calendars = await response.json();

            calendars.forEach(calendar => {
                const calendarButton = document.createElement('button');
                calendarButton.className = 'calendar-button px-6 py-3 rounded-lg shadow-lg transform transition duration-200 ease-in-out hover:scale-105';
                // (${calendar._id}) - iegut id
                calendarButton.textContent = `${calendar.name}`;
                calendarButton.style.backgroundColor = calendar.color;

                // When clicked, open the calendar details
                calendarButton.addEventListener('click', function() {
                    window.open(`/kalendars/${calendar._id}`, '_blank');
                });

                calendarList.appendChild(calendarButton);
            });
        } catch (error) {
            console.error('Error fetching calendars:', error);
        }
    }

    // Fetch calendars when the page loads
    fetchCalendars();