import {
  ARCHITECTURE_NODES,
  ARCHITECTURE_EDGES,
  type TechnicalNodeSpec,
} from '@/system/architectureRegistry';

export const DOCUMENTED_ENTERPRISE_CONNECTORS = [
  { id: 'slack', name: 'Slack Enterprise', category: 'chat' },
  { id: 'ms-teams', name: 'Microsoft Teams', category: 'chat' },
  { id: 'confluence', name: 'Atlassian Confluence', category: 'knowledge' },
  { id: 'notion', name: 'Notion Workspace', category: 'knowledge' },
  { id: 'google-drive', name: 'Google Drive Enterprise', category: 'knowledge' },
  { id: 'zoom-meetings', name: 'Zoom Meetings & Transcripts', category: 'meetings' },
  { id: 'google-meet', name: 'Google Meet Transcripts', category: 'meetings' },
] as const;

export interface DocumentedApiRouteSpec {
  endpoint: string;
  methods: string[];
  sourceFile: string;
  zoneScope: 'admin' | 'tenant' | 'shared';
  technicalSummaryFa: string;
  nonTechnicalSummaryFa: string;
  errorProtectionFa: string;
}

export interface DocumentedCoreModuleSpec {
  id: string;
  layer: 'Edge & Routing' | 'Domain Core (src/core)' | 'Infrastructure (src/infrastructure)' | 'System & Observability';
  moduleName: string;
  sourceFiles: string[];
  responsibilityFa: string;
  interactionWithOtherModulesFa: string;
  failureRecoveryFa: string;
}

export interface VisualDiagramStep {
  stepNumber: string;
  titleFa: string;
  subtitleEn: string;
  descriptionFa: string;
  badgeText: string;
  tone: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
}

export interface VisualFlowDiagramSpec {
  id: string;
  titleFa: string;
  subtitleFa: string;
  summaryFa: string;
  steps: VisualDiagramStep[];
}

export interface PersianNodeTranslationSpec {
  nodeId: string;
  titleFa: string;
  categoryLabelFa: string;
  nonTechnicalPurposeFa: string;
  nonTechnicalHowItWorksFa: string;
  technicalArchitectureFa: string;
  errorPreventionMechanismFa: string;
}

export interface PersianDocSectionSpec {
  id: string;
  badgeFa: string;
  titleFa: string;
  subtitleEn: string;
  summaryFa: string;
  bulletsFa: { headingFa: string; bodyFa: string; codeRef?: string }[];
}

export interface ErrorPreventionShieldSpec {
  id: string;
  shieldNumber: number;
  titleFa: string;
  technicalNameEn: string;
  threatScenarioFa: string;
  howShieldPreventsItFa: string;
  userExperienceResultFa: string;
  sourceFileRef: string;
}

export interface ArchitectDecisionSimpleSpec {
  questionFa: string;
  simpleAnswerFa: string;
  whyItMattersFa: string;
}

export const DOCUMENTED_API_ROUTES: readonly DocumentedApiRouteSpec[] = [
  {
    endpoint: '/api/admin/session',
    methods: ['GET', 'POST', 'DELETE'],
    sourceFile: 'src/app/api/admin/session/route.ts',
    zoneScope: 'admin',
    technicalSummaryFa:
      'احراز هویت مالک پلتفرم (Product Owner) با بررسی SUPER_ADMIN_EMAIL و SUPER_ADMIN_PASSWORD، محافظت در برابر Brute-Force با Sliding-Window Rate Limiter و صدور کوکی HttpOnly امضاشده با HMAC-SHA256.',
    nonTechnicalSummaryFa:
      'دروازه ورود امن مدیر اصلی سیستم به پنل مدیریت (admin.mindmittel.de) که جلوی حدس زدن رمز عبور را می‌گیرد.',
    errorProtectionFa:
      'محدودکننده تعداد تلاش ناموفق (Rate Limiter) و امضای رمزنگاری‌شده کوکی که امکان جعل نشست ادمین را صفر می‌کند.',
  },
  {
    endpoint: '/api/admin/tenants',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    sourceFile: 'src/app/api/admin/tenants/route.ts',
    zoneScope: 'admin',
    technicalSummaryFa:
      'مدیریت کامل چرخه حیات مشتریان (Tenants): ساخت ساب‌دامین جدید، تخصیص دیتابیس مجزا (mindmittel_<slug>)، رمزنگاری کلید اختصاصی Gemini و URI دیتابیس با AES-256-GCM و حذف ایمن.',
    nonTechnicalSummaryFa:
      'بخش ثبت، ویرایش، تعلیق یا حذف شرکت‌های مشتری که برای هر شرکت یک محیط و دیتابیس کاملاً ایزوله می‌سازد.',
    errorProtectionFa:
      'رمزنگاری نظامی کلیدهای حساس مشتری قبل از ذخیره در دیتابیس و مسدودسازی حذف یا تغییر ساب‌دامین‌های رزرو شده (admin, demo, www).',
  },
  {
    endpoint: '/api/ai/models',
    methods: ['GET'],
    sourceFile: 'src/app/api/ai/models/route.ts',
    zoneScope: 'shared',
    technicalSummaryFa:
      'پروب و ارزیابی زنده مدل‌های در دسترس Google Gemini بر اساس پروفایل fast یا reasoning، فیلتر کردن مدل‌های قرنطینه‌شده در Circuit Breaker و بازگرداندن بهترین مدل به همراه زنجیره Fallback.',
    nonTechnicalSummaryFa:
      'سنجش زنده هوش مصنوعی گوگل برای انتخاب سریع‌ترین یا دقیق‌ترین مدل سالم در لحظه.',
    errorProtectionFa:
      'در صورت عدم پاسخگویی API گوگل ظرف ۸ ثانیه، بدون کرش کردن به لیست مدل‌های پایدار پیش‌فرض (Static Fallback Catalog) سوئیچ می‌کند.',
  },
  {
    endpoint: '/api/auth/otp/request',
    methods: ['POST'],
    sourceFile: 'src/app/api/auth/otp/request/route.ts',
    zoneScope: 'tenant',
    technicalSummaryFa:
      'بررسی مجاز بودن ایمیل سازمانی کاربر در لیست دامنه یا ایمیل‌های مجاز Tenant، تولید کد ۶ رقمی یک‌بارمصرف (OTP) با هش امنیتی و ارسال از طریق Resend API (یا نمایش کد Sandbox در محیط دمو/تست).',
    nonTechnicalSummaryFa:
      'ارسال کد تایید ۶ رقمی به ایمیل کاری کارمندان شرکت مشتری برای ورود بدون نیاز به حفظ کردن رمز عبور.',
    errorProtectionFa:
      'جلوگیری از ورود افراد غیرعضو شرکت، محدودیت تعداد درخواست کد و حالت پشتیبان Sandbox در صورت عدم تنظیم سرویس ایمیل.',
  },
  {
    endpoint: '/api/auth/otp/verify',
    methods: ['POST'],
    sourceFile: 'src/app/api/auth/otp/verify/route.ts',
    zoneScope: 'tenant',
    technicalSummaryFa:
      'اعتبارسنجی کد ۶ رقمی OTP در برابر هش ذخیره‌شده و انقضای زمانی، ثبت هویت کاربر در دیتابیس اختصاصی مشتری و صدور کوکی نشست قفل‌شده به همان ساب‌دامین.',
    nonTechnicalSummaryFa:
      'بررسی کد ۶ رقمی واردشده توسط کاربر و باز کردن قفل محیط کاری شرکت برای او.',
    errorProtectionFa:
      'ابطال خودکار کد پس از انقضا یا تلاش‌های اشتباه متوالی و قفل کردن نشست کاربر فقط به ساب‌دامین همان شرکت.',
  },
  {
    endpoint: '/api/auth/session',
    methods: ['GET', 'POST', 'DELETE'],
    sourceFile: 'src/app/api/auth/session/route.ts',
    zoneScope: 'tenant',
    technicalSummaryFa:
      'مدیریت نشست فعال کاربر درون محیط کاری، ثبت Attribution (نام، ایمیل و دپارتمان کاربر) و خروج امن (Sign Out) با پاک‌سازی کوکی نشست.',
    nonTechnicalSummaryFa:
      'مشخص می‌کند چه کسی پشت سیستم نشسته تا هر سند یا تصمیمی به نام همان شخص ثبت شود و امکان خروج امن را فراهم می‌کند.',
    errorProtectionFa:
      'اعتبارسنجی ساختار ایمیل با Zod و جلوگیری از نشت نشست یک ساب‌دامین به ساب‌دامین دیگر.',
  },
  {
    endpoint: '/api/brain/audit',
    methods: ['GET', 'POST', 'DELETE'],
    sourceFile: 'src/app/api/brain/audit/route.ts',
    zoneScope: 'tenant',
    technicalSummaryFa:
      'موتور اصلی ممیزی تصمیم مدیریتی با استریم ضربان قلب NDJSON (۸ ثانیه‌ای): اجرای موازی (Promise.all) جستجوی برداری ۷۶۸ بُعدی و انتخاب مدل Gemini، سنتز گزارش JSON با تایم‌اوت ۱۸ ثانیه‌ای به ازای هر مدل، اعمال قوانین قطعی آلمان (BetrVG/DSGVO/EU AI Act/NIS-2) و ثبت تاریخچه.',
    nonTechnicalSummaryFa:
      'مغز تحلیلگر تصمیمات شرکت: تصمیم شما را با قوانین داخلی شرکت و قوانین کشور آلمان مقایسه کرده و کارنامه کامل ریسک و تطابق صادر می‌کند.',
    errorProtectionFa:
      'استریم ضربان قلب برای جلوگیری از تایم‌اوت ۳۰ ثانیه‌ای هروکو، Circuit Breaker ۱۵ دقیقه‌ای مدل‌ها و موتور قطعی پشتیبان (Heuristic Evaluator) در صورت قطعی کامل هوش مصنوعی.',
  },
  {
    endpoint: '/api/brain/documents',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    sourceFile: 'src/app/api/brain/documents/route.ts',
    zoneScope: 'tenant',
    technicalSummaryFa:
      'مدیریت اسناد مغز شرکت: تقطیع سلسله‌مراتبی اسناد به تکه‌های Parent (۲۰۰۰ کاراکتر) و Child (۴۰۰ کاراکتر)، تولید Embedding ۷۶۸ بُعدی، تشخیص خودکار تضاد قوانین (Conflict Detector)، ویرایش اتمیک چندبخشی و قفل Read-Only برای اسناد خارجی.',
    nonTechnicalSummaryFa:
      'کتابخانه هوشمند قوانین شرکت: ذخیره قوانین جدید، ویرایش آنلاین، تشخیص تضاد بین قوانین جدید و قدیم، و حفاظت از اسناد واردشده از سیستم‌های خارجی.',
    errorProtectionFa:
      'جلوگیری از دستکاری اسناد خارجی (Read-Only Guard)، جایگزینی اتمیک تمام بخش‌های سند هنگام ویرایش و حذف آبشاری (Cascade Delete) بردارها.',
  },
  {
    endpoint: '/api/brain/extract',
    methods: ['POST'],
    sourceFile: 'src/app/api/brain/extract/route.ts',
    zoneScope: 'tenant',
    technicalSummaryFa:
      'درگاه استخراج چندوجهی (Multimodal) با استریم ضربان قلب NDJSON: دریافت فایل‌های PDF، PPTX، تصویر و صدای ضبط‌شده، ارسال Base64 inlineData به Gemini با تایم‌اوت ۱۸ ثانیه‌ای و Circuit Breaker، و بازگرداندن متن ساختاریافته.',
    nonTechnicalSummaryFa:
      'مترجم فایل‌ها و صداها: فایل PDF، پاورپوینت، عکس یا صدای ضبط‌شده شما را می‌گیرد و متن تمیز آن را استخراج می‌کند.',
    errorProtectionFa:
      'ارسال اولین ضربان قلب در کمتر از ۵ میلی‌ثانیه برای جلوگیری از خطای H12 هروکو روی فایل‌های سنگین + استخراج‌کننده بافر داخلی در صورت عدم دسترسی به Gemini.',
  },
  {
    endpoint: '/api/connectors',
    methods: ['GET', 'POST'],
    sourceFile: 'src/app/api/connectors/route.ts',
    zoneScope: 'tenant',
    technicalSummaryFa:
      'مدیریت ۷ کانکتور سازمانی (Slack, MS Teams, Confluence, Notion, Google Drive, Zoom, Google Meet): ذخیره توکن‌های ماسک‌شده، تغییر وضعیت سوئیچ iOS و همگام‌سازی واقعی Google Drive با بررسی SHA-256 Checksum جهت مصرف صفر توکن در صورت عدم تغییر فایل.',
    nonTechnicalSummaryFa:
      'مرکز اتصال به ابزارهای شرکت (مثل گوگل درایو و اسلک) برای وارد کردن خودکار اسناد با قابلیت تشخیص هوشمند فایل‌های تکراری.',
    errorProtectionFa:
      'ماسک کردن فوری کلیدهای API، جلوگیری از روشن شدن کانکتور بدون کلید، و مکانیزم Checksum برای جلوگیری از پردازش دوباره فایل‌های بدون تغییر.',
  },
  {
    endpoint: '/api/health',
    methods: ['GET'],
    sourceFile: 'src/app/api/health/route.ts',
    zoneScope: 'shared',
    technicalSummaryFa:
      'گزارش وضعیت سلامت لحظه‌ای سرور، وضعیت اتصال MongoDB، پیکربندی کلید Gemini، تعداد اسناد و بردارهای بارگذاری‌شده در حافظه و متریک‌های سیستم.',
    nonTechnicalSummaryFa:
      'نبض‌سنج سلامت سرور که نشان می‌دهد دیتابیس، هوش مصنوعی و حافظه سیستم در چه وضعیتی هستند.',
    errorProtectionFa:
      'پاسخگویی سریع بدون وابستگی به عملیات سنگین خارجی برای مانیتورینگ آپ‌تایم.',
  },
  {
    endpoint: '/api/system/logs/stream',
    methods: ['GET', 'POST'],
    sourceFile: 'src/app/api/system/logs/stream/route.ts',
    zoneScope: 'admin',
    technicalSummaryFa:
      'استریم زنده لاگ‌های سرور بر بستر Server-Sent Events (SSE) از Ring Buffer حافظه (۲۵۰ رخداد اخیر) با پاک‌سازی بازگشتی کلیدهای حساس (redactSensitiveMetadata).',
    nonTechnicalSummaryFa:
      'پخش زنده گزارش اتفاقات داخل سرور برای مدیر سیستم، بدون اینکه رمزها یا کلیدهای محرمانه در گزارش دیده شوند.',
    errorProtectionFa:
      'پاک‌سازی خودکار کلیدهای امنیتی با برچسب [REDACTED] و بستن تمیز استریم به محض بسته شدن تب مرورگر.',
  },
  {
    endpoint: '/api/tenant/context',
    methods: ['GET'],
    sourceFile: 'src/app/api/tenant/context/route.ts',
    zoneScope: 'tenant',
    technicalSummaryFa:
      'تشخیص و بازگرداندن اطلاعات Tenant فعال بر اساس هدرهای Middleware، وضعیت احراز هویت کاربر جاری و پرچم محیط دمو یا مشتری واقعی.',
    nonTechnicalSummaryFa:
      'به صفحه مرورگر اعلام می‌کند که کاربر الان وارد کدام شرکت شده و آیا قبلاً لاگین کرده است یا خیر.',
    errorProtectionFa:
      'رد درخواست در صورت تعلیق بودن Tenant یا عدم تطابق امضای کوکی با ساب‌دامین فعلی.',
  },
];

export const DOCUMENTED_CORE_MODULES: readonly DocumentedCoreModuleSpec[] = [
  {
    id: 'edge-zone-routing',
    layer: 'Edge & Routing',
    moduleName: 'Edge Subdomain Resolver & Zone Router',
    sourceFiles: [
      'src/middleware.ts',
      'src/core/tenancy/hostResolver.ts',
      'src/core/tenancy/zoneRouting.ts',
      'src/core/tenancy/tenantModel.ts',
    ],
    responsibilityFa:
      'تفکیک لحظه‌ای ترافیک ورودی بر اساس Hostname به ۳ ناحیه مجزا: Marketing (mindmittel.de)، Control Plane (admin.mindmittel.de) و Tenant Workspace (<slug>.mindmittel.de) و مسدودسازی دسترسی متقاطع.',
    interactionWithOtherModulesFa:
      'هدرهای x-mindmittel-zone و x-mindmittel-tenant را تزریق کرده و درخواست را به tenantRequestGuard و صفحات مربوطه تحویل می‌دهد.',
    failureRecoveryFa:
      'هرگونه درخواست به مسیرهای ادمین از روی ساب‌دامین مشتری را در لایه Edge با کد 404 متوقف می‌کند.',
  },
  {
    id: 'tenant-isolation-guard',
    layer: 'Infrastructure (src/infrastructure)',
    moduleName: 'AsyncLocalStorage Tenant Context & DB Pool Manager',
    sourceFiles: [
      'src/infrastructure/tenancy/tenantContext.ts',
      'src/infrastructure/http/tenantRequestGuard.ts',
      'src/infrastructure/db/mongo.ts',
      'src/infrastructure/db/databaseTarget.ts',
      'src/infrastructure/tenancy/tenantRepository.ts',
    ],
    responsibilityFa:
      'ایجاد کانتکست ایزوله به ازای هر درخواست HTTP با Node AsyncLocalStorage تا تمام کوئری‌های دیتابیس و فراخوانی‌های Gemini به صورت خودکار به دیتابیس (mindmittel_<slug>) و کلید اختصاصی همان مشتری متصل شوند.',
    interactionWithOtherModulesFa:
      'توسط تمام Route Handlerهای مشتری فراخوانی شده و دیتابیس فعال را در اختیار brainRepository و otpService قرار می‌دهد.',
    failureRecoveryFa:
      'استفاده از Shared MongoClient برای مشتریان کلاستر پیش‌فرض و LRU Cache محدود برای مشتریان دارای URI اختصاصی جهت جلوگیری از پر شدن رم ۵۱۲ مگابایتی هروکو.',
  },
  {
    id: 'heartbeat-streaming',
    layer: 'Infrastructure (src/infrastructure)',
    moduleName: 'NDJSON 8-Second Heartbeat Streaming Engine',
    sourceFiles: [
      'src/infrastructure/http/streamingResponse.ts',
      'src/app/page.tsx',
    ],
    responsibilityFa:
      'ارسال فوری اولین بایت پاسخ HTTP در کمتر از ۵ میلی‌ثانیه و تداوم ارسال ضربان قلب ({"type":"heartbeat"}) هر ۸ ثانیه در طول پردازش‌های سنگین هوش مصنوعی.',
    interactionWithOtherModulesFa:
      'مسیرهای /api/brain/extract و /api/brain/audit را پوشش داده و در سمت کلاینت توسط fetchJsonWithHeartbeat رمزگشایی می‌شود.',
    failureRecoveryFa:
      'تایم‌اوت سخت ۳۰ ثانیه‌ای روتر هروکو (H12) را به پنجره‌های ۵۵ ثانیه‌ای تمدیدشونده تبدیل می‌کند و حتی در صورت خطای شبکه، جلوی کرش JSON.parse روی صفحات HTML را می‌گیرد.',
  },
  {
    id: 'gemini-router-circuit-breaker',
    layer: 'Domain Core (src/core)',
    moduleName: 'Autonomous Gemini Model Selector & 15m Circuit Breaker',
    sourceFiles: [
      'src/core/ai/modelRanking.ts',
      'src/infrastructure/gemini/modelSelector.ts',
      'src/infrastructure/gemini/embeddingService.ts',
      'src/infrastructure/tenancy/geminiKey.ts',
    ],
    responsibilityFa:
      'تشخیص خودکار پیچیدگی درخواست (fast در برابر reasoning)، امتیازدهی به مدل‌های زنده گوگل، اجرای حلقه Fallback با تایم‌اوت ۱۸ ثانیه‌ای و قرنطینه ۱۵ دقیقه‌ای مدل‌های معیوب.',
    interactionWithOtherModulesFa:
      'سرویس پایه برای استخراج فایل (/api/brain/extract)، ممیزی تصمیم (/api/brain/audit) و تولید بردارهای ۷۶۸ بُعدی.',
    failureRecoveryFa:
      'تشخیص خطاهای HTTP 404/429/5xx و خطاهای شبکه (TypeError: fetch failed / TimeoutError)، قرنطینه ۱۵ دقیقه‌ای مدل خراب برای عبور ۰ میلی‌ثانیه‌ای در درخواست‌های بعدی و تضمین حضور مدل پایدار خانواده 2.x در انتهای زنجیره.',
  },
  {
    id: 'parent-child-rag-engine',
    layer: 'Domain Core (src/core)',
    moduleName: 'Hierarchical Parent-Child RAG, Vector Math & Conflict Detector',
    sourceFiles: [
      'src/core/rag/chunker.ts',
      'src/core/rag/vectorMath.ts',
      'src/core/rag/conflictDetector.ts',
      'src/core/rag/multimodalExtractor.ts',
      'src/infrastructure/rag/brainRepository.ts',
    ],
    responsibilityFa:
      'تقطیع اسناد به تکه‌های والد (۲۰۰۰ کاراکتر جهت حفظ زمینه کامل قانون) و فرزند (۴۰۰ کاراکتر با همپوشانی ۸۰ کاراکتر جهت دقت بالای جستجوی برداری ۷۶۸ بُعدی)، تشخیص تضاد قوانین و مدیریت Vault دوگانه.',
    interactionWithOtherModulesFa:
      'با embeddingService برای بردارسازی و با mongo.ts برای ذخیره‌سازی پایدار در کالکشن‌های raw_documents و vector_store تعامل دارد.',
    failureRecoveryFa:
      'هیدراتاسیون خودکار حافظه از MongoDB هنگام بالا آمدن سرور، موتور بردارساز قطعی ۷۶۸ بُعدی در صورت آفلاین بودن Gemini و پشتیبانی از حذف موقت دمو و استثنای یک‌باره (1x Exclude).',
  },
  {
    id: 'hybrid-audit-german-law',
    layer: 'Domain Core (src/core)',
    moduleName: 'Hybrid Decision Evaluator & Deterministic DACH Regulatory Advisor',
    sourceFiles: [
      'src/core/audit/decisionEvaluator.ts',
      'src/core/audit/germanRegulatoryAdvisor.ts',
    ],
    responsibilityFa:
      'ترکیب تحلیل عمیق LLM با قواعد قطعی و غیرقابل‌چشم‌پوشی قوانین آلمان و اروپا (BetrVG §87/§111 شورای کار، DSGVO ماده ۳۵/۲۸، EU AI Act و NIS-2) به همراه شفافیت اسناد کنارگذاشته‌شده (Excluded Documents Disclosure).',
    interactionWithOtherModulesFa:
      'نتایج جستجوی برداری را از brainRepository گرفته و پس از سنتز Gemini، قوانین آلمان را به صورت قطعی روی گزارش اعمال می‌کند.',
    failureRecoveryFa:
      'اگر مدل LLM به هر دلیلی در دسترس نباشد، موتور evaluateDecisionAgainstPoliciesHeuristic به صورت ۱۰۰٪ قطعی تصمیم را با قوانین شرکت می‌سنجد؛ قوانین آلمان همیشه بعد از LLM اعمال می‌شوند تا توهم هوش مصنوعی نتواند الزام قانونی را نادیده بگیرد.',
  },
  {
    id: 'security-crypto-primitives',
    layer: 'Domain Core (src/core)',
    moduleName: 'Cryptographic Security Suite (AES-256-GCM, scrypt, HMAC, OTP)',
    sourceFiles: [
      'src/core/security/secretBox.ts',
      'src/core/security/passwordHash.ts',
      'src/core/security/sessionToken.ts',
      'src/core/security/rateLimiter.ts',
      'src/core/auth/otp.ts',
      'src/infrastructure/security/masterKey.ts',
      'src/infrastructure/auth/otpService.ts',
    ],
    responsibilityFa:
      'رمزنگاری کلیدهای API مشتریان با AES-256-GCM، هش کردن رمزها با scrypt، امضای توکن‌های نشست با HMAC-SHA256 و اعتبارسنجی زمان‌ثابت (timingSafeEqual).',
    interactionWithOtherModulesFa:
      'امنیت تمام نشست‌های ادمین، مشتریان و ذخیره‌سازی کلیدهای Gemini/MongoDB را در لایه پایه تامین می‌کند.',
    failureRecoveryFa:
      'جلوگیری از حملات Timing، مسدودسازی Brute-Force و استخراج کلید رمزنگاری پایدار حتی در صورت عدم تعریف متغیر محیطی در محیط توسعه.',
  },
];

export const PERSIAN_TECHNICAL_ARCHITECTURE_DOC: {
  title: string;
  subtitle: string;
  version: string;
  lastUpdatedPolicyFa: string;
  diagrams: readonly VisualFlowDiagramSpec[];
  sections: readonly PersianDocSectionSpec[];
  nodeTranslations: readonly PersianNodeTranslationSpec[];
} = {
  title: 'سند جامع فنی و معماری مهندسی سیستم (Technical Architecture Specification)',
  subtitle:
    'مرجع زنده معماری لایه‌ای DDD، ایزولاسیون چندمستاجری (Multi-Tenant)، پایپ‌لاین RAG والد-فرزند ۷۶۸ بُعدی، مسیریاب پویای Gemini با Circuit Breaker و استریم ضربان قلب NDJSON',
  version: 'v2.4 — Enterprise Resilience Edition',
  lastUpdatedPolicyFa:
    'این سند به صورت مستقیم به رجیستری کد متصل است و طبق قانون اجباری پروژه (.agents/rules/living-persian-docs.md) و گیت تست خودکار Vitest، با هر تغییر در کد به‌روزرسانی می‌شود.',
  diagrams: [
    {
      id: 'layered-ddd-topology',
      titleFa: 'دیاگرام ۱: توپولوژی لایه‌ای و جریان داده سراسری (End-to-End Layered Architecture)',
      subtitleFa: 'جداسازی سخت‌گیرانه Functional Core از Imperative Shell در ۵ لایه',
      summaryFa:
        'هر درخواست HTTP از لایه Edge Middleware عبور کرده، در لایه Tenant Guard به دیتابیس و کلید هوش مصنوعی اختصاصی همان شرکت مقید می‌شود و پس از پردازش در هسته دامنه، نتیجه را از طریق استریم NDJSON برمی‌گرداند.',
      steps: [
        {
          stepNumber: 'Layer 1',
          titleFa: 'لایه لبه و تفکیک ساب‌دامین (Edge Middleware)',
          subtitleEn: 'src/middleware.ts + hostResolver.ts',
          descriptionFa:
            'بررسی Hostname درخواست و تفکیک به ۳ زون ایزوله: Marketing (mindmittel.de)، Control Plane (admin.mindmittel.de) و Tenant (<slug>.mindmittel.de). مسدودسازی فوری مسیرهای غیرمجاز با 404.',
          badgeText: 'Edge Routing (< 1ms)',
          tone: 'blue',
        },
        {
          stepNumber: 'Layer 2',
          titleFa: 'گارد امنیتی و کانتکست ایزوله مشتری (Tenant Guard & AsyncLocalStorage)',
          subtitleEn: 'tenantRequestGuard.ts + tenantContext.ts',
          descriptionFa:
            'اعتبارسنجی کوکی HttpOnly امضاشده با HMAC-SHA256، رمزگشایی کلید اختصاصی Gemini با AES-256-GCM و اتصال خودکار درخواست به دیتابیس اختصاصی mindmittel_<slug>.',
          badgeText: 'Zero Cross-Tenant Leak',
          tone: 'indigo',
        },
        {
          stepNumber: 'Layer 3',
          titleFa: 'لایه استریم ضربان قلب HTTP (NDJSON Heartbeat Stream)',
          subtitleEn: 'src/infrastructure/http/streamingResponse.ts',
          descriptionFa:
            'در صورت وجود هدر x-mindmittel-stream: 1، ارسال فوری اولین بسته ضربان قلب در کمتر از ۵ میلی‌ثانیه و تکرار هر ۸ ثانیه تا پایان کار جهت خنثی‌سازی کامل تایم‌اوت ۳۰ ثانیه‌ای H12 هروکو.',
          badgeText: '8s Keep-Alive Stream',
          tone: 'emerald',
        },
        {
          stepNumber: 'Layer 4',
          titleFa: 'هسته دامنه: RAG والد-فرزند، ممیزی تصمیم و قوانین آلمان (Domain Core)',
          subtitleEn: 'src/core/rag/* + src/core/audit/*',
          descriptionFa:
            'تقطیع اسناد به Parent (2000c) و Child (400c)، جستجوی کسینوسی ۷۶۸ بُعدی، سنتز گزارش با Gemini و اعمال قطعی قوانین BetrVG §87/§111، DSGVO، EU AI Act و NIS-2.',
          badgeText: 'Hybrid AI + Statutory Law',
          tone: 'amber',
        },
        {
          stepNumber: 'Layer 5',
          titleFa: 'لایه زیرساخت: Circuit Breaker هوش مصنوعی و Vault دوگانه دیتابیس',
          subtitleEn: 'modelSelector.ts + brainRepository.ts + mongo.ts',
          descriptionFa:
            'مسیریابی پویای مدل‌های Gemini با قرنطینه ۱۵ دقیقه‌ای مدل‌های معیوب + ذخیره‌سازی هم‌زمان در MongoDB Atlas و In-Memory Mirror برای بازیابی برداری در کسری از میلی‌ثانیه.',
          badgeText: '15m Circuit Breaker + Atlas',
          tone: 'slate',
        },
      ],
    },
    {
      id: 'heartbeat-circuit-breaker-flow',
      titleFa: 'دیاگرام ۲: فلوچارت ضدتایم‌اوت استریم ضربان قلب و Circuit Breaker پانزده‌دقیقه‌ای',
      subtitleFa: 'نحوه حذف خطای H12 هروکو و عبور ۰ میلی‌ثانیه‌ای از مدل‌های معیوب گوگل',
      summaryFa:
        'این فلوچارت نشان می‌دهد چطور مشکل هنگ کردن مدل‌های آزمایشی (مانند gemini-3.8-flash با خطای fetch failed) و محدودیت ۳۰ ثانیه‌ای روتر هروکو به صورت ریشه‌ای مهار شده است.',
      steps: [
        {
          stepNumber: 'T = 0ms',
          titleFa: 'ارسال درخواست با هدر x-mindmittel-stream: 1',
          subtitleEn: 'fetchJsonWithHeartbeat() in src/app/page.tsx',
          descriptionFa:
            'فرانت‌اند درخواست استخراج فایل (/api/brain/extract) یا ممیزی تصمیم (/api/brain/audit) را با هدر استریم ارسال می‌کند.',
          badgeText: 'Client Stream Init',
          tone: 'blue',
        },
        {
          stepNumber: 'T < 5ms',
          titleFa: 'شلیک اولین ضربان قلب و خنثی‌سازی تایم‌اوت ۳۰ ثانیه‌ای اولیه هروکو',
          subtitleEn: 'runWithHeartbeatStream() -> {"type":"heartbeat"}',
          descriptionFa:
            'سرور بلافاصله اولین خط NDJSON را روی استریم می‌نویسد. روتر هروکو اولین بایت را دریافت کرده و تایمر مرگبار ۳۰ ثانیه‌ای H12 به پنجره‌های ۵۵ ثانیه‌ای تمدیدشونده تبدیل می‌شود.',
          badgeText: 'H12 Disarmed',
          tone: 'emerald',
        },
        {
          stepNumber: 'Parallel',
          titleFa: 'اجرای موازی جستجوی برداری + انتخاب مدل سالم از خارج لیست قرنطینه',
          subtitleEn: 'Promise.all([searchBrain, selectModel, listDocs])',
          descriptionFa:
            'در مسیر ممیزی، جستجوی برداری و انتخاب مدل به صورت موازی اجرا می‌شوند. انتخابگر مدل هر مدلی را که در ۱۵ دقیقه اخیر خطا داده باشد در ۰ میلی‌ثانیه فیلتر می‌کند.',
          badgeText: '0ms Quarantine Skip',
          tone: 'indigo',
        },
        {
          stepNumber: 'Every 8s',
          titleFa: 'تپش ضربان قلب ۸ ثانیه‌ای + سقف ۱۸ ثانیه به ازای هر تلاش مدل',
          subtitleEn: 'setInterval(8000) + AbortSignal.timeout(18000)',
          descriptionFa:
            'اگر مدلی بیش از ۱۸ ثانیه مکث کند یا خطای fetch failed / 503 بدهد، بلافاصله به مدت ۱۵ دقیقه قرنطینه شده و درخواست بدون قطع شدن استریم به مدل بعدی (و در نهایت مدل پایدار 2.x) منتقل می‌شود.',
          badgeText: 'Auto-Failover',
          tone: 'amber',
        },
        {
          stepNumber: 'Final Frame',
          titleFa: 'ارسال بسته نهایی نتیجه و بستن تمیز استریم',
          subtitleEn: '{"type":"result","status":200,"data":{...}}',
          descriptionFa:
            'کلاینت خطوط ضربان قلب را نادیده گرفته و بسته نهایی data را با امنیت کامل استخراج می‌کند.',
          badgeText: 'Guaranteed JSON Delivery',
          tone: 'emerald',
        },
      ],
    },
    {
      id: 'parent-child-rag-pipeline',
      titleFa: 'دیاگرام ۳: پایپ‌لاین RAG سلسله‌مراتبی والد-فرزند و تشخیص تضاد قوانین',
      subtitleFa: 'چرا جستجو روی تکه‌های ۴۰۰ کاراکتری انجام می‌شود اما متن ۲۰۰۰ کاراکتری به هوش مصنوعی داده می‌شود؟',
      summaryFa:
        'در معماری Parent-Child RAG، دقت بالای جستجوی برداری روی جملات کوتاه (Child) با درک کامل زمینه حقوقی و سازمانی (Parent) ترکیب می‌شود.',
      steps: [
        {
          stepNumber: 'Step 1',
          titleFa: 'دریافت متن، PDF، پاورپوینت، تصویر یا صدای زنده',
          subtitleEn: 'multimodalExtractor.ts + /api/brain/extract',
          descriptionFa:
            'فایل یا صدای کاربر دسته‌بندی شده و از طریق Gemini Multimodal به متن ساختاریافته و تمیز تبدیل می‌شود.',
          badgeText: 'Multimodal Ingestion',
          tone: 'blue',
        },
        {
          stepNumber: 'Step 2',
          titleFa: 'برش سلسله‌مراتبی به Parent (۲۰۰۰ کاراکتر) و Child (۴۰۰ کاراکتر)',
          subtitleEn: 'sliceIntoParentChildChunks() in src/core/rag/chunker.ts',
          descriptionFa:
            'سند ابتدا به بخش‌های بزرگ ۲۰۰۰ کاراکتری (Parent) تقسیم می‌شود و هر بخش بزرگ به تکه‌های ۴۰۰ کاراکتری با ۸۰ کاراکتر همپوشانی (Child) شکسته می‌شود تا هیچ جمله‌ای در مرز برش ناقص نشود.',
          badgeText: '2000c Parent / 400c Child',
          tone: 'indigo',
        },
        {
          stepNumber: 'Step 3',
          titleFa: 'تولید بردار ۷۶۸ بُعدی و تشخیص تضاد با قوانین قبلی',
          subtitleEn: 'generateGeminiEmbedding768() + detectKnowledgeConflicts()',
          descriptionFa:
            'برای هر Child یک بردار ۷۶۸ عددی ساخته می‌شود و هم‌زمان موتور Conflict Detector بررسی می‌کند آیا ارقام، بودجه‌ها یا سیاست‌های سند جدید با قوانین قبلی تضاد دارد یا خیر.',
          badgeText: '768-d Vector + Conflict Check',
          tone: 'amber',
        },
        {
          stepNumber: 'Step 4',
          titleFa: 'ذخیره‌سازی دوگانه در MongoDB Atlas و In-Memory Mirror',
          subtitleEn: 'brainRepository.ts (raw_documents & vector_store)',
          descriptionFa:
            'اسناد والد در raw_documents و بردارهای فرزند در vector_store ذخیره می‌شوند و هم‌زمان در کش حافظه سرور قرار می‌گیرند تا جستجوی کسینوسی بدون تاخیر شبکه انجام شود.',
          badgeText: 'Dual-Layer Persistence',
          tone: 'emerald',
        },
      ],
    },
  ],
  sections: [
    {
      id: 'multi-tenant-isolation',
      badgeFa: 'معماری چندمستاجری و امنیت',
      titleFa: '۱. معماری Multi-Tenant مبتنی بر ساب‌دامین و ایزولاسیون سخت دیتابیس',
      subtitleEn: 'Subdomain Zone Routing, AsyncLocalStorage & AES-256-GCM Secret Box',
      summaryFa:
        'پلتفرم بر پایه ایزولاسیون کامل در سطح شبکه (Subdomain Zone) و سطح داده (Database-per-Tenant) طراحی شده است تا داده‌های هیچ شرکتی حتی در سطح کوئری با شرکت دیگر تلاقی نداشته باشد.',
      bulletsFa: [
        {
          headingFa: 'تفکیک سه ناحیه در لایه Edge Middleware',
          bodyFa:
            'فایل src/middleware.ts به کمک resolveHostZone() و routeRequestForZone() ترافیک را پیش از رسیدن به Route Handlerها به سه ناحیه تقسیم می‌کند: دامنه اصلی (mindmittel.de) به صفحه مارکتینگ، ساب‌دامین admin.mindmittel.de به پنل مالک محصول و مسیرهای /admin و /system، و هر ساب‌دامین مشتری (<slug>.mindmittel.de) به محیط کاری ایزوله همان شرکت هدایت می‌شود.',
          codeRef: 'src/middleware.ts, src/core/tenancy/zoneRouting.ts',
        },
        {
          headingFa: 'ایزولاسیون کانتکست با AsyncLocalStorage',
          bodyFa:
            'گارد withTenantApi در src/infrastructure/http/tenantRequestGuard.ts کوکی نشست کاربر را با کلید امضای HMAC-SHA256 بررسی می‌کند و تضمین می‌نماید که توکن صادرشده برای شرکت A روی ساب‌دامین شرکت B قابل استفاده نباشد. سپس اطلاعات دیتابیس (mindmittel_<slug>) و کلید رمزگشایی‌شده Gemini را درون Node AsyncLocalStorage قرار می‌دهد.',
          codeRef: 'src/infrastructure/http/tenantRequestGuard.ts, src/infrastructure/tenancy/tenantContext.ts',
        },
        {
          headingFa: 'مدیریت بهینه استخر اتصال MongoDB روی هروکو',
          bodyFa:
            'برای جلوگیری از مصرف بیش از حد حافظه RAM (محدودیت ۵۱۲ مگابایتی Dyno هروکو)، تمام مشتریانی که روی کلاستر پیش‌فرض Atlas هستند از یک MongoClient مشترک با client.db("mindmittel_<slug>") استفاده می‌کنند و مشتریان دارای سرور دیتابیس اختصاصی در یک استخر LRU با حداکثر ۸ کلاینت هم‌زمان مدیریت می‌شوند.',
          codeRef: 'src/infrastructure/db/mongo.ts',
        },
      ],
    },
    {
      id: 'gemini-router-circuit-breaker-spec',
      badgeFa: 'مسیریابی هوش مصنوعی و پایداری',
      titleFa: '۲. انتخابگر خودکار مدل‌های Gemini و Circuit Breaker پانزده‌دقیقه‌ای',
      subtitleEn: 'Autonomous Intent Classification, Model Ranking & 15-Minute Quarantine',
      summaryFa:
        'سیستم به جای هاردکد کردن نام یک مدل، لیست زنده مدل‌های گوگل را استعلام کرده، بر اساس پیچیدگی تصمیم امتیازدهی می‌کند و مدل‌های ناپایدار را به صورت خودکار قرنطینه می‌نماید.',
      bulletsFa: [
        {
          headingFa: 'تشخیص خودکار پروفایل Fast در برابر Reasoning',
          bodyFa:
            'تابع inferProfileFromQuery() متن پیشنهاد تصمیم را تحلیل می‌کند؛ تصمیمات استراتژیک، ادغام، بودجه‌های سنگین، معماری امنیتی و حقوقی به پروفایل reasoning (مدل‌های خانواده Pro) و عملیات سریع یا استخراج متن به پروفایل fast (خانواده Flash) هدایت می‌شوند.',
          codeRef: 'src/core/ai/modelRanking.ts',
        },
        {
          headingFa: 'قرنطینه ۱۵ دقیقه‌ای مدل‌های معیوب (Circuit Breaker)',
          bodyFa:
            'در src/infrastructure/gemini/modelSelector.ts نقشه unhealthyUntilByModel نگهداری می‌شود. اگر مدلی با خطای HTTP (404, 429, 500, 502, 503, 504) یا خطای شبکه/تایم‌اوت (TypeError: fetch failed, TimeoutError, AbortError) مواجه شود، به مدت ۱۵ دقیقه قرنطینه می‌شود تا درخواست‌های بعدی در ۰ میلی‌ثانیه از روی آن عبور کنند.',
          codeRef: 'src/infrastructure/gemini/modelSelector.ts',
        },
        {
          headingFa: 'تضمین حضور مدل پایدار نسل 2.x در انتهای زنجیره Fallback',
          bodyFa:
            'اگر تمام مدل‌های صدر جدول امتیازدهی از خانواده آزمایشی 3.x باشند، انتخابگر مدل به صورت خودکار بالاترین مدل پایدار خانواده 2.x (مانند gemini-2.5-flash یا gemini-2.5-pro) را به انتهای زنجیره fallbackChain اضافه می‌کند.',
          codeRef: 'src/infrastructure/gemini/modelSelector.ts',
        },
      ],
    },
    {
      id: 'ndjson-heartbeat-streaming-spec',
      badgeFa: 'معماری شبکه و ضدتایم‌اوت',
      titleFa: '۳. پروتکل استریم ضربان قلب NDJSON برای ایمنی ۱۰۰٪ در برابر خطای H12 هروکو',
      subtitleEn: 'NDJSON Keep-Alive Heartbeat Stream (streamingResponse.ts)',
      summaryFa:
        'روتر هروکو هر درخواستی را که تا ۳۰ ثانیه اولین بایت پاسخ را ارسال نکند با کد 503 H12 و صفحه HTML قطع می‌کند. پروتکل استریم ضربان قلب این محدودیت را به طور کامل خنثی کرده است.',
      bulletsFa: [
        {
          headingFa: 'پاسخ زیر ۵ میلی‌ثانیه و ضربان ۸ ثانیه‌ای',
          bodyFa:
            'تابع runWithHeartbeatStream() به محض دریافت هدر x-mindmittel-stream: 1، یک ReadableStream با Content-Type: application/x-ndjson باز می‌کند، در لحظه شروع خط {"type":"heartbeat","ts":...} را می‌فرستد و هر ۸ ثانیه یک ضربان جدید ارسال می‌کند تا پنجره ۵۵ ثانیه‌ای هروکو باز بماند.',
          codeRef: 'src/infrastructure/http/streamingResponse.ts',
        },
        {
          headingFa: 'سازگاری کامل با کلاینت‌های استاندارد و تست‌های واحد',
          bodyFa:
            'اگر درخواستی بدون هدر x-mindmittel-stream: 1 ارسال شود (مانند تست‌های Vitest یا کلاینت‌های REST خارجی)، همان تابع به صورت شفاف یک پاسخ استاندارد NextResponse.json برمی‌گرداند.',
          codeRef: 'src/infrastructure/http/streamingResponse.ts',
        },
        {
          headingFa: 'پارسر ایمن فرانت‌اند (fetchJsonWithHeartbeat)',
          bodyFa:
            'در src/app/page.tsx تابع fetchJsonWithHeartbeat خطوط دریافتی را از آخر به اول پیمایش کرده، بسته {"type":"result","data":...} را استخراج می‌کند و در صورت دریافت هرگونه HTML غیرمنتظره از پروکسی، به جای کرش کردن با Unexpected token <، پیام خطای محلی‌سازی‌شده نمایش می‌دهد.',
          codeRef: 'src/app/page.tsx',
        },
      ],
    },
    {
      id: 'rag-and-document-governance',
      badgeFa: 'موتور دانش و حاکمیت اسناد',
      titleFa: '۴. موتور RAG والد-فرزند، ویرایش اتمیک، حفاظت Read-Only و استثنای موقت (1x Exclude)',
      subtitleEn: 'Parent-Child Vector Store, Atomic Multi-Section Update & Ephemeral Exclusion',
      summaryFa:
        'مغز شرکت علاوه بر جستجوی معنایی ۷۶۸ بُعدی، قواعد حاکمیت داده سازمانی (تغییرناپذیری اسناد خارجی و استثنای موقت یک‌باره با افشای رسمی در گزارش) را اجرا می‌کند.',
      bulletsFa: [
        {
          headingFa: 'هیدراتاسیون دوگانه از MongoDB Atlas به حافظه سرور',
          bodyFa:
            'تابع ensureTenantSeeded() هنگام اولین درخواست هر Tenant، هم کالکشن raw_documents (والدها) و هم کالکشن vector_store (فرزندان و بردارهای ۷۶۸ بُعدی) را به داخل حافظه سرور هیدراته می‌کند تا جستجوی کسینوسی در کسری از میلی‌ثانیه انجام شود.',
          codeRef: 'src/infrastructure/rag/brainRepository.ts',
        },
        {
          headingFa: 'قفل Read-Only برای اسناد همگام‌سازی‌شده از منابع خارجی',
          bodyFa:
            'اسنادی که از طریق کانکتورهای خارجی (Google Drive, Slack, Confluence, Notion, MS Teams, Zoom, Google Meet) وارد می‌شوند دارای پرچم isExternalSource: true هستند. متدهای updateBrainDocument و deleteBrainDocument هرگونه تلاش برای ویرایش یا حذف دستی آن‌ها را با خطای 403 مسدود می‌کنند.',
          codeRef: 'src/infrastructure/rag/brainRepository.ts, src/app/api/brain/documents/route.ts',
        },
        {
          headingFa: 'استثنای یک‌باره (1x Exclude) با افشای رسمی در گزارش ممیزی',
          bodyFa:
            'کاربر می‌تواند یک یا چند سند را فقط برای تصمیم بعدی (nextAuditExcludedIds) از دایره شمول ممیزی خارج کند. سرور این اسناد را از جستجوی برداری کنار می‌گذارد اما عنوان و شناسه آن‌ها را در فیلد report.excludedDocuments ثبت می‌کند تا در گزارش نهایی و نسخه چاپی PDF به صورت شفاف افشا شود و بلافاصله پس از اتمام آنالیز، سند به حالت فعال برمی‌گردد.',
          codeRef: 'src/app/api/brain/audit/route.ts, src/app/page.tsx',
        },
      ],
    },
    {
      id: 'hybrid-audit-german-regulatory',
      badgeFa: 'موتور ممیزی و قوانین آلمان',
      titleFa: '۵. موتور ممیزی هیبریدی و مشاور قطعی قوانین رگولاتوری آلمان (DACH Statutory Engine)',
      subtitleEn: 'Hybrid LLM Synthesis + Deterministic BetrVG, DSGVO, EU AI Act & NIS-2 Screening',
      summaryFa:
        'ارزیابی تصمیمات در دو فاز مکمل انجام می‌شود: فاز اول تحلیل معنایی و سنتز JSON توسط Gemini بر اساس اسناد داخلی شرکت، و فاز دوم غربالگری قطعی بر اساس قوانین لازم‌الاجرای آلمان و اتحادیه اروپا.',
      bulletsFa: [
        {
          headingFa: 'غربالگری قطعی قوانین آلمان که توسط LLM قابل دور زدن نیست',
          bodyFa:
            'ماژول src/core/audit/germanRegulatoryAdvisor.ts پس از تولید پاسخ LLM اجرا می‌شود و پیشنهاد تصمیم را در برابر ۴ چارچوب قانونی بررسی می‌کند: ۱) BetrVG §87 Abs. 1 Nr. 6 و §111 (حق تصمیم‌گیری مشترک شورای کار / Betriebsrat هنگام معرفی ابزارهای نرم‌افزاری یا تغییرات ساختاری)، ۲) DSGVO Art. 35/28 (ارزیابی پیامدهای حریم خصوصی DSFA و قرارداد AVV)، ۳) EU AI Act و ۴) NIS-2 / BSI.',
          codeRef: 'src/core/audit/germanRegulatoryAdvisor.ts',
        },
        {
          headingFa: 'تعدیل خودکار حکم نهایی (Verdict Downgrade Guard)',
          bodyFa:
            'تابع applyGermanAdvisoryToReport() تضمین می‌کند که اگر قوانین داخلی شرکت با تصمیم مشکلی نداشته باشند (حکم CERTIFIED)، اما تصمیم مشمول الزام قانونی شورای کار (Betriebsrat) یا DSGVO در آلمان باشد، حکم نهایی به صورت خودکار به CONDITIONAL تغییر یافته و هشدار قانونی به نقشه راه اضافه شود.',
          codeRef: 'src/core/audit/germanRegulatoryAdvisor.ts',
        },
        {
          headingFa: 'تشخیص شکاف دانشی (Knowledge Coverage Classification)',
          bodyFa:
            'اگر در مغز شرکت هیچ سندی مرتبط با موضوع تصمیم وجود نداشته باشد یا شباهت برداری کمتر از حد آستانه باشد، سیستم وضعیت UNCOVERED یا PARTIAL_GAP را ثبت کرده و دکمه Fill Knowledge Gap را فعال می‌کند تا کاربر قانون جدید را مستقیماً به مغز شرکت اضافه کند.',
          codeRef: 'src/core/audit/germanRegulatoryAdvisor.ts, src/app/page.tsx',
        },
      ],
    },
    {
      id: 'observability-security-and-zero-drift-gate',
      badgeFa: 'مشاهده‌پذیری و گیت کیفیت',
      titleFa: '۶. تله‌متری زنده SSE، رمزنگاری نظامی و گیت خودکار ضدِ انحراف مستندات',
      subtitleEn: 'Ring-Buffer SSE Telemetry, Cryptographic Secret Box & Pre-Commit Drift Guard',
      summaryFa:
        'لایه مشاهده‌پذیری و تضمین کیفیت تضمین می‌کند که هیچ کلید محرمانه‌ای در لاگ‌ها نشت نکند و هیچ تغییر کدی بدون به‌روزرسانی مستندات فارسی وارد مخزن نشود.',
      bulletsFa: [
        {
          headingFa: 'استریم لاگ‌های زنده SSE با سانسور بازگشتی کلیدها',
          bodyFa:
            'ماژول src/infrastructure/logging/logger.ts یک بافر حلقوی ۲۵۰ تایی در حافظه نگه می‌دارد و پیش از انتشار هر رخداد روی /api/system/logs/stream، تابع redactSensitiveMetadata() تمام فیلدهای حساس (apiKey, password, token, secret, authorization) را به صورت بازگشتی با [REDACTED] جایگزین می‌کند.',
          codeRef: 'src/infrastructure/logging/logger.ts, src/app/api/system/logs/stream/route.ts',
        },
        {
          headingFa: 'جعبه رمزنگاری AES-256-GCM و نشست‌های HMAC-SHA256',
          bodyFa:
            'کلیدهای Gemini و رشته اتصال MongoDB اختصاصی مشتریان با الگوریتم AES-256-GCM و کلید مادر رمزنگاری می‌شوند و نشست‌های کاربران با HMAC-SHA256 و مقایسه زمان‌ثابت (timingSafeEqual) محافظت می‌گردند.',
          codeRef: 'src/core/security/secretBox.ts, src/core/security/sessionToken.ts',
        },
        {
          headingFa: 'گیت خودکار تست Vitest و قانون پروژه (.agents/rules/living-persian-docs.md)',
          bodyFa:
            'تست خودکار tests/unit/system/loggerAndDocs.test.ts در هر بار اجرای npm test و پیش از هر git commit تمام فایل‌های src/app/api/**/route.ts و گره‌های ARCHITECTURE_NODES را اسکن کرده و در صورت عدم تطابق با persianLivingDocsRegistry.ts کامیت را متوقف می‌کند.',
          codeRef: 'tests/unit/system/loggerAndDocs.test.ts, .agents/rules/living-persian-docs.md',
        },
      ],
    },
  ],
  nodeTranslations: [
    {
      nodeId: 'enterprise-light-ui',
      titleFa: 'رابط کاربری سازمانی، سایدبار چپ، استریم کلاینت و خروجی PDF استاندارد A4',
      categoryLabelFa: 'لایه فرانت‌اند (Frontend UI)',
      nonTechnicalPurposeFa:
        'میز کار اصلی مدیران و کارمندان شرکت که به زبان آلمانی (پیش‌فرض) و انگلیسی کار می‌کند و امکان وارد کردن قوانین، ارزیابی تصمیمات و دریافت خروجی PDF رسمی را می‌دهد.',
      nonTechnicalHowItWorksFa:
        'کاربر پس از ورود با کد ۶ رقمی، سه بخش اصلی (ارزیابی تصمیم، مغز شرکت و کانکتورها) را در منوی سمت چپ می‌بیند و گزارش‌های قبلی زیر باکس تصمیم لیست می‌شوند.',
      technicalArchitectureFa:
        'Next.js 15 App Router + React 19 + fetchJsonWithHeartbeat (پارسر استریم NDJSON) + استایل چاپی @media print برای خروجی PDF مستقیم مرورگر.',
      errorPreventionMechanismFa:
        'جلوگیری از کرش JSON.parse در برابر پاسخ‌های HTML پروکسی، مدیریت وضعیت استثنای یک‌باره (1x Exclude) و حذف موقت اسناد در محیط دمو.',
    },
    {
      nodeId: 'enterprise-connectors-auth-ledger',
      titleFa: 'احراز هویت سازمانی، دفتر کل تاریخچه ممیزی و مرکز کانکتورهای سازمانی',
      categoryLabelFa: 'لایه API و کانکتورها',
      nonTechnicalPurposeFa:
        'اتصال مغز شرکت به ابزارهای روزمره سازمان (گوگل درایو، اسلک، تیمز، کانفلوئنس، نوشن، زوم و گوگل میت) و ثبت نام نویسنده روی هر سند و گزارش.',
      nonTechnicalHowItWorksFa:
        'مدیر کلید اتصال هر ابزار را وارد کرده و کلید آن را روشن می‌کند. با زدن دکمه Sync، اسناد جدید وارد مغز شرکت می‌شوند.',
      technicalArchitectureFa:
        'رجیستری ۷ کانکتور سازمانی + googleDriveImporter.ts با محاسبه SHA-256 Checksum جهت تشخیص فایل‌های بدون تغییر و صرفه‌جویی ۱۰۰٪ در مصرف توکن.',
      errorPreventionMechanismFa:
        'ماسک کردن فوری کلیدهای محرمانه (maskSecretToken)، ممانعت از فعال‌سازی کانکتور بدون کلید و قفل کردن اسناد واردشده به صورت Read-Only.',
    },
    {
      nodeId: 'multimodal-ingestion-engine',
      titleFa: 'موتور استخراج چندوجهی فایل‌ها (PDF/PPTX/Image/Audio) و رونویسی صدای زنده',
      categoryLabelFa: 'لایه ورودی دانش (Multimodal RAG)',
      nonTechnicalPurposeFa:
        'تبدیل فایل‌های PDF، پاورپوینت، عکس اسناد و صدای ضبط‌شده جلسات به متن تمیز و آماده ذخیره در مغز شرکت.',
      nonTechnicalHowItWorksFa:
        'کاربر فایل را انتخاب می‌کند یا با میکروفون صحبت می‌کند؛ سیستم متن آن را استخراج کرده و داخل ویرایشگر قرار می‌دهد تا کاربر قبل از ذخیره آن را بازبینی کند.',
      technicalArchitectureFa:
        'POST /api/brain/extract مجهز به runWithHeartbeatStream + ارسال Base64 inlineData به مدل منتخب Gemini با تایم‌اوت ۱۸ ثانیه‌ای به ازای هر مدل.',
      errorPreventionMechanismFa:
        'ضربان قلب ۸ ثانیه‌ای برای جلوگیری از تایم‌اوت H12 هروکو روی PDFهای سنگین + استخراج‌کننده بافر داخلی (extractTextFromPlainBuffer) در صورت عدم دسترسی به Gemini.',
    },
    {
      nodeId: 'dynamic-gemini-router',
      titleFa: 'مسیریاب هوشمند مدل‌های Gemini، قرنطینه ۱۵ دقیقه‌ای و موتور Embedding',
      categoryLabelFa: 'هسته هوش مصنوعی (AI Router)',
      nonTechnicalPurposeFa:
        'انتخاب خودکار بهترین و سالم‌ترین مغز هوش مصنوعی گوگل برای هر کار و دور زدن فوری مدل‌های خراب یا کند.',
      nonTechnicalHowItWorksFa:
        'قبل از هر کار، پیچیدگی سوال را می‌سنجد و از بین مدل‌های سالم گوگل بهترین گزینه را انتخاب می‌کند؛ اگر مدلی کند باشد یا خطا بدهد، ۱۵ دقیقه آن را کنار می‌گذارد.',
      technicalArchitectureFa:
        'modelRanking.ts + modelSelector.ts (15m Circuit Breaker unhealthyUntilByModel + 2.x Fallback Guarantee) + embeddingService.ts (text-embedding-004 768-d).',
      errorPreventionMechanismFa:
        'تشخیص خطاهای شبکه (fetch failed / TimeoutError) و کدهای 404/429/5xx، قرنطینه ۱۵ دقیقه‌ای مدل معیوب و موتور بردارساز ریاضی داخلی در صورت آفلاین بودن کل سرویس گوگل.',
    },
    {
      nodeId: 'parent-child-rag',
      titleFa: 'موتور RAG سلسله‌مراتبی والد-فرزند، ریاضیات برداری و مخزن مغز شرکت',
      categoryLabelFa: 'موتور جستجوی معنایی (RAG Core)',
      nonTechnicalPurposeFa:
        'برش هوشمند قوانین شرکت به بخش‌های بزرگ و کوچک و پیدا کردن دقیق‌ترین بندهای قانونی مرتبط با تصمیم شما در کسری از ثانیه.',
      nonTechnicalHowItWorksFa:
        'هر سند را هم به تکه‌های کوچک ۴۰۰ حرفی (برای جستجوی فوق‌دقیق) و هم تکه‌های بزرگ ۲۰۰۰ حرفی (برای درک کامل معنی قانون) تقسیم و ذخیره می‌کند.',
      technicalArchitectureFa:
        'chunker.ts (Parent 2000c / Child 400c / Overlap 80c) + vectorMath.ts (768-d Cosine Similarity) + brainRepository.ts (Dual MongoDB + In-Memory Mirror).',
      errorPreventionMechanismFa:
        'هیدراتاسیون کامل والدها و بردارهای فرزند از MongoDB هنگام شروع به کار، جایگزینی اتمیک هنگام ویرایش سند و پشتیبانی از فیلتر اسناد کنارگذاشته‌شده (excludedParentIds).',
    },
    {
      nodeId: 'executive-audit-engine',
      titleFa: 'موتور ممیزی تصمیم مدیریتی و مشاور قطعی قوانین رگولاتوری آلمان',
      categoryLabelFa: 'موتور تصمیم‌يار و رگولاتوری (Audit Engine)',
      nonTechnicalPurposeFa:
        'بررسی هم‌زمان تصمیم شما با قوانین داخلی شرکت و قوانین رسمی کشور آلمان (شورای کار، حریم خصوصی، هوش مصنوعی و امنیت سایبری) و صدور کارنامه نهایی.',
      nonTechnicalHowItWorksFa:
        'بندهای مرتبط را از مغز شرکت بیرون می‌کشد، تضادها و ریسک‌ها را با هوش مصنوعی تحلیل می‌کند و سپس قوانین کار و داده آلمان را روی آن چک می‌کند.',
      technicalArchitectureFa:
        'POST /api/brain/audit (Promise.all Parallel Pipeline + NDJSON Heartbeat) + decisionEvaluator.ts + germanRegulatoryAdvisor.ts (BetrVG, DSGVO, EU AI Act, NIS-2).',
      errorPreventionMechanismFa:
        'موتور قطعی پشتیبان (evaluateDecisionAgainstPoliciesHeuristic) در صورت خطای LLM + اعمال قطعی قوانین آلمان پس از LLM تا هیچ الزام قانونی نادیده گرفته نشود.',
    },
    {
      nodeId: 'mongodb-atlas-vector',
      titleFa: 'کلاستر دیتابیس MongoDB Atlas و سازنده خودکار ایندکس برداری ۷۶۸ بُعدی',
      categoryLabelFa: 'لایه دیتابیس (Database Layer)',
      nonTechnicalPurposeFa:
        'گاوصندوق ابری دائمی که اطلاعات هر شرکت مشتری، کاربران، قوانین، بردارهای ریاضی و تاریخچه گزارش‌ها را در دیتابیس مخصوص همان شرکت نگه می‌دارد.',
      nonTechnicalHowItWorksFa:
        'برای هر شرکت یک دیتابیس جداگانه می‌سازد و هنگام ورود اولین سند، فهرست جستجوی سریع ۷۶۸ بُعدی را به طور خودکار در کلود فعال می‌کند.',
      technicalArchitectureFa:
        'MongoDB Node.js Driver v6 + Shared Default Cluster Pool / Bounded Custom LRU Pool + createSearchIndex (mindmittel_vector_index, 768-d cosine) + Zod Schemas.',
      errorPreventionMechanismFa:
        'serverSelectionTimeoutMS: 5000ms برای جلوگیری از قفل شدن درخواست‌ها و ادامه کار بدون توقف از روی In-Memory Mirror در صورت اختلال لحظه‌ای شبکه دیتابیس.',
    },
    {
      nodeId: 'sse-observability-engine',
      titleFa: 'موتور تله‌متری زنده SSE و بافر حلقوی با سانسور خودکار کلیدهای امنیتی',
      categoryLabelFa: 'مانیتورینگ و مشاهده‌پذیری (Observability)',
      nonTechnicalPurposeFa:
        'دوربین مداربسته فنی برای مدیر پلتفرم که تمام اتفاقات و خطاهای احتمالی سرور را به صورت زنده در پنل مدیریت نمایش می‌دهد.',
      nonTechnicalHowItWorksFa:
        'هر اتفاقی در سیستم بیفتد را بلافاصله به صفحه مانیتورینگ ادمین می‌فرستد و قبل از نمایش، تمام رمزها و کلیدهای محرمانه را با عبارت [REDACTED] می‌پوشاند.',
      technicalArchitectureFa:
        'logger.ts (250-Entry Ring Buffer + Pub/Sub) + redactSensitiveMetadata() + GET /api/system/logs/stream (ReadableStream SSE) محافظت‌شده با نشست ادمین.',
      errorPreventionMechanismFa:
        'حذف خودکار قدیمی‌ترین لاگ‌ها در ظرفیت ۲۵۰ تایی برای جلوگیری از نشت حافظه (Memory Leak) و مسدودسازی کامل دسترسی کاربران عادی و دمو به مسیر /system.',
    },
    {
      nodeId: 'multi-tenant-control-plane',
      titleFa: 'پنل کنترل مالک محصول (admin.mindmittel.de)، مسیریاب ساب‌دامین و دروازه OTP',
      categoryLabelFa: 'کنترل‌پلین و امنیت (Control Plane)',
      nonTechnicalPurposeFa:
        'مرکز فرماندهی مدیر اصلی پلتفرم برای تعریف شرکت‌های مشتری جدید، مدیریت دامنه‌های ایمیل مجاز، کلیدهای اختصاصی و مشاهده مستندات زنده معماری.',
      nonTechnicalHowItWorksFa:
        'فقط با ایمیل و رمز مالک پلتفرم باز می‌شود و به شما اجازه می‌دهد در چند ثانیه یک ساب‌دامین و دیتابیس اختصاصی برای مشتری جدید بسازید.',
      technicalArchitectureFa:
        'src/app/admin/page.tsx + src/app/admin/docs/page.tsx + secretBox.ts (AES-256-GCM) + otpService.ts (6-Digit Corporate Email OTP).',
      errorPreventionMechanismFa:
        'جداسازی کامل مسیرهای /admin و /system در لایه Middleware، رمزنگاری کلیدهای مشتریان با MASTER_ENCRYPTION_KEY و محافظت با Rate Limiter.',
    },
  ],
};

export const PERSIAN_NON_TECHNICAL_BLUEPRINT_DOC: {
  title: string;
  subtitle: string;
  executiveIntroFa: string;
  diagrams: readonly VisualFlowDiagramSpec[];
  sections: readonly PersianDocSectionSpec[];
  errorShields: readonly ErrorPreventionShieldSpec[];
  architectKeyDecisions: readonly ArchitectDecisionSimpleSpec[];
} = {
  title: 'سند جامع غیرفنی: زیر کاپوت MindMittel چه خبر است؟ (راهنمای معمار سیستم به زبان ساده)',
  subtitle:
    'توضیح گام‌به‌گام و بدون اصطلاحات پیچیده درباره اجزای سیستم، نحوه همکاری آن‌ها با یکدیگر و ۶ سپر دفاعی که جلوی خطاها و قطعی‌ها را می‌گیرند',
  executiveIntroFa:
    'اگر بخواهیم کل پلتفرم MindMittel را در یک جمله خلاصه کنیم: «ما برای هر شرکت یک گاوصندوق قوانین اختصاصی (مغز شرکت) و یک مشاور هوشمند هیئت‌مدیره ساخته‌ایم که هر تصمیم مدیریتی را در چند ثانیه هم با قوانین داخلی همان شرکت و هم با قوانین رسمی کشور آلمان می‌سنجد و کارنامه ریسک صادر می‌کند.» در ادامه، تمام اتفاقاتی که زیر کاپوت می‌افتد را به زبان کاملاً ساده می‌بینید.',
  diagrams: [
    {
      id: 'smart-building-metaphor',
      titleFa: 'فلوچارت ۱: نقشه ساختمان هوشمند MindMittel (چطور شرکت‌ها از هم جدا هستند؟)',
      subtitleFa: 'استعاره ساختمان چندطبقه با نگهبانی هوشمند و گاوصندوق‌های مجزا',
      summaryFa:
        'به محض اینکه کسی آدرس سایت را در مرورگر وارد می‌کند، «نگهبان ورودی» (Middleware) نگاه می‌کند که او به کدام در آمده است و او را دقیقاً به بخش مربوطه می‌فرستد.',
      steps: [
        {
          stepNumber: 'دروازه ۱',
          titleFa: 'ویترین عمومی (mindmittel.de)',
          subtitleEn: 'Marketing Landing Zone',
          descriptionFa:
            'مانند لابی ساختمان است؛ بازدیدکنندگان جدید معرفی محصول را می‌بینند اما هیچ دسترسی به اطلاعات شرکت‌ها یا پنل مدیریت ندارند.',
          badgeText: 'لابی معرفی محصول',
          tone: 'slate',
        },
        {
          stepNumber: 'دروازه ۲',
          titleFa: 'اتاق فرمان مالک پلتفرم (admin.mindmittel.de)',
          subtitleEn: 'Product Owner Control Plane',
          descriptionFa:
            'فقط با رمز عبور شما باز می‌شود. در اینجا شرکت‌های مشتری جدید را ثبت می‌کنید، لاگ‌های زنده سرور را می‌بینید و همین مستندات معماری را مطالعه می‌کنید.',
          badgeText: 'فقط مدیر اصلی',
          tone: 'indigo',
        },
        {
          stepNumber: 'دروازه ۳',
          titleFa: 'محیط نمایشی زنده (demo.mindmittel.de)',
          subtitleEn: 'Interactive Sandbox Demo',
          descriptionFa:
            'محیط آزمایشی با ۳ قانون پیش‌فرض که مشتریان بالقوه می‌توانند سیستم را تست کنند. اگر کسی در دمو سندی را پاک کند، فقط برای صفحه خودش مخفی می‌شود تا دمو برای نفر بعدی خراب نشود.',
          badgeText: 'محیط تست ایمن',
          tone: 'amber',
        },
        {
          stepNumber: 'دروازه ۴',
          titleFa: 'طبقه اختصاصی هر شرکت مشتری (<company>.mindmittel.de)',
          subtitleEn: 'Isolated Customer Workspace & Vault',
          descriptionFa:
            'هر شرکت مشتری درِ ورودی، کد تایید ۶ رقمی ایمیل، گاوصندوق دیتابیس (mindmittel_<company>) و کلید هوش مصنوعی کاملاً جداگانه خودش را دارد.',
          badgeText: 'گاوصندوق ۱۰۰٪ ایزوله',
          tone: 'emerald',
        },
      ],
    },
    {
      id: 'document-journey-simple',
      titleFa: 'فلوچارت ۲: وقتی یک فایل PDF یا صدا را وارد «مغز شرکت» می‌کنید چه اتفاقی می‌افتد؟',
      subtitleFa: 'تبدیل فایل خام به حافظه ریاضی قابل جستجو در ۴ قدم ساده',
      summaryFa:
        'کامپیوترها نمی‌توانند مستقیماً معنی جملات یک فایل PDF را بفهمند؛ بنابراین سیستم در ۴ مرحله فایل شما را به «مختصات ریاضی معنی‌دار» تبدیل می‌کند.',
      steps: [
        {
          stepNumber: 'قدم ۱',
          titleFa: 'خواندن فایل یا پیاده‌سازی صدا (مترجم چندوجهی)',
          subtitleEn: 'Multimodal Extraction (/api/brain/extract)',
          descriptionFa:
            'چه فایل PDF یا پاورپوینت آپلود کنید، چه عکس یک بخشنامه را بدهید و چه با میکروفون صحبت کنید، هوش مصنوعی متن دقیق آن را استخراج کرده و داخل کادر ویرایشگر می‌گذارد.',
          badgeText: 'تبدیل فایل و صدا به متن',
          tone: 'blue',
        },
        {
          stepNumber: 'قدم ۲',
          titleFa: 'برش هوشمند به «فصل‌های بزرگ» و «جملات کوچک»',
          subtitleEn: 'Parent (2000 chars) & Child (400 chars) Slicing',
          descriptionFa:
            'سیستم متن را به بخش‌های بزرگ ۲۰۰۰ حرفی (والد) و تکه‌های کوچک ۴۰۰ حرفی (فرزند) تقسیم می‌کند. تکه‌های کوچک ۸۰ حرف با هم همپوشانی دارند تا هیچ جمله‌ای نصفه بریده نشود.',
          badgeText: 'برش دو لایه هوشمند',
          tone: 'indigo',
        },
        {
          stepNumber: 'قدم ۳',
          titleFa: 'تبدیل معنی هر تکه به ۷۶۸ عدد ریاضی + بررسی تضاد',
          subtitleEn: '768-d Vector Embedding & Conflict Detection',
          descriptionFa:
            'معنی هر تکه ۴۰۰ حرفی به یک کد ریاضی ۷۶۸ عددی تبدیل می‌شود (تا سیستم بفهمد مثلاً «خودرو» و «ماشین» هم‌معنی هستند). هم‌زمان چک می‌کند آیا این قانون جدید با قوانین قبلی شرکت تناقض دارد یا نه.',
          badgeText: 'کدگذاری معنایی + کشف تناقض',
          tone: 'amber',
        },
        {
          stepNumber: 'قدم ۴',
          titleFa: 'ذخیره هم‌زمان در گاوصندوق ابری و حافظه فوری سرور',
          subtitleEn: 'Dual-Layer Storage (MongoDB Atlas + RAM Mirror)',
          descriptionFa:
            'سند هم در دیتابیس ابری MongoDB ذخیره دائمی می‌شود و هم یک کپی از آن در حافظه سریع سرور قرار می‌گیرد تا جستجوهای بعدی در کمتر از یک‌هزارم ثانیه انجام شوند.',
          badgeText: 'ذخیره دائمی و فوق‌سریع',
          tone: 'emerald',
        },
      ],
    },
    {
      id: 'audit-journey-simple',
      titleFa: 'فلوچارت ۳: وقتی دکمه «ارزیابی تصمیم» را می‌زنید در کسری از ثانیه چه رخ می‌دهد؟',
      subtitleFa: 'همکاری موازی جستجوگر قوانین، هوش مصنوعی گوگل و حقوقدان قوانین آلمان',
      summaryFa:
        'برای اینکه ارزیابی تصمیم هم سریع باشد و هم هیچ قانون مهمی از قلم نیفتد، ۳ موتور به صورت هم‌زمان و زنجیره‌ای روی تصمیم شما کار می‌کنند.',
      steps: [
        {
          stepNumber: 'مرحله ۱ (موازی)',
          titleFa: 'جستجوی فوری در مغز شرکت + انتخاب سالم‌ترین هوش مصنوعی',
          subtitleEn: 'Parallel Vector Retrieval & Model Selection',
          descriptionFa:
            'در یک لحظه، سیستم هم مرتبط‌ترین قوانین شرکت را از گاوصندوق بیرون می‌کشد (با نادیده گرفتن اسنادی که تیک 1x Exclude خورده‌اند) و هم بهترین مدل سالم گوگل را انتخاب می‌کند.',
          badgeText: 'صرفه‌جویی ۵۰٪ در زمان',
          tone: 'blue',
        },
        {
          stepNumber: 'مرحله ۲',
          titleFa: 'مقایسه تصمیم با سیاست‌های داخلی شرکت توسط هوش مصنوعی',
          subtitleEn: 'Gemini Executive Policy Synthesis',
          descriptionFa:
            'هوش مصنوعی بندبه‌بند تصمیم شما را با قوانین پیدا‌شده مقایسه می‌کند، درصد هم‌سویی (Alignment Score)، نقاط قوت، ریسک‌ها و ارجاعات دقیق به قوانین شرکت را می‌نویسد.',
          badgeText: 'تحلیل عمیق سیاست‌های داخلی',
          tone: 'indigo',
        },
        {
          stepNumber: 'مرحله ۳',
          titleFa: 'بررسی قطعی قوانین رسمی کشور آلمان و اتحادیه اروپا',
          subtitleEn: 'Deterministic DACH Statutory Advisor',
          descriptionFa:
            'یک موتور قانونی ۱۰۰٪ قطعی (که هوش مصنوعی نمی‌تواند آن را دور بزند) بررسی می‌کند آیا این تصمیم نیاز به تایید شورای کار آلمان (Betriebsrat)، قوانین حریم خصوصی (DSGVO) یا قانون هوش مصنوعی اروپا دارد یا خیر.',
          badgeText: 'چک‌لیست قانونی آلمان',
          tone: 'amber',
        },
        {
          stepNumber: 'مرحله ۴',
          titleFa: 'صدور کارنامه نهایی، ثبت در تاریخچه و آماده‌سازی چاپ PDF',
          subtitleEn: 'Verdict, Audit Ledger & A4 Print Report',
          descriptionFa:
            'گزارش نهایی با حکم مشخص (تاییدشده / مشروط / در تضاد با قانون) نمایش داده می‌شود، اسناد استثناشده در کادر شفافیت اعلام می‌شوند و گزارش آماده دانلود PDF می‌گردد.',
          badgeText: 'گزارش رسمی هیئت‌مدیره',
          tone: 'emerald',
        },
      ],
    },
  ],
  sections: [
    {
      id: 'simple-what-is-under-the-hood',
      badgeFa: 'تصویر کلان به زبان ساده',
      titleFa: '۱. اجزای اصلی پروژه کدامند و هر کدام چه نقشی دارند؟',
      subtitleEn: 'The 5 Pillars of MindMittel Explained Simply',
      summaryFa:
        'کل پلتفرم از ۵ بخش اصلی تشکیل شده است که مثل اعضای یک تیم حرفه‌ای با هم کار می‌کنند:',
      bulletsFa: [
        {
          headingFa: '۱. نگهبان ورودی و تفکیک شرکت‌ها (Subdomain Gatekeeper)',
          bodyFa:
            'وظیفه دارد تشخیص دهد کاربر وارد سایت تبلیغاتی شده، وارد پنل ادمین شما شده یا وارد شرکت خودش (مثلاً acme.mindmittel.de) شده است. همچنین با ارسال کد ۶ رقمی به ایمیل کاری، مطمئن می‌شود فقط کارمندان مجاز همان شرکت وارد شوند.',
        },
        {
          headingFa: '۲. مترجم فایل‌ها و صداها (Multimodal Extractor)',
          bodyFa:
            'کاربران دوست ندارند قوانین طولانی را تایپ کنند. این بخش فایل‌های PDF، پاورپوینت، عکس بخشنامه‌ها یا صدای ضبط‌شده را می‌گیرد و متن تمیز آن‌ها را تحویل می‌دهد.',
        },
        {
          headingFa: '۳. کتابدار هوشمند مغز شرکت (Parent-Child RAG Vault)',
          bodyFa:
            'قوانین شرکت را به بخش‌های کوچک و بزرگ تقسیم می‌کند، معنی آن‌ها را به کدهای ریاضی تبدیل می‌کند و هم در فضای ابری (MongoDB) و هم در حافظه فوری سرور نگه می‌دارد.',
        },
        {
          headingFa: '۴. مسیریاب هوشمند هوش مصنوعی (Smart Gemini Router)',
          bodyFa:
            'گوگل مدل‌های هوش مصنوعی مختلفی دارد (بعضی سریع‌ترند، بعضی عمیق‌تر فکر می‌کنند و گاهی یکی از آن‌ها در سرورهای گوگل کند یا قطع می‌شود). این بخش به طور خودکار بهترین و سالم‌ترین مدل را برای هر کار انتخاب می‌کند.',
        },
        {
          headingFa: '۵. قاضی دوگانه: قوانین داخلی شرکت + قوانین کشور آلمان (Hybrid Audit Engine)',
          bodyFa:
            'تصمیم مدیریتی را می‌گیرد، ابتدا با هوش مصنوعی آن را با قوانین داخلی شرکت مقایسه می‌کند و سپس با یک فرمول قطعی و تغییرناپذیر، قوانین کار و حریم خصوصی آلمان (مثل شورای کار Betriebsrat و DSGVO) را روی آن بررسی می‌کند.',
        },
      ],
    },
    {
      id: 'simple-how-components-cooperate',
      badgeFa: 'هماهنگی اجزا',
      titleFa: '۲. این اجزا چطور بدون تداخل با هم همکاری می‌کنند؟',
      subtitleEn: 'Seamless Orchestration & Data Flow',
      summaryFa:
        'راز سرعت و نظم سیستم در این است که کارها به دو بخش «هسته تصمیم‌گیری» (Core) و «ابزارهای ارتباطی» (Infrastructure) تقسیم شده‌اند:',
      bulletsFa: [
        {
          headingFa: 'برچسب هویت نامرئی روی هر درخواست (Tenant Context)',
          bodyFa:
            'وقتی کارمندی در شرکت A دکمه‌ای را می‌زند، سیستم در همان میلی‌ثانیه اول یک «برچسب نامرئی» روی درخواست او می‌زند که می‌گوید: «این درخواست متعلق به شرکت A است». از آن لحظه به بعد، کتابدار دیتابیس و هوش مصنوعی فقط و فقط به گاوصندوق شرکت A نگاه می‌کنند.',
        },
        {
          headingFa: 'انجام هم‌زمان کارها به جای صف نوبتی (Parallel Execution)',
          bodyFa:
            'وقتی تصمیمی را برای ارزیابی می‌فرستید، سیستم منتظر نمی‌ماند تا اول جستجوی قوانین تمام شود و بعد سراغ انتخاب مدل هوش مصنوعی برود؛ بلکه هر دو کار را هم‌زمان (موازی) انجام می‌دهد تا زمان انتظار نصف شود.',
        },
        {
          headingFa: 'صرفه‌جویی هوشمند در مصرف هوش مصنوعی هنگام اتصال به Google Drive',
          bodyFa:
            'وقتی دکمه Sync گوگل درایو را می‌زنید، سیستم یک «اثر انگشت دیجیتال» (Checksum) از فایل می‌گیرد. اگر فایل از دفعه قبل حتی یک کلمه هم تغییر نکرده باشد، سیستم بلافاصله می‌گوید «همه‌چیز به‌روز است» و حتی یک توکن هوش مصنوعی هم مصرف نمی‌کند.',
        },
      ],
    },
    {
      id: 'simple-document-governance-and-exclude',
      badgeFa: 'حاکمیت اسناد شرکت',
      titleFa: '۳. مدیریت قوانین شرکت، قفل اسناد خارجی و دکمه استثنای موقت (1x Exclude)',
      subtitleEn: 'Document Governance, Read-Only Lock & Ephemeral Exclusion',
      summaryFa:
        'مغز شرکت علاوه بر نگهداری قوانین، سه امکان کنترلی مهم به مدیران می‌دهد:',
      bulletsFa: [
        {
          headingFa: 'ویرایش آنلاین یکپارچه اسناد چندبخشی',
          bodyFa:
            'وقتی یک قانون بزرگ در مغز شرکت به چند بخش تقسیم شده باشد، کاربر در لیست اسناد فقط یک کارت یکپارچه می‌بیند و با زدن دکمه ویرایش، کل سند بازسازی و دوباره بردارسازی می‌شود.',
        },
        {
          headingFa: 'قفل خودکار اسناد واردشده از سیستم‌های خارجی (Read-Only)',
          bodyFa:
            'اسنادی که از گوگل درایو یا اسلک وارد می‌شوند، منبع رسمیشان بیرون از سایت است؛ поэтому سیستم روی آن‌ها برچسب قفل می‌زند تا کسی به اشتباه داخل سایت آن‌ها را دستکاری یا حذف نکند.',
        },
        {
          headingFa: 'دکمه استثنای یک‌باره (1x Exclude) برای تست سناریوهای مدیریتی',
          bodyFa:
            'اگر مدیری بخواهد ببیند «اگر فلان بخشنامه مالی را موقتاً در نظر نگیریم، حکم تصمیم چه می‌شود؟»، دکمه 1x Exclude را می‌زند. سیستم فقط برای همان یک تصمیم آن سند را کنار می‌گذارد، در بالای گزارش نهایی به صورت شفاف اعلام می‌کند که کدام سند کنار گذاشته شده و بلافاصله بعد از آن تصمیم، سند را دوباره فعال می‌کند.',
        },
      ],
    },
    {
      id: 'simple-executive-report-and-pdf',
      badgeFa: 'خروجی مدیریتی',
      titleFa: '۴. کارنامه نهایی تصمیم، مشاور قوانین آلمان و خروجی چاپی PDF',
      subtitleEn: 'Executive Verdict, DACH Statutory Check & A4 PDF Print',
      summaryFa:
        'خروجی سیستم یک متن ساده چت‌بات نیست، بلکه یک گزارش ساختاریافته رسمی برای هیئت‌مدیره است:',
      bulletsFa: [
        {
          headingFa: 'سه حکم صریح و امتیاز هم‌سویی ۰ تا ۱۰۰ درصد',
          bodyFa:
            'هر تصمیم یکی از سه حکم «تاییدشده (CERTIFIED)»، «مشروط (CONDITIONAL)» یا «در تضاد با سیاست شرکت (POLICY_CONFLICT)» را دریافت می‌کند.',
        },
        {
          headingFa: 'بخش اختصاصی قوانین کشور آلمان (DACH Regulatory Advisory)',
          bodyFa:
            'در هر گزارش به صورت جداگانه مشخص می‌شود که آیا تصمیم نیاز به تایید شورای کار آلمان (Betriebsrat طبق BetrVG §87/§111) یا ارزیابی حریم خصوصی (DSGVO) دارد یا خیر.',
        },
        {
          headingFa: 'خروجی مستقیم PDF با استاندارد A4',
          bodyFa:
            'با زدن دکمه Save as PDF، منوها و دکمه‌های اضافی صفحه مخفی می‌شوند و فقط گزارش رسمی با صفحه‌بندی تمیز A4 آماده ذخیره یا چاپ می‌شود.',
        },
      ],
    },
    {
      id: 'simple-living-docs-and-admin-control',
      badgeFa: 'پنل مالک محصول',
      titleFa: '۵. اتاق فرمان شما (admin.mindmittel.de) و مکانیزم به‌روزرسانی خودکار همین مستندات',
      subtitleEn: 'Product Owner Control Plane & Auto-Updated Living Docs',
      summaryFa:
        'شما به عنوان مالک پلتفرم از طریق admin.mindmittel.de کنترل کامل تمام شرکت‌ها و سلامت فنی سیستم را در دست دارید:',
      bulletsFa: [
        {
          headingFa: 'تعریف شرکت جدید در چند ثانیه',
          bodyFa:
            'کافی است نام شرکت و ساب‌دامین (مثلاً siemens) و دامنه ایمیل مجاز را وارد کنید تا محیط کاری و دیتابیس ایزوله آن شرکت بلافاصله فعال شود.',
        },
        {
          headingFa: 'همگام‌سازی اجباری مستندات با هر تغییر کد',
          bodyFa:
            'در قوانین هسته پروژه ثبت شده است که هر بار برنامه‌نویس یا هوش مصنوعی تغییری در کدها بدهد، موظف است هم‌زمان این دو داکیومنت فارسی را هم آپدیت کند؛ در غیر این صورت تست خودکار سیستم اجازه ثبت کد جدید را نمی‌دهد.',
        },
      ],
    },
  ],
  errorShields: [
    {
      id: 'shield-1-circuit-breaker',
      shieldNumber: 1,
      titleFa: 'سپر اول: پزشک کشیک و قرنطینه ۱۵ دقیقه‌ای مدل‌های هوش مصنوعی',
      technicalNameEn: '15-Minute AI Model Circuit Breaker',
      threatScenarioFa:
        'گاهی گوگل یک مدل جدید (مثل gemini-3.8-flash) منتشر می‌کند که در لیست مدل‌ها فعال است اما وقتی به آن فایل PDF یا متن می‌دهید، هنگ می‌کند و جواب نمی‌دهد (خطای fetch failed).',
      howShieldPreventsItFa:
        'سیستم برای هر مدل یک تایمر ۱۸ ثانیه‌ای می‌گذارد. به محض اینکه مدلی خطا بدهد یا هنگ کند، سیستم بلافاصله سراغ مدل جایگزین می‌رود و مدل خراب را به مدت ۱۵ دقیقه در «لیست قرنطینه» می‌گذارد. در تمام درخواست‌های ۱۵ دقیقه بعدی، سیستم حتی ۱ میلی‌ثانیه هم وقتش را روی مدل خراب تلف نمی‌کند.',
      userExperienceResultFa:
        'کاربر اصلاً متوجه خرابی سرورهای گوگل نمی‌شود و پاسخ خود را بدون خطا از مدل سالم جایگزین دریافت می‌کند.',
      sourceFileRef: 'src/infrastructure/gemini/modelSelector.ts',
    },
    {
      id: 'shield-2-heartbeat-stream',
      shieldNumber: 2,
      titleFa: 'سپر دوم: ضربان قلب ۸ ثانیه‌ای برای جلوگیری از قطع شدن ارتباط در هروکو',
      technicalNameEn: 'NDJSON 8-Second Heartbeat Streaming',
      threatScenarioFa:
        'سرورهای هروکو یک قانون سخت‌گیرانه دارند: اگر درخواستی (مثل خواندن یک PDF بزرگ یا تحلیل یک تصمیم پیچیده) بیش از ۳۰ ثانیه طول بکشد و سرور هیچ داده‌ای نفرستد، هروکو ارتباط را قطع می‌کند و خطای عجیب Unexpected token < نمایش داده می‌شود.',
      howShieldPreventsItFa:
        'به محض اینکه شما دکمه آپلود PDF یا ارزیابی تصمیم را می‌زنید، سرور ما در کمتر از ۵ هزارم ثانیه اولین پیام «ضربان قلب» را به مرورگر می‌فرستد و هر ۸ ثانیه یک بار می‌گوید «من زنده‌ام و دارم پردازش می‌کنم». با این کار، هروکو هرگز ارتباط را قطع نمی‌کند.',
      userExperienceResultFa:
        'فایل‌های PDF بزرگ و تحلیل‌های سنگین حتی اگر ۲۵ یا ۴۰ ثانیه زمان ببرند، با موفقیت کامل به پایان می‌رسند و هرگز با خطای ۳۰ ثانیه‌ای قطع نمی‌شوند.',
      sourceFileRef: 'src/infrastructure/http/streamingResponse.ts',
    },
    {
      id: 'shield-3-deterministic-fallback',
      shieldNumber: 3,
      titleFa: 'سپر سوم: موتور پشتیبان داخلی در صورت قطعی کامل سرویس گوگل',
      technicalNameEn: 'Deterministic Heuristic & Embedding Fallback',
      threatScenarioFa:
        'چه می‌شود اگر در یک لحظه کل سرویس هوش مصنوعی گوگل در دنیا قطع شود یا کلید API یک مشتری تمام شده باشد؟',
      howShieldPreventsItFa:
        'سیستم در داخل خودش یک «موتور ریاضی و قانونی پشتیبان» دارد. اگر تمام مدل‌های گوگل در دسترس نباشند، موتور داخلی هم بردارهای ۷۶۸ عددی را خودش محاسبه می‌کند، هم متن فایل را استخراج می‌کند و هم تضاد تصمیم با قوانین شرکت و قوانین آلمان را بدون نیاز به اینترنت خارجی ارزیابی می‌کند.',
      userExperienceResultFa:
        'سیستم در هیچ شرایطی متوقف نمی‌شود (Zero Downtime) و همیشه یک گزارش معتبر تحویل می‌دهد.',
      sourceFileRef: 'src/core/audit/decisionEvaluator.ts, src/infrastructure/gemini/embeddingService.ts',
    },
    {
      id: 'shield-4-dual-memory-vault',
      shieldNumber: 4,
      titleFa: 'سپر چهارم: گاوصندوق دوگانه (دیتابیس ابری + حافظه فوری سرور)',
      technicalNameEn: 'Dual-Layer MongoDB Atlas + In-Memory Mirror',
      threatScenarioFa:
        'جستجو در دیتابیس‌های ابری گاهی ممکن است به خاطر نوسان شبکه چند ثانیه طول بکشد یا ایندکس کلود در حال ساخته شدن باشد.',
      howShieldPreventsItFa:
        'وقتی سرور روشن می‌شود، تمام اسناد و بردارهای هر شرکت را از دیتابیس ابری MongoDB می‌خواند و یک کپی آماده در حافظه پرسرعت سرور (RAM) نگه می‌دارد. هر سند جدیدی هم که اضافه شود، هم‌زمان در هر دو جا ذخیره می‌شود.',
      userExperienceResultFa:
        'جستجو در بین قوانین شرکت تقریباً در صفر ثانیه (کسری از میلی‌ثانیه) انجام می‌شود و اطلاعات هرگز با ری‌استارت شدن سرور پاک نمی‌شوند.',
      sourceFileRef: 'src/infrastructure/rag/brainRepository.ts',
    },
    {
      id: 'shield-5-readonly-and-exclude',
      shieldNumber: 5,
      titleFa: 'سپر پنجم: قفل امنیتی اسناد خارجی و استثنای موقت یک‌باره با شفافیت کامل',
      technicalNameEn: 'Read-Only External Source Lock & 1x Exclude Compliance Disclosure',
      threatScenarioFa:
        'اگر کارمندی به اشتباه یک قانون رسمی واردشده از Google Drive را دستکاری یا پاک کند چه می‌شود؟ یا اگر بخواهد یک قانون خاص را موقتاً در نظر نگیرد چطور جلوی پنهان‌کاری گرفته می‌شود؟',
      howShieldPreventsItFa:
        'اولاً اسناد واردشده از سیستم‌های خارجی (مثل Google Drive یا Slack) به طور خودکار «فقط خواندنی» (Read-Only) می‌شوند و دکمه ویرایش و حذف برای آن‌ها قفل است. ثانیاً با دکمه 1x Exclude می‌توان سندی را فقط برای یک تصمیم کنار گذاشت، اما نام آن سند با کادر هشدار در بالای گزارش نهایی و فایل PDF چاپ می‌شود و بلافاصله بعد از آن تصمیم دوباره فعال می‌گردد.',
      userExperienceResultFa:
        'اصالت اسناد رسمی حفظ می‌شود و مدیران می‌توانند سناریوهای «چه می‌شد اگر این قانون نبود؟» را با شفافیت کامل حسابرسی تست کنند.',
      sourceFileRef: 'src/app/api/brain/documents/route.ts, src/app/api/brain/audit/route.ts',
    },
    {
      id: 'shield-6-tdd-and-doc-guard',
      shieldNumber: 6,
      titleFa: 'سپر ششم: نگهبان خودکار تست‌ها و همگام‌سازی اجباری مستندات قبل از هر تغییر کد',
      technicalNameEn: 'Automated Pre-Commit TDD Gate & Living Docs Anti-Drift Guard',
      threatScenarioFa:
        'وقتی پروژه بزرگ می‌شود، ممکن است تغییر در یک بخش باعث خراب شدن بخش دیگر شود یا مستندات از کدهای واقعی عقب بمانند.',
      howShieldPreventsItFa:
        'در سیستم یک قفل خودکار گیت (Husky Pre-Commit) و بیش از ۱۴۸ تست خودکار وجود دارد. قبل از اینکه حتی یک خط کد جدید ذخیره شود، تمام تست‌های امنیتی، قوانین آلمان و تست تطابق همین مستندات فارسی با فایل‌های پروژه اجرا می‌شوند. اگر کدی بدون آپدیت شدن مستندات اضافه شود، سیستم اجازه ثبت تغییر را نمی‌دهد.',
      userExperienceResultFa:
        'کیفیت نرم‌افزار در طول رشد پروژه افت نمی‌کند و این دو داکیومنت فارسی همیشه ۱۰۰٪ منطبق با آخرین وضعیت واقعی کدها هستند.',
      sourceFileRef: 'tests/unit/system/loggerAndDocs.test.ts, .husky/pre-commit',
    },
  ],
  architectKeyDecisions: [
    {
      questionFa: 'چرا اسناد را هم به تکه‌های بزرگ ۲۰۰۰ حرفی (والد) و هم تکه‌های کوچک ۴۰۰ حرفی (فرزند) تقسیم می‌کنیم؟',
      simpleAnswerFa:
        'جستجوی ریاضی روی جملات کوتاه ۴۰۰ حرفی بسیار دقیق‌تر عمل می‌کند و دقیقاً همان بند مرتبط را پیدا می‌کند؛ اما وقتی می‌خواهیم از هوش مصنوعی نظر بخواهیم، یک جمله کوتاه کافی نیست و کل بخش ۲۰۰۰ حرفی (والد) را به او می‌دهیم تا تبصره‌ها و زمینه کامل قانون را ببیند.',
      whyItMattersFa:
        'هم دقت جستجو به حداکثر می‌رسد و هم هوش مصنوعی به خاطر ندیدن ادامه پاراگراف دچار برداشت اشتباه نمی‌شود.',
    },
    {
      questionFa: 'چرا بررسی قوانین کشور آلمان (مثل شورای کار Betriebsrat و DSGVO) را فقط به هوش مصنوعی نسپردیم؟',
      simpleAnswerFa:
        'هوش مصنوعی‌های زبانی (LLM) گاهی ممکن است خوش‌بین باشند و یک الزام قانونی را فراموش کنند. به همین دلیل ما یک «موتور قوانین قطعی» ساختیم که بعد از هوش مصنوعی وارد عمل می‌شود و بر اساس کلیدواژه‌ها و قواعد حقوقی آلمان، بدون هیچ خطایی الزامات قانونی را به گزارش اضافه می‌کند.',
      whyItMattersFa:
        'قابلیت اطمینان حقوقی ۱۰۰٪ برای شرکت‌های آلمانی (Mittelstand) که نمی‌توانند ریسک جریمه‌های قانونی را بپذیرند.',
    },
    {
      questionFa: 'چرا برای هر مشتری یک دیتابیس جداگانه (mindmittel_<slug>) می‌سازیم به جای اینکه همه را در یک جدول بریزیم؟',
      simpleAnswerFa:
        'در سیستم‌های سازمانی اروپایی، بزرگ‌ترین دغدغه مشتریان این است که مبادا اطلاعات محرمانه آن‌ها با شرکت دیگری قاطی شود. وقتی هر شرکت دیتابیس فیزیکی/منطقی جداگانه‌ای دارد، حتی در صورت بروز باگ در یک کوئری، امکان نشت اطلاعات بین دو شرکت از نظر فنی وجود ندارد.',
      whyItMattersFa:
        'انطباق کامل با استانداردهای امنیتی سازمانی و جلب اعتماد سریع مدیران فناوری اطلاعات (CIO/CISO) مشتریان.',
    },
    {
      questionFa: 'چرا مشکل تایم‌اوت ۳۰ ثانیه‌ای را با «ضربان قلب ۸ ثانیه‌ای» و «قرنطینه ۱۵ دقیقه‌ای» حل کردیم به جای انتقال به سرور دستی؟',
      simpleAnswerFa:
        'در یک سرور دستی هم اگر مدلی در گوگل هنگ کند، کاربر نباید ۲ دقیقه منتظر بماند! قرنطینه ۱۵ دقیقه‌ای باعث می‌شود سیستم مدل خراب را بلافاصله بشناسد و کنار بگذارد، و ضربان قلب ۸ ثانیه‌ای هم بدون نیاز به دردسرهای نگهداری سرور دستی (VPS)، محدودیت ۳۰ ثانیه‌ای هروکو را به طور کامل از بین می‌برد.',
      whyItMattersFa:
        'ترکیب سرعت پاسخگویی بالا برای کاربر + پایداری زیرساخت ابری بدون هزینه و دردسر مدیریت دستی سرور.',
    },
  ],
};

export interface LivePersianDocsSnapshot {
  generatedAtIso: string;
  liveMetrics: {
    totalArchitectureNodes: number;
    healthyArchitectureNodes: number;
    totalDataChannels: number;
    totalApiEndpoints: number;
    totalCoreModules: number;
    totalEnterpriseConnectors: number;
    totalErrorShields: number;
  };
  architectureNodes: readonly TechnicalNodeSpec[];
  documentedApiRoutes: readonly DocumentedApiRouteSpec[];
  documentedCoreModules: readonly DocumentedCoreModuleSpec[];
  technicalDoc: typeof PERSIAN_TECHNICAL_ARCHITECTURE_DOC;
  nonTechnicalDoc: typeof PERSIAN_NON_TECHNICAL_BLUEPRINT_DOC;
}

export function getLivePersianDocsSnapshot(): LivePersianDocsSnapshot {
  const healthyNodes = ARCHITECTURE_NODES.filter(
    (n) => n.status === 'healthy'
  ).length;

  return {
    generatedAtIso: new Date().toISOString(),
    liveMetrics: {
      totalArchitectureNodes: ARCHITECTURE_NODES.length,
      healthyArchitectureNodes: healthyNodes,
      totalDataChannels: ARCHITECTURE_EDGES.length,
      totalApiEndpoints: DOCUMENTED_API_ROUTES.length,
      totalCoreModules: DOCUMENTED_CORE_MODULES.length,
      totalEnterpriseConnectors: DOCUMENTED_ENTERPRISE_CONNECTORS.length,
      totalErrorShields: PERSIAN_NON_TECHNICAL_BLUEPRINT_DOC.errorShields.length,
    },
    architectureNodes: ARCHITECTURE_NODES,
    documentedApiRoutes: DOCUMENTED_API_ROUTES,
    documentedCoreModules: DOCUMENTED_CORE_MODULES,
    technicalDoc: PERSIAN_TECHNICAL_ARCHITECTURE_DOC,
    nonTechnicalDoc: PERSIAN_NON_TECHNICAL_BLUEPRINT_DOC,
  };
}
