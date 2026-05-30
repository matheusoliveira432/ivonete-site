import "reflect-metadata";
import express from "express";
import cors from "cors";
import path from "path";
import { AppDataSource } from "./data-source";
import clienteRoutes from "./routes/clienteRoutes";
import agendamentoRoutes from "./routes/agendamentoRoutes";
import servicoRoutes from "./routes/servicoRoutes";

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir pasta de uploads como estática
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rotas
app.use("/clientes", clienteRoutes);
app.use("/agendamentos", agendamentoRoutes);
app.use("/servicos", servicoRoutes);

// Rota de saúde
app.get("/", (_req, res) => {
  res.json({
    mensagem: "API Studio Ivonete rodando!",
    endpoints: {
      clientes: "POST /clientes | GET /clientes | GET /clientes/:id",
      agendamentos: "POST /agendamentos | GET /agendamentos",
      servicos: "POST /servicos | GET /servicos | DELETE /servicos/:id",
    },
  });
});


// Inicializar conexão e servidor
AppDataSource.initialize()
  .then(() => {
    console.log("✅ Banco de dados conectado com sucesso!");

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Erro ao conectar ao banco de dados:", error);
  });
