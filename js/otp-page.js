/**
 * =================================================================
 * HAIR STYLIST - PÁGINA DE VERIFICAÇÃO OTP
 * =================================================================
 */

// Notificação toast (igual ao resto do site)
function showToast(message, type) {
    var old = document.querySelector('.otp-toast');
    if (old) old.remove();

    var colors = { success: '#4CAF50', error: '#dc3545', warning: '#ff9800', info: '#007bff' };
    var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };

    var el = document.createElement('div');
    el.className = 'otp-toast';
    el.style.cssText = 'position:fixed;top:20px;right:20px;background:' + (colors[type] || colors.info) + ';color:#fff;padding:16px 24px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.3);z-index:10000;display:flex;align-items:center;gap:12px;max-width:400px;font-size:14px;font-weight:500;font-family:Montserrat,sans-serif;transform:translateX(500px);transition:transform 0.4s ease;';
    el.innerHTML = '<i class="fas ' + (icons[type] || icons.info) + '" style="font-size:18px"></i><span>' + message + '</span>';
    document.body.appendChild(el);

    setTimeout(function () { el.style.transform = 'translateX(0)'; }, 50);
    setTimeout(function () {
        el.style.transform = 'translateX(500px)';
        setTimeout(function () { if (el.parentNode) el.remove(); }, 500);
    }, 3500);
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('OTP Page carregada');

    // ---- Dados do cliente (URL Query ou LocalStorage) ----
    var params = new URLSearchParams(window.location.search);
    var qNome = params.get('nome');
    var qEmail = params.get('email');
    var qTelefone = params.get('telefone');

    var clienteDados = null;

    if (qNome && qTelefone) {
        clienteDados = {
            nome: decodeURIComponent(qNome),
            email: qEmail ? decodeURIComponent(qEmail) : '',
            telefone: decodeURIComponent(qTelefone)
        };
        // Salvar no localStorage para persistência em outras abas
        try {
            localStorage.setItem('clienteDados', JSON.stringify(clienteDados));
        } catch (e) {
            console.warn('Falha ao gravar no localStorage, usando memória local:', e);
        }
    } else {
        var raw = localStorage.getItem('clienteDados');
        try { clienteDados = JSON.parse(raw); } catch (e) { }
    }

    if (!clienteDados || !clienteDados.telefone) {
        console.warn('Dados do cliente não encontrados. Redirecionando para o cadastro.');
        window.location.href = 'index.html';
        return;
    }

    // ---- Loading screen ----
    var ls = document.getElementById('loadingScreen');
    if (ls) {
        setTimeout(function () {
            ls.classList.add('hidden');
            setTimeout(function () { ls.style.display = 'none'; }, 500);
        }, 800);
    }

    // ---- Exibir telefone ----
    var phoneEl = document.getElementById('otpPhoneNumber');
    if (phoneEl) phoneEl.textContent = clienteDados.telefone;

    // ---- Enviar código inicial ----
    var codigoAtual = '';

    function enviarCodigo() {
        if (!window.otpService) {
            console.error('OTP Service não carregado');
            return;
        }
        var r = window.otpService.sendOTP(clienteDados.telefone);
        if (r.success) {
            codigoAtual = r.code;
            var devEl = document.getElementById('otpDevCode');
            if (devEl) devEl.textContent = r.code;
            showToast('Código enviado com sucesso!', 'success');
            console.log('Código gerado:', r.code);
        } else {
            showToast(r.message, 'error');
        }
        return r;
    }

    enviarCodigo();
    iniciarTimer();

    // ---- INPUTS OTP ----
    var inputs = document.querySelectorAll('.otp-digit');
    var btnVerificar = document.getElementById('btnVerificar');
    var btnReenviar = document.getElementById('btnReenviar');

    // Configurar cada input
    for (var i = 0; i < inputs.length; i++) {
        (function (index) {
            var inp = inputs[index];

            inp.addEventListener('input', function (e) {
                // Aceitar apenas números
                var val = this.value.replace(/[^0-9]/g, '');
                this.value = val;

                // Se digitou um número, pular pro próximo
                if (val.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });

            inp.addEventListener('keydown', function (e) {
                // Backspace: voltar para o anterior
                if (e.key === 'Backspace') {
                    if (this.value === '' && index > 0) {
                        inputs[index - 1].focus();
                        inputs[index - 1].value = '';
                    }
                }
                // Seta esquerda
                if (e.key === 'ArrowLeft' && index > 0) {
                    inputs[index - 1].focus();
                }
                // Seta direita
                if (e.key === 'ArrowRight' && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
                // Enter = verificar
                if (e.key === 'Enter') {
                    e.preventDefault();
                    verificarCodigo();
                }
            });

            // Colar código completo
            inp.addEventListener('paste', function (e) {
                e.preventDefault();
                var text = (e.clipboardData || window.clipboardData).getData('text');
                var digits = text.replace(/[^0-9]/g, '');
                for (var j = 0; j < inputs.length && j < digits.length; j++) {
                    inputs[j].value = digits[j];
                }
                if (digits.length >= inputs.length) {
                    inputs[inputs.length - 1].focus();
                }
            });

            // Selecionar ao focar
            inp.addEventListener('focus', function () {
                this.select();
            });
        })(i);
    }

    // Focar no primeiro input
    setTimeout(function () { inputs[0].focus(); }, 1000);

    // ---- OBTER CÓDIGO DIGITADO ----
    function obterCodigo() {
        var code = '';
        for (var i = 0; i < inputs.length; i++) {
            code += inputs[i].value;
        }
        return code;
    }

    // ---- LIMPAR INPUTS ----
    function limparInputs() {
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].value = '';
            inputs[i].classList.remove('error', 'verified');
            inputs[i].disabled = false;
        }
        inputs[0].focus();
    }

    // ---- VERIFICAR CÓDIGO ----
    var verificando = false;

    function verificarCodigo() {
        if (verificando) return;

        var code = obterCodigo();
        console.log('Código digitado:', code, 'Esperado:', codigoAtual);

        if (code.length < 6) {
            showToast('Digite todos os 6 dígitos do código.', 'warning');
            return;
        }

        verificando = true;
        btnVerificar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span class="btn-text">Verificando...</span>';

        setTimeout(function () {
            var result = window.otpService.validateOTP(clienteDados.telefone, code);
            console.log('Resultado validação:', result);

            if (result.success) {
                // ✅ SUCESSO
                showToast('Código verificado com sucesso!', 'success');
                btnVerificar.innerHTML = '<i class="fas fa-check-circle"></i> <span class="btn-text">Verificado!</span>';
                btnVerificar.style.background = '#4CAF50';
                btnVerificar.style.borderColor = '#4CAF50';

                for (var i = 0; i < inputs.length; i++) {
                    inputs[i].classList.add('verified');
                    inputs[i].disabled = true;
                }

                setTimeout(function () {
                    var qNome = encodeURIComponent(clienteDados.nome);
                    var qEmail = encodeURIComponent(clienteDados.email || '');
                    var qTelefone = encodeURIComponent(clienteDados.telefone);
                    window.location.href = 'servicos.html?nome=' + qNome + '&email=' + qEmail + '&telefone=' + qTelefone;
                }, 2000);

            } else {
                // ❌ ERRO
                showToast(result.message, 'error');
                btnVerificar.innerHTML = '<i class="fas fa-shield-alt"></i> <span class="btn-text">Verificar Código</span>';
                verificando = false;

                for (var i = 0; i < inputs.length; i++) {
                    inputs[i].classList.add('error');
                }

                setTimeout(function () {
                    limparInputs();
                }, 800);
            }
        }, 600);
    }

    // ---- BOTÃO VERIFICAR ----
    if (btnVerificar) {
        btnVerificar.onclick = function () {
            console.log('Botão verificar clicado!');
            verificarCodigo();
        };
        console.log('Botão verificar configurado');
    } else {
        console.error('Botão verificar NÃO encontrado!');
    }

    // ---- BOTÃO REENVIAR ----
    if (btnReenviar) {
        btnReenviar.onclick = function () {
            console.log('Botão reenviar clicado!');
            var r = window.otpService.sendOTP(clienteDados.telefone);

            if (r.success) {
                codigoAtual = r.code;
                var devEl = document.getElementById('otpDevCode');
                if (devEl) devEl.textContent = r.code;

                showToast('Novo código enviado!', 'success');
                limparInputs();
                verificando = false;
                btnVerificar.innerHTML = '<i class="fas fa-shield-alt"></i> <span class="btn-text">Verificar Código</span>';
                btnVerificar.style.background = '';
                btnVerificar.style.borderColor = '';

                iniciarTimer();
                iniciarCooldownReenvio(60);

                // Atualizar contador
                var countEl = document.getElementById('resendCount');
                var countText = document.getElementById('resendCountText');
                if (countEl && countText && r.resendCount > 0) {
                    countEl.style.display = 'flex';
                    countText.textContent = 'Reenvio ' + r.resendCount + ' de ' + window.otpService.MAX_RESENDS;
                }
                if (r.resendCount >= window.otpService.MAX_RESENDS) {
                    btnReenviar.disabled = true;
                    document.getElementById('resendBtnText').textContent = 'Limite atingido';
                }
            } else {
                showToast(r.message, 'error');
                if (r.error === 'cooldown') {
                    iniciarCooldownReenvio(r.remainingSeconds);
                }
            }
        };
        console.log('Botão reenviar configurado');
    }

    // ---- TIMER EXPIRAÇÃO ----
    var timerInterval = null;

    function iniciarTimer() {
        if (timerInterval) clearInterval(timerInterval);

        var timerText = document.getElementById('otpTimerText');
        var timerBox = document.getElementById('otpTimer');
        if (!timerText || !timerBox) return;

        timerBox.classList.remove('expired', 'warning');

        timerInterval = setInterval(function () {
            var rest = window.otpService.getTimeRemaining();

            if (rest <= 0) {
                clearInterval(timerInterval);
                timerText.textContent = 'Código expirado!';
                timerBox.classList.add('expired');
                showToast('Código expirado. Clique em reenviar.', 'error');
                return;
            }

            var m = Math.floor(rest / 60000);
            var s = Math.floor((rest % 60000) / 1000);
            timerText.textContent = 'Código expira em ' + m + ':' + (s < 10 ? '0' : '') + s;

            if (rest < 60000) timerBox.classList.add('warning');
        }, 1000);
    }

    // ---- COOLDOWN REENVIO ----
    var cooldownInterval = null;

    function iniciarCooldownReenvio(seg) {
        btnReenviar.disabled = true;
        var btnText = document.getElementById('resendBtnText');
        if (cooldownInterval) clearInterval(cooldownInterval);

        var restante = seg;
        btnText.textContent = 'Reenviar em ' + restante + 's';

        cooldownInterval = setInterval(function () {
            restante--;
            if (restante <= 0) {
                clearInterval(cooldownInterval);
                btnReenviar.disabled = false;
                btnText.textContent = 'Reenviar código';
                return;
            }
            btnText.textContent = 'Reenviar em ' + restante + 's';
        }, 1000);
    }

    // Checar cooldown existente
    var cooldownExistente = window.otpService ? window.otpService.getResendCooldown() : 0;
    if (cooldownExistente > 0) {
        iniciarCooldownReenvio(Math.ceil(cooldownExistente / 1000));
    }

    console.log('Página OTP totalmente inicializada');
});
