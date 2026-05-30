"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../data-source");
const Cliente_1 = require("../entity/Cliente");
const router = (0, express_1.Router)();
const clienteRepo = () => data_source_1.AppDataSource.getRepository(Cliente_1.Cliente);
// POST /clientes — Cadastrar um novo cliente
router.post("/", async (req, res) => {
    try {
        const { nome, telefone, email } = req.body;
        // Validação básica
        if (!nome || !telefone || !email) {
            res.status(400).json({
                erro: "Os campos nome, telefone e email são obrigatórios.",
            });
            return;
        }
        // Normalizar telefone (deixar só os números, removendo (), espaços, etc)
        const telefoneNormalizado = telefone.replace(/\D/g, "");
        // VERIFICAÇÃO DE DUPLICIDADE (Avançada para pegar registros antigos com traços/espaços)
        const todosClientes = await clienteRepo().find();
        let clienteExistente = null;
        for (let c of todosClientes) {
            // Verifica se o telefone (apenas números) bate com o enviado
            const telBanco = (c.telefone || "").replace(/\D/g, "");
            if (telBanco === telefoneNormalizado) {
                clienteExistente = c;
                break;
            }
            // Se não achou por telefone, checa por e-mail (se o e-mail não for vazio)
            if (email && email.trim() !== "" && c.email === email.trim()) {
                clienteExistente = c;
                break;
            }
        }
        // Se a pessoa já existir no banco, a gente apenas devolve o cadastro
        if (clienteExistente) {
            res.status(200).json(clienteExistente);
            return;
        }
        // Se não existir, criamos um novo salvando o telefone limpo
        const cliente = clienteRepo().create({ nome, telefone: telefoneNormalizado, email: email.trim() });
        const resultado = await clienteRepo().save(cliente);
        res.status(201).json(resultado);
    }
    catch (error) {
        console.error("Erro ao cadastrar cliente:", error);
        res.status(500).json({ erro: "Erro interno ao cadastrar cliente." });
    }
});
// GET /clientes — Listar todos os clientes
router.get("/", async (_req, res) => {
    try {
        const clientes = await clienteRepo().find({
            relations: ["agendamentos"],
        });
        res.json(clientes);
    }
    catch (error) {
        console.error("Erro ao listar clientes:", error);
        res.status(500).json({ erro: "Erro interno ao listar clientes." });
    }
});
// GET /clientes/:id — Buscar cliente por ID
router.get("/:id", async (req, res) => {
    try {
        const cliente = await clienteRepo().findOne({
            where: { id: Number(req.params.id) },
            relations: ["agendamentos"],
        });
        if (!cliente) {
            res.status(404).json({ erro: "Cliente não encontrado." });
            return;
        }
        res.json(cliente);
    }
    catch (error) {
        console.error("Erro ao buscar cliente:", error);
        res.status(500).json({ erro: "Erro interno ao buscar cliente." });
    }
});
exports.default = router;
//# sourceMappingURL=clienteRoutes.js.map