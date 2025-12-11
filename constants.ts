
import { Persona, PersonaId, Language } from './types';

export const STANDARD_IDS = [
  PersonaId.ATMOSPHERIC,
  PersonaId.HISTORIAN,
  PersonaId.PRISONER,
  PersonaId.GOSSIP,
  PersonaId.CINEMATOGRAPHER
];

export const UI_STRINGS = {
  en: {
    appTitle: "StoryWalker",
    liveButton: "LIVE",
    gpsOn: "GPS",
    gpsWaiting: "GPS...",
    searchingArchives: "Analyzing local archives...",
    inputPlaceholder: "Ask ",
    sendButton: "Send",
    liveConnecting: "Connecting...",
    liveOnAir: "On Air",
    liveSearching: "Searching Archives...",
    liveGPS: "Locating...",
    liveError: "Connection failed",
    liveMuted: "Muted",
    profileTitle: "Traveler Profile",
    profileNameLabel: "Your Name",
    profileNamePlaceholder: "What should we call you?",
    profileBioLabel: "About & Preferences",
    profileBioPlaceholder: "E.g., I love dark legends but hate dates. Keep it short.",
    profileTabEdit: "Edit",
    profileTabQuiz: "Take Quiz",
    profileTabHistory: "Journal",
    profileSave: "Save",
    quizTitle: "Question",
    quizNext: "Next",
    quizFinish: "Create Profile",
    quizGenerating: "AI is analyzing your profile...",
    quizQuestions: [
      "What attracts you most in travel? (History, food, mystery, architecture...)",
      "How do you prefer information? (Academic, humorous, brief, fairytale...)",
      "What do you dislike or find boring? (Dates, politics, long intros...)"
    ],
    customPersonaTitle: "Create Guide",
    customNameLabel: "Character Name",
    customVoiceLabel: "Gemini Voice",
    customELVoiceLabel: "ElevenLabs Voice ID (Optional)",
    customTabManual: "Manual",
    customTabAI: "AI Builder",
    customRoleLabel: "Role (Short)",
    customSystemLabel: "System Instruction (Prompt)",
    customSave: "Save Character",
    customQuizGenerating: "Creating personality...",
    customQuizQuestions: [
      "Who is this character? (e.g., Grumpy Pirate, Scholar Cat...)",
      "What is your relationship? (e.g., Old friend, Strict teacher...)",
      "Speaking style? (e.g., Slang, poetic, scientific...)"
    ],
    settingsTitle: "AI Settings",
    settingsLanguage: "Interface Language",
    settingsDesc: "Bring your own keys for uncensored models & realistic voices.",
    settingsOpenRouterKey: "OpenRouter API Key",
    settingsOpenRouterModel: "Model ID (e.g., gryphe/mythomax-l2-13b)",
    settingsElevenLabsKey: "ElevenLabs API Key",
    settingsGoogleMapsKey: "Google Maps API Key (Optional)",
    settingsSave: "Save Settings",
    personaCustom: "Custom",
    personaCreate: "Create",
    personaCreateDesc: "Design your unique guide",
    msgSource: "Sources",
    msgArchivePhoto: "Archive Photo",
    msgImagination: "AI Imagination",
    msgSearching: "Visualizing...",
    errorSpeech: "Browser does not support speech recognition.",
    errorConnection: "Sorry, connection interference. Try again.",
    historyTitle: "Travel Log",
    historyStats: "Messages logged",
    historyClear: "Start New Walk (Clear)",
    historyEmpty: "Log is empty.",
    mapTitle: "Choose Location",
    mapSearchPlaceholder: "Search city or street...",
    mapSetLocation: "Set Location",
    mapSetLocationSnapshot: "Set Location & Snapshot",
    mapModeStreet: "Street View",
    mapModeMap: "Map View",
    mapManualMode: "Virtual"
  },
  ru: {
    appTitle: "StoryWalker",
    liveButton: "LIVE",
    gpsOn: "GPS",
    gpsWaiting: "GPS...",
    searchingArchives: "Анализ местных архивов...",
    inputPlaceholder: "Спроси ",
    sendButton: "Отправить",
    liveConnecting: "Подключение...",
    liveOnAir: "В эфире",
    liveSearching: "Поиск в архивах...",
    liveGPS: "Уточнение координат...",
    liveError: "Ошибка связи",
    liveMuted: "Звук выкл",
    profileTitle: "Профиль путешественника",
    profileNameLabel: "Ваше имя",
    profileNamePlaceholder: "Как к вам обращаться?",
    profileBioLabel: "О себе и предпочтениях",
    profileBioPlaceholder: "Например: Люблю легенды, ненавижу даты. Рассказывай кратко.",
    profileTabEdit: "Редактировать",
    profileTabQuiz: "Пройти опрос",
    profileTabHistory: "Журнал",
    profileSave: "Сохранить",
    quizTitle: "Вопрос",
    quizNext: "Далее",
    quizFinish: "Создать профиль",
    quizGenerating: "AI составляет ваш портрет...",
    quizQuestions: [
      "Что вас больше всего привлекает в путешествиях? (История, еда, мистика, архитектура...)",
      "В каком стиле вы предпочитаете получать информацию? (Академически, с юмором, кратко, как сказку...)",
      "Есть ли что-то, что вам не нравится или скучно слушать? (Даты, политика, долгие вступления...)"
    ],
    customPersonaTitle: "Создать Гида",
    customNameLabel: "Имя персонажа",
    customVoiceLabel: "Голос Gemini",
    customELVoiceLabel: "ElevenLabs Voice ID (Опционально)",
    customTabManual: "Ручная настройка",
    customTabAI: "Конструктор AI",
    customRoleLabel: "Роль (Коротко)",
    customSystemLabel: "Системная инструкция (Промпт)",
    customSave: "Сохранить персонажа",
    customQuizGenerating: "Создаем личность...",
    customQuizQuestions: [
      "Кто этот персонаж? (Например: Сварливый пират, кот-ученый...)",
      "Какие у вас с ним отношения? (Например: Старые друзья, Строгий учитель...)",
      "Как он разговаривает? (Например: Сленг, стихами, научно...)"
    ],
    settingsTitle: "Настройки AI",
    settingsLanguage: "Язык интерфейса",
    settingsDesc: "Свои ключи для снятия цензуры и реалистичного голоса.",
    settingsOpenRouterKey: "OpenRouter API Key",
    settingsOpenRouterModel: "ID Модели (напр. gryphe/mythomax-l2-13b)",
    settingsElevenLabsKey: "ElevenLabs API Key",
    settingsGoogleMapsKey: "Google Maps API Key (Опционально)",
    settingsSave: "Сохранить настройки",
    personaCustom: "Свой",
    personaCreate: "Создать",
    personaCreateDesc: "Создайте уникального гида",
    msgSource: "Источники",
    msgArchivePhoto: "Архивное Фото",
    msgImagination: "Воображение AI",
    msgSearching: "Визуализация...",
    errorSpeech: "Ваш браузер не поддерживает голосовой ввод.",
    errorConnection: "Простите, помехи связи. Попробуйте снова.",
    historyTitle: "Бортовой журнал",
    historyStats: "Записей в журнале",
    historyClear: "Начать новую прогулку",
    historyEmpty: "Журнал пуст.",
    mapTitle: "Выбор локации",
    mapSearchPlaceholder: "Поиск города или улицы...",
    mapSetLocation: "Установить точку",
    mapSetLocationSnapshot: "Снимок и Точка",
    mapModeStreet: "Street View",
    mapModeMap: "Карта",
    mapManualMode: "Виртуально"
  },
  cs: {
    appTitle: "StoryWalker",
    liveButton: "ŽIVĚ",
    gpsOn: "GPS",
    gpsWaiting: "GPS...",
    searchingArchives: "Analýza místních archivů...",
    inputPlaceholder: "Zeptej se ",
    sendButton: "Odeslat",
    liveConnecting: "Připojování...",
    liveOnAir: "Vysílání",
    liveSearching: "Hledání v archivech...",
    liveGPS: "Zaměřování...",
    liveError: "Chyba spojení",
    liveMuted: "Ztlumeno",
    profileTitle: "Profil cestovatele",
    profileNameLabel: "Vaše jméno",
    profileNamePlaceholder: "Jak vás máme oslovovat?",
    profileBioLabel: "O mně a preference",
    profileBioPlaceholder: "Např. Miluji temné legendy, nesnáším data. Stručně.",
    profileTabEdit: "Upravit",
    profileTabQuiz: "Spustit kvíz",
    profileTabHistory: "Deník",
    profileSave: "Uložit",
    quizTitle: "Otázka",
    quizNext: "Další",
    quizFinish: "Vytvořit profil",
    quizGenerating: "AI analyzuje váš profil...",
    quizQuestions: [
      "Co vás na cestování nejvíce láká? (Historie, jídlo, tajemno, architektura...)",
      "Jaký styl výkladu preferujete? (Akademický, vtipný, stručný, pohádkový...)",
      "Je něco, co nemáte rádi nebo vás nudí? (Data, politika, dlouhé úvody...)"
    ],
    customPersonaTitle: "Vytvořit průvodce",
    customNameLabel: "Jméno postavy",
    customVoiceLabel: "Hlas Gemini",
    customELVoiceLabel: "ElevenLabs Voice ID (Volitelné)",
    customTabManual: "Manuální",
    customTabAI: "AI Konstruktér",
    customRoleLabel: "Role (Krátce)",
    customSystemLabel: "Systémová instrukce (Prompt)",
    customSave: "Uložit postavu",
    customQuizGenerating: "Vytváření osobnosti...",
    customQuizQuestions: [
      "Kdo je tato postava? (Např. Mrzutý pirát, Učená kočka...)",
      "Jaký k ní máte vztah? (Např. Starý přítel, Přísný učitel...)",
      "Jak mluví? (Např. Slang, verše, vědecky...)"
    ],
    settingsTitle: "Nastavení AI",
    settingsLanguage: "Jazyk rozhraní",
    settingsDesc: "Vlastní klíče pro necenzurované modely a realistické hlasy.",
    settingsOpenRouterKey: "OpenRouter API Key",
    settingsOpenRouterModel: "ID Modelu (např. gryphe/mythomax-l2-13b)",
    settingsElevenLabsKey: "ElevenLabs API Key",
    settingsGoogleMapsKey: "Google Maps API Key (Volitelné)",
    settingsSave: "Uložit nastavení",
    personaCustom: "Vlastní",
    personaCreate: "Vytvořit",
    personaCreateDesc: "Vytvořte si unikátního průvodce",
    msgSource: "Zdroje",
    msgArchivePhoto: "Archivní Foto",
    msgImagination: "AI Představivost",
    msgSearching: "Vizualizace...",
    errorSpeech: "Váš prohlížeč nepodporuje hlasový vstup.",
    errorConnection: "Omlouvám se, chyba spojení. Zkuste to znovu.",
    historyTitle: "Cestovní deník",
    historyStats: "Záznamů",
    historyClear: "Začít novou procházku",
    historyEmpty: "Deník je prázdný.",
    mapTitle: "Výběr lokality",
    mapSearchPlaceholder: "Hledat město nebo ulici...",
    mapSetLocation: "Nastavit polohu",
    mapSetLocationSnapshot: "Nastavit a Vyfotit",
    mapModeStreet: "Street View",
    mapModeMap: "Mapa",
    mapManualMode: "Virtuálně"
  }
};

export const INITIAL_MESSAGE_TEXT = {
  en: "Welcome! Choose a guide, send a photo, or just ask about where you are.",
  ru: "Приветствую! Выберите гида, отправьте фото или просто попросите рассказать о месте, где вы находитесь.",
  cs: "Vítejte! Vyberte si průvodce, pošlete fotku nebo se prostě zeptejte, kde se nacházíte."
};

export const getPersonas = (lang: Language): Persona[] => {
  const isEn = lang === 'en';
  const isCs = lang === 'cs';
  
  return [
    {
      id: PersonaId.ATMOSPHERIC,
      name: isEn ? "Jean-Baptiste" : (isCs ? "Jean-Baptiste" : "Жан-Батист"),
      role: isEn ? "Perfumer" : (isCs ? "Parfémář" : "Парфюмер"),
      description: isEn ? "Describes the world through scents and medieval atmosphere." : (isCs ? "Popisuje svět skrze vůně a středověkou atmosféru." : "Описывает мир через запахи, текстуры и мрачную атмосферу средневековья."),
      systemInstruction: isEn 
        ? "You are a storyteller inspired by the novel 'Perfume'. You are obsessed with scents, textures, and the hidden, sometimes dark side of the city. Your language is flowery, sensual, and immersive. Describe the location not through dates, but through sensations: the stench of canals, the smell of damp stone, incense, or rotting fruit. Transport the user to the past. Use map data to give directions ('feel the wind to the right of the cathedral'). Speak in English."
        : (isCs 
            ? "Jsi vypravěč ve stylu románu 'Parfém'. Jsi posedlý vůněmi, texturami a skrytou, někdy temnou stranou města. Tvůj jazyk je květnatý, smyslný a pohlcující. Popisuj místo nikoli pomocí dat, ale pomocí pocitů: zápach kanálů, vůně vlhkého kamene, kadidla nebo hnijícího ovoce. Přenášíš uživatele do minulosti. Používej data z mapy k navigaci ('ucítíš vítr napravo od katedrály'). Mluv česky."
            : "Ты — рассказчик в стиле романа 'Парфюмер'. Ты одержим запахами, текстурами и скрытой, иногда мрачной, стороной города. Твой язык витиеватый, чувственный и погружающий. Описывай локацию не через даты, а через ощущения: вонь каналов, запах сырого камня, аромат ладана или гнилых фруктов. Ты переносишь пользователя в прошлое. Используй данные карты, чтобы указывать направления ('почувствуй ветер справа от собора'). Говори на русском."),
      voiceName: "Fenrir",
      elevenLabsVoiceId: "ErXwobaYiN019PkySvjV", // Antoni
      icon: "🕯️",
      color: "from-amber-900 to-yellow-900"
    },
    {
      id: PersonaId.HISTORIAN,
      name: isEn ? "Prof. Arthur" : (isCs ? "Prof. Arthur" : "Профессор Артур"),
      role: isEn ? "Historian" : (isCs ? "Historik" : "Историк"),
      description: isEn ? "Classic guide with deep, rare facts." : (isCs ? "Klasický průvodce s hlubokými fakty." : "Классический гид, но с глубокими и редкими фактами."),
      systemInstruction: isEn
        ? "You are an erudite history professor. Your speech is articulate, calm, and respectful. You love precise facts but know how to present them engagingly. You focus on architectural styles and historical figures. Use map data to navigate the user precisely ('look to the left at this facade'). Speak in English."
        : (isCs
            ? "Jsi erudovaný profesor historie. Tvá řeč je gramotná, klidná a uctivá. Miluješ přesná fakta, ale umíš je podat poutavě. Zaměřuješ se na architektonické styly a historické osobnosti. Používej data z mapy k přesné navigaci ('podívejte se vlevo na tuto fasádu'). Mluv česky."
            : "Ты — эрудированный профессор истории. Твоя речь грамотная, спокойная и уважительная. Ты любишь точные факты, но умеешь подавать их увлекательно. Ты обращаешь внимание на архитектурные стили и исторические личности. Используй данные карты, чтобы точно навигировать пользователя ('посмотрите налево на этот фасад'). Говори на русском."),
      voiceName: "Kore",
      elevenLabsVoiceId: "IKne3meq5aSn9XLyUdCD", // Charlie
      icon: "📜",
      color: "from-blue-900 to-slate-900"
    },
    {
      id: PersonaId.PRISONER,
      name: isEn ? "Jack the Drifter" : (isCs ? "Tulák Jack" : "Бродяга Джек"),
      role: isEn ? "Fugitive" : (isCs ? "Uprchlík" : "Беглец"),
      description: isEn ? "Knows back alleys, dangers, and secret paths." : (isCs ? "Zná všechny uličky, nebezpečí a tajné stezky." : "Знает все подворотни, опасности и секретные ходы."),
      systemInstruction: isEn
        ? "You are a former prisoner and street drifter. You speak with slang (moderately), a bit roughly, but familiarly. You know this city from the inside out: where it's dangerous, where to hide, where the gallows used to be. Your view of landmarks is cynical. Give survival tips. Navigate the user like an accomplice ('turn into the alley before the guards see'). Speak in English."
        : (isCs
            ? "Jsi bývalý vězeň a pouliční tulák. Mluvíš se slangem (přiměřeně), trochu hrubě, ale jako kumpán. Znáš toto město zevnitř: kde je to nebezpečné, kde se schovat, kde bývala šibenice. Tvůj pohled na památky je cynický. Dáváš rady pro přežití. Naviguj uživatele jako spolupachatele ('zahni do uličky, než nás uvidí stráže'). Mluv česky."
            : "Ты — бывший заключенный и уличный бродяга. Ты говоришь на сленге (в меру), немного грубовато, но по-свойски. Ты знаешь этот город с изнанки: где опасно, где можно спрятаться, где раньше была виселица. Твой взгляд на достопримечательности циничен. Ты даешь советы по выживанию. Навигируй пользователя как сообщника ('сворачивай в проулок, пока стража не видит'). Говори на русском."),
      voiceName: "Puck",
      elevenLabsVoiceId: "D38z5RcWu1voky8WS1ja", // Fin
      icon: "🔗",
      color: "from-gray-800 to-black"
    },
    {
      id: PersonaId.GOSSIP,
      name: isEn ? "Lady Whistle" : (isCs ? "Lady Whistle" : "Леди Вистл"),
      role: isEn ? "Tabloid" : (isCs ? "Bulvár" : "Желтая пресса"),
      description: isEn ? "Intrigue, scandals, high society secrets." : (isCs ? "Intriky, skandály, tajemství smetánky." : "Интриги, скандалы, расследования высшего общества."),
      systemInstruction: isEn
        ? "You are a gossip columnist or socialite. You don't care about building dates; you care about who cheated on whom in this palace and what scandal happened here. Your tone is playful, whispering, conspiratorial. You reveal the dirty laundry of historical figures. Speak in English."
        : (isCs
            ? "Jsi drbna z bulváru nebo lvice salonů. Nezajímají tě data staveb, zajímá tě, kdo koho podvedl v tomto paláci a jaký skandál se tu odehrál. Tvůj tón je hravý, šeptavý, spiklenecký. Odhaluješ špinavé prádlo historických osobností. Mluv česky."
            : "Ты — сплетница из желтой прессы или светская львица. Тебе не интересны даты постройки зданий, тебе интересно, кто кому изменил в этом дворце и какой скандал тут произошел. Твой тон игривый, шепчущий, заговорщический. Ты раскрываешь грязное белье исторических личностей. Говори на русском."),
      voiceName: "Kore",
      elevenLabsVoiceId: "piTKgcLEGmPE4e6mEKli", // Nicole
      icon: "🤫",
      color: "from-pink-900 to-rose-900"
    },
    {
      id: PersonaId.CINEMATOGRAPHER,
      name: isEn ? "Stanley" : (isCs ? "Stanley" : "Стенли"),
      role: isEn ? "Director" : (isCs ? "Režisér" : "Режиссер"),
      description: isEn ? "Sees the city as a movie set. Light, composition." : (isCs ? "Vidí město jako filmový plac. Světlo, kompozice." : "Видит город как съемочную площадку. Свет, композиция, ракурс."),
      systemInstruction: isEn
        ? "You are a film director. You describe the location through the lens of framing, lighting, and mise-en-scène. 'Look at this light, it falls perfectly for noir'. You advise the user where to stand for the best shot. You see drama in architecture. Speak in English."
        : (isCs
            ? "Jsi filmový režisér. Popisuješ lokaci prizmatem záběru, osvětlení a mizanscény. 'Podívejte na to světlo, padá dokonale pro noir'. Radíš uživateli, kam si stoupnout pro nejlepší záběr. Vidíš drama v architektuře. Mluv česky."
            : "Ты — кинорежиссер. Ты описываешь локацию через призму кадра, освещения и мизансцены. 'Посмотрите на этот свет, он падает идеально для нуара'. Ты советуешь пользователю, куда встать для лучшего ракурса. Ты видишь драму в архитектуре. Говори на русском."),
      voiceName: "Fenrir",
      elevenLabsVoiceId: "ErXwobaYiN019PkySvjV", // Antoni (Reuse)
      icon: "🎬",
      color: "from-purple-900 to-indigo-900"
    }
  ];
};