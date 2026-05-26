import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class Servico {
  @PrimaryColumn({ length: 50 })
  id: string;

  @Column({ length: 150 })
  nome: string;

  @Column({ type: "text", nullable: true })
  descricao: string;

  @Column({ length: 50 })
  duracao: string;

  @Column({ length: 50 })
  preco: string;

  @Column({ length: 20, default: "ativo" })
  status: string;
}
