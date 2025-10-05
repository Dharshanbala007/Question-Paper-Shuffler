// Question Paper Shuffler Application
class QuestionPaperShuffler {
    constructor() {
        this.questions = [];
        this.lessons = [];
        this.nextId = 1;
        this.currentEditId = null;
        
        this.initializeApp();
        this.bindEvents();
        this.loadSampleData();
    }

    initializeApp() {
    // Load lessons from localStorage if available, else use empty array
    const savedLessons = localStorage.getItem('questionShufflerLessons');
    this.lessons = savedLessons ? JSON.parse(savedLessons) : [];
    
    // Start with empty questions
    this.questions = [];
    this.nextId = 1;
    
    this.populateLessonDropdowns();
    this.updateUI();
}

    bindEvents() {
        // Form submission
        document.getElementById('questionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleQuestionSubmit();
        });

        // Generate paper form
        document.getElementById('generateForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generatePaper();
        });

        // Add lesson button
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

        // Print paper button
        document.getElementById('printPaperBtn').addEventListener('click', () => {
            this.printPaper();
        });

        // Regenerate paper button
        document.getElementById('regenerateBtn').addEventListener('click', () => {
            this.regeneratePaper();
        });

        // New lesson input enter key
        document.getElementById('newLessonName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addNewLesson();
            }
        });
    }

    populateLessonDropdowns() {
        const lessonSelect = document.getElementById('lesson');
        lessonSelect.innerHTML = '<option value="">Select a lesson</option>';
        
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

    if (!lesson || !marks || !questionText) {
        alert('Please fill in all fields');
        return;
    }

    // Split by line breaks and filter empty lines
    const questions = questionText.split('\n').filter(q => q.trim() !== '');
    
    questions.forEach(q => {
        this.questions.push({
            id: this.nextId++,
            question: q.trim(),
            lesson: lesson,
            marks: marks
        });
    });

    this.clearForm();
    this.updateUI();
    this.showSuccessMessage(`${questions.length} questions added!`);
}


    addNewLesson() {
        const lessonName = document.getElementById('newLessonName').value.trim();
        
        if (!lessonName) {
            alert('Please enter a lesson name');
            return;
        }

        if (this.lessons.includes(lessonName)) {
            alert('This lesson already exists');
            return;
        }

        this.lessons.push(lessonName);
        // Save lessons to localStorage
        localStorage.setItem('questionShufflerLessons', JSON.stringify(this.lessons));
        this.populateLessonDropdowns();
        document.getElementById('newLessonName').value = '';
        this.updateUI();
        this.showSuccessMessage(`Lesson "${lessonName}" added successfully!`);
    }

    editQuestion(id) {
        const question = this.questions.find(q => q.id === id);
        if (!question) return;

        // Populate form with question data
        document.getElementById('lesson').value = question.lesson;
        document.getElementById('marks').value = question.marks;
        document.getElementById('questionText').value = question.question;

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
            this.showSuccessMessage('Question deleted successfully!');
        }
    }

    cancelEdit() {
        this.currentEditId = null;
        const submitBtn = document.querySelector('#questionForm button[type="submit"] .btn-text');
        submitBtn.textContent = 'Add Question';
        document.getElementById('cancelEdit').style.display = 'none';
        this.clearForm();
    }

    clearForm() {
        document.getElementById('questionForm').reset();
    }

    clearAllQuestions() {
        this.questions = [];
        this.updateUI();
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
        document.getElementById('count16mark').textContent = counts[16] || 0;
        document.getElementById('countTotal').textContent = this.questions.length;
        document.getElementById('lessonsCount').textContent = this.lessons.length;
    }

    updateQuestionBank() {
        const container = document.getElementById('questionBankContent');
        
        if (this.questions.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No questions added yet. Add some questions to get started!</p></div>';
            return;
        }

        // Group questions by lesson
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
                grouped[question.lesson] = { 2: [], 4: [], 16: [] };
            }
            grouped[question.lesson][question.marks].push(question);
        });
        return grouped;
    }

    renderLessonGroup(lesson, questions) {
        let html = `<div class="lesson-group">`;
        html += `<h3 class="lesson-title">${lesson}</h3>`;

        [2, 4, 16].forEach(marks => {
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
        return `
            <div class="question-item">
                <div class="question-meta">ID: ${question.id} | ${question.marks} marks</div>
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
        const num2mark = parseInt(document.getElementById('num2mark').value) || 0;
        const num4mark = parseInt(document.getElementById('num4mark').value) || 0;
        const num16mark = parseInt(document.getElementById('num16mark').value) || 0;

        if (num2mark + num4mark + num16mark === 0) {
            alert('Please specify at least one question to generate a paper');
            return;
        }

        // Check if we have enough questions
        const counts = this.getQuestionCounts();
        if ((counts[2] || 0) < num2mark) {
            alert(`Not enough 2-mark questions. Available: ${counts[2] || 0}, Required: ${num2mark}`);
            return;
        }
        if ((counts[4] || 0) < num4mark) {
            alert(`Not enough 4-mark questions. Available: ${counts[4] || 0}, Required: ${num4mark}`);
            return;
        }
        if ((counts[16] || 0) < num16mark) {
            alert(`Not enough 16-mark questions. Available: ${counts[16] || 0}, Required: ${num16mark}`);
            return;
        }

        // Generate the paper
        const paper = this.createQuestionPaper(num2mark, num4mark, num16mark);
        this.displayGeneratedPaper(paper);
    }

    createQuestionPaper(num2mark, num4mark, num16mark) {
        const paper = {
            '2': this.selectQuestionsBalanced(2, num2mark),
            '4': this.selectQuestionsBalanced(4, num4mark),
            '16': this.selectQuestionsBalanced(16, num16mark)
        };
        return paper;
    }

    selectQuestionsBalanced(marks, count) {
        if (count === 0) return [];

        // Get all questions for this mark category
        const availableQuestions = this.questions.filter(q => q.marks === marks);
        
        // Group by lesson
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
            
            if (questionsByLesson[lesson].length > 0) {
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
        
        let html = '<div class="paper-title">Question Paper</div>';
        
        // Generate sections for each mark category
        ['2', '4', '16'].forEach(marks => {
            if (paper[marks].length > 0) {
                html += `<div class="paper-section">`;
                html += `<h3 class="paper-section-title paper-section-${marks}mark">
                    Section ${marks === '2' ? 'A' : marks === '4' ? 'B' : 'C'} - ${marks} Mark Questions
                </h3>`;
                
                paper[marks].forEach((question, index) => {
                    html += `<div class="paper-question">
                        <span class="paper-question-number">${index + 1}.</span>
                        <span class="paper-question-text">${question.question}</span>
                        <span class="paper-question-marks">[${question.marks} marks]</span>
                    </div>`;
                });
                
                html += `</div>`;
            }
        });

        container.innerHTML = html;
        
        // Show the generated paper section
        const section = document.getElementById('generatedPaperSection');
        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth' });
        
        this.showSuccessMessage('Question paper generated successfully!');
    }

    regeneratePaper() {
        // Get current values and regenerate
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
                        max-width: 800px; 
                        margin: 20px auto; 
                        padding: 20px;
                        line-height: 1.6;
                    }
                    .paper-title { 
                        text-align: center; 
                        font-size: 24px; 
                        font-weight: bold; 
                        margin-bottom: 30px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 10px;
                    }
                    .paper-section { margin-bottom: 30px; }
                    .paper-section-title { 
                        font-size: 18px; 
                        font-weight: bold; 
                        margin-bottom: 15px;
                        background: #f5f5f5;
                        padding: 10px;
                        border-radius: 5px;
                    }
                    .paper-question { 
                        margin-bottom: 15px; 
                        padding: 10px;
                        border-left: 3px solid #333;
                        background: #fafafa;
                    }
                    .paper-question-number { font-weight: bold; }
                    .paper-question-marks { 
                        float: right; 
                        font-style: italic; 
                        color: #666;
                    }
                    @media print {
                        body { margin: 0; padding: 15px; }
                        .paper-question { break-inside: avoid; }
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
    new QuestionPaperShuffler();
});
