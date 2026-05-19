/**
 * VERSÃO TESTE - COM TELA DE CARREGAMENTO
 */

console.log("Script de teste carregado");

// Remover loading após 2 segundos
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado, removendo loading em 2 segundos...");
    
    setTimeout(() => {
        const loading = document.getElementById('loadingScreen');
        if (loading) {
            loading.style.display = 'none';
            console.log("Loading removido após 2 segundos");
        }
    }, 2000);
});

// Classe mínima para não quebrar o site
class StudioStylistApp {
    constructor() {
        console.log("StudioStylistApp construído");
        this.init();
    }
    
    init() {
        console.log("StudioStylistApp inicializado");
        this.setupEventListeners();
        this.setupPhoneMask();
    }
    
    setupPhoneMask() {
        const phoneInput = document.getElementById('telefone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                this.applyPhoneMask(e.target);
            });
            
            phoneInput.addEventListener('keydown', (e) => {
                // Permitir apenas números, backspace, delete, tab, escape, enter
                const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'];
                if (!allowedKeys.includes(e.key) && !/[0-9]/.test(e.key)) {
                    e.preventDefault();
                }
            });
            
            console.log("Máscara de telefone configurada");
        }
    }
    
    applyPhoneMask(input) {
        let value = input.value.replace(/\D/g, ''); // Remove tudo que não é dígito
        let formattedValue = '';
        
        // Limitar a 11 dígitos (celular)
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        
        // Aplicar máscara (XX) XXXXX-XXXX
        if (value.length > 0) {
            // Adicionar parênteses do DDD
            if (value.length >= 2) {
                formattedValue += '(' + value.substring(0, 2) + ')';
                if (value.length > 2) {
                    formattedValue += ' ';
                }
            } else {
                formattedValue += '(' + value;
            }
            
            // Adicionar os primeiros 5 dígitos após o DDD
            if (value.length > 2) {
                const remaining = value.substring(2);
                if (remaining.length <= 5) {
                    formattedValue += remaining;
                } else {
                    formattedValue += remaining.substring(0, 5);
                    formattedValue += '-';
                    // Adicionar os últimos dígitos
                    if (remaining.length > 5) {
                        formattedValue += remaining.substring(5, 9);
                    }
                }
            }
        }
        
        input.value = formattedValue;
    }
    
    setupEventListeners() {
        // Configurar formulário de cadastro
        const form = document.querySelector('.registration-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCadastro();
            });
        }
        
        // Botão de serviço → agendamento
        const serviceBtns = document.querySelectorAll('.service-card');
        serviceBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                console.log("Serviço selecionado, indo para agendamento...");
                this.showLoadingAndRedirect('agendamento.html');
            });
        });
    }
    
    handleCadastro() {
        console.log("Processando cadastro...");
        
        // Obter dados do formulário
        const formData = new FormData(document.querySelector('.registration-form'));
        const clienteDados = {
            nome: formData.get('nome'),
            email: formData.get('email'),
            telefone: formData.get('telefone'),
            dataCadastro: new Date().toISOString()
        };
        
        // Salvar no localStorage
        localStorage.setItem('clienteDados', JSON.stringify(clienteDados));
        
        // Mostrar mensagem de sucesso verde
        this.showSuccessMessage('Cadastro realizado com sucesso!');
        
        // Redirecionar para serviços após 2 segundos
        setTimeout(() => {
            this.showLoadingAndRedirect('servicos.html');
        }, 2000);
    }
    
    showSuccessMessage(message) {
        // Criar mensagem de sucesso verde
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
            z-index: 1000;
            font-weight: 500;
            animation: slideInRight 0.3s ease;
        `;
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i> ${message}
        `;
        
        // Adicionar animação CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(successDiv);
        
        // Remover após 5 segundos
        setTimeout(() => {
            successDiv.remove();
            style.remove();
        }, 5000);
        
        console.log("Mensagem de sucesso exibida:", message);
    }
    
    showLoadingAndRedirect(url) {
        // Mostrar loading novamente
        const loading = document.getElementById('loadingScreen');
        if (loading) {
            loading.style.display = 'flex';
            console.log("Loading mostrado para transição");
            
            // Redirecionar após 1 segundo
            setTimeout(() => {
                window.location.href = url;
            }, 1000);
        }
    }
}

// Inicializar
const app = new StudioStylistApp();
