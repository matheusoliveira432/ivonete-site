/**
 * =================================================================
 * HAIR STYLIST - JAVASCRIPT PRINCIPAL
 * Sistema robusto de agendamento com validação avançada
 * =================================================================
 */

// Serviço de agendamentos é carregado na inicialização (DOMContentLoaded)

// =================================================================
// VARIÁVEIS GLOBAIS E CONFIGURAÇÃO
// =================================================================
class HairStylistApp {
    constructor() {
        this.clienteDados = null;
        this.servicoSelecionado = null;
        this.dataSelecionada = null;
        this.horarioSelecionado = null;
        this.agendamentos = [];
        this.init();
    }

    // =================================================================
    // INICIALIZAÇÃO
    // =================================================================
    init() {
        this.setupEventListeners();
        this.hideLoadingScreen();
        this.loadStoredData();
        this.initializeComponents();
        this.setupFormValidation();
        this.setupModalHandlers();
        this.setupStorageListener(); // Adicionar detecção de mudanças no localStorage
        this.updateAgendamentosCount();
    }

    // =================================================================
    // CARREGAMENTO E INICIALIZAÇÃO
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

    loadStoredData() {
        console.log('Carregando dados armazenados...');
        
        // Limpar dados anteriores para evitar conflitos
        this.clienteDados = null;
        this.servicoSelecionado = null;
        this.dataSelecionada = null;
        this.horarioSelecionado = null;
        
        // ---- Tentar obter dados do cliente via URL Query primeiro ----
        const params = new URLSearchParams(window.location.search);
        const qNome = params.get('nome');
        const qEmail = params.get('email');
        const qTelefone = params.get('telefone');

        if (qNome && qTelefone) {
            this.clienteDados = {
                nome: decodeURIComponent(qNome),
                email: qEmail ? decodeURIComponent(qEmail) : '',
                telefone: decodeURIComponent(qTelefone)
            };
            console.log('Dados do cliente carregados via URL:', this.clienteDados);
            try {
                localStorage.setItem('clienteDados', JSON.stringify(this.clienteDados));
            } catch (e) {
                console.warn('Erro ao salvar clienteDados no localStorage:', e);
            }
        } else {
            // Carregar dados do cliente do localStorage
            const clienteDados = localStorage.getItem('clienteDados');
            if (clienteDados) {
                try {
                    this.clienteDados = JSON.parse(clienteDados);
                    console.log('Dados do cliente carregados:', this.clienteDados);
                } catch (error) {
                    console.error('Erro ao carregar dados do cliente:', error);
                    localStorage.removeItem('clienteDados');
                }
            } else {
                console.log('Nenhum dado de cliente encontrado');
            }
        }

        // ---- Tentar obter serviço selecionado via URL Query primeiro ----
        const qServico = params.get('servico');
        if (qServico) {
            this.servicoSelecionado = decodeURIComponent(qServico);
            console.log('Serviço selecionado carregado via URL:', this.servicoSelecionado);
            try {
                localStorage.setItem('servicoSelecionado', this.servicoSelecionado);
            } catch (e) {
                console.warn('Erro ao salvar servicoSelecionado no localStorage:', e);
            }
            this.updateSelectedServiceDisplay();
        } else {
            // Carregar serviço selecionado do localStorage
            const servicoSelecionado = localStorage.getItem('servicoSelecionado');
            if (servicoSelecionado) {
                this.servicoSelecionado = servicoSelecionado;
                console.log('Serviço selecionado carregado:', this.servicoSelecionado);
                this.updateSelectedServiceDisplay();
            } else {
                console.log('Nenhum serviço selecionado encontrado');
            }
        }
        
        // Nota: dataSelecionada e horarioSelecionado são temporários
        // e não devem ser carregados do localStorage entre sessões
        console.log('Carregamento de dados concluído');
    }

    initializeComponents() {
        // Inicializar componentes específicos da página
        if (document.getElementById('diasContainer') || document.getElementById('daysGrid')) {
            console.log('Inicializando calendário...');
            this.initializeCalendar();
        }

        if (document.querySelector('.services-grid')) {
            this.initializeServices();
        }

        if (document.getElementById('cadastroForm')) {
            this.initializeRegistration();
        }

        // IMPORTANTE: Na página de agendamento, garantir que o serviço selecionado seja carregado
        if (document.getElementById('selectionSummary')) {
            // Forçar carregamento do serviço selecionado do localStorage
            const servicoSelecionado = localStorage.getItem('servicoSelecionado');
            if (servicoSelecionado) {
                this.servicoSelecionado = servicoSelecionado;
                console.log('Serviço selecionado carregado no initializeComponents:', this.servicoSelecionado);
                this.updateSelectedServiceDisplay();
            }
            
            // Verificar se há uma data pré-selecionada e atualizar disponibilidade de horários
            setTimeout(() => {
                if (this.dataSelecionada) {
                    console.log('Data pré-selecionada encontrada, verificando disponibilidade...');
                    this.updateTimeSlotsAvailability();
                } else {
                    console.log('Nenhuma data pré-selecionada encontrada');
                }
            }, 500); // Pequeno delay para garantir que o DOM esteja pronto
        }
    }

    initializeCalendar() {
        this.generateCalendarDays();
        this.setupCalendarNavigation();
        this.setupTimeSlots();
    }

    // =================================================================
    // SETUP DE EVENT LISTENERS
    // =================================================================
    setupEventListeners() {
        // Botões de agendamentos (disponível apenas em servicos.html e agendamento.html)
        const btnAgendamentos = document.querySelectorAll('#btnMeusAgendamentos');
        btnAgendamentos.forEach(btn => {
            btn.addEventListener('click', () => {
                this.openModal('modalAgendamentos');
                this.displayAppointments(); // Carregar agendamentos ao abrir
            });
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
                } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Nome deve conter apenas letras e espaços';
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
                const telefoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
                if (!telefoneRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Telefone deve estar no formato (99) 99999-9999 ou (99) 9999-9999';
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

        // Cadastrar cliente na API (MySQL) em background
        if (window.apiService) {
            window.apiService.cadastrarCliente({ nome, telefone, email })
                .then(result => console.log('Cliente registrado na API:', result))
                .catch(err => console.warn('Falha ao registrar na API (fallback localStorage):', err));
        }

        // Limpar verificação anterior (novo cadastro = nova verificação)
        if (window.otpService) {
            window.otpService.clearVerification();
        }

        // Mostrar sucesso e redirecionar para VERIFICAÇÃO SMS com parâmetros de URL
        // Isso previne que políticas estritas de file:/// do navegador percam o localStorage
        this.showNotification('Enviando código de verificação...', 'info');
        
        const qNome = encodeURIComponent(nome);
        const qEmail = encodeURIComponent(email);
        const qTelefone = encodeURIComponent(telefone);
        
        setTimeout(() => {
            window.location.href = `verificacao.html?nome=${qNome}&email=${qEmail}&telefone=${qTelefone}`;
        }, 1500);
    }

    handleServicosSubmit(e) {
        e.preventDefault();
        
        const servicoSelecionado = document.querySelector('input[name="servico"]:checked');
        
        if (!servicoSelecionado) {
            this.showNotification('Por favor, selecione um serviço', 'warning');
            return;
        }

        // Salvar serviço selecionado
        localStorage.setItem('servicoSelecionado', servicoSelecionado.value);
        this.servicoSelecionado = servicoSelecionado.value;

        // Mostrar sucesso e redirecionar
        this.showNotification('Serviço selecionado com sucesso!', 'success');
        
        const qNome = this.clienteDados ? encodeURIComponent(this.clienteDados.nome) : '';
        const qEmail = this.clienteDados ? encodeURIComponent(this.clienteDados.email) : '';
        const qTelefone = this.clienteDados ? encodeURIComponent(this.clienteDados.telefone) : '';
        const qServico = encodeURIComponent(this.servicoSelecionado);
        
        setTimeout(() => {
            window.location.href = `agendamento.html?nome=${qNome}&email=${qEmail}&telefone=${qTelefone}&servico=${qServico}`;
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
        const servicesGrid = document.querySelector('.services-grid');
        if (!servicesGrid) return;

        // Carregar serviços do localStorage
        let storedServices = localStorage.getItem('salonServices');
        let services = [];
        if (storedServices) {
            try {
                services = JSON.parse(storedServices);
            } catch (e) {
                console.error('Erro ao fazer parse dos serviços:', e);
            }
        }

        // Se não houver serviços no localStorage, povoar com os padrões
        if (services.length === 0) {
            services = [
                { id: 'progressiva', nome: 'Progressiva', descricao: 'Alisamento capilar duradouro com produtos importados', duracao: '2h 30min', preco: '350', status: 'ativo' },
                { id: 'tintura', nome: 'Tintura', descricao: 'Coloração profissional com tons vibrantes e duradouros', duracao: '2h', preco: '180', status: 'ativo' },
                { id: 'corte', nome: 'Corte', descricao: 'Corte personalizado com técnicas modernas de styling', duracao: '1h', preco: '80', status: 'ativo' },
                { id: 'botox', nome: 'Botox Capilar', descricao: 'Tratamento reconstrutor com efeito liso e brilho intenso', duracao: '2h', preco: '280', status: 'ativo' },
                { id: 'selagem', nome: 'Selagem', descricao: 'Proteção térmica e nutrição para cabelos danificados', duracao: '1h 30min', preco: '150', status: 'ativo' },
                { id: 'luzes', nome: 'Luzes', descricao: 'Mechas e luzes com técnicas modernas e naturais', duracao: '3h', preco: '250', status: 'ativo' }
            ];
            localStorage.setItem('salonServices', JSON.stringify(services));
        }

        console.log('=== SERVIÇOS CARREGADOS NO CLIENTE ===', services);

        // Filtrar apenas os serviços ativos para exibição ao cliente (removendo inativo/inactive)
        const activeServices = services.filter(s => s.status === 'ativo');
        console.log('=== SERVIÇOS ATIVOS FILTRADOS ===', activeServices);

        // Renderizar dinamicamente
        servicesGrid.innerHTML = '';
        activeServices.forEach(service => {
            // Badges específicos baseados no ID do serviço
            let badgeHTML = '';
            if (service.id === 'progressiva') {
                badgeHTML = `<div class="service-badge popular"><i class="fas fa-crown"></i> Mais Popular</div>`;
            } else if (service.id === 'tintura') {
                badgeHTML = `<div class="service-badge new"><i class="fas fa-sparkles"></i> Novidade</div>`;
            } else if (service.id === 'corte') {
                badgeHTML = `<div class="service-badge classic"><i class="fas fa-gem"></i> Clássico</div>`;
            } else if (service.id === 'botox') {
                badgeHTML = `<div class="service-badge premium"><i class="fas fa-crown"></i> Premium</div>`;
            } else if (service.id === 'selagem') {
                badgeHTML = `<div class="service-badge treatment"><i class="fas fa-leaf"></i> Tratamento</div>`;
            } else if (service.id === 'luzes') {
                badgeHTML = `<div class="service-badge trending"><i class="fas fa-fire"></i> Trending</div>`;
            }

            // Tratar imagem e fallback
            let imgPath = `img/${service.id}.png`;
            if (!['progressiva', 'tintura', 'corte', 'botox', 'selagem', 'luzes'].includes(service.id)) {
                imgPath = `img/corte.png`;
            }

            const card = document.createElement('div');
            card.className = 'service-card';
            card.dataset.service = service.id;

            card.innerHTML = `
                <div class="service-visual">
                    <img src="${imgPath}" alt="${service.nome}" class="service-img" onerror="this.src='img/corte.png'">
                    ${badgeHTML}
                </div>
                <div class="service-content">
                    <input type="radio" id="${service.id}" name="servico" value="${service.nome}" class="service-radio">
                    <label for="${service.id}" class="service-label">
                        <h3 class="service-title">${service.nome}</h3>
                        <div class="service-description">
                            <p>${service.descricao || ''}</p>
                        </div>
                        <div class="service-meta">
                            <div class="service-duration">
                                <i class="fas fa-clock"></i>
                                <span>${service.duracao || '1h'}</span>
                            </div>
                            <div class="service-price">
                                <span class="price-label">A partir de</span>
                                <span class="price-value">R$ ${service.preco || '0'}</span>
                            </div>
                        </div>
                    </label>
                </div>
            `;
            servicesGrid.appendChild(card);
        });

        // Configurar os seletores de evento
        const serviceCards = document.querySelectorAll('.service-card');
        const btnProximo = document.getElementById('btnProximo');
        const selectionInfo = document.getElementById('selectionInfo');

        serviceCards.forEach(card => {
            card.addEventListener('click', () => {
                serviceCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                const radio = card.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    // Disparar evento de mudança no radio button
                    radio.dispatchEvent(new Event('change'));
                }
            });
        });

        const radioButtons = document.querySelectorAll('input[name="servico"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                serviceCards.forEach(c => c.classList.remove('selected'));
                const card = radio.closest('.service-card');
                if (card) {
                    card.classList.add('selected');
                }
                
                if (btnProximo) {
                    btnProximo.disabled = false;
                }

                if (selectionInfo) {
                    document.getElementById('selectedServiceName').textContent = radio.value;
                    selectionInfo.style.display = 'block';
                }
            });
        });

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
        console.log('Inicializando calendário completo...');
        
        // Gerar dias
        this.generateCalendarDays();
        
        // Configurar horários
        this.setupTimeSlots();
        
        // Configurar navegação
        this.setupCalendarNavigation();
        
        console.log('Calendário inicializado com sucesso');
    }

    generateCalendarDays() {
        const daysGrid = document.getElementById('daysGrid');
        if (!daysGrid) {
            console.log('daysGrid não encontrado');
            return;
        }
        
        console.log('Gerando 6 dias úteis rotativos (Terça a Sábado)...');
        
        const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const hoje = new Date();
        
        // Limpar grid completamente
        daysGrid.innerHTML = '';
        
        // Gerar próximos 6 dias úteis (pulando domingos)
        let diasGerados = 0;
        let dataAtual = new Date(hoje);
        
        dataAtual.setDate(dataAtual.getDate() + 1);
        
        while (diasGerados < 6) {
            const diaSemana = dataAtual.getDay();
            
            // Pular domingos (0) e segundas (1)
            if (diaSemana === 0 || diaSemana === 1) {
                dataAtual.setDate(dataAtual.getDate() + 1);
                continue;
            }
            
            // Criar botão do dia apenas para dias úteis (1-6)
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
            
            console.log('Dia criado:', dayBtn.textContent, 'Data:', dataCompleta, 'Dia semana:', diaSemana, '(0=Domingo, 1=Seg, ..., 6=Sáb)');
            
            // Adicionar evento de clique com arrow function para manter contexto
            dayBtn.addEventListener('click', () => {
                console.log('Clique no dia:', dayBtn.textContent);
                // Salvar tanto o objeto Date quanto o texto exibido
                const dataObj = new Date(dataCompleta + 'T12:00:00'); // Forçar meio-dia para evitar UTC
                dataObj.setHours(12, 0, 0, 0); // Garantir fuso horário local
                this.selectDate(dayBtn, dataObj, dayBtn.dataset.display);
            });
            
            // Adicionar ao grid
            daysGrid.appendChild(dayBtn);
            diasGerados++;
            
            // Avançar para o próximo dia
            dataAtual.setDate(dataAtual.getDate() + 1);
        }
        
        console.log('Dias gerados com sucesso! Total:', daysGrid.children.length);
        
        // Forçar atualização visual
        daysGrid.style.display = 'grid';
        
        // Atualizar título
        this.updateCalendarTitle(hoje.getFullYear(), hoje.getMonth());
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

    selectDate(dayBtn, data, displayText) {
        console.log('Selecionando data:', data, 'Texto exibido:', displayText);
        
        // Remover seleção anterior de todos os dias
        const allDayBtns = document.querySelectorAll('.day-btn');
        allDayBtns.forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Adicionar seleção atual
        dayBtn.classList.add('selected');
        
        // Salvar data selecionada e texto exibido
        this.dataSelecionada = data;
        this.dataExibida = displayText; // Salvar o texto exato que o usuário vê
        console.log('Data selecionada salva:', this.dataSelecionada);
        console.log('Texto exibido salvo:', this.dataExibida);
        
        // Habilitar seleção de horários PRIMEIRO
        this.enableTimeSlots();
        
        // DEPOIS verificar e bloquear os ocupados (sobrescreve enableTimeSlots)
        this.renderizarHorarios();
        
        // Atualizar resumo se visível
        this.updateSelectionSummary();
    }

    // =================================================================
    // RENDERIZAR HORÁRIOS COM VERIFICAÇÃO ESTRITA
    // =================================================================
    renderizarHorarios() {
        console.log('=== RENDERIZANDO HORÁRIOS COM VERIFICAÇÃO ESTRITA ===');
        
        if (!this.dataSelecionada) {
            console.log('Nenhuma data selecionada, saindo...');
            return;
        }
        
        // Obter todos os agendamentos do localStorage
        const agendamentos = this.getExistingAppointments();
        console.log('Total de agendamentos encontrados:', agendamentos.length);
        
        // Formatar data selecionada como ISO (YYYY-MM-DD) para comparação confiável
        const dataSelecionadaISO = this.formatDate(this.dataSelecionada);
        console.log('Data selecionada ISO:', dataSelecionadaISO);
        
        // Filtrar agendamentos para a data selecionada usando dataISO
        const horariosOcupados = agendamentos
            .filter(app => app.dataISO === dataSelecionadaISO)
            .map(app => app.horario);
        
        console.log('Horários ocupados para esta data:', horariosOcupados);
        
        // Obter todos os botões de horário
        const todosBotoes = document.querySelectorAll('.time-slot');
        console.log('Total de botões encontrados:', todosBotoes.length);
        
        // Limpar estado anterior de todos os botões
        todosBotoes.forEach(botao => {
            botao.disabled = false;
            botao.classList.remove('ocupado', 'selected');
            botao.style.background = '';
            botao.style.borderColor = '';
            botao.style.color = '';
            botao.style.pointerEvents = '';
            botao.style.cursor = 'pointer';
            
            // Resetar texto de status
            const statusElement = botao.querySelector('.status');
            if (statusElement) {
                statusElement.textContent = 'Disponível';
                statusElement.style.color = '';
            }
        });
        
        // Bloquear horários ocupados
        todosBotoes.forEach(botao => {
            const horario = botao.dataset.time;
            
            if (horariosOcupados.includes(horario)) {
                console.log(`✗ BLOQUEANDO horário ${horario} - já agendado`);
                
                // Desabilitar interação
                botao.disabled = true;
                botao.classList.add('ocupado');
                botao.style.setProperty('pointer-events', 'none', 'important');
                botao.style.setProperty('cursor', 'not-allowed', 'important');
                
                // Fundo VERMELHO forçado com !important
                botao.style.setProperty('background-color', '#e74c3c', 'important');
                botao.style.setProperty('background', '#e74c3c', 'important');
                botao.style.setProperty('border-color', '#c0392b', 'important');
                botao.style.setProperty('color', '#ffffff', 'important');
                botao.style.setProperty('opacity', '1', 'important');
                
                // Atualizar texto de status para "Horário Agendado"
                const statusElement = botao.querySelector('.status');
                if (statusElement) {
                    statusElement.textContent = 'Horário Agendado';
                    statusElement.style.setProperty('color', 'rgba(255,255,255,0.9)', 'important');
                }
            } else {
                console.log(`✓ Horário ${horario} - disponível`);
            }
        });
        
        console.log('=== RENDERIZAÇÃO CONCLUÍDA ===');
    }
    updateTimeSlotsAvailability() {
        console.log('=== VERIFICANDO DISPONIBILIDADE DE HORÁRIOS ===');
        
        if (!this.dataSelecionada) {
            console.log('Nenhuma data selecionada, saindo...');
            return;
        }
        
        // Obter todos os agendamentos existentes
        const existingAppointments = this.getExistingAppointments();
        console.log('Agendamentos existentes:', existingAppointments.length);
        
        // Formatar data selecionada para comparação
        const selectedDateStr = this.formatDateForComparison(this.dataSelecionada);
        console.log('Data selecionada formatada:', selectedDateStr);
        
        // Filtrar agendamentos para a data selecionada
        const appointmentsForDate = existingAppointments.filter(app => {
            const appointmentDateStr = this.formatDateForComparison(app.data);
            return appointmentDateStr === selectedDateStr;
        });
        
        console.log('Agendamentos para esta data:', appointmentsForDate.length);
        
        // Obter horários ocupados para esta data
        const occupiedTimes = appointmentsForDate.map(app => app.horario);
        console.log('Horários ocupados:', occupiedTimes);
        
        // Resetar todos os horários para disponível
        this.resetAllTimeSlots();
        
        // Bloquear horários ocupados
        this.blockOccupiedTimeSlots(occupiedTimes);
        
        // Verificar períodos lotados e mostrar mensagens
        this.checkAndShowPeriodMessages(occupiedTimes);
    }
    
    // =================================================================
    // OBTER AGENDAMENTOS EXISTENTES
    // =================================================================
    getExistingAppointments() {
        try {
            const stored = localStorage.getItem('meusAgendamentos');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            return [];
        }
    }
    
    // =================================================================
    // FORMATAR DATA PARA COMPARAÇÃO
    // =================================================================
    formatDateForComparison(date) {
        if (typeof date === 'string') {
            // Se já for string, tentar criar objeto Date
            const dateObj = new Date(date + 'T12:00:00');
            if (isNaN(dateObj.getTime())) {
                // Se falhar, tentar parse direto
                return date.split(' ')[0]; // Pega apenas a parte da data
            }
            date = dateObj;
        }
        
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            console.error('Data inválida para formatação:', date);
            return '';
        }
        
        return date.toLocaleDateString('pt-BR');
    }
    
    // =================================================================
    // RESETAR TODOS OS HORÁRIOS
    // =================================================================
    resetAllTimeSlots() {
        const allSlots = document.querySelectorAll('.time-slot');
        allSlots.forEach(slot => {
            // PROTEÇÃO DO ESTADO VERMELHO: Ignorar se já estiver ocupado
            if (slot.classList.contains('ocupado')) return;

            // Resetar estado do botão
            slot.disabled = false;
            slot.style.opacity = '1';
            slot.style.cursor = 'pointer';
            slot.style.pointerEvents = '';
            slot.classList.remove('occupied', 'selected');
            
            // Resetar estilos para aparência padrão
            slot.style.background = '';
            slot.style.borderColor = '';
            slot.style.color = '';
            
            // Resetar texto de status para "Disponível"
            const statusElement = slot.querySelector('.status');
            if (statusElement) {
                statusElement.textContent = 'Disponível';
                statusElement.style.color = '';
            }
        });
        
        // Remover mensagens de período lotado
        this.removePeriodMessages();
    }
    
    // =================================================================
    // BLOQUEAR HORÁRIOS OCUPADOS
    // =================================================================
    blockOccupiedTimeSlots(occupiedTimes) {
        const allSlots = document.querySelectorAll('.time-slot');
        
        allSlots.forEach(slot => {
            const slotTime = slot.dataset.time;
            
            if (occupiedTimes.includes(slotTime)) {
                // Bloquear completamente o horário
                slot.disabled = true;
                slot.style.opacity = '1'; // Manter visibilidade
                slot.style.cursor = 'not-allowed';
                slot.classList.add('occupied');
                
                // Aplicar estilo vermelho fosco para horários ocupados
                slot.style.background = '#8B0000'; // Vermelho fosco (Dark Red)
                slot.style.borderColor = '#8B0000';
                slot.style.color = '#FFD700'; // Dourado para contraste
                
                // Atualizar texto de status para "Horário Agendado"
                const statusElement = slot.querySelector('.status');
                if (statusElement) {
                    statusElement.textContent = 'Horário Agendado';
                    statusElement.style.color = '#FFD700'; // Dourado para contraste
                }
                
                // Remover evento de clique para garantir que não seja clicável
                slot.style.pointerEvents = 'none';
                
                console.log('Horário bloqueado e marcado como agendado:', slotTime);
            } else {
                // Garantir que horários disponíveis tenham estilo correto
                if (!slot.classList.contains('selected')) {
                    slot.style.background = '';
                    slot.style.borderColor = '';
                    slot.style.color = '';
                    slot.style.pointerEvents = '';
                    
                    const statusElement = slot.querySelector('.status');
                    if (statusElement) {
                        statusElement.textContent = 'Disponível';
                        statusElement.style.color = '';
                    }
                }
            }
        });
    }
    
    // =================================================================
    // VERIFICAR E MOSTRAR MENSSAGENS DE PERÍODO
    // =================================================================
    checkAndShowPeriodMessages(occupiedTimes) {
        // Definir períodos
        const periods = {
            morning: {
                times: ['09:00', '10:00', '11:00'],
                container: '.morning-slots',
                message: 'Todos os horários da manhã para este dia já estão preenchidos.'
            },
            afternoon: {
                times: ['14:00', '15:00', '16:00', '16:30', '17:00'],
                container: '.afternoon-slots',
                message: 'Todos os horários da tarde para este dia já estão preenchidos.'
            },
            evening: {
                times: ['18:00', '19:00', '20:00'],
                container: '.evening-slots',
                message: 'Todos os horários da noite para este dia já estão preenchidos.'
            }
        };
        
        // Verificar cada período
        Object.keys(periods).forEach(periodName => {
            const period = periods[periodName];
            const container = document.querySelector(period.container);
            
            if (container) {
                // Verificar se todos os horários do período estão ocupados
                const allOccupied = period.times.every(time => occupiedTimes.includes(time));
                
                if (allOccupied) {
                    // Esconder horários e mostrar mensagem
                    container.style.display = 'none';
                    this.showPeriodMessage(container, period.message);
                } else {
                    // Mostrar horários se houver disponibilidade
                    container.style.display = 'flex';
                    this.hidePeriodMessage(container);
                }
            }
        });
    }
    
    // =================================================================
    // MOSTRAR MENSSAGEM DE PERÍODO
    // =================================================================
    showPeriodMessage(container, message) {
        // Verificar se mensagem já existe
        let messageElement = container.parentNode.querySelector('.period-message');
        
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.className = 'period-message';
            messageElement.innerHTML = `
                <div class="message-content">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${message}</p>
                </div>
            `;
            
            // Adicionar estilos
            messageElement.style.cssText = `
                background: var(--quaternary-black);
                border: 1px solid var(--primary-gold);
                border-radius: 8px;
                padding: var(--spacing-md);
                margin: var(--spacing-sm) 0;
                text-align: center;
                color: var(--pale-gray);
            `;
            
            container.parentNode.insertBefore(messageElement, container.nextSibling);
        }
    }
    
    // =================================================================
    // ESCONDER MENSSAGEM DE PERÍODO
    // =================================================================
    hidePeriodMessage(container) {
        const messageElement = container.parentNode.querySelector('.period-message');
        if (messageElement) {
            messageElement.remove();
        }
    }
    
    // =================================================================
    // DETECTAR MUDANÇAS NO LOCALSTORAGE
    // =================================================================
    setupStorageListener() {
        // Salvar snapshot dos serviços para detectar mudanças ao retornar à aba
        this._lastServicesSnapshot = localStorage.getItem('salonServices') || '';
        this._lastAppointmentsSnapshot = localStorage.getItem('meusAgendamentos') || '';

        // Escutar mudanças no localStorage (de outras abas/janelas)
        // NOTA: O evento 'storage' só dispara em OUTRAS abas, não na aba atual
        window.addEventListener('storage', (e) => {
            if (e.key === 'meusAgendamentos') {
                console.log('Mudança detectada nos agendamentos (storage event), atualizando disponibilidade...');
                this._lastAppointmentsSnapshot = e.newValue || '';
                
                // Se houver data selecionada, atualizar disponibilidade
                if (this.dataSelecionada) {
                    setTimeout(() => {
                        this.renderizarHorarios();
                    }, 100);
                }
            }

            // Escutar mudanças nos serviços (editados/desativados/excluídos no painel admin)
            // Suporta e.key === 'salonServices' (mudança real) ou e.key === null/undefined (nosso custom event local)
            if (!e || !e.key || e.key === 'salonServices') {
                console.log('Mudança detectada nos serviços (storage event), atualizando página de serviços...');
                this._lastServicesSnapshot = e && e.newValue ? e.newValue : (localStorage.getItem('salonServices') || '');
                setTimeout(() => {
                    this.initializeServices();
                }, 100);
            }
        });

        // Detectar quando o usuário volta para esta aba (funciona mesmo em file://)
        // O evento 'storage' não dispara na mesma aba, então usamos visibilitychange e focus
        // para verificar se houve mudanças no localStorage enquanto o usuário estava em outra aba
        const checkForUpdates = () => {
            const currentServices = localStorage.getItem('salonServices') || '';
            const currentAppointments = localStorage.getItem('meusAgendamentos') || '';

            // Verificar se os serviços mudaram
            if (currentServices !== this._lastServicesSnapshot) {
                console.log('Mudança detectada nos serviços (ao retornar à aba), atualizando...');
                this._lastServicesSnapshot = currentServices;
                if (document.querySelector('.services-grid')) {
                    this.initializeServices();
                }
            }

            // Verificar se os agendamentos mudaram
            if (currentAppointments !== this._lastAppointmentsSnapshot) {
                console.log('Mudança detectada nos agendamentos (ao retornar à aba), atualizando...');
                this._lastAppointmentsSnapshot = currentAppointments;
                if (this.dataSelecionada) {
                    this.renderizarHorarios();
                }
            }
        };

        // Quando a aba fica visível novamente (funciona em todos os protocolos)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                console.log('Aba visível novamente, verificando atualizações...');
                checkForUpdates();
            }
        });

        // Backup: quando a janela recebe foco
        window.addEventListener('focus', () => {
            console.log('Janela recebeu foco, verificando atualizações...');
            checkForUpdates();
        });
    }
    
    // =================================================================
    // FORÇAR ATUALIZAÇÃO DE DISPONIBILIDADE
    // =================================================================
    forceUpdateAvailability() {
        console.log('Forçando atualização de disponibilidade...');
        if (this.dataSelecionada) {
            this.renderizarHorarios();
        }
    }
    
    // =================================================================
    // REMOVER TODAS AS MENSSAGENS DE PERÍODO
    // =================================================================
    removePeriodMessages() {
        const messages = document.querySelectorAll('.period-message');
        messages.forEach(msg => msg.remove());
        
        // Mostrar todos os containers de períodos
        const containers = document.querySelectorAll('.time-slots');
        containers.forEach(container => {
            container.style.display = 'flex';
        });
    }
    
    setupTimeSlots() {
        const timeSlots = document.querySelectorAll('.time-slot');
        console.log('Configurando horários:', timeSlots.length, 'disponíveis');
        
        if (timeSlots.length === 0) {
            console.log('Nenhum horário encontrado');
            return;
        }
        
        // PRIMEIRO: Verificar disponibilidade de horários se houver data selecionada
        if (this.dataSelecionada) {
            console.log('Verificando disponibilidade de horários para data:', this.dataSelecionada);
            this.renderizarHorarios();
        }
        
        // Remover eventos anteriores para evitar conflitos
        timeSlots.forEach(slot => {
            slot.removeEventListener('click', this.handleTimeSlotClick);
            
            // PROTEÇÃO DO ESTADO VERMELHO: Não remover estilos de slots agendados
            if (!slot.classList.contains('ocupado')) {
                slot.style.background = '';
                slot.style.borderColor = '';
                slot.style.color = '';
                slot.classList.remove('selected');
            }
        });
        
        // Adicionar novos eventos
        timeSlots.forEach((slot, index) => {
            console.log(`Horário ${index + 1}:`, slot.dataset.time);
            
            // Usar addEventListener com bind para manter contexto
            const boundHandler = this.handleTimeSlotClick.bind(this, slot);
            slot.addEventListener('click', boundHandler);
            
            // Impedir clique em horários ocupados
            if (slot.classList.contains('occupied')) {
                slot.style.pointerEvents = 'none';
                slot.style.cursor = 'not-allowed';
            }
        });
        
        console.log('Horários configurados com sucesso!');
    }

    handleTimeSlotClick(slot, event) {
        console.log('Horário clicado:', slot.dataset.time);
        
        // TRAVA DE CLIQUE: Impedir qualquer ação se o horário estiver ocupado/agendado
        if (slot.classList.contains('ocupado')) {
            console.log('Clique bloqueado: Horário já agendado');
            return;
        }
        
        // Remover seleção anterior apenas de horários disponíveis
        const allSlots = document.querySelectorAll('.time-slot');
        allSlots.forEach(s => {
            // PROTEÇÃO DO ESTADO VERMELHO: Ignorar horários ocupados no reset
            if (!s.classList.contains('ocupado')) {
                s.classList.remove('selected');
                s.style.background = '';
                s.style.borderColor = '';
                s.style.color = '';
            }
        });
        
        // Adicionar seleção visual forte no horário atual
        slot.classList.add('selected');
        slot.style.background = 'var(--primary-gold)';
        slot.style.borderColor = 'var(--primary-gold)';
        slot.style.color = 'var(--primary-black)';
        
        // Garantir que o estado seja mantido
        slot.setAttribute('aria-selected', 'true');
        
        // Salvar horário selecionado
        this.horarioSelecionado = slot.dataset.time;
        console.log('Horário selecionado salvo:', this.horarioSelecionado);
        
        // Atualizar resumo imediatamente
        this.updateSelectionSummary();
        
        // Forçar atualização visual
        setTimeout(() => {
            console.log('Estado visual do horário verificado:', slot.classList.contains('selected'));
        }, 100);
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
        console.log('updateSelectionSummary chamado - preenchendo textos');
        
        // O card agora é sempre visível, apenas preenchemos os textos
        const summaryService = document.getElementById('summaryService');
        const summaryDate = document.getElementById('summaryDate');
        const summaryTime = document.getElementById('summaryTime');
        const confirmBtn = document.getElementById('confirmarAgendamento');
        
        // Preencher textos dinamicamente
        if (summaryService) {
            const serviceText = this.servicoSelecionado ? `Serviço Selecionado: ${this.servicoSelecionado}` : 'Serviço Selecionado: -';
            summaryService.textContent = serviceText;
        }
        
        if (summaryDate) {
            const dateText = this.dataExibida ? `Data Escolhida: ${this.dataExibida}` : 'Data Escolhida: -';
            summaryDate.textContent = dateText;
        }
        
        if (summaryTime) {
            const timeText = this.horarioSelecionado ? `Horário Escolhido: ${this.horarioSelecionado}` : 'Horário Escolhido: -';
            summaryTime.textContent = timeText;
        }
        
        // Habilitar/desabilitar botão confirmar baseado na seleção completa
        if (confirmBtn) {
            const allSelected = this.dataSelecionada && this.horarioSelecionado && this.servicoSelecionado;
            confirmBtn.disabled = !allSelected;
            console.log('Botão confirmar habilitado:', allSelected);
        }
    }

    // enableTimeSlots duplicado removido - usar o definido acima (linha ~1096)

    updateSelectedServiceDisplay() {
        const display = document.getElementById('selectedServiceDisplay');
        const serviceName = document.getElementById('selectedServiceName');
        
        if (display && serviceName && this.servicoSelecionado) {
            serviceName.textContent = this.servicoSelecionado;
            display.style.display = 'block';
        }
    }

    // =================================================================
    // GERENCIAMENTO DE FLUXO DE AGENDAMENTO
    // =================================================================
    handleNewAppointment() {
        // Fechar modal de agendamentos
        this.closeModal('modalAgendamentos');
        
        // RESETAR COMPLETAMENTE O ESTADO PARA COMEÇAR DO ZERO
        this.resetAppointmentState();
        
        console.log('Estado resetado. Iniciando novo agendamento do zero.');
        console.log('Estado após reset:', {
            clienteDados: this.clienteDados,
            servicoSelecionado: this.servicoSelecionado,
            dataSelecionada: this.dataSelecionada,
            horarioSelecionado: this.horarioSelecionado
        });
        
        // Sempre começar da página 1, independente do estado atual
        this.showNotification('Iniciando novo agendamento', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    // =================================================================
    // RESET DE ESTADO DE AGENDAMENTO
    // =================================================================
    resetAppointmentState() {
        // Limpar estado do aplicativo
        this.servicoSelecionado = null;
        this.dataSelecionada = null;
        this.horarioSelecionado = null;
        
        // Limpar localStorage (mas manter dados do cliente)
        localStorage.removeItem('servicoSelecionado');
        
        // Limpar seleções visuais se existirem na página atual
        this.clearVisualSelections();
        
        console.log('Estado de agendamento resetado com sucesso');
    }

    clearVisualSelections() {
        // Limpar seleção de serviços
        document.querySelectorAll('.service-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Limpar radio buttons de serviços
        document.querySelectorAll('input[name="servico"]').forEach(radio => {
            radio.checked = false;
        });
        
        // Limpar seleção de dias
        document.querySelectorAll('.day-btn.selected').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Limpar seleção de horários
        document.querySelectorAll('.time-slot.selected').forEach(slot => {
            slot.classList.remove('selected');
            slot.style.background = '';
            slot.style.borderColor = '';
            slot.style.color = '';
        });
        
        // Esconder resumo se visível
        const selectionSummary = document.getElementById('selectionSummary');
        if (selectionSummary) {
            selectionSummary.style.display = 'none';
        }
        
        // Esconder botão confirmar abaixo dos horários
        const confirmationSection = document.getElementById('confirmationSection');
        if (confirmationSection) {
            confirmationSection.style.display = 'none';
        }
        
        // Esconder informação de serviço selecionado
        const selectionInfo = document.getElementById('selectionInfo');
        if (selectionInfo) {
            selectionInfo.style.display = 'none';
        }
        
        console.log('Seleções visuais limpas');
    }

    // =================================================================
    // MODAIS
    // =================================================================
    setupModalHandlers() {
        // Botão confirmar agendamento na página principal (abaixo dos horários)
        const confirmarBtnDirect = document.getElementById('confirmarAgendamentoDirect');
        if (confirmarBtnDirect) {
            // Remover eventos anteriores
            confirmarBtnDirect.onclick = null;
            
            // Configurar para mostrar notificação toast
            confirmarBtnDirect.addEventListener('click', () => {
                console.log('Botão Confirmar Agendamento clicado');
                this.showNotification('Agendamento realizado com sucesso!', 'success');
            });
            
            console.log('Botão Confirmar Agendamento Direto configurado com notificação toast');
        }

        // Botão confirmar agendamento no summary (se existir)
        const confirmarBtn = document.getElementById('confirmarAgendamento');
        if (confirmarBtn) {
            // Remover eventos anteriores
            confirmarBtn.onclick = null;
            
            // Configurar para abrir modal de resumo antes de confirmar
            confirmarBtn.addEventListener('click', () => {
                console.log('Botão Confirmar Agendamento clicado - abrindo resumo');
                this.showResumoModal();
            });
            
            console.log('Botão Confirmar Agendamento configurado para abrir resumo');
        }

        // Botões do modal de resumo
        const cancelarResumo = document.getElementById('cancelarResumo');
        const confirmarResumo = document.getElementById('confirmarResumo');
        
        if (cancelarResumo) {
            cancelarResumo.addEventListener('click', () => {
                // Voltar para a página anterior em vez de apenas fechar o modal
                this.closeModal('modalResumo');
                history.back();
            });
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
    // AGENDAMENTOS
    // =================================================================
    confirmarAgendamento() {
        console.log('Confirmando agendamento...');
        
        if (!this.dataSelecionada || !this.horarioSelecionado || !this.servicoSelecionado || !this.clienteDados) {
            this.showNotification('Por favor, complete todas as etapas do agendamento', 'warning');
            return;
        }

        // VALIDAÇÃO EXTRA: Verificar no localStorage se o horário já foi ocupado
        const dataISO = this.formatDate(this.dataSelecionada);
        const agendamentos = this.getExistingAppointments();
        const jaOcupado = agendamentos.some(app => 
            app.dataISO === dataISO && app.horario === this.horarioSelecionado
        );
        
        if (jaOcupado) {
            this.showNotification('Este horário já está ocupado! Escolha outro.', 'error');
            this.horarioSelecionado = null;
            this.renderizarHorarios(); // Atualizar visual
            this.updateSelectionSummary();
            return;
        }

        // Criar agendamento com ID único
        const appointmentData = {
            id: Date.now().toString(),
            servico: this.servicoSelecionado,
            data: this.dataExibida || this.formatDateDisplay(this.dataSelecionada), // Usar texto exato
            dataISO: this.formatDate(this.dataSelecionada), // Formato YYYY-MM-DD para o painel admin
            dataObj: this.formatDateDisplay(this.dataSelecionada), // Manter formato padrão para compatibilidade
            horario: this.horarioSelecionado,
            cliente: this.clienteDados.nome,
            email: this.clienteDados.email,
            telefone: this.clienteDados.telefone,
            criadoEm: new Date().toISOString()
        };

        // Salvar usando o serviço unificado (localStorage)
        if (window.appointmentService) {
            window.appointmentService.addAppointment(appointmentData);
        } else {
            // Fallback se o serviço não estiver carregado
            this.saveAppointment(appointmentData);
        }

        // Salvar na API (MySQL) em background
        if (window.apiService) {
            window.apiService.cadastrarAgendamento(appointmentData)
                .then(result => console.log('✅ Agendamento salvo no MySQL:', result))
                .catch(err => console.warn('⚠️ Falha ao salvar na API (dados no localStorage):', err));
        }
        
        console.log('Agendamento criado:', appointmentData);

        // Mostrar mensagem de sucesso moderna
        this.showNotification('Agendamento realizado com sucesso!', 'success');

        // Limpar seleção
        this.limparSelecao();

        // Após 1.5 segundos, reset completo e voltar para a primeira etapa
        setTimeout(() => {
            this.resetarCompleto();
            this.voltarParaPrimeiraEtapa();
        }, 1500);
    }

    saveAppointment(appointmentData) {
        // Obter agendamentos existentes da chave 'meusAgendamentos'
        let appointments = JSON.parse(localStorage.getItem('meusAgendamentos') || '[]');
        
        // Adicionar novo agendamento
        appointments.push(appointmentData);
        
        // Salvar no localStorage com chave 'meusAgendamentos'
        localStorage.setItem('meusAgendamentos', JSON.stringify(appointments));
        
        console.log('Agendamento salvo no localStorage:', appointmentData);
    }

    loadAppointments() {
        // Obter agendamentos filtrados pelo telefone verificado
        let appointments = [];
        
        if (window.otpService && window.otpService.isPhoneVerified()) {
            // Usar o serviço OTP para obter agendamentos do telefone validado
            appointments = window.otpService.getAppointmentsByVerifiedPhone();
        } else if (window.appointmentService && this.clienteDados) {
            // Fallback se o telefone ainda não estiver verificado mas houver dados do cliente
            appointments = window.appointmentService.getClientFutureAppointmentsByPhone(this.clienteDados.telefone);
        } else {
            // Se nada estiver disponível, tentar carregar tudo (comportamento de segurança mínimo)
            const localData = localStorage.getItem('meusAgendamentos');
            appointments = localData ? JSON.parse(localData) : [];
        }
        
        // Ordenar por data de criação (mais recentes primeiro)
        appointments.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
        
        return appointments;
    }

    displayAppointments() {
        const appointments = this.loadAppointments();
        const listaContainer = document.getElementById('listaAgendamentos');
        const emptyState = document.getElementById('emptyState');
        
        if (!listaContainer) return;
        
        // Limpar lista atual
        listaContainer.innerHTML = '';
        
        if (appointments.length === 0) {
            // Mostrar estado vazio
            if (emptyState) emptyState.style.display = 'block';
            listaContainer.style.display = 'none';
        } else {
            // Esconder estado vazio
            if (emptyState) emptyState.style.display = 'none';
            listaContainer.style.display = 'block';
            
            // Criar cards para cada agendamento
            appointments.forEach(appointment => {
                const appointmentCard = this.createAppointmentCard(appointment);
                listaContainer.appendChild(appointmentCard);
            });
        }
        
        // Atualizar contador
        this.updateAgendamentosCount(appointments.length);
    }

    createAppointmentCard(appointment) {
        const card = document.createElement('div');
        card.className = 'appointment-card';
        card.innerHTML = `
            <div class="appointment-header">
                <div class="appointment-info">
                    <h4 class="appointment-service">${appointment.servico}</h4>
                    <p class="appointment-customer">${appointment.cliente}</p>
                </div>
                <div class="appointment-status">
                    <span class="status-badge confirmed">Confirmado</span>
                </div>
            </div>
            <div class="appointment-details">
                <div class="detail-item">
                    <i class="fas fa-calendar"></i>
                    <span>${appointment.data}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <span>${appointment.horario}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-phone"></i>
                    <span>${appointment.telefone}</span>
                </div>
            </div>
            <div class="appointment-actions">
                <button class="btn-cancel" onclick="app.cancelAppointment('${appointment.id}')">
                    <i class="fas fa-times"></i>
                    Cancelar Agendamento
                </button>
            </div>
        `;
        return card;
    }

    cancelAppointment(appointmentId) {
        // Criar diálogo de confirmação moderno
        this.showConfirmDialog(
            'Cancelar Agendamento',
            'Tem certeza que deseja cancelar este agendamento?',
            () => {
                // Callback de confirmação
                this.performCancelAppointment(appointmentId);
            }
        );
    }

    showConfirmDialog(title, message, onConfirm) {
        // Criar overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            animation: fadeIn 0.3s ease;
        `;

        // Criar diálogo
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: #1a1a1a;
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: 12px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
        `;

        dialog.innerHTML = `
            <h3 style="color: #D4AF37; margin-bottom: 12px; font-size: 18px;">${title}</h3>
            <p style="color: #ccc; margin-bottom: 20px; line-height: 1.4;">${message}</p>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="btnCancel" style="
                    background: transparent;
                    color: #ccc;
                    border: 1px solid #555;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                ">Cancelar</button>
                <button id="btnConfirm" style="
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                ">Confirmar</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Eventos
        document.getElementById('btnCancel').addEventListener('click', () => {
            overlay.remove();
        });

        document.getElementById('btnConfirm').addEventListener('click', () => {
            overlay.remove();
            onConfirm();
        });

        // Fechar ao clicar fora
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }

    performCancelAppointment(appointmentId) {
        // Tentar excluir da API primeiro (MySQL)
        if (window.apiService) {
            window.apiService.deletarAgendamento(appointmentId)
                .then(() => {
                    console.log('Agendamento cancelado com sucesso na API');
                    // Atualizar visual da página atual
                    this.displayAppointments(); // Atualiza a lista de "Meus Agendamentos"
                    this.renderizarHorarios();  // Libera o horário na grade de seleção
                    this.updateAgendamentosCount(); // Atualiza o contador de notificações
                    // Mostrar mensagem de sucesso
                    this.showNotification('Agendamento cancelado com sucesso!', 'success');
                })
                .catch((error) => {
                    console.warn('Erro ao cancelar na API, usando fallback localStorage:', error);
                    // Fallback: apenas localStorage
                    this.performCancelAppointmentLocal(appointmentId);
                });
        } else {
            // Fallback se apiService não estiver disponível
            this.performCancelAppointmentLocal(appointmentId);
        }
    }

    performCancelAppointmentLocal(appointmentId) {
        if (!window.appointmentService) {
            // Fallback se o serviço não estiver disponível
            let appointments = JSON.parse(localStorage.getItem('meusAgendamentos') || '[]');
            appointments = appointments.filter(app => app.id.toString() !== appointmentId.toString());
            localStorage.setItem('meusAgendamentos', JSON.stringify(appointments));
        } else {
            // Usar o serviço unificado
            window.appointmentService.cancelAppointment(appointmentId);
        }
        
        // Mostrar mensagem de sucesso
        this.showNotification('Agendamento cancelado com sucesso!', 'success');
        
        // Atualizar visual da página atual
        this.displayAppointments(); // Atualiza a lista de "Meus Agendamentos"
        this.renderizarHorarios();  // Libera o horário na grade de seleção
        this.updateAgendamentosCount(); // Atualiza o contador de notificações
    }

    updateAgendamentosCount(count) {
        const countElements = document.querySelectorAll('#agendamentosCount');
        countElements.forEach(element => {
            element.textContent = count;
        });
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
        
        if (window.otpService && window.otpService.isPhoneVerified()) {
            const appointments = window.otpService.getAppointmentsByVerifiedPhone();
            count = appointments.length;
        } else if (window.appointmentService && this.clienteDados) {
            const appointments = window.appointmentService.getClientFutureAppointmentsByPhone(this.clienteDados.telefone);
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

        // Obter agendamentos filtrados pelo telefone verificado
        let appointments = [];
        if (window.otpService && window.otpService.isPhoneVerified()) {
            // Usar telefone verificado como identificador principal
            appointments = window.otpService.getAppointmentsByVerifiedPhone();
            // Filtrar apenas agendamentos futuros
            const now = new Date();
            appointments = appointments.filter(apt => {
                const aptDate = new Date(apt.dataISO + 'T' + apt.horario);
                return aptDate > now && (apt.status === 'confirmed' || !apt.status);
            }).sort((a, b) => {
                const dateA = new Date(a.dataISO + 'T' + a.horario);
                const dateB = new Date(b.dataISO + 'T' + b.horario);
                return dateA - dateB;
            });
        } else if (window.appointmentService && this.clienteDados) {
            // Fallback: usar telefone se não verificado via OTP mas disponível nos dados
            appointments = window.appointmentService.getClientFutureAppointmentsByPhone(this.clienteDados.telefone);
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
            <button class="btn-cancelar" onclick="app.cancelAppointment('${appointment.id}')">
                <i class="fas fa-times"></i> Cancelar
            </button>
        `;
        
        return item;
    }

    cancelarAgendamento(id) {
        // Redirecionar para o método consolidado
        this.cancelAppointment(id);
    }

    limparSelecao() {
        this.dataSelecionada = null;
        this.horarioSelecionado = null;
        
        // Limpar seleção visual
        document.querySelectorAll('.day-btn.selected').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        document.querySelectorAll('.time-slot.selected').forEach(slot => {
            if (!slot.classList.contains('ocupado')) {
                slot.classList.remove('selected');
                slot.style.background = '';
                slot.style.borderColor = '';
                slot.style.color = '';
            }
        });
        
        // Esconder resumo
        const selectionSummary = document.getElementById('selectionSummary');
        if (selectionSummary) {
            selectionSummary.style.display = 'none';
        }
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
        // Ajustar para fuso horário local para evitar bug de UTC
        const localDate = new Date(date);
        const dia = String(localDate.getDate()).padStart(2, '0');
        const mes = String(localDate.getMonth() + 1).padStart(2, '0');
        const ano = localDate.getFullYear();
        
        return `${dia}/${mes}/${ano}`;
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
        
        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover após 2 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    getNotificationColor(type) {
        const colors = {
            success: '#4CAF50',  // Verde mais vibrante
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

    resetarCompleto() {
        console.log('Resetando completamente as seleções...');
        
        // Limpar todas as seleções
        this.servicoSelecionado = null;
        this.dataSelecionada = null;
        this.dataExibida = null;
        this.horarioSelecionado = null;
        this.clienteDados = null;
        
        // Limpar verificação OTP para novo fluxo
        if (window.otpService) {
            window.otpService.clearVerification();
        }
        
        // Remover classes de seleção dos cards de data
        const allDayBtns = document.querySelectorAll('.day-btn');
        allDayBtns.forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Remover classes de seleção dos horários (protegendo ocupados)
        const allTimeSlots = document.querySelectorAll('.time-slot');
        allTimeSlots.forEach(slot => {
            if (!slot.classList.contains('ocupado')) {
                slot.classList.remove('selected');
                slot.style.background = '';
                slot.style.borderColor = '';
                slot.style.color = '';
                slot.setAttribute('aria-selected', 'false');
            }
        });
        
        // Limpar textos do card de resumo
        const summaryService = document.getElementById('summaryService');
        const summaryDate = document.getElementById('summaryDate');
        const summaryTime = document.getElementById('summaryTime');
        const confirmBtn = document.getElementById('confirmarAgendamento');
        
        if (summaryService) summaryService.textContent = 'Serviço Selecionado: -';
        if (summaryDate) summaryDate.textContent = 'Data Escolhida: -';
        if (summaryTime) summaryTime.textContent = 'Horário Escolhido: -';
        if (confirmBtn) confirmBtn.disabled = true;
        
        // Desabilitar horários
        this.disableTimeSlots();
        
        console.log('Reset completo realizado');
    }

    voltarParaPrimeiraEtapa() {
        console.log('Voltando para a primeira etapa...');
        
        // Redirecionar para a página inicial (cadastro/Seleção de Serviço)
        window.location.href = 'index.html';
    }

    disableTimeSlots() {
        const timeSlots = document.querySelectorAll('.time-slot');
        timeSlots.forEach(slot => {
            slot.disabled = true;
            slot.style.opacity = '0.5';
            slot.style.cursor = 'not-allowed';
        });
    }
}

// =================================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// =================================================================
let app;

// Carregar serviços auxiliares antes de inicializar
function loadAppointmentService() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'js/appointment-service.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function loadOTPService() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'js/otp-service.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([
            loadAppointmentService(),
            loadOTPService()
        ]);
        app = new HairStylistApp();
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        // Tentar inicializar mesmo com erro parcial
        app = new HairStylistApp();
    }
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
    module.exports = HairStylistApp;
}
