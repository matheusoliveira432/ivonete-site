/**
 * =================================================================
 * HAIR STYLIST - SERVIÇO DE API
 * Camada de comunicação entre o frontend e a API backend (MySQL)
 * Substitui o localStorage como fonte de dados principal
 * =================================================================
 */

class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:3001';
        this.isOnline = false;
        this.checkConnection();
    }

    // =================================================================
    // VERIFICAR CONEXÃO COM A API
    // =================================================================
    async checkConnection() {
        try {
            const response = await fetch(this.baseUrl, { method: 'GET' });
            this.isOnline = response.ok;
            if (this.isOnline) {
                console.log('✅ API conectada com sucesso!');
            }
        } catch (error) {
            this.isOnline = false;
            console.warn('⚠️ API offline. Usando localStorage como fallback.');
        }
        return this.isOnline;
    }

    // =================================================================
    // CLIENTES
    // =================================================================

    /**
     * Cadastrar um novo cliente na API
     * @param {Object} clienteData - { nome, telefone, email }
     * @returns {Object} Cliente criado com ID do banco
     */
    async cadastrarCliente(clienteData) {
        try {
            const response = await fetch(`${this.baseUrl}/clientes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clienteData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.erro || 'Erro ao cadastrar cliente');
            }

            const cliente = await response.json();
            console.log('✅ Cliente cadastrado na API:', cliente);

            // Salvar ID do cliente no localStorage para referência rápida
            const clienteDados = { ...clienteData, apiId: cliente.id };
            localStorage.setItem('clienteDados', JSON.stringify(clienteDados));

            return cliente;
        } catch (error) {
            console.error('❌ Erro ao cadastrar cliente na API:', error);

            // Fallback: salvar no localStorage
            localStorage.setItem('clienteDados', JSON.stringify(clienteData));
            return clienteData;
        }
    }

    /**
     * Buscar cliente por ID
     */
    async buscarCliente(id) {
        try {
            const response = await fetch(`${this.baseUrl}/clientes/${id}`);
            if (!response.ok) throw new Error('Cliente não encontrado');
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar cliente:', error);
            return null;
        }
    }

    /**
     * Listar todos os clientes
     */
    async listarClientes() {
        try {
            const response = await fetch(`${this.baseUrl}/clientes`);
            if (!response.ok) throw new Error('Erro ao listar clientes');
            return await response.json();
        } catch (error) {
            console.error('Erro ao listar clientes:', error);
            return [];
        }
    }

    /**
     * Buscar cliente pelo telefone
     */
    async buscarClientePorTelefone(telefone) {
        try {
            const clientes = await this.listarClientes();
            const telefoneNormalizado = (telefone || '').replace(/\D/g, '');
            return clientes.find(c => (c.telefone || '').replace(/\D/g, '') === telefoneNormalizado);
        } catch (error) {
            console.error('Erro ao buscar cliente por telefone:', error);
            return null;
        }
    }

    // =================================================================
    // AGENDAMENTOS
    // =================================================================

    /**
     * Cadastrar um novo agendamento
     * @param {Object} agendamentoData - Dados do agendamento do frontend
     * @returns {Object} Agendamento criado
     */
    async cadastrarAgendamento(agendamentoData) {
        try {
            // Primeiro, garantir que o cliente existe na API
            let clienteId = null;
            const clienteLocal = JSON.parse(localStorage.getItem('clienteDados') || '{}');

            if (clienteLocal.apiId) {
                clienteId = clienteLocal.apiId;
            } else {
                // Buscar por telefone ou criar cliente
                const clienteExistente = await this.buscarClientePorTelefone(clienteLocal.telefone);

                if (clienteExistente) {
                    clienteId = clienteExistente.id;
                    // Atualizar localStorage com o ID da API
                    clienteLocal.apiId = clienteId;
                    localStorage.setItem('clienteDados', JSON.stringify(clienteLocal));
                } else {
                    // Criar cliente na API
                    const novoCliente = await this.cadastrarCliente({
                        nome: clienteLocal.nome || agendamentoData.cliente,
                        telefone: clienteLocal.telefone || agendamentoData.telefone,
                        email: clienteLocal.email || agendamentoData.email
                    });
                    clienteId = novoCliente.id || novoCliente.apiId;
                }
            }

            if (!clienteId) {
                throw new Error('Não foi possível identificar o cliente');
            }

            // Montar dataHora a partir de dataISO + horario
            const dataHora = `${agendamentoData.dataISO}T${agendamentoData.horario}:00`;

            const payload = {
                dataHora: dataHora,
                servico: agendamentoData.servico,
                clienteId: clienteId
            };

            const response = await fetch(`${this.baseUrl}/agendamentos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.erro || 'Erro ao cadastrar agendamento');
            }

            const resultado = await response.json();
            console.log('✅ Agendamento salvo na API (MySQL):', resultado);

            // Também salvar no localStorage para manter compatibilidade
            this.syncToLocalStorage(agendamentoData);

            return resultado;
        } catch (error) {
            console.error('❌ Erro ao cadastrar agendamento na API:', error);

            // Fallback: salvar no localStorage
            this.syncToLocalStorage(agendamentoData);
            return agendamentoData;
        }
    }

    /**
     * Listar todos os agendamentos
     */
    async listarAgendamentos() {
        try {
            const response = await fetch(`${this.baseUrl}/agendamentos`);
            if (!response.ok) throw new Error('Erro ao listar agendamentos');
            return await response.json();
        } catch (error) {
            console.error('Erro ao listar agendamentos:', error);
            // Fallback: retornar do localStorage
            const local = localStorage.getItem('meusAgendamentos');
            return local ? JSON.parse(local) : [];
        }
    }

    // =================================================================
    // SINCRONIZAÇÃO COM LOCALSTORAGE (compatibilidade)
    // =================================================================

    /**
     * Salva o agendamento também no localStorage para manter
     * compatibilidade com o restante do sistema (verificação de
     * horários ocupados, "Meus Agendamentos", admin, etc.)
     */
    syncToLocalStorage(agendamentoData) {
        try {
            let appointments = JSON.parse(localStorage.getItem('meusAgendamentos') || '[]');
            appointments.push(agendamentoData);
            localStorage.setItem('meusAgendamentos', JSON.stringify(appointments));
            console.log('📦 Agendamento sincronizado com localStorage');
        } catch (error) {
            console.error('Erro ao sincronizar com localStorage:', error);
        }
    }

    /**
     * Carregar agendamentos da API e sincronizar com localStorage
     */
    async syncFromApi() {
        try {
            const agendamentos = await this.listarAgendamentos();

            if (agendamentos.length > 0) {
                // Converter formato da API para formato do localStorage
                const todos = agendamentos.map(ag => {
                    const dataHora = new Date(ag.dataHora);
                    const dataISO = dataHora.toISOString().split('T')[0];
                    const horario = dataHora.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });

                    return {
                        id: ag.id.toString(),
                        servico: ag.servico,
                        data: dataHora.toLocaleDateString('pt-BR'),
                        dataISO: dataISO,
                        dataObj: dataHora.toLocaleDateString('pt-BR'),
                        horario: horario,
                        cliente: ag.cliente ? ag.cliente.nome : 'N/A',
                        email: ag.cliente ? ag.cliente.email : '',
                        telefone: ag.cliente ? ag.cliente.telefone : '',
                        criadoEm: ag.dataHora,
                        apiId: ag.id,
                        status: 'confirmed'
                    };
                });

                // Salvar todos no localStorage (o appointment-service filtrará os futuros para exibir)
                localStorage.setItem('meusAgendamentos', JSON.stringify(todos));
                console.log(`🔄 ${todos.length} agendamentos sincronizados da API (MySQL) para o site.`);
            }
        } catch (error) {
            console.warn('Não foi possível sincronizar da API:', error);
        }
    }
}

// =================================================================
// INSTÂNCIA GLOBAL DO SERVIÇO API
// =================================================================
window.apiService = new ApiService();

// Sincronizar dados da API ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
    if (window.apiService) {
        window.apiService.syncFromApi();
    }
});
