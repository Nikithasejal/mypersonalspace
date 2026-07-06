const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'admin123';
const SESSION_KEY = 'session';
const USERS_KEY = 'users';
const LOGGED_USERS_KEY = 'loggedInUsers';

function getUsers(){
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

function setUsers(users){
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession(){
  return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
}

function setSession(session){
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession(){
  localStorage.removeItem(SESSION_KEY);
}

function getLoggedInUsers(){
  return JSON.parse(localStorage.getItem(LOGGED_USERS_KEY) || '[]');
}

function setLoggedInUsers(list){
  localStorage.setItem(LOGGED_USERS_KEY, JSON.stringify(list));
}

function addLoggedInUser(email){
  const list = getLoggedInUsers();
  if (!list.includes(email)) list.push(email);
  setLoggedInUsers(list);
}

function removeLoggedInUser(email){
  const list = getLoggedInUsers().filter(item => item !== email);
  setLoggedInUsers(list);
}

function disableAuthButton() {
  const authBtn = document.getElementById('authBtn');
  if (authBtn) {
    authBtn.disabled = true;
    authBtn.style.opacity = '0.7';
    authBtn.style.cursor = 'not-allowed';
  }
}

function enableAuthButton() {
  const authBtn = document.getElementById('authBtn');
  if (authBtn) {
    authBtn.disabled = false;
    authBtn.style.opacity = '1';
    authBtn.style.cursor = 'pointer';
  }
}

function register(){
  const nameField = document.getElementById('name');
  const emailField = document.getElementById('email');
  const passwordField = document.getElementById('password');
  const u = {
    name: nameField ? nameField.value.trim() : '',
    email: emailField ? emailField.value.trim().toLowerCase() : '',
    password: passwordField ? passwordField.value : ''
  };
  if (!u.name || !u.email || !u.password) {
    alert('Please fill name, email, and password.');
    return;
  }
  disableAuthButton();
  if (u.email === ADMIN_EMAIL) {
    alert('This email is reserved for admin. Choose another email.');
    enableAuthButton();
    return;
  }
  const users = getUsers();
  if (users.some(user => user.email === u.email)) {
    alert('This email is already registered. Please login.');
    enableAuthButton();
    return;
  }
  u.registeredAt = new Date().toISOString();
  users.push(u);
  setUsers(users);
  alert('Registered successfully. You can now login.');
  location = 'login.html';
}

function login(){
  const emailField = document.getElementById('email');
  const passwordField = document.getElementById('password');
  const enteredEmail = emailField ? emailField.value.trim().toLowerCase() : '';
  const enteredPassword = passwordField ? passwordField.value : '';
  if (!enteredEmail || !enteredPassword) {
    alert('Please enter both email and password.');
    return;
  }
  disableAuthButton();
  if (enteredEmail === ADMIN_EMAIL && enteredPassword === ADMIN_PASSWORD) {
    setSession({ role: 'admin', email: ADMIN_EMAIL, name: 'Admin' });
    location = 'admin.html';
    return;
  }
  const users = getUsers();
  const user = users.find(item => item.email === enteredEmail && item.password === enteredPassword);
  if (user) {
    setSession({ role: 'user', email: user.email, name: user.name });
    addLoggedInUser(user.email);
    location = 'dashboard.html';
  } else {
    alert('Invalid credentials');
    enableAuthButton();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const session = getSession();
  const path = location.pathname.toLowerCase();

  if (path.endsWith('register.html')) {
    if (session) {
      location = session.role === 'admin' ? 'admin.html' : 'dashboard.html';
      return;
    }
  }

  if (path.endsWith('login.html')) {
    if (session) {
      location = session.role === 'admin' ? 'admin.html' : 'dashboard.html';
      return;
    }
  }

  if (path.endsWith('dashboard.html')) {
    if (!session || session.role !== 'user') {
      if (session && session.role === 'admin') location = 'admin.html';
      else location = 'login.html';
      return;
    }
  }

  if (path.endsWith('admin.html')) {
    if (!session || session.role !== 'admin') {
      if (session && session.role === 'user') location = 'dashboard.html';
      else location = 'login.html';
      return;
    }
  }

  if (session) {
    const name = session.name || '';
    const firstName = (name && name.split && name.split(' ')[0]) || name;
    if (document.getElementById('welcome')) document.getElementById('welcome').textContent = name;
    if (document.getElementById('user')) document.getElementById('user').textContent = 'Welcome ' + name;
    if (document.getElementById('userName')) document.getElementById('userName').textContent = firstName;
    if (document.getElementById('fullName')) document.getElementById('fullName').textContent = name;
    if (document.getElementById('aboutName')) document.getElementById('aboutName').textContent = name;
    if (document.getElementById('footerName')) document.getElementById('footerName').textContent = name;
    if (document.getElementById('footerName2')) document.getElementById('footerName2').textContent = name;
    if (document.getElementById('adminWelcome')) document.getElementById('adminWelcome').textContent = name;
    document.title = (name ? name + ' - Dashboard' : document.title);
  }

  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    if (session) {
      logoutLink.style.display = 'inline';
      logoutLink.onclick = () => {
        if (session.role === 'user') removeLoggedInUser(session.email);
        clearSession();
        location = 'index.html';
      };
    } else {
      logoutLink.style.display = 'none';
    }
  }

  if (path.endsWith('dashboard.html')) {
    const noteText = document.getElementById('noteText');
    const attachmentInput = document.getElementById('attachmentInput');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const noteStatus = document.getElementById('noteStatus');
    const notesList = document.getElementById('notesList');
    const clearNotesBtn = document.getElementById('clearNotesBtn');
    const clearRecentBtn = document.getElementById('clearRecentBtn');
    const notesKey = `dashboardNotes_${session.email}`;

    function renderAttachment(note) {
      if (!note.attachment) return '';
      if (note.attachment.type && note.attachment.type.startsWith('image/')) {
        return `
          <div class="note-attachment">
            <img src="${note.attachment.data}" alt="${note.attachment.name}" />
            <p><strong>${note.attachment.name}</strong></p>
          </div>
        `;
      }
      return `
        <div class="note-attachment">
          <a href="${note.attachment.data}" download="${note.attachment.name}" target="_blank">
            <i class="fa-solid fa-file-arrow-down"></i> ${note.attachment.name}
          </a>
        </div>
      `;
    }

    function renderNotes() {
      if (!notesList) return;
      const savedNotes = JSON.parse(localStorage.getItem(notesKey) || '[]');
      if (!savedNotes.length) {
        notesList.innerHTML = '<p class="empty-notes">No saved notes yet.</p>';
        return;
      }
      notesList.innerHTML = savedNotes.map(note => {
        return `
          <div class="note-card">
            <div class="note-card-meta">
              <span>${note.date}</span>
              <span>${note.time}</span>
            </div>
            <p>${note.text.replace(/\n/g, '<br>')}</p>
            ${renderAttachment(note)}
          </div>
        `;
      }).join('');
    }

    function clearInputs() {
      if (noteText) noteText.value = '';
      if (attachmentInput) attachmentInput.value = '';
    }

    if (noteText) noteText.value = '';
    if (attachmentInput) attachmentInput.value = '';
    if (saveNoteBtn) {
      saveNoteBtn.onclick = () => {
        const textValue = noteText ? noteText.value.trim() : '';
        const file = attachmentInput ? attachmentInput.files[0] : null;

        if (!textValue && !file) {
          alert('Please enter a note or select an attachment.');
          return;
        }

        const saveNote = attachmentData => {
          const now = new Date();
          const date = now.toLocaleDateString();
          const time = now.toLocaleTimeString();
          const savedNotes = JSON.parse(localStorage.getItem(notesKey) || '[]');
          savedNotes.push({ text: textValue, date, time, attachment: attachmentData });
          localStorage.setItem(notesKey, JSON.stringify(savedNotes));
          clearInputs();
          if (noteStatus) noteStatus.textContent = 'Note saved with date and time.';
          renderNotes();
          setTimeout(() => {
            if (noteStatus) noteStatus.textContent = '';
          }, 3000);
        };

        if (file) {
          const reader = new FileReader();
          reader.onload = event => {
            saveNote({
              name: file.name,
              type: file.type,
              data: event.target.result
            });
          };
          reader.onerror = () => {
            alert('Failed to read attachment. Please try again.');
          };
          reader.readAsDataURL(file);
        } else {
          saveNote(null);
        }
      };
    }
    if (clearNotesBtn) {
      clearNotesBtn.onclick = () => {
        localStorage.removeItem(notesKey);
        if (noteText) noteText.value = '';
        renderNotes();
        if (noteStatus) noteStatus.textContent = 'Notes history cleared.';
        setTimeout(() => {
          if (noteStatus) noteStatus.textContent = '';
        }, 3000);
      };
    }
    if (clearRecentBtn) {
      clearRecentBtn.onclick = () => {
        const savedNotes = JSON.parse(localStorage.getItem(notesKey) || '[]');
        if (savedNotes.length) {
          savedNotes.pop();
          localStorage.setItem(notesKey, JSON.stringify(savedNotes));
          renderNotes();
          if (noteStatus) noteStatus.textContent = 'Most recent note removed.';
        } else if (noteStatus) {
          noteStatus.textContent = 'No notes to remove.';
        }
        setTimeout(() => {
          if (noteStatus) noteStatus.textContent = '';
        }, 3000);
      };
    }
    renderNotes();
  }

  if (path.endsWith('admin.html')) {
    const registeredList = document.getElementById('registeredUsers');
    const loggedList = document.getElementById('loggedUsers');
    const users = getUsers();
    if (registeredList) {
      registeredList.innerHTML = users.length ? users.map(user => `<li>${user.name} (${user.email})</li>`).join('') : '<li>No users registered.</li>';
    }
    if (loggedList) {
      const loggedUsers = getLoggedInUsers();
      loggedList.innerHTML = loggedUsers.length ? loggedUsers.map(email => `<li>${email}</li>`).join('') : '<li>No users currently logged in.</li>';
    }
  }
});
