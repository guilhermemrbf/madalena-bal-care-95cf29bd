-- Enum for payment methods if needed, but we'll use text for flexibility
-- Enum for account types
CREATE TYPE public.account_type AS ENUM ('pagar', 'receber');
CREATE TYPE public.account_status AS ENUM ('pendente', 'pago', 'vencido');
CREATE TYPE public.entry_type AS ENUM ('entrada', 'saida');

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cod TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  cat TEXT NOT NULL,
  preco NUMERIC(12,2) NOT NULL DEFAULT 0,
  custo NUMERIC(12,2) NOT NULL DEFAULT 0,
  est INTEGER NOT NULL DEFAULT 0,
  min INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Clientes table
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  documento TEXT,
  nascimento DATE,
  endereco TEXT,
  observacoes TEXT,
  pontos INTEGER NOT NULL DEFAULT 0,
  total_gasto NUMERIC(12,2) NOT NULL DEFAULT 0,
  ultima_compra TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Fornecedores table
CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nif TEXT,
  telefone TEXT,
  email TEXT,
  contato TEXT,
  endereco TEXT,
  prazo_entrega INTEGER DEFAULT 0,
  observacoes TEXT,
  ultima_entrega TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data TIMESTAMP WITH TIME ZONE DEFAULT now(),
  pgto TEXT NOT NULL,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  desconto_geral NUMERIC(12,2) NOT NULL DEFAULT 0,
  desconto_geral_tipo TEXT NOT NULL DEFAULT '%',
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  cliente_nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sale Items table
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  cod TEXT NOT NULL,
  nome TEXT NOT NULL,
  preco NUMERIC(12,2) NOT NULL,
  qty INTEGER NOT NULL,
  desconto NUMERIC(12,2) NOT NULL DEFAULT 0,
  desconto_tipo TEXT NOT NULL DEFAULT '%'
);

-- Financeiro (Lancamentos) table
CREATE TABLE public.financeiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data TIMESTAMP WITH TIME ZONE DEFAULT now(),
  descricao TEXT NOT NULL,
  tipo entry_type NOT NULL,
  categoria TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Contas (Pagar/Receber) table
CREATE TABLE public.contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor TEXT,
  cliente TEXT,
  descricao TEXT NOT NULL,
  vencimento DATE NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  status account_status NOT NULL DEFAULT 'pendente',
  tipo account_type NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Lotes and Expiry table
CREATE TABLE public.lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  fornecedor TEXT NOT NULL,
  lote TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  validade DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;

-- Create Policies (All authenticated users can read/write, admins can delete)
-- We use a simple approach first: all authenticated users can manage their data
-- but we can restrict delete if needed. For now, let's allow everything for authenticated users.

CREATE POLICY "Allow authenticated users to manage products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to manage clientes" ON public.clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to manage fornecedores" ON public.fornecedores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to manage sales" ON public.sales FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to manage sale_items" ON public.sale_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to manage financeiro" ON public.financeiro FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to manage contas" ON public.contas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to manage lotes" ON public.lotes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contas_updated_at BEFORE UPDATE ON public.contas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
