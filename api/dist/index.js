"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const data_source_1 = require("./data-source");
const clienteRoutes_1 = __importDefault(require("./routes/clienteRoutes"));
const agendamentoRoutes_1 = __importDefault(require("./routes/agendamentoRoutes"));
const servicoRoutes_1 = __importDefault(require("./routes/servicoRoutes"));
const app = (0, express_1.default)();
const PORT = 3001;
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Servir pasta de uploads como estática
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
// Rotas
app.use("/clientes", clienteRoutes_1.default);
app.use("/agendamentos", agendamentoRoutes_1.default);
app.use("/servicos", servicoRoutes_1.default);
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
data_source_1.AppDataSource.initialize()
    .then(() => {
    console.log("✅ Banco de dados conectado com sucesso!");
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    });
})
    .catch((error) => {
    console.error("❌ Erro ao conectar ao banco de dados:", error);
});
//# sourceMappingURL=index.js.map