"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const Cliente_1 = require("./entity/Cliente");
const Agendamento_1 = require("./entity/Agendamento");
const Servico_1 = require("./entity/Servico");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "Math@111",
    database: "ivonete_site",
    synchronize: true,
    logging: true,
    entities: [Cliente_1.Cliente, Agendamento_1.Agendamento, Servico_1.Servico],
});
//# sourceMappingURL=data-source.js.map