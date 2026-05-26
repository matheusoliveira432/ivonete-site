import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Servico } from "../entity/Servico";

const router = Router();
const servicoRepo = () => AppDataSource.getRepository(Servico);

// GET /servicos — Listar todos os serviços
router.get("/", async (_req: Request, res: Response) => {
  try {
    const servicos = await servicoRepo().find();
    res.json(servicos);
  } catch (error) {
    console.error("Erro ao listar serviços:", error);
    res.status(500).json({ erro: "Erro interno ao listar serviços." });
  }
});

// POST /servicos — Criar ou atualizar um serviço
router.post("/", async (req: Request, res: Response) => {
  try {
    const { id, nome, descricao, duracao, preco, status } = req.body;

    if (!id || !nome) {
      res.status(400).json({ erro: "ID e Nome do serviço são obrigatórios." });
      return;
    }

    const servico = servicoRepo().create({
      id,
      nome,
      descricao,
      duracao,
      preco,
      status: status || "ativo",
    });

    const resultado = await servicoRepo().save(servico);
    res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao salvar serviço:", error);
    res.status(500).json({ erro: "Erro interno ao salvar serviço." });
  }
});

// DELETE /servicos/:id — Excluir um serviço
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const servico = await servicoRepo().findOne({ where: { id } });

    if (!servico) {
      res.status(404).json({ erro: "Serviço não encontrado." });
      return;
    }

    await servicoRepo().remove(servico);
    res.json({ mensagem: "Serviço excluído com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir serviço:", error);
    res.status(500).json({ erro: "Erro interno ao excluir serviço." });
  }
});

export default router;
