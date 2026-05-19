/**
 * =================================================================
   STUDIO STYLIST - PAINEL ADMINISTRATIVO
   Interface para gerenciamento de agendamentos em tabela semanal
   =================================================================
 */

class AdminPanel {
    constructor() {
        this.currentWeekOffset = 0;
        this.appointments = [];
        this.selectedAppointment = null;
        this.init();
    }

    // =================================================================
    // INICIALIZAÇÃO
    // =================================================================
    init() {
        console.log('=== INICIANDO PAINEL ADMINISTRATIVO ===');
        const today = new Date();
        console.log('Data de hoje:', today.toLocaleDateString('pt-BR'));
        console.log('Dia da semana de hoje:', today.getDay()); // 0=Domingo, 1=Segunda...
        
        this.hideLoadingScreen();
        this.setupEventListeners();
        this.generateScheduleTable();
        this.loadAppointments();
        this.updateWeekDisplay();
        
        // Mostrar semana atual para debug
        const currentWeekDates = this.getWeekDates(0);
        console.log('Semana atual calculada:', currentWeekDates.map(d => `${d.toLocaleDateString('pt-BR')} (${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()]})`));
    }

    // =================================================================
    // OCULTAR LOADING
    // =================================================================
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 1000);
        }
    }

    // =================================================================
    // CONFIGURAR EVENT LISTENERS
    // =================================================================
    setupEventListeners() {
        // Navegação entre semanas
        document.getElementById('prevWeek')?.addEventListener('click', () => {
            this.changeWeek(-1);
        });

        document.getElementById('nextWeek')?.addEventListener('click', () => {
            this.changeWeek(1);
        });

        // Modal de detalhes
        document.getElementById('modalClose')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('btnComplete')?.addEventListener('click', () => {
            this.markAsCompleted();
        });

        document.getElementById('btnDelete')?.addEventListener('click', () => {
            this.showConfirmModal();
        });

        // Modal de confirmação
        document.getElementById('btnConfirmCancel')?.addEventListener('click', () => {
            this.hideConfirmModal();
        });

        document.getElementById('btnConfirmDelete')?.addEventListener('click', () => {
            this.confirmDelete();
        });

        // Fechar modal ao clicar fora
        document.getElementById('appointmentModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });

        document.getElementById('confirmModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget || e.target.classList.contains('confirm-overlay')) {
                this.hideConfirmModal();
            }
        });
    }

    // =================================================================
    // GERAR TABELA DE HORÁRIOS
    // =================================================================
    generateScheduleTable() {
        const tbody = document.getElementById('scheduleBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Horários que correspondem aos slots disponíveis no agendamento
        const hours = [
            '09:00', '10:00', '11:00',
            '14:00', '15:00', '16:00', '16:30', '17:00',
            '18:00', '19:00', '20:00'
        ];

        hours.forEach(hour => {
            const row = document.createElement('tr');
            
            // Coluna do horário
            const timeCell = document.createElement('td');
            timeCell.className = 'time-slot';
            timeCell.textContent = hour;
            row.appendChild(timeCell);

            // Colunas dos dias da semana (Segunda a Sábado - 6 dias)
            for (let day = 1; day <= 6; day++) {
                const cell = document.createElement('td');
                cell.dataset.hour = hour;
                cell.dataset.day = day;
                cell.className = 'schedule-cell';
                
                // Adicionar indicador de vago
                const emptySlot = document.createElement('div');
                emptySlot.className = 'empty-slot';
                emptySlot.innerHTML = '<i class="fas fa-plus"></i>';
                cell.appendChild(emptySlot);
                
                row.appendChild(cell);
            }

            tbody.appendChild(row);
        });
    }

    // =================================================================
    // CARREGAR AGENDAMENTOS DO LOCALSTORAGE
    // =================================================================
    loadAppointments() {
        try {
            const stored = localStorage.getItem('meusAgendamentos');
            this.appointments = stored ? JSON.parse(stored) : [];
            console.log('Agendamentos carregados:', this.appointments.length);
            this.populateScheduleTable();
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            this.appointments = [];
        }
    }

    // =================================================================
    // PREENCHER TABELA COM AGENDAMENTOS
    // =================================================================
    populateScheduleTable() {
        // Limpar completamente todas as células
        const allCells = document.querySelectorAll('.schedule-cell');
        allCells.forEach(cell => {
            cell.innerHTML = '';
            // Adicionar indicador de vago
            const emptySlot = document.createElement('div');
            emptySlot.className = 'empty-slot';
            emptySlot.innerHTML = '<i class="fas fa-plus"></i>';
            cell.appendChild(emptySlot);
        });

        // Obter datas da semana atual como strings YYYY-MM-DD
        const weekDates = this.getWeekDates(this.currentWeekOffset);
        const weekDateStrings = weekDates.map(d => 
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        );
        console.log('Datas da semana (ISO):', weekDateStrings);

        this.appointments.forEach(appointment => {
            // Obter data ISO do agendamento
            const dateISO = this.getAppointmentDateISO(appointment);
            if (!dateISO) {
                console.warn('Não foi possível obter data ISO do agendamento:', appointment.data);
                return;
            }

            // Verificar se está na semana atual
            const dayIndex = weekDateStrings.indexOf(dateISO);
            if (dayIndex === -1) return;

            // Encontrar a célula correspondente
            const cell = document.querySelector(`[data-day="${dayIndex + 1}"][data-hour="${appointment.horario}"]`);
            if (!cell) {
                console.warn('Célula não encontrada para hora:', appointment.horario);
                return;
            }

            // Apenas 1 agendamento por célula
            if (cell.querySelector('.appointment-card')) return;

            // Remover indicador de vago
            const emptySlot = cell.querySelector('.empty-slot');
            if (emptySlot) emptySlot.remove();

            // Criar card do agendamento
            const card = this.createAppointmentCard(appointment);
            cell.appendChild(card);
        });
    }

    // =================================================================
    // OBTER DATA ISO DO AGENDAMENTO
    // =================================================================
    getAppointmentDateISO(appointment) {
        // Usar dataISO se disponível (formato novo)
        if (appointment.dataISO) {
            return appointment.dataISO;
        }

        // Fallback: tentar parsear do campo data
        const parsed = this.parseAppointmentDate(appointment.data);
        if (parsed) {
            return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
        }

        // Fallback: tentar dataObj (formato DD/MM/YYYY)
        if (appointment.dataObj) {
            const match = appointment.dataObj.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (match) {
                return `${match[3]}-${match[2]}-${match[1]}`;
            }
        }

        return null;
    }

    // =================================================================
    // CRIAR CARD DE AGENDAMENTO
    // =================================================================
    createAppointmentCard(appointment) {
        const card = document.createElement('div');
        card.className = `appointment-card ${appointment.status || ''}`;
        card.dataset.id = appointment.id;
        
        // Aplicar cor de fundo baseada no status
        if (appointment.status === 'concluido') {
            card.style.background = '#28a745'; // Verde para concluídos
        }
        
        card.innerHTML = `
            <div class="appointment-client-name">${appointment.cliente}</div>
            <div class="appointment-service-name">${appointment.servico}</div>
            <div class="appointment-phone">${appointment.telefone}</div>
            <div class="appointment-actions">
                ${appointment.status !== 'concluido' ? 
                    `<button class="btn-complete" onclick="adminPanel.markAsComplete('${appointment.id}')" title="Marcar como Concluído">
                        <i class="fas fa-check"></i>
                    </button>` : 
                    `<span class="status-badge completed">Concluído</span>`
                }
                <button class="btn-delete" onclick="adminPanel.deleteAppointment('${appointment.id}')" title="Excluir Agendamento">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Adicionar evento de clique para mostrar detalhes (apenas no conteúdo, não nos botões)
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.appointment-actions')) {
                this.showAppointmentDetails(appointment);
            }
        });

        return card;
    }

    // =================================================================
    // GERENCIAR AGENDAMENTOS
    // =================================================================
    markAsComplete(appointmentId) {
        try {
            console.log('Marcando agendamento como concluído:', appointmentId);
            
            // Obter agendamentos atuais do localStorage
            let appointments = JSON.parse(localStorage.getItem('meusAgendamentos')) || [];
            console.log('Agendamentos antes da conclusão:', appointments.length);
            
            // Encontrar o agendamento
            const appointmentIndex = appointments.findIndex(app => app.id === appointmentId);
            if (appointmentIndex === -1) {
                console.error('Agendamento não encontrado:', appointmentId);
                this.showNotification('Agendamento não encontrado', 'error');
                return;
            }

            // Atualizar status
            appointments[appointmentIndex].status = 'concluido';
            console.log('Status atualizado para concluído');
            
            // Salvar no localStorage
            localStorage.setItem('meusAgendamentos', JSON.stringify(appointments));
            console.log('Agendamentos salvos no localStorage');
            
            // Atualizar array local
            this.appointments = appointments;
            
            // Fechar modal
            const modal = document.getElementById('appointmentModal');
            if (modal) {
                modal.classList.remove('active');
            }
            
            // Atualizar interface do Painel
            this.populateScheduleTable();
            console.log('Tabela do Painel atualizada');
            
            // Disparar evento para sincronizar com outras páginas
            window.dispatchEvent(new CustomEvent('appointmentsUpdated'));
            console.log('Evento de sincronização disparado');
            
            // Mostrar notificação
            this.showNotification('Agendamento marcado como concluído com sucesso', 'success');
            
        } catch (error) {
            console.error('Erro ao marcar agendamento como concluído:', error);
            this.showNotification('Erro ao marcar agendamento como concluído', 'error');
        }
    }

    deleteAppointment(appointmentId) {
        const agendamentos = JSON.parse(localStorage.getItem('meusAgendamentos')) || [];
        const novosAgendamentos = agendamentos.filter(a => a.id !== appointmentId);
        localStorage.setItem('meusAgendamentos', JSON.stringify(novosAgendamentos));
        window.location.reload();
    }

    showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Estilos
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        // Cor baseada no tipo
        switch(type) {
            case 'success':
                notification.style.background = '#28a745';
                break;
            case 'error':
                notification.style.background = '#dc3545';
                break;
            default:
                notification.style.background = '#007bff';
        }
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    showAppointmentDetails(appointment) {
        this.selectedAppointment = appointment;
        
        const modal = document.getElementById('appointmentModal');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalBody) return;

        modalBody.innerHTML = `
            <div class="detail-item">
                <span class="detail-label">Cliente:</span>
                <span class="detail-value">${appointment.cliente}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Serviço:</span>
                <span class="detail-value">${appointment.servico}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Data:</span>
                <span class="detail-value">${appointment.data}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Horário:</span>
                <span class="detail-value">${appointment.horario}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Telefone:</span>
                <span class="detail-value">${appointment.telefone}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${appointment.email}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${this.getStatusText(appointment.status)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Agendado em:</span>
                <span class="detail-value">${this.formatDate(appointment.criadoEm)}</span>
            </div>
            <div class="modal-actions">
                ${appointment.status !== 'concluido' ? 
                    `<button class="btn-complete-modal" onclick="adminPanel.markAsComplete('${appointment.id}')">
                        <i class="fas fa-check"></i> Marcar como Concluído
                    </button>` : 
                    `<span class="status-badge completed">Concluído</span>`
                }
                <button class="btn-delete-modal" onclick="adminPanel.deleteAppointment('${appointment.id}')">
                    <i class="fas fa-trash"></i> Excluir Agendamento
                </button>
            </div>
        `;

        // Atualizar botões
        const btnComplete = document.getElementById('btnComplete');
        if (btnComplete) {
            btnComplete.style.display = appointment.status === 'completed' ? 'none' : 'block';
            btnComplete.textContent = appointment.status === 'completed' ? 'Concluído' : 'Marcar como Concluído';
        }

        modal.classList.add('active');
    }

    // =================================================================
    // FECHAR MODAL
    // =================================================================
    closeModal() {
        const modal = document.getElementById('appointmentModal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.selectedAppointment = null;
    }

    // =================================================================
    // MARCAR COMO CONCLUÍDO
    // =================================================================
    markAsCompleted() {
        if (!this.selectedAppointment) return;

        const appointmentIndex = this.appointments.findIndex(a => a.id === this.selectedAppointment.id);
        if (appointmentIndex !== -1) {
            this.appointments[appointmentIndex].status = 'completed';
            this.saveAppointments();
            this.loadAppointments();
            this.closeModal();
            this.showNotification('Agendamento marcado como concluído', 'success');
        }
    }

    // =================================================================
    // EXCLUIR AGENDAMENTO (LEGADO - MANTIDO PARA COMPATIBILIDADE)
    // =================================================================
    deleteAppointment() {
        // Método mantido para compatibilidade, mas redireciona para o modal
        this.showConfirmModal();
    }

    // =================================================================
    // MODAL DE CONFIRMAÇÃO
    // =================================================================
    showConfirmModal() {
        const modal = document.getElementById('confirmModal');
        if (modal) {
            modal.classList.add('active');
            // Focar no botão cancelar para acessibilidade
            setTimeout(() => {
                document.getElementById('btnConfirmCancel')?.focus();
            }, 100);
        }
    }

    hideConfirmModal() {
        const modal = document.getElementById('confirmModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    confirmDelete() {
        if (!this.selectedAppointment) return;

        this.appointments = this.appointments.filter(a => a.id !== this.selectedAppointment.id);
        this.saveAppointments();
        this.loadAppointments();
        this.hideConfirmModal();
        this.closeModal();
        this.showNotification('Agendamento excluído com sucesso', 'success');
    }

    // =================================================================
    // SALVAR AGENDAMENTOS NO LOCALSTORAGE
    // =================================================================
    saveAppointments() {
        try {
            localStorage.setItem('meusAgendamentos', JSON.stringify(this.appointments));
        } catch (error) {
            console.error('Erro ao salvar agendamentos:', error);
            this.showNotification('Erro ao salvar agendamentos', 'error');
        }
    }

    // =================================================================
    // MUDAR SEMANA
    // =================================================================
    changeWeek(offset) {
        this.currentWeekOffset += offset;
        this.updateWeekDisplay();
        this.populateScheduleTable();
    }

    // =================================================================
    // ATUALIZAR DISPLAY DA SEMANA
    // =================================================================
    updateWeekDisplay() {
        const weekDisplay = document.getElementById('weekDisplay');
        if (!weekDisplay) return;

        const weekDates = this.getWeekDates(this.currentWeekOffset);
        
        // Validar se temos datas válidas
        if (!weekDates || weekDates.length === 0) {
            console.error('Nenhuma data válida encontrada para a semana');
            weekDisplay.textContent = 'Semana (Data inválida)';
            return;
        }

        const startDate = weekDates[0];
        const endDate = weekDates[5]; // Sábado (índice 5) - último dia da semana

        // Validar se as datas são válidas
        if (!(startDate instanceof Date) || !(endDate instanceof Date) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error('Datas inválidas encontradas:', { startDate, endDate });
            weekDisplay.textContent = 'Semana (Data inválida)';
            return;
        }

        try {
            const startStr = startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            const endStr = endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

            // Nomenclatura padrão conforme solicitado
            if (this.currentWeekOffset === 0) {
                weekDisplay.textContent = `Semana Atual (${startStr} - ${endStr})`;
            } else if (this.currentWeekOffset === 1) {
                weekDisplay.textContent = `Próxima Semana (${startStr} - ${endStr})`;
            } else if (this.currentWeekOffset < 0) {
                weekDisplay.textContent = `Semana Anterior (${startStr} - ${endStr})`;
            } else {
                weekDisplay.textContent = `Próxima Semana (${startStr} - ${endStr})`;
            }
        } catch (error) {
            console.error('Erro ao formatar datas:', error);
            weekDisplay.textContent = 'Semana (Erro de formatação)';
        }
    }

    // =================================================================
    // OBTER DATAS DA SEMANA
    // =================================================================
    getWeekDates(weekOffset = 0) {
        try {
            const today = new Date();
            
            // Validar data atual
            if (isNaN(today.getTime())) {
                console.error('Data atual inválida');
                return [];
            }
            
            const currentDay = today.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
            
            // Calcular a segunda-feira da semana atual
            // Se hoje é Domingo (0), voltar 6 dias para chegar na segunda-feira
            // Se hoje é Segunda (1), voltar 0 dias  
            // Se hoje é Terça (2), voltar 1 dia, etc.
            const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
            
            // Criar data da segunda-feira sem problemas de fuso horário
            const mondayDate = new Date(today);
            mondayDate.setDate(today.getDate() + daysToMonday + (weekOffset * 7));
            
            // Validar data da segunda-feira
            if (isNaN(mondayDate.getTime())) {
                console.error('Data da segunda-feira inválida');
                return [];
            }
            
            // Formatar como YYYY-MM-DD para evitar UTC issues
            const mondayStr = `${mondayDate.getFullYear()}-${String(mondayDate.getMonth() + 1).padStart(2, '0')}-${String(mondayDate.getDate()).padStart(2, '0')}`;
            const monday = new Date(mondayStr + 'T12:00:00'); // Forçar meio-dia horário local

            // Validar data final da segunda-feira
            if (isNaN(monday.getTime())) {
                console.error('Data final da segunda-feira inválida');
                return [];
            }

            const weekDates = [];
            for (let i = 0; i < 6; i++) { // Apenas 6 dias: Segunda a Sábado
                // Criar cada dia da semana sem problemas de fuso horário
                const dayDate = new Date(monday);
                dayDate.setDate(monday.getDate() + i);
                
                // Validar cada dia
                if (isNaN(dayDate.getTime())) {
                    console.error(`Data inválida para o dia ${i} da semana`);
                    continue; // Pular este dia inválido
                }
                
                const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
                const date = new Date(dateStr + 'T12:00:00');
                
                // Validar data final
                if (!isNaN(date.getTime())) {
                    weekDates.push(date);
                } else {
                    console.error(`Data final inválida para o dia ${i}: ${dateStr}`);
                }
            }

            // Garantir que temos pelo menos 6 dias válidos
            if (weekDates.length < 6) {
                console.warn(`Apenas ${weekDates.length} dias válidos encontrados (esperava 6)`);
            }

            console.log(`Semana offset ${weekOffset} (calculada a partir de ${today.toLocaleDateString('pt-BR')}):`, weekDates.map(d => `${d.toLocaleDateString('pt-BR')} (${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()]})`));
            console.log('Timestamps das datas:', weekDates.map(d => d.getTime()));
            
            return weekDates;
            
        } catch (error) {
            console.error('Erro no getWeekDates:', error);
            return [];
        }
    }

    // =================================================================
    // PARAR DATA DO AGENDAMENTO
    // =================================================================
    parseAppointmentDate(dateString) {
        console.log('=== PARSEANDO DATA ===');
        console.log('String original:', dateString);
        
        // Tentar diferentes formatos de data
        const formats = [
            /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
            /^(\d{2})\/(\d{2})\/(\d{2})$/,  // DD/MM/YY
            /^(\w{3})\s+(\d{2})\/(\d{2})$/ // "Qua 29/04" - formato abreviado
        ];

        for (const format of formats) {
            const match = dateString.match(format);
            if (match) {
                console.log('Formato detectado:', format);
                console.log('Match groups:', match);
                
                if (format === formats[2]) {
                    // Formato "Qua 29/04" - extrair dia e mês, ano atual
                    const dayAbbrev = match[1]; // "Qua"
                    const day = parseInt(match[2]);
                    const month = parseInt(match[3]) - 1;
                    const year = new Date().getFullYear();
                    
                    console.log('Abreviação do dia:', dayAbbrev);
                    console.log('Dia:', day);
                    console.log('Mês:', month);
                    console.log('Ano:', year);
                    
                    // Criar data sem problemas de fuso horário
                    // Usar formato YYYY-MM-DD para evitar UTC issues
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const date = new Date(dateStr + 'T12:00:00'); // Forçar meio-dia horário local
                    
                    console.log('Data string criada:', dateStr);
                    console.log('Data criada (sem fuso):', date.toLocaleDateString('pt-BR'));
                    console.log('Data getTime():', date.getTime());
                    
                    // Verificar se o dia da semana bate
                    const expectedDayIndex = this.getDayIndexFromAbbreviation(dayAbbrev);
                    const actualDayIndex = date.getDay();
                    
                    console.log('Dia da semana esperado:', expectedDayIndex, `(${dayAbbrev})`);
                    console.log('Dia da semana real:', actualDayIndex, `(${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][actualDayIndex]})`);
                    
                    // Ajustar se necessário (considerando domingo=0)
                    if (expectedDayIndex !== actualDayIndex) {
                        console.log(`Ajustando dia da semana: esperado ${expectedDayIndex}, atual ${actualDayIndex}`);
                        // Encontrar o próximo dia correto no mesmo mês
                        for (let offset = 0; offset < 7; offset++) {
                            const adjustedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day + offset).padStart(2, '0')}`;
                            const adjustedDate = new Date(adjustedDateStr + 'T12:00:00');
                            if (adjustedDate.getDay() === expectedDayIndex) {
                                console.log('Data ajustada:', adjustedDate.toLocaleDateString('pt-BR'));
                                return adjustedDate;
                            }
                        }
                    }
                    
                    console.log('Data final retornada:', date.toLocaleDateString('pt-BR'));
                    return date;
                } else {
                    // Formatos numéricos tradicionais
                    let day = parseInt(match[1]);
                    let month = parseInt(match[2]) - 1;
                    let year = parseInt(match[3]);
                    
                    if (year < 100) {
                        year += 2000;
                    }

                    // Criar data sem problemas de fuso horário
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const date = new Date(dateStr + 'T12:00:00');
                    console.log('Data numérica criada (sem fuso):', date.toLocaleDateString('pt-BR'));
                    return date;
                }
            }
        }

        // Se não conseguir parsear, retornar null
        console.warn('Formato de data não reconhecido:', dateString);
        return null;
    }

    // =================================================================
    // OBTER ÍNDICE DO DIA A PARTIR DA ABREVIAÇÃO
    // =================================================================
    getDayIndexFromAbbreviation(abbrev) {
        const dayMap = {
            'Dom': 0, // Domingo
            'Seg': 1, // Segunda-feira
            'Ter': 2, // Terça-feira
            'Qua': 3, // Quarta-feira
            'Qui': 4, // Quinta-feira
            'Sex': 5, // Sexta-feira
            'Sáb': 6  // Sábado
        };
        return dayMap[abbrev] || -1;
    }

    // =================================================================
    // OBTER ÍNDICE DO DIA DA SEMANA
    // =================================================================
    getWeekDayIndex(appointmentDate, weekDates) {
        if (!appointmentDate) return -1;

        console.log('=== COMPARANDO DATAS ===');
        console.log('Data do agendamento:', appointmentDate.toLocaleDateString('pt-BR'));
        console.log('Timestamp do agendamento:', appointmentDate.getTime());
        
        // Comparação EXATA de data completa (dia/mês/ano)
        for (let i = 0; i < weekDates.length; i++) {
            const weekDate = weekDates[i];
            console.log(`Comparando com ${i}: ${weekDate.toLocaleDateString('pt-BR')} (timestamp: ${weekDate.getTime()})`);
            
            // Comparação completa: dia + mês + ano
            if (appointmentDate.getTime() === weekDate.getTime()) {
                console.log(`Data exata encontrada: ${appointmentDate.toLocaleDateString('pt-BR')} = ${weekDate.toLocaleDateString('pt-BR')} (índice ${i})`);
                return i;
            }
        }

        // Se não encontrar exatamente, não mostrar em nenhuma célula
        console.log(`Data não encontrada nesta semana: ${appointmentDate.toLocaleDateString('pt-BR')}`);
        console.log('Datas disponíveis na semana:', weekDates.map(d => `${d.toLocaleDateString('pt-BR')} (timestamp: ${d.getTime()})`));
        return -1;
    }

    // =================================================================
    // UTILITÁRIOS
    // =================================================================
    getStatusText(status) {
        const statusMap = {
            'confirmed': 'Confirmado',
            'completed': 'Concluído',
            'cancelled': 'Cancelado',
            '': 'Pendente'
        };
        return statusMap[status] || 'Pendente';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 350px;
            font-size: 14px;
            font-weight: 500;
            border: 1px solid rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            transform: translateX(400px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        
        const icon = this.getNotificationIcon(type);
        notification.innerHTML = `<i class="fas ${icon}" style="font-size: 18px;"></i> <span>${message}</span>`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationColor(type) {
        const colors = {
            success: '#4CAF50',
            error: '#dc3545',
            warning: '#ff9800',
            info: '#007bff'
        };
        return colors[type] || colors.info;
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }
}

// =================================================================
// INICIALIZAÇÃO
// =================================================================
let adminPanel;

document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});
