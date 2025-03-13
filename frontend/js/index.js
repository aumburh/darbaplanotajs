// Preset colors (Randomly chosen)
const presetColors = [
    '#FF6347', // Tomato
    '#32CD32', // Lime Green
    '#FFD700', // Gold
    '#8A2BE2', // Blue Violet
    '#00CED1', // Dark Turquoise
    '#FF69B4', // Hot Pink
    '#20B2AA', // Light Sea Green
    '#D2691E'  // Chocolate
];

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

// Open calendar modal
addCalendar.addEventListener('click', () => {
    calendarModal.classList.remove('hidden');
});

// Close calendar modal
closeModal.addEventListener('click', () => {
    calendarModal.classList.add('hidden');
});

// Open color picker when clicking the button
colorPickerBtn.addEventListener('click', () => {
    colorInput.click();
});

// Update button background color when color picker changes
colorInput.addEventListener("input", () => {
    colorPickerBtn.style.backgroundColor = colorInput.value;
});

// Check if color is too close to white
function isCloseToWhite(hex) {
    const rgb = parseInt(hex.slice(1), 16); // Convert hex to RGB
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >>  8) & 0xff;
    const b = (rgb >>  0) & 0xff;
    return (r > 200 && g > 200 && b > 200); // Check if the color is light enough to be "white"
}

// Create calendar and send data to backend
saveCalendar.addEventListener('click', async () => {
    const name = calendarName.value.trim();
    let color = colorInput.value;

    if (isCloseToWhite(color)) {
        alert('Baltais un līdzīgi baltajam krāsas toņi nav atļauti.');
        colorInput.value = '#000000'; // Set to black if invalid
        colorPickerBtn.style.backgroundColor = '#000000'; // Update button color
        return; // Exit function if color is invalid
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

            // Create a new calendar button
            const calendarButton = document.createElement('button');
            calendarButton.className = 'calendar-button px-6 py-3 rounded-lg shadow-lg transform transition duration-200 ease-in-out hover:scale-105';
            calendarButton.textContent = `${calendarData.name}`;
            calendarButton.style.backgroundColor = calendarData.color;

            // When clicked, open the calendar details
            calendarButton.addEventListener('click', function () {
                window.open(`/kalendars/${calendarData._id}`, '_blank');
            });

            // Append the new calendar button to the list immediately
            calendarList.appendChild(calendarButton);

            // Close the modal
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
            calendarButton.textContent = `${calendar.name}`;
            calendarButton.style.backgroundColor = calendar.color;

            // When clicked, open the calendar details
            calendarButton.addEventListener('click', function () {
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

// Add random preset color on page load
function addRandomPresetColor() {
    const randomColor = presetColors[Math.floor(Math.random() * presetColors.length)];
    colorInput.value = randomColor;
    colorPickerBtn.style.backgroundColor = randomColor;
}

// Initialize with a random preset color
addRandomPresetColor();
