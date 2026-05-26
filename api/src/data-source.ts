import "reflect-metadata";
import { DataSource } from "typeorm";
import { Cliente } from "./entity/Cliente";
import { Agendamento } from "./entity/Agendamento";
import { Servico } from "./entity/Servico";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "Math@111",
  database: "ivonete_site",
  synchronize: true,
  logging: true,
  entities: [Cliente, Agendamento, Servico],
});

