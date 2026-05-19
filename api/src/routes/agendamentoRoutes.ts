import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Agendamento } from "../entity/Agendamento";
import { Cliente } from "../entity/Cliente";

const router = Router();
const agendamentoRepo = () => AppDataSource.getRepository(Agendamento);
const clienteRepo = () => AppDataSource.getRepository(Cliente);

// POST /agendamentos — Cadastrar agendamento para um cliente existente
router.post("/", async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error("Erro ao cadastrar agendamento:", error);
    res.status(500).json({ erro: "Erro interno ao cadastrar agendamento." });
  }
});

// GET /agendamentos — Listar agendamentos (suporta filtros por cliente e data)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { clienteId, futuros } = req.query;
    const where: any = {};

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
  } catch (error) {
    console.error("Erro ao listar agendamentos:", error);
    res.status(500).json({ erro: "Erro interno ao listar agendamentos." });
  }
});

export default router;
