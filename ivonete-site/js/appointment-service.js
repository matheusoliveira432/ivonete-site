/**
 * =================================================================
   STUDIO STYLIST - SERVIÇO DE AGENDAMENTOS
   Sistema completo para gerenciamento de agendamentos
   =================================================================
 */

class AppointmentService {
    constructor() {
        this.appointments = [];
        this.initializeService();
    }

    // =================================================================
    // INICIALIZAÇÃO DO SERVIÇO
    // =================================================================
    initializeService() {
        this.loadAppointments();
        this.setupAutoSave();
        this.cleanupOldAppointments();
    }

    // =================================================================
    // CARREGAR AGENDAMENTOS
    // =================================================================
    loadAppointments() {
        try {
            // Carregar do localStorage
            const localData = localStorage.getItem('studioStylistAppointments');
            if (localData) {
                this.appointments = JSON.parse(localData);
            }

            // Carregar do arquivo JSON (se existir)
            this.loadFromFile();
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            this.appointments = [];
        }
    }

    // =================================================================
    // SALVAR AGENDAMENTOS
    // =================================================================
    saveAppointments() {
        try {
            // Salvar no localStorage
            localStorage.setItem('studioStylistAppointments', JSON.stringify(this.appointments));
            
            // Salvar no arquivo JSON
            this.saveToFile();
            
            console.log('Agendamentos salvos com sucesso');
        } catch (error) {
            console.error('Erro ao salvar agendamentos:', error);
        }
    }

    // =================================================================
    // ADICIONAR NOVO AGENDAMENTO
    // =================================================================
    addAppointment(appointmentData) {
        const appointment = {
            id: Date.now(),
            ...appointmentData,
            createdAt: new Date().toISOString(),
            status: 'confirmed',
            timestamp: new Date().getTime()
        };

        this.appointments.push(appointment);
        this.saveAppointments();
        
        console.log('Novo agendamento adicionado:', appointment);
        return appointment;
    }

    // =================================================================
    // CANCELAR AGENDAMENTO
    // =================================================================
    cancelAppointment(appointmentId) {
        const index = this.appointments.findIndex(apt => apt.id === appointmentId);
        if (index !== -1) {
            this.appointments[index].status = 'cancelled';
            this.appointments[index].cancelledAt = new Date().toISOString();
            this.saveAppointments();
            return true;
        }
        return false;
    }

    // =================================================================
    // OBTER AGENDAMENTOS DA SEMANA
    // =================================================================
    getWeekAppointments(weekOffset = 0) {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return this.appointments
            .filter(apt => {
                const aptDate = new Date(apt.data + ' ' + apt.horario);
                return aptDate >= startOfWeek && aptDate <= endOfWeek && apt.status === 'confirmed';
            })
            .sort((a, b) => {
                const dateA = new Date(a.data + ' ' + a.horario);
                const dateB = new Date(b.data + ' ' + b.horario);
                return dateA - dateB;
            });
    }

    // =================================================================
    // OBTER AGENDAMENTOS DO DIA
    // =================================================================
    getDayAppointments(date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate);
        nextDay.setDate(targetDate.getDate() + 1);

        return this.appointments
            .filter(apt => {
                const aptDate = new Date(apt.data + ' ' + apt.horario);
                return aptDate >= targetDate && aptDate < nextDay && apt.status === 'confirmed';
            })
            .sort((a, b) => {
                const timeA = a.horario.split(':').map(Number);
                const timeB = b.horario.split(':').map(Number);
                return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
            });
    }

    // =================================================================
    // OBTER AGENDAMENTOS FUTUROS DO CLIENTE
    // =================================================================
    getClientFutureAppointments(clientEmail) {
        const now = new Date();
        return this.appointments
            .filter(apt => {
                const aptDate = new Date(apt.data + ' ' + apt.horario);
                return apt.email === clientEmail && aptDate > now && apt.status === 'confirmed';
            })
            .sort((a, b) => {
                const dateA = new Date(a.data + ' ' + a.horario);
                const dateB = new Date(b.data + ' ' + b.horario);
                return dateA - dateB;
            });
    }

    // =================================================================
    // VERIFICAR DISPONIBILIDADE
    // =================================================================
    checkAvailability(date, time) {
        const existingAppointment = this.appointments.find(apt => 
            apt.data === date && 
            apt.horario === time && 
            apt.status === 'confirmed'
        );
        
        return !existingAppointment;
    }

    // =================================================================
    // LIMPEZA AUTOMÁTICA
    // =================================================================
    cleanupOldAppointments() {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        
        const oldAppointments = this.appointments.filter(apt => {
            const aptDate = new Date(apt.data + ' ' + apt.horario);
            return aptDate < oneWeekAgo && apt.status !== 'cancelled';
        });

        if (oldAppointments.length > 0) {
            console.log(`Limpando ${oldAppointments.length} agendamentos antigos`);
            this.appointments = this.appointments.filter(apt => {
                const aptDate = new Date(apt.data + ' ' + apt.horario);
                return aptDate >= oneWeekAgo || apt.status === 'cancelled';
            });
            this.saveAppointments();
        }
    }

    // =================================================================
    // SALVAR EM ARQUIVO (SIMULAÇÃO)
    // =================================================================
    saveToFile() {
        // Em um ambiente real, isso seria uma chamada API
        // Por enquanto, salvamos apenas no localStorage
        const dataToSave = {
            appointments: this.appointments,
            lastUpdated: new Date().toISOString(),
            version: '1.0'
        };
        
        // Simular salvamento em arquivo
        console.log('Dados preparados para salvamento:', dataToSave);
    }

    // =================================================================
    // CARREGAR DE ARQUIVO (SIMULAÇÃO)
    // =================================================================
    loadFromFile() {
        // Em um ambiente real, isso seria uma chamada API
        // Por enquanto, apenas usamos o localStorage
        console.log('Carregando dados do arquivo (simulado)');
    }

    // =================================================================
    // AUTOSAVE
    // =================================================================
    setupAutoSave() {
        // Salvar automaticamente a cada 30 segundos
        setInterval(() => {
            this.saveAppointments();
        }, 30000);
    }

    // =================================================================
    // ESTATÍSTICAS
    // =================================================================
    getStatistics() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeek = this.getWeekAppointments(0);
        const nextWeek = this.getWeekAppointments(1);

        return {
            total: this.appointments.length,
            confirmed: this.appointments.filter(apt => apt.status === 'confirmed').length,
            cancelled: this.appointments.filter(apt => apt.status === 'cancelled').length,
            today: this.getDayAppointments(today.toISOString().split('T')[0]).length,
            thisWeek: thisWeek.length,
            nextWeek: nextWeek.length,
            todayRevenue: this.calculateRevenue(this.getDayAppointments(today.toISOString().split('T')[0])),
            weekRevenue: this.calculateRevenue(thisWeek)
        };
    }

    // =================================================================
    // CALCULAR RECEITA
    // =================================================================
    calculateRevenue(appointments) {
        const prices = {
            'Progressiva': 250,
            'Tintura': 180,
            'Corte': 80,
            'Botox': 200,
            'Selagem': 150,
            'Luzes': 300
        };

        return appointments.reduce((total, apt) => {
            const price = prices[apt.servico] || 0;
            return total + price;
        }, 0);
    }

    // =================================================================
    // EXPORTAR DADOS
    // =================================================================
    exportData() {
        const data = {
            appointments: this.appointments,
            statistics: this.getStatistics(),
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `studio-stylist-appointments-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// =================================================================
// INSTÂNCIA GLOBAL DO SERVIÇO
// =================================================================
window.appointmentService = new AppointmentService();

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppointmentService;
}
