import type { Product, Service, Appointment, ServiceOrder, Sale, Banner } from '@/types'

const IPHONE_IMG = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80'
const IPHONE2_IMG = 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&q=80'
const SAMSUNG_IMG = 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80'
const ANDROID_IMG = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'
const CASE_IMG = 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80'
const CHARGER_IMG = 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80'
const AIRPODS_IMG = 'https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?w=600&q=80'
const SPEAKER_IMG = 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80'
const ACC_IMG = 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80'

export const mockProducts: Product[] = [
  // ── iPhones ──
  {
    id: '1', name: 'iPhone 15 Pro Max 256GB Titânio', slug: 'iphone-15-pro-max',
    description: 'Titânio resistente. Chip A17 Pro. Câmera de 48MP com zoom óptico 5x. Bateria 29h de vídeo.',
    price: 9499, stock_qty: 3, category: 'iphone', brand: 'Apple', condition: 'lacrado',
    images: [IPHONE_IMG, IPHONE2_IMG], is_featured: true, is_active: true,
    specs: { Tela: '6.7" Super Retina XDR ProMotion', Chip: 'A17 Pro', Armazenamento: '256GB', Câmera: '48MP Triple + LiDAR', Bateria: '4422 mAh', '5G': 'Sim' },
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2', name: 'iPhone 15 Pro 128GB Titânio Natural', slug: 'iphone-15-pro',
    description: 'Design em titânio grau aeroespacial. Botão de Ação personalizável. USB-C com velocidades Pro.',
    price: 8299, stock_qty: 4, category: 'iphone', brand: 'Apple', condition: 'lacrado',
    images: [IPHONE2_IMG, IPHONE_IMG], is_featured: true, is_active: true,
    specs: { Tela: '6.1" Super Retina XDR ProMotion', Chip: 'A17 Pro', Armazenamento: '128GB', Câmera: '48MP Triple + LiDAR', Bateria: '3274 mAh', '5G': 'Sim' },
    created_at: '2024-01-14T10:00:00Z',
  },
  {
    id: '3', name: 'iPhone 15 128GB Preto', slug: 'iphone-15',
    description: 'Dynamic Island. Câmera principal de 48MP. Design em alumínio com USB-C.',
    price: 5499, promo_price: 4999, stock_qty: 6, category: 'iphone', brand: 'Apple', condition: 'lacrado',
    images: [IPHONE_IMG], is_featured: true, is_active: true,
    specs: { Tela: '6.1" Super Retina XDR', Chip: 'A16 Bionic', Armazenamento: '128GB', Câmera: '48MP Dual', Bateria: '3349 mAh', '5G': 'Sim' },
    created_at: '2024-01-13T10:00:00Z',
  },
  {
    id: '4', name: 'iPhone 14 Pro Max 256GB Roxo Intenso', slug: 'iphone-14-pro-max',
    description: 'Dynamic Island revolucionário. Always-On Display. Câmera Pro de 48MP. Seminovo em perfeito estado.',
    price: 6799, promo_price: 5999, stock_qty: 2, category: 'iphone', brand: 'Apple', condition: 'seminovo',
    images: [IPHONE2_IMG, IPHONE_IMG], is_featured: true, is_active: true,
    specs: { Tela: '6.7" Super Retina XDR ProMotion', Chip: 'A16 Bionic', Armazenamento: '256GB', Câmera: '48MP Triple + LiDAR', Bateria: '4323 mAh', '5G': 'Sim' },
    created_at: '2024-01-12T10:00:00Z',
  },
  {
    id: '5', name: 'iPhone 14 128GB Azul — Bateria Original Trocada', slug: 'iphone-14',
    description: 'Bateria 100% original Apple trocada em assistência certificada. Garantia 90 dias.',
    price: 4299, promo_price: 3899, stock_qty: 7, category: 'iphone', brand: 'Apple', condition: 'seminovo',
    images: [IPHONE_IMG, IPHONE2_IMG], is_featured: true, is_active: true,
    specs: { Tela: '6.1" Super Retina XDR', Chip: 'A15 Bionic', Armazenamento: '128GB', Câmera: '12MP Dual', Bateria: '100% (trocada)' },
    created_at: '2024-01-10T10:00:00Z',
  },
  {
    id: '6', name: 'iPhone 13 Pro 256GB Verde Alpino', slug: 'iphone-13-pro',
    description: 'Câmera Pro com zoom macro. ProMotion 120Hz. Chip A15 Bionic. Ótimo estado.',
    price: 4299, stock_qty: 3, category: 'iphone', brand: 'Apple', condition: 'seminovo',
    images: [IPHONE2_IMG], is_featured: false, is_active: true,
    specs: { Tela: '6.1" Super Retina XDR ProMotion', Chip: 'A15 Bionic', Armazenamento: '256GB', Câmera: '12MP Triple + Macro', Bateria: '3095 mAh' },
    created_at: '2024-01-09T10:00:00Z',
  },
  {
    id: '7', name: 'iPhone 13 128GB Meia-Noite', slug: 'iphone-13',
    description: 'O queridinho do custo-benefício. Chip A15 Bionic rápido, câmera Dual de 12MP.',
    price: 2799, stock_qty: 8, category: 'iphone', brand: 'Apple', condition: 'seminovo',
    images: [IPHONE_IMG], is_featured: false, is_active: true,
    specs: { Tela: '6.1" Super Retina XDR', Chip: 'A15 Bionic', Armazenamento: '128GB', Câmera: '12MP Dual', Bateria: '3227 mAh' },
    created_at: '2024-01-08T10:00:00Z',
  },
  {
    id: '8', name: 'iPhone 12 64GB Branco — De Vitrine', slug: 'iphone-12',
    description: 'Aparelho de vitrine, zero arranhão. Design flat icônico, 5G, chip A14 Bionic.',
    price: 2199, stock_qty: 4, category: 'iphone', brand: 'Apple', condition: 'seminovo',
    images: [IPHONE2_IMG], is_featured: false, is_active: true,
    specs: { Tela: '6.1" Super Retina XDR', Chip: 'A14 Bionic', Armazenamento: '64GB', Câmera: '12MP Dual', Bateria: '2815 mAh', '5G': 'Sim' },
    created_at: '2024-01-07T10:00:00Z',
  },
  {
    id: '9', name: 'iPhone SE 3ª Geração 128GB Vermelho Product RED', slug: 'iphone-se-3',
    description: 'O iPhone mais acessível com 5G e chip A15 Bionic. Novo lacrado.',
    price: 2999, stock_qty: 5, category: 'iphone', brand: 'Apple', condition: 'lacrado',
    images: [IPHONE_IMG], is_featured: false, is_active: true,
    specs: { Tela: '4.7" Retina HD', Chip: 'A15 Bionic', Armazenamento: '128GB', Câmera: '12MP', Bateria: 'Até 15h vídeo', '5G': 'Sim' },
    created_at: '2024-01-06T10:00:00Z',
  },
  {
    id: '10', name: 'iPhone 11 64GB Preto — Com Garantia Apple', slug: 'iphone-11',
    description: 'Ainda coberto pela garantia Apple. Câmera Dual, Face ID, chip A13 Bionic.',
    price: 1599, promo_price: 1399, stock_qty: 3, category: 'iphone', brand: 'Apple', condition: 'seminovo',
    images: [IPHONE2_IMG], is_featured: false, is_active: true,
    specs: { Tela: '6.1" Liquid Retina', Chip: 'A13 Bionic', Armazenamento: '64GB', Câmera: '12MP Dual', Bateria: '3110 mAh' },
    created_at: '2024-01-05T10:00:00Z',
  },

  // ── Android ──
  {
    id: '11', name: 'Samsung Galaxy S24 Ultra 256GB Titânio Preto', slug: 'samsung-galaxy-s24-ultra',
    description: 'Galaxy AI integrada. S Pen incluída. Câmera de 200MP. O Android mais poderoso.',
    price: 7299, stock_qty: 2, category: 'android', brand: 'Samsung', condition: 'lacrado',
    images: [SAMSUNG_IMG, ANDROID_IMG], is_featured: true, is_active: true,
    specs: { Tela: '6.8" Dynamic AMOLED 2X 120Hz', Chip: 'Snapdragon 8 Gen 3', Armazenamento: '256GB', Câmera: '200MP Quad', Bateria: '5000 mAh', '5G': 'Sim' },
    created_at: '2024-02-01T10:00:00Z',
  },
  {
    id: '12', name: 'Samsung Galaxy S23 FE 128GB Lavanda', slug: 'samsung-galaxy-s23-fe',
    description: 'Fan Edition com câmera de 50MP e processador Snapdragon 8 Gen 1. Ótimo custo-benefício.',
    price: 2999, stock_qty: 5, category: 'android', brand: 'Samsung', condition: 'novo',
    images: [SAMSUNG_IMG], is_featured: false, is_active: true,
    specs: { Tela: '6.4" Dynamic AMOLED 120Hz', Chip: 'Snapdragon 8 Gen 1', Armazenamento: '128GB', Câmera: '50MP Triple', Bateria: '4500 mAh', '5G': 'Sim' },
    created_at: '2024-01-30T10:00:00Z',
  },
  {
    id: '13', name: 'Samsung Galaxy A54 5G 256GB Preto Incrível', slug: 'samsung-galaxy-a54',
    description: 'Câmera OIS de 50MP, tela Super AMOLED 120Hz, bateria 5000mAh. Novo lacrado.',
    price: 1999, stock_qty: 8, category: 'android', brand: 'Samsung', condition: 'novo',
    images: [ANDROID_IMG], is_featured: false, is_active: true,
    specs: { Tela: '6.4" Super AMOLED 120Hz', Chip: 'Exynos 1380', Armazenamento: '256GB', Câmera: '50MP Triple OIS', Bateria: '5000 mAh', '5G': 'Sim' },
    created_at: '2024-01-28T10:00:00Z',
  },
  {
    id: '14', name: 'Motorola Edge 40 Pro 256GB Lunar Blue', slug: 'motorola-edge-40-pro',
    description: 'Câmera de 50MP com OIS, carregamento TurboPower 125W. Lacrado nacional.',
    price: 3499, stock_qty: 3, category: 'android', brand: 'Motorola', condition: 'lacrado',
    images: [ANDROID_IMG, SAMSUNG_IMG], is_featured: false, is_active: true,
    specs: { Tela: '6.67" pOLED 165Hz', Chip: 'Snapdragon 8 Gen 2', Armazenamento: '256GB', Câmera: '50MP Triple OIS', Bateria: '4600 mAh + TurboPower 125W', '5G': 'Sim' },
    created_at: '2024-01-25T10:00:00Z',
  },

  // ── Acessórios ──
  {
    id: '15', name: 'AirPods Pro 2ª Geração — Cancelamento Ativo Ruído', slug: 'airpods-pro-2',
    description: 'Cancelamento ativo de ruído 2x mais eficiente. Audio Adaptativo. Case com carregamento MagSafe.',
    price: 1899, stock_qty: 6, category: 'acessorio', brand: 'Apple', condition: 'lacrado',
    images: [AIRPODS_IMG], is_featured: true, is_active: true,
    specs: { Chip: 'H2', 'Cancelamento': 'Ativo Adaptativo', 'Bateria AirPods': 'Até 6h', 'Bateria Total': 'Até 30h', Case: 'MagSafe + USB-C' },
    created_at: '2024-02-05T10:00:00Z',
  },
  {
    id: '16', name: 'AirPods 3ª Geração Spatial Audio', slug: 'airpods-3',
    description: 'Áudio espacial personalizado. Design contour fit. Resistência a suor e água IPX4.',
    price: 1299, promo_price: 1099, stock_qty: 4, category: 'acessorio', brand: 'Apple', condition: 'lacrado',
    images: [AIRPODS_IMG], is_featured: false, is_active: true,
    specs: { Chip: 'H1', 'Áudio': 'Espacial Personalizado', 'Bateria AirPods': 'Até 6h', 'Bateria Total': 'Até 30h', Resistência: 'IPX4' },
    created_at: '2024-02-03T10:00:00Z',
  },
  {
    id: '17', name: 'Carregador Apple 20W USB-C Original — Entrada Rápida', slug: 'carregador-apple-20w',
    description: 'Carregamento rápido original Apple. Compatível com iPhone 8 ou superior e iPad.',
    price: 199, stock_qty: 20, category: 'carregador', brand: 'Apple', condition: 'novo',
    images: [CHARGER_IMG], is_featured: false, is_active: true,
    specs: { Potência: '20W', Entrada: 'USB-C', Compatível: 'iPhone 8+, iPad, AirPods Pro', Cabo: 'Não incluso' },
    created_at: '2024-02-06T10:00:00Z',
  },
  {
    id: '18', name: 'Carregador MagSafe 15W Original Apple', slug: 'carregador-magsafe-15w',
    description: 'Carregamento magnético sem fio até 15W. Alinha perfeitamente ao iPhone.',
    price: 379, stock_qty: 12, category: 'carregador', brand: 'Apple', condition: 'novo',
    images: [CHARGER_IMG], is_featured: false, is_active: true,
    specs: { Potência: '15W', Conexão: 'MagSafe Magnético', Compatível: 'iPhone 12 ou superior', Cabo: 'USB-C 1m incluso' },
    created_at: '2024-02-05T10:00:00Z',
  },
  {
    id: '19', name: 'Cabo Apple USB-C para Lightning 1m — Original', slug: 'cabo-usb-c-lightning',
    description: 'Cabo original Apple com certificação MFi. Carregamento rápido até 20W.',
    price: 129, stock_qty: 30, category: 'carregador', brand: 'Apple', condition: 'novo',
    images: [CHARGER_IMG], is_featured: false, is_active: true,
    specs: { Comprimento: '1 metro', Conexão: 'USB-C → Lightning', Certificação: 'MFi Apple', Compatível: 'iPhone/iPad/iPod' },
    created_at: '2024-02-04T10:00:00Z',
  },
  {
    id: '20', name: 'Carregador Anker Nano 65W USB-C GaN', slug: 'carregador-anker-65w',
    description: 'Tecnologia GaN compacta. 65W em apenas uma porta USB-C. Carrega MacBook, iPad e iPhone.',
    price: 249, stock_qty: 15, category: 'carregador', brand: 'Anker', condition: 'novo',
    images: [CHARGER_IMG], is_featured: false, is_active: true,
    specs: { Potência: '65W', Tecnologia: 'GaN III', Portas: '1x USB-C', Compatível: 'iPhone, iPad, MacBook, Android' },
    created_at: '2024-02-03T10:00:00Z',
  },
  {
    id: '21', name: 'Capinha MagSafe Silicone iPhone 15 Pro — Storm Blue', slug: 'capinha-magsafe-iphone-15-pro',
    description: 'Capinha original Apple em silicone premium com MagSafe integrado. Toque aveludado.',
    price: 149, promo_price: 119, stock_qty: 18, category: 'capinha', brand: 'Apple', condition: 'novo',
    images: [CASE_IMG], is_featured: false, is_active: true,
    specs: { Compatível: 'iPhone 15 Pro', Material: 'Silicone Líquido', Proteção: 'MagSafe', Cor: 'Storm Blue' },
    created_at: '2024-01-20T10:00:00Z',
  },
  {
    id: '22', name: 'Capinha Couro Premium iPhone 14 Pro — Marrom Sépia', slug: 'capinha-couro-iphone-14-pro',
    description: 'Couro legítimo tratado. Forrado internamente. Fica mais bonita com o tempo de uso.',
    price: 199, stock_qty: 10, category: 'capinha', brand: 'Apple', condition: 'novo',
    images: [CASE_IMG], is_featured: false, is_active: true,
    specs: { Compatível: 'iPhone 14 Pro', Material: 'Couro legítimo', Interior: 'Microfibra', Cor: 'Marrom Sépia' },
    created_at: '2024-01-19T10:00:00Z',
  },
  {
    id: '23', name: 'Capinha Transparente Blindada Anti-Impacto iPhone 13/14', slug: 'capinha-transparente-anti-impacto',
    description: 'Proteção militar MIL-STD-810G. Bordas de TPU reforçadas, costas em policarbonato rígido.',
    price: 79, stock_qty: 25, category: 'capinha', brand: 'Genérico', condition: 'novo',
    images: [CASE_IMG], is_featured: false, is_active: true,
    specs: { Compatível: 'iPhone 13 e 14', Proteção: 'MIL-STD-810G', Material: 'TPU + Policarbonato', Cor: 'Transparente' },
    created_at: '2024-01-18T10:00:00Z',
  },
  {
    id: '24', name: 'Película 3D Privacidade Full Cover Anti-Espiões', slug: 'pelicula-3d-privacidade',
    description: 'Filtro anti-espiões 60°. Vidro temperado 9H. Cobre bordas curvas. Pack com 2 unidades.',
    price: 59, stock_qty: 40, category: 'pelicula', brand: 'Genérico', condition: 'novo',
    images: [ACC_IMG], is_featured: false, is_active: true,
    specs: { Tipo: 'Vidro temperado 3D', Filtro: 'Anti-spy 60°', Dureza: '9H', Compatível: 'iPhone 12/13/14', Pacote: '2 unidades' },
    created_at: '2024-01-25T10:00:00Z',
  },
  {
    id: '25', name: 'Película Vidro Temperado 9H Anti-Risco iPhone 15', slug: 'pelicula-vidro-iphone-15',
    description: 'Vidro temperado 0.33mm, dureza 9H. Instalação fácil com guia de moldura. Pack 2un.',
    price: 39, stock_qty: 60, category: 'pelicula', brand: 'Genérico', condition: 'novo',
    images: [ACC_IMG], is_featured: false, is_active: true,
    specs: { Espessura: '0.33mm', Dureza: '9H', Compatível: 'iPhone 15', Transmissão: '99.9% luz', Pacote: '2 unidades + aplicador' },
    created_at: '2024-01-24T10:00:00Z',
  },
  {
    id: '26', name: 'Caixa de Som JBL Go 3 — À Prova D\'água IPX67', slug: 'jbl-go-3',
    description: 'Caixa compacta com som potente. IPX67 — pode ser submersa. 5h de bateria. Mosquetão incluso.',
    price: 299, promo_price: 259, stock_qty: 8, category: 'acessorio', brand: 'JBL', condition: 'novo',
    images: [SPEAKER_IMG], is_featured: true, is_active: true,
    specs: { Potência: '4.2W RMS', Bateria: '5h', 'À Prova D\'água': 'IPX67', Conexão: 'Bluetooth 5.1', Peso: '209g' },
    created_at: '2024-02-08T10:00:00Z',
  },
  {
    id: '27', name: 'Power Bank Anker 10000mAh USB-C — Carregamento Rápido', slug: 'power-bank-anker-10000',
    description: '10000mAh com saída USB-C 20W e USB-A 18W. Carrega iPhone do 0 a 100% 2,5 vezes.',
    price: 289, stock_qty: 10, category: 'acessorio', brand: 'Anker', condition: 'novo',
    images: [CHARGER_IMG], is_featured: false, is_active: true,
    specs: { Capacidade: '10000 mAh', 'Saída USB-C': '20W', 'Saída USB-A': '18W', Recargas: '2.5x iPhone 15', Peso: '228g' },
    created_at: '2024-02-07T10:00:00Z',
  },
  {
    id: '28', name: 'Suporte Veicular MagSafe para Painel — Anker', slug: 'suporte-veicular-magsafe',
    description: 'Fixação magnética perfeita no carro. 360° de rotação. Compatível com todos os iPhones MagSafe.',
    price: 189, stock_qty: 12, category: 'acessorio', brand: 'Anker', condition: 'novo',
    images: [ACC_IMG], is_featured: false, is_active: true,
    specs: { Fixação: 'Painel/Ar-condicionado', Rotação: '360°', Compatível: 'iPhone 12 ou superior + MagSafe', Carga: 'Não carrega' },
    created_at: '2024-02-06T10:00:00Z',
  },
  {
    id: '29', name: 'Samsung Galaxy Buds2 Pro Graphite — Cancelamento de Ruído', slug: 'samsung-buds2-pro',
    description: 'ANC inteligente de 3 mics. Áudio 360°. Resistência IPX7. Conector de pescoço ergonômico.',
    price: 799, promo_price: 699, stock_qty: 5, category: 'acessorio', brand: 'Samsung', condition: 'novo',
    images: [AIRPODS_IMG], is_featured: false, is_active: true,
    specs: { ANC: '3 microfones', Áudio: '360° Audio', Bateria: '5h + 18h (case)', Resistência: 'IPX7', Conexão: 'Bluetooth 5.3' },
    created_at: '2024-02-04T10:00:00Z',
  },
  {
    id: '30', name: 'Kit Película + Capinha iPhone 14 — Proteção Completa', slug: 'kit-pelicula-capinha-iphone-14',
    description: 'Combo completo: película 9H + capinha anti-impacto. Proteção total por R$ 79.',
    price: 99, promo_price: 79, stock_qty: 20, category: 'capinha', brand: 'Genérico', condition: 'novo',
    images: [CASE_IMG, ACC_IMG], is_featured: false, is_active: true,
    specs: { Inclui: 'Capinha TPU + Película 9H', Compatível: 'iPhone 14', Proteção: 'Anti-queda + Anti-risco' },
    created_at: '2024-01-17T10:00:00Z',
  },
]

export const mockServices: Service[] = [
  { id: '1', name: 'Troca de Tela', description: 'Substituição completa do display original. Garantia de 90 dias na peça e serviço.', price_from: 249, duration_minutes: 60, is_active: true, icon: 'Monitor' },
  { id: '2', name: 'Troca de Bateria', description: 'Bateria original ou compatível certificada. Recupere a autonomia total do seu aparelho.', price_from: 149, duration_minutes: 45, is_active: true, icon: 'Battery' },
  { id: '3', name: 'Reparo de Conector', description: 'Troca do conector de carregamento Lightning ou USB-C com garantia.', price_from: 129, duration_minutes: 60, is_active: true, icon: 'Plug' },
  { id: '4', name: 'Desbloqueio de Celular', description: 'Desbloqueio de operadora e iCloud. Verificamos viabilidade antes de cobrar.', price_from: 99, duration_minutes: 30, is_active: true, icon: 'Unlock' },
  { id: '5', name: 'Recuperação de Dados', description: 'Recuperamos fotos, contatos e arquivos de aparelhos danificados, molhados ou quebrados.', price_from: 199, duration_minutes: 120, is_active: true, icon: 'HardDrive' },
  { id: '6', name: 'Reparo de Placa', description: 'Microssoldagem especializada. Recuperamos placas-mãe com danos por queda e água.', price_from: 299, duration_minutes: 180, is_active: true, icon: 'Cpu' },
  { id: '7', name: 'Higienização Completa', description: 'Limpeza profissional interna e externa com ultrassom. Aparelho como novo.', price_from: 59, duration_minutes: 30, is_active: true, icon: 'Sparkles' },
  { id: '8', name: 'Troca de Câmera', description: 'Substituição de câmera frontal ou traseira com peça original.', price_from: 199, duration_minutes: 60, is_active: true, icon: 'Camera' },
]

export const mockBanners: Banner[] = [
  { id: '1', title: 'iPhone 15 Pro Max', subtitle: 'Titânio. Desempenho Pro. O mais avançado da Apple. Lacrado com garantia.', image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1200&q=80', badge: 'Lançamento', cta_text: 'Ver produto', cta_href: '/produto/iphone-15-pro-max', is_active: true, order: 1 },
  { id: '2', title: 'AirPods Pro 2ª Geração', subtitle: 'Cancelamento de ruído 2x mais eficiente. Áudio Espacial. MagSafe incluso.', image_url: 'https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?w=1200&q=80', badge: 'Em Estoque', cta_text: 'Comprar agora', cta_href: '/produto/airpods-pro-2', is_active: true, order: 2 },
  { id: '3', title: 'Assistência Técnica', subtitle: 'Troca de tela, bateria, conector e muito mais. Garantia de 90 dias.', image_url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&q=80', badge: 'Qualidade', cta_text: 'Agendar serviço', cta_href: '/agendar', is_active: true, order: 3 },
  { id: '4', title: 'iPhone 14 — Promoção', subtitle: 'Seminovo em perfeito estado. Bateria trocada com garantia Apple. A partir de R$ 3.899.', image_url: 'https://images.unsplash.com/photo-1676380488707-3f4d97cd3efe?w=1200&q=80', badge: 'Oferta', cta_text: 'Aproveitar', cta_href: '/produto/iphone-14', is_active: true, order: 4 },
  { id: '5', title: 'Galaxy S24 Ultra', subtitle: 'Galaxy AI + S Pen. Câmera 200MP. O Android mais poderoso disponível.', image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=1200&q=80', badge: 'Lacrado', cta_text: 'Ver produto', cta_href: '/produto/samsung-galaxy-s24-ultra', is_active: true, order: 5 },
]

export const mockAppointments: Appointment[] = [
  { id: '1', customer_name: 'João Silva', customer_phone: '(11) 99999-1111', service_id: '1', service_name: 'Troca de Tela', device_info: 'iPhone 13', problem: 'Tela trincada após queda', scheduled_at: '2024-06-10T09:00:00Z', status: 'confirmado', created_at: '2024-06-05T10:00:00Z' },
  { id: '2', customer_name: 'Maria Oliveira', customer_phone: '(11) 99999-2222', service_id: '2', service_name: 'Troca de Bateria', device_info: 'iPhone 12', problem: 'Bateria não dura nem 2 horas', scheduled_at: '2024-06-10T11:00:00Z', status: 'pendente', created_at: '2024-06-06T10:00:00Z' },
  { id: '3', customer_name: 'Carlos Mendes', customer_phone: '(11) 99999-3333', service_id: '3', service_name: 'Reparo de Conector', device_info: 'Samsung S23', problem: 'Não carrega mais', scheduled_at: '2024-06-11T14:00:00Z', status: 'pendente', created_at: '2024-06-07T10:00:00Z' },
  { id: '4', customer_name: 'Ana Costa', customer_phone: '(11) 99999-4444', service_id: '5', service_name: 'Recuperação de Dados', device_info: 'iPhone 14 Pro', problem: 'Caiu na água e não liga', scheduled_at: '2024-06-12T10:00:00Z', status: 'pendente', created_at: '2024-06-08T09:00:00Z' },
]

export const mockServiceOrders: ServiceOrder[] = [
  { id: 'OS001', customer_name: 'João Silva', customer_phone: '(11) 99999-1111', device_brand: 'Apple', device_model: 'iPhone 13', problem: 'Tela trincada', diagnosis: 'Display danificado — troca completa necessária', price: 349, status: 'em_reparo', created_at: '2024-06-05T10:00:00Z', updated_at: '2024-06-06T14:00:00Z' },
  { id: 'OS002', customer_name: 'Ana Costa', customer_phone: '(11) 99999-4444', device_brand: 'Samsung', device_model: 'Galaxy A54', problem: 'Não liga', diagnosis: 'Bateria completamente danificada', price: 189, status: 'pronto', created_at: '2024-06-04T09:00:00Z', updated_at: '2024-06-05T16:00:00Z' },
  { id: 'OS003', customer_name: 'Pedro Santos', customer_phone: '(11) 99999-5555', device_brand: 'Apple', device_model: 'iPhone 14 Pro', problem: 'Câmera traseira não funciona', diagnosis: undefined, price: undefined, status: 'em_analise', created_at: '2024-06-07T11:00:00Z', updated_at: '2024-06-07T11:00:00Z' },
  { id: 'OS004', customer_name: 'Lucia Ferreira', customer_phone: '(11) 99999-6666', device_brand: 'Motorola', device_model: 'Moto G84', problem: 'Tela piscando', diagnosis: 'Conector do display com mau contato', price: 129, status: 'recebido', created_at: '2024-06-08T08:00:00Z', updated_at: '2024-06-08T08:00:00Z' },
  { id: 'OS005', customer_name: 'Roberto Lima', customer_phone: '(11) 99999-7777', device_brand: 'Apple', device_model: 'iPhone 15 Pro', problem: 'Botão lateral não funciona', diagnosis: 'Botão físico danificado', price: 199, status: 'aguardando_peca', created_at: '2024-06-09T10:00:00Z', updated_at: '2024-06-09T15:00:00Z' },
]

export const mockSales: Sale[] = [
  { id: 'VD001', items: [{ product_id: '5', product_name: 'iPhone 14 128GB', quantity: 1, unit_price: 3899 }], total: 3899, payment_method: 'pix', customer_name: 'Roberto Lima', customer_phone: '(11) 99999-7777', created_at: '2024-06-07T14:00:00Z' },
  { id: 'VD002', items: [{ product_id: '21', product_name: 'Capinha MagSafe', quantity: 2, unit_price: 119 }], total: 238, payment_method: 'cartao_credito', customer_name: 'Fernanda Souza', created_at: '2024-06-07T16:00:00Z' },
  { id: 'VD003', items: [{ product_id: '18', product_name: 'Carregador MagSafe 15W', quantity: 1, unit_price: 379 }], total: 379, payment_method: 'dinheiro', created_at: '2024-06-08T10:00:00Z' },
  { id: 'VD004', items: [{ product_id: '15', product_name: 'AirPods Pro 2ª Gen', quantity: 1, unit_price: 1899 }], total: 1899, payment_method: 'pix', customer_name: 'Marcos Alves', created_at: '2024-06-08T14:00:00Z' },
  { id: 'VD005', items: [{ product_id: '7', product_name: 'iPhone 13 128GB', quantity: 1, unit_price: 2799 }], total: 2799, payment_method: 'cartao_credito', customer_name: 'Patricia Gomes', created_at: '2024-06-09T11:00:00Z' },
]
