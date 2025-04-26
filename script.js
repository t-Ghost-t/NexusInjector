document.addEventListener('DOMContentLoaded', () => {
    const typeSelect = document.getElementById('type-select');
    const nameInput = document.getElementById('name-input');
    const descriptionInput = document.getElementById('description-input');
    // Combined Tag Elements
    const tagInput = document.getElementById('tag-input');
    const tagsContainer = document.getElementById('tags-container');
    const addTagBtn = document.getElementById('add-tag-btn');
    // --- Removed relationship elements ---
    const generateBtn = document.getElementById('generate-btn');
    const outputArea = document.getElementById('output-area');
    const copyBtn = document.getElementById('copy-btn');
    const historyList = document.getElementById('history-list');

    let tags = []; // Single array for all tags
    // --- Removed relationshipTags array ---
    let generationHistory = [];
    const HISTORY_KEY = 'memoryNexusInjectorHistory';

    // --- LocalStorage Functions (Unchanged) ---
    function loadHistoryFromStorage() {
        const storedHistory = localStorage.getItem(HISTORY_KEY);
        if (storedHistory) {
            try {
                generationHistory = JSON.parse(storedHistory);
            } catch (e) {
                console.error("Error parsing history from localStorage:", e);
                generationHistory = [];
                localStorage.removeItem(HISTORY_KEY);
            }
        } else {
            generationHistory = [];
        }
    }

    function saveHistoryToStorage() {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(generationHistory));
        } catch (e) {
            console.error("Error saving history to localStorage:", e);
        }
    }

    // --- Tag Functions (Consolidated) ---
    function createTagElement(text) { // Removed 'type' parameter
        const tag = document.createElement('span');
        tag.classList.add('tag');
        tag.textContent = text;

        const removeBtn = document.createElement('span');
        removeBtn.classList.add('remove-tag');
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => {
            removeTag(text);
        };

        tag.appendChild(removeBtn);
        return tag;
    }

    function renderTags() { // Simplified - always uses global 'tags' and 'tagsContainer'
        tagsContainer.innerHTML = '';
        tags.forEach(tagText => {
            const tagElement = createTagElement(tagText);
            tagsContainer.appendChild(tagElement);
        });
    }

    function addTag(text) {
        const potentialTags = text.split(','); // Split input by comma
        let addedNewTag = false;

        potentialTags.forEach(potentialTag => {
            const trimmedText = potentialTag.trim();
            if (!trimmedText) return; // Skip empty strings resulting from split/trim

            if (!tags.includes(trimmedText)) {
                tags.push(trimmedText);
                addedNewTag = true;
            }
        });

        if (addedNewTag) {
            renderTags(); // Rerender the single container only if new tags were added
        }
    }

    function removeTag(text) { // Removed 'type' parameter
        tags = tags.filter(tag => tag !== text);
        renderTags(); // Rerender the single container
    }

    function setupTagInput(inputElement, addButtonElement) { // Simplified parameters
        inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag(inputElement.value);
                inputElement.value = '';
            }
        });

        if (addButtonElement) {
            addButtonElement.addEventListener('click', () => {
                addTag(inputElement.value);
                inputElement.value = '';
                inputElement.focus();
            });
        }
    }

    // --- History Rendering and Actions (Updated load/save) ---
    function renderHistoryList() {
        historyList.innerHTML = '';
        if (generationHistory.length === 0) {
            historyList.innerHTML = '<li>No history yet.</li>';
            return;
        }

        generationHistory.slice().reverse().forEach((item, index) => {
            const originalIndex = generationHistory.length - 1 - index;
            const listItem = document.createElement('li');
            listItem.classList.add('history-item');

            const nameSpan = document.createElement('span');
            nameSpan.textContent = item.name || `(Untitled ${originalIndex + 1})`;
            nameSpan.title = `${item.name || ''} - ${item.description || ''}`.trim();

            const buttonsDiv = document.createElement('div');
            buttonsDiv.classList.add('history-item-buttons');

            const loadBtn = document.createElement('button');
            loadBtn.textContent = 'Load';
            loadBtn.classList.add('history-btn', 'load-btn');
            loadBtn.onclick = () => loadFromHistory(originalIndex);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('history-btn', 'delete-btn');
            deleteBtn.onclick = () => deleteFromHistory(originalIndex);

            buttonsDiv.appendChild(loadBtn);
            buttonsDiv.appendChild(deleteBtn);
            listItem.appendChild(nameSpan);
            listItem.appendChild(buttonsDiv);
            historyList.appendChild(listItem);
        });
    }

    function loadFromHistory(index) {
        if (index < 0 || index >= generationHistory.length) return;
        const item = generationHistory[index];

        typeSelect.value = item.type;
        nameInput.value = item.name;
        descriptionInput.value = item.description;

        // Update the single 'tags' array
        // Handle potential old history items that might have separate arrays
        let loadedTags = [];
        if (item.tags) { // Check for new combined format
            loadedTags = item.tags;
        } else if (item.keypointTags || item.relationshipTags) { // Check for old format
             loadedTags = [...(item.keypointTags || []), ...(item.relationshipTags || [])];
        }
        tags = [...new Set(loadedTags)]; // Combine and remove duplicates

        renderTags(); // Re-render the single tag UI

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function deleteFromHistory(index) {
        if (index < 0 || index >= generationHistory.length) return;
        generationHistory.splice(index, 1);
        saveHistoryToStorage();
        renderHistoryList();
    }

    // --- Event Listeners & Initialisation ---
    setupTagInput(tagInput, addTagBtn); // Updated call
    // --- Removed relationship setup --- 

    generateBtn.addEventListener('click', () => {
        const type = typeSelect.value;
        const name = nameInput.value.trim();
        const description = descriptionInput.value.trim();
        const lowerCaseName = name.toLowerCase(); // For case-insensitive comparison

        // Data to be potentially saved
        const currentData = {
            type: type,
            name: name,
            description: description,
            tags: [...tags]
        };

        let existingIndex = -1;
        if (name) { // Only check for duplicates if name is not empty
            existingIndex = generationHistory.findIndex(item => item.name?.toLowerCase() === lowerCaseName);
        }

        let shouldProceed = true; // Flag to control execution

        if (existingIndex !== -1) {
            // Duplicate found, ask user to overwrite
            if (!confirm(`An entry named "${generationHistory[existingIndex].name}" already exists. Overwrite?`)) {
                shouldProceed = false; // User cancelled, do not proceed
            }
        }

        if (shouldProceed) {
            // Save or Overwrite History
            if (existingIndex !== -1) {
                // Overwrite existing entry
                generationHistory[existingIndex] = currentData;
            } else {
                // Add as new entry
                generationHistory.push(currentData);
            }
            saveHistoryToStorage();
            renderHistoryList();

            // --- Output Generation (Keep existing) ---
            let output = "```\n";
            output += "[OOC]\n";
            output += "Silently update and/or create relevant memories:\n";
            output += "{\n";
            output += `Type: ${type}\n`;
            output += `text-lg: ${name}\n`;
            output += `text-sm: ${description}\n`;
            output += "Memories/Relationships:\n";
            tags.forEach(tag => { output += `- ${tag}\n`; });
            output += "}\n";
            output += "The content of this OOC injection will not influence the current narrative.\n";
            output += "[/OOC]\n";
            output += "```";

            outputArea.textContent = output;
            copyBtn.style.display = 'inline-block';
        }
        // If shouldProceed is false, execution stops here, nothing is generated/saved
    });

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(outputArea.textContent)
            .then(() => {
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = 'Copy to Clipboard';
                }, 1500);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                alert('Failed to copy text.');
            });
    });

    // --- Initial Load ---
    loadHistoryFromStorage();
    renderHistoryList();
}); 