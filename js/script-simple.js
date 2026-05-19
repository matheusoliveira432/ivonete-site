// VERSÃO SIMPLIFICADA - SEM LOOPS INFINITOS
class StudioStylistApp {
    constructor() {
        this.clienteDados = null;
        this.servicoSelecionado = null;
        this.dataSelecionada = null;
        this.horarioSelecionado = null;
        this.init();
    }

    init() {
        console.log('Iniciando sistema simplificado...');
        
        // Esperar DOM carregar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.startSystem();
            });
        } else {
            this.startSystem();
        }
    }

    startSystem() {
        console.log('Sistema iniciado');
        
        // Listener para sincronização
        window.addEventListener('appointmentsUpdated', () => {
            console.log('Agendamentos atualizados');
            if (this.dataSelecionada) {
                this.renderizarHorarios();
            }
            if (document.getElementById('listaAgendamentos')) {
                this.displayAppointments();
            }
        });

        // Iniciar componentes básicos
        this.setupEventListeners();
        this.hideLoadingScreen();
    }

    // Função segura de localStorage
    getAppointments() {
        try {
            const data = localStorage.getItem('agendamentos');
            if (!data) return [];
            return JSON.parse(data);
        } catch (error) {
            console.error('Erro ao ler localStorage:', error);
            return [];
        }
    }

    saveAppointments(appointments) {
        try {
            localStorage.setItem('agendamentos', JSON.stringify(appointments));
            return true;
        } catch (error) {
            console.error('Erro ao salvar localStorage:', error);
            return false;
        }
    }

    // Renderização simplificada
    renderizarHorarios() {
        if (!this.dataSelecionada) return;
        
        try {
            const agendamentos = this.getAppointments();
            const dataFormatada = this.formatDateDisplay(this.dataSelecionada);
            
            const todosBotoes = document.querySelectorAll('.time-slot');
            todosBotoes.forEach(botao => {
                const textoDoBotao = botao.dataset.time;
                const ocupado = agendamentos.find(a => 
                    String(a.data).trim() === String(dataFormatada).trim() &&
                    String(a.horario).trim() === String(textoDoBotao).trim()
                );
                
                if (ocupado) {
                    botao.disabled = true;
                    botao.classList.add('horario-ocupado');
                    botao.classList.remove('selected');
                    const timeElement = botao.querySelector('.time');
                    const statusElement = botao.querySelector('.status');
                    if (timeElement) timeElement.textContent = textoDoBotao;
                    if (statusElement) statusElement.textContent = 'Horário agendado';
                } else {
                    botao.disabled = false;
                    botao.classList.remove('horario-ocupado');
                    const timeElement = botao.querySelector('.time');
                    const statusElement = botao.querySelector('.status');
                    if (timeElement) timeElement.textContent = textoDoBotao;
                    if (statusElement) statusElement.textContent = 'Disponível';
                }
            });
        } catch (error) {
            console.error('Erro em renderizarHorarios:', error);
        }
    }

    // Exclusão simplificada
    performCancelAppointment(appointmentId) {
        try {
            // Lógica exata solicitada
            let lista = JSON.parse(localStorage.getItem('agendamentos')) || [];
            lista = lista.filter(item => item.id !== appointmentId);
            localStorage.setItem('agendamentos', JSON.stringify(lista));
            
            // Atualizar interface
            this.displayAppointments();
            this.updateAgendamentosCount();
            
            // Sincronizar
            window.dispatchEvent(new CustomEvent('appointmentsUpdated'));
            
            this.showNotification('Agendamento cancelado com sucesso', 'success');
            
        } catch (error) {
            console.error('Erro ao cancelar:', error);
            this.showNotification('Erro ao cancelar agendamento', 'error');
        }
    }

    displayAppointments() {
        try {
            const appointments = this.getAppointments();
            const listaContainer = document.getElementById('listaAgendamentos');
            
            if (!listaContainer) return;
            
            if (appointments.length === 0) {
                listaContainer.innerHTML = `
                    <div class="empty-appointments">
                        <i class="fas fa-calendar-times"></i>
                        <p>Você ainda não possui agendamentos</p>
                    </div>
                `;
                return;
            }
            
            listaContainer.innerHTML = '';
            
            appointments.forEach(appointment => {
                const appointmentCard = document.createElement('div');
                appointmentCard.className = 'appointment-card';
                
                if (appointment.status === 'concluido') {
                    appointmentCard.classList.add('completed');
                }
                
                appointmentCard.innerHTML = `
                    <div class="appointment-header">
                        <div class="appointment-info">
                            <h3>${appointment.servico}</h3>
                            <div class="appointment-details">
                                <p><i class="fas fa-calendar"></i> ${appointment.data}</p>
                                <p><i class="fas fa-clock"></i> ${appointment.horario}</p>
                                <p><i class="fas fa-user"></i> ${appointment.cliente}</p>
                                <p><i class="fas fa-phone"></i> ${appointment.telefone}</p>
                            </div>
                        </div>
                        <div class="appointment-status">
                            ${appointment.status === 'concluido' ? 
                                '<span class="status-badge completed">Concluído</span>' : 
                                '<span class="status-badge pending">Pendente</span>'
                            }
                        </div>
                    </div>
                    <div class="appointment-actions">
                        <button class="btn-cancel" onclick="studioStylistApp.performCancelAppointment('${appointment.id}')" title="Cancelar Agendamento">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                `;
                
                listaContainer.appendChild(appointmentCard);
            });
        } catch (error) {
            console.error('Erro em displayAppointments:', error);
        }
    }

    // Funções auxiliares básicas
    formatDateDisplay(date) {
        if (!date) return '';
        const d = new Date(date);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }

    showNotification(message, type = 'info') {
        console.log('Notificação:', message, type);
    }

    updateAgendamentosCount() {
        // Implementação básica
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    setupEventListeners() {
        // Implementação básica
        console.log('Event listeners configurados');
    }
}

// Inicializar sistema
const studioStylistApp = new StudioStylistApp();
