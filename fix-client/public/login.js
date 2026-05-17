document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    const btnContentWrapper = loginButton ? loginButton.querySelector('.btn-content') : null;
    const errorPlaceholder = document.getElementById('error-alert-placeholder');

    if (typeof firebase === 'undefined') {
        showError('Error al cargar el servicio de autenticación. Recarga la página.');
        if (loginButton) loginButton.disabled = true;
        return;
    }

    firebase.auth().onAuthStateChanged(user => {
        if (user) window.location.href = '/index.html';
    });

    if (loginButton && btnContentWrapper) {
        loginButton.addEventListener('click', async () => {
            loginButton.disabled = true;
            const originalContent = btnContentWrapper.innerHTML;

            btnContentWrapper.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Autenticando...
            `;

            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });

            try {
                await firebase.auth().signInWithPopup(provider);
            } catch (error) {
                loginButton.disabled = false;
                btnContentWrapper.innerHTML = originalContent;

                const errorMap = {
                    'auth/popup-closed-by-user': 'Cerraste la ventana de autenticación. Intenta nuevamente.',
                    'auth/popup-blocked': 'El navegador bloqueó la ventana emergente. Permite ventanas emergentes e intenta de nuevo.',
                    'auth/network-request-failed': 'Error de conexión. Verifica tu red e intenta nuevamente.',
                    'auth/cancelled-popup-request': null,
                };

                const message = Object.prototype.hasOwnProperty.call(errorMap, error.code)
                    ? errorMap[error.code]
                    : 'No se pudo completar el inicio de sesión. Intenta nuevamente.';

                if (message) showError(message);
            }
        });
    }

    function showError(message) {
        if (!errorPlaceholder) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'flex items-center gap-3 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg animate-fade-in-up';
        wrapper.setAttribute('role', 'alert');
        wrapper.setAttribute('aria-live', 'assertive');

        const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        iconSvg.setAttribute('class', 'w-5 h-5 text-red-500 flex-shrink-0');
        iconSvg.setAttribute('fill', 'none');
        iconSvg.setAttribute('stroke', 'currentColor');
        iconSvg.setAttribute('viewBox', '0 0 24 24');
        iconSvg.setAttribute('aria-hidden', 'true');
        iconSvg.innerHTML = '<circle cx="12" cy="12" r="10" stroke-width="2"></circle><line x1="12" y1="8" x2="12" y2="12" stroke-width="2"></line><line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2"></line>';

        const msgSpan = document.createElement('span');
        msgSpan.textContent = message;

        wrapper.appendChild(iconSvg);
        wrapper.appendChild(msgSpan);

        errorPlaceholder.innerHTML = '';
        errorPlaceholder.appendChild(wrapper);
    }
});