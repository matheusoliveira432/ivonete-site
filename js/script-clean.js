/**
 * =================================================================
 * STUDIO STYLIST - VERSÃO LIMPA E FUNCIONAL
 * Sistema de agendamento com navegação fluida
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
        console.log('Iniciando StudioStylistApp...');
        this.setupEventListeners();
        this.loadStoredData();
        this.hideLoadingScreen();
        this.initializeComponents();
        this.updateAgendamentosCount();
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            console.log('Loading screen removido');
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

        // Formulário de agendamento
        const formAgendamento = document.querySelector('#agendamentoForm');
        if (formAgendamento) {
            formAgendamento.addEventListener('submit', (e) => this.handleAgendamento(e));
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
        
        setTimeout(() => {
            window.location.href = 'servicos.html';
        }, 1500);
    }

    handleAgendamento(e) {
        e.preventDefault();
        
        if (!this.dataSelecionada || !this.horarioSelecionado) {
            this.showNotification('Selecione data e horário', 'error');
            return;
        }

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

        this.showSuccessModal();
    }

    showSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    initializeServices() {
        const serviceCards = document.querySelectorAll('.service-card');
        serviceCards.forEach(card => {
            card.addEventListener('click', () => {
                const servico = card.dataset.service;
                this.selectService(servico, card);
            });
        });
    }

    selectService(servico, cardElement) {
        // Remover seleção anterior
        document.querySelectorAll('.service-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Adicionar seleção visual
        cardElement.classList.add('selected');
        
        // Armazenar serviço selecionado
        this.servicoSelecionado = servico;
        localStorage.setItem('servicoSelecionado', servico);
        
        console.log('Serviço selecionado:', servico);
        this.showNotification('Serviço selecionado!', 'success');
    }

    initializeCalendar() {
        // Gerar dias do mês
        const diasContainer = document.getElementById('diasContainer');
        if (diasContainer) {
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
            const horarios = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
            horarios.forEach(horario => {
                const horarioCard = document.createElement('div');
                horarioCard.className = 'horario-card';
                horarioCard.textContent = horario;
                horarioCard.addEventListener('click', () => this.selectTime(horario, horarioCard));
                horariosContainer.appendChild(horarioCard);
            });
        }

        // Configurar botão Confirmar
        const confirmBtn = document.querySelector('.btn-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.handleConfirm());
        }
    }

    selectDate(dia, cardElement) {
        // Remover seleção anterior
        document.querySelectorAll('.dia-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Adicionar seleção visual
        cardElement.classList.add('selected');
        
        this.dataSelecionada = dia;
        console.log('Data selecionada:', dia);
    }

    selectTime(horario, cardElement) {
        // Remover seleção anterior
        document.querySelectorAll('.horario-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Adicionar seleção visual
        cardElement.classList.add('selected');
        
        this.horarioSelecionado = horario;
        console.log('Horário selecionado:', horario);
    }

    handleConfirm() {
        // Verificar se serviço e horário estão selecionados
        if (!this.servicoSelecionado) {
            this.showNotification('Selecione um serviço', 'error');
            return;
        }

        if (!this.dataSelecionada || !this.horarioSelecionado) {
            this.showNotification('Selecione data e horário', 'error');
            return;
        }

        // Mostrar tela de loading obrigatória
        this.showLoadingScreen();

        // Redirecionar após loading
        setTimeout(() => {
            window.location.href = 'agendamento.html';
        }, 2000);
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
            loadingScreen.style.opacity = '1';
            loadingScreen.style.visibility = 'visible';
        }
    }

    displayAppointments() {
        const listaContainer = document.getElementById('listaAgendamentos');
        if (!listaContainer) return;

        if (this.agendamentos.length === 0) {
            listaContainer.innerHTML = '<p>Nenhum agendamento encontrado.</p>';
            return;
        }

        listaContainer.innerHTML = '';
        
        this.agendamentos.forEach(appointment => {
            const item = document.createElement('div');
            item.className = 'appointment-item';
            item.innerHTML = `
                <div class="appointment-info">
                    <strong>${appointment.servico}</strong><br>
                    ${appointment.data} às ${appointment.horario}<br>
                    Status: ${appointment.status}
                </div>
                <button class="btn-cancel" onclick="app.cancelAppointment('${appointment.id}')">
                    Cancelar
                </button>
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
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Inicializar aplicação quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando aplicação...');
    window.app = new StudioStylistApp();
});
