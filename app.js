// Professional Question Paper Generator - ENHANCED with CO Selection & Deletion
class ProfessionalQuestionPaperGenerator {
    constructor() {
        this.questions = [];
        this.lessons = [];
        this.nextId = 1;
        this.currentEditId = null;
        this.collegeInfo = {};
        this.subjectInfo = {};
        
        // Enhanced Learning level keywords for precise auto-detection
        this.learningKeywords = {
            'L1': {
                primary: ['define', 'list', 'name', 'state', 'what is', 'who is', 'when', 'where', 'recall', 'identify', 'recognize', 'mention', 'cite', 'enumerate'],
                secondary: ['give', 'write', 'tell', 'show', 'find', 'select', 'choose', 'indicate', 'point out', 'specify']
            },
            'L2': {
                primary: ['explain', 'describe', 'discuss', 'compare', 'contrast', 'interpret', 'understand', 'summarize', 'illustrate', 'outline', 'review'],
                secondary: ['how', 'why', 'what are', 'clarify', 'elaborate', 'detail', 'express', 'translate', 'paraphrase']
            },
            'L3': {
                primary: ['calculate', 'solve', 'apply', 'use', 'implement', 'demonstrate', 'show', 'find', 'determine', 'compute', 'execute'],
                secondary: ['employ', 'utilize', 'operate', 'practice', 'perform', 'carry out', 'put into practice', 'work out']
            },
            'L4': {
                primary: ['analyze', 'examine', 'investigate', 'distinguish', 'differentiate', 'break down', 'separate', 'dissect', 'categorize'],
                secondary: ['study', 'inspect', 'explore', 'scrutinize', 'compare and contrast', 'classify', 'organize', 'arrange']
            },
            'L5': {
                primary: ['evaluate', 'assess', 'judge', 'critique', 'justify', 'recommend', 'conclude', 'appraise', 'validate'],
                secondary: ['rate', 'rank', 'grade', 'measure', 'test', 'check', 'verify', 'prove', 'support', 'defend']
            },
            'L6': {
                primary: ['create', 'design', 'develop', 'construct', 'formulate', 'generate', 'produce', 'invent', 'build', 'make'],
                secondary: ['draw', 'sketch', 'plan', 'compose', 'write', 'devise', 'establish', 'originate', 'innovate', 'synthesize']
            }
        };
        
        this.initializeApp();
        this.bindEvents();
    }

    initializeApp() {
        const savedLessons = localStorage.getItem('collegeQuestionShufflerLessons');
        this.lessons = savedLessons ? JSON.parse(savedLessons) : [];
        
        const savedQuestions = localStorage.getItem('collegeQuestionShufflerQuestions');
        this.questions = savedQuestions ? JSON.parse(savedQuestions) : [];
        
        const savedCollegeInfo = localStorage.getItem('collegeQuestionShufflerCollegeInfo');
        this.collegeInfo = savedCollegeInfo ? JSON.parse(savedCollegeInfo) : {};
        
        const savedSubjectInfo = localStorage.getItem('collegeQuestionShufflerSubjectInfo');
        this.subjectInfo = savedSubjectInfo ? JSON.parse(savedSubjectInfo) : {};
        
        if (this.questions.length > 0) {
            this.nextId = Math.max(...this.questions.map(q => q.id)) + 1;
        }
        
        this.populateCollegeInfo();
        this.populateSubjectInfo();
        this.populateLessonDropdowns();
        this.updateUI();
        this.updateCOSelectionSection(); // NEW: Update CO selection for paper generation
    }

    bindEvents() {
        document.getElementById('saveCollegeInfo').addEventListener('click', () => {
            this.saveCollegeInfo();
        });

        document.getElementById('saveSubjectInfo').addEventListener('click', () => {
            this.saveSubjectInfo();
        });

        document.getElementById('questionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleQuestionSubmit();
        });

        document.getElementById('generateForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generatePaper();
        });

        document.getElementById('addLessonBtn').addEventListener('click', () => {
            this.addNewLesson();
        });

        document.getElementById('clearAllBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all questions? This action cannot be undone.')) {
                this.clearAllQuestions();
            }
        });

        // NEW: Clear all Course Outcomes button
        document.getElementById('clearAllLessonsBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all Course Outcomes? This action cannot be undone.')) {
                this.clearAllLessons();
            }
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.cancelEdit();
        });

        document.getElementById('printPaperBtn').addEventListener('click', () => {
            this.printPaper();
        });

        document.getElementById('regenerateBtn').addEventListener('click', () => {
            this.regeneratePaper();
        });

        document.getElementById('questionText').addEventListener('input', () => {
            this.enhancedAutoDetectLearningLevel();
        });

        document.getElementById('newLessonName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addNewLesson();
            }
        });
    }

    enhancedAutoDetectLearningLevel() {
        const questionText = document.getElementById('questionText').value;
        const detectedLevelSpan = document.getElementById('detectedLevel');
        
        if (!questionText.trim()) {
            detectedLevelSpan.innerHTML = 'AI will auto-detect';
            detectedLevelSpan.className = 'detected-level';
            return;
        }

        const questionLines = questionText.split(/\r?\n/);
        const firstQuestion = questionLines[0].trim();
        
        if (!firstQuestion) {
            detectedLevelSpan.innerHTML = 'AI will auto-detect';
            detectedLevelSpan.className = 'detected-level';
            return;
        }

        const detectedLevel = this.detectLearningLevelForText(firstQuestion);
        const confidence = this.calculateConfidence(firstQuestion, detectedLevel);
        const totalQuestions = questionLines.filter(line => line.trim().length > 0).length;

        const levelNames = {
            'L1': 'Remember', 'L2': 'Understand', 'L3': 'Apply',
            'L4': 'Analyze', 'L5': 'Evaluate', 'L6': 'Create'
        };

        if (totalQuestions > 1) {
            detectedLevelSpan.innerHTML = `${detectedLevel}: ${levelNames[detectedLevel]} <span class="confidence">${confidence}% confident</span><br><small>Individual detection for ${totalQuestions} questions</small>`;
        } else {
            detectedLevelSpan.innerHTML = `${detectedLevel}: ${levelNames[detectedLevel]} <span class="confidence">${confidence}% confident</span>`;
        }
        
        detectedLevelSpan.className = `detected-level ${detectedLevel.toLowerCase()}-detected`;
        this.detectedLearningLevel = detectedLevel;
    }

    calculateConfidence(text, detectedLevel) {
        const lowerText = text.toLowerCase();
        let score = 0;
        
        const keywords = this.learningKeywords[detectedLevel];
        if (keywords) {
            for (const keyword of keywords.primary) {
                if (lowerText.includes(keyword)) {
                    score += 30;
                }
            }
            for (const keyword of keywords.secondary) {
                if (lowerText.includes(keyword)) {
                    score += 15;
                }
            }
        }
        return Math.min(score, 100);
    }

    saveCollegeInfo() {
        this.collegeInfo = {
            name: document.getElementById('collegeName').value.trim(),
            location: document.getElementById('collegeLocation').value.trim(),
            department: document.getElementById('department').value.trim(),
            examType: document.getElementById('examType').value
        };
        
        localStorage.setItem('collegeQuestionShufflerCollegeInfo', JSON.stringify(this.collegeInfo));
        this.showSuccessMessage('College information saved successfully!');
    }

    saveSubjectInfo() {
        this.subjectInfo = {
            code: document.getElementById('subjectCode').value.trim(),
            name: document.getElementById('subjectName').value.trim(),
            yearSemBranch: document.getElementById('yearSemBranch').value.trim(),
            duration: document.getElementById('duration').value.trim()
        };
        
        localStorage.setItem('collegeQuestionShufflerSubjectInfo', JSON.stringify(this.subjectInfo));
        this.showSuccessMessage('Subject information saved successfully!');
    }

    populateCollegeInfo() {
        if (this.collegeInfo.name) {
            document.getElementById('collegeName').value = this.collegeInfo.name;
            document.getElementById('collegeLocation').value = this.collegeInfo.location || '';
            document.getElementById('department').value = this.collegeInfo.department || '';
            document.getElementById('examType').value = this.collegeInfo.examType || 'INTERNAL EXAMINATION - I';
        }
    }

    populateSubjectInfo() {
        if (this.subjectInfo.code) {
            document.getElementById('subjectCode').value = this.subjectInfo.code;
            document.getElementById('subjectName').value = this.subjectInfo.name || '';
            document.getElementById('yearSemBranch').value = this.subjectInfo.yearSemBranch || '';
            document.getElementById('duration').value = this.subjectInfo.duration || '3 Hrs';
        }
    }

    populateLessonDropdowns() {
        const lessonSelect = document.getElementById('lesson');
        lessonSelect.innerHTML = '<option value="">Select Course Outcome</option>';
        
        this.lessons.forEach(lesson => {
            const option = document.createElement('option');
            option.value = lesson;
            option.textContent = lesson;
            lessonSelect.appendChild(option);
        });
    }

    handleQuestionSubmit() {
        const lesson = document.getElementById('lesson').value;
        const marks = parseInt(document.getElementById('marks').value);
        const questionText = document.getElementById('questionText').value;
        const isOrType = document.getElementById('isOrType').value === 'true';

        if (!lesson || !marks || !questionText.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        if (this.currentEditId) {
            const learningLevel = this.detectedLearningLevel || this.detectLearningLevelForText(questionText);
            
            const questionIndex = this.questions.findIndex(q => q.id === this.currentEditId);
            if (questionIndex !== -1) {
                this.questions[questionIndex] = {
                    id: this.currentEditId,
                    question: questionText.trim(),
                    lesson: lesson,
                    marks: marks,
                    learningLevel: learningLevel,
                    isOrType: isOrType
                };
            }
            this.cancelEdit();
            this.clearForm();
            this.updateUI();
            this.showSuccessMessage('Question updated successfully!');
        } else {
            // BULK MODE - INDIVIDUAL DETECTION FOR EACH QUESTION
            const questionLines = questionText.split(/\r?\n/);
            const validQuestions = [];
            
            questionLines.forEach(line => {
                const cleanQuestion = line.trim();
                if (cleanQuestion && cleanQuestion.length > 0) {
                    const individualLevel = this.detectLearningLevelForText(cleanQuestion);
                    validQuestions.push({
                        text: cleanQuestion,
                        level: individualLevel
                    });
                }
            });

            if (validQuestions.length === 0) {
                alert('Please enter at least one valid question');
                return;
            }

            let detectionSummary = {};
            
            validQuestions.forEach(questionData => {
                const newQuestion = {
                    id: this.nextId++,
                    question: questionData.text,
                    lesson: lesson,
                    marks: marks,
                    learningLevel: questionData.level,
                    isOrType: isOrType
                };
                this.questions.push(newQuestion);
                detectionSummary[questionData.level] = (detectionSummary[questionData.level] || 0) + 1;
            });

            let summaryText = `${validQuestions.length} question(s) added with individual AI detection!\n`;
            Object.entries(detectionSummary).forEach(([level, count]) => {
                const levelNames = {
                    'L1': 'Remember', 'L2': 'Understand', 'L3': 'Apply',
                    'L4': 'Analyze', 'L5': 'Evaluate', 'L6': 'Create'
                };
                summaryText += `${level} (${levelNames[level]}): ${count} question${count > 1 ? 's' : ''}\n`;
            });

            this.clearForm();
            this.updateUI();
            this.saveData();
            this.showSuccessMessage(summaryText);
        }
    }

    detectLearningLevelForText(text) {
        const lowerText = text.toLowerCase();
        let scores = { 'L1': 0, 'L2': 0, 'L3': 0, 'L4': 0, 'L5': 0, 'L6': 0 };

        for (const [level, keywordGroups] of Object.entries(this.learningKeywords)) {
            for (const keyword of keywordGroups.primary) {
                if (lowerText.includes(keyword)) {
                    scores[level] += 3;
                }
            }
            for (const keyword of keywordGroups.secondary) {
                if (lowerText.includes(keyword)) {
                    scores[level] += 1;
                }
            }
        }

        if (lowerText.includes('define') && lowerText.includes('with example')) {
            scores['L2'] += 2;
        }
        
        if (lowerText.includes('calculate') || lowerText.includes('find the') || lowerText.includes('solve for')) {
            scores['L3'] += 3;
        }

        if (lowerText.includes('design') || lowerText.includes('create') || lowerText.includes('develop')) {
            scores['L6'] += 3;
        }

        if (lowerText.includes('compare') && lowerText.includes('contrast')) {
            scores['L4'] += 2;
        }

        let maxScore = 0;
        let detectedLevel = 'L2';
        
        for (const [level, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                detectedLevel = level;
            }
        }

        if (maxScore === 0) {
            if (lowerText.startsWith('what') || lowerText.startsWith('who') || lowerText.startsWith('when')) {
                return 'L1';
            } else if (lowerText.startsWith('how') || lowerText.startsWith('why')) {
                return 'L2';
            } else if (lowerText.includes('?')) {
                return 'L2';
            }
        }

        return detectedLevel;
    }

    addNewLesson() {
        const lessonName = document.getElementById('newLessonName').value.trim();
        
        if (!lessonName) {
            alert('Please enter a course outcome');
            return;
        }

        if (this.lessons.includes(lessonName)) {
            alert('This course outcome already exists');
            return;
        }

        this.lessons.push(lessonName);
        localStorage.setItem('collegeQuestionShufflerLessons', JSON.stringify(this.lessons));
        
        this.populateLessonDropdowns();
        document.getElementById('newLessonName').value = '';
        this.updateUI();
        this.updateCOSelectionSection(); // NEW: Update CO selection when adding new CO
        this.showSuccessMessage(`Course outcome "${lessonName}" added successfully!`);
    }

    // NEW: Delete specific Course Outcome
    deleteLesson(lessonName) {
        if (confirm(`Are you sure you want to delete "${lessonName}"? All questions under this course outcome will also be deleted.`)) {
            // Remove the lesson
            this.lessons = this.lessons.filter(lesson => lesson !== lessonName);
            
            // Remove all questions with this lesson
            this.questions = this.questions.filter(question => question.lesson !== lessonName);
            
            // Save to localStorage
            localStorage.setItem('collegeQuestionShufflerLessons', JSON.stringify(this.lessons));
            localStorage.setItem('collegeQuestionShufflerQuestions', JSON.stringify(this.questions));
            
            // Update UI
            this.populateLessonDropdowns();
            this.updateUI();
            this.updateCOSelectionSection();
            this.showSuccessMessage(`Course outcome "${lessonName}" and all its questions deleted successfully!`);
        }
    }

    // NEW: Clear all Course Outcomes
    clearAllLessons() {
        this.lessons = [];
        this.questions = []; // Also clear all questions since they depend on lessons
        
        localStorage.setItem('collegeQuestionShufflerLessons', JSON.stringify(this.lessons));
        localStorage.setItem('collegeQuestionShufflerQuestions', JSON.stringify(this.questions));
        
        this.populateLessonDropdowns();
        this.updateUI();
        this.updateCOSelectionSection();
        this.showSuccessMessage('All Course Outcomes and questions cleared successfully!');
    }

    saveData() {
        localStorage.setItem('collegeQuestionShufflerQuestions', JSON.stringify(this.questions));
    }

    editQuestion(id) {
        const question = this.questions.find(q => q.id === id);
        if (!question) return;

        document.getElementById('lesson').value = question.lesson;
        document.getElementById('marks').value = question.marks;
        document.getElementById('questionText').value = question.question;
        document.getElementById('isOrType').value = question.isOrType ? 'true' : 'false';

        const detectedLevelSpan = document.getElementById('detectedLevel');
        const levelNames = {
            'L1': 'Remember', 'L2': 'Understand', 'L3': 'Apply',
            'L4': 'Analyze', 'L5': 'Evaluate', 'L6': 'Create'
        };
        detectedLevelSpan.innerHTML = `${question.learningLevel}: ${levelNames[question.learningLevel]} <span class="confidence">Saved</span>`;
        detectedLevelSpan.className = `detected-level ${question.learningLevel.toLowerCase()}-detected`;

        this.currentEditId = id;
        const submitBtn = document.querySelector('#questionForm button[type="submit"] .btn-text');
        submitBtn.textContent = 'Update Question';
        document.getElementById('cancelEdit').style.display = 'inline-flex';
        document.getElementById('questionForm').scrollIntoView({ behavior: 'smooth' });
    }

    deleteQuestion(id) {
        if (confirm('Are you sure you want to delete this question?')) {
            this.questions = this.questions.filter(q => q.id !== id);
            this.updateUI();
            this.saveData();
            this.showSuccessMessage('Question deleted successfully!');
        }
    }

    cancelEdit() {
        this.currentEditId = null;
        const submitBtn = document.querySelector('#questionForm button[type="submit"] .btn-text');
        submitBtn.textContent = 'Add Question(s) with AI Detection';
        document.getElementById('cancelEdit').style.display = 'none';
        this.clearForm();
    }

    clearForm() {
        document.getElementById('questionForm').reset();
        const detectedLevelSpan = document.getElementById('detectedLevel');
        detectedLevelSpan.innerHTML = 'AI will auto-detect';
        detectedLevelSpan.className = 'detected-level';
        this.detectedLearningLevel = null;
    }

    clearAllQuestions() {
        this.questions = [];
        this.updateUI();
        this.saveData();
        this.showSuccessMessage('All questions cleared successfully!');
    }

    updateUI() {
        this.updateStatistics();
        this.updateQuestionBank();
        this.updateCOSelectionSection(); // NEW: Update CO selection whenever UI updates
    }

    updateStatistics() {
        const counts = this.getQuestionCounts();
        
        document.getElementById('count2mark').textContent = counts[2] || 0;
        document.getElementById('count4mark').textContent = counts[4] || 0;
        document.getElementById('count8mark').textContent = counts[8] || 0;
        document.getElementById('count13mark').textContent = counts[13] || 0;
        document.getElementById('count15mark').textContent = counts[15] || 0;
        document.getElementById('count16mark').textContent = counts[16] || 0;
        document.getElementById('countTotal').textContent = this.questions.length;
        document.getElementById('lessonsCount').textContent = this.lessons.length;
    }

    // NEW: Update Course Outcome Selection Section
    updateCOSelectionSection() {
        const coSelectionContainer = document.getElementById('coSelectionContainer');
        if (!coSelectionContainer) return; // Skip if element doesn't exist yet

        if (this.lessons.length === 0) {
            coSelectionContainer.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📚</span>
                    <p>No Course Outcomes added yet. Add some Course Outcomes to enable CO-wise selection.</p>
                </div>
            `;
            return;
        }

        // Get question counts per lesson
        const questionCounts = this.getQuestionCountsByLesson();

        let html = '<div class="co-selection-grid">';
        this.lessons.forEach(lesson => {
            const totalQuestions = questionCounts[lesson] || 0;
            const coCode = this.getCOCode(lesson);
            
            html += `
                <div class="co-selection-item glass-card">
                    <div class="co-header">
                        <h4 class="co-title">${coCode}</h4>
                        <span class="co-available">${totalQuestions} available</span>
                    </div>
                    <div class="co-lesson-name">${lesson}</div>
                    <div class="co-input-group">
                        <label for="co_${coCode}_2mark">2 Mark:</label>
                        <input type="number" id="co_${coCode}_2mark" min="0" max="${questionCounts[lesson + '_2'] || 0}" value="0" class="form-control glass-input co-input">
                        <span class="available-count">(${questionCounts[lesson + '_2'] || 0} available)</span>
                    </div>
                    <div class="co-input-group">
                        <label for="co_${coCode}_4mark">4 Mark:</label>
                        <input type="number" id="co_${coCode}_4mark" min="0" max="${questionCounts[lesson + '_4'] || 0}" value="0" class="form-control glass-input co-input">
                        <span class="available-count">(${questionCounts[lesson + '_4'] || 0} available)</span>
                    </div>
                    <div class="co-input-group">
                        <label for="co_${coCode}_8mark">8 Mark:</label>
                        <input type="number" id="co_${coCode}_8mark" min="0" max="${questionCounts[lesson + '_8'] || 0}" value="0" class="form-control glass-input co-input">
                        <span class="available-count">(${questionCounts[lesson + '_8'] || 0} available)</span>
                    </div>
                    <div class="co-input-group">
                        <label for="co_${coCode}_13mark">13 Mark:</label>
                        <input type="number" id="co_${coCode}_13mark" min="0" max="${questionCounts[lesson + '_13'] || 0}" value="0" class="form-control glass-input co-input">
                        <span class="available-count">(${questionCounts[lesson + '_13'] || 0} available)</span>
                    </div>
                    <div class="co-input-group">
                        <label for="co_${coCode}_15mark">15 Mark:</label>
                        <input type="number" id="co_${coCode}_15mark" min="0" max="${questionCounts[lesson + '_15'] || 0}" value="0" class="form-control glass-input co-input">
                        <span class="available-count">(${questionCounts[lesson + '_15'] || 0} available)</span>
                    </div>
                    <div class="co-input-group">
                        <label for="co_${coCode}_16mark">16 Mark:</label>
                        <input type="number" id="co_${coCode}_16mark" min="0" max="${questionCounts[lesson + '_16'] || 0}" value="0" class="form-control glass-input co-input">
                        <span class="available-count">(${questionCounts[lesson + '_16'] || 0} available)</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        coSelectionContainer.innerHTML = html;
    }

    // NEW: Get question counts by lesson and marks
    getQuestionCountsByLesson() {
        const counts = {};
        
        this.questions.forEach(question => {
            const lesson = question.lesson;
            const marks = question.marks;
            
            // Total count for lesson
            counts[lesson] = (counts[lesson] || 0) + 1;
            
            // Count by lesson and marks
            counts[lesson + '_' + marks] = (counts[lesson + '_' + marks] || 0) + 1;
        });
        
        return counts;
    }

    updateQuestionBank() {
        const container = document.getElementById('questionBankContent');
        
        if (this.questions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📝</span>
                    <p>No questions added yet. Add some questions to get started!</p>
                </div>
            `;
            return;
        }

        const questionsByLesson = this.groupQuestionsByLesson();
        
        let html = '';
        Object.keys(questionsByLesson).forEach(lesson => {
            html += this.renderLessonGroup(lesson, questionsByLesson[lesson]);
        });

        container.innerHTML = html;
        this.bindQuestionActions();
    }

    groupQuestionsByLesson() {
        const grouped = {};
        this.questions.forEach(question => {
            if (!grouped[question.lesson]) {
                grouped[question.lesson] = { 2: [], 4: [], 8: [], 13: [], 14: [], 15: [], 16: [] };
            }
            grouped[question.lesson][question.marks].push(question);
        });
        return grouped;
    }

    renderLessonGroup(lesson, questions) {
        let html = `<div class="lesson-group glass-lesson-group">`;
        html += `<div class="lesson-header">`;
        html += `<h3 class="lesson-title">${lesson}</h3>`;
        html += `<button class="btn btn-danger btn-small glass-btn delete-lesson-btn" data-lesson="${lesson}">`;
        html += `<span class="icon">🗑️</span> Delete CO</button>`;
        html += `</div>`;

        [2, 4, 8, 13, 14, 15, 16].forEach(marks => {
            if (questions[marks].length > 0) {
                html += `<div class="marks-group">`;
                html += `<h4 class="marks-title marks-${marks}">${marks} Mark Questions (${questions[marks].length})</h4>`;
                
                questions[marks].forEach(question => {
                    html += this.renderQuestionItem(question);
                });
                
                html += `</div>`;
            }
        });

        html += `</div>`;
        return html;
    }

    renderQuestionItem(question) {
        const orBadge = question.isOrType ? '<span class="or-badge">OR Type</span>' : '';
        const levelBadge = `<span class="learning-level-badge ${question.learningLevel?.toLowerCase()}">${question.learningLevel || 'L2'}</span>`;
        
        return `
            <div class="question-item glass-question-item">
                <div class="question-meta">
                    <span class="question-id">ID: ${question.id}</span>
                    <span class="question-marks">${question.marks} marks</span>
                    ${levelBadge}
                    ${orBadge}
                </div>
                <div class="question-text">${question.question}</div>
                <div class="question-actions">
                    <button class="btn btn-secondary btn-small glass-btn edit-btn" data-id="${question.id}">
                        <span class="icon">✏️</span>
                        <span class="btn-text">Edit</span>
                    </button>
                    <button class="btn btn-danger btn-small glass-btn delete-btn" data-id="${question.id}">
                        <span class="icon">🗑️</span>
                        <span class="btn-text">Delete</span>
                    </button>
                </div>
            </div>
        `;
    }

    bindQuestionActions() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.editQuestion(id);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.deleteQuestion(id);
            });
        });

        // NEW: Bind delete lesson buttons
        document.querySelectorAll('.delete-lesson-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lesson = e.currentTarget.dataset.lesson;
                this.deleteLesson(lesson);
            });
        });
    }

    getQuestionCounts() {
        const counts = {};
        this.questions.forEach(question => {
            counts[question.marks] = (counts[question.marks] || 0) + 1;
        });
        return counts;
    }

    generatePaper() {
        if (!this.collegeInfo.name) {
            alert('Please save college information first');
            return;
        }
        
        if (!this.subjectInfo.code) {
            alert('Please save subject information first');
            return;
        }

        const examDate = document.getElementById('examDate').value.trim();
        const maxMarks = document.getElementById('maxMarks').value;
        
        if (!examDate) {
            alert('Please enter exam date and session');
            return;
        }

        // NEW: Use Course Outcome-specific selection
        const coSelections = this.getCOSelections();
        
        if (coSelections.totalQuestions === 0) {
            alert('Please specify at least one question from any Course Outcome');
            return;
        }

        // Check if we have enough questions for each CO selection
        const availability = this.checkCOAvailability(coSelections);
        if (!availability.sufficient) {
            alert(availability.message);
            return;
        }

        const paper = this.createProfessionalQuestionPaperWithCO({
            coSelections,
            examDate,
            maxMarks,
            includeOrQuestions: document.getElementById('includeOrQuestions').value === 'true'
        });
        
        this.displayGeneratedPaper(paper);
    }

    // NEW: Get Course Outcome selections from form
    getCOSelections() {
        const selections = {
            byLesson: {},
            totalQuestions: 0
        };

        this.lessons.forEach(lesson => {
            const coCode = this.getCOCode(lesson);
            const lessonSelections = {
                2: parseInt(document.getElementById(`co_${coCode}_2mark`).value) || 0,
                4: parseInt(document.getElementById(`co_${coCode}_4mark`).value) || 0,
                8: parseInt(document.getElementById(`co_${coCode}_8mark`).value) || 0,
                13: parseInt(document.getElementById(`co_${coCode}_13mark`).value) || 0,
                15: parseInt(document.getElementById(`co_${coCode}_15mark`).value) || 0,
                16: parseInt(document.getElementById(`co_${coCode}_16mark`).value) || 0
            };

            const totalForLesson = Object.values(lessonSelections).reduce((sum, count) => sum + count, 0);
            
            if (totalForLesson > 0) {
                selections.byLesson[lesson] = lessonSelections;
                selections.totalQuestions += totalForLesson;
            }
        });

        return selections;
    }

    // NEW: Check if we have enough questions for CO selections
    checkCOAvailability(coSelections) {
        const questionCounts = this.getQuestionCountsByLesson();

        for (const [lesson, selections] of Object.entries(coSelections.byLesson)) {
            for (const [marks, needed] of Object.entries(selections)) {
                const available = questionCounts[lesson + '_' + marks] || 0;
                if (needed > available) {
                    return {
                        sufficient: false,
                        message: `Not enough ${marks}-mark questions for ${this.getCOCode(lesson)}. Available: ${available}, Required: ${needed}`
                    };
                }
            }
        }

        return { sufficient: true };
    }

    createProfessionalQuestionPaperWithCO(config) {
        const paper = {
            header: {
                collegeInfo: this.collegeInfo,
                subjectInfo: this.subjectInfo,
                examDate: config.examDate,
                maxMarks: config.maxMarks
            },
            sections: {}
        };

        // Generate sections based on CO selections
        const allSelectedQuestions = { 2: [], 4: [], 8: [], 13: [], 14: [], 15: [], 16: [] };

        for (const [lesson, selections] of Object.entries(config.coSelections.byLesson)) {
            for (const [marks, count] of Object.entries(selections)) {
                if (count > 0) {
                    const questionsForThisCO = this.selectQuestionsFromLesson(lesson, parseInt(marks), count, config.includeOrQuestions);
                    allSelectedQuestions[marks] = allSelectedQuestions[marks].concat(questionsForThisCO);
                }
            }
        }

        // Shuffle questions within each mark category
        Object.keys(allSelectedQuestions).forEach(marks => {
            if (allSelectedQuestions[marks].length > 0) {
                paper.sections[marks] = this.shuffleArray(allSelectedQuestions[marks]);
            }
        });

        return paper;
    }

    // NEW: Select questions from specific lesson
    selectQuestionsFromLesson(lesson, marks, count, includeOrQuestions) {
        let availableQuestions = this.questions.filter(q => q.lesson === lesson && q.marks === marks);
        
        if (!includeOrQuestions) {
            availableQuestions = availableQuestions.filter(q => !q.isOrType);
        }

        // Randomly select the required number of questions
        const selected = [];
        const shuffled = this.shuffleArray([...availableQuestions]);
        
        for (let i = 0; i < Math.min(count, shuffled.length); i++) {
            selected.push(shuffled[i]);
        }

        return selected;
    }

    createProfessionalQuestionPaper(config) {
        // This is the old method, kept for backward compatibility
        // but we'll use the new CO-based method
        return this.createProfessionalQuestionPaperWithCO({
            coSelections: this.getDefaultCOSelections(config),
            examDate: config.examDate,
            maxMarks: config.maxMarks,
            includeOrQuestions: config.includeOrQuestions
        });
    }

    getDefaultCOSelections(config) {
        // Convert old-style selections to CO-based selections
        // This distributes questions evenly across all available COs
        const selections = { byLesson: {}, totalQuestions: 0 };
        
        if (this.lessons.length === 0) return selections;

        const markCategories = [
            { marks: 2, count: config.num2mark || 0 },
            { marks: 4, count: config.num4mark || 0 },
            { marks: 8, count: config.num8mark || 0 },
            { marks: 13, count: config.num13mark || 0 },
            { marks: 14, count: config.num14mark || 0 },
            { marks: 15, count: config.num15mark || 0 },
            { marks: 16, count: config.num16mark || 0 }
        ];

        // Distribute questions evenly across lessons
        this.lessons.forEach(lesson => {
            selections.byLesson[lesson] = { 2: 0, 4: 0, 8: 0, 13: 0, 14: 0, 15: 0, 16: 0 };
        });

        markCategories.forEach(({ marks, count }) => {
            let remaining = count;
            let lessonIndex = 0;

            while (remaining > 0 && this.lessons.length > 0) {
                const lesson = this.lessons[lessonIndex];
                selections.byLesson[lesson][marks]++;
                remaining--;
                selections.totalQuestions++;
                lessonIndex = (lessonIndex + 1) % this.lessons.length;
            }
        });

        return selections;
    }

    selectQuestionsBalanced(marks, count, includeOrQuestions) {
        if (count === 0) return [];

        let availableQuestions = this.questions.filter(q => q.marks === marks);
        
        if (!includeOrQuestions) {
            availableQuestions = availableQuestions.filter(q => !q.isOrType);
        }

        const questionsByLesson = {};
        availableQuestions.forEach(q => {
            if (!questionsByLesson[q.lesson]) {
                questionsByLesson[q.lesson] = [];
            }
            questionsByLesson[q.lesson].push(q);
        });

        const lessons = Object.keys(questionsByLesson);
        const selected = [];
        
        for (let i = 0; i < count; i++) {
            const lessonIndex = i % lessons.length;
            const lesson = lessons[lessonIndex];
            
            if (questionsByLesson[lesson] && questionsByLesson[lesson].length > 0) {
                const randomIndex = Math.floor(Math.random() * questionsByLesson[lesson].length);
                const selectedQuestion = questionsByLesson[lesson].splice(randomIndex, 1)[0];
                selected.push(selectedQuestion);
            }
        }

        return this.shuffleArray(selected);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    displayGeneratedPaper(paper) {
        const container = document.getElementById('generatedPaperContent');
        
        let html = this.generateProfessionalHeader(paper.header);
        
        let questionNumber = 1;
        
        if (paper.sections['2'] && paper.sections['2'].length > 0) {
            const totalMarks = paper.sections['2'].length * 2;
            html += `<div class="paper-section">
                <h3 class="section-header">Part-A (${paper.sections['2'].length} x 2 = ${totalMarks} Marks)</h3>
                ${this.generateQuestionSection(paper.sections['2'], questionNumber, 'A')}
            </div>`;
            questionNumber += paper.sections['2'].length;
        }

        const higherMarkSections = ['4', '8', '13', '14', '15', '16'].filter(marks => 
            paper.sections[marks] && paper.sections[marks].length > 0
        );

        if (higherMarkSections.length > 0) {
            let partBQuestions = [];
            higherMarkSections.forEach(marks => {
                partBQuestions = partBQuestions.concat(paper.sections[marks]);
            });
            
            const totalMarks = partBQuestions.reduce((sum, q) => sum + q.marks, 0);
            html += `<div class="paper-section">
                <h3 class="section-header">Part-B (${partBQuestions.length} Questions = ${totalMarks} Marks)</h3>
                ${this.generateQuestionSection(partBQuestions, questionNumber, 'B')}
            </div>`;
        }

        html += `<div class="paper-footer">
            <p class="learning-levels"><strong>L1 – Remember, L2 – Understand, L3 – Apply, L4 – Analyze, L5 – Evaluate, L6 – Create</strong></p>
        </div>`;

        container.innerHTML = html;
        
        const section = document.getElementById('generatedPaperSection');
        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth' });
        
        this.showSuccessMessage('Professional question paper generated with Course Outcome-wise selection!');
    }

    generateProfessionalHeader(header) {
        return `
            <div class="paper-header-section">
                <div class="reg-number-box">
                    <strong>REG. NUMBER:</strong>
                    <div class="reg-boxes">
                        ${Array(12).fill('<div class="reg-box"></div>').join('')}
                    </div>
                </div>
                
                <div class="college-header">
                    <h1 class="college-name">${header.collegeInfo.name || 'COLLEGE NAME'}</h1>
                    <p class="college-location">${header.collegeInfo.location || 'LOCATION'}</p>
                    <p class="department"><strong>DEPARTMENT OF ${header.collegeInfo.department || 'ENGINEERING'}</strong></p>
                    <p class="exam-type"><strong>${header.collegeInfo.examType || 'INTERNAL EXAMINATION - I'}</strong></p>
                </div>

                <table class="subject-info-table">
                    <tr>
                        <td><strong>Subject Code</strong></td>
                        <td><strong>:</strong></td>
                        <td>${header.subjectInfo.code || 'CODE'}</td>
                        <td><strong>Date & Session</strong></td>
                        <td><strong>:</strong></td>
                        <td>${header.examDate || 'DATE & SESSION'}</td>
                    </tr>
                    <tr>
                        <td><strong>Subject Name</strong></td>
                        <td><strong>:</strong></td>
                        <td>${header.subjectInfo.name || 'SUBJECT NAME'}</td>
                        <td><strong>Duration</strong></td>
                        <td><strong>:</strong></td>
                        <td>${header.subjectInfo.duration || '3 Hrs'}</td>
                    </tr>
                    <tr>
                        <td><strong>Year/Sem./Branch</strong></td>
                        <td><strong>:</strong></td>
                        <td>${header.subjectInfo.yearSemBranch || 'YEAR/SEM/BRANCH'}</td>
                        <td><strong>Max. Marks</strong></td>
                        <td><strong>:</strong></td>
                        <td>${header.maxMarks || '100'}</td>
                    </tr>
                </table>
            </div>
        `;
    }

    generateQuestionSection(questions, startNumber, section) {
        let html = '<table class="questions-table">';
        
        questions.forEach((question, index) => {
            const questionNum = startNumber + index;
            const coCode = this.getCOCode(question.lesson);
            
            html += `
                <tr class="question-row">
                    <td class="q-number"><strong>${questionNum}</strong></td>
                    <td class="q-text">${question.question}</td>
                    <td class="q-level">${question.learningLevel || 'L2'}</td>
                    <td class="q-co">${coCode}</td>
                    <td class="q-marks">${question.marks}</td>
                </tr>
            `;
            
            if (question.isOrType && questions[index + 1]?.isOrType) {
                html += `
                    <tr class="or-row">
                        <td colspan="5" class="or-text"><strong>[OR]</strong></td>
                    </tr>
                `;
            }
        });
        
        html += '</table>';
        return html;
    }

    getCOCode(lessonName) {
        const match = lessonName.match(/^(CO\d+)/i);
        if (match) {
            return match[1].toUpperCase();
        }
        
        const index = this.lessons.findIndex(l => l === lessonName) + 1;
        return `CO${index}`;
    }

    regeneratePaper() {
        this.generatePaper();
    }

    printPaper() {
        const paperContent = document.getElementById('generatedPaperContent').innerHTML;
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Question Paper</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 20px;
                        font-size: 12px;
                        line-height: 1.4;
                    }
                    .college-name {
                        font-size: 18px;
                        font-weight: bold;
                        text-align: center;
                        margin: 10px 0;
                    }
                    .college-location {
                        text-align: center;
                        font-weight: bold;
                        margin: 5px 0;
                    }
                    .department {
                        text-align: center;
                        margin: 10px 0;
                    }
                    .exam-type {
                        text-align: center;
                        font-size: 16px;
                        margin: 15px 0;
                    }
                    .subject-info-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    .subject-info-table td {
                        padding: 5px 10px;
                        border: 1px solid #333;
                    }
                    .section-header {
                        text-align: center;
                        font-weight: bold;
                        margin: 20px 0 10px 0;
                        background: #f0f0f0;
                        padding: 8px;
                        border: 1px solid #333;
                    }
                    .questions-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 10px 0;
                    }
                    .questions-table td {
                        padding: 8px;
                        border: 1px solid #333;
                        vertical-align: top;
                    }
                    .q-number {
                        width: 5%;
                        text-align: center;
                        font-weight: bold;
                    }
                    .q-text {
                        width: 70%;
                    }
                    .q-level {
                        width: 8%;
                        text-align: center;
                    }
                    .q-co {
                        width: 8%;
                        text-align: center;
                    }
                    .q-marks {
                        width: 9%;
                        text-align: center;
                    }
                    .or-text {
                        text-align: center;
                        font-weight: bold;
                        background: #f9f9f9;
                    }
                    .learning-levels {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 11px;
                        font-weight: bold;
                    }
                    .reg-number-box {
                        text-align: right;
                        margin-bottom: 20px;
                    }
                    .reg-boxes {
                        display: inline-block;
                        margin-left: 10px;
                    }
                    .reg-box {
                        display: inline-block;
                        width: 20px;
                        height: 20px;
                        border: 1px solid #333;
                        margin: 0 2px;
                    }
                    @media print {
                        body { margin: 15px; }
                        .question-row { break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                ${paperContent}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }

    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10B981, #059669);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            backdrop-filter: blur(10px);
            z-index: 1000;
            font-weight: 600;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            border: 1px solid rgba(255,255,255,0.2);
            max-width: 350px;
            white-space: pre-line;
        `;
        toast.innerHTML = `<span style="margin-right: 8px;">✅</span>${message}`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ProfessionalQuestionPaperGenerator();
});