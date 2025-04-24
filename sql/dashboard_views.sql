-- View para vendas com detalhes do cliente
CREATE OR REPLACE VIEW vw_vendas_dashboard AS
SELECT 
  v.id,
  v.empresa_id,
  v.numero_venda,
  v.valor_total,
  v.valor_final,
  v.forma_pagamento,
  v.created_at,
  v.status,
  c.nome as cliente_nome
FROM vendas v
LEFT JOIN clientes c ON v.cliente_id = c.id;

-- View para produtos mais vendidos
CREATE OR REPLACE VIEW vw_produtos_mais_vendidos AS
SELECT 
  p.id,
  p.empresa_id,
  p.nome,
  p.codigo,
  SUM(vi.quantidade) as quantidade_total,
  SUM(vi.subtotal) as valor_total,
  v.created_at as data_venda
FROM vendas_itens vi
JOIN produtos p ON vi.produto_id = p.id
JOIN vendas v ON vi.venda_id = v.id
GROUP BY p.id, p.empresa_id, p.nome, p.codigo, v.created_at;

-- View para clientes destaque
CREATE OR REPLACE VIEW vw_clientes_destaque AS
SELECT 
  c.id,
  c.empresa_id,
  c.nome,
  COUNT(v.id) as total_compras,
  SUM(v.valor_final) as valor_total,
  MAX(v.created_at) as ultima_compra
FROM clientes c
JOIN vendas v ON v.cliente_id = c.id
GROUP BY c.id, c.empresa_id, c.nome;

-- View para resumo de vendas por período
CREATE OR REPLACE VIEW vw_resumo_vendas_periodo AS
SELECT 
  empresa_id,
  DATE_TRUNC('day', created_at) as data,
  COUNT(*) as total_vendas,
  SUM(valor_final) as valor_total,
  AVG(valor_final) as ticket_medio
FROM vendas
GROUP BY empresa_id, DATE_TRUNC('day', created_at);

-- View para resumo de vendas por forma de pagamento
CREATE OR REPLACE VIEW vw_vendas_por_pagamento AS
SELECT 
  empresa_id,
  DATE_TRUNC('month', created_at) as mes,
  forma_pagamento,
  COUNT(*) as total_vendas,
  SUM(valor_final) as valor_total
FROM vendas
GROUP BY empresa_id, DATE_TRUNC('month', created_at), forma_pagamento;

-- View para produtos com estoque baixo
CREATE OR REPLACE VIEW vw_produtos_estoque_baixo AS
SELECT 
  id,
  empresa_id,
  nome,
  codigo,
  estoque,
  estoque_minimo,
  (estoque_minimo - estoque) as diferenca
FROM produtos
WHERE estoque < estoque_minimo;

-- View para evolução de vendas diárias
CREATE OR REPLACE VIEW vw_evolucao_vendas_diarias AS
SELECT 
  empresa_id,
  DATE_TRUNC('day', created_at) as data,
  COUNT(*) as total_vendas,
  SUM(valor_final) as valor_total
FROM vendas
GROUP BY empresa_id, DATE_TRUNC('day', created_at)
ORDER BY DATE_TRUNC('day', created_at); 