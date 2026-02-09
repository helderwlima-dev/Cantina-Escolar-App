export interface Aluno {
  id: string;
  nome: string;
  turma: string;
  codigo?: string;
  saldo_atual: number;
  limite_diario: number;
  limite_mensal: number;
  permite_fiado: boolean;
  saldo_baixo_limite: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Produto {
  id: string;
  nome: string;
  preco: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ItemCarrinho extends Produto {
  quantidade: number;
}

export type VendaTipo = 'credito' | 'fiado';
export type VendaStatus = 'normal' | 'cancelada';

export interface Venda {
  id: string;
  id_aluno: string;
  data_hora: string;
  valor_total: number;
  tipo: VendaTipo;
  status: VendaStatus;
  usuario_criou?: string;
  created_at: string;
  updated_at: string;
  itens_venda: ItemVenda[];
}

export interface ItemVenda {
  id: string;
  id_venda: string;
  id_produto: string;
  quantidade: number;
  valor_unitario: number;
  created_at: string;
  updated_at: string;
  produtos?: Produto; // Used for joining product details
}

export interface Recarga {
  id: string;
  id_aluno: string;
  data_hora: string;
  valor: number;
  forma: string;
  usuario_criou?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  email: string;
}

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export type FormaPagamento = 'pix' | 'dinheiro' | 'cartao';
