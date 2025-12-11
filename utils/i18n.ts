
import { LanguageCode } from "../types";

// Pricing Logic
export const getRegionalPrice = (lang?: LanguageCode, country: string = '') => {
  return { value: '11,40', original: '22,80', symbol: 'R$', code: 'BRL' };
};

const pt = {
  marketing: {
    urgent: "⚠️ ÚLTIMAS VAGAS COM DESCONTO",
    bonuses_title: "VOCÊ VAI RECEBER:",
    bonus1: "Protocolo Queima de Gordura 24h",
    bonus2: "Guia de Mercado Barato",
    bonus3: "Acesso à Comunidade VIP",
    value: "Valor Real",
    free: "BÔNUS",
    guarantee_title: "Garantia Blindada",
    guarantee_text: "Se você não ver resultado, nós devolvemos cada centavo.",
    secure_badge: "Pagamento 100% Seguro",
    trusted_by: "TECNOLOGIA USADA POR ATLETAS DE ELITE:",
    spots_left: "Apenas 3 vagas para análise hoje."
  },
  hero: {
    tags: [
      "REVELADO: O SEGREDO DOS CORPOS DEFINIDOS",
      "PARE DE PERDER TEMPO NA ACADEMIA",
      "SEU METABOLISMO DESTRAVADO HOJE",
      "DIETA SEM PASSAR FOME",
      "TECNOLOGIA MILITAR DE ANÁLISE"
    ],
    select_lang: "Idioma",
    titles: [
      "A Ingestão Calórica Vai Mudar Seu Corpo.",
      "A Ciência Exata do Seu Novo Corpo.",
      "Sua Genética Não É Seu Destino.",
      "Engenharia Metabólica Aplicada a Você.",
      "O Fim das Dietas Genéricas."
    ],
    subtitles: [
      "Esqueça as dietas da moda. Nossa Inteligência Artificial analisa sua biometria e cria o ÚNICO caminho matemático para o corpo que você sempre sonhou.",
      "Descubra exatamente o que comer e como treinar para desbloquear sua melhor versão em tempo recorde.",
      "Um plano vivo que se adapta ao seu dia a dia, preferências e bolso. Sem passar fome, sem treinos impossíveis."
    ],
    benefits: [
      "🥗 Coma o que gosta",
      "🔥 Resultados em 7 dias",
      "🧬 Análise de DNA Visual",
      "🏠 Treine onde quiser"
    ],
    cta: "DESBLOQUEAR MEU CORPO NOVO",
    price: "Acesso Vitalício",
    features: ["DEFINIÇÃO", "SAÚDE", "AUTOESTIMA", "PODER"]
  },
  comparison: {
    title: "A Verdade Nua e Crua",
    subtitle: "Por que continuar tentando do jeito difícil?",
    items: [
      {
        icon: "💸",
        title: "Economia Absurda",
        old: "Personal + Nutri: R$ 600/mês",
        new: "CaloryIA: R$ 11,40 (Único)"
      },
      {
        icon: "🎯",
        title: "Fim do 'Achismo'",
        old: "Tentativa e erro",
        new: "Certeza matemática"
      },
      {
        icon: "🚀",
        title: "Velocidade",
        old: "Meses sem mudança",
        new: "Evolução visível em dias"
      }
    ]
  },
  header: {
    home: "Início",
    plan: "Meu Plano",
    progress: "Evolução",
    chat_tooltip: "IA Trainer"
  },
  chat: {
    title: "Assistente Pessoal",
    subtitle: "Tire dúvidas 24h/dia",
    placeholder: "Ex: O que comer no pré-treino?",
    send: "Perguntar",
    greeting: "Olá! Sou sua IA de performance. Estou aqui para garantir que você atinja seus objetivos. Qual sua dúvida hoje?",
    thinking: "Analisando..."
  },
  footer: {
    terms: "Termos de Uso",
    privacy: "Privacidade",
    contact: "Suporte",
    rights: "CaloryIA © Tecnologia Registrada."
  },
  legal: {
      termsTitle: "Termos de Uso e Responsabilidade",
      privacyTitle: "Política de Privacidade",
      content: `
      1. ISENÇÃO DE RESPONSABILIDADE MÉDICA
      O CaloryIA é uma ferramenta de inteligência artificial para sugestões de bem-estar e fitness. As informações fornecidas não substituem o aconselhamento médico profissional, diagnóstico ou tratamento. Sempre procure o conselho de seu médico ou outro profissional de saúde qualificado antes de iniciar qualquer novo regime de dieta ou exercícios.

      2. USO DE DADOS
      Respeitamos sua privacidade. Seus dados biométricos e fotos são processados de forma criptografada para gerar seu plano e armazenados de forma segura. Não vendemos suas informações para terceiros.

      3. PAGAMENTO E ACESSO
      O pagamento do plano garante acesso vitalício à plataforma na versão adquirida. Atualizações futuras podem estar sujeitas a novos termos. O reembolso é garantido por lei dentro do prazo de 7 dias em caso de arrependimento.

      4. PROPRIEDADE INTELECTUAL
      Todo o conteúdo, design, logotipos e algoritmos do CaloryIA são propriedade exclusiva da CaloryIA Corp. É proibida a cópia ou redistribuição sem autorização.
      `
  },
  security: {
    shield: "Proteção Total",
    verifying: "Checando...",
    encrypting: "Criptografando...",
    checking: "Verificando...",
    code_check: "OK",
    connection: "Seguro",
    approved: "Aprovado",
    footer: "Seus dados estão seguros conosco.",
    auditing: "Auditado",
    status_guest: "Visitante",
    status_cloud: "Conectado"
  },
  onboarding: {
    step1: "Acesso",
    step2: "Corpo",
    step3: "Vida",
    step4: "Saúde",
    step5: "Revisão",
    title1: "Crie seu Acesso",
    title2: "Raio-X Corporal",
    title3: "Seu Estilo de Vida",
    title4: "Ficha Clínica",
    title5: "Pronto para Mudar?",
    name: "Nome Completo",
    email: "Seu Melhor E-mail",
    pass: "Senha",
    birth: "Nascimento (DD/MM/AAAA)",
    gender: "Sexo Biológico",
    weight: "Peso (kg)",
    height: "Altura (cm)",
    activity: "Nível de Atividade",
    medication: "Uso de Medicamentos / Lesões",
    medicationPlaceholder: "Ex: Dor na lombar, Hipertensão...",
    diet: "O que você NÃO come?",
    dietPlaceholder: "Ex: Odeio fígado, sou alérgico a camarão...",
    country: "País",
    state: "Estado (Para cardápio local)",
    statePlaceholder: "Ex: Minas Gerais",
    stateHint: "Adaptamos o preço dos alimentos à sua região.",
    language: "Idioma",
    next: "Próximo Passo",
    finish: "Gerar Protocolo Agora",
    back: "Voltar",
    summarySubtitle: "Confira se seus dados estão exatos para a calibração do algoritmo.",
    edit: "Corrigir",
    genderOptions: {
      male: "Masculino",
      female: "Feminino",
      other: "Outro"
    }
  },
  payment: {
    title: "Desbloqueie sua Melhor Versão",
    lifetime: "Pagamento Único e Vitalício",
    payBtn: "FINALIZAR COMPRA SEGURA",
    via_mp: "Processado pelo Mercado Pago",
    access_granted: "ACESSO LIBERADO!",
    redirect: "Entrando no sistema...",
    immediate_approval: "Liberação Imediata",
    installments: "Até 12x no cartão",
  },
  upload: {
      title: "Scanner Metabólico",
      subtitle: "Nossa IA analisará sua biometria em nuvem segura para calcular a dieta perfeita.",
      drag: "Toque para enviar foto",
      useCamera: "Usar Câmera",
      takePhoto: "Capturar",
      cancelCamera: "Cancelar",
      analyze: "PROCESSAR DADOS",
      analyzing: "Analisando Biometria...",
      privacyTitle: "Segurança de Dados",
      privacyText: "Sua foto é processada em ambiente criptografado (AES-256) apenas para análise biométrica. Seus dados são protegidos por sigilo absoluto e salvos na nuvem segura.",
      privacyBadge: "Criptografia Bancária",
      tips: "Como tirar a foto perfeita",
      tip1: "Use roupas de ginástica",
      tip2: "Corpo inteiro no quadro",
      tip3: "Ambiente iluminado",
      errorType: "Formato inválido.",
      errorSize: "Imagem muito grande."
  },
  results: {
      title: "Diagnóstico Concluído",
      bodyType: "Biotipo Dominante",
      fat: "% Gordura Estimada",
      recommendation: "Estratégia Gerada",
      cta: "ACESSAR MEU PLANO AGORA"
  },
  plan: {
      day: "Dia",
      week: "Semana",
      goalsTitle: "Checklist do Sucesso",
      addGoal: "Minha meta...",
      waterTitle: "Hidratação",
      waterGoal: "Meta",
      addWater: "Beber (+250ml)",
      monthly: "Foco da Fase",
      section_workout: "Protocolo de Treino",
      loading: "Ajustando...",
      regenerate: "Trocar Treino",
      macro_kcal: "Calorias",
      macro_prot: "Proteína",
      macro_carb: "Carbo",
      macro_fat: "Gordura",
      section_meals: "Nutrição",
      swap: "Substituir",
      visual_label: "Anatomia",
      video_btn: "Ver Execução (Vídeo)",
      visual_loading: "Desenhando...",
      visual_unavailable: "Sem visual",
      new_meal_option: "Mudar Opção",
      finishDay: "MARCAR DIA COMO CONCLUÍDO",
      dayCompleted: "MISSÃO CUMPRIDA!",
      shoppingList: "Lista de Mercado",
      shoppingListTitle: "Comprar para hoje",
      shoppingListClose: "Fechar",
      analyze_meal: "Escanear Calorias",
      analyze_meal_hint: "Foto do prato",
      video_upload_title: "Correção de Movimento",
      video_upload_btn: "Analisar Minha Execução",
      video_upload_hint: "A IA corrige sua postura para evitar lesões.",
      analyzing_video: "Analisando biomecânica...",
      analyzing_food: "Calculando...",
      video_feedback_title: "Relatório Técnico"
  },
  progress: {
      title: "Gráficos de Evolução",
      currentWeight: "Peso Atual",
      weightLost: "Eliminados",
      totalWorkouts: "Frequência",
      workouts: "Treinos",
      keepGoing: "Você é imparável!",
      totalCalories: "Gasto Calórico",
      burnedTotal: "Total Queimado",
      weightHistory: "Curva de Peso",
      activity: "Consistência"
  },
  validation: {
      invalidEmail: "E-mail inválido.",
      fillAll: "Preencha tudo.",
      invalidAge: "+18 anos apenas.",
      invalidWeight: "Peso inválido.",
      invalidHeight: "Altura inválida."
  },
  activityLevels: {
      sedentary: "Sedentário",
      light: "Leve (1-2x/sem)",
      moderate: "Moderado (3-5x/sem)",
      active: "Ativo (6x/sem)",
      athlete: "Atleta (2x/dia)"
  }
};

export const getText = (lang: LanguageCode) => {
  return pt;
};
