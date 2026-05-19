/**
 * =================================================================
 * STUDIO STYLIST - JAVASCRIPT PRINCIPAL
 * Sistema robusto de agendamento com validação avançada
 * =================================================================
 */

// DESTRAVAR CARREGAMENTO IMEDIATO
document.addEventListener('DOMContentLoaded', () => {
    const loading = document.getElementById('loadingScreen');
    if (loading) loading.style.display = 'none';
    console.log('Loading removido pelo DOMContentLoaded');
});

// =================================================================
// VARIÁVEIS GLOBAIS E CONFIGURAÇÃO
// =================================================================
class StudioStylistApp {
    constructor() {
        this.init();
    }

    init() {
        console.log('Iniciando sistema...');
        
        // ESCONDER LOADING IMEDIATAMENTE (primeira coisa)
        this.hideLoadingScreen();
        
        try {
            this.loadStoredData();
            this.setupEventListeners();
            this.initializeComponents();
            this.setupFormValidation();
            this.setupModalHandlers();
            this.updateAgendamentosCount();
            console.log('Sistema carregado com sucesso');
        } catch (error) {
            console.error('Erro na inicialização:', error);
        }
    }

    // =================================================================
    // CARREGAMENTO E INICIALIZAÇÃO
    // =================================================================
    hideLoadingScreen() {
        try {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                // REMOÇÃO INSTANTÂNEA - SEM DELAYS
                loadingScreen.style.display = 'none';
                loadingScreen.style.opacity = '0';
                loadingScreen.style.visibility = 'hidden';
                loadingScreen.classList.add('hidden');
                
                console.log('Loading removido instantaneamente');
            }
        } catch (error) {
            console.error('Erro ao remover loading:', error);
        }
    }

    loadStoredData() {
        try {
            // Leitura ultra-rápida do localStorage
            const clienteDados = localStorage.getItem('clienteDados');
            if (clienteDados) {
                try {
                    this.clienteDados = JSON.parse(clienteDados);
                } catch (e) {
                    this.clienteDados = null;
                }
            }

            const servicoSelecionado = localStorage.getItem('servicoSelecionado');
            if (servicoSelecionado) {
                this.servicoSelecionado = servicoSelecionado;
                this.updateSelectedServiceDisplay();
            }

            // Leitura crítica de agendamentos
            const agendamentos = localStorage.getItem('agendamentos');
            if (agendamentos) {
                try {
                    this.agendamentos = JSON.parse(agendamentos);
                } catch (e) {
                    this.agendamentos = [];
                    localStorage.removeItem('agendamentos');
                }
            } else {
                this.agendamentos = [];
            }
        } catch (error) {
            console.error('Erro em loadStoredData:', error);
            this.clienteDados = null;
            this.servicoSelecionado = null;
            this.agendamentos = [];
        }
    }

    initializeComponents() {
        // Inicializar componentes específicos da página
        if (document.getElementById('diasContainer')) {
            this.initializeCalendar();
        }

        if (document.querySelector('.services-grid')) {
            this.initializeServices();
        }

        if (document.getElementById('cadastroForm')) {
            this.initializeRegistration();
        }

        // Inicializar testemunhos
        this.initializeTestimonials();
    }

    // =================================================================
    // SETUP DE EVENT LISTENERS
    // =================================================================
    setupEventListeners() {
        // Botões de agendamentos
        const btnAgendamentos = document.querySelectorAll('#btnMeusAgendamentos');
        btnAgendamentos.forEach(btn => {
            btn.addEventListener('click', () => this.openModal('modalAgendamentos'));
        });

        // Fechar modais
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                this.closeModal(modal.id);
            });
        });

        // Fechar modal ao clicar fora
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Tecla ESC para fechar modais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Navegação suave
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    // =================================================================
    // VALIDAÇÃO DE FORMULÁRIOS
    // =================================================================
    setupFormValidation() {
        // Formulário de cadastro
        const cadastroForm = document.getElementById('cadastroForm');
        if (cadastroForm) {
            cadastroForm.addEventListener('submit', (e) => this.handleCadastroSubmit(e));
        }

        // Formulário de serviços
        const servicosForm = document.getElementById('servicosForm');
        if (servicosForm) {
            servicosForm.addEventListener('submit', (e) => this.handleServicosSubmit(e));
        }

        // Máscara de telefone
        this.setupPhoneMask();

        // Validação em tempo real
        this.setupRealTimeValidation();
    }

    setupPhoneMask() {
        const telefoneInput = document.getElementById('telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                
                if (value.length <= 2) {
                    value = `(${value}`;
                } else if (value.length <= 7) {
                    value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                } else {
                    value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
                }
                
                e.target.value = value;
            });

            telefoneInput.setAttribute('maxlength', 15);
        }
    }

    setupRealTimeValidation() {
        // Validação de nome
        const nomeInput = document.getElementById('nome');
        if (nomeInput) {
            nomeInput.addEventListener('blur', () => this.validateField(nomeInput, 'nome'));
        }

        // Validação de email
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', () => this.validateField(emailInput, 'email'));
        }

        // Validação de telefone
        const telefoneInput = document.getElementById('telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('blur', () => this.validateField(telefoneInput, 'telefone'));
        }
    }

    validateField(field, fieldType) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (fieldType) {
            case 'nome':
                if (value.length < 3) {
                    isValid = false;
                    errorMessage = 'Nome deve ter pelo menos 3 caracteres';
                } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Nome deve conter apenas letras';
                }
                break;

            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'E-mail inválido';
                }
                break;

            case 'telefone':
                const telefoneRegex = /^\(\d{2}\)\s\d{5}-\d{4}$/;
                if (!telefoneRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Telefone deve estar no formato (99) 99999-9999';
                }
                break;
        }

        this.showFieldValidation(field, isValid, errorMessage);
        return isValid;
    }

    showFieldValidation(field, isValid, errorMessage) {
        // Remover validação anterior
        const existingError = field.parentNode.querySelector('.error-message');
        const existingSuccess = field.parentNode.querySelector('.success-message');
        
        if (existingError) existingError.remove();
        if (existingSuccess) existingSuccess.remove();

        if (!isValid) {
            // Mostrar erro
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.cssText = `
                color: #dc3545;
                font-size: 14px;
                margin-top: 5px;
                display: flex;
                align-items: center;
                gap: 5px;
            `;
            errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${errorMessage}`;
            field.parentNode.appendChild(errorDiv);
            
            field.style.borderColor = '#dc3545';
        } else {
            // Mostrar sucesso
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.style.cssText = `
                color: #28a745;
                font-size: 14px;
                margin-top: 5px;
                display: flex;
                align-items: center;
                gap: 5px;
            `;
            successDiv.innerHTML = '<i class="fas fa-check-circle"></i> Campo válido';
            field.parentNode.appendChild(successDiv);
            
            field.style.borderColor = '#28a745';
        }

        // Remover estilos após 3 segundos
        setTimeout(() => {
            field.style.borderColor = '';
            const error = field.parentNode.querySelector('.error-message');
            const success = field.parentNode.querySelector('.success-message');
            if (error) error.remove();
            if (success) success.remove();
        }, 3000);
    }

    // =================================================================
    // HANDLERS DE FORMULÁRIO
    // =================================================================
    handleCadastroSubmit(e) {
        e.preventDefault();
        
        const nome = document.getElementById('nome').value.trim();
        const email = document.getElementById('email').value.trim();
        const telefone = document.getElementById('telefone').value.trim();

        // Validar todos os campos
        const nomeValid = this.validateField(document.getElementById('nome'), 'nome');
        const emailValid = this.validateField(document.getElementById('email'), 'email');
        const telefoneValid = this.validateField(document.getElementById('telefone'), 'telefone');

        if (!nomeValid || !emailValid || !telefoneValid) {
            this.showNotification('Por favor, corrija os erros no formulário', 'error');
            return;
        }

        // Salvar dados do cliente
        const clienteDados = { nome, email, telefone };
        localStorage.setItem('clienteDados', JSON.stringify(clienteDados));
        this.clienteDados = clienteDados;

        // Mostrar sucesso e redirecionar
        this.showNotification('Cadastro realizado com sucesso!', 'success');
        
        setTimeout(() => {
            window.location.href = 'servicos.html';
        }, 1500);
    }

    handleServicosSubmit(e) {
        e.preventDefault();
        
        const servicoSelecionado = document.querySelector('input[name="servico"]:checked');
        
        // Debug para verificar o que está acontecendo
        console.log('Serviço selecionado:', servicoSelecionado);
        console.log('Valor:', servicoSelecionado?.value);
        
        if (!servicoSelecionado) {
            this.showNotification('Por favor, selecione um serviço', 'warning');
            return;
        }

        // Salvar serviço selecionado
        localStorage.setItem('servicoSelecionado', servicoSelecionado.value);
        this.servicoSelecionado = servicoSelecionado.value;

        // Mostrar sucesso e redirecionar
        this.showNotification('Serviço selecionado com sucesso!', 'success');
        
        setTimeout(() => {
            window.location.href = 'agendamento.html';
        }, 1500);
    }

    // =================================================================
    // INICIALIZAÇÃO DE COMPONENTES
    // =================================================================
    initializeRegistration() {
        // Animações do formulário
        const fieldGroups = document.querySelectorAll('.field-group');
        fieldGroups.forEach((group, index) => {
            group.style.opacity = '0';
            group.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                group.style.transition = 'all 0.5s ease';
                group.style.opacity = '1';
                group.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    initializeServices() {
        const serviceCards = document.querySelectorAll('.service-card');
        const btnProximo = document.getElementById('btnProximo');
        const selectionInfo = document.getElementById('selectionInfo');

        // Evento de clique nos cards
        serviceCards.forEach(card => {
            card.addEventListener('click', () => {
                // Remover seleção anterior
                serviceCards.forEach(c => c.classList.remove('selected'));
                
                // Adicionar seleção atual
                card.classList.add('selected');
                
                // Marcar o radio button
                const radio = card.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                }
                
                // Habilitar botão próximo
                if (btnProximo) {
                    btnProximo.disabled = false;
                }

                // Mostrar informação da seleção
                if (selectionInfo && radio) {
                    const serviceName = radio.value;
                    document.getElementById('selectedServiceName').textContent = serviceName;
                    selectionInfo.style.display = 'block';
                }
            });
        });

        // Evento de clique nos radio buttons
        const radioButtons = document.querySelectorAll('input[name="servico"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                // Remover seleção visual anterior
                serviceCards.forEach(c => c.classList.remove('selected'));
                
                // Adicionar seleção visual ao card do radio marcado
                const card = radio.closest('.service-card');
                if (card) {
                    card.classList.add('selected');
                }
                
                // Habilitar botão próximo
                if (btnProximo) {
                    btnProximo.disabled = false;
                }

                // Mostrar informação da seleção
                if (selectionInfo) {
                    document.getElementById('selectedServiceName').textContent = radio.value;
                    selectionInfo.style.display = 'block';
                }
            });
        });

        // Efeito hover nos cards
        serviceCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                if (!card.classList.contains('selected')) {
                    card.style.transform = 'translateY(-5px) scale(1.02)';
                }
            });

            card.addEventListener('mouseleave', () => {
                if (!card.classList.contains('selected')) {
                    card.style.transform = '';
                }
            });
        });
    }

    initializeCalendar() {
        this.generateCalendarDays();
        this.setupTimeSlots();
        this.setupCalendarNavigation();
        this.generateQuickDates();
    }

    generateCalendarDays() {
        const daysGrid = document.getElementById('daysGrid');
        if (!daysGrid) {
            console.log('daysGrid não encontrado');
            return;
        }
        
        console.log('Gerando 7 dias rotativos...');
        
        const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const hoje = new Date();
        
        // Limpar grid
        daysGrid.innerHTML = '';
        
        // Gerar próximos 7 dias úteis (pulando domingos)
        let diasGerados = 0;
        let dataAtual = new Date(hoje);
        
        // Começar de amanhã
        dataAtual.setDate(dataAtual.getDate() + 1);
        
        while (diasGerados < 7) {
            const diaSemana = dataAtual.getDay();
            
            // Pular domingos
            if (diaSemana === 0) {
                dataAtual.setDate(dataAtual.getDate() + 1);
                continue;
            }
            
            // Criar botão do dia
            const dayBtn = document.createElement('button');
            dayBtn.type = 'button';
            dayBtn.className = 'day-btn';
            
            // Formato: "Seg 27/03"
            const nomeDia = diasSemana[diaSemana].substring(0, 3); // Abreviado
            const diaMes = String(dataAtual.getDate()).padStart(2, '0');
            const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
            dayBtn.textContent = `${nomeDia} ${diaMes}/${mes}`;
            
            // Salvar data completa
            const dataCompleta = `${dataAtual.getFullYear()}-${mes}-${diaMes}`;
            dayBtn.dataset.date = dataCompleta;
            dayBtn.dataset.display = `${nomeDia} ${diaMes}/${mes}`;
            
            console.log('Dia criado:', dayBtn.textContent);
            
            // Adicionar evento de clique
            const self = this;
            dayBtn.onclick = function() {
                console.log('Clique no dia:', this.textContent);
                self.selectDate(this, new Date(dataCompleta));
            };
            
            daysGrid.appendChild(dayBtn);
            diasGerados++;
            
            // Avançar para o próximo dia
            dataAtual.setDate(dataAtual.getDate() + 1);
        }
        
        console.log('7 dias rotativos gerados com sucesso!');
        
        // Atualizar título
        this.updateCalendarTitle(hoje.getFullYear(), hoje.getMonth());
    }

    generateQuickDates() {
        const quickDateButtons = document.getElementById('quickDateButtons');
        if (!quickDateButtons) return;

        const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const hoje = new Date();
        
        // Gerar próximos 14 dias úteis
        let diasGerados = 0;
        let dataAtual = new Date(hoje);
        
        while (diasGerados < 14 && diasGerados < 30) {
            dataAtual.setDate(dataAtual.getDate() + 1);
            
            // Pular domingos
            if (dataAtual.getDay() === 0) continue;
            
            const btn = document.createElement('button');
            btn.className = 'quick-date-btn';
            btn.textContent = `${diasSemana[dataAtual.getDay()]} ${dataAtual.getDate()}/${dataAtual.getMonth() + 1}`;
            btn.dataset.date = this.formatDate(dataAtual);
            
            btn.addEventListener('click', () => {
                // Encontrar e selecionar o dia no calendário
                const dayBtn = document.querySelector(`[data-date="${btn.dataset.date}"]`);
                if (dayBtn && !dayBtn.disabled) {
                    this.selectDate(dayBtn, dataAtual);
                }
            });
            
            quickDateButtons.appendChild(btn);
            diasGerados++;
        }
    }

    setupCalendarNavigation() {
        const prevMonth = document.getElementById('prevMonth');
        const nextMonth = document.getElementById('nextMonth');
        
        if (prevMonth) {
            prevMonth.addEventListener('click', () => this.navigateMonth(-1));
        }
        
        if (nextMonth) {
            nextMonth.addEventListener('click', () => this.navigateMonth(1));
        }
    }

    navigateMonth(direction) {
        // Implementar navegação entre meses
        this.showNotification('Navegação entre meses em desenvolvimento', 'info');
    }

    updateCalendarTitle(ano, mes) {
        const calendarTitle = document.getElementById('calendarTitle');
        if (calendarTitle) {
            const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            calendarTitle.textContent = `${meses[mes]} ${ano}`;
        }
    }

    selectDate(dayBtn, data) {
        console.log('Selecionando data:', data);
        
        // Remover seleção anterior
        document.querySelectorAll('.day-btn.selected').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Adicionar seleção atual
        dayBtn.classList.add('selected');
        
        // Salvar data selecionada
        this.dataSelecionada = data;
        console.log('Data selecionada salva:', this.dataSelecionada);
        
        // Habilitar seleção de horários
        this.enableTimeSlots();
        
        // Atualizar resumo se visível
        this.updateSelectionSummary();
    }

    setupTimeSlots() {
        const timeSlots = document.querySelectorAll('.time-slot');
        console.log('Configurando horários:', timeSlots.length, 'disponíveis');
        
        if (timeSlots.length === 0) {
            console.log('Nenhum horário encontrado');
            return;
        }
        
        const self = this;
        timeSlots.forEach((slot, index) => {
            console.log(`Horário ${index + 1}:`, slot.dataset.time);
            
            // Usar onclick para garantir funcionamento
            slot.onclick = function() {
                console.log('Horário clicado:', this.dataset.time);
                
                // Remover seleção anterior de todos os horários
                timeSlots.forEach(s => {
                    s.classList.remove('selected');
                    s.style.background = '';
                    s.style.borderColor = '';
                    s.style.color = '';
                });
                
                // Adicionar seleção visual forte no horário atual
                this.classList.add('selected');
                this.style.background = 'var(--primary-gold)';
                this.style.borderColor = 'var(--primary-gold)';
                this.style.color = 'var(--primary-black)';
                
                // Salvar horário selecionado
                self.horarioSelecionado = this.dataset.time;
                console.log('Horário selecionado salvo:', self.horarioSelecionado);
                
                // Atualizar resumo
                self.updateSelectionSummary();
            };
        });
    }

    enableTimeSlots() {
        const timeSlots = document.querySelectorAll('.time-slot');
        timeSlots.forEach(slot => {
            slot.disabled = false;
            slot.style.opacity = '1';
            slot.style.cursor = 'pointer';
        });
    }

    updateSelectionSummary() {
        const selectionSummary = document.getElementById('selectionSummary');
        if (!selectionSummary) return;
        
        console.log('Verificando seleção...');
        console.log('Data:', this.dataSelecionada);
        console.log('Horário:', this.horarioSelecionado);
        console.log('Serviço:', this.servicoSelecionado);
        
        if (this.dataSelecionada && this.horarioSelecionado && this.servicoSelecionado) {
            // Mostrar resumo
            selectionSummary.style.display = 'block';
            
            // Atualizar informações
            const summaryService = document.getElementById('summaryService');
            const summaryDate = document.getElementById('summaryDate');
            const summaryTime = document.getElementById('summaryTime');
            
            if (summaryService) summaryService.textContent = this.servicoSelecionado;
            if (summaryDate) summaryDate.textContent = this.formatDateDisplay(this.dataSelecionada);
            if (summaryTime) summaryTime.textContent = this.horarioSelecionado;
            
            // Configurar botão confirmar para chamar função direta
            const confirmarBtn = document.getElementById('confirmarAgendamento');
            if (confirmarBtn) {
                // Remover eventos anteriores
                confirmarBtn.onclick = null;
                
                // Adicionar novo evento que confirma diretamente
                const self = this;
                confirmarBtn.onclick = function() {
                    console.log('Botão Confirmar clicado - confirmando diretamente');
                    self.confirmarAgendamento();
                };
                
                console.log('Botão Confirmar configurado para confirmação direta');
            }
        } else {
            // Esconder resumo se não tiver tudo selecionado
            selectionSummary.style.display = 'none';
        }
    }

    updateSelectedServiceDisplay() {
        const display = document.getElementById('selectedServiceDisplay');
        const serviceName = document.getElementById('selectedServiceName');
        
        if (display && serviceName && this.servicoSelecionado) {
            serviceName.textContent = this.servicoSelecionado;
            display.style.display = 'block';
        }
    }

    // =================================================================
    // MODAIS
    // =================================================================
    setupModalHandlers() {
        // Botão confirmar agendamento
        const confirmarBtn = document.getElementById('confirmarAgendamento');
        if (confirmarBtn) {
            confirmarBtn.addEventListener('click', () => this.showResumoModal());
        }

        // Botões do modal de resumo
        const cancelarResumo = document.getElementById('cancelarResumo');
        const confirmarResumo = document.getElementById('confirmarResumo');
        
        if (cancelarResumo) {
            cancelarResumo.addEventListener('click', () => this.closeModal('modalResumo'));
        }
        
        if (confirmarResumo) {
            confirmarResumo.addEventListener('click', () => this.confirmarAgendamento());
        }

        // Botão de sucesso
        const btnSuccessOk = document.getElementById('btnSuccessOk');
        if (btnSuccessOk) {
            btnSuccessOk.addEventListener('click', () => {
                this.closeModal('successModal');
                window.location.href = 'index.html';
            });
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Atualizar conteúdo se necessário
            if (modalId === 'modalAgendamentos') {
                this.updateAgendamentosList();
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    showResumoModal() {
        if (!this.dataSelecionada || !this.horarioSelecionado || !this.servicoSelecionado) {
            this.showNotification('Por favor, selecione data, horário e serviço', 'warning');
            return;
        }

        // Preencher dados do resumo
        document.getElementById('resumoServico').textContent = this.servicoSelecionado;
        document.getElementById('resumoData').textContent = this.formatDateDisplay(this.dataSelecionada);
        document.getElementById('resumoHorario').textContent = this.horarioSelecionado;
        
        if (this.clienteDados) {
            document.getElementById('resumoCliente').textContent = this.clienteDados.nome;
        }

        // Abrir modal
        this.openModal('modalResumo');
    }

    // =================================================================
    // CONFIGURAÇÃO DE MODAIS
    // =================================================================
    setupModalHandlers() {
        // Botão confirmar agendamento
        const confirmarBtn = document.getElementById('confirmarAgendamento');
        if (confirmarBtn) {
            confirmarBtn.addEventListener('click', () => this.showResumoModal());
        }

        // Botões do modal de resumo
        const cancelarResumo = document.getElementById('cancelarResumo');
        const confirmarResumo = document.getElementById('confirmarResumo');
        
        if (cancelarResumo) {
            cancelarResumo.addEventListener('click', () => this.closeModal('modalResumo'));
        }
        
        if (confirmarResumo) {
            confirmarResumo.addEventListener('click', () => this.confirmarAgendamento());
        }

        // Botão de sucesso
        const btnSuccessOk = document.getElementById('btnSuccessOk');
        if (btnSuccessOk) {
            btnSuccessOk.addEventListener('click', () => {
                this.closeModal('successModal');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            });
        }
    }

    // =================================================================
    // AGENDAMENTOS
    // =================================================================
    confirmarAgendamento() {
        console.log('Confirmando agendamento...');
        
        if (!this.dataSelecionada || !this.horarioSelecionado || !this.servicoSelecionado || !this.clienteDados) {
            this.showNotification('Por favor, complete todas as etapas do agendamento', 'warning');
            return;
        }

        // Verificar disponibilidade
        const dataFormatada = this.formatDateDisplay(this.dataSelecionada);
        if (!window.appointmentService.checkAvailability(dataFormatada, this.horarioSelecionado)) {
            this.showNotification('Este horário já está ocupado. Por favor, escolha outro.', 'error');
            return;
        }

        // Criar agendamento usando o serviço
        const appointmentData = {
            servico: this.servicoSelecionado,
            data: dataFormatada,
            horario: this.horarioSelecionado,
            cliente: this.clienteDados.nome,
            email: this.clienteDados.email,
            telefone: this.clienteDados.telefone
        };

        const appointment = window.appointmentService.addAppointment(appointmentData);
        
        console.log('Agendamento criado:', appointment);

        // Fechar modal de resumo
        this.closeModal('modalResumo');

        // Mostrar sucesso
        this.showNotification('🎉 Agendamento confirmado com sucesso!', 'success');
        
        // Limpar seleção
        this.limparSelecao();

        // Redirecionar para página inicial após 1 segundo
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    // =================================================================
    // MÉTODOS LEGADOS (MANTIDOS PARA COMPATIBILIDADE)
    // =================================================================
    saveAgendamentos() {
        // Método legado - agora usa o serviço
        if (window.appointmentService) {
            window.appointmentService.saveAppointments();
        }
    }

    updateAgendamentosCount() {
        const badges = document.querySelectorAll('#agendamentosCount');
        let count = 0;
        
        if (window.appointmentService && this.clienteDados) {
            const appointments = window.appointmentService.getClientFutureAppointments(this.clienteDados.email);
            count = appointments.length;
        }
        
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        });
    }

    updateAgendamentosList() {
        const lista = document.getElementById('listaAgendamentos');
        const emptyState = document.getElementById('emptyState');
        
        if (!lista) return;

        // Limpar lista
        lista.innerHTML = '';

        // Obter agendamentos do cliente
        let appointments = [];
        if (window.appointmentService && this.clienteDados) {
            appointments = window.appointmentService.getClientFutureAppointments(this.clienteDados.email);
        }

        if (appointments.length === 0) {
            // Mostrar estado vazio
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            lista.style.display = 'none';
        } else {
            // Esconder estado vazio
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            lista.style.display = 'flex';

            // Adicionar agendamentos
            appointments.forEach(appointment => {
                const item = this.createAgendamentoItem(appointment);
                lista.appendChild(item);
            });
        }
    }

    createAgendamentoItem(appointment) {
        const item = document.createElement('div');
        item.className = 'agendamento-item';
        
        item.innerHTML = `
            <div class="agendamento-info">
                <div class="agendamento-servico">${appointment.servico}</div>
                <div class="agendamento-detalhe">
                    <i class="fas fa-calendar"></i> ${appointment.data} às ${appointment.horario}
                </div>
                <div class="agendamento-detalhe">
                    <i class="fas fa-user"></i> ${appointment.cliente}
                </div>
            </div>
            <button class="btn-cancelar" onclick="app.cancelarAgendamento(${appointment.id})">
                <i class="fas fa-times"></i> Cancelar
            </button>
        `;
        
        return item;
    }

    cancelarAgendamento(id) {
        const agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [];
        const novosAgendamentos = agendamentos.filter(a => a.id !== id);
        localStorage.setItem('agendamentos', JSON.stringify(novosAgendamentos));
        window.location.reload();
    }

    isAgendamentoFuturo(agendamento) {
        if (!agendamento.data || !agendamento.horario) return false;
        
        const dataAgendamento = new Date(`${agendamento.data} ${agendamento.horario}`);
        return dataAgendamento > new Date();
    }
        const agendamentosFuturos = this.agendamentos.filter(a => this.isAgendamentoFuturo(a));

        if (agendamentosFuturos.length === 0) {
            // Mostrar estado vazio
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            lista.style.display = 'none';
        } else {
            // Esconder estado vazio
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            lista.style.display = 'flex';

            // Adicionar agendamentos
            agendamentosFuturos.forEach(agendamento => {
                const item = this.createAgendamentoItem(agendamento);
                lista.appendChild(item);
            });
        }
    }

    createAgendamentoItem(agendamento) {
        const item = document.createElement('div');
        item.className = 'agendamento-item';
        
        item.innerHTML = `
            <div class="agendamento-info">
                <div class="agendamento-servico">${agendamento.servico}</div>
                <div class="agendamento-detalhe">
                    <i class="fas fa-calendar"></i> ${agendamento.data} às ${agendamento.horario}
                </div>
                <div class="agendamento-detalhe">
                    <i class="fas fa-user"></i> ${agendamento.cliente}
                </div>
            </div>
            <button class="btn-cancelar" onclick="app.cancelarAgendamento(${agendamento.id})">
                <i class="fas fa-times"></i> Cancelar
            </button>
        `;
        
        return item;
    }

    cancelarAgendamento(id) {
        const agendamento = this.agendamentos.find(a => a.id === id);
        if (!agendamento) return;

        // Confirmar cancelamento
        if (confirm(`Tem certeza que deseja cancelar o agendamento de ${agendamento.servico} em ${agendamento.data} às ${agendamento.horario}?`)) {
            // Remover agendamento
            this.agendamentos = this.agendamentos.filter(a => a.id !== id);
            this.saveAgendamentos();
            
            // Atualizar lista
            this.updateAgendamentosList();
            
            // Mostrar notificação
            this.showNotification('Agendamento cancelado com sucesso', 'success');
        }
    }

    isAgendamentoFuturo(agendamento) {
        if (!agendamento.data || !agendamento.horario) return false;
        
        const dataAgendamento = new Date(`${agendamento.data} ${agendamento.horario}`);
        return dataAgendamento > new Date();
    }

    limparSelecao() {
        this.dataSelecionada = null;
        this.horarioSelecionado = null;
        
        // Limpar seleção visual
        document.querySelectorAll('.day-btn.selected').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        document.querySelectorAll('.time-slot.selected').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        // Esconder resumo
        const selectionSummary = document.getElementById('selectionSummary');
        if (selectionSummary) {
            selectionSummary.style.display = 'none';
        }
    }

    // =================================================================
    // TESTEMUNHOS
    // =================================================================
    initializeTestimonials() {
        const testimonials = document.querySelectorAll('.testimonial-card');
        const dots = document.querySelectorAll('.dot');
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        
        if (testimonials.length === 0) return;
        
        let currentIndex = 0;
        
        const showTestimonial = (index) => {
            // Esconder todos
            testimonials.forEach(t => t.classList.remove('active'));
            dots.forEach(d => d.classList.remove('active'));
            
            // Mostrar atual
            testimonials[index].classList.add('active');
            if (dots[index]) dots[index].classList.add('active');
            
            currentIndex = index;
        };
        
        // Event listeners
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const newIndex = currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1;
                showTestimonial(newIndex);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const newIndex = (currentIndex + 1) % testimonials.length;
                showTestimonial(newIndex);
            });
        }
        
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => showTestimonial(index));
        });
        
        // Auto-play
        setInterval(() => {
            const newIndex = (currentIndex + 1) % testimonials.length;
            showTestimonial(newIndex);
        }, 5000);
        
        // Mostrar primeiro
        showTestimonial(0);
    }

    // =================================================================
    // UTILITÁRIOS
    // =================================================================
    formatDate(date) {
        const ano = date.getFullYear();
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const dia = String(date.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    }

    formatDateDisplay(date) {
        const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dia = date.getDate();
        const mes = date.getMonth() + 1;
        
        return `${diasSemana[date.getDay()]} ${dia}/${mes}`;
    }

    showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        
        const icon = this.getNotificationIcon(type);
        notification.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
        
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationColor(type) {
        const colors = {
            success: '#28a745',
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
// INICIALIZAÇÃO DA APLICAÇÃO
// =================================================================
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new StudioStylistApp();
});

// Adicionar estilos de animação
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
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .error-message, .success-message {
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

// =================================================================
// EXPORTS (se necessário)
// =================================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudioStylistApp;
}
