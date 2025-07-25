// HealthyDo - Mental Health To-Do App
class HealthyDoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('healthydo-tasks')) || [];
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.currentMood = localStorage.getItem('healthydo-mood') || null;
        
        this.motivationalMessages = [
            "You've got this! Every small step counts towards your goals.",
            "Progress, not perfection. You're doing amazing!",
            "Take it one task at a time. You're stronger than you think.",
            "Your mental health matters. Celebrate every accomplishment!",
            "Small wins lead to big victories. Keep going!",
            "You're building healthy habits one day at a time.",
            "Remember to be kind to yourself. You're doing your best!",
            "Every completed task is a step towards a better you."
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.renderTasks();
        this.renderCalendar();
        this.updateStats();
        this.showMotivationalMessage();
        this.loadMood();
    }
    
    setupEventListeners() {
        // Add task form
        document.getElementById('add-task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });
        
        // Calendar navigation
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });
        
        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });
        
        // Mood tracking
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setMood(e.target.dataset.mood);
            });
        });
        
        // Setup drag and drop
        this.setupDragAndDrop();
    }
    
    addTask() {
        const taskInput = document.getElementById('task-input');
        const taskDate = document.getElementById('task-date');
        
        if (taskInput.value.trim() === '') return;
        
        const task = {
            id: Date.now(),
            text: taskInput.value.trim(),
            completed: false,
            dueDate: taskDate.value || null,
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        
        // Add new tasks at the beginning (top) of the array
        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.renderCalendar(); // Update calendar to show task indicators
        
        // Clear form
        taskInput.value = '';
        taskDate.value = '';
        
        // Show success feedback
        this.showNotification('Task added successfully!', 'success');
    }
    
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
            if (task.completed) {
                this.showNotification('Great job! Task completed! 🎉', 'success');
                this.showMotivationalMessage();
            }
        }
    }
    
    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.renderCalendar();
            this.showNotification('Task deleted', 'info');
        }
    }
    
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const newText = prompt('Edit task:', task.text);
            if (newText && newText.trim() !== '') {
                task.text = newText.trim();
                this.saveTasks();
                this.renderTasks();
                this.showNotification('Task updated', 'success');
            }
        }
    }
    
    renderTasks() {
        const tasksList = document.getElementById('tasks-list');
        const emptyState = document.getElementById('empty-state');
        
        if (this.tasks.length === 0) {
            tasksList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        tasksList.style.display = 'block';
        emptyState.style.display = 'none';
        
        tasksList.innerHTML = '';
        
        this.tasks.forEach((task, index) => {
            const taskElement = this.createTaskElement(task, index);
            tasksList.appendChild(taskElement);
        });
    }
    
    createTaskElement(task, index) {
        const template = document.getElementById('task-template');
        const taskElement = template.content.cloneNode(true);
        const li = taskElement.querySelector('.task-item');
        
        li.dataset.taskId = task.id;
        li.dataset.index = index;
        
        if (task.completed) {
            li.classList.add('completed');
        }
        
        // Set task content
        const taskText = taskElement.querySelector('.task-text');
        const taskDate = taskElement.querySelector('.task-date');
        const checkbox = taskElement.querySelector('.task-checkbox');
        const editBtn = taskElement.querySelector('.edit-btn');
        const deleteBtn = taskElement.querySelector('.delete-btn');
        
        taskText.textContent = task.text;
        
        if (task.dueDate) {
            const date = new Date(task.dueDate);
            taskDate.textContent = `Due: ${date.toLocaleDateString()}`;
            
            // Add overdue styling
            if (date < new Date() && !task.completed) {
                li.classList.add('overdue');
                taskDate.style.color = '#e74c3c';
            }
        } else {
            taskDate.textContent = '';
        }
        
        // Event listeners
        checkbox.addEventListener('click', () => this.toggleTask(task.id));
        editBtn.addEventListener('click', () => this.editTask(task.id));
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
        
        return li;
    }
    
    setupDragAndDrop() {
        const tasksList = document.getElementById('tasks-list');
        
        tasksList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', e.target.outerHTML);
                e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
            }
        });
        
        tasksList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.remove('dragging');
            }
        });
        
        tasksList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingElement = document.querySelector('.dragging');
            const afterElement = this.getDragAfterElement(tasksList, e.clientY);
            
            if (afterElement == null) {
                tasksList.appendChild(draggingElement);
            } else {
                tasksList.insertBefore(draggingElement, afterElement);
            }
        });
        
        tasksList.addEventListener('drop', (e) => {
            e.preventDefault();
            this.reorderTasks();
        });
    }
    
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    reorderTasks() {
        const taskItems = document.querySelectorAll('.task-item');
        const newOrder = [];
        
        taskItems.forEach(item => {
            const taskId = parseInt(item.dataset.taskId);
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                newOrder.push(task);
            }
        });
        
        this.tasks = newOrder;
        this.saveTasks();
        this.renderTasks();
    }
    
    renderCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        const currentMonthYear = document.getElementById('current-month-year');
        
        // Set month/year header
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        currentMonthYear.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        
        // Clear calendar
        calendarGrid.innerHTML = '';
        
        // Get first day of month and number of days
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        // Generate calendar days
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const dayElement = this.createCalendarDay(date);
            calendarGrid.appendChild(dayElement);
        }
    }
    
    createCalendarDay(date) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = date.getDate();
        
        // Add classes for styling
        if (date.getMonth() !== this.currentDate.getMonth()) {
            dayElement.classList.add('other-month');
        }
        
        if (this.isToday(date)) {
            dayElement.classList.add('today');
        }
        
        if (this.isSameDay(date, this.selectedDate)) {
            dayElement.classList.add('selected');
        }
        
        // Check if date has tasks
        if (this.hasTasksOnDate(date)) {
            dayElement.classList.add('has-tasks');
        }
        
        // Click event
        dayElement.addEventListener('click', () => {
            this.selectDate(date);
        });
        
        return dayElement;
    }
    
    selectDate(date) {
        this.selectedDate = new Date(date);
        this.renderCalendar();
        this.showTasksForDate(date);
        
        // Auto-fill date input when selecting a date
        const taskDateInput = document.getElementById('task-date');
        taskDateInput.value = date.toISOString().split('T')[0];
    }
    
    showTasksForDate(date) {
        const dateTasksContainer = document.getElementById('date-tasks');
        const selectedDateInfo = document.getElementById('selected-date-info');
        
        const tasksForDate = this.tasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return this.isSameDay(taskDate, date);
        });
        
        selectedDateInfo.querySelector('h4').textContent = 
            this.isToday(date) ? "Today's Tasks" : `Tasks for ${date.toLocaleDateString()}`;
        
        if (tasksForDate.length === 0) {
            dateTasksContainer.innerHTML = '<p style="color: #999; text-align: center;">No tasks for this date</p>';
        } else {
            dateTasksContainer.innerHTML = '';
            tasksForDate.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = `date-task ${task.completed ? 'completed' : ''}`;
                taskElement.innerHTML = `
                    <span class="task-text">${task.text}</span>
                    <span class="task-status">${task.completed ? '✓' : '○'}</span>
                `;
                taskElement.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    margin-bottom: 8px;
                    background: ${task.completed ? '#d4edda' : '#fff3cd'};
                    border-radius: 8px;
                    border-left: 4px solid ${task.completed ? '#28a745' : '#ffc107'};
                `;
                dateTasksContainer.appendChild(taskElement);
            });
        }
    }
    
    hasTasksOnDate(date) {
        return this.tasks.some(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return this.isSameDay(taskDate, date);
        });
    }
    
    isToday(date) {
        const today = new Date();
        return this.isSameDay(date, today);
    }
    
    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }
    
    setMood(mood) {
        this.currentMood = mood;
        localStorage.setItem('healthydo-mood', mood);
        
        // Update UI
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`[data-mood="${mood}"]`).classList.add('selected');
        
        this.showMotivationalMessage();
    }
    
    loadMood() {
        if (this.currentMood) {
            document.querySelector(`[data-mood="${this.currentMood}"]`)?.classList.add('selected');
        }
    }
    
    showMotivationalMessage() {
        const motivationText = document.getElementById('motivation-text');
        const randomMessage = this.motivationalMessages[Math.floor(Math.random() * this.motivationalMessages.length)];
        motivationText.textContent = randomMessage;
    }
    
    updateStats() {
        const today = new Date();
        const todayCompleted = this.tasks.filter(task => {
            if (!task.completed || !task.completedAt) return false;
            const completedDate = new Date(task.completedAt);
            return this.isSameDay(completedDate, today);
        }).length;
        
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekCompleted = this.tasks.filter(task => {
            if (!task.completed || !task.completedAt) return false;
            const completedDate = new Date(task.completedAt);
            return completedDate >= weekStart;
        }).length;
        
        const streak = this.calculateStreak();
        
        document.getElementById('today-completed').textContent = todayCompleted;
        document.getElementById('week-completed').textContent = weekCompleted;
        document.getElementById('streak-count').textContent = streak;
        
        // Update task counts
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        document.getElementById('task-count').textContent = `${totalTasks} task${totalTasks !== 1 ? 's' : ''}`;
        document.getElementById('completed-count').textContent = `${completedTasks} completed`;
    }
    
    calculateStreak() {
        // Simple streak calculation - consecutive days with completed tasks
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            
            const hasCompletedTasks = this.tasks.some(task => {
                if (!task.completed || !task.completedAt) return false;
                const completedDate = new Date(task.completedAt);
                return this.isSameDay(completedDate, checkDate);
            });
            
            if (hasCompletedTasks) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        
        return streak;
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    saveTasks() {
        localStorage.setItem('healthydo-tasks', JSON.stringify(this.tasks));
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HealthyDoApp();
});
