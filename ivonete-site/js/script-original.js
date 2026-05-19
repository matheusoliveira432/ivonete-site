/**
 * =================================================================
 * STUDIO STYLIST - VERSÃO ORIGINAL RECONSTRUÍDA
 * Sistema de agendamento com fluxo original completo
 * =================================================================
 */

class StudioStylistApp {
    constructor() {
        this.clienteDados = null;
        this.servicoSelecionado = null;
        this.dataSelecionada = null;
        this.horarioSelecionado = null;
        this.agendamentos = [];
        this.init();
    }

    init() {
        console.log('Iniciando StudioStylistApp - Versão Original');
        this.setupEventListeners();
        this.loadStoredData();
        this.hideLoadingScreen();
        this.initializeComponents();
        this.updateAgendamentosCount();
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                console.log('Loading screen removido');
            }, 1000);
        }
    }

    loadStoredData() {
        try {
            const clienteDados = localStorage.getItem('clienteDados');
            if (clienteDados) {
                this.clienteDados = JSON.parse(clienteDados);
            }

            const servicoSelecionado = localStorage.getItem('servicoSelecionado');
            if (servicoSelecionado) {
                this.servicoSelecionado = servicoSelecionado;
                this.updateSelectedServiceDisplay();
                this.restoreServiceSelection();
            }

            const agendamentos = localStorage.getItem('agendamentos');
            if (agendamentos) {
                this.agendamentos = JSON.parse(agendamentos);
            } else {
                this.agendamentos = [];
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    }

    setupEventListeners() {
        // Botões de agendamentos
        const btnAgendamentos = document.querySelectorAll('#btnMeusAgendamentos');
        btnAgendamentos.forEach(btn => {
            btn.addEventListener('click', () => this.openModal('modalAgendamentos'));
        });

        // Botões de fechar modal
        const closeButtons = document.querySelectorAll('.modal-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Formulário de cadastro
        const formCadastro = document.querySelector('.registration-form');
        if (formCadastro) {
            formCadastro.addEventListener('submit', (e) => this.handleCadastro(e));
        }

        // Botão de avançar para serviços
        const btnAvancar = document.querySelector('.btn-submit');
        if (btnAvancar) {
            btnAvancar.addEventListener('click', (e) => this.handleAvancarServicos(e));
        }

        // Botão de confirmar agendamento
        const btnConfirmar = document.querySelector('.btn-confirm');
        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', (e) => this.handleConfirmarAgendamento(e));
        }

        // Botão de sucesso OK
        const btnSuccessOk = document.getElementById('btnSuccessOk');
        if (btnSuccessOk) {
            btnSuccessOk.addEventListener('click', () => {
                this.closeModal('successModal');
                window.location.href = 'index.html';
            });
        }
    }

    initializeComponents() {
        if (document.getElementById('diasContainer')) {
            this.initializeCalendar();
        }

        if (document.querySelector('.services-grid')) {
            this.initializeServices();
        }

        if (document.getElementById('listaAgendamentos')) {
            this.displayAppointments();
        }
    }

    handleCadastro(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        this.clienteDados = {
            nome: formData.get('nome'),
            email: formData.get('email'),
            telefone: formData.get('telefone')
        };

        localStorage.setItem('clienteDados', JSON.stringify(this.clienteDados));
        
        this.showNotification('Cadastro realizado com sucesso!', 'success');
        
        // Mostrar loading e redirecionar
        this.showLoadingScreen();
        setTimeout(() => {
            window.location.href = 'servicos.html';
        }, 1500);
    }

    handleAvancarServicos(e) {
        e.preventDefault();
        
        // Mostrar loading e redirecionar para serviços
        this.showLoadingScreen();
        setTimeout(() => {
            window.location.href = 'servicos.html';
        }, 1000);
    }

    initializeServices() {
        const serviceCards = document.querySelectorAll('.service-card');
        serviceCards.forEach(card => {
            card.addEventListener('click', () => {
                const servico = card.dataset.service || card.querySelector('.service-title')?.textContent;
                this.selectService(servico, card);
            });
        });
    }

    selectService(servico, cardElement) {
        // Remover seleção anterior
        document.querySelectorAll('.service-card').forEach(card => {
            card.classList.remove('selected');
            card.style.border = '';
            card.style.transform = '';
        });
        
        // Adicionar seleção visual
        cardElement.classList.add('selected');
        cardElement.style.border = '3px solid #4a90e2';
        cardElement.style.transform = 'scale(1.05)';
        
        // Armazenar serviço selecionado
        this.servicoSelecionado = servico;
        localStorage.setItem('servicoSelecionado', servico);
        
        console.log('Serviço selecionado:', servico);
        this.showNotification('Serviço selecionado!', 'success');
    }

    restoreServiceSelection() {
        const serviceCards = document.querySelectorAll('.service-card');
        serviceCards.forEach(card => {
            const servico = card.dataset.service || card.querySelector('.service-title')?.textContent;
            if (servico === this.servicoSelecionado) {
                card.classList.add('selected');
                card.style.border = '3px solid #4a90e2';
                card.style.transform = 'scale(1.05)';
            }
        });
    }

    initializeCalendar() {
        // Gerar dias do mês
        const diasContainer = document.getElementById('diasContainer');
        if (diasContainer) {
            diasContainer.innerHTML = '';
            for (let i = 1; i <= 30; i++) {
                const diaCard = document.createElement('div');
                diaCard.className = 'dia-card';
                diaCard.textContent = i;
                diaCard.addEventListener('click', () => this.selectDate(i, diaCard));
                diasContainer.appendChild(diaCard);
            }
        }

        // Gerar horários
        const horariosContainer = document.getElementById('horariosContainer');
        if (horariosContainer) {
            horariosContainer.innerHTML = '';
            const horarios = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
            horarios.forEach(horario => {
                const horarioCard = document.createElement('div');
                horarioCard.className = 'horario-card';
                horarioCard.textContent = horario;
                horarioCard.addEventListener('click', () => this.selectTime(horario, horarioCard));
                horariosContainer.appendChild(horarioCard);
            });
        }
    }

    selectDate(dia, cardElement) {
        // Remover seleção anterior
        document.querySelectorAll('.dia-card').forEach(card => {
            card.classList.remove('selected');
            card.style.backgroundColor = '';
        });
        
        // Adicionar seleção visual
        cardElement.classList.add('selected');
        cardElement.style.backgroundColor = '#4a90e2';
        cardElement.style.color = 'white';
        
        this.dataSelecionada = dia;
        console.log('Data selecionada:', dia);
    }

    selectTime(horario, cardElement) {
        // Remover seleção anterior
        document.querySelectorAll('.horario-card').forEach(card => {
            card.classList.remove('selected');
            card.style.backgroundColor = '';
            card.style.color = '';
        });
        
        // Adicionar seleção visual
        cardElement.classList.add('selected');
        cardElement.style.backgroundColor = '#4a90e2';
        cardElement.style.color = 'white';
        
        this.horarioSelecionado = horario;
        console.log('Horário selecionado:', horario);
    }

    handleConfirmarAgendamento(e) {
        e.preventDefault();
        
        // Verificar se serviço e horário estão selecionados
        if (!this.servicoSelecionado) {
            this.showNotification('Selecione um serviço', 'error');
            return;
        }

        if (!this.dataSelecionada || !this.horarioSelecionado) {
            this.showNotification('Selecione data e horário', 'error');
            return;
        }

        // Criar agendamento
        const agendamento = {
            id: Date.now().toString(),
            cliente: this.clienteDados.nome,
            email: this.clienteDados.email,
            telefone: this.clienteDados.telefone,
            servico: this.servicoSelecionado,
            data: this.dataSelecionada,
            horario: this.horarioSelecionado,
            status: 'pendente',
            dataCriacao: new Date().toISOString()
        };

        this.agendamentos.push(agendamento);
        localStorage.setItem('agendamentos', JSON.stringify(this.agendamentos));

        // Mostrar loading e sucesso
        this.showLoadingScreen();
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showSuccessModal();
        }, 2000);
    }

    showSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    displayAppointments() {
        const listaContainer = document.getElementById('listaAgendamentos');
        if (!listaContainer) return;

        if (this.agendamentos.length === 0) {
            listaContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h3>Nenhum agendamento</h3>
                    <p>Você ainda não possui agendamentos marcados.</p>
                    <button class="btn-primary" onclick="app.handleNewAppointment()">
                        Agendar Horário
                    </button>
                </div>
            `;
            return;
        }

        listaContainer.innerHTML = '';
        
        this.agendamentos.forEach(appointment => {
            const item = document.createElement('div');
            item.className = 'appointment-item';
            item.innerHTML = `
                <div class="appointment-info">
                    <div class="appointment-service">${appointment.servico}</div>
                    <div class="appointment-details">
                        <i class="fas fa-calendar"></i> ${appointment.data} às ${appointment.horario}
                    </div>
                    <div class="appointment-details">
                        <i class="fas fa-user"></i> ${appointment.cliente}
                    </div>
                    <div class="appointment-status ${appointment.status}">
                        ${appointment.status === 'pendente' ? 'Pendente' : 'Concluído'}
                    </div>
                </div>
                <div class="appointment-actions">
                    <button class="btn-cancel" onclick="app.cancelAppointment('${appointment.id}')">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
            `;
            listaContainer.appendChild(item);
        });
    }

    cancelAppointment(id) {
        if (confirm('Deseja cancelar este agendamento?')) {
            this.agendamentos = this.agendamentos.filter(a => a.id !== id);
            localStorage.setItem('agendamentos', JSON.stringify(this.agendamentos));
            
            this.displayAppointments();
            this.updateAgendamentosCount();
            
            this.showNotification('Agendamento cancelado com sucesso', 'success');
        }
    }

    handleNewAppointment() {
        this.closeModal('modalAgendamentos');
        this.showLoadingScreen();
        setTimeout(() => {
            window.location.href = 'servicos.html';
        }, 1000);
    }

    updateAgendamentosCount() {
        const countElements = document.querySelectorAll('#agendamentosCount');
        const count = this.agendamentos.filter(a => a.status !== 'concluido').length;
        countElements.forEach(element => {
            element.textContent = count;
        });
    }

    updateSelectedServiceDisplay() {
        const displayElements = document.querySelectorAll('.selected-service');
        displayElements.forEach(element => {
            element.textContent = this.servicoSelecionado;
        });
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
            loadingScreen.style.opacity = '1';
            loadingScreen.style.visibility = 'visible';
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Estilos inline para garantir funcionamento
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 500;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Inicializar aplicação quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando aplicação original...');
    window.app = new StudioStylistApp();
});
