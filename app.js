// Professional Question Paper Generator - College Standard
class ProfessionalQuestionPaperGenerator {
    constructor() {
        this.questions = [];
        this.lessons = [];
        this.nextId = 1;
        this.currentEditId = null;
        this.collegeInfo = {};
        this.subjectInfo = {};
        
        // Learning level keywords for auto-detection
        this.learningKeywords = {
            'L1': ['define', 'list', 'name', 'state', 'what is', 'who', 'when', 'where', 'recall', 'identify', 'recognize'],
            'L2': ['explain', 'describe', 'discuss', 'compare', 'contrast', 'interpret', 'understand', 'summarize'],
            'L3': ['calculate', 'solve', 'apply', 'use', 'implement', 'demonstrate', 'show', 'find'],
            'L4': ['analyze', 'examine', 'investigate', 'distinguish', 'differentiate', 'break down', 'separate'],
            'L5': ['evaluate', 'assess', 'judge', 'critique', 'justify', 'recommend', 'conclude'],
            'L6': ['create', 'design', 'develop', 'construct', 'formulate', 'generate', 'produce', 'invent', 'draw', 'sketch']
        };
        
        this.initializeApp();
        this.bindEvents();
    }

    initializeApp() {
        // Load all data from localStorage
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
    }

    bindEvents() {
        // College info save
        document.getElementById('saveCollegeInfo').addEventListener('click', () => {
            this.saveCollegeInfo();
        });

        // Subject info save
        document.getElementById('saveSubjectInfo').addEventListener('click', () => {
            this.saveSubjectInfo();
        });

        // Question form submission
        document.getElementById('questionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleQuestionSubmit();
        });

        // Generate paper form
        document.getElementById('generateForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generatePaper();
        });

        // Add course outcome button
        document.getElementById('addLessonBtn').addEventListener('click', () => {
            this.addNewLesson();
        });

        // Clear all button
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all questions? This action cannot be undone.')) {
                this.clearAllQuestions();
            }
        });

        // Cancel edit button
        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.cancelEdit();
        });

        // Print and regenerate buttons
        document.getElementById('printPaperBtn').addEventListener('click', () => {
            this.printPaper();
        });

        document.getElementById('regenerateBtn').addEventListener('click', () => {
            this.regeneratePaper();
        });

        // Auto-detect learning level when question text changes
        document.getElementById('questionText').addEventListener('input', () => {
            this.autoDetectLearningLevel();
        });

        // New lesson input enter key
        document.getElementById('newLessonName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addNewLesson();
            }
        });
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

    autoDetectLearningLevel() {
        const questionText = document.getElementById('questionText').value.toLowerCase();
        const learningLevelSelect = document.getElementById('learningLevel');
        
        if (!questionText.trim()) return;

        // Check for keywords in each learning level
        for (const [level, keywords] of Object.entries(this.learningKeywords)) {
            for (const keyword of keywords) {
                if (questionText.includes(keyword.toLowerCase())) {
                    learningLevelSelect.value = level;
                    return;
                }
            }
        }
        
        // Default to L2 if no keywords found
        if (learningLevelSelect.value === '') {
            learningLevelSelect.value = 'L2';
        }
    }

    handleQuestionSubmit() {
        const lesson = document.getElementById('lesson').value;
        const marks = parseInt(document.getElementById('marks').value);
        const questionText = document.getElementById('questionText').value;
        let learningLevel = document.getElementById('learningLevel').value;
        const isOrType = document.getElementById('isOrType').value === 'true';

        if (!lesson || !marks || !questionText.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        // Auto-detect learning level if not selected
        if (!learningLevel) {
            this.autoDetectLearningLevel();
            learningLevel = document.getElementById('learningLevel').value;
        }

        if (this.currentEditId) {
            // Update existing question
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
            // Add multiple questions (bulk mode)
            const questionLines = questionText.split(/\r?\n/);
            const validQuestions = [];
            
            questionLines.forEach(line => {
                const cleanQuestion = line.trim();
                if (cleanQuestion && cleanQuestion.length > 0) {
                    validQuestions.push(cleanQuestion);
                }
            });

            if (validQuestions.length === 0) {
                alert('Please enter at least one valid question');
                return;
            }

            // Add each question
            validQuestions.forEach(questionLine => {
                const newQuestion = {
                    id: this.nextId++,
                    question: questionLine,
                    lesson: lesson,
                    marks: marks,
                    learningLevel: learningLevel,
                    isOrType: isOrType
                };
                this.questions.push(newQuestion);
            });

            this.clearForm();
            this.updateUI();
            this.saveData();
            this.showSuccessMessage(`${validQuestions.length} question(s) added successfully!`);
        }
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
        this.showSuccessMessage(`Course outcome "${lessonName}" added successfully!`);
    }

    saveData() {
        localStorage.setItem('collegeQuestionShufflerQuestions', JSON.stringify(this.questions));
    }

    editQuestion(id) {
        const question = this.questions.find(q => q.id === id);
        if (!question) return;

        // Populate form with question data
        document.getElementById('lesson').value = question.lesson;
        document.getElementById('marks').value = question.marks;
        document.getElementById('questionText').value = question.question;
        document.getElementById('learningLevel').value = question.learningLevel || 'L2';
        document.getElementById('isOrType').value = question.isOrType ? 'true' : 'false';

        // Update UI for edit mode
        this.currentEditId = id;
        const submitBtn = document.querySelector('#questionForm button[type="submit"] .btn-text');
        submitBtn.textContent = 'Update Question';
        document.getElementById('cancelEdit').style.display = 'inline-flex';

        // Scroll to form
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
        submitBtn.textContent = 'Add Question(s)';
        document.getElementById('cancelEdit').style.display = 'none';
        this.clearForm();
    }

    clearForm() {
        document.getElementById('questionForm').reset();
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
    }

    updateStatistics() {
        const counts = this.getQuestionCounts();
        
        document.getElementById('count2mark').textContent = counts[2] || 0;
        document.getElementById('count4mark').textContent = counts[4] || 0;
        document.getElementById('count8mark').textContent = counts[8] || 0;
        document.getElementById('count13mark').textContent = counts[13] || 0;
        document.getElementById('count15mark').textContent = counts[15] || 0;
        document.getElementById('countTotal').textContent = this.questions.length;
        document.getElementById('lessonsCount').textContent = this.lessons.length;
    }

    updateQuestionBank() {
        const container = document.getElementById('questionBankContent');
        
        if (this.questions.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No questions added yet. Add some questions to get started!</p></div>';
            return;
        }

        // Group questions by lesson and marks
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
        let html = `<div class="lesson-group">`;
        html += `<h3 class="lesson-title">${lesson}</h3>`;

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
        return `
            <div class="question-item">
                <div class="question-meta">
                    <span>ID: ${question.id}</span>
                    <span>${question.marks} marks</span>
                    <span class="learning-level">${question.learningLevel}</span>
                    ${orBadge}
                </div>
                <div class="question-text">${question.question}</div>
                <div class="question-actions">
                    <button class="btn btn-secondary btn-small edit-btn" data-id="${question.id}">
                        <span class="btn-text">Edit</span>
                    </button>
                    <button class="btn btn-danger btn-small delete-btn" data-id="${question.id}">
                        <span class="btn-text">Delete</span>
                    </button>
                </div>
            </div>
        `;
    }

    bindQuestionActions() {
        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.editQuestion(id);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.deleteQuestion(id);
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
        // Validate required information
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

        const num2mark = parseInt(document.getElementById('num2mark').value) || 0;
        const num4mark = parseInt(document.getElementById('num4mark').value) || 0;
        const num8mark = parseInt(document.getElementById('num8mark').value) || 0;
        const num13mark = parseInt(document.getElementById('num13mark').value) || 0;
        const num15mark = parseInt(document.getElementById('num15mark').value) || 0;
        const includeOrQuestions = document.getElementById('includeOrQuestions').value === 'true';

        if (num2mark + num4mark + num8mark + num13mark + num15mark === 0) {
            alert('Please specify at least one question to generate a paper');
            return;
        }

        // Check if we have enough questions
        const counts = this.getQuestionCounts();
        const requirements = [
            {marks: 2, needed: num2mark, available: counts[2] || 0},
            {marks: 4, needed: num4mark, available: counts[4] || 0},
            {marks: 8, needed: num8mark, available: counts[8] || 0},
            {marks: 13, needed: num13mark, available: counts[13] || 0},
            {marks: 15, needed: num15mark, available: counts[15] || 0}
        ];

        for (const req of requirements) {
            if (req.needed > req.available) {
                alert(`Not enough ${req.marks}-mark questions. Available: ${req.available}, Required: ${req.needed}`);
                return;
            }
        }

        // Generate the paper
        const paper = this.createProfessionalQuestionPaper({
            num2mark, num4mark, num8mark, num13mark, num15mark,
            examDate, maxMarks, includeOrQuestions
        });
        
        this.displayGeneratedPaper(paper);
    }

    createProfessionalQuestionPaper(config) {
        const paper = {
            header: {
                collegeInfo: this.collegeInfo,
                subjectInfo: this.subjectInfo,
                examDate: config.examDate,
                maxMarks: config.maxMarks
            },
            sections: {}
        };

        // Generate sections
        if (config.num2mark > 0) {
            paper.sections['2'] = this.selectQuestionsBalanced(2, config.num2mark, config.includeOrQuestions);
        }
        if (config.num4mark > 0) {
            paper.sections['4'] = this.selectQuestionsBalanced(4, config.num4mark, config.includeOrQuestions);
        }
        if (config.num8mark > 0) {
            paper.sections['8'] = this.selectQuestionsBalanced(8, config.num8mark, config.includeOrQuestions);
        }
        if (config.num13mark > 0) {
            paper.sections['13'] = this.selectQuestionsBalanced(13, config.num13mark, config.includeOrQuestions);
        }
        if (config.num15mark > 0) {
            paper.sections['15'] = this.selectQuestionsBalanced(15, config.num15mark, config.includeOrQuestions);
        }

        return paper;
    }

    selectQuestionsBalanced(marks, count, includeOrQuestions) {
        if (count === 0) return [];

        // Get all questions for this mark category
        let availableQuestions = this.questions.filter(q => q.marks === marks);
        
        // Filter OR questions if needed
        if (!includeOrQuestions) {
            availableQuestions = availableQuestions.filter(q => !q.isOrType);
        }

        // Group by lesson (Course Outcome)
        const questionsByLesson = {};
        availableQuestions.forEach(q => {
            if (!questionsByLesson[q.lesson]) {
                questionsByLesson[q.lesson] = [];
            }
            questionsByLesson[q.lesson].push(q);
        });

        const lessons = Object.keys(questionsByLesson);
        const selected = [];
        
        // Distribute questions equally across lessons
        for (let i = 0; i < count; i++) {
            const lessonIndex = i % lessons.length;
            const lesson = lessons[lessonIndex];
            
            if (questionsByLesson[lesson] && questionsByLesson[lesson].length > 0) {
                // Remove a random question from this lesson
                const randomIndex = Math.floor(Math.random() * questionsByLesson[lesson].length);
                const selectedQuestion = questionsByLesson[lesson].splice(randomIndex, 1)[0];
                selected.push(selectedQuestion);
            }
        }

        // Shuffle the final selection
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
        
        // Generate question sections
        let questionNumber = 1;
        
        // Part A - 2 marks
        if (paper.sections['2'] && paper.sections['2'].length > 0) {
            const totalMarks = paper.sections['2'].length * 2;
            html += `<div class="paper-section">
                <h3 class="section-header">Part-A (${paper.sections['2'].length} x 2 = ${totalMarks} Marks)</h3>
                ${this.generateQuestionSection(paper.sections['2'], questionNumber, 'A')}
            </div>`;
            questionNumber += paper.sections['2'].length;
        }

        // Part B - Higher marks (4, 8, 13, 15)
        const higherMarkSections = ['4', '8', '13', '15'].filter(marks => 
            paper.sections[marks] && paper.sections[marks].length > 0
        );

        if (higherMarkSections.length > 0) {
            let partBQuestions = [];
            higherMarkSections.forEach(marks => {
                partBQuestions = partBQuestions.concat(paper.sections[marks]);
            });
            
            const totalMarks = partBQuestions.reduce((sum, q) => sum + q.marks, 0);
            html += `<div class="paper-section">
                <h3 class="section-header">Part-B (${partBQuestions.length} x ${higherMarkSections.join('/')}} = ${totalMarks} Marks)</h3>
                ${this.generateQuestionSection(partBQuestions, questionNumber, 'B')}
            </div>`;
        }

        // Learning levels legend
        html += `<div class="paper-footer">
            <p class="learning-levels"><strong>L1 – Remember, L2 – Understand, L3 – Apply, L4 – Analyze, L5 – Evaluate, L6 – Create</strong></p>
        </div>`;

        container.innerHTML = html;
        
        // Show the generated paper section
        const section = document.getElementById('generatedPaperSection');
        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth' });
        
        this.showSuccessMessage('Professional question paper generated successfully!');
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
            
            // Add OR question if it's an OR type
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
        // Extract CO code from lesson name (e.g., "CO1: Description" -> "CO1")
        const match = lessonName.match(/^(CO\d+)/i);
        if (match) {
            return match[1].toUpperCase();
        }
        
        // If no CO code found, generate based on position
        const index = this.lessons.findIndex(l => l === lessonName) + 1;
        return `CO${index}`;
    }

    regeneratePaper() {
        this.generatePaper();
    }

    printPaper() {
        // Create a new window with just the paper content
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
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10B981;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ProfessionalQuestionPaperGenerator();
});