const GATEWAY_URL = "https://fix-gateway-473011695031.us-central1.run.app/api/chat";

const App = {
    user: null,
    voiceEnabled: false,
    userInitial: 'U',
    userPhotoURL: null,
    synth: window.speechSynthesis || null,
    chatHistory: [],

    init() {
        if (typeof firebase !== 'undefined') {
            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    this.user = user;
                    this.renderUserProfile();
                    this.removeLoadingOverlay();
                    this.fetchAndShowHistory(true);
                } else {
                    window.location.href = '/login.html';
                }
            });
        }

        setTimeout(() => {
            if (!this.user) window.location.href = '/login.html';
        }, 10000);

        this.bindEvents();
        this.adjustTextareaHeight();
        this.initSingularityEffects();
    },

    removeLoadingOverlay() {
        const loader = document.getElementById('fix-overlay');
        if (loader) {
            loader.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => loader.remove(), 1000);
        }
    },

    initSingularityEffects() {
        if (typeof particlesJS !== 'undefined') {
            particlesJS("particles-js", {
                "particles": {
                    "number": { "value": 40, "density": { "enable": true, "value_area": 1000 } },
                    "color": { "value": "#ffffff" },
                    "shape": { "type": "circle" },
                    "opacity": { "value": 0.3, "random": true },
                    "size": { "value": 1.5, "random": true },
                    "line_linked": { "enable": true, "distance": 150, "color": "#4f5b75", "opacity": 0.1, "width": 1 },
                    "move": { "enable": true, "speed": 0.5 }
                },
                "interactivity": {
                    "detect_on": "canvas",
                    "events": { "onhover": { "enable": true, "mode": "grab" } }
                }
            });
        }

        if (typeof gsap !== 'undefined') {
            document.querySelectorAll('.magnetic-btn').forEach(btn => {
                btn.addEventListener('mousemove', (e) => {
                    const rect = btn.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    gsap.to(btn, { duration: 0.3, x: x * 0.3, y: y * 0.3, ease: "power2.out" });
                });
                btn.addEventListener('mouseleave', () => {
                    gsap.to(btn, { duration: 0.5, x: 0, y: 0, ease: "elastic.out(1, 0.3)" });
                });
            });
        }

        if (typeof VanillaTilt !== 'undefined') {
            VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
                max: 5, speed: 400, glare: true, "max-glare": 0.1, scale: 1.02
            });
        }
    },

    bindEvents() {
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');

        if (input) {
            input.addEventListener('input', () => {
                this.adjustTextareaHeight();
                if (sendBtn) sendBtn.disabled = input.value.trim() === '';
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });
        }

        if (sendBtn) sendBtn.addEventListener('click', () => this.handleSendMessage());

        const voiceToggle = document.getElementById('voice-toggle');
        if (voiceToggle) {
            if (!this.synth) {
                voiceToggle.disabled = true;
                voiceToggle.title = 'Tu navegador no soporta síntesis de voz.';
            }
            voiceToggle.addEventListener('change', (e) => {
                this.voiceEnabled = e.target.checked;
                if (!this.voiceEnabled && this.synth) this.synth.cancel();
            });
        }

        const btnHistory = document.getElementById('btn-history');
        if (btnHistory) {
            btnHistory.addEventListener('click', () => {
                this.showHistoryPanel();
                this.fetchAndShowHistory(false);
            });
        }

        const newChatBtn = document.getElementById('btn-new-chat');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                this.showChatPanel();
                const container = document.getElementById('messages-container');
                const emptyState = document.getElementById('empty-state');
                this.chatHistory = [];
                if (container) container.innerHTML = '';
                if (emptyState && container) {
                    container.appendChild(emptyState);
                    emptyState.style.display = 'flex';
                }
                if (input) input.focus();
            });
        }

        const currentConsultaBtn = document.getElementById('btn-current-consulta');
        if (currentConsultaBtn) {
            const scrollAction = () => {
                this.showChatPanel();
                ChatUI.scrollToBottom();
                if (input) input.focus();
            };
            currentConsultaBtn.addEventListener('click', scrollAction);
            currentConsultaBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollAction(); }
            });
        }

        const profileBtn = document.getElementById('user-profile-btn');
        const userMenu = document.getElementById('user-menu');
        if (profileBtn && userMenu) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isHidden = userMenu.classList.contains('hidden');
                userMenu.classList.toggle('hidden', !isHidden);
                userMenu.classList.toggle('block', isHidden);
                if (isHidden) userMenu.classList.add('animate-[fadeInUp_0.2s_ease-out]');
                profileBtn.setAttribute('aria-expanded', String(isHidden));
            });
        }

        const hamburgerBtn = document.querySelector('[data-hamburger]');
        const sidebar = document.getElementById('main-sidebar');
        if (hamburgerBtn && sidebar) {
            hamburgerBtn.addEventListener('click', () => {
                const isOpen = !sidebar.classList.contains('-translate-x-full');
                sidebar.classList.toggle('-translate-x-full');
                hamburgerBtn.setAttribute('aria-expanded', String(!isOpen));
            });
        }

        document.addEventListener('click', () => {
            if (userMenu && !userMenu.classList.contains('hidden')) {
                userMenu.classList.add('hidden');
                userMenu.classList.remove('block');
                if (profileBtn) profileBtn.setAttribute('aria-expanded', 'false');
            }
        });
    },

    showHistoryPanel() {
        document.getElementById('messages-container')?.classList.add('hidden');
        document.getElementById('input-container-wrapper')?.classList.add('hidden');
        document.getElementById('history-container')?.classList.remove('hidden');

        document.getElementById('btn-current-consulta')?.classList.remove('nav-item-active', 'bg-white', 'shadow-sm', 'text-slate-800');
        document.getElementById('btn-current-consulta')?.classList.add('text-slate-500');
        document.getElementById('btn-history')?.classList.add('nav-item-active', 'bg-white', 'shadow-sm', 'text-slate-800');
        document.getElementById('btn-history')?.classList.remove('text-slate-500');
    },

    showChatPanel() {
        document.getElementById('history-container')?.classList.add('hidden');
        document.getElementById('messages-container')?.classList.remove('hidden');
        document.getElementById('input-container-wrapper')?.classList.remove('hidden');

        document.getElementById('btn-history')?.classList.remove('nav-item-active', 'bg-white', 'shadow-sm', 'text-slate-800');
        document.getElementById('btn-history')?.classList.add('text-slate-500');
        document.getElementById('btn-current-consulta')?.classList.add('nav-item-active', 'bg-white', 'shadow-sm', 'text-slate-800');
        document.getElementById('btn-current-consulta')?.classList.remove('text-slate-500');
    },

    async fetchAndShowHistory(silent = false) {
        if (!this.user) return;
        const HISTORY_URL = GATEWAY_URL.replace('/chat', '/history');

        if (!silent) {
            const listContainer = document.getElementById('history-list');
            if (listContainer) {
                listContainer.innerHTML = `<div class="text-center py-10 text-slate-400 text-sm"><i class="fas fa-spinner fa-spin mr-2"></i>Cargando...</div>`;
            }
        }

        try {
            const token = await this.user.getIdToken();
            const response = await fetch(HISTORY_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) throw new Error('AUTH_ERROR');
                throw new Error('NETWORK_ERROR');
            }

            const data = await response.json();
            const counter = document.getElementById('queries-counter');
            if (counter && data.remaining_queries !== undefined) {
                counter.textContent = `${data.remaining_queries}/10`;
            }

            if (!silent) {
                this.renderHistoryList(data.history);
            }
        } catch (error) {
            console.error("Error fetching history:", error);
            if (!silent) {
                const listContainer = document.getElementById('history-list');
                if (listContainer) {
                    listContainer.innerHTML = `<div class="text-center py-10 text-red-400 text-sm">Error al cargar el historial. Intenta nuevamente.</div>`;
                }
            }
        }
    },

    renderHistoryList(history) {
        const container = document.getElementById('history-list');
        if (!container) return;

        container.innerHTML = '';

        if (!history || history.length === 0) {
            container.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-center text-slate-500 py-10">
                <i class="fas fa-folder-open text-3xl mb-3 text-slate-300"></i>
                <p>No tienes consultas anteriores.</p>
            </div>`;
            return;
        }

        const sessions = [];
        for (let i = 0; i < history.length; i += 2) {
            if (history[i] && history[i].role === 'user') {
                sessions.push({
                    query: history[i].content,
                    response: history[i + 1] ? history[i + 1].content : 'Sin respuesta'
                });
            }
        }

        sessions.forEach((session, index) => {
            const card = document.createElement('div');
            card.className = "bg-white p-5 rounded-2xl border border-borderSubtle shadow-sm hover:shadow-card transition-shadow text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer group";

            const title = session.query.length > 50 ? session.query.substring(0, 50) + '...' : session.query;

            card.innerHTML = `
                <div class="flex items-start gap-4">
                    <div class="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <i class="fas fa-message text-sm"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="text-sm font-semibold text-slate-700 block mb-1 truncate">${title}</h3>
                        <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">${session.query}</p>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                this.showChatPanel();
                const chatContainer = document.getElementById('messages-container');
                const emptyState = document.getElementById('empty-state');
                if (chatContainer) chatContainer.innerHTML = '';
                if (emptyState && chatContainer) {
                    emptyState.style.display = 'none';
                }
                ChatUI.appendMessage('user', session.query);
                ChatUI.appendMessage('bot', session.response);
                ChatUI.scrollToBottom();
            });

            container.appendChild(card);
        });
    },

    async handleSendMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        input.style.height = 'auto';
        document.getElementById('send-btn').disabled = true;

        const emptyState = document.getElementById('empty-state');
        if (emptyState) emptyState.style.display = 'none';

        ChatUI.appendMessage('user', text);
        const loadingId = ChatUI.appendLoading();

        const avatar = document.getElementById('ai-avatar');
        if (avatar && avatar.firstElementChild) {
            avatar.firstElementChild.classList.add('shadow-glow');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 110000);

        try {
            if (!this.user) throw new Error('SESSION_INVALID');
            const token = await this.user.getIdToken();

            this.chatHistory.push({ role: 'user', content: text });

            const response = await fetch(GATEWAY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query: text }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 401) throw new Error('AUTH_ERROR');
                if (response.status === 403) throw new Error('LIMIT_REACHED');
                if (response.status >= 500) throw new Error('SERVER_ERROR');
                throw new Error('NETWORK_ERROR');
            }

            const result = await response.json();
            const botResponse = result.response || 'Sin respuesta del servidor.';

            ChatUI.removeMessage(loadingId);
            if (avatar && avatar.firstElementChild) {
                avatar.firstElementChild.classList.remove('shadow-glow');
            }

            this.chatHistory.push({ role: 'assistant', content: botResponse });

            await ChatUI.typeMessage('bot', botResponse);
            if (this.voiceEnabled) this.speak(botResponse);

            this.fetchAndShowHistory(true);

        } catch (error) {
            clearTimeout(timeoutId);
            ChatUI.removeMessage(loadingId);
            if (avatar && avatar.firstElementChild) {
                avatar.firstElementChild.classList.remove('shadow-glow');
            }

            const errorMessages = {
                'SESSION_INVALID': 'Tu sesión no es válida. Por favor, recarga la página.',
                'AUTH_ERROR': 'No tienes autorización para esta acción. Vuelve a iniciar sesión.',
                'LIMIT_REACHED': 'Has alcanzado el límite de 10 consultas de prueba en este proyecto.',
                'SERVER_ERROR': 'El servidor tuvo un problema. Intenta en unos momentos.',
                'AbortError': 'La solicitud tardó demasiado. Verifica tu conexión e intenta de nuevo.',
                'NETWORK_ERROR': 'Error de conexión. Verifica tu red e intenta nuevamente.',
            };
            const friendly = errorMessages[error.message] || errorMessages[error.name] || 'Ocurrió un error inesperado. Intenta nuevamente.';
            ChatUI.appendMessage('bot', `${friendly}`);
        }
    },

    speak(text) {
        if (!this.synth) return;
        this.synth.cancel();
        const cleanText = text.replace(/[*#`[\]()]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.1;
        utterance.lang = 'es-ES';
        const voices = this.synth.getVoices();
        const esVoice = voices.find(v => v.lang.startsWith('es'));
        if (esVoice) utterance.voice = esVoice;
        this.synth.speak(utterance);
    },

    adjustTextareaHeight() {
        const el = document.getElementById('chat-input');
        if (el) {
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 150) + 'px';
        }
    },

    renderUserProfile() {
        if (!this.user) return;
        const nameEl = document.getElementById('user-name');
        const avatarEl = document.querySelector('.avatar');
        const displayName = this.user.displayName || this.user.email?.split('@')[0] || 'Usuario';
        this.userInitial = displayName.charAt(0).toUpperCase();
        this.userPhotoURL = this.user.photoURL || null;

        if (nameEl) nameEl.textContent = displayName;
        if (avatarEl) {
            if (this.userPhotoURL) {
                avatarEl.textContent = '';
                avatarEl.style.backgroundImage = `url('${this.userPhotoURL}')`;
                avatarEl.style.backgroundSize = 'cover';
                avatarEl.style.backgroundPosition = 'center';
            } else {
                avatarEl.textContent = this.userInitial;
            }
        }
    },

    logout() {
        if (typeof firebase !== 'undefined') {
            firebase.auth().signOut()
                .then(() => { window.location.href = '/login.html'; })
                .catch(() => { window.location.href = '/login.html'; });
        }
    }
};

const ChatUI = {
    ARC_REACTOR_SVG: `
        <div class="brand-logo" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%; transform: scale(1.1);">
                <defs>
                  <filter id="f-reactor-glow-chat" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.5" result="blur1" />
                    <feGaussianBlur stdDeviation="6" result="blur2" />
                    <feMerge>
                      <feMergeNode in="blur2" />
                      <feMergeNode in="blur1" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id="f-grad-core-chat" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="100%" stop-color="#38bdf8"/>
                  </linearGradient>
                </defs>
                <g filter="url(#f-reactor-glow-chat)">
                  <circle cx="50" cy="50" r="46" stroke="#0ea5e9" stroke-width="1" stroke-dasharray="2 6" fill="none">
                    <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="20s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="50" cy="50" r="40" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="25 15 5 15" fill="none" opacity="0.7">
                    <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="10s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="50" cy="50" r="34" stroke="#38bdf8" stroke-width="1" stroke-dasharray="4 4" fill="none" opacity="0.9">
                    <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="15s" repeatCount="indefinite" />
                  </circle>
                  <path d="M 32 25 L 72 25 L 72 38 L 48 38 L 48 48 L 65 48 L 65 60 L 48 60 L 48 75 L 32 75 Z" fill="url(#f-grad-core-chat)">
                    <animate attributeName="opacity" values="0.85;1;0.85" dur="2s" repeatCount="indefinite" />
                  </path>
                  <path d="M 39 31 L 65 31" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="4 4">
                    <animate attributeName="stroke-dashoffset" values="8;0" dur="0.5s" repeatCount="indefinite" />
                  </path>
                  <path d="M 39 54 L 58 54" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="4 4">
                    <animate attributeName="stroke-dashoffset" values="8;0" dur="0.5s" repeatCount="indefinite" />
                  </path>
                  <path d="M 39 31 L 39 68" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
                  <circle cx="39" cy="31" r="3.5" fill="#ffffff">
                    <animate attributeName="r" values="2.5;4.5;2.5" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="39" cy="68" r="3.5" fill="#ffffff">
                    <animate attributeName="r" values="2.5;4.5;2.5" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <line x1="15" y1="50" x2="85" y2="50" stroke="#bae6fd" stroke-width="1.5" opacity="0.7">
                    <animate attributeName="y1" values="15;85;15" dur="4s" repeatCount="indefinite" />
                    <animate attributeName="y2" values="15;85;15" dur="4s" repeatCount="indefinite" />
                  </line>
                </g>
            </svg>
        </div>
    `,

    get container() {
        return document.getElementById('messages-container');
    },

    appendMessage(role, text) {
        if (!this.container) return;
        const msgId = 'msg-' + Date.now();
        const isBot = role === 'bot';
        const time = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

        let content;
        if (isBot) {
            const rawHtml = (typeof marked !== 'undefined') ? marked.parse(text) : text;
            content = (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(rawHtml) : rawHtml;
        } else {
            const div = document.createElement('div');
            div.textContent = text;
            content = div.innerHTML.replace(/\n/g, '<br>');
        }

        let html;
        if (isBot) {
            html = `
            <div class="msg-row" id="${msgId}" role="article" aria-label="Respuesta de Fix AI">
                <div class="ai-msg-avatar" aria-hidden="true">${this.ARC_REACTOR_SVG}</div>
                <div class="min-w-0">
                    <div class="bot-bubble">
                        <div class="prose prose-sm max-w-none message-content-text">${content}</div>
                        <div class="msg-meta">
                            <span class="msg-time">${time}</span>
                            <button class="copy-btn" aria-label="Copiar respuesta"
                                onclick="(function(btn){const t=btn.closest('.bot-bubble').querySelector('.message-content-text').innerText;navigator.clipboard.writeText(t).then(()=>{btn.innerHTML='<i class=\'fas fa-check text-emerald-500\'></i> Copiado';setTimeout(()=>{btn.innerHTML='<i class=\'fas fa-copy\'></i> Copiar'},2000)});})(this)">
                                <i class="fas fa-copy"></i> Copiar
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        } else {
            const userAvatarHtml = App.userPhotoURL
                ? `<div class="user-msg-avatar" style="background-image:url('${App.userPhotoURL}');background-size:cover;background-position:center;" aria-hidden="true"></div>`
                : `<div class="user-msg-avatar" aria-hidden="true">${App.userInitial}</div>`;
            html = `
            <div class="msg-row msg-user-row" id="${msgId}" role="article" aria-label="Tu mensaje">
                <div class="min-w-0">
                    <div class="user-bubble">
                        <div class="text-[13.5px] leading-relaxed">${content}</div>
                        <div class="flex justify-end mt-2">
                            <span class="msg-time msg-time-user">${time}</span>
                        </div>
                    </div>
                </div>
                ${userAvatarHtml}
            </div>`;
        }

        this.container.insertAdjacentHTML('beforeend', html);
        this.scrollToBottom();
        this.highlightCode(msgId);
    },

    async typeMessage(role, text) {
        if (!this.container) return;
        const msgId = 'msg-' + Date.now();
        const rawHtml = (typeof marked !== 'undefined') ? marked.parse(text) : text;
        const content = (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(rawHtml) : rawHtml;
        const time = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

        const html = `
            <div class="msg-row" id="${msgId}" role="article" aria-label="Respuesta de Fix AI">
                <div class="ai-msg-avatar" aria-hidden="true">${this.ARC_REACTOR_SVG}</div>
                <div class="min-w-0">
                    <div class="bot-bubble">
                        <div class="prose prose-sm max-w-none message-content-text">${content}</div>
                        <div class="msg-meta">
                            <span class="msg-time">${time}</span>
                            <button class="copy-btn" aria-label="Copiar respuesta"
                                onclick="(function(btn){const t=btn.closest('.bot-bubble').querySelector('.message-content-text').innerText;navigator.clipboard.writeText(t).then(()=>{btn.innerHTML='<i class=\'fas fa-check text-emerald-500\'></i> Copiado';setTimeout(()=>{btn.innerHTML='<i class=\'fas fa-copy\'></i> Copiar'},2000)});})(this)">
                                <i class="fas fa-copy"></i> Copiar
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;

        this.container.insertAdjacentHTML('beforeend', html);
        this.highlightCode(msgId);

        await new Promise(resolve => setTimeout(resolve, 50));
        this.scrollToBottom();
        await new Promise(resolve => setTimeout(resolve, 300));
        this.scrollToBottom();
    },

    appendLoading() {
        if (!this.container) return null;
        const id = 'loading-' + Date.now();

        const html = `
            <div class="msg-row" id="${id}" role="status" aria-label="Fix AI está procesando">
                <div class="ai-msg-avatar" aria-hidden="true">${this.ARC_REACTOR_SVG}</div>
                <div class="loading-bubble">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>`;

        this.container.insertAdjacentHTML('beforeend', html);
        this.scrollToBottom();
        return id;
    },

    removeMessage(id) {
        if (!id) return;
        const el = document.getElementById(id);
        if (el) el.remove();
    },

    scrollToBottom() {
        if (this.container) {
            requestAnimationFrame(() => {
                this.container.scrollTop = this.container.scrollHeight;
            });
        }
    },

    setInput(text) {
        const input = document.getElementById('chat-input');
        if (input) {
            input.value = text;
            input.focus();
            input.dispatchEvent(new Event('input'));
        }
    },

    highlightCode(msgId) {
        if (typeof hljs !== 'undefined') {
            document.querySelectorAll(`#${msgId} pre code`).forEach(block => {
                hljs.highlightElement(block);
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());