-- ═══════════════════════════════════════════════════════════════════
-- SEED — 20 produtos de exemplo para UMA loja da plataforma
-- ───────────────────────────────────────────────────────────────────
-- Multi-tenant: resolve o store_id (UUID) pelo SLUG da loja já provisionada.
-- NÃO mexe em RLS (no SQL Editor o role do dashboard já ignora RLS).
-- Sem vazamento de marca ("M CELL"): produtos genéricos white-label.
--
-- COMO USAR:
--   1. Provisione a loja no /superadmin (gera o slug).
--   2. Troque o slug na linha v_slug abaixo.
--   3. Cole tudo no Supabase → SQL Editor → New query → Run.
-- ═══════════════════════════════════════════════════════════════════

do $$
declare
  v_slug  text := 'COLOQUE_O_SLUG_DA_LOJA_AQUI';   -- ← troque pelo slug real
  v_store uuid;
begin
  select id into v_store from stores where slug = v_slug;
  if v_store is null then
    raise exception
      'Loja "%" não encontrada. Provisione a loja no /superadmin antes de rodar o seed.', v_slug;
  end if;

  -- Remove produtos de um seed anterior desta MESMA loja (evita duplicatas).
  delete from products where store_id = v_store;

  insert into products
    (store_id, name, slug, description, price, promo_price, stock_qty,
     category, brand, condition, images, is_featured, is_active, specs)
  values

  -- 01 ── iPhone 13 Pro Max
  (v_store,
   'iPhone 13 Pro Max 256GB Sierra Azul',
   'iphone-13-pro-max-256-sierra-azul',
   'Seminovo em excelente estado. Chip A15 Bionic, câmera Pro de 12MP com zoom óptico 3x, tela ProMotion 120Hz de 6.7". Acompanha carregador, cabo e nota fiscal.',
   3299.00, NULL, 2,
   'iphone', 'Apple', 'seminovo',
   ARRAY[
     'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80',
     'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&q=80'
   ],
   true, true,
   '{"Tela":"6.7\" Super Retina XDR ProMotion 120Hz","Chip":"A15 Bionic","Armazenamento":"256GB","Câmera":"12MP Triple + LiDAR","Bateria":"4352 mAh","5G":"Sim","Condição":"Seminovo — excelente estado"}'),

  -- 02 ── iPhone 15 Pro Max
  (v_store,
   'iPhone 15 Pro Max 256GB Titânio Natural',
   'iphone-15-pro-max-256-titanio-natural',
   'Lacrado nacional com nota fiscal. Titânio grau aeroespacial. Chip A17 Pro. Câmera 48MP com zoom óptico 5x. USB-C com velocidades Pro. Bateria de até 29h de vídeo.',
   8999.00, 8499.00, 3,
   'iphone', 'Apple', 'lacrado',
   ARRAY[
     'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80',
     'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80'
   ],
   true, true,
   '{"Tela":"6.7\" Super Retina XDR ProMotion 120Hz","Chip":"A17 Pro","Armazenamento":"256GB","Câmera":"48MP Triple + LiDAR + Zoom 5x","Bateria":"4422 mAh — até 29h vídeo","5G":"Sim","Conector":"USB-C"}'),

  -- 03 ── iPhone 16 Pro Max
  (v_store,
   'iPhone 16 Pro Max 256GB Titânio Deserto',
   'iphone-16-pro-max-256-titanio-deserto',
   'O iPhone mais avançado da Apple. Chip A18 Pro, câmera 48MP com zoom óptico 5x, tela maior de 6.9" com ProMotion 120Hz, Camera Control button, suporte a Apple Intelligence.',
   10999.00, NULL, 2,
   'iphone', 'Apple', 'lacrado',
   ARRAY[
     'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80',
     'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&q=80'
   ],
   true, true,
   '{"Tela":"6.9\" Super Retina XDR ProMotion 120Hz","Chip":"A18 Pro","Armazenamento":"256GB","Câmera":"48MP Triple + Tetraprism + Zoom 5x","Bateria":"Até 33h de vídeo","5G":"Sim","Novidade":"Camera Control + Apple Intelligence"}'),

  -- 04 ── Samsung Galaxy S24 Ultra
  (v_store,
   'Samsung Galaxy S24 Ultra 256GB Titanium Black',
   'samsung-galaxy-s24-ultra-256-titanium-black',
   'Câmera de 200MP com zoom óptico 10x. S Pen integrada. Galaxy AI para produtividade. Processador Snapdragon 8 Gen 3. Tela Dynamic AMOLED 2X 120Hz.',
   6499.00, 5999.00, 2,
   'android', 'Samsung', 'lacrado',
   ARRAY[
     'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80',
     'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'
   ],
   true, true,
   '{"Tela":"6.8\" Dynamic AMOLED 2X 120Hz","Chip":"Snapdragon 8 Gen 3","Armazenamento":"256GB","Câmera":"200MP Quad — Zoom 10x","Bateria":"5000 mAh","5G":"Sim","Extra":"S Pen + Galaxy AI"}'),

  -- 05 ── Samsung Galaxy A55 5G
  (v_store,
   'Samsung Galaxy A55 5G 128GB Icy Blue',
   'samsung-galaxy-a55-5g-128-icy-blue',
   'Design premium com vidro e metal. Câmera OIS de 50MP, tela Super AMOLED 120Hz, bateria 5000mAh com carregamento 25W. Lacrado com garantia Samsung.',
   1999.00, NULL, 5,
   'android', 'Samsung', 'lacrado',
   ARRAY[
     'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
     'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80'
   ],
   false, true,
   '{"Tela":"6.6\" Super AMOLED 120Hz","Chip":"Exynos 1480","Armazenamento":"128GB","Câmera":"50MP Triple OIS","Bateria":"5000 mAh — Carregamento 25W","5G":"Sim"}'),

  -- 06 ── Motorola Edge 50 Pro
  (v_store,
   'Motorola Edge 50 Pro 256GB Azul Infinito',
   'motorola-edge-50-pro-256-azul-infinito',
   'Câmera de 50MP com OIS e estabilização de vídeo avançada. Tela pOLED de 6.7" com 144Hz. Carregamento TurboPower 125W. Resistência IP68. Lacrado nacional.',
   2299.00, NULL, 3,
   'android', 'Motorola', 'lacrado',
   ARRAY[
     'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&q=80',
     'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'
   ],
   false, true,
   '{"Tela":"6.7\" pOLED 144Hz","Chip":"Snapdragon 7s Gen 2","Armazenamento":"256GB","Câmera":"50MP Triple OIS","Bateria":"4500 mAh — TurboPower 125W","Resistência":"IP68","5G":"Sim"}'),

  -- 07 ── AirPods Pro 2ª Geração
  (v_store,
   'AirPods Pro 2ª Geração com MagSafe',
   'airpods-pro-2-geracao-magsafe',
   'Cancelamento ativo de ruído 2x mais eficiente. Áudio Adaptativo. Modo de Transparência Conversational. Case com carregamento MagSafe, Lightning e Apple Watch.',
   1799.00, 1649.00, 4,
   'acessorio', 'Apple', 'lacrado',
   ARRAY[
     'https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?w=600&q=80',
     'https://images.unsplash.com/photo-1600294037681-c80ece25c0f2?w=600&q=80'
   ],
   true, true,
   '{"Chip":"H2","Cancelamento":"ANC Adaptativo — 2x mais eficiente","Bateria AirPods":"Até 6h (ANC ativo)","Bateria Total":"Até 30h com case","Case":"MagSafe + Lightning + Apple Watch","Resistência":"IPX4"}'),

  -- 08 ── AirPods 4
  (v_store,
   'AirPods 4 com Cancelamento de Ruído',
   'airpods-4-cancelamento-ruido',
   'Novo design repaginado. Cancelamento ativo de ruído pela primeira vez na linha AirPods. Chip H2, áudio espacial personalizado, case com USB-C.',
   1399.00, NULL, 3,
   'acessorio', 'Apple', 'lacrado',
   ARRAY[
     'https://images.unsplash.com/photo-1600294037681-c80ece25c0f2?w=600&q=80',
     'https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?w=600&q=80'
   ],
   false, true,
   '{"Chip":"H2","Cancelamento":"ANC — estreia na linha AirPods padrão","Bateria AirPods":"Até 5h (ANC ativo)","Bateria Total":"Até 30h com case","Case":"USB-C","Áudio":"Espacial personalizado"}'),

  -- 09 ── JBL Flip 7
  (v_store,
   'JBL Flip 7 Caixa de Som Bluetooth',
   'jbl-flip-7-caixa-de-som-bluetooth',
   'Som potente de 30W com dois tweeter e woofer. À prova d''água IP67. 12h de bateria. Conecte até 2 fontes de áudio simultaneamente via Auracast.',
   699.00, NULL, 5,
   'acessorio', 'JBL', 'lacrado',
   ARRAY[
     'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80',
     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'
   ],
   true, true,
   '{"Potência":"30W RMS","Bateria":"12 horas","Resistência":"IP67 — à prova de água","Conexão":"Bluetooth 5.3 — Auracast","Peso":"540g","Extra":"PartyBoost — conecte vários JBLs"}'),

  -- 10 ── JBL Go 4
  (v_store,
   'JBL Go 4 Caixa de Som Portátil',
   'jbl-go-4-caixa-de-som-portatil',
   'Ultra-compacta com som JBL Pro. À prova d''água e poeira IP67. 7h de bateria. Mosquetão de fácil transporte. Perfeita para viagens.',
   299.00, NULL, 8,
   'acessorio', 'JBL', 'lacrado',
   ARRAY[
     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
     'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80'
   ],
   false, true,
   '{"Potência":"4.2W RMS","Bateria":"7 horas","Resistência":"IP67 — à prova de água","Conexão":"Bluetooth 5.3","Peso":"209g","Extra":"Mosquetão incluso"}'),

  -- 11 ── Samsung Galaxy Buds3 Pro
  (v_store,
   'Samsung Galaxy Buds3 Pro Titânio',
   'samsung-galaxy-buds3-pro-titanio',
   'Design blade premium. Cancelamento ativo de ruído inteligente. Áudio Hi-Fi 24bit. Integração Galaxy AI para tradução em tempo real. Resistência IPX7.',
   999.00, 849.00, 4,
   'acessorio', 'Samsung', 'lacrado',
   ARRAY[
     'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80',
     'https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?w=600&q=80'
   ],
   false, true,
   '{"Cancelamento":"ANC inteligente 3 mics","Áudio":"Hi-Fi 24bit","Bateria":"6h + 21h (case)","Resistência":"IPX7","Conexão":"Bluetooth 5.4","Extra":"Galaxy AI — tradução em tempo real"}'),

  -- 12 ── Suporte Veicular MagSafe
  (v_store,
   'Suporte Veicular Magnético MagSafe para Painel',
   'suporte-veicular-magnetico-magsafe',
   'Fixação magnética MagSafe perfeita. 360° de rotação. Encaixe no painel ou saída de ar. Compatível com iPhone 12 ou superior com MagSafe.',
   79.00, NULL, 15,
   'acessorio', 'Anker', 'novo',
   ARRAY[
     'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=600&q=80'
   ],
   false, true,
   '{"Fixação":"Painel ou saída de ar","Rotação":"360°","Compatível":"iPhone 12 ou superior — MagSafe","Material":"Liga de alumínio + silicone"}'),

  -- 13 ── Serviço Troca de Tela (marca neutra — white-label)
  (v_store,
   'Serviço: Troca de Tela iPhone — Peça Original',
   'servico-troca-tela-iphone-original',
   'Substituição completa do display com peça original ou OLED certificado. Garantia de 90 dias na peça e no serviço. Orçamento via WhatsApp antes de qualquer cobrança.',
   399.00, NULL, 10,
   'acessorio', '', 'novo',
   ARRAY[
     'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&q=80'
   ],
   false, true,
   '{"Tempo estimado":"1 a 2 horas","Garantia":"90 dias — peça e serviço","Peça":"Original ou OLED certificado","Preço a partir de":"R$ 399 (consulte seu modelo)","Pagamento":"Pix, débito ou crédito"}'),

  -- 14 ── Carregador Apple 20W
  (v_store,
   'Carregador Apple 20W USB-C Original',
   'carregador-apple-20w-usb-c-original',
   'Carregamento rápido original Apple de 20W. Compatível com iPhone 8 ou superior, iPad e AirPods Pro. Exige cabo USB-C para Lightning (vendido separado).',
   149.00, NULL, 20,
   'carregador', 'Apple', 'lacrado',
   ARRAY[
     'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80'
   ],
   false, true,
   '{"Potência":"20W","Entrada":"USB-C","Compatível":"iPhone 8+, iPad, AirPods Pro","Cabo":"Não incluso — compre separado","Certificação":"Original Apple"}'),

  -- 15 ── Carregador Samsung 45W
  (v_store,
   'Carregador Samsung 45W Super Fast Charging 2.0',
   'carregador-samsung-45w-super-fast-charging',
   'Carregamento ultra-rápido 45W. Compatível com Galaxy S23, S24, Note e linha A premium. Cabo USB-C incluso. Carga de 0 a 70% em apenas 30 minutos.',
   189.00, NULL, 15,
   'carregador', 'Samsung', 'lacrado',
   ARRAY[
     'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80',
     'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80'
   ],
   false, true,
   '{"Potência":"45W Super Fast Charging 2.0","Entrada":"USB-C","Compatível":"Galaxy S21+, S22+, S23+, S24 Ultra e mais","Cabo":"USB-C incluso","Carga":"0 → 70% em 30 min"}'),

  -- 16 ── Cabo USB-C para Lightning
  (v_store,
   'Cabo Apple USB-C para Lightning 1m — Original MFi',
   'cabo-apple-usb-c-lightning-1m-original',
   'Cabo original Apple certificado MFi. Carregamento rápido até 20W. Compatível com todos os iPhones Lightning, iPad e iPod. Trançado reforçado contra dobras.',
   99.00, NULL, 30,
   'carregador', 'Apple', 'novo',
   ARRAY[
     'https://images.unsplash.com/photo-1601972602237-8c79241e468b?w=600&q=80',
     'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80'
   ],
   false, true,
   '{"Comprimento":"1 metro","Conexão":"USB-C para Lightning","Certificação":"MFi — Made for iPhone","Carga Rápida":"Até 20W","Compatível":"iPhone 5 ao 14, iPad, iPod"}'),

  -- 17 ── Power Bank Anker 20000mAh
  (v_store,
   'Power Bank Anker 20000mAh USB-C 22.5W',
   'power-bank-anker-20000mah-usb-c',
   'Enorme capacidade de 20000mAh. Carrega iPhone 15 Pro Max mais de 4 vezes. Saída USB-C de 22.5W e duas portas USB-A. Indicador LED de bateria. Ideal para viagens longas.',
   219.00, NULL, 10,
   'carregador', 'Anker', 'novo',
   ARRAY[
     'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&q=80',
     'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80'
   ],
   false, true,
   '{"Capacidade":"20000 mAh","Saída USB-C":"22.5W","Saídas USB-A":"2x portas (18W total)","Recargas":"4x iPhone 15 Pro Max","Indicador":"LED nível de bateria","Peso":"440g"}'),

  -- 18 ── Capinha Apple MagSafe Silicone
  (v_store,
   'Capinha Apple MagSafe Silicone iPhone 15 Pro Max',
   'capinha-apple-magsafe-silicone-iphone-15-pro-max',
   'Capinha original Apple. Silicone líquido premium com toque aveludado. MagSafe integrado para acessórios magnéticos. Interior em microfibra que não arranha.',
   149.00, NULL, 12,
   'capinha', 'Apple', 'novo',
   ARRAY[
     'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80',
     'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&q=80'
   ],
   false, true,
   '{"Compatível":"iPhone 15 Pro Max","Material":"Silicone líquido premium","Interior":"Microfibra — não arranha","MagSafe":"Sim — compatível com todos acessórios","Certificação":"Original Apple"}'),

  -- 19 ── Capinha Spigen Tough Armor
  (v_store,
   'Capinha Spigen Tough Armor iPhone 16 Pro Max',
   'capinha-spigen-tough-armor-iphone-16-pro-max',
   'Proteção militar MIL-STD-810G. Dupla camada TPU + policarbonato. Suporte para MagSafe. Kickstand integrado para assistir vídeos. Testada contra quedas de 3 metros.',
   79.00, NULL, 20,
   'capinha', 'Spigen', 'novo',
   ARRAY[
     'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&q=80',
     'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80'
   ],
   false, true,
   '{"Compatível":"iPhone 16 Pro Max","Proteção":"MIL-STD-810G — Queda de 3m","Material":"TPU + Policarbonato reforçado","Kickstand":"Sim — integrado","MagSafe":"Compatível"}'),

  -- 20 ── Película 3D Privacidade
  (v_store,
   'Película 3D Privacidade iPhone 15 e 16 Pro Max',
   'pelicula-3d-privacidade-iphone-15-16-pro-max',
   'Vidro temperado 9H de 0.33mm. Filtro anti-espiões 60°: tela visível somente ao usuário. Cobre bordas curvas 3D. Pack com 2 unidades + aplicador com moldura.',
   49.00, NULL, 40,
   'pelicula', 'Genérico', 'novo',
   ARRAY[
     'https://images.unsplash.com/photo-1516876437184-593fda40c7ce?w=600&q=80'
   ],
   false, true,
   '{"Compatível":"iPhone 15 Pro Max e 16 Pro Max","Tipo":"Vidro temperado 3D","Filtro Privacidade":"Anti-spy 60°","Dureza":"9H — anti-risco","Espessura":"0.33mm","Pacote":"2 unidades + aplicador com moldura"}');

  raise notice 'Seed concluído: % produtos inseridos para a loja "%".',
    (select count(*) from products where store_id = v_store), v_slug;
end $$;
