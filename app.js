const teamNumberInput = document.getElementById('team-number');
const eventCodeInput = document.getElementById('event-code');
const loadMatchesButton = document.getElementById('load-matches');
const clearDataButton = document.getElementById('clear-data');
const matchesList = document.getElementById('matches-list');
const currentMatchNumber = document.getElementById('current-match-number');

const toggleEditButton = document.getElementById('toggle-edit');
const checklistControls = document.getElementById('checklist-controls');
const checklist = document.getElementById('checklist');
const notesTextarea = document.getElementById('match-notes');
const saveNotesButton = document.getElementById('save-notes');
const addItemButton = document.getElementById('add-item');
const newItemText = document.getElementById('new-item-text');

const TBA_API_KEY = 'BeG5D5SaJDBW9iun3eGrb0grTcKGLdEXiacoIDzM3GBPEbPVf44wVR7Ztxb5qDYV';
let editMode = false;

// Default checklist template
const DEFAULT_CHECKLIST = [
    "Correct Bumpers",
    "Battery Charged",
    "Driver Station Ready",
    "Systems Check",
    "Strategy Discussion"
];

// Load checklist template from localStorage or defaults
function loadChecklistTemplate() {
    const saved = JSON.parse(localStorage.getItem("checklist_template"));
    return saved || DEFAULT_CHECKLIST;
}

// Save checklist template to localStorage
function saveChecklistTemplate(items) {
    localStorage.setItem("checklist_template", JSON.stringify(items));
}

// Render editable checklist
function renderChecklist(items, data = {}) {
    checklist.innerHTML = "";
    items.forEach((label, idx) => {
        const li = document.createElement('li');

        const cb = document.createElement('input');
        cb.type = "checkbox";
        cb.id = `check-${idx}`;
        cb.checked = data[`check-${idx}`] || false;

        const text = document.createElement('input');
        text.type = "text";
        text.value = label;
        text.classList.add("checklist-label");
        text.disabled = !editMode;
        text.addEventListener('change', () => updateChecklistTemplate());

        const delBtn = document.createElement('button');
        delBtn.textContent = "✕";
        delBtn.classList.add("delete-item");
        delBtn.style.display = editMode ? 'inline-block' : 'none';
        delBtn.addEventListener('click', () => {
            li.remove();
            updateChecklistTemplate();
        });

        li.appendChild(cb);
        li.appendChild(text);
        li.appendChild(delBtn);
        checklist.appendChild(li);
    });
}

// Update template when user edits/deletes/renames items
function updateChecklistTemplate() {
    const items = Array.from(checklist.querySelectorAll('.checklist-label')).map(i => i.value.trim()).filter(Boolean);
    saveChecklistTemplate(items);
}

// Add a new checklist item
addItemButton.addEventListener('click', () => {
    const text = newItemText.value.trim();
    if (!text) return;
    const items = loadChecklistTemplate();
    items.push(text);
    saveChecklistTemplate(items);
    renderChecklist(items); // refresh checklist with new item
    newItemText.value = "";

    // Update existing saved matches with the new item unchecked
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('match_')) {
            const matchData = JSON.parse(localStorage.getItem(key));
            matchData.checklist[`check-${items.length - 1}`] = false;
            localStorage.setItem(key, JSON.stringify(matchData));
        }
    });
});

// Fetch matches from TBA
async function fetchMatches(teamNumber, eventCode) {
    const url = `https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/event/${eventCode}/matches/simple`;
    const res = await fetch(url, {
        headers: { 'X-TBA-Auth-Key': TBA_API_KEY }
    });
    if (!res.ok) throw new Error('Failed to fetch matches from TBA');
    return res.json();
}

// Load matches
loadMatchesButton.addEventListener('click', async () => {
    const teamNumber = teamNumberInput.value;
    const eventCode = eventCodeInput.value;
    matchesList.innerHTML = 'Loading...';
    try {
        const matches = await fetchMatches(teamNumber, eventCode);
        matchesList.innerHTML = '';
        matches
            .filter(m => m.comp_level === 'qm')
            .sort((a, b) => a.match_number - b.match_number)
            .forEach(match => {
                const li = document.createElement('li');
                li.textContent = `Match ${match.match_number} - ${match.alliances.red.team_keys.includes(`frc${teamNumber}`) ? 'Red' : 'Blue'}`;
                li.style.cursor = 'pointer';
                li.addEventListener('click', () => loadMatchData(match.match_number));
                matchesList.appendChild(li);
            });
    } catch (err) {
        matchesList.innerHTML = 'Error loading matches';
        console.error(err);
    }
});

// Save match data
function saveMatchData(matchNumber) {
    const checklistData = {};
    checklist.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        checklistData[cb.id] = cb.checked;
    });
    const notesData = notesTextarea.value;
    localStorage.setItem(`match_${matchNumber}`, JSON.stringify({ checklist: checklistData, notes: notesData }));
    alert('Saved!');
}

// Load match data
function loadMatchData(matchNumber) {
    currentMatchNumber.textContent = `#${matchNumber}`;
    const data = JSON.parse(localStorage.getItem(`match_${matchNumber}`));
    const checklistTemplate = loadChecklistTemplate();
    renderChecklist(checklistTemplate, data ? data.checklist : {});
    notesTextarea.value = data ? data.notes : '';
}

// Save notes button
saveNotesButton.addEventListener('click', () => {
    const selectedMatch = matchesList.querySelector('li.selected');
    if (!selectedMatch) {
        alert('Select a match first!');
        return;
    }
    const matchNumber = selectedMatch.textContent.match(/\d+/)[0];
    saveMatchData(matchNumber);
});

// Match selection highlighting
matchesList.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
        matchesList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
        e.target.classList.add('selected');
    }
});

// Clear local data
clearDataButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all saved data?')) {
        localStorage.clear();
        alert('All saved data has been cleared.');
        renderChecklist(DEFAULT_CHECKLIST);
    }
});

// Initialize checklist on page load
renderChecklist(loadChecklistTemplate());


toggleEditButton.addEventListener('click', () => {
    editMode = !editMode;
    checklistControls.style.display = editMode ? 'block' : 'none';
    document.querySelectorAll('.checklist-label').forEach(input => {
        input.disabled = !editMode;
    });
    document.querySelectorAll('.delete-item').forEach(btn => {
        btn.style.display = editMode ? 'inline-block' : 'none';
    });
    toggleEditButton.textContent = editMode ? 'Exit Edit Mode' : 'Edit Checklist';
});

