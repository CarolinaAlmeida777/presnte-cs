import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

const CONFIG = {
  herName: 'Matusca',

  mapLabel: 'A maior decisão da minha vida',

  

  readyTitle: 'O PEDIDO ESTÁ PRONTO!',

  question: 'ACEITA CASAR COMIGO?',

  finalMessage: 'VOCÊ DISSE SIM! 💍❤️',

  infoText:
    'Ao aceitar, você se compromete a completar essa partida até o fim da vida. ' +
    'Abandoná-la após aceitar pode gerar uma penalidade (Quebrar meu coração sempre).',

  ribbonText: 'SURPRESA CONCLUÍDA',

  heroLabel: 'NOSSA HISTÓRIA',

  heroSub: 'Eu sempre te amei e sempre vou te amar.',

  thirdLabel: 'DESDE O 1º ENCONTRO',

  heroPhoto: 'show.jpg',

  thirdPhoto: 'shopping.jpg',

  photos: [
    'copa.jpg',
    'anonovo.jpg',
    'carro.jpg'
  ],

finalPhoto: 'proposta.jpg',

  bannerSub: 'A próxima é hoje',

  carouselTitle: 'MOMENTOS ESPECIAIS',

  carouselSub: 'Alguns dos nossos melhores momentos ❤️',

  thirdPrice: '♥'
};

type Stage = 'idle' | 'searching' | 'found' | 'video' | 'thanks';

type Page = 'home' | 'inventory' | 'news' | 'shop' | 'equipment';

type Side = 'ct' | 't';

// um espaço do equipamento (foto, nome e cor da barrinha de baixo)
interface EquipSlot {
  image?: string;     // nome do arquivo em assets/photos (sem image = espaço vazio)
  title?: string;
  rarity?: Rarity;    // gray, blue, purple, pink, red ou gold
  noBar?: boolean;    // true = sem barrinha de raridade (como o spray do jogo)
  noZoom?: boolean;   // true = clicar não abre a foto grande (ícones pequenos)
  isKit?: boolean;    // true = é o espaço do kit de música (mostra o álbum equipado)
}

interface EquipGroup {
  title: string;      // título pequeno em cima dos espaços
  slots: EquipSlot[];
}

interface EquipColumn {
  groups: EquipGroup[];
}


interface NewsItem {
  date: string;       // aparece em cima do título
  title: string;
  text: string;
  image: string;      // nome do arquivo em assets/photos
}

// presente do bloco de cima da loja (só dá para escolher um)
interface ShopGift {
  image: string;      // nome do arquivo em assets/photos
  title: string;
}

// item do bloco "Novidades e populares"
interface ShopItem {
  image: string;      // nome do arquivo em assets/photos
  title: string;
  price: string;      // texto livre: '100 beijos', '3 abraços'...
  isNew?: boolean;    // mostra a etiqueta laranja NOVO!
  tag?: string;       // etiqueta amarela no canto da foto (opcional)
}

type Rarity = 'gray' | 'blue' | 'purple' | 'pink' | 'red' | 'gold';

interface InventoryItem {
  photo: string;      // nome do arquivo em assets/photos
  title: string;
  subtitle: string;
  rarity: Rarity;
}

// prêmio que pode sair de uma caixa
interface CaseReward {
  title: string;
  message: string;
  rarity: Rarity;
  photo?: string;     // opcional: foto em assets/photos
}

interface CaseItem {
  title: string;
  subtitle: string;
  image: string;      // imagem da caixa em assets/photos
  rewardImage: string; // imagem dos prêmios na roleta (assets/photos)
  rewards: CaseReward[];
}

// álbum (kit de música): dá para equipar e toca um trecho da música
interface MusicKit {
  title: string;      // nome do álbum
  artist: string;     // artista
  cover: string;      // capa do álbum (arquivo em assets/photos)
  audio: string;      // a música em mp3 (arquivo em assets/audio)
  start?: number;     // segundo em que o trecho começa (padrão 0)
  length?: number;    // quantos segundos o trecho toca (padrão 20)
  rarity: Rarity;     // cor da barrinha de baixo
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements AfterViewInit, OnDestroy {

  

  @ViewChild('bgVideo')
  bgVideo!: ElementRef<HTMLVideoElement>;

  @ViewChild('reelView')
  reelView?: ElementRef<HTMLElement>;

  config = CONFIG;

  stage: Stage = 'idle';

  clock = '00:00';

  activePhoto = 0;

  friendSlots = [1, 2];

  friendsOpen = false;

  fecharFoto(): void {
  this.stage = 'idle';
}

  // ---------- TV (música) ----------
  tvOpen = false;
  tvTitle = 'SUA MÚSICA';          // troque pelo nome da música, se quiser
  tvVideoId = 'az8IGbNj4sg';
  tvLink = 'https://www.youtube.com/watch?v=az8IGbNj4sg';
  tvUrl: SafeResourceUrl | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  toggleTv(): void {
    this.tvOpen ? this.closeTv() : this.openTv();
  }

  openTv(): void {
    this.stopKit();   // não toca por cima do álbum
    this.tvUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${this.tvVideoId}?autoplay=1&rel=0`
    );
    this.tvOpen = true;
  }

  // fechar destrói o player e, com isso, para a música
  closeTv(): void {
    this.tvOpen = false;
    this.tvUrl = null;
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.tvOpen) this.closeTv();
  }

  page: Page = 'home';

  sortOrder: 'new' | 'old' = 'new';
  selectedItem: InventoryItem | null = null;

  // A lista vai do mais novo para o mais antigo. Troque pelas suas fotos.
  inventoryItems: InventoryItem[] = [
    { photo: 'medalhaazul.jpg',   title: 'Medalha de melhor namorada do mundo',    subtitle: '', rarity: 'gold' },
    { photo: 'medalhaverde.jpg',   title: 'Medalha de melhor beijo do mundo',    subtitle: ' ', rarity: 'gold' },
    { photo: 'pipo.jpg',     title: 'Pipo querido ⭐',     subtitle: '', rarity: 'gold' },
    { photo: 'papagaio.jpg',     title: 'Papagaio',     subtitle: '', rarity: 'gold' },
    { photo: 'lica.jpg',     title: 'Liquilda',     subtitle: '', rarity: 'gold' },
    { photo: 'pipos.jpg',     title: 'Galera',     subtitle: '', rarity: 'gold' },
    { photo: 'nico.jpg',     title: 'Nico',     subtitle: '', rarity: 'gold' },
    { photo: 'jade.jpg',     title: 'Jade',     subtitle: '', rarity: 'gold' },
    { photo: 'show.jpg',     title: 'Show',     subtitle: 'Nosso momento', rarity: 'gold' },
    { photo: 'shopping.jpg', title: 'Primeiros encontros', subtitle: 'Passeio', rarity: 'blue' },
    { photo: 'copa.jpg',     title: 'Copa',     subtitle: 'Torcendo juntos', rarity: 'purple' },
    { photo: '1.jpg',    title: 'Em casa',    subtitle: 'De preguiça', rarity: 'gold' },
    { photo: '2.jpg',    title: 'Mais Shopping',    subtitle: 'Passeio', rarity: 'gold' },
    { photo: '3.jpg',    title: 'Copa',    subtitle: 'Torcendo juntos', rarity: 'purple' },
    { photo: '4.jpg',    title: 'CNH',    subtitle: 'Primeira volta', rarity: 'gray' },
    { photo: '5.jpg',    title: 'Ano Novo',    subtitle: 'Comemoração', rarity: 'purple' },
    { photo: '6.jpg',    title: 'Pós almoço',    subtitle: 'Barriga cheia', rarity: 'blue' },
    { photo: '7.jpg',    title: 'Casa da Maria',    subtitle: 'Escada', rarity: 'purple' },
    { photo: '8.jpg',    title: 'Show',    subtitle: 'Nosso momento', rarity: 'blue' },
    { photo: '9.jpg',    title: 'Casa da Maria',    subtitle: 'Uma das melhores lembranças', rarity: 'gold' },
    { photo: '10.jpg',   title: 'Melhor beijo do Mundo',    subtitle: 'Lar', rarity: 'purple' },
  ];

  // ---------- CAIXAS ----------
  // Troque os títulos e as mensagens pelas suas.
  // Quanto mais rara a cor, mais difícil de sair (gray é a mais comum, gold a mais rara).
  cases: CaseItem[] = [
    {
      title: 'Caixa de Surpresas',
      subtitle: 'Toque para abrir',
      image: 'caixaroxacs.jpg',
      rewardImage: 'ticket.jpg',
      rewards: [
        { title: 'Vale abraço apertado',     rarity: 'gray',   message: 'Válido a qualquer hora, sem perguntar o motivo. Dura até você soltar.' },
        { title: 'Vale carinho infinito',              rarity: 'gray',   message: 'Aquele carinho que você adora, com direito ouvir musica juntas.' },
        { title: 'Vale escolher o filme',    rarity: 'blue',   message: 'Você escolhe o filme e eu prometo não reclamar.' },
        { title: 'Vale café da manhã',       rarity: 'blue',   message: 'Café da manhã na cama, preparado por mim (com muito carinho e pouca habilidade).' },
        { title: 'Vale jantar a dois',       rarity: 'purple', message: 'Você escolhe o lugar. Eu só levo a fome e o meu melhor sorriso.' },
        { title: 'Vale massagem',            rarity: 'pink',   message: '30 minutos de massagem, sem pressa e sem celular.' },
        { title: 'Vale chocolate',       rarity: 'red',    message: 'Vale caixa de Sneakers surpresa, com direito a escolher o sabor que você mais gosta.' }
      ]
    },
    {
      title: 'Caixa de Cartinhas',
      subtitle: 'Toque para abrir',
      image: 'caixapretacs.jpg',
      rewardImage: 'carta.jpg',
      rewards: [
        { title: 'Meu rio corre para ti', rarity: 'purple', message: 'Meu Rio corre para ti —\nAzul Mar! Vai me acolher?\n\nMeu Rio espera resposta —\nÓ Mar — olha para mim com bondade —\n\nEu te trarei Riachos\nDe recantos salpicados —\nDiz — Mar — Leva-me!\n\n— Emily Dickinson' },
        { title: 'Sempre te amei', rarity: 'blue', message: 'Que sempre te amei\nTrago-te a Prova:\nQue até amar-te\nEu não vivi — Bastou —\n\nQue sempre te amarei\nTe provo:\nQue amor é vida —\nE a vida tem Imortalidade —\n\nIsto — duvidas — Doce —\nEntão nada tenho\nA mostrar\nSenão o Calvário —\n\n— Emily Dickinson' },
        { title: 'Vem devagar, Éden', rarity: 'purple', message: 'Vem devagar — Éden!\nLábios não habituados a Ti —\nTímidos — sorvem teus Jasmins —\nComo a Abelha desfalecida —\n\nQue alcança tarde sua flor,\nZumbe ao redor do quarto dela —\nConta seus néctares —\nEntra — e se perde nos Bálsamos.\n\n— Emily Dickinson' },
        { title: 'Noites selvagens', rarity: 'gold', message: 'Noites Selvagens — Noites Selvagens!\nEstivesse eu contigo\nNoites Selvagens seriam\nNosso luxo!\n\nInútil — os Ventos —\nPara um Coração no porto —\nSem mais a Bússola —\nSem mais a Carta!\n\nRemando no Éden —\nAh, o Mar!\nPudesse eu ancorar — Esta noite —\nEm Ti!\n\n— Emily Dickinson' }
      ]
    }
  ];

  openCase: CaseItem | null = null;
  reelImage = 'cai';
  reelCards: CaseReward[] = [];
  reelOffset = 0;
  reelTransition = 'none';
  reelSpinning = false;
  wonReward: CaseReward | null = null;

  readonly CARD_W = 156;      // largura de cada carta da roleta + margem
  readonly SPIN_MS = 6000;    // duração do giro

  private readonly RARITY_WEIGHT: Record<Rarity, number> = {
    gray: 25, blue: 30, purple: 15, pink: 10, red: 6, gold: 4
  };

  private winIndex = 38;
  private pendingReward: CaseReward | null = null;
  private reelTimer?: ReturnType<typeof setTimeout>;

  // ---------- NOTÍCIAS ----------
  // A primeira notícia da lista aparece em destaque (imagem grande).
  // Troque os textos e as imagens pelos seus.
  selectedNews: NewsItem | null = null;

  newsItems: NewsItem[] = [
    {
      date: 'Hoje',
      title: 'Pedido de casamento',
      image: 'anel.jpg',
      text: 'Hoje é o dia mais importante da minha vida, e eu quero que você seja a protagonista dessa história. Com todo o amor que sinto por você, faço este pedido: quer casar comigo? 💍❤️'
    },
    {
      date: '2023-08-25',
      title: 'Nova Temporada',
      image: 'ovo.jpg',
      text: 'Primeiro ano de namoro. Coloque o pé no acelerador e pise fundo no amor. Bem-vinda à temporada mais especial da nossa história, um modo com ritmo acelerado em 2x0: só eu e você. Participe da disputa de abraços enquanto avança por uma série de dias selecionados aleatoriamente. Aproveite ao máximo o tempo precioso para cumprir o objetivo: rir juntos todos os dias. Domine a maratona dos dias bons para vencer a partida. Como sempre, quem mais sorrir ganha o direito de escolher o jantar.'
    },
    {
      date: '2024-09-22',
      title: 'Torcida oficinal do SPFC ',
      image: 'spfc.jpg',
      text: ' Quando o amor ganha e te faz feliz, a gente enxerga até o que estava escondido em nossos corações!'
    },
    {
      date: '2026-06-28',
      title: 'Copa do Mundo: torcida oficial do casal',
      image: 'copa.jpg',
      text: 'Hoje lançamos o kit oficial de torcida do casal: uma camisa, um sofá e muita gritaria. Assim como nos jogos anteriores, 50% dos gritos são compartilhados entre os dois lados do sofá. O sistema de preços dinâmicos do lanche determinou o interesse relativo em pipoca e refrigerante. Confira as novas lembranças e apoie o seu time favorito!'
    },
    {
      date: '2025-04-11',
      title: 'Nova atualização: domingo de preguiça',
      image: '1.jpg',
      text: 'Apresentando-se para a Campanha Ativa: o sofá finalmente chegou, substituindo a academia no grupo das atividades do fim de semana. Coloque as suas velhas estratégias à prova e suba de nível no mais novo campo de batalha da casa. Saia daí, vai esquentar! Como antes, quem estiver muito perto da cozinha ganha o direito de buscar o lanche.'
    },
    {
      date: '2026-01-01',
      title: 'Ano Novo: fogos, abraço e um pedido',
      image: '5.jpg',
      text: 'A virada chegou com fogos, brinde e um pedido silencioso: mais um ano ao seu lado. Nenhuma promessa foi quebrada, e a lista de resoluções foi reduzida a uma só: continuar escolhendo você todos os dias.'
    }
  ];

  // ---------- LOJA ----------
  // Tudo que aparece na loja fica aqui. Troque as fotos, os nomes e os preços.
  shopTabs = ['GERAL'];   // só enfeite

  // bloco de cima (presentes)
  giftTitle = 'MIMO SEMANAL';
  giftRibbonPending = 'ESCOLHA UM PRESENTE';
  giftRibbonDone = 'PRESENTE RESGATADO';
  giftTextPending = 'Escolha um dos presentes ao lado. Só dá para levar um!';
  giftTextDone = 'Você receberá um novo presente na próxima vez que subir de nível.';
  giftProgress = 100;   // barra de progresso, de 0 a 100

  gifts: ShopGift[] = [
    { image: 'livro.jpg',    title: 'Livro Novembro de 63' },
    { image: 'perfume.jpg',   title: 'Trio Perfumado Flor de Cajueiro' },
    { image: 'chocolate.jpg', title: 'Caixa snickers ' },
    { image: 'jogo.jpg', title: 'Call of Duty: modern warfare 4' }
  ];

  private readonly GIFT_KEY = 'mimo_escolhido';

  // guarda qual presente foi escolhido (fica salvo no navegador)
  giftChosen: number | null = this.loadGift();

  // bloco do meio
  shopSectionTitle = 'NOVIDADES E\nPOPULARES';


  shopItems: ShopItem[] = [
    { image: 'vinil.jpg', title: 'Vinil Dangerous Woman',   price: '500 beijos', isNew: true },
    { image: 'bolsa.jpg', title: 'Bolsa da Bershka',  price: '120 beijos' },
    { image: 'camisa.jpg', title: 'Camiseta Furia',        price: '250 beijos' },
    { image: 'caixasom.jpg', title: 'Caixa de som personalizada',           price: '400 beijos',  },
    { image: 'baixo.jpg', title: 'Baixo dos sonhos',     price: '3.000 beijos', tag: 'RARO' },
  ];

  // bloco de baixo (banner)
  shopBanner = {
    title: 'NOSSA HISTÓRIA',
    images: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg'],
    caption: 'Central de lembranças do nosso relacionamento'
  };

  // ---------- EQUIPAMENTO ----------
  equipTitleLeft = 'CONTRATERRORISTAS';    // etiqueta azul
  equipTitleRight = 'TERRORISTAS';         // etiqueta dourada

  // animação do boneco dos Contra-Terroristas (arquivo em assets/photos)
  equipAnimLeft = 'ct-danca.webp';
  equipAnimRight = 't-danca.webp';
    // personagem que fica no meio da tela inicial (arquivo em assets/photos)
  homeChar = 'personagem-longa.webp';
    homeChar2 = 'personagem2.webp';   // a que fica ao lado e ao fundo

  // cartão do jogador (aparece entre os pés da personagem da frente)
  playerCard = {
    name: 'DETETIVE JUQUINHA',
    avatar: 'detetive.jpg',    // foto (assets/photos)
    coin: 'moeda-cs.png',      // moeda dourada (assets/photos)
    xp: 12                     // barra de progresso, de 0 a 100
  };
  // espaços ao lado do personagem, iguais ao jogo:
  // CT = agente, luvas, faca, Zeus, kit de música, moeda, spray
  // T  = agente, luvas, faca, Zeus, C4, kit de música, moeda, spray
  // Para trocar um ícone, mude o nome do arquivo em image (fica em assets/photos).
  equipSlotsLeft: EquipSlot[] = [
    { title: 'Agente',        image: 'eq_ct_agente.png', rarity: 'gray', noZoom: true },
    { title: 'Luvas',         image: 'eq_ct_luvas.png',  rarity: 'gray', noZoom: true },
    { title: 'Faca',          image: 'eq_ct_faca.png',   rarity: 'gray', noZoom: true },
    { title: 'Zeus x27',      image: 'eq_ct_zeus.png',   rarity: 'blue', noZoom: true },
    { title: 'Kit de música', image: 'eq_ct_kit.png',    rarity: 'gray', noZoom: true, isKit: true },
    { title: 'Moeda',         image: 'medalhaazul.jpg',  rarity: 'red' },
    { title: 'Spray',         image: 'eq_ct_spray.png',  noBar: true, noZoom: true }
  ];

  equipSlotsRight: EquipSlot[] = [
    { title: 'Agente',        image: 'eq_t_agente.png',  rarity: 'gray', noZoom: true },
    { title: 'Luvas',         image: 'eq_t_luvas.png',   rarity: 'gray', noZoom: true },
    { title: 'Faca',          image: 'eq_t_faca.png',    rarity: 'gray', noZoom: true },
    { title: 'Zeus x27',      image: 'eq_t_zeus.png',    rarity: 'blue', noZoom: true },
    { title: 'C4',            image: 'eq_t_c4.png',      rarity: 'gray', noZoom: true },
    { title: 'Kit de música', image: 'eq_t_kit.png',     rarity: 'gray', noZoom: true, isKit: true },
    { title: 'Moeda',         image: 'medalhaverde.jpg', rarity: 'red' },
    { title: 'Spray',         image: 'eq_t_spray.png',   noBar: true, noZoom: true }
  ];

  // as 3 colunas de "armas" do lado esquerdo
  equipColumns: EquipColumn[] = [
    {
      groups: [
        {
          title: 'PISTOLA INICIAL',
          slots: [
            { image: 'pistola0.jpg', title: 'Pistola inicial 1', rarity: 'gray' }
          ]
        },
        {
          title: 'OUTRAS PISTOLAS',
          slots: [
            { image: 'pistola1.jpg', title: 'Pistola 1', rarity: 'blue' },
            { image: 'pistola2.jpg', title: 'Pistola 2', rarity: 'purple' },
            { image: 'pistola3.jpg', title: 'Pistola 3', rarity: 'pink' },
            { image: 'pistola.jpg', title: 'Pistola 4', rarity: 'red' }
          ]
        }
      ]
    },
    {
      groups: [
        {
          title: 'INTERMEDIÁRIAS',
          slots: [
            { image: 'intermediaria0.jpg', title: 'Intermediária 1', rarity: 'purple' },
            { image: 'intermediaria2.jpg', title: 'Intermediária 2', rarity: 'gray' },
            { image: 'intermediaria3.jpg', title: 'Intermediária 3', rarity: 'blue' },
            { image: 'intermediaria4.jpg', title: 'Intermediária 4', rarity: 'purple' },
            { image: 'intermediaria5.jpg', title: 'Intermediária 5', rarity: 'pink' }
          ]
        }
      ]
    },
    {
      groups: [
        {
          title: 'RIFLES',
          slots: [
            { image: 'rifle1.jpg', title: 'Rifle 1', rarity: 'red' },
            { image: 'rifle2.jpg', title: 'Rifle 2', rarity: 'gold' },
            { image: 'rifle3.jpg', title: 'Rifle 3', rarity: 'gray' },
            { image: 'rifle4.jpg', title: 'Rifle 4', rarity: 'blue' },
            { image: 'rifle5.jpg', title: 'Rifle 5', rarity: 'purple' }
          ]
        }
      ]
    }
  ];

 

  // ---------- KITS DE MÚSICA (álbuns) ----------
  // Cada álbum aparece embaixo na tela de Equipamento. Ao clicar nele, ele entra no
  // espaço "Kit de música" e toca um trecho da música.
  //   cover  = capa do álbum (arquivo em src/assets/photos)
  //   audio  = a música em mp3 (arquivo em src/assets/audio)
  //   start  = segundo em que o trecho começa (padrão 0)
  //   length = quantos segundos o trecho toca (padrão 20)
  //   rarity = cor da barrinha de baixo (gray, blue, purple, pink, red ou gold)
  musicKits: MusicKit[] = [
    { title: 'Abstract', artist: 'Hozier', cover: '01_Hozier.png',     audio: 'Abstract.mp3', start: 30, length: 20, rarity: 'purple' },
    { title: 'Thinking Bout You', artist: 'Ariana Grande', cover: '07_Dangerous_Woman.png',     audio: 'THINKINGBOUTYOU.mp3', start: 30, length: 30, rarity: 'purple' },
    { title: 'Starting Line',       artist: 'Luke Hemmings', cover: '06_When_Facing_the_Things.png', audio: 'StartingLine.mp3',       start: 42, length: 30, rarity: 'blue' },
    { title: 'Madeline',       artist: 'jake is Lloyd', cover: '02_Madeline_Monsters.png', audio: 'Madeline.mp3',       start: 45, length: 30, rarity: 'blue' },
    { title: 'Shy Away',       artist: 'twenty one pilots ', cover: '03_Dragao_Azul.png', audio: 'ShyAway.mp3',       start: 30, length: 28, rarity: 'blue' },
    { title: 'Oldies Station',       artist: 'twenty one pilots', cover: '04_Capa_Vermelha.png', audio: 'OldiesStation.mp3',       start: 45, length: 30, rarity: 'blue' },
    { title: 'Dear God',       artist: 'Tate McRae', cover: '05_Retrato.png', audio: 'DearGod.mp3',       start: 45, length: 30, rarity: 'blue' },
    { title: 'Worth It For The Feeling',       artist: 'Rebecca Black', cover: '09_Worth_It_For_the_Feeling.png', audio: 'WorthItfortheFeeling.mp3',     start: 45, length: 30, rarity: 'blue' }
  ];

  equipItems: InventoryItem[] = [
    
    
  ];

  // álbum equipado em cada lado (null = ainda mostra o ícone padrão do jogo)
  equippedKit: Record<Side, MusicKit | null> = { ct: null, t: null };

  // álbum que está tocando agora
  playingKit: MusicKit | null = null;

  private kitAudio?: HTMLAudioElement;
  private kitTick?: ReturnType<typeof setInterval>;
  private readonly KIT_FADE = 1.5;   // segundos de fade-out no final do trecho

  friends = [
    { name: 'Matusca', status: 'Disponível', avatar: 'ned.jpg', online: true },
    { name: 'Detetive Juquinha',   status: 'Disponível', avatar: 'detetive.jpg', online: true },
  ];

  videoPath = '';

  private clockInterval?: ReturnType<typeof setInterval>;

  private searchInterval?: ReturnType<typeof setInterval>;

  private searchingSeconds = 0;


  // ============================================================
  // INICIALIZAÇÃO
  // ============================================================

  ngAfterViewInit(): void {

    this.startClock();

    // Garante que o vídeo de fundo tente tocar
    if (this.bgVideo?.nativeElement) {

      const video = this.bgVideo.nativeElement;

      video.muted = true;

      video.play().catch(() => {
        // Alguns navegadores bloqueiam autoplay.
      });
    }
  }


  // ============================================================
  // RELÓGIO
  // ============================================================

  private startClock(): void {

    this.updateClock();

    this.clockInterval = setInterval(() => {
      this.updateClock();
    }, 1000);
  }


  private updateClock(): void {

    const now = new Date();

    const hours = String(now.getHours()).padStart(2, '0');

    const minutes = String(now.getMinutes()).padStart(2, '0');

    const seconds = String(now.getSeconds()).padStart(2, '0');

    this.clock = `${hours}:${minutes}:${seconds}`;
  }


  // ============================================================
  // BOTÃO JOGAR
  // ============================================================

  onJogarClick(): void {

    this.page = 'home';

    this.stopKit();

    if (this.stage !== 'idle') {
      return;
    }

    this.stage = 'searching';

    this.searchingSeconds = 0;

    this.startSearching();
  }


  
private startSearching(): void {
  this.clearSearchingInterval();
  this.searchingSeconds = 0;
  this.stage = 'found';
}



  // ============================================================
  // TIMER DA BUSCA
  // ============================================================

  formatSearching(): string {

    const minutes = Math.floor(this.searchingSeconds / 60);

    const seconds = this.searchingSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }


  // ============================================================
  // ACEITAR PEDIDO
  // ============================================================

  onAceitar(): void {
  this.closeTv();
  this.stopKit();
  this.stage = 'thanks';
}


  


 



  // ============================================================
  // CARROSSEL
  // ============================================================

  nextPhoto(): void {

    if (!this.config.photos.length) {
      return;
    }

    this.activePhoto =
      (this.activePhoto + 1) % this.config.photos.length;
  }


  prevPhoto(): void {

    if (!this.config.photos.length) {
      return;
    }

    this.activePhoto =
      (this.activePhoto - 1 + this.config.photos.length) %
      this.config.photos.length;
  }


  selectPhoto(index: number): void {

    if (
      index < 0 ||
      index >= this.config.photos.length
    ) {
      return;
    }

    this.activePhoto = index;
  }


  // ============================================================
  // PAINEL DE AMIGOS
  // ============================================================

  toggleFriends(): void {

    this.friendsOpen = !this.friendsOpen;
  }


  // ============================================================
  // CAMINHO DAS FOTOS
  // ============================================================

  photoPath(photo: string): string {

    return `assets/photos/${photo}`;
  }


  // ============================================================
  // ERRO DE IMAGEM
  // ============================================================

  onImgError(event: Event): void {

    const img = event.target as HTMLImageElement;

    if (!img) {
      return;
    }

    img.style.display = 'none';
  }


  // imagem carregou: garante que ela volte a aparecer (ex.: depois de trocar o álbum)
  onImgLoad(event: Event): void {

    const img = event.target as HTMLImageElement;

    if (img) {
      img.style.display = '';
    }
  }


  // ============================================================
  // INVENTÁRIO
  // ============================================================

  get sortedItems(): InventoryItem[] {

    const list = [...this.inventoryItems];

    return this.sortOrder === 'new' ? list : list.reverse();
  }


  goTo(page: Page): void {

    this.page = page;

    if (page !== 'equipment') {
      this.stopKit();
    }

    this.selectedItem = null;

    this.selectedNews = null;
  }


  setSort(value: string): void {

    this.sortOrder = value === 'old' ? 'old' : 'new';
  }


  openItem(item: InventoryItem): void {

    this.selectedItem = item;
  }


  closeItem(): void {

    this.selectedItem = null;
  }


  // ============================================================
  // CAIXAS (roleta)
  // ============================================================

  openCaseModal(c: CaseItem): void {

    this.openCase = c;

    this.reelImage = c.rewardImage;

    this.buildReel(c);
  }


  closeCase(): void {

    this.clearReelTimer();

    this.openCase = null;

    this.wonReward = null;

    this.reelSpinning = false;
  }


  openAgain(): void {

    if (this.openCase) {
      this.buildReel(this.openCase);
    }
  }


  startSpin(): void {

    if (this.reelSpinning || this.wonReward || !this.pendingReward) {
      return;
    }

    const viewW = this.reelView?.nativeElement.offsetWidth ?? 780;

    // para em um ponto aleatório dentro da carta vencedora
    const jitter = (Math.random() - 0.5) * this.CARD_W * 0.6;

    const target =
      this.winIndex * this.CARD_W + this.CARD_W / 2 - viewW / 2 + jitter;

    this.reelSpinning = true;

    this.reelTransition = 'none';

    this.reelOffset = 0;

    setTimeout(() => {

      this.reelTransition =
        `transform ${this.SPIN_MS}ms cubic-bezier(0.08, 0.6, 0.12, 1)`;

      this.reelOffset = target;

    }, 50);

    this.reelTimer = setTimeout(() => {

      this.reelSpinning = false;

      this.wonReward = this.pendingReward;

    }, this.SPIN_MS + 150);
  }


  private buildReel(c: CaseItem): void {

    this.clearReelTimer();

    const total = 46;

    const cards: CaseReward[] = [];

    for (let i = 0; i < total; i++) {
      cards.push(this.pickReward(c.rewards));
    }

    this.pendingReward = this.pickReward(c.rewards);

    cards[this.winIndex] = this.pendingReward;

    this.reelCards = cards;

    this.reelOffset = 0;

    this.reelTransition = 'none';

    this.reelSpinning = false;

    this.wonReward = null;
  }


  private pickReward(rewards: CaseReward[]): CaseReward {

    const total = rewards.reduce(
      (sum, r) => sum + this.RARITY_WEIGHT[r.rarity],
      0
    );

    let n = Math.random() * total;

    for (const r of rewards) {

      n -= this.RARITY_WEIGHT[r.rarity];

      if (n <= 0) {
        return r;
      }
    }

    return rewards[rewards.length - 1];
  }


  private clearReelTimer(): void {

    if (this.reelTimer) {

      clearTimeout(this.reelTimer);

      this.reelTimer = undefined;
    }
  }


  // ============================================================
  // NOTÍCIAS
  // ============================================================

  openNews(item: NewsItem): void {

    this.selectedNews = item;
  }


  closeNews(): void {

    this.selectedNews = null;
  }


  // ============================================================
  // LOJA
  // ============================================================

  chooseGift(index: number): void {

    // só dá para escolher um presente
    if (this.giftChosen !== null) {
      return;
    }

    const ok = window.confirm(
      `Escolher "${this.gifts[index].title}"? Só dá para resgatar um presente!`
    );

    if (!ok) {
      return;
    }

    this.giftChosen = index;

    try {
      localStorage.setItem(this.GIFT_KEY, String(index));
    } catch {
      // navegador sem armazenamento: a escolha vale só enquanto a página estiver aberta
    }
  }


  private loadGift(): number | null {

    try {

      const value = localStorage.getItem(this.GIFT_KEY);

      if (value === null) {
        return null;
      }

      const n = Number(value);

      return Number.isInteger(n) && n >= 0 ? n : null;

    } catch {
      return null;
    }
  }


  // ============================================================
  // EQUIPAMENTO
  // ============================================================

  get sortedEquipItems(): InventoryItem[] {

    const list = [...this.equipItems];

    return this.sortOrder === 'new' ? list : list.reverse();
  }


  openSlot(slot: EquipSlot): void {

    // clicar num espaço com foto abre a foto grande
    // (os ícones pequenos do jogo não abrem, ficariam borrados)
    if (!slot.image || slot.noZoom) {
      return;
    }

    this.selectedItem = {
      photo: slot.image,
      title: slot.title ?? '',
      subtitle: '',
      rarity: slot.rarity ?? 'gray'
    };
  }


  // ============================================================
  // KITS DE MÚSICA (álbuns que tocam um trecho)
  // ============================================================

  get sortedKits(): MusicKit[] {

    const list = [...this.musicKits];

    return this.sortOrder === 'new' ? list : list.reverse();
  }


  // imagem do espaço: no kit de música mostra a capa do álbum equipado
  slotImage(slot: EquipSlot, side: Side): string | undefined {

    if (slot.isKit) {

      const kit = this.equippedKit[side];

      if (kit) {
        return kit.cover;
      }
    }

    return slot.image;
  }


  // cor da barrinha do espaço (no kit de música, a do álbum equipado)
  slotRarity(slot: EquipSlot, side: Side): Rarity {

    if (slot.isKit) {

      const kit = this.equippedKit[side];

      if (kit) {
        return kit.rarity;
      }
    }

    return slot.rarity || 'gray';
  }


  isEquippedKit(kit: MusicKit, side: Side): boolean {

    return this.equippedKit[side] === kit;
  }


  isKitPlaying(kit: MusicKit): boolean {

    return this.playingKit === kit;
  }


  


  // equipa o álbum (nos dois lados, ou só em um) e toca o trecho
  equipKit(kit: MusicKit, side?: Side): void {

    if (side) {

      this.equippedKit[side] = kit;

    } else {

      this.equippedKit.ct = kit;

      this.equippedKit.t = kit;
    }

    this.playKit(kit);
  }


  // clique num espaço ao lado do boneco
  onSideSlotClick(slot: EquipSlot, side: Side): void {

    if (slot.isKit) {

      // no kit de música: toca ou para o trecho do álbum equipado
      const kit = this.equippedKit[side];

      if (kit) {
        this.playingKit === kit ? this.stopKit() : this.playKit(kit);
      }

      return;
    }

    this.openSlot(slot);
  }


  playKit(kit: MusicKit): void {

    this.stopKit();

    this.closeTv();   // não toca por cima da música da TV

    const start = kit.start ?? 0;

    const end = start + (kit.length ?? 20);

    const audio = new Audio(`assets/audio/${kit.audio}`);

    this.kitAudio = audio;

    this.playingKit = kit;

    // garante que o trecho comece no segundo certo
    audio.addEventListener('loadedmetadata', () => {

      if (audio.currentTime < start) {
        audio.currentTime = start;
      }
    });

    // arquivo não encontrado ou música acabou
    audio.addEventListener('error', () => {

      if (this.kitAudio === audio) {
        this.stopKit();
      }
    });

    audio.addEventListener('ended', () => {

      if (this.kitAudio === audio) {
        this.stopKit();
      }
    });

    try {
      audio.currentTime = start;
    } catch {
      // ainda sem metadados: o loadedmetadata acima resolve
    }

    // o play() fica logo depois do clique, assim o navegador deixa tocar
    audio.play().catch(() => {

      if (this.kitAudio === audio) {
        this.stopKit();
      }
    });

    // acompanha o tempo: fade-out no final e para quando acaba o trecho
    this.kitTick = setInterval(() => {

      const remaining = end - audio.currentTime;

      if (remaining <= 0) {
        this.stopKit();
        return;
      }

      audio.volume = remaining < this.KIT_FADE
        ? Math.max(0, remaining / this.KIT_FADE)
        : 1;

    }, 100);
  }


  stopKit(): void {

    if (this.kitTick) {

      clearInterval(this.kitTick);

      this.kitTick = undefined;
    }

    if (this.kitAudio) {

      const audio = this.kitAudio;

      this.kitAudio = undefined;

      audio.pause();

      audio.removeAttribute('src');

      audio.load();
    }

    this.playingKit = null;
  }


  // ============================================================
  // LIMPEZA
  // ============================================================

  private clearSearchingInterval(): void {

    if (this.searchInterval) {

      clearInterval(this.searchInterval);

      this.searchInterval = undefined;
    }
  }


  ngOnDestroy(): void {

    if (this.clockInterval) {

      clearInterval(this.clockInterval);
    }

    this.clearSearchingInterval();

    this.clearReelTimer();

    this.stopKit();
  }
}