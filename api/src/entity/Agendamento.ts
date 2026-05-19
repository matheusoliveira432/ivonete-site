import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Cliente } from "./Cliente";

@Entity()
export class Agendamento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "datetime" })
  dataHora: Date;

  @Column({ length: 100 })
  servico: string;

  @ManyToOne(() => Cliente, (cliente) => cliente.agendamentos, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "clienteId" })
  cliente: Cliente;

  @Column()
  clienteId: number;
}
