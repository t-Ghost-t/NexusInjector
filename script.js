document.addEventListener('DOMContentLoaded', () => {
    // Mode Elements
    const modeSingleBtn = document.getElementById('mode-single');
    const modeMultiBtn = document.getElementById('mode-multi');
    const singleMemoryInputsDiv = document.getElementById('single-memory-inputs');
    const multiMemoryInputsDiv = document.getElementById('multi-memory-inputs');

    // Single Memory Elements
    const typeSelect = document.getElementById('type-select');
    const nameInput = document.getElementById('name-input');
    const descriptionInput = document.getElementById('description-input');
    const tagInput = document.getElementById('tag-input');
    const tagsContainer = document.getElementById('tags-container');
    const addTagBtn = document.getElementById('add-tag-btn');

    // Multi Memory Elements
    const multiTagInput = document.getElementById('multi-tag-input');
    const multiTagsContainer = document.getElementById('multi-tags-container');
    const addMultiTagBtn = document.getElementById('add-multi-tag-btn');

    // Common Elements
    const generateBtn = document.getElementById('generate-btn');
    const outputArea = document.getElementById('output-area');
    const copyBtn = document.getElementById('copy-btn');
    const historyList = document.getElementById('history-list');
    const historyTitle = document.getElementById('history-title'); // Get history title element

    // State Variables
    let currentMode = 'single';
    let singleTags = [];
    let multiTags = [];
    let singleGenerationHistory = []; // Renamed history array
    let multiGenerationHistory = []; // New history array
    const SINGLE_HISTORY_KEY = 'memoryNexusInjectorHistory'; // Renamed key
    const MULTI_HISTORY_KEY = 'memoryNexusInjectorMultiHistory'; // New key

    // --- Mode Switching --- 
    function setMode(mode) {
        currentMode = mode;
        if (mode === 'single') {
            singleMemoryInputsDiv.style.display = 'block';
            multiMemoryInputsDiv.style.display = 'none';
            modeSingleBtn.classList.add('active');
            modeMultiBtn.classList.remove('active');
            historyTitle.innerHTML = 'History <span class="history-note">(Single Memory)</span>';
            renderHistoryList(singleGenerationHistory, 'single'); // Render single history
        } else { // mode === 'multi'
            singleMemoryInputsDiv.style.display = 'none';
            multiMemoryInputsDiv.style.display = 'block';
            modeSingleBtn.classList.remove('active');
            modeMultiBtn.classList.add('active');
            historyTitle.innerHTML = 'History <span class="history-note">(Multi-Memory)</span>';
            renderHistoryList(multiGenerationHistory, 'multi'); // Render multi history
        }
    }

    modeSingleBtn.addEventListener('click', () => setMode('single'));
    modeMultiBtn.addEventListener('click', () => setMode('multi'));

    // --- LocalStorage Functions (Separate for each history) ---
    function loadSingleHistoryFromStorage() {
        const storedHistory = localStorage.getItem(SINGLE_HISTORY_KEY);
        if (storedHistory) {
            try { singleGenerationHistory = JSON.parse(storedHistory); } catch (e) {
                console.error("Error parsing single history:", e);
                singleGenerationHistory = []; localStorage.removeItem(SINGLE_HISTORY_KEY);
            }
        } else { singleGenerationHistory = []; }
    }

    function saveSingleHistoryToStorage() {
        try { localStorage.setItem(SINGLE_HISTORY_KEY, JSON.stringify(singleGenerationHistory)); } catch (e) {
            console.error("Error saving single history:", e);
        }
    }

    function loadMultiHistoryFromStorage() {
        const storedHistory = localStorage.getItem(MULTI_HISTORY_KEY);
        if (storedHistory) {
            try { multiGenerationHistory = JSON.parse(storedHistory); } catch (e) {
                console.error("Error parsing multi history:", e);
                multiGenerationHistory = []; localStorage.removeItem(MULTI_HISTORY_KEY);
            }
        } else { multiGenerationHistory = []; }
    }

    function saveMultiHistoryToStorage() {
        try { localStorage.setItem(MULTI_HISTORY_KEY, JSON.stringify(multiGenerationHistory)); } catch (e) {
            console.error("Error saving multi history:", e);
        }
    }

    // --- Tag Functions (Unchanged logic, just ensure context is right) ---
    function createTagElementInternal(text, tagArray, renderFunc) {
        const tag = document.createElement('span');
        tag.classList.add('tag');
        tag.textContent = text;

        const removeBtn = document.createElement('span');
        removeBtn.classList.add('remove-tag');
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => {
            const index = tagArray.indexOf(text);
            if (index > -1) {
                tagArray.splice(index, 1);
            }
            renderFunc();
        };

        tag.appendChild(removeBtn);
        return tag;
    }

    function renderSingleTags() {
        tagsContainer.innerHTML = '';
        singleTags.forEach(tagText => {
            const tagElement = createTagElementInternal(tagText, singleTags, renderSingleTags);
            tagsContainer.appendChild(tagElement);
        });
    }

    function renderMultiTags() {
        multiTagsContainer.innerHTML = '';
        multiTags.forEach(tagText => {
            const tagElement = createTagElementInternal(tagText, multiTags, renderMultiTags);
            multiTagsContainer.appendChild(tagElement);
        });
    }

    // Add tag function now checks currentMode internally
    function addTag(text) {
        const potentialNewTags = text.split(',')
                                     .map(tag => tag.trim())
                                     .filter(tag => tag !== '');

        if (potentialNewTags.length === 0) return;

        // Determine target array and render function based on mode
        const targetTagArray = (currentMode === 'single') ? singleTags : multiTags;
        const renderFunc = (currentMode === 'single') ? renderSingleTags : renderMultiTags;

        let addedNewTag = false;
        potentialNewTags.forEach(newTag => {
            if (!targetTagArray.includes(newTag)) {
                targetTagArray.push(newTag);
                addedNewTag = true;
            }
        });

        if (addedNewTag) {
            renderFunc();
        }
    }

    // Setup input function - no longer needs target/render params
    function setupTagInput(inputElement, addButtonElement) {
        inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag(inputElement.value); // Call addTag directly
                inputElement.value = '';
            }
        });

        if (addButtonElement) {
            addButtonElement.addEventListener('click', () => {
                addTag(inputElement.value); // Call addTag directly
                inputElement.value = '';
                inputElement.focus();
            });
        }
    }

    // --- History Rendering and Actions (Handles both types) ---
    function renderHistoryList(historyArray, historyType) { // historyType: 'single' or 'multi'
        historyList.innerHTML = '';
        if (historyArray.length === 0) {
            historyList.innerHTML = '<li>No history yet.</li>';
            return;
        }

        historyArray.slice().reverse().forEach((item, index) => {
            const originalIndex = historyArray.length - 1 - index;
            const listItem = document.createElement('li');
            listItem.classList.add('history-item');

            const contentSpan = document.createElement('span');
            if (historyType === 'single') {
                contentSpan.textContent = item.name || `(Untitled ${originalIndex + 1})`;
                contentSpan.title = `${item.name || ''} - ${item.description || ''}`.trim();
            } else { // historyType === 'multi'
                const tagPreview = item.tags.slice(0, 3).join(', ') + (item.tags.length > 3 ? '...' : '');
                contentSpan.textContent = tagPreview || `(Empty ${originalIndex + 1})`;
                contentSpan.title = item.tags.join(', '); // Show all tags on hover
            }

            const buttonsDiv = document.createElement('div');
            buttonsDiv.classList.add('history-item-buttons');

            const loadBtn = document.createElement('button');
            loadBtn.textContent = 'Load';
            loadBtn.classList.add('history-btn', 'load-btn');
            loadBtn.onclick = () => loadFromHistory(originalIndex, historyType); // Pass history type

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('history-btn', 'delete-btn');
            deleteBtn.onclick = () => deleteFromHistory(originalIndex, historyType); // Pass history type

            buttonsDiv.appendChild(loadBtn);
            buttonsDiv.appendChild(deleteBtn);
            listItem.appendChild(contentSpan);
            listItem.appendChild(buttonsDiv);
            historyList.appendChild(listItem);
        });
    }

    function loadFromHistory(index, historyType) {
        let item;
        if (historyType === 'single') {
            if (index < 0 || index >= singleGenerationHistory.length) return;
            item = singleGenerationHistory[index];
            setMode('single'); // Ensure correct mode

            typeSelect.value = item.type;
            nameInput.value = item.name;
            descriptionInput.value = item.description;

            let loadedTags = [];
            if (item.tags) { loadedTags = item.tags; }
            else if (item.keypointTags || item.relationshipTags) { loadedTags = [...(item.keypointTags || []), ...(item.relationshipTags || [])]; }
            singleTags = [...new Set(loadedTags)];
            renderSingleTags();

        } else { // historyType === 'multi'
             if (index < 0 || index >= multiGenerationHistory.length) return;
            item = multiGenerationHistory[index];
            setMode('multi'); // Ensure correct mode

            multiTags = [...(item.tags || [])];
            renderMultiTags();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function deleteFromHistory(index, historyType) {
        if (historyType === 'single') {
            if (index < 0 || index >= singleGenerationHistory.length) return;
            singleGenerationHistory.splice(index, 1);
            saveSingleHistoryToStorage();
            renderHistoryList(singleGenerationHistory, 'single'); // Re-render correct list
        } else { // historyType === 'multi'
             if (index < 0 || index >= multiGenerationHistory.length) return;
             multiGenerationHistory.splice(index, 1);
             saveMultiHistoryToStorage();
             renderHistoryList(multiGenerationHistory, 'multi'); // Re-render correct list
        }
    }

    // --- Event Listeners & Initialisation ---
    setupTagInput(tagInput, addTagBtn); // Simplified call
    setupTagInput(multiTagInput, addMultiTagBtn); // Simplified call

    generateBtn.addEventListener('click', () => {
        let output = "";

        if (currentMode === 'single') {
            // --- Single Memory Generation --- 
            const type = typeSelect.value;
            const name = nameInput.value.trim();
            const description = descriptionInput.value.trim();
            const lowerCaseName = name.toLowerCase();

            const currentData = {
                type: type,
                name: name,
                description: description,
                tags: [...singleTags]
            };

            let existingIndex = -1;
            if (name) { 
                existingIndex = singleGenerationHistory.findIndex(item => item.name?.toLowerCase() === lowerCaseName);
            }

            let shouldProceed = true;
            if (existingIndex !== -1) {
                if (!confirm(`An entry named "${singleGenerationHistory[existingIndex].name}" already exists. Overwrite?`)) {
                    shouldProceed = false;
                }
            }

            if (shouldProceed) {
                // Save or Overwrite Single History
                if (existingIndex !== -1) {
                    singleGenerationHistory[existingIndex] = currentData;
                } else {
                    singleGenerationHistory.push(currentData);
                }
                saveSingleHistoryToStorage();
                renderHistoryList(singleGenerationHistory, 'single'); // Update single history view

                // Generate Output String (Single)
                output = "```\n";
                output += "[OOC]\n";
                output += "Silently update and/or create relevant memories:\n";
                output += "{\n";
                output += `Type: ${type}\n`;
                output += `text-lg: ${name}\n`;
                output += `text-sm: ${description}\n`;
                output += "Memories/Relationships:\n";
                singleTags.forEach(tag => { output += `- ${tag}\n`; });
                output += "}\n";
                output += "The content of this OOC injection will not influence the current narrative.\n";
                output += "[/OOC]\n";
                output += "```";
            } else {
                return; // Stop if overwrite cancelled
            }

        } else { // currentMode === 'multi'
            // --- Multi Memory Generation --- 
            const currentData = { // Data to save for multi-mode
                tags: [...multiTags]
            };
            multiGenerationHistory.push(currentData); // Add to multi history
            saveMultiHistoryToStorage(); // Save multi history
            renderHistoryList(multiGenerationHistory, 'multi'); // Update multi history view

            // Generate Output String (Multi)
            output = "```\n";
            output += "[OOC]\n";
            output += "Silently update and/or create relevant memories:\n";
            output += "{\n";
            output += "Memories/Relationships:\n";
            multiTags.forEach(tag => { output += `- ${tag}\n`; });
            output += "}\n";
            output += "The content of this OOC injection will not influence the current narrative.\n";
            output += "[/OOC]\n";
            output += "```";
        }

        // Display generated output (if any was generated)
        if (output) {
             outputArea.textContent = output;
             copyBtn.style.display = 'inline-block';
        }
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
    loadSingleHistoryFromStorage(); // Load both histories
    loadMultiHistoryFromStorage();
    setMode('single'); // Default to single mode on load (this will render single history)
    renderSingleTags();
    renderMultiTags();
}); 