/**
 * =================================================================
 * HAIR STYLIST - SERVIÇO DE VERIFICAÇÃO SMS (OTP)
 * Sistema completo de verificação por código SMS
 * =================================================================
 */

class OTPService {
    constructor() {
        // Configurações
        this.CODE_LENGTH = 6;                  // Tamanho do código
        this.CODE_EXPIRY_MS = 5 * 60 * 1000;  // 5 minutos
        this.MAX_ATTEMPTS = 5;                  // Máximo de tentativas
        this.RESEND_COOLDOWN_MS = 60 * 1000;   // 60 segundos entre reenvios
        this.MAX_RESENDS = 3;                   // Máximo de reenvios por sessão
        
        // Storage keys
        this.STORAGE_KEY = 'otpVerification';
        this.VERIFIED_KEY = 'phoneVerified';
        this.VERIFIED_PHONE_KEY = 'verifiedPhone';
    }

    // =================================================================
    // GERAR CÓDIGO OTP
    // =================================================================
    generateCode() {
        // Gerar código numérico aleatório seguro
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        const code = String(array[0]).slice(-this.CODE_LENGTH).padStart(this.CODE_LENGTH, '0');
        return code;
    }

    // =================================================================
    // ENVIAR CÓDIGO SMS (Simulação)
    // =================================================================
    sendOTP(telefone) {
        // Verificar rate limiting de reenvio
        const existing = this.getStoredOTP();
        
        if (existing && existing.telefone === telefone) {
            // Verificar cooldown de reenvio
            const now = Date.now();
            const lastSent = existing.lastSentAt || 0;
            const elapsed = now - lastSent;
            
            if (elapsed < this.RESEND_COOLDOWN_MS) {
                const remainingSeconds = Math.ceil((this.RESEND_COOLDOWN_MS - elapsed) / 1000);
                return {
                    success: false,
                    error: 'cooldown',
                    message: `Aguarde ${remainingSeconds} segundos para reenviar o código.`,
                    remainingSeconds: remainingSeconds
                };
            }
            
            // Verificar limite de reenvios
            if ((existing.resendCount || 0) >= this.MAX_RESENDS) {
                return {
                    success: false,
                    error: 'max_resends',
                    message: 'Limite de reenvios atingido. Tente novamente mais tarde.'
                };
            }
        }

        // Gerar novo código
        const code = this.generateCode();
        const now = Date.now();
        
        // Armazenar temporariamente
        const otpData = {
            telefone: telefone,
            code: code,
            createdAt: now,
            expiresAt: now + this.CODE_EXPIRY_MS,
            lastSentAt: now,
            attempts: 0,
            resendCount: existing && existing.telefone === telefone 
                ? (existing.resendCount || 0) + 1 
                : 0,
            verified: false
        };
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(otpData));
        
        // === SIMULAÇÃO DE ENVIO SMS ===
        // Em produção, aqui seria uma chamada API para um serviço SMS
        // (ex: Twilio, AWS SNS, Firebase Auth, etc.)
        console.log(`[SMS SIMULADO] Código ${code} enviado para ${telefone}`);
        
        return {
            success: true,
            message: 'Código enviado com sucesso!',
            code: code,  // Em produção, NUNCA retornar o código ao frontend
            expiresIn: this.CODE_EXPIRY_MS / 1000, // Em segundos
            resendCount: otpData.resendCount
        };
    }

    // =================================================================
    // VALIDAR CÓDIGO OTP
    // =================================================================
    validateOTP(telefone, inputCode) {
        const stored = this.getStoredOTP();
        
        // Verificar se existe um código armazenado
        if (!stored) {
            return {
                success: false,
                error: 'no_code',
                message: 'Nenhum código foi enviado. Solicite um novo código.'
            };
        }
        
        // Verificar se o telefone corresponde
        if (stored.telefone !== telefone) {
            return {
                success: false,
                error: 'phone_mismatch',
                message: 'Telefone não corresponde ao código enviado.'
            };
        }
        
        // Verificar se já foi verificado
        if (stored.verified) {
            return {
                success: false,
                error: 'already_verified',
                message: 'Este código já foi utilizado.'
            };
        }
        
        // Verificar expiração
        if (Date.now() > stored.expiresAt) {
            this.invalidateOTP();
            return {
                success: false,
                error: 'expired',
                message: 'Código expirado. Solicite um novo código.'
            };
        }
        
        // Verificar limite de tentativas
        if (stored.attempts >= this.MAX_ATTEMPTS) {
            this.invalidateOTP();
            return {
                success: false,
                error: 'max_attempts',
                message: 'Limite de tentativas excedido. Solicite um novo código.'
            };
        }
        
        // Incrementar tentativas
        stored.attempts++;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
        
        // Validar código
        if (stored.code === inputCode) {
            // Código correto - marcar como verificado
            stored.verified = true;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
            
            // Marcar telefone como verificado
            this.markPhoneAsVerified(telefone);
            
            return {
                success: true,
                message: 'Telefone verificado com sucesso!'
            };
        } else {
            const remainingAttempts = this.MAX_ATTEMPTS - stored.attempts;
            return {
                success: false,
                error: 'invalid_code',
                message: `Código incorreto. Você tem ${remainingAttempts} tentativa${remainingAttempts !== 1 ? 's' : ''} restante${remainingAttempts !== 1 ? 's' : ''}.`,
                remainingAttempts: remainingAttempts
            };
        }
    }

    // =================================================================
    // MARCAR TELEFONE COMO VERIFICADO
    // =================================================================
    markPhoneAsVerified(telefone) {
        const verificationData = {
            telefone: telefone,
            verifiedAt: new Date().toISOString(),
            sessionId: Date.now().toString()
        };
        
        localStorage.setItem(this.VERIFIED_KEY, 'true');
        localStorage.setItem(this.VERIFIED_PHONE_KEY, JSON.stringify(verificationData));
        
        console.log('Telefone verificado e marcado:', telefone);
    }

    // =================================================================
    // VERIFICAR SE O TELEFONE ESTÁ VERIFICADO
    // =================================================================
    isPhoneVerified() {
        const verified = localStorage.getItem(this.VERIFIED_KEY);
        return verified === 'true';
    }

    // =================================================================
    // OBTER TELEFONE VERIFICADO
    // =================================================================
    getVerifiedPhone() {
        try {
            const data = localStorage.getItem(this.VERIFIED_PHONE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Erro ao obter telefone verificado:', error);
        }
        return null;
    }

    // =================================================================
    // OBTER DADOS OTP ARMAZENADOS
    // =================================================================
    getStoredOTP() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Erro ao obter dados OTP:', error);
        }
        return null;
    }

    // =================================================================
    // INVALIDAR CÓDIGO OTP
    // =================================================================
    invalidateOTP() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('Código OTP invalidado');
    }

    // =================================================================
    // OBTER TEMPO RESTANTE ATÉ EXPIRAÇÃO
    // =================================================================
    getTimeRemaining() {
        const stored = this.getStoredOTP();
        if (!stored) return 0;
        
        const remaining = stored.expiresAt - Date.now();
        return Math.max(0, remaining);
    }

    // =================================================================
    // OBTER COOLDOWN DE REENVIO RESTANTE
    // =================================================================
    getResendCooldown() {
        const stored = this.getStoredOTP();
        if (!stored || !stored.lastSentAt) return 0;
        
        const elapsed = Date.now() - stored.lastSentAt;
        const remaining = this.RESEND_COOLDOWN_MS - elapsed;
        return Math.max(0, remaining);
    }

    // =================================================================
    // LIMPAR VERIFICAÇÃO (LOGOUT)
    // =================================================================
    clearVerification() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.VERIFIED_KEY);
        localStorage.removeItem(this.VERIFIED_PHONE_KEY);
        console.log('Verificação de telefone limpa');
    }

    // =================================================================
    // OBTER AGENDAMENTOS POR TELEFONE VERIFICADO
    // =================================================================
    getAppointmentsByVerifiedPhone() {
        const verifiedData = this.getVerifiedPhone();
        if (!verifiedData) return [];
        
        try {
            const allAppointments = JSON.parse(localStorage.getItem('meusAgendamentos') || '[]');
            
            // Filtrar apenas agendamentos do telefone verificado
            return allAppointments.filter(apt => {
                // Normalizar telefones para comparação (remover formatação)
                const aptPhone = (apt.telefone || '').replace(/\D/g, '');
                const verifiedPhone = (verifiedData.telefone || '').replace(/\D/g, '');
                return aptPhone === verifiedPhone;
            });
        } catch (error) {
            console.error('Erro ao filtrar agendamentos por telefone:', error);
            return [];
        }
    }
}

// =================================================================
// INSTÂNCIA GLOBAL DO SERVIÇO OTP
// =================================================================
window.otpService = new OTPService();

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OTPService;
}
