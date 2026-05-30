import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Servico } from "../entity/Servico";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();
const servicoRepo = () => AppDataSource.getRepository(Servico);

// Configuração do Multer para upload de imagens
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas (jpg, png, gif, webp)"));
    }
  },
});

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

// POST /servicos/upload — Upload de imagem de serviço
router.post(
  "/upload",
  upload.single("imagem"),
  (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ erro: "Nenhum arquivo enviado." });
        return;
      }

      const filePath = `uploads/${req.file.filename}`;
      console.log("✅ Imagem salva:", filePath);
      res.json({ imagem: filePath });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      res.status(500).json({ erro: "Erro interno ao fazer upload." });
    }
  }
);

// POST /servicos — Criar ou atualizar um serviço
router.post("/", async (req: Request, res: Response) => {
  try {
    const { id, nome, descricao, duracao, preco, status, imagem } = req.body;

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
      imagem: imagem || null,
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

    // Se o serviço tem imagem, remover o arquivo
    if (servico.imagem) {
      const imagePath = path.join(__dirname, "../..", servico.imagem);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log("🗑️ Imagem removida:", servico.imagem);
      }
    }

    await servicoRepo().remove(servico);
    res.json({ mensagem: "Serviço excluído com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir serviço:", error);
    res.status(500).json({ erro: "Erro interno ao excluir serviço." });
  }
});

export default router;
