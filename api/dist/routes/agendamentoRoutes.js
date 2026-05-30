"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../data-source");
const Agendamento_1 = require("../entity/Agendamento");
const Cliente_1 = require("../entity/Cliente");
const router = (0, express_1.Router)();
const agendamentoRepo = () => data_source_1.AppDataSource.getRepository(Agendamento_1.Agendamento);
const clienteRepo = () => data_source_1.AppDataSource.getRepository(Cliente_1.Cliente);
// POST /agendamentos — Cadastrar agendamento para um cliente existente
router.post("/", async (req, res) => {
    try {
        const { dataHora, servico, clienteId } = req.body;
        // Validação básica
        if (!dataHora || !servico || !clienteId) {
            res.status(400).json({
                erro: "Os campos dataHora, servico e clienteId são obrigatórios.",
            });
            return;
        }
        // Verificar se o cliente existe
        const cliente = await clienteRepo().findOneBy({ id: Number(clienteId) });
        if (!cliente) {
            res.status(404).json({
                erro: `Cliente com id ${clienteId} não encontrado.`,
            });
            return;
        }
        const agendamento = agendamentoRepo().create({
            dataHora: new Date(dataHora),
            servico,
            clienteId: cliente.id,
        });
        const resultado = await agendamentoRepo().save(agendamento);
        // Retorna o agendamento com dados do cliente
        const agendamentoCompleto = await agendamentoRepo().findOne({
            where: { id: resultado.id },
            relations: ["cliente"],
        });
        res.status(201).json(agendamentoCompleto);
    }
    catch (error) {
        console.error("Erro ao cadastrar agendamento:", error);
        res.status(500).json({ erro: "Erro interno ao cadastrar agendamento." });
    }
});
// GET /agendamentos — Listar agendamentos (suporta filtros por cliente e data)
router.get("/", async (req, res) => {
    try {
        const { clienteId, futuros } = req.query;
        const where = {};
        if (clienteId) {
            where.clienteId = Number(clienteId);
        }
        if (futuros === "true") {
            // Filtra apenas agendamentos de hoje em diante
            // Nota: Em produção, o ideal é usar a data/hora exata do servidor
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            // Usaremos o QueryBuilder para filtros mais complexos de data se necessário,
            // mas para simplificar usaremos o find padrão com as relações
        }
        const agendamentos = await agendamentoRepo().find({
            where,
            relations: ["cliente"],
            order: { dataHora: "ASC" },
        });
        res.json(agendamentos);
    }
    catch (error) {
        console.error("Erro ao listar agendamentos:", error);
        res.status(500).json({ erro: "Erro interno ao listar agendamentos." });
    }
});
// DELETE /agendamentos/:id — Excluir um agendamento
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        // Verificar se o agendamento existe
        const agendamento = await agendamentoRepo().findOneBy({ id: Number(id) });
        if (!agendamento) {
            res.status(404).json({ erro: `Agendamento com id ${id} não encontrado.` });
            return;
        }
        // Excluir o agendamento
        await agendamentoRepo().delete({ id: Number(id) });
        console.log(`✅ Agendamento ${id} excluído do MySQL`);
        res.status(200).json({ mensagem: "Agendamento excluído com sucesso" });
    }
    catch (error) {
        console.error("Erro ao excluir agendamento:", error);
        res.status(500).json({ erro: "Erro interno ao excluir agendamento." });
    }
});
exports.default = router;
//# sourceMappingURL=agendamentoRoutes.js.map