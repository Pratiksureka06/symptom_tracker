// Main application logic
class SymptomChecker {
    constructor() {
        this.selectedSymptoms = [];
        this.currentConditions = [];
        this.history = this.loadHistory();
        this.currentPage = 'home';
        
        this.initializeApp();
    }
    
    initializeApp() {
        // Initialize translations
        window.translations.initializeLanguage();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize pages
        this.showPage('home');
        
        // Load symptom list
        this.loadSymptomList();
        
        // Load history
        this.loadHistoryPage();
    }
    
    setupEventListeners() {
        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-link') || e.target.closest('.nav-link')) {
                e.preventDefault();
                const link = e.target.matches('.nav-link') ? e.target : e.target.closest('.nav-link');
                const page = link.getAttribute('data-page');
                if (page) {
                    this.showPage(page);
                }
            }
        });
        
        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
        
        // Language selector
        const languageToggle = document.getElementById('language-toggle');
        const languageMenu = document.getElementById('language-menu');
        if (languageToggle && languageMenu) {
            languageToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                languageMenu.classList.toggle('hidden');
            });
            
            document.addEventListener('click', () => {
                languageMenu.classList.add('hidden');
            });
            
            document.querySelectorAll('.language-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    const lang = e.target.getAttribute('data-lang');
                    window.translations.setLanguage(lang);
                    languageMenu.classList.add('hidden');
                });
            });
        }
        
        // Symptom search
        const symptomSearch = document.getElementById('symptom-search');
        if (symptomSearch) {
            symptomSearch.addEventListener('input', (e) => {
                this.filterSymptoms(e.target.value);
            });
        }
        
        // Voice input
        const voiceToggle = document.getElementById('voice-toggle');
        if (voiceToggle) {
            voiceToggle.addEventListener('click', () => {
                if (window.voiceService.isListening) {
                    window.voiceService.stopListening();
                } else {
                    window.voiceService.startListening();
                }
            });
        }
        
        // Analyze symptoms button
        const analyzeButton = document.getElementById('analyze-symptoms');
        if (analyzeButton) {
            analyzeButton.addEventListener('click', () => {
                this.analyzeSymptoms();
            });
        }
        
        // Back button
        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.showPage('symptom-checker');
            });
        }
        
        // Print results
        const printButton = document.getElementById('print-results');
        if (printButton) {
            printButton.addEventListener('click', () => {
                window.print();
            });
        }
        
        // Clear history
        const clearHistoryButton = document.getElementById('clear-history');
        if (clearHistoryButton) {
            clearHistoryButton.addEventListener('click', () => {
                this.clearHistory();
            });
        }
    }
    
    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show selected page
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;
            
            // Update page-specific content
            if (pageId === 'history') {
                this.loadHistoryPage();
            }
        }
        
        // Close mobile menu
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.add('hidden');
        }
    }
    
    loadSymptomList() {
        const symptomList = document.getElementById('symptom-list');
        if (!symptomList) return;
        
        const groupedSymptoms = window.symptomData.groupSymptomsByBodyArea(window.symptomData.availableSymptoms);
        
        symptomList.innerHTML = '';
        
        Object.keys(groupedSymptoms).forEach(bodyArea => {
            const areaDiv = document.createElement('div');
            areaDiv.className = 'mb-4';
            
            const areaTitle = document.createElement('h3');
            areaTitle.className = 'text-sm font-medium text-gray-700 mb-2';
            areaTitle.textContent = `${bodyArea}:`;
            areaDiv.appendChild(areaTitle);
            
            const symptomsGrid = document.createElement('div');
            symptomsGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-2';
            
            groupedSymptoms[bodyArea].forEach(symptom => {
                const symptomButton = this.createSymptomButton(symptom);
                symptomsGrid.appendChild(symptomButton);
            });
            
            areaDiv.appendChild(symptomsGrid);
            symptomList.appendChild(areaDiv);
        });
    }
    
    createSymptomButton(symptom) {
        const button = document.createElement('button');
        const isSelected = this.isSymptomSelected(symptom.id);
        
        button.className = `flex items-center justify-between p-2 rounded border ${
            isSelected
                ? 'bg-blue-50 border-blue-300 text-blue-700 cursor-not-allowed'
                : 'border-gray-300 hover:bg-gray-50 text-gray-700 symptom-card'
        }`;
        
        button.innerHTML = `
            <span>${symptom.name}</span>
            ${!isSelected ? '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>' : ''}
        `;
        
        button.disabled = isSelected;
        
        if (!isSelected) {
            button.addEventListener('click', () => {
                this.addSymptom(symptom);
            });
        }
        
        return button;
    }
    
    filterSymptoms(searchTerm) {
        const symptomList = document.getElementById('symptom-list');
        if (!symptomList) return;
        
        if (searchTerm.trim() === '') {
            this.loadSymptomList();
            return;
        }
        
        const filteredSymptoms = window.symptomData.availableSymptoms.filter(symptom =>
            symptom.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        symptomList.innerHTML = '';
        
        if (filteredSymptoms.length > 0) {
            const searchTitle = document.createElement('h3');
            searchTitle.className = 'text-sm font-medium text-gray-700 mb-2';
            searchTitle.textContent = 'Search Results:';
            symptomList.appendChild(searchTitle);
            
            const resultsGrid = document.createElement('div');
            resultsGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-2';
            
            filteredSymptoms.forEach(symptom => {
                const symptomButton = this.createSymptomButton(symptom);
                resultsGrid.appendChild(symptomButton);
            });
            
            symptomList.appendChild(resultsGrid);
        } else {
            const noResults = document.createElement('p');
            noResults.className = 'text-gray-500 col-span-2';
            noResults.textContent = 'No symptoms match your search.';
            symptomList.appendChild(noResults);
        }
    }
    
    addSymptom(symptom) {
        if (!this.isSymptomSelected(symptom.id)) {
            this.selectedSymptoms.push(symptom);
            this.updateSelectedSymptoms();
            this.updateAnalyzeButton();
            this.loadSymptomList(); // Refresh to update button states
            this.updateSymptomDetails();
        }
    }
    
    removeSymptom(symptomId) {
        this.selectedSymptoms = this.selectedSymptoms.filter(s => s.id !== symptomId);
        this.updateSelectedSymptoms();
        this.updateAnalyzeButton();
        this.loadSymptomList(); // Refresh to update button states
        this.updateSymptomDetails();
    }
    
    isSymptomSelected(symptomId) {
        return this.selectedSymptoms.some(s => s.id === symptomId);
    }
    
    updateSelectedSymptoms() {
        const container = document.getElementById('selected-symptoms');
        const list = document.getElementById('selected-symptoms-list');
        
        if (!container || !list) return;
        
        if (this.selectedSymptoms.length > 0) {
            container.classList.remove('hidden');
            list.innerHTML = '';
            
            this.selectedSymptoms.forEach(symptom => {
                const symptomTag = document.createElement('div');
                symptomTag.className = 'bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center';
                symptomTag.innerHTML = `
                    ${symptom.name}
                    <button class="ml-1 text-blue-600 hover:text-blue-800" onclick="window.symptomChecker.removeSymptom('${symptom.id}')" aria-label="Remove ${symptom.name}">
                        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                `;
                list.appendChild(symptomTag);
            });
        } else {
            container.classList.add('hidden');
        }
    }
    
    updateAnalyzeButton() {
        const button = document.getElementById('analyze-symptoms');
        if (!button) return;
        
        if (this.selectedSymptoms.length > 0) {
            button.className = 'px-6 py-2 rounded-lg font-medium shadow bg-blue-600 text-white hover:bg-blue-700 transition-colors';
            button.disabled = false;
        } else {
            button.className = 'px-6 py-2 rounded-lg font-medium shadow bg-gray-300 text-gray-500 cursor-not-allowed transition-colors';
            button.disabled = true;
        }
    }
    
    updateSymptomDetails() {
        const container = document.getElementById('symptom-details-container');
        if (!container) return;
        
        if (this.selectedSymptoms.length > 0) {
            container.innerHTML = '';
            this.selectedSymptoms.forEach(symptom => {
                const detailCard = this.createSymptomDetailCard(symptom);
                container.appendChild(detailCard);
            });
        } else {
            container.innerHTML = `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-start">
                        <svg class="h-5 w-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                        <div>
                            <h3 class="text-sm font-medium text-blue-800">No symptoms selected</h3>
                            <p class="mt-2 text-sm text-blue-600">
                                Please select at least one symptom from the list or use voice input to describe your symptoms.
                            </p>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    createSymptomDetailCard(symptom) {
        const card = document.createElement('div');
        card.className = 'border border-gray-200 rounded-lg p-4 bg-white mb-4';
        
        card.innerHTML = `
            <h3 class="text-lg font-medium text-gray-900 mb-3">${symptom.name}</h3>
            
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    How severe is this symptom?
                </label>
                <div class="flex space-x-2">
                    <button class="severity-btn px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-800 border-gray-200 border hover:bg-gray-200" data-severity="mild" data-symptom="${symptom.id}">
                        Mild
                    </button>
                    <button class="severity-btn px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-800 border-gray-200 border hover:bg-gray-200" data-severity="moderate" data-symptom="${symptom.id}">
                        Moderate
                    </button>
                    <button class="severity-btn px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-800 border-gray-200 border hover:bg-gray-200" data-severity="severe" data-symptom="${symptom.id}">
                        Severe
                    </button>
                </div>
            </div>
            
            <div>
                <label for="duration-${symptom.id}" class="block text-sm font-medium text-gray-700 mb-2">
                    How long have you had this symptom?
                </label>
                <select id="duration-${symptom.id}" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md" data-symptom="${symptom.id}">
                    <option value="">Select duration</option>
                    <option value="today">Today</option>
                    <option value="1-2 days">1-2 days</option>
                    <option value="3-6 days">3-6 days</option>
                    <option value="1-2 weeks">1-2 weeks</option>
                    <option value="more than 2 weeks">More than 2 weeks</option>
                    <option value="more than a month">More than a month</option>
                </select>
            </div>
        `;
        
        // Add event listeners for severity buttons
        card.querySelectorAll('.severity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const severity = e.target.getAttribute('data-severity');
                const symptomId = e.target.getAttribute('data-symptom');
                this.updateSymptomSeverity(symptomId, severity);
                
                // Update button styles
                card.querySelectorAll('.severity-btn').forEach(b => {
                    b.className = 'severity-btn px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-800 border-gray-200 border hover:bg-gray-200';
                });
                e.target.className = 'severity-btn px-4 py-2 text-sm font-medium rounded-md bg-blue-100 text-blue-800 border-blue-300 border';
            });
        });
        
        // Add event listener for duration select
        const durationSelect = card.querySelector(`#duration-${symptom.id}`);
        if (durationSelect) {
            durationSelect.addEventListener('change', (e) => {
                const duration = e.target.value;
                const symptomId = e.target.getAttribute('data-symptom');
                this.updateSymptomDuration(symptomId, duration);
            });
        }
        
        return card;
    }
    
    updateSymptomSeverity(symptomId, severity) {
        const symptom = this.selectedSymptoms.find(s => s.id === symptomId);
        if (symptom) {
            symptom.severity = severity;
        }
    }
    
    updateSymptomDuration(symptomId, duration) {
        const symptom = this.selectedSymptoms.find(s => s.id === symptomId);
        if (symptom) {
            symptom.duration = duration;
        }
    }
    
    async analyzeSymptoms() {
        if (this.selectedSymptoms.length === 0) return;
        
        const button = document.getElementById('analyze-symptoms');
        if (button) {
            button.innerHTML = `
                <span class="inline-block animate-spin mr-2">⟳</span>
                Analyzing...
            `;
            button.disabled = true;
        }
        
        try {
            this.currentConditions = await window.symptomData.analyzeSymptoms(this.selectedSymptoms);
            
            // Add to history
            const historyEntry = {
                id: Date.now().toString(),
                date: new Date(),
                symptoms: [...this.selectedSymptoms],
                conditions: [...this.currentConditions]
            };
            
            this.history.unshift(historyEntry);
            this.saveHistory();
            
            // Show results
            this.showResults();
            this.showPage('results');
            
        } catch (error) {
            console.error('Error analyzing symptoms:', error);
        } finally {
            if (button) {
                button.innerHTML = window.translations.getTranslation('continueButton');
                button.disabled = false;
            }
        }
    }
    
    showResults() {
        // Show emergency warning if needed
        const hasEmergency = this.currentConditions.some(c => c.urgency === 'emergency');
        const emergencyWarning = document.getElementById('emergency-warning');
        if (emergencyWarning) {
            if (hasEmergency) {
                emergencyWarning.classList.remove('hidden');
            } else {
                emergencyWarning.classList.add('hidden');
            }
        }
        
        // Update next step 2 based on emergency
        const nextStep2 = document.getElementById('next-step-2');
        if (nextStep2) {
            if (hasEmergency) {
                nextStep2.innerHTML = '<span class="font-medium text-red-700">Seek immediate medical attention. Call emergency services or go to the nearest emergency room.</span>';
            } else {
                nextStep2.textContent = 'Consider consulting with a healthcare provider to discuss your symptoms and get a proper diagnosis.';
            }
        }
        
        // Show symptoms
        const symptomsContainer = document.getElementById('results-symptoms');
        if (symptomsContainer) {
            symptomsContainer.innerHTML = '';
            this.selectedSymptoms.forEach(symptom => {
                const symptomTag = document.createElement('div');
                symptomTag.className = 'bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm';
                symptomTag.textContent = `${symptom.name}${symptom.severity ? ` (${symptom.severity})` : ''}${symptom.duration ? ` - ${symptom.duration}` : ''}`;
                symptomsContainer.appendChild(symptomTag);
            });
        }
        
        // Show conditions
        const conditionsContainer = document.getElementById('conditions-list');
        if (conditionsContainer) {
            conditionsContainer.innerHTML = '';
            this.currentConditions.forEach(condition => {
                const conditionCard = this.createConditionCard(condition);
                conditionsContainer.appendChild(conditionCard);
            });
        }
    }
    
    createConditionCard(condition) {
        const card = document.createElement('div');
        const probabilityPercentage = Math.round(condition.probability * 100);
        
        const urgencyConfig = {
            low: { icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-blue-500 bg-blue-50', text: 'Low Urgency' },
            medium: { icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z', color: 'text-yellow-500 bg-yellow-50', text: 'Medium Urgency' },
            high: { icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z', color: 'text-orange-500 bg-orange-50', text: 'High Urgency' },
            emergency: { icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z', color: 'text-red-500 bg-red-50', text: 'Emergency' }
        };
        
        const urgency = urgencyConfig[condition.urgency];
        
        card.className = `border rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md condition-card ${
            condition.urgency === 'emergency' ? 'border-red-300' : 'border-gray-200'
        }`;
        
        card.innerHTML = `
            <div class="p-4">
                <div class="flex justify-between items-start">
                    <h3 class="text-lg font-medium text-gray-900">${condition.name}</h3>
                    <button class="text-gray-500 hover:text-gray-700 speak-btn" data-text="${condition.name}. ${condition.description}. This condition has a ${probabilityPercentage} percent match with your symptoms. The urgency level is ${condition.urgency}." aria-label="Read aloud">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12a3 3 0 106 0v-6a3 3 0 00-6 0v6z"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="flex items-center mt-2">
                    <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgency.color}">
                        <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${urgency.icon}"></path>
                        </svg>
                        <span>${urgency.text}</span>
                    </div>
                    <div class="ml-2 text-sm text-gray-500">
                        ${probabilityPercentage}% match
                    </div>
                </div>
                
                <p class="mt-3 text-gray-600">${condition.description}</p>
                
                <div class="mt-4">
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="h-2.5 rounded-full progress-bar ${
                            condition.urgency === 'emergency' ? 'bg-red-600' : 
                            condition.urgency === 'high' ? 'bg-orange-500' :
                            condition.urgency === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }" style="width: ${probabilityPercentage}%"></div>
                    </div>
                </div>
                
                <div class="mt-4">
                    <h4 class="text-sm font-medium text-gray-700">Recommended Next Steps:</h4>
                    <ul class="mt-2 space-y-2">
                        ${condition.nextSteps.map(step => `
                            <li class="flex items-start">
                                <svg class="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                                <span class="text-sm text-gray-600">${step}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
            
            ${condition.urgency === 'emergency' ? `
                <div class="bg-red-50 border-t border-red-200 px-4 py-3">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-red-800">
                                Seek immediate medical attention
                            </h3>
                            <div class="mt-1 text-sm text-red-700">
                                This condition may require emergency medical care. Please contact emergency services.
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;
        
        // Add speak functionality
        const speakBtn = card.querySelector('.speak-btn');
        if (speakBtn) {
            speakBtn.addEventListener('click', () => {
                const text = speakBtn.getAttribute('data-text');
                window.voiceService.speak(text);
            });
        }
        
        return card;
    }
    
    loadHistory() {
        try {
            const saved = localStorage.getItem('symptom-history');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    }
    
    saveHistory() {
        try {
            localStorage.setItem('symptom-history', JSON.stringify(this.history));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    }
    
    loadHistoryPage() {
        const historyList = document.getElementById('history-list');
        const historyEmpty = document.getElementById('history-empty');
        const clearHistoryContainer = document.getElementById('clear-history-container');
        
        if (!historyList || !historyEmpty) return;
        
        if (this.history.length > 0) {
            historyEmpty.classList.add('hidden');
            if (clearHistoryContainer) clearHistoryContainer.classList.remove('hidden');
            
            historyList.innerHTML = '';
            this.history.forEach(entry => {
                const historyItem = this.createHistoryItem(entry);
                historyList.appendChild(historyItem);
            });
        } else {
            historyEmpty.classList.remove('hidden');
            if (clearHistoryContainer) clearHistoryContainer.classList.add('hidden');
            historyList.innerHTML = '';
        }
    }
    
    createHistoryItem(entry) {
        const item = document.createElement('div');
        const formattedDate = new Date(entry.date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const highestUrgency = this.getHighestUrgency(entry.conditions);
        const urgencyColor = this.getUrgencyColor(highestUrgency);
        
        item.className = `border rounded-lg overflow-hidden mb-4 ${urgencyColor}`;
        
        item.innerHTML = `
            <div class="p-4 flex justify-between items-center cursor-pointer history-header" data-entry-id="${entry.id}">
                <div class="flex items-center">
                    <svg class="h-5 w-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <div>
                        <h3 class="font-medium text-gray-900">
                            Check on ${formattedDate}
                        </h3>
                        <p class="text-sm text-gray-600">
                            ${entry.symptoms.length} symptoms reported
                        </p>
                    </div>
                </div>
                
                <button class="text-gray-500 hover:text-gray-700 expand-btn" aria-label="Expand">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </button>
            </div>
            
            <div class="history-content border-t border-gray-200 p-4 bg-white hidden">
                <div class="mb-4">
                    <h4 class="text-sm font-medium text-gray-700 mb-2">Symptoms Reported:</h4>
                    <div class="flex flex-wrap gap-2">
                        ${entry.symptoms.map(symptom => `
                            <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                ${symptom.name}${symptom.severity ? ` (${symptom.severity})` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <h4 class="text-sm font-medium text-gray-700 mb-2">Possible Conditions:</h4>
                    <div class="space-y-2">
                        ${entry.conditions.map(condition => `
                            <div class="border border-gray-200 rounded p-3">
                                <div class="flex justify-between items-center">
                                    <h5 class="font-medium">${condition.name}</h5>
                                    <span class="text-sm text-gray-500">
                                        ${Math.round(condition.probability * 100)}% match
                                    </span>
                                </div>
                                <p class="text-sm text-gray-600 mt-1">${condition.description}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Add expand/collapse functionality
        const header = item.querySelector('.history-header');
        const content = item.querySelector('.history-content');
        const expandBtn = item.querySelector('.expand-btn');
        
        if (header && content && expandBtn) {
            header.addEventListener('click', () => {
                const isExpanded = !content.classList.contains('hidden');
                
                if (isExpanded) {
                    content.classList.add('hidden');
                    expandBtn.innerHTML = `
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    `;
                } else {
                    content.classList.remove('hidden');
                    expandBtn.innerHTML = `
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                        </svg>
                    `;
                }
            });
        }
        
        return item;
    }
    
    getHighestUrgency(conditions) {
        const urgencyLevels = { 'emergency': 4, 'high': 3, 'medium': 2, 'low': 1 };
        let highestLevel = 'low';
        
        conditions.forEach(condition => {
            if (urgencyLevels[condition.urgency] > urgencyLevels[highestLevel]) {
                highestLevel = condition.urgency;
            }
        });
        
        return highestLevel;
    }
    
    getUrgencyColor(urgency) {
        switch (urgency) {
            case 'emergency': return 'border-red-300 bg-red-50';
            case 'high': return 'border-orange-300 bg-orange-50';
            case 'medium': return 'border-yellow-300 bg-yellow-50';
            default: return 'border-blue-300 bg-blue-50';
        }
    }
    
    clearHistory() {
        if (confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
            this.history = [];
            this.saveHistory();
            this.loadHistoryPage();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.symptomChecker = new SymptomChecker();
});