/**
 * Interactive System Architecture Blueprint Registry (`admin.mindmittel.de/admin/docs`).
 *
 * Pure TypeScript data model (client-safe, zero server-only imports) powering the
 * interactive 7-zone SaaS architecture map and Persian Inspector Drawer.
 *
 * ZERO-DRIFT POLICY:
 * Whenever any module in `src/core/`, `src/infrastructure/`, or `src/app/api/` changes,
 * update the corresponding zone, module, internal mechanics, and connections here.
 */

export type BlueprintZoneId =
  | 'zone-0'
  | 'zone-1'
  | 'zone-2'
  | 'zone-3'
  | 'zone-4'
  | 'zone-5'
  | 'zone-6';

export type BlueprintIconKey =
  | 'shield'
  | 'lock'
  | 'plug'
  | 'file-up'
  | 'layers'
  | 'sparkles'
  | 'search'
  | 'alert-triangle'
  | 'cpu'
  | 'scale'
  | 'landmark'
  | 'database'
  | 'hard-drive'
  | 'radio'
  | 'activity';

export interface BlueprintZoneSpec {
  id: BlueprintZoneId;
  zoneNumber: string;
  titleFa: string;
  subtitleEn: string;
  summaryFa: string;
  layoutRole: 'pipeline' | 'dedicated-hub';
}

export interface BlueprintMechanicStep {
  stepTitleFa: string;
  detailFa: string;
  codeRef: string;
}

export interface BlueprintModuleSpec {
  id: string;
  zoneId: BlueprintZoneId;
  titleFa: string;
  subtitleEn: string;
  roleSummaryFa: string;
  iconKey: BlueprintIconKey;
  /** 1. وظیفه این ماژول چیست؟ */
  whatItDoesFa: string;
  /** 2. مکانیزم دقیق و منطق داخلی */
  internalMechanicsFa: BlueprintMechanicStep[];
  /** 3. ورودی‌ها و خروجی‌ها */
  inputsFa: string[];
  outputsFa: string[];
  sourceFiles: string[];
}

export interface BlueprintConnectionSpec {
  id: string;
  fromModuleId: string;
  toModuleId: string;
  labelFa: string;
  isCrossHub?: boolean;
  whatItDoesFa: string;
  internalMechanicsFa: string;
  payloadSummaryFa: string;
}

export const BLUEPRINT_ZONES: readonly BlueprintZoneSpec[] = [
  {
    id: 'zone-0',
    zoneNumber: 'Zone 0',
    titleFa: 'ورود درخواست، تفکیک سازمان‌ها و نگهبان دسترسی',
    subtitleEn: 'Request Entry, Multi-Tenancy & RBAC Guard',
    summaryFa:
      'تشخیص ساب‌دامین سازمان در لبه شبکه، احراز هویت نشست کاربر، کنترل نقش‌های دسترسی و ایزوله‌سازی کامل کانتکست اجرایی هر سازمان.',
    layoutRole: 'pipeline',
  },
  {
    id: 'zone-1',
    zoneNumber: 'Zone 1',
    titleFa: 'دریافت داده و استخراج چندرسانه‌ای',
    subtitleEn: 'Data Ingestion & Multimodal Extraction',
    summaryFa:
      'ورود دانش سازمانی از طریق کانکتورهای ابری (با همگام‌سازی هوشمند) و آپلود دستی فایل‌های PDF، پاورپوینت، تصویر، صوت و متن.',
    layoutRole: 'pipeline',
  },
  {
    id: 'zone-2',
    zoneNumber: 'Zone 2',
    titleFa: 'پردازش هسته RAG و کشف تعارض اسناد',
    subtitleEn: 'Core RAG Processing & Conflict Detection',
    summaryFa:
      'خرد کردن دوطبقه والد-فرزند، تبدیل معنایی به بردارهای ۷۶۸ بعدی، بازیابی هوشمند با هرس استنادات و کشف خودکار تضاد بین سیاست‌های داخلی.',
    layoutRole: 'pipeline',
  },
  {
    id: 'zone-3',
    zoneNumber: 'Zone 3',
    titleFa: 'مسیریاب هوشمند هوش مصنوعی و مدارِ تاب‌آوری',
    subtitleEn: 'Dedicated AI Model Router & Resilience Hub',
    summaryFa:
      'ماژول مستقل انتخاب خودکار بهترین مدل برای هر کار، کش ۶ ساعته کاتالوگ مدل‌ها و فیوز ۱۵ دقیقه‌ای برای عبور بی‌وقفه از خطاها.',
    layoutRole: 'dedicated-hub',
  },
  {
    id: 'zone-4',
    zoneNumber: 'Zone 4',
    titleFa: 'موتور ممیزی تصمیمات و غربالگری قوانین آلمان',
    subtitleEn: 'Decision Audit & German Regulatory Engine',
    summaryFa:
      'ارزیابی دومرحله‌ای تصمیمات مدیریتی (خط مبنای قطعی + تحلیل عمیق LLM) به همراه غربالگری اجباری و غیرقابل‌دورزدن قوانین آلمان و اروپا.',
    layoutRole: 'pipeline',
  },
  {
    id: 'zone-5',
    zoneNumber: 'Zone 5',
    titleFa: 'پایگاه داده ایزوله و حافظه دولایه',
    subtitleEn: 'Dedicated Database & Dual-Layer Storage Hub',
    summaryFa:
      'ذخیره‌سازی تفکیک‌شده هر سازمان در کالکشن‌های اختصاصی MongoDB همراه با لایه حافظه سریع درون‌حافظه‌ای برای تاب‌آوری در برابر قطعی.',
    layoutRole: 'dedicated-hub',
  },
  {
    id: 'zone-6',
    zoneNumber: 'Zone 6',
    titleFa: 'تحویل استریم با ضربان قلب و تله‌متری زنده',
    subtitleEn: 'Streaming Delivery (Heartbeat) & Live Telemetry',
    summaryFa:
      'جلوگیری از تایم‌اوت سرور در تحلیل‌های سنگین با ارسال پالس ۸ ثانیه‌ای، خروجی چاپی PDF و پخش زنده لاگ‌های سیستم بدون افشای رمزها.',
    layoutRole: 'pipeline',
  },
];

export const BLUEPRINT_MODULES: readonly BlueprintModuleSpec[] = [
  // ==================== ZONE 0 ====================
  {
    id: 'edge-host-router',
    zoneId: 'zone-0',
    titleFa: 'مسیریاب لبه و تفکیک ساب‌دامین',
    subtitleEn: 'Edge Host & Zone Routing',
    roleSummaryFa:
      'هر درخواست ورودی را بر اساس دامنه به زون مارکتینگ، پنل مالک یا فضای اختصاصی شرکت هدایت می‌کند.',
    iconKey: 'shield',
    whatItDoesFa:
      'این ماژول دقیقاً مثل **مسئول پذیرش در ورودی یک برج اداری بزرگ** عمل می‌کند. پیش از آنکه هیچ صفحه یا کد سرور اجرا شود، به آدرس سایتی که کاربر باز کرده نگاه می‌کند تا بفهمد آیا کاربر وارد سایت معرفی عمومی (`mindmittel.de`) شده، یا وارد اتاق مدیریت کل (`admin.mindmittel.de`)، یا وارد دفتر اختصاصی یک شرکت مشخص مثل `hsansbach.mindmittel.de`.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. عبور سریع فایل‌های ظاهری و تشخیص زون از روی دامنه',
        detailFa:
          'اگر درخواست مربوط به فایل‌های ساده مثل عکس، فونت یا استایل باشد (`/_next` یا فایل‌های دارای پسوند)، بدون معطلی اجازه عبور می‌دهد. برای بقیه درخواست‌ها، نام دامنه را از هدر `x-forwarded-host` یا `host` می‌خواند و تابع `resolveHostZone` مشخص می‌کند این کاربر متعلق به کدام بخش است: سایت معرفی (`marketing`)، پنل مالک (`admin`) یا یک شرکت مشتری (`tenant`).',
        codeRef: 'src/middleware.ts → resolveHostZone() in src/core/tenancy/hostResolver.ts',
      },
      {
        stepTitleFa: '۲. قفل کردن درهای اشتباه، محافظت SEO و زدن برچسب روی درخواست',
        detailFa:
          'تابع `routeRequestForZone` اجازه نمی‌دهد کسی از طریق ساب‌دامین یک شرکت، آدرس پنل مدیریت کل (`/admin`) را باز کند؛ در صورت مغایرت فوری خطای `404` می‌دهد. هم‌زمان `buildRobotsForHost` فقط روی `mindmittel.de` اجازه ایندکس به گوگل و ربات‌های جستجوی AI می‌دهد و روی `admin.` و ساب‌دامین‌های مشتریان دستور صریح `Disallow: /` صادر می‌کند تا فضای خصوصی هیچ شرکتی در گوگل ایندکس نشود.',
        codeRef:
          'src/core/tenancy/zoneRouting.ts → routeRequestForZone() & src/core/seo/seoPolicies.ts → buildRobotsForHost()',
      },
    ],
    inputsFa: [
      'درخواست خام کاربر از مرورگر شامل آدرس دامنه (`Host`) و مسیر صفحه یا API',
    ],
    outputsFa: [
      'درخواست برچسب‌خورده با نام شرکت (`x-mindmittel-tenant`) به نگهبان نشست و دسترسی',
      'یا رد فوری درخواست با خطای `404` در صورت ورود به مسیر غیرمجاز',
    ],
    sourceFiles: [
      'src/middleware.ts',
      'src/core/tenancy/hostResolver.ts',
      'src/core/tenancy/zoneRouting.ts',
      'src/core/seo/seoPolicies.ts',
    ],
  },
  {
    id: 'tenant-rbac-guard',
    zoneId: 'zone-0',
    titleFa: 'نگهبان نشست، RBAC و ایزوله‌سازی کانتکست',
    subtitleEn: 'Session, RBAC & AsyncLocalStorage Isolation',
    roleSummaryFa:
      'هویت کاربر، تایید ادمین شرکت و سطح دسترسی دپارتمان‌ها را بررسی کرده و کانتکست ایزوله سازمان را قفل می‌کند.',
    iconKey: 'lock',
    whatItDoesFa:
      'اگر ماژول قبلی مسئول پذیرش ساختمان بود، این ماژول **گیت امنیتی کارت‌خوان در ورودی دفتر هر شرکت** است. بررسی می‌کند که آیا شرکت فعال است، آیا کارت ورود کاربر (کوکی نشست) جعلی نیست، آیا ادمین شرکت این کارمند را تایید کرده، و این کارمند دقیقاً به کدام دپارتمان‌ها حق دسترسی دارد. سپس کل درخواست را در یک اتاقک ایزوله اجرا می‌کند تا اطلاعات دو شرکت هرگز با هم قاطی نشوند.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. بررسی فعال بودن شرکت و اصل بودن کارت ورود (HMAC)',
        detailFa:
          'تابع `withTenantApi` ابتدا اطلاعات شرکت را پیدا می‌کند (`resolveTenantBySlug`). اگر اشتراک شرکت معلق شده باشد با خطای `403` جلویش را می‌گیرد. سپس در شرکت‌های دارای ورود با کد ایمیل (`otp`)، کوکی `mm_tenant_session` را بررسی می‌کند. این کوکی یک امضای دیجیتال ضدتقلب (`HMAC`) دارد که فقط با کلید مخفی سرور باز می‌شود؛ همچنین چک می‌شود کوکی شرکت A را نتوان در ساب‌دامین شرکت B استفاده کرد.',
        codeRef:
          'src/infrastructure/http/tenantRequestGuard.ts → withTenantApi() & readTenantSession()',
      },
      {
        stepTitleFa: '۲. قفل «در انتظار تایید» و محدودسازی دپارتمان‌ها در سمت سرور',
        detailFa:
          'حتی اگر کارمند جدیدی با ایمیل شرکتی وارد شود، تا زمانی که ادمین شرکت او را تایید نکند در وضعیت `pending` می‌ماند و تمام درخواست‌هایش با خطای `403 PENDING_APPROVAL` مسدود می‌شود (رویکرد Zero-Trust). پس از تایید، توابع `canEditDocuments`، `canManageConnectors` و `resolveEffectiveDepartmentFilter` در خودِ سرور (نه فقط در ظاهر سایت!) تعیین می‌کنند این فرد اجازه ویرایش دارد یا فقط ارزیابی، و دقیقاً کدام دپارتمان‌ها را می‌تواند ببیند.',
        codeRef:
          'src/core/auth/rbac.ts → resolveEffectiveDepartmentFilter(), canEditDocuments(), canManageConnectors()',
      },
      {
        stepTitleFa: '۳. کارت شناسایی چسبیده به درخواست (AsyncLocalStorage)',
        detailFa:
          'تصور کنید در یک ثانیه، هم‌زمان دو مدیر از شرکت A و شرکت B روی دکمه‌ای کلیک کنند. `AsyncLocalStorage` (از طریق `runWithTenantContext`) مثل یک **کارت شناسایی نامرئی چسبیده به هر درخواست** است. هر وقت دیتابیس، کلید هوش مصنوعی یا لاگر صدا زده شود، به همین کارت شناسایی نگاه می‌کند و خودکار سراغ منابع همان شرکت می‌رود.',
        codeRef: 'src/infrastructure/tenancy/tenantContext.ts → runWithTenantContext()',
      },
    ],
    inputsFa: [
      'درخواست برچسب‌خورده از لبه شبکه همراه با کوکی امضاشده `mm_tenant_session`',
    ],
    outputsFa: [
      'کانتکست امن و تاییدشده شامل اطلاعات شرکت (`tenant`)، نشست (`session`) و مجوزهای دقیق کاربر (`userAccess`)',
    ],
    sourceFiles: [
      'src/infrastructure/http/tenantRequestGuard.ts',
      'src/infrastructure/tenancy/tenantContext.ts',
      'src/core/auth/rbac.ts',
      'src/core/security/sessionToken.ts',
    ],
  },

  // ==================== ZONE 1 ====================
  {
    id: 'enterprise-connectors',
    zoneId: 'zone-1',
    titleFa: 'کانکتورهای سازمانی و همگام‌سازی دلتا',
    subtitleEn: 'Enterprise Connectors & Delta Sync',
    roleSummaryFa:
      'سیاست‌ها و مصوبات را از Slack، Teams، Confluence، Notion، Google Drive و جلسات آنلاین وارد مغز شرکت می‌کند.',
    iconKey: 'plug',
    whatItDoesFa:
      'در هر شرکتی، قوانین و تصمیمات فقط در یک فایل نیستند؛ بخشی در Slack، بخشی در Google Drive و بخشی در Notion یا جلسات آنلاین پراکنده شده‌اند. این ماژول مثل یک **پل خودکار** عمل می‌کند که به ادمین شرکت اجازه می‌دهد ابزارهای سازمانی را وصل کند و با یک کلیک، آخرین مصوبات آن‌ها را مستقیم وارد «مغز شرکت» نماید.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. احراز هویت امن، مخفی‌سازی کلید و کلید روشن/خاموش',
        detailFa:
          'مسیر `POST /api/connectors` فقط برای ادمین شرکت (`canManageConnectors`) باز است. وقتی ادمین کلید اتصال (Token) یک سرویس را وارد می‌کند، تابع `maskSecretToken` نسخه نمایشی آن را ستاره‌دار می‌کند تا کسی در صفحه نتواند کلید را بخواند و نسخه واقعی فقط در فیلد `serverSecret` دیتابیس نگه داشته می‌شود.',
        codeRef:
          'src/app/api/connectors/route.ts & src/core/connectors/connectorRegistry.ts → createInitialConnectorsState()',
      },
      {
        stepTitleFa: '۲. اتصال زنده به APIها و همگام‌سازی هوشمند دلتا (Smart Delta Sync)',
        detailFa:
          'برای Slack و Notion تماس زنده با تایم‌اوت ۳.۵ ثانیه برقرار می‌شود. برای **Google Drive** اتصال کامل زنده وجود دارد: اگر کلید Service Account بدهید، سرور خودش یک گذرنامه دیجیتال امضاشده (`RS256 JWT`) می‌سازد و توکن ۱ ساعته می‌گیرد. نکته هوشمندانه اینجاست: قبل از دانلود فایل‌ها، تاریخ آخرین تغییر هر فایل (`modifiedTime`) را با زمان آخرین همگام‌سازی (`lastSyncedAt`) مقایسه می‌کند؛ اگر هیچ فایلی تغییر نکرده باشد، **دانلود مجدد را لغو می‌کند تا صفر توکن مصرف شود!**',
        codeRef:
          'src/core/connectors/googleDriveImporter.ts → fetchLiveGoogleDrivePayload() & mintGoogleServiceAccountToken()',
      },
      {
        stepTitleFa: '۳. جلوگیری از تکرار و پاکسازی نسخه‌های قبلی',
        detailFa:
          'وقتی همگام‌سازی جدیدی انجام می‌شود، تابع `syncConnectorDataIntoBrain` ابتدا نسخه‌های قدیمی همان کانکتور را هم از دیتابیس اسناد و هم از بردارها پاک می‌کند تا مغز شرکت پر از کارت‌های تکراری نشود. (کانکتورهای Teams، Confluence، Zoom و Meet در نسخه فعلی از قالب‌های ساختاریافته `buildConnectorSyncDocument` استفاده می‌کنند).',
        codeRef: 'src/infrastructure/rag/brainRepository.ts → syncConnectorDataIntoBrain()',
      },
    ],
    inputsFa: [
      'فرمان پیکربندی، روشن/خاموش یا همگام‌سازی توسط ادمین + کلید دسترسی سرویس خارجی',
      'فایل‌ها و پیام‌های دریافتی از Google Drive، Slack، Notion و سایر کانکتورها',
    ],
    outputsFa: [
      'سند تمیز و یکدست برای ورود به بخش خردکردن و بردارسازی (Zone 2)',
      'ثبت وضعیت جدید و زمان آخرین همگام‌سازی در کالکشن `connectors`',
    ],
    sourceFiles: [
      'src/app/api/connectors/route.ts',
      'src/core/connectors/connectorRegistry.ts',
      'src/core/connectors/connectorGuides.ts',
      'src/core/connectors/googleDriveImporter.ts',
    ],
  },
  {
    id: 'multimodal-extractor',
    zoneId: 'zone-1',
    titleFa: 'استخراج‌کننده چندرسانه‌ای فایل و صوت',
    subtitleEn: 'Multimodal File & Audio Extraction',
    roleSummaryFa:
      'فایل‌های PDF، پاورپوینت، تصویر، صوت و متن را پردازش کرده و به متن تمیز و آماده نمایه‌سازی تبدیل می‌کند.',
    iconKey: 'file-up',
    whatItDoesFa:
      'فرض کنید آیین‌نامه شرکت یک فایل PDF اسکن‌شده، یک ارائه پاورپوینت، عکس یک صورت‌جلسه یا صدای ضبط‌شده جلسه هیئت‌مدیره است. این ماژول مثل یک **منشی دقیق و چندمهارته** فایل را تحویل می‌گیرد، نوع آن را تشخیص می‌دهد و تمام محتوای داخلش را به متن تمیز و قابل جستجو تبدیل می‌کند.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. کنترل سقف حجم ۱۵ مگابایت و تشخیص نوع فایل',
        detailFa:
          'وقتی فایلی به `/api/brain/extract` ارسال می‌شود، ابتدا تابع `validateMultimodalFileSize` چک می‌کند حجم آن از **۱۵ مگابایت** بیشتر نباشد (در غیر این صورت خطای `413` می‌دهد تا رم سرور پر نشود). سپس `classifyMultimodalInput` فایل را در یکی از ۵ دسته قرار می‌دهد: متن (`text`)، پاورپوینت (`presentation`)، پی‌دی‌اف (`pdf`)، تصویر (`image`) یا صوت (`audio`).',
        codeRef:
          'src/app/api/brain/extract/route.ts & src/core/rag/multimodalExtractor.ts → classifyMultimodalInput()',
      },
      {
        stepTitleFa: '۲. خواندن مستقیم و فوق‌سریع فایل‌های متنی، Word (.docx) و پاورپوینت بدون نیاز به AI',
        detailFa:
          'فایل‌های متنی ساده همان لحظه در سرور خوانده می‌شوند. برای فایل‌های **Word (`.docx`)** پارسر اختصاصی `extractTextFromDocxBuffer` آرشیو فشرده ZIP را باز کرده و پاراگراف‌ها (`<w:p>`) و متن‌های (`<w:t>`) داخل `word/document.xml`، هدرها و پاورقی‌ها را با حفظ کامل حروف آلمانی استخراج می‌کند. برای `.pptx` نیز پارسر اختصاصی `extractTextFromPptxBuffer` اسلایدها (`<a:t>`) را مستقیم و رایگان استخراج می‌نماید.',
        codeRef:
          'src/core/rag/multimodalExtractor.ts → extractTextFromDocxBuffer(), extractTextFromPptxBuffer(), extractTextFromPdfBuffer()',
      },
      {
        stepTitleFa: '۳. استفاده از هوش مصنوعی چندرسانه‌ای برای PDF، عکس و صدا',
        detailFa:
          'برای خواندن دقیق PDFهای پیچیده، عکس اسناد (OCR) و تبدیل گفتار به متن (Audio)، فایل به رشته Base64 تبدیل شده و به **مسیریاب هوش مصنوعی (Zone 3)** با پروفایل سریع (`fast`) و تایم‌اوت ۱۸ ثانیه سپرده می‌شود. اگر اینترنت یا API قطع باشد، سیستم متوقف نمی‌شود و به پارسر پشتیبان عقب‌نشینی می‌کند.',
        codeRef: 'src/app/api/brain/extract/route.ts → executeWithFallback("fast")',
      },
    ],
    inputsFa: [
      'فایل آپلودشده توسط ادمین یا ویرایشگر (PDF، PPTX، DOCX، تصویر، صوت یا متن تا سقف ۱۵ مگابایت)',
    ],
    outputsFa: [
      'متن استخراج‌شده و عنوان پیشنهادی برای تایید نهایی کاربر و ارسال به `POST /api/brain/documents`',
    ],
    sourceFiles: [
      'src/app/api/brain/extract/route.ts',
      'src/core/rag/multimodalExtractor.ts',
      'src/app/api/brain/documents/route.ts',
    ],
  },

  // ==================== ZONE 2 ====================
  {
    id: 'parent-child-chunker',
    zoneId: 'zone-2',
    titleFa: 'خردکننده دوطبقه والد و فرزند',
    subtitleEn: 'Parent-Child Document Chunker',
    roleSummaryFa:
      'هر سند را هم‌زمان به بلوک‌های بزرگ (برای درک کامل بافت) و تکه‌های کوچک هم‌پوشان (برای جستجوی دقیق) می‌شکند.',
    iconKey: 'layers',
    whatItDoesFa:
      'تصور کنید دنبال یک تبصره در یک کتاب ۲۰۰ صفحه‌ای هستید. اگر فقط یک جمله کوتاه پیدا کنید، ممکن است استثنائات بند قبلی و بعدی را نبینید؛ و اگر کل کتاب را به هوش مصنوعی بدهید، هم کند می‌شود و هم دقتش پایین می‌آید. این ماژول مشکل را با **معماری دوطبقه والد و فرزند (Parent-Child)** حل می‌کند: جستجو روی تکه‌های کوچک و دقیق انجام می‌شود، اما موقع تحلیل، کل صفحه والد به هوش مصنوعی تحویل داده می‌شود!',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. یکدست‌سازی نام دپارتمان و برچسب‌ها',
        detailFa:
          'قبل از برش متن، تابع `normalizeToken` نام دپارتمان و برچسب‌ها را به یک فرمت استاندارد و حروف کوچک (مثلاً `finance-legal`) تبدیل می‌کند و این برچسب را روی تک‌تک قطعه‌های فرزند هم کپی می‌کند تا دیتابیس بتواند قبل از جستجو، اسناد دپارتمان‌های غیرمجاز را کنار بگذارد.',
        codeRef: 'src/core/rag/chunker.ts → normalizeToken() & normalizeMetadataTags()',
      },
      {
        stepTitleFa: '۲. برش ۲۰۰۰ کاراکتری والد و ۴۰۰ کاراکتری فرزند با هم‌پوشانی',
        detailFa:
          'ابتدا سند به بلوک‌های بزرگ **والد (`2000` کاراکتر با `100` کاراکتر هم‌پوشانی)** تقسیم شده و با اثرانگشت دیجیتال `SHA-256` شناسه یکتا می‌گیرد. سپس هر والد به تکه‌های کوچک **فرزند (`400` کاراکتر با `50` کاراکتر هم‌پوشانی)** شکسته می‌شود. آن ۵۰ کاراکتر هم‌پوشانی (Overlap) باعث می‌شود هیچ جمله مهمی درست از وسط قطع و بی‌معنا نشود.',
        codeRef: 'src/core/rag/chunker.ts → createParentChildChunks() & sliceTextWithOverlap()',
      },
    ],
    inputsFa: [
      'متن کامل و استانداردشده سند (از آپلود دستی یا کانکتورهای سازمانی)',
    ],
    outputsFa: [
      'بلوک‌های بزرگ والد (`ParentDocumentChunk[]`) برای ذخیره در `raw_documents`',
      'تکه‌های کوچک فرزند (`ChildVectorChunk[]`) برای تبدیل به بردار در ماژول بعدی',
    ],
    sourceFiles: ['src/core/rag/chunker.ts'],
  },
  {
    id: 'embedding-engine',
    zoneId: 'zone-2',
    titleFa: 'موتور بردارسازی معنایی ۷۶۸ بعدی',
    subtitleEn: '768-D Semantic Embedding Engine',
    roleSummaryFa:
      'تکه‌های فرزند و پرسش‌های مدیریتی را به بردارهای عددی ۷۶۸ بعدی با پشتیبان آفلاین تبدیل می‌کند.',
    iconKey: 'sparkles',
    whatItDoesFa:
      'کامپیوتر معنای جملات را مثل انسان نمی‌فهمد؛ اما در مقایسه اعداد فوق‌العاده است. این ماژول مثل یک **مترجم ریاضی معنا** هر تکه متن (مثلاً «هزینه بالای ۱۰ هزار یورو نیاز به تایید CFO دارد») را به یک آدرس عددی دقیق با **۷۶۸ عدد** (بردار) تبدیل می‌کند تا دو جمله هم‌معنی — حتی با کلمات متفاوت — در فضای ریاضی کنار هم قرار بگیرند.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. تولید بردار هوشمند با مدل text-embedding-004',
        detailFa:
          'تابع `generateGeminiEmbedding768` نام دپارتمان، برچسب‌ها و متن تکه فرزند را ترکیب کرده و با تایم‌اوت ۸ ثانیه به مدل بردارساز جمنای می‌فرستد و خروجی دقیقاً `768` عددی دریافت می‌کند تا کاملاً با اندیس دیتابیس هماهنگ باشد.',
        codeRef: 'src/infrastructure/gemini/embeddingService.ts → generateGeminiEmbedding768()',
      },
      {
        stepTitleFa: '۲. موتور بردارسازی آفلاین و قطعی (اگر اینترنت یا کلید نباشد)',
        detailFa:
          'اگر به هر دلیلی API جمنای در دسترس نباشد، سیستم خطا نمی‌دهد! تابع `generateDeterministicSemanticEmbedding` همان لحظه در خودِ سرور یک بردار ۷۶۸ بعدی می‌سازد: ۶۴ عدد اول برای ۶ موضوع اصلی کسب‌وکار (مالی، هیئت‌مدیره، اسکرام، نقض قانون، امنیت/DSGVO و HR به دو زبان انگلیسی و آلمانی)، ۴۴۸ عدد بعدی برای اثرانگشت کلمات، و ۲۵۶ عدد آخر برای ریشه‌کلمات ۳ حرفی تا حتی غلط املایی یا پسوندهای آلمانی هم پیدا شوند.',
        codeRef: 'src/core/rag/vectorMath.ts → generateDeterministicSemanticEmbedding()',
      },
      {
        stepTitleFa: '۳. خودترمیمی پس‌زمینه هر ۵ دقیقه (تبدیل خودکار بردار آفلاین به آنلاین)',
        detailFa:
          'اگر در زمان آپلود، جمنای موقتاً قطع بوده و بردار آفلاین ذخیره شده باشد، یک تایمر پس‌زمینه سبک برای همان سازمان روشن می‌شود و **هر ۵ دقیقه** (`RECONCILE_INTERVAL_MS`) تکه‌های آفلاین را (در دسته‌های ۲۰تایی) دوباره به `text-embedding-004` می‌فرستد. به محض وصل شدن جمنای، بردار آنلاین جدید **به‌صورت اتمیک جایگزین بردار آفلاین** در MongoDB و رم می‌شود (بردار آفلاین پاک می‌شود) و پس از صفر شدن صف، تایمر خودش را خاموش می‌کند. در صورت ری‌استارت سرور هم `hydrateVaultFromMongo` صف باقی‌مانده را خودکار دوباره بیدار می‌کند.',
        codeRef:
          'src/core/rag/embeddingReconciler.ts → reconcileOfflineChunksBatch() & createTenantEmbeddingReconcileScheduler()',
      },
    ],
    inputsFa: [
      'تکه‌های ۴۰۰ کاراکتری فرزند هنگام ثبت سند جدید، یا متن تصمیم مدیر هنگام ارزیابی',
    ],
    outputsFa: [
      'بردار عددی ۷۶۸ بعدی برای ذخیره در `vector_store` یا جستجوی معنایی (همراه با ارتقای خودکار ۵ دقیقه‌ای به بردار آنلاین)',
    ],
    sourceFiles: [
      'src/infrastructure/gemini/embeddingService.ts',
      'src/core/rag/vectorMath.ts',
      'src/core/rag/embeddingReconciler.ts',
    ],
  },
  {
    id: 'vector-retriever',
    zoneId: 'zone-2',
    titleFa: 'موتور بازیابی معنایی و هرس استنادات',
    subtitleEn: 'Vector Retrieval & Citation Pruning',
    roleSummaryFa:
      'مرتبط‌ترین سیاست‌های مجاز کاربر را با جستجوی برداری پیدا کرده، اسناد کامل والد را بازیابی و موارد کم‌ربط را حذف می‌کند.',
    iconKey: 'search',
    whatItDoesFa:
      'وقتی مدیری یک تصمیم جدید را می‌نویسد، این ماژول مثل یک **کتابدار فوق‌سریع و امانت‌دار** وارد آرشیو شرکت می‌شود؛ فقط در قفسه‌هایی می‌گردد که این کارمند اجازه دیدنش را دارد، نزدیک‌ترین سیاست‌ها را پیدا می‌کند، متن کامل آن‌ها را برمی‌دارد و برگه‌های بی‌ربط را کنار می‌گذارد تا هوش مصنوعی گیج نشود.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. جستجوی برداری با قفل دسترسی دپارتمان (Zero-Leak)',
        detailFa:
          'تابع `searchBrainByVectorSimilarity` ابتدا چک می‌کند آیا کاربر اصلاً به دپارتمانی دسترسی دارد یا نه. سپس جستجوی `$vectorSearch` را روی اندیس `mindmittel_vector_index` اجرا می‌کند و در همان کوئری دیتابیس، فیلتر دپارتمان‌های مجاز (`metadata.department`) و اسناد مستثنی‌شده توسط کاربر (`excludedParentIds`) را اعمال می‌نماید.',
        codeRef:
          'src/infrastructure/rag/brainRepository.ts → searchBrainByVectorSimilarity()',
      },
      {
        stepTitleFa: '۲. تبدیل تکه کوچک به سند کامل والد + پشتیبان درون‌حافظه‌ای',
        detailFa:
          'از روی تکه‌های کوچک پیدا‌شده، متن کامل سند والد (`2000` کاراکتری) را از `raw_documents` بیرون می‌کشد و تکرارها را حذف می‌کند. اگر دیتابیس Atlas هنوز در حال ساخت اندیس باشد یا لحظه‌ای در دسترس نباشد، به‌صورت خودکار روی حافظه رم با محاسبه شباهت کسینوسی (`computeCosineSimilarity`) همان نتیجه را برمی‌گرداند.',
        codeRef: 'src/core/rag/vectorMath.ts → rankParentDocumentsByVectorMatch() & computeCosineSimilarity()',
      },
      {
        stepTitleFa: '۳. پل دوگانه بدون نقطه کور (در ۵ دقیقه انتظار) و هرس استنادات',
        detailFa:
          'اگر سندی به تازگی در حالت قطعی ذخیره شده باشد و هنوز در صف ۵ دقیقه‌ای تبدیل به بردار آنلاین باشد، `searchBrainByVectorSimilarity` در کنار جستجوی آنلاین، همان چند تکه آفلاین را هم در فضای ریاضی خودش می‌سنجد و نتایج را ترکیب می‌کند تا حتی یک ثانیه هم نقطه کور وجود نداشته باشد. در نهایت `filterRelevantCitations` اسناد کم‌ارتباط (زیر `0.70` یا افت بیش از `0.15`) را هرس می‌کند.',
        codeRef:
          'src/infrastructure/rag/brainRepository.ts → mergeWithPendingOffline() & src/core/audit/decisionEvaluator.ts → filterRelevantCitations()',
      },
    ],
    inputsFa: [
      'بردار ۷۶۸ بعدی تصمیم مدیریتی + لیست دپارتمان‌های مجاز کاربر + لیست اسناد مستثنی‌شده',
    ],
    outputsFa: [
      'فهرست پالایش‌شده بهترین اسناد والد (`MatchedParentContextInput[]`) به موتور ممیزی',
    ],
    sourceFiles: [
      'src/infrastructure/rag/brainRepository.ts',
      'src/core/rag/vectorMath.ts',
      'src/core/audit/decisionEvaluator.ts',
    ],
  },
  {
    id: 'conflict-detector',
    zoneId: 'zone-2',
    titleFa: 'کاشف خودکار تعارض اسناد داخلی',
    subtitleEn: 'Pairwise Policy Conflict Detector',
    roleSummaryFa:
      'تمام سیاست‌های موجود در مغز شرکت را دو‌به‌دو مقایسه کرده و تضادهای عددی یا لغو قوانین الزامی را هشدار می‌دهد.',
    iconKey: 'alert-triangle',
    whatItDoesFa:
      'بسیاری از مشکلات شرکت‌ها از اینجا شروع می‌شود که دو بخش مختلف بدون خبر از هم، دو قانون متناقض تصویب می‌کنند (مثلاً در آیین‌نامه مالی سقف خرید ۱۰ هزار یورو است ولی در مصوبه جدید Slack شده ۲۵ هزار یورو). این ماژول مثل یک **بازرس داخلی هوشیار** تمام اسناد مغز شرکت را دو‌به‌دو مقایسه می‌کند و قبل از وقوع بحران، تضادها را با کارت هشدار نشان می‌دهد.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. تشخیص اینکه آیا دو سند اصلاً درباره یک موضوع مشترک هستند؟',
        detailFa:
          'تابع `detectBrainDocumentConflicts` هر دو سند با عنوان متفاوت را با شباهت کسینوسی می‌سنجد. اگر دو سند در یک دپارتمان باشند شباهت بالای `0.24` و اگر در دپارتمان‌های متفاوت باشند شباهت بالای `0.34` نشان می‌دهد که این دو سند درباره یک موضوع مشترک صحبت می‌کنند.',
        codeRef: 'src/core/rag/conflictDetector.ts → detectBrainDocumentConflicts()',
      },
      {
        stepTitleFa: '۲. کشف تضاد «الزام در برابر لغو» و تضاد «اعداد و سقف‌های مالی»',
        detailFa:
          'سپس دو چیز چک می‌شود: اول اینکه آیا یک سند کاری را **الزامی/ممنوع** کرده و سند دیگر آن را **لغو یا اختیاری** کرده (`POLICY_POLARITY_CONFLICT`)؟ دوم اینکه تابع `extractKeyNumbers` مبالغ ارزی (مثل یورو و دلار)، درصدها و زمان‌ها را بیرون می‌کشد (بدون اینکه تاریخ‌های تقویمی مثل `10.2020` را با پول اشتباه بگیرد!) و اگر اعداد دو سند با هم نخوانند، هشدار `NUMERIC_THRESHOLD_CONFLICT` صادر می‌کند.',
        codeRef: 'src/core/rag/conflictDetector.ts → extractKeyNumbers()',
      },
    ],
    inputsFa: [
      'لیست تمام اسناد والد مجاز کاربر از مغز شرکت (`listBrainDocuments`)',
    ],
    outputsFa: [
      'لیست هشدارهای دوزبانه تعارض (`BrainKnowledgeConflictWarning[]`) برای نمایش در صفحه Company Brain',
    ],
    sourceFiles: [
      'src/core/rag/conflictDetector.ts',
      'src/app/api/brain/documents/route.ts',
    ],
  },

  // ==================== ZONE 3 (DEDICATED HUB) ====================
  {
    id: 'ai-model-router',
    zoneId: 'zone-3',
    titleFa: 'مسیریاب پویا و فیوز ۱۵ دقیقه‌ای مدل‌های AI',
    subtitleEn: 'Dynamic AI Model Router & 15m Circuit Breaker',
    roleSummaryFa:
      'به‌طور خودکار بهترین مدل را برای کارهای سریع یا استدلالی انتخاب کرده و مدل‌های خطادار را ۱۵ دقیقه قرنطینه می‌کند.',
    iconKey: 'cpu',
    whatItDoesFa:
      'بزرگ‌ترین نقطه ضعف اپلیکیشن‌های هوش مصنوعی این است که اسم یک مدل را ثابت در کد می‌نویسند؛ به محض اینکه گوگل آن مدل را منقضی کند یا شلوغ شود، کل سیستم از کار می‌افتد! این هاب مرکزی مثل یک **مرکز کنترل ترافیک هوشمند به همراه کلید فیوز برق** عمل می‌کند: خودش لیست مدل‌های زنده گوگل را می‌بیند، بهترین مدل را برای هر کار انتخاب می‌کند و اگر مدلی خطا داد، آن را موقتاً کنار می‌گذارد و بی‌صدا سراغ مدل بعدی می‌رود.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. تشخیص خودکار کارِ سریع در برابر تحلیلِ عمیق + حذف مدل‌های نامربوط',
        detailFa:
          'تابع `inferProfileFromQuery` به متن نگاه می‌کند: اگر درخواست طولانی (بیش از `110` کاراکتر) یا دارای کلمات ممیزی و ریسک باشد، پروفایل استدلالی (`reasoning` با اولویت مدل‌های `Pro`) و برای کارهای سریع مثل خواندن عکس و فایل، پروفایل سریع (`fast` با اولویت `Flash`) را انتخاب می‌کند. همچنین `isTextGenerationCandidate` مدل‌های نامناسب مثل مدل‌های تولید عکس (`image`، `imagen`، `Nano Banana`)، صوت (`tts`) یا `gemma` را خط می‌زند تا هرگز اشتباهی انتخاب نشوند.',
        codeRef:
          'src/core/ai/modelRanking.ts → inferProfileFromQuery(), isTextGenerationCandidate(), scoreModelForProfile()',
      },
      {
        stepTitleFa: '۲. امتیازدهی هوشمند و کش ۶ ساعته لیست مدل‌ها',
        detailFa:
          'هر مدل بر اساس خانواده، شماره نسخه و پایداری (`stable` بالاتر از `preview`) امتیاز می‌گیرد. برای اینکه هر بار وقت تلف نشود، این لیست به مدت **۶ ساعت** در حافظه ذخیره (کش) می‌شود؛ و اگر تماس با گوگل لحظه‌ای قطع شود، از همان لیست کش‌شده قبلی استفاده می‌کند.',
        codeRef: 'src/infrastructure/gemini/modelSelector.ts → getModelCatalog() & selectModel()',
      },
      {
        stepTitleFa: '۳. کلید فیوز ۱۵ دقیقه‌ای (Circuit Breaker) و تور ایمنی نسل ۲.۵',
        detailFa:
          'تابع `executeWithFallback` تا **۴ مدل مختلف** را به ترتیب امتحان می‌کند (و همیشه یک مدل امتحان‌پس‌داده نسل `2.x` را به عنوان تور ایمنی در آخر صف نگه می‌دارد). اگر مدلی خطای سهمیه (`429`)، خطای سرور (`5xx`) یا تایم‌اوت داد، مثل فیوز برق پریده، آن مدل به مدت **۱۵ دقیقه** قرنطینه می‌شود (`markModelUnhealthy`) تا درخواست‌های بعدی معطل آن مدل خراب نشوند و مستقیم سراغ مدل سالم بروند.',
        codeRef:
          'src/infrastructure/gemini/modelSelector.ts → executeWithFallback() & markModelUnhealthy()',
      },
    ],
    inputsFa: [
      'درخواست اجرای عملیات هوشمند از استخراج فایل (Zone 1)، بردارسازی (Zone 2) و ممیزی تصمیمات (Zone 4)',
    ],
    outputsFa: [
      'پاسخ موفق عملیات همراه با نام دقیق مدلی که کار را انجام داده (`usedModelId`) و تعداد تلاش‌ها',
    ],
    sourceFiles: [
      'src/core/ai/modelRanking.ts',
      'src/infrastructure/gemini/modelSelector.ts',
      'src/app/api/ai/models/route.ts',
    ],
  },

  // ==================== ZONE 4 ====================
  {
    id: 'dual-stage-auditor',
    zoneId: 'zone-4',
    titleFa: 'ارزیاب دومرحله‌ای تصمیمات مدیریتی',
    subtitleEn: 'Dual-Stage Decision Evaluator (Heuristic + LLM)',
    roleSummaryFa:
      'تصمیم پیشنهادی را ابتدا با موتور قطعی و سپس با سنتز ساختاریافته JSON توسط LLM در برابر اسناد شرکت می‌سنجد.',
    iconKey: 'scale',
    whatItDoesFa:
      'اینجا هسته اصلی محصول MindMittel است. تصمیم پیشنهادی مدیر را کنار سیاست‌های پیدا‌شده از مغز شرکت می‌گذارد و مثل یک **مشاور ارشد حاکمیت شرکتی** بررسی می‌کند آیا این تصمیم با قوانین داخلی سازگار است یا نه، چه ریسک‌هایی دارد و در ۳ گام عملی چطور باید اجرا شود.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. مرحله اول: ساخت گزارش پایه قطعی (تضمین کارکرد حتی بدون اینترنت)',
        detailFa:
          'پیش از اینکه اصلاً با هوش مصنوعی تماس گرفته شود، تابع `evaluateDecisionAgainstPoliciesHeuristic` با قوانین قطعی بررسی می‌کند آیا در تصمیم مدیر نشانه‌های دور زدن قانون (مثل «لغو»، «بدون تایید»، «فراتر از بودجه») در کنار قوانین الزامی اسناد وجود دارد یا نه. این مرحله یک گزارش پایه کامل (با نمره `34` برای تعارض، `62-68` برای مشروط و `92` برای تایید) می‌سازد تا سیستم هیچ‌وقت دست خالی نماند.',
        codeRef:
          'src/core/audit/decisionEvaluator.ts → evaluateDecisionAgainstPoliciesHeuristic()',
      },
      {
        stepTitleFa: '۲. مرحله دوم: پرامپت مهندسی‌شده سطح مدیرعامل (ضدتوهم، ضدتزریق و با مقیاس نمره)',
        detailFa:
          'تابع `buildExecutiveAuditPrompt` پرامپت تخصصی ممیزی را با استاندارد ۴۵ ثانیه‌ای خوانش مدیرعامل می‌سازد: ورودی‌ها داخل تگ‌های XML (`<proposed_decision>` و `<company_brain_documents>`) ایزوله می‌شوند تا از تزریق پرامپت (Prompt Injection) جلوگیری شود؛ در صورت نبود سند مرتبط، قانون صریح ضدتوهم (`status="EMPTY"`) مانع اختراع بند ساختگی می‌شود؛ مقیاس دقیق نمره (`10-44` تعارض، `45-79` مشروط، `80-99` تایید) و هشدارهای پیش‌غربالگری قوانین آلمان در پرامپت تزریق شده و نقشه راه ۳ مرحله‌ای با تعیین دقیق مسئول هر گام (`[Role] Action — Deliverable`) تولید می‌گردد.',
        codeRef:
          'src/core/audit/auditPromptBuilder.ts → buildExecutiveAuditPrompt() & src/app/api/brain/audit/route.ts → callGeminiAuditSynthesis()',
      },
    ],
    inputsFa: [
      'متن تصمیم پیشنهادی مدیر + زبان انتخابی (`EN` / `DE`) + اسناد والد مرتبط از Zone 2 + سیگنال‌های پیش‌غربالگری قوانین آلمان',
    ],
    outputsFa: [
      'گزارش ارزیابی اولیه (`ExecutiveAuditReport`) برای عبور اجباری از گارد تنزل حکم قوانین آلمان',
    ],
    sourceFiles: [
      'src/app/api/brain/audit/route.ts',
      'src/core/audit/auditPromptBuilder.ts',
      'src/core/audit/decisionEvaluator.ts',
    ],
  },
  {
    id: 'german-regulatory-engine',
    zoneId: 'zone-4',
    titleFa: 'موتور غربالگری قوانین آلمان و گارد تنزل حکم',
    subtitleEn: 'German Statutory Screening & Verdict Guard',
    roleSummaryFa:
      'پس از پاسخ LLM، تصمیم را به‌صورت قطعی در برابر BetrVG، DSGVO، EU AI Act و NIS-2 بررسی کرده و مانع تایید غیرقانونی می‌شود.',
    iconKey: 'landmark',
    whatItDoesFa:
      'در شرکت‌های آلمانی (Mittelstand)، ممکن است یک تصمیم با قوانین داخلی خودِ شرکت هیچ تضادی نداشته باشد، اما با قانون کار آلمان یا قوانین حفاظت از داده تداخل جدی داشته باشد! این ماژول مثل یک **مهر تایید نهایی حقوقی** عمداً **بعد از پایان کار هوش مصنوعی** اجرا می‌شود تا مدل هوش مصنوعی هرگز نتواند یک ریسک قانونی را سهواً نادیده بگیرد.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. بازیابی مواد واقعی قوانین آلمان (Legal RAG) + رعایت پروفایل شرکت',
        detailFa:
          'علاوه بر الگوهای قطعی، ماژول `germanLegalCorpus.ts` شامل **۲۰ ماده کلیدی و مستند قوانین آلمان و اروپا** (از جمله `BetrVG §87/99/111` به همراه رای دیوان کار `BAG` درباره قابلیت بالقوه پایش، `DSGVO Art. 6/9/22/28/35/44`، `EU AI Act Art. 4/5/26/50` شامل ممنوعیت تشخیص احساسات در محیط کار با جریمه تا ۳۵ میلیون یورو، و `NIS-2 / BSIG §30/32/38`) را با بازیابی ترکیبی (`retrieveRelevantGermanLegalArticles`) استخراج کرده و همراه با نام سند حقوقی الزامی (`Betriebsvereinbarung`، `AVV`، `DSFA`) به پرامپت ممیزی تزریق می‌کند. در صورت غیرفعال بودن `Betriebsrat` یا `NIS-2` در **Company Profile**، مواد مربوطه به‌صورت خودکار حذف می‌شوند.',
        codeRef:
          'src/core/audit/germanLegalCorpus.ts → retrieveRelevantGermanLegalArticles() & src/core/audit/germanRegulatoryAdvisor.ts → evaluateGermanRegulatoryAdvisory()',
      },
      {
        stepTitleFa: '۲. کشف جای خالی در قوانین شرکت (Knowledge Gap Detection)',
        detailFa:
          'تابع `computeTopicOverlap` ریشه کلمات تصمیم را با اسناد شرکت مقایسه می‌کند. اگر هیچ سیاست داخلی مرتبطی پیدا نشود (`0` کلمه مشترک)، وضعیت `KNOWLEDGE_GAP_DETECTED` را اعلام می‌کند و به مدیر پیشنهاد می‌دهد پس از تصمیم‌گیری، یک سند جدید با عنوان و دپارتمان پیشنهادی در مغز شرکت ثبت کند.',
        codeRef: 'src/core/audit/germanRegulatoryAdvisor.ts → computeTopicOverlap()',
      },
      {
        stepTitleFa: '۳. گارد یک‌طرفه تنزل حکم (جلوگیری از تایید غیرقانونی)',
        detailFa:
          'تابع `applyGermanAdvisoryToReport` یک قانون سفت‌وسخت دارد: اگر حتی یکی از ۴ قانون بالا در وضعیت قرمز (`TRIGGERED`) باشد، حتی اگر هوش مصنوعی حکم «تایید کامل (`CERTIFIED`)» داده باشد، این گارد حکم را به‌اجبار به **«مشروط (`CONDITIONAL`)»** تنزل می‌دهد، نمره انطباق را حداکثر روی `74` قفل می‌کند و گام قانونی الزامی (مثلاً هماهنگی با Betriebsrat یا DPO) را به نقشه راه اضافه می‌نماید.',
        codeRef: 'src/core/audit/germanRegulatoryAdvisor.ts → applyGermanAdvisoryToReport()',
      },
    ],
    inputsFa: [
      'گزارش تولیدشده توسط ارزیاب دومرحله‌ای + متن تصمیم + اسناد والد مرتبط',
    ],
    outputsFa: [
      'گزارش نهایی ممهور به هشدارهای قانونی و لیست اسناد مستثنی‌شده برای ذخیره در دیتابیس و ارسال به کاربر',
    ],
    sourceFiles: [
      'src/core/audit/germanLegalCorpus.ts',
      'src/core/audit/germanRegulatoryAdvisor.ts',
      'src/app/api/brain/audit/route.ts',
    ],
  },

  // ==================== ZONE 5 (DEDICATED HUB) ====================
  {
    id: 'tenant-mongodb-cluster',
    zoneId: 'zone-5',
    titleFa: 'پایگاه داده ایزوله MongoDB و اندیس برداری',
    subtitleEn: 'Isolated Tenant MongoDB & Vector Index',
    roleSummaryFa:
      'داده‌های هر سازمان را در دیتابیس اختصاصی با ۶ کالکشن کلیدی و اندیس جستجوی برداری ۷۶۸ بعدی ذخیره می‌کند.',
    iconKey: 'database',
    whatItDoesFa:
      'این هاب، **خزانه اصلی و دائمی داده‌های پلتفرم** است. به‌جای اینکه اطلاعات همه شرکت‌ها در یک جدول مشترک ریخته شود، برای هر سازمان یک دیتابیس کاملاً مستقل (`mindmittel_<slug>` یا حتی سرور MongoDB اختصاصی خودِ مشتری) مدیریت می‌شود.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. استخر اتصال هوشمند (خطوط آماده ارتباط با دیتابیس)',
        detailFa:
          'هر بار وصل شدن از صفر به دیتابیس زمان‌بر است؛ پس سرور یک «استخر اتصال» (تعدادی خط ارتباطی آماده و باز) نگه می‌دارد. وقتی `getMindMittelDb` صدا زده می‌شود، از روی کارت شناسایی درخواست (`AsyncLocalStorage`) می‌فهمد کدام شرکت است: اگر شرکت روی کلاستر اصلی MindMittel باشد از استخر اصلی (حداکثر **۱۰ خط هم‌زمان** `maxPoolSize: 10`) به دیتابیس اختصاصی همان شرکت وصل می‌شود. اما اگر مشتری بزرگی دیتابیس MongoDB جداگانه خودش را داشته باشد، از استخر جداگانه `getIsolatedClient` استفاده می‌کند که برای جلوگیری از پر شدن رم سرور، حداکثر **۵ اتصال اختصاصی اخیر (قانون LRU)** را هم‌زمان باز نگه می‌دارد و در صورت آمدن مشتری ششم، قدیمی‌ترین اتصال کم‌استفاده را مودبانه می‌بندد.',
        codeRef:
          'src/infrastructure/db/mongo.ts → getMindMittelDb(), getMongoClient(), getIsolatedClient()',
      },
      {
        stepTitleFa: '۲. ۶ کالکشن تفکیک‌شده و اندیس جستجوی برداری ۷۶۸ بعدی',
        detailFa:
          'درون دیتابیس هر شرکت ۶ مجموعه داده منظم وجود دارد: `raw_documents` (متن کامل والد)، `vector_store` (تکه‌های فرزند و بردار ۷۶۸ بعدی)، `audit_history` (آرشیو گزارش‌های ممیزی)، `connectors` (تنظیمات کانکتورها)، `users` (کارمندان و دسترسی‌ها) و `tenant_departments` (دپارتمان‌های سفارشی). اندیس جستجوی معنایی `mindmittel_vector_index` نیز به‌طور خودکار توسط `ensureAtlasVectorIndexProvisioned` بررسی و ساخته می‌شود.',
        codeRef:
          'src/infrastructure/db/schemas.ts → COLLECTIONS & VECTOR_INDEX_DEFINITION',
      },
    ],
    inputsFa: [
      'عملیات ذخیره، ویرایش و حذف آبشاری از کانکتورها (Zone 1)، پایپ‌لاین RAG (Zone 2) و موتور ممیزی (Zone 4)',
    ],
    outputsFa: [
      'نتایج جستجوی برداری (`$vectorSearch`)، اسناد والد، تاریخچه ممیزی و لیست دسترسی کاربران',
    ],
    sourceFiles: [
      'src/infrastructure/db/mongo.ts',
      'src/infrastructure/db/databaseTarget.ts',
      'src/infrastructure/db/schemas.ts',
    ],
  },
  {
    id: 'in-memory-vault-hydration',
    zoneId: 'zone-5',
    titleFa: 'لایه حافظه سریع و هیدراتاسیون خودکار',
    subtitleEn: 'In-Memory Vault & Self-Healing Hydration',
    roleSummaryFa:
      'یک کپی تفکیک‌شده در رم برای هر سازمان نگه می‌دارد تا در زمان ساخت اندیس یا قطعی موقت، سیستم بدون توقف کار کند.',
    iconKey: 'hard-drive',
    whatItDoesFa:
      'اگر MongoDB را مثل **بایگانی بزرگ طبقه پایین** تصور کنید، این ماژول مثل **دفترچه یادداشت سریع روی میز کار** است. در سرورهای ابری ممکن است سرور ری‌استارت شود یا اندیس برداری چند ثانیه در حال ساخت باشد؛ این لایه باعث می‌شود کاربر هرگز خطا یا صفحه خالی نبیند و سیستم بدون وقفه ادامه دهد.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. قفسه جداگانه در حافظه رم برای هر شرکت',
        detailFa:
          'تابع `getMemoryVault` برای هر شرکت یک فضای حافظه کاملاً جداگانه (`InMemoryBrainVault`) درون یک نقشه کلید-مقدار می‌سازد تا اطلاعات دو سازمان حتی برای یک میلی‌ثانیه هم در حافظه رم سرور با هم مخلوط نشوند.',
        codeRef: 'src/infrastructure/rag/brainRepository.ts → getMemoryVault()',
      },
      {
        stepTitleFa: '۲. پر کردن خودکار پس از ری‌استارت (Hydration) و حذف هم‌زمان',
        detailFa:
          'پس از هر بار راه‌اندازی مجدد سرور، تابع `hydrateVaultFromMongo` به‌طور خودکار تا `100` سند والد و `500` بردار فرزند را از MongoDB به رم می‌آورد. همچنین هنگام ویرایش (`updateBrainDocument`) یا حذف (`removeBrainDocument`) یک سند، تمام تکه‌های والد و فرزند به‌صورت هم‌زمان و یکپارچه هم از رم و هم از MongoDB پاک یا جایگزین می‌شوند تا هیچ داده یتیمی باقی نماند.',
        codeRef:
          'src/infrastructure/rag/brainRepository.ts → hydrateVaultFromMongo(), updateBrainDocument(), removeBrainDocument()',
      },
    ],
    inputsFa: [
      'داده‌های بازیابی‌شده از MongoDB و تغییرات لحظه‌ای ثبت/ویرایش اسناد',
    ],
    outputsFa: [
      'پاسخ فوری برای جستجوی کسینوسی پشتیبان، فهرست اسناد و وضعیت سلامت اندیس برداری',
    ],
    sourceFiles: ['src/infrastructure/rag/brainRepository.ts'],
  },

  // ==================== ZONE 6 ====================
  {
    id: 'ndjson-heartbeat-stream',
    zoneId: 'zone-6',
    titleFa: 'تحویل استریم NDJSON با ضربان قلب ۸ ثانیه‌ای',
    subtitleEn: 'NDJSON 8s Heartbeat Stream & PDF Export',
    roleSummaryFa:
      'در عملیات سنگین هوش مصنوعی هر ۸ ثانیه پالس زنده می‌فرستد تا تایم‌اوت پروکسی رخ ندهد و گزارش نهایی را در داشبورد و PDF نمایش می‌دهد.',
    iconKey: 'radio',
    whatItDoesFa:
      'در سرویس‌های میزبانی مثل Heroku، اگر سروری بیش از ۳۰ ثانیه سکوت کند و هیچ بایتی به مرورگر نفرستد، روتر فکر می‌کند سرور قفل کرده و ارتباط را با خطای `H12 Timeout` قطع می‌کند! این ماژول مثل کسی است که پشت تلفن **هر ۸ ثانیه می‌گوید «الو، هنوز دارم گزارش رو آماده می‌کنم، قطع نکن!»** تا تحلیل‌های سنگین هوش مصنوعی بدون هیچ خطایی به پایان برسند.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. ارسال فوری اولین پالس و تکرار هر ۸ ثانیه تا پایان تحلیل',
        detailFa:
          'تابع `runWithHeartbeatStream` با دیدن هدر `x-mindmittel-stream: 1` یک کانال جریانی (`NDJSON`) باز می‌کند، در کمتر از ۵ میلی‌ثانیه اولین پیامک ضربان قلب (`{"type":"heartbeat"}`) را می‌فرستد و هر `8000` میلی‌ثانیه آن را تکرار می‌کند. به‌محض آماده شدن گزارش نهایی، فریم پایانی (`{"type":"result"}`) حاوی کل گزارش ارسال و کانال بسته می‌شود.',
        codeRef: 'src/infrastructure/http/streamingResponse.ts → runWithHeartbeatStream()',
      },
      {
        stepTitleFa: '۲. دریافت هوشمند در مرورگر و چاپ گزارش رسمی A4 PDF',
        detailFa:
          'در سمت مرورگر، تابع `fetchJsonWithHeartbeat` خط‌های ضربان قلب را بی‌صدا رد می‌کند و به محض رسیدن نتیجه، گزارش را روی داشبورد می‌نشاند. مدیر همچنین می‌تواند با دکمه چاپ (`window.print()`) یک سند رسمی A4 PDF با لوگوی اختصاصی شرکت خودش ذخیره کند.',
        codeRef: 'src/app/page.tsx → fetchJsonWithHeartbeat() & handleRunExecutiveAudit()',
      },
    ],
    inputsFa: [
      'گزارش نهایی ممیزی از Zone 4 (`/api/brain/audit`) و متن استخراج‌شده فایل از Zone 1 (`/api/brain/extract`)',
    ],
    outputsFa: [
      'نمایش زنده گزارش در داشبورد وب، به‌روزرسانی لیست تاریخچه و خروجی چاپی PDF',
    ],
    sourceFiles: [
      'src/infrastructure/http/streamingResponse.ts',
      'src/app/page.tsx',
    ],
  },
  {
    id: 'sse-live-telemetry',
    zoneId: 'zone-6',
    titleFa: 'لاگر حلقوی ضدافشا و تله‌متری زنده SSE',
    subtitleEn: 'Ring-Buffer Logger & SSE Live Telemetry',
    roleSummaryFa:
      'رویدادهای تمام ماژول‌ها را پس از پاکسازی رمزها در بافر حلقوی ثبت و به‌صورت لحظه‌ای به پنل مانیتورینگ پخش می‌کند.',
    iconKey: 'activity',
    whatItDoesFa:
      'این ماژول **جعبه سیاه زنده هواپیما** برای مهندسان سیستم است. هر اتفاق مهمی در سرور بیفتد (کدام مدل AI انتخاب شد، چند سند بررسی شد، آیا خطایی رخ داد) را لحظه‌ای ثبت می‌کند و بدون نیاز به رفرش صفحه روی مانیتور `/system` نشان می‌دهد — اما قبل از نمایش، مثل یک سانسورچی امنیتی تمام رمزها و کلیدها را خط می‌زند.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. حافظه حلقوی ۲۵۰ تایی + پاکسازی خودکار رمزها و کلیدها',
        detailFa:
          'برای اینکه لاگ‌ها به مرور حافظه رم سرور را پر نکنند، `createRingBufferLogger` یک لیست چرخشی با ظرفیت ثابت `250` رویداد دارد (وقتی ۲۵۱اُمی می‌آید، قدیمی‌ترین حذف می‌شود). پیش از ثبت هر خط، تابع `redactSensitiveMetadata` تمام فیلدهای حساس (`apiKey`، `password`، `secret`، `token`، `mongodb_uri`) را پیدا کرده و با عبارت `[REDACTED]` جایگزین می‌کند.',
        codeRef:
          'src/infrastructure/logging/logger.ts → createRingBufferLogger() & redactSensitiveMetadata()',
      },
      {
        stepTitleFa: '۲. پخش زنده یک‌طرفه (SSE) به تفکیک هر سازمان',
        detailFa:
          'مسیر `GET /api/system/logs/stream` یک کانال زنده `Server-Sent Events` باز می‌کند، ۵۰ لاگ اخیر همان سازمان را فوراً ارسال کرده و از آن لحظه به بعد هر اتفاق جدیدی بیفتد را مستقیم روی `SystemObservabilityPanel` پخش می‌کند.',
        codeRef:
          'src/app/api/system/logs/stream/route.ts & src/components/system/SystemObservabilityPanel.tsx',
      },
    ],
    inputsFa: [
      'گزارش رویدادهای `systemLogger.info/warn/error` از تمام لایه‌های سیستم',
    ],
    outputsFa: [
      'پخش زنده و امن لاگ‌ها در صفحه مانیتورینگ `/system`',
    ],
    sourceFiles: [
      'src/infrastructure/logging/logger.ts',
      'src/app/api/system/logs/stream/route.ts',
      'src/components/system/SystemObservabilityPanel.tsx',
    ],
  },
];

export const BLUEPRINT_CONNECTIONS: readonly BlueprintConnectionSpec[] = [
  // Main Vertical Pipeline Flows
  {
    id: 'conn-edge-to-guard',
    fromModuleId: 'edge-host-router',
    toModuleId: 'tenant-rbac-guard',
    labelFa: 'تزریق هویت ساب‌دامین و عبور به نگهبان نشست',
    whatItDoesFa:
      'مسئول پذیرش (لبه شبکه) پس از اینکه مطمئن شد آدرس دامنه معتبر است، روی درخواست برچسب نام شرکت می‌زند و آن را به گیت امنیتی تحویل می‌دهد.',
    internalMechanicsFa:
      'تابع `middleware` هدرهای داخلی `x-mindmittel-zone` و `x-mindmittel-tenant` را روی درخواست اضافه می‌کند تا `withTenantApi` دقیقاً بداند کوکی ورود کاربر را باید با کدام شرکت تطبیق دهد.',
    payloadSummaryFa: 'HTTP Request + x-mindmittel-tenant + mm_tenant_session Cookie',
  },
  {
    id: 'conn-guard-to-connectors',
    fromModuleId: 'tenant-rbac-guard',
    toModuleId: 'enterprise-connectors',
    labelFa: 'دسترسی ادمین شرکت به کانکتورها',
    whatItDoesFa:
      'فقط مدیران سیستم شرکت (`admin`) اجازه دارند به ابزارهای خارجی مثل Google Drive یا Slack وصل شوند؛ کارمندان عادی از این در عبور نمی‌کنند.',
    internalMechanicsFa:
      'تابع `canManageConnectors(userAccess)` در مسیر `/api/connectors` نقش کاربر را چک می‌کند و در صورت نداشتن نقش ادمین، فوراً با خطای `403 FORBIDDEN_ADMIN_ONLY` مانع ورود می‌شود.',
    payloadSummaryFa: 'Authorized Admin Context + Connector Action (configure | toggle | sync)',
  },
  {
    id: 'conn-guard-to-extractor',
    fromModuleId: 'tenant-rbac-guard',
    toModuleId: 'multimodal-extractor',
    labelFa: 'مجوز آپلود فایل و استخراج متن',
    whatItDoesFa:
      'تنها ادمین‌ها و ویرایشگران دانش (`editor`) اجازه دارند فایل جدیدی آپلود کنند و وارد مغز شرکت نمایند.',
    internalMechanicsFa:
      'تابع `canEditDocuments(userAccess)` هم هنگام استخراج فایل (`/api/brain/extract`) و هم هنگام ثبت سند در دپارتمان مقصد (`/api/brain/documents`) کنترل می‌شود تا کسی نتواند در دپارتمان غیرمجاز سند ثبت کند.',
    payloadSummaryFa: 'Authorized Editor/Admin Context + Multipart File Buffer (<= 15 MB)',
  },
  {
    id: 'conn-guard-to-auditor',
    fromModuleId: 'tenant-rbac-guard',
    toModuleId: 'dual-stage-auditor',
    labelFa: 'ارسال تصمیم مدیریتی با محدوده دپارتمان مجاز',
    whatItDoesFa:
      'همه کارمندان تاییدشده می‌توانند تصمیمات خود را ارزیابی کنند، اما سیستم در سمت سرور لیست دپارتمان‌های مجاز آن‌ها را ضمیمه می‌کند تا اسناد محرمانه بخش‌های دیگر نشت نکند.',
    internalMechanicsFa:
      'تابع `resolveEffectiveDepartmentFilter(userAccess, departmentFilter)` لیست نهایی دپارتمان‌های مجاز را محاسبه کرده و به موتور جستجو و ممیزی تحویل می‌دهد.',
    payloadSummaryFa: 'decisionProposal + locale + effectiveAllowedDepts + excludedParentIds',
  },
  {
    id: 'conn-connectors-to-chunker',
    fromModuleId: 'enterprise-connectors',
    toModuleId: 'parent-child-chunker',
    labelFa: 'ارسال سند همگام‌سازی‌شده به پایپ‌لاین خردکردن',
    whatItDoesFa:
      'وقتی اطلاعاتی از Google Drive یا Slack خوانده شد، به‌شکل یک سند یکدست وارد خط تولید RAG می‌شود تا خرد و قابل جستجو شود.',
    internalMechanicsFa:
      'پس از حذف نسخه‌های قدیمی همان کانکتور، تابع `syncConnectorDataIntoBrain` اطلاعات را به `ingestDocumentIntoBrain` و سپس `createParentChildChunks` تحویل می‌دهد.',
    payloadSummaryFa: 'RawGovernanceDocumentInput (sourceType: gdrive | slack | confluence | upload)',
  },
  {
    id: 'conn-extractor-to-chunker',
    fromModuleId: 'multimodal-extractor',
    toModuleId: 'parent-child-chunker',
    labelFa: 'تحویل متن استخراج‌شده فایل به خردکننده',
    whatItDoesFa:
      'متن تمیزی که از فایل PDF، پاورپوینت، عکس یا صدا استخراج شد، پس از انتخاب دپارتمان توسط کاربر برای خردشدن دوطبقه فرستاده می‌شود.',
    internalMechanicsFa:
      'خروجی `/api/brain/extract` از طریق `POST /api/brain/documents` به `ingestDocumentIntoBrain` می‌رسد و به بلوک‌های ۲۰۰۰ کاراکتری والد و ۴۰۰ کاراکتری فرزند شکسته می‌شود.',
    payloadSummaryFa: 'Normalized Title + Extracted Text + Department + Tags',
  },
  {
    id: 'conn-chunker-to-embedding',
    fromModuleId: 'parent-child-chunker',
    toModuleId: 'embedding-engine',
    labelFa: 'ارسال تکه‌های ۴۰۰ کاراکتری برای بردارسازی',
    whatItDoesFa:
      'هر قطعه کوچک فرزند که از خردکردن سند به دست آمده، برای تبدیل شدن به آدرس عددی ۷۶۸ بعدی به موتور بردارسازی سپرده می‌شود.',
    internalMechanicsFa:
      'برای هر تکه فرزند، متن آن به همراه نام دپارتمان و برچسب‌ها به `generateGeminiEmbedding768` داده می‌شود؛ و در نبود اینترنت، بردارساز قطعی آفلاین کار را انجام می‌دهد.',
    payloadSummaryFa: 'ChildVectorChunk[] → EmbeddedChildChunk[] (768-d vectors)',
  },
  {
    id: 'conn-embedding-to-retriever',
    fromModuleId: 'embedding-engine',
    toModuleId: 'vector-retriever',
    labelFa: 'بردار پرسش ۷۶۸ بعدی برای جستجوی معنایی',
    whatItDoesFa:
      'تصمیم پیشنهادی مدیر هم به همان زبان ۷۶۸ عددی ترجمه می‌شود تا موتور جستجو بتواند شبیه‌ترین سیاست‌های شرکت را پیدا کند.',
    internalMechanicsFa:
      'تابع `searchBrainByVectorSimilarity` ابتدا متن تصمیم را بردارسازی می‌کند و بردار حاصل را به `$vectorSearch` دیتابیس یا جستجوی کسینوسی رم می‌سپارد.',
    payloadSummaryFa: 'Query Vector (768-d Float Array) + RBAC Department Filter',
  },
  {
    id: 'conn-retriever-to-auditor',
    fromModuleId: 'vector-retriever',
    toModuleId: 'dual-stage-auditor',
    labelFa: 'تحویل اسناد والد هرس‌شده به موتور ممیزی',
    whatItDoesFa:
      'بهترین و مرتبط‌ترین سیاست‌های داخلی شرکت (در قالب متن کامل والد و بدون اسناد بی‌ربط) به عنوان سند و مدرک روی میز موتور ممیزی گذاشته می‌شوند.',
    internalMechanicsFa:
      'پس از بازیابی اسناد والد، تابع `filterRelevantCitations` مواردی را که نمره‌شان زیر `0.70` یا خیلی پایین‌تر از سند اول باشد حذف می‌کند تا کیفیت تحلیل هوش مصنوعی بالا بماند.',
    payloadSummaryFa: 'MatchedParentContextInput[] (Full Parent Content + Similarity Scores)',
  },
  {
    id: 'conn-auditor-to-regulatory',
    fromModuleId: 'dual-stage-auditor',
    toModuleId: 'german-regulatory-engine',
    labelFa: 'عبور اجباری گزارش از غربالگر قوانین آلمان',
    whatItDoesFa:
      'گزارش آماده شده توسط هوش مصنوعی، پیش از نمایش به کاربر باید از زیر ذره‌بین قوانین آمره آلمان و اروپا رد شود.',
    internalMechanicsFa:
      'تابع `applyGermanAdvisoryToReport` روی خروجی اعمال می‌شود و اگر قانونی (`BetrVG`، `DSGVO`، `EU AI Act` یا `NIS-2`) فعال شده باشد، حکم «تایید کامل» را به «مشروط» تنزل می‌دهد و سقف نمره را روی `74` قفل می‌کند.',
    payloadSummaryFa: 'Baseline/LLM ExecutiveAuditReport → Statutorily Guarded Final Report',
  },

  // Dedicated Hub Connections — ZONE 3 (AI Model Router & Resilience)
  {
    id: 'conn-router-to-extractor',
    fromModuleId: 'ai-model-router',
    toModuleId: 'multimodal-extractor',
    labelFa: 'انتخاب مدل سریع و مقاوم برای OCR و صوت',
    isCrossHub: true,
    whatItDoesFa:
      'وقتی کاربری PDF، عکس یا صدا آپلود می‌کند، مسیریاب AI سریع‌ترین مدل سالم (`Flash`) را انتخاب می‌کند تا متن فایل بدون خطا استخراج شود.',
    internalMechanicsFa:
      'در `POST /api/brain/extract` فراخوانی `geminiModelSelector.executeWithFallback("fast", ...)` با تایم‌اوت ۱۸ ثانیه و فیوز ۱۵ دقیقه‌ای انجام می‌شود تا در صورت شلوغی یک مدل، فوری مدل بعدی جایگزین شود.',
    payloadSummaryFa: 'Profile: fast → Selected Flash Model + Circuit-Breaker Fallback Chain',
  },
  {
    id: 'conn-router-to-embedding',
    fromModuleId: 'ai-model-router',
    toModuleId: 'embedding-engine',
    labelFa: 'تامین کلید API اختصاصی و تاب‌آوری بردارسازی',
    isCrossHub: true,
    whatItDoesFa:
      'لایه هوش مصنوعی کلید API اختصاصی همان شرکت را (اگر تنظیم شده باشد) به سرویس بردارسازی می‌دهد تا داده‌های هر شرکت با کلید خودش پردازش شود.',
    internalMechanicsFa:
      'تابع `resolveGeminiApiKey()` کلید رمزگشایی‌شده سازمان فعال را به `generateGeminiEmbedding768` تحویل می‌دهد؛ اگر کلیدی نباشد یا تماس ناموفق باشد، بردارساز آفلاین خودکار وارد عمل می‌شود.',
    payloadSummaryFa: 'Tenant-Scoped Gemini API Key → text-embedding-004 (768-d) / Offline Fallback',
  },
  {
    id: 'conn-router-to-auditor',
    fromModuleId: 'ai-model-router',
    toModuleId: 'dual-stage-auditor',
    labelFa: 'انتخاب مدل استدلالی و زنجیره پشتیبان ممیزی',
    isCrossHub: true,
    whatItDoesFa:
      'برای تحلیل تصمیمات مهم مدیریتی، قوی‌ترین مدل استدلالی سالم (`Pro`) را انتخاب می‌کند و در صورت بروز خطای سهمیه یا تایم‌اوت، بی‌صدا به مدل پشتیبان سوئیچ می‌کند.',
    internalMechanicsFa:
      'مسیر `/api/brain/audit` انتخاب مدل را به موازات جستجوی برداری انجام می‌دهد و سنتز گزارش را درون `executeWithFallback` (تا ۴ تلاش و تور ایمنی نسل ۲.۵) اجرا می‌نماید.',
    payloadSummaryFa: 'Profile: reasoning | fast → Ranked Pro/Flash Model + 2.x Safety Net',
  },

  // Dedicated Hub Connections — ZONE 5 (Database & Dual-Layer Storage)
  {
    id: 'conn-connectors-to-db',
    fromModuleId: 'enterprise-connectors',
    toModuleId: 'tenant-mongodb-cluster',
    labelFa: 'ذخیره تنظیمات کانکتورها و زمان آخرین همگام‌سازی',
    isCrossHub: true,
    whatItDoesFa:
      'اطلاعات اتصال هر کانکتور، روشن یا خاموش بودنش و زمان آخرین همگام‌سازی در دیتابیس اختصاصی شرکت ذخیره می‌شود تا با ری‌استارت سرور نپرد.',
    internalMechanicsFa:
      'تابع `persistConnectorItemToAtlas` تنظیمات و `serverSecret` را با دستور `upsert` در کالکشن `connectors` همان شرکت ثبت می‌کند.',
    payloadSummaryFa: 'EnterpriseConnectorItem + serverSecret → connectors collection',
  },
  {
    id: 'conn-rag-to-db',
    fromModuleId: 'embedding-engine',
    toModuleId: 'tenant-mongodb-cluster',
    labelFa: 'نوشتن اسناد والد و بردارهای فرزند ۷۶۸ بعدی',
    isCrossHub: true,
    whatItDoesFa:
      'پس از خردکردن و بردارسازی هر سند جدید، متن کامل والد و بردارهای فرزند هم‌زمان در دیتابیس اختصاصی شرکت بایگانی می‌شوند.',
    internalMechanicsFa:
      'تابع `ingestDocumentIntoBrain` اسناد والد را در `raw_documents` و بردارها را در `vector_store` ذخیره کرده و وضعیت اندیس `mindmittel_vector_index` را بررسی می‌کند.',
    payloadSummaryFa: 'RawDocumentRecord[] → raw_documents | VectorStoreRecord[] → vector_store',
  },
  {
    id: 'conn-db-to-retriever',
    fromModuleId: 'tenant-mongodb-cluster',
    toModuleId: 'vector-retriever',
    labelFa: 'اجرای جستجوی برداری و واکشی اسناد والد',
    isCrossHub: true,
    whatItDoesFa:
      'دیتابیس برداری نزدیک‌ترین تکه‌ها را پیدا می‌کند و متن کامل اسناد والد آن‌ها را برای موتور بازیابی می‌فرستد.',
    internalMechanicsFa:
      'پایپ‌لاین `$vectorSearch` روی `vector_store` اجرا شده و در صورت در دسترس نبودن موقت اندیس، لایه حافظه سریع (`in-memory-vault-hydration`) جای آن را پر می‌کند.',
    payloadSummaryFa: 'Atlas $vectorSearch Hits + RawDocumentRecord Parents',
  },
  {
    id: 'conn-db-to-conflict',
    fromModuleId: 'in-memory-vault-hydration',
    toModuleId: 'conflict-detector',
    labelFa: 'تامین اسناد تجمیع‌شده برای کشف تضادها',
    isCrossHub: true,
    whatItDoesFa:
      'قطعات جداشده هر سند دوباره به هم چسبانده می‌شوند تا کاشف تعارض بتواند کل سندها را با هم مقایسه کند.',
    internalMechanicsFa:
      'تابع `listBrainDocuments` پس از هیدراتاسیون، بلوک‌های هم‌عنوان را مرتب و یکپارچه کرده و به `detectBrainDocumentConflicts` تحویل می‌دهد.',
    payloadSummaryFa: 'Grouped Logical Brain Documents → Conflict Analysis',
  },
  {
    id: 'conn-regulatory-to-db',
    fromModuleId: 'german-regulatory-engine',
    toModuleId: 'tenant-mongodb-cluster',
    labelFa: 'ثبت ماندگار گزارش نهایی در تاریخچه ممیزی',
    isCrossHub: true,
    whatItDoesFa:
      'نتیجه نهایی هر ممیزی به‌عنوان یک سند قابل استناد در تاریخچه شرکت ذخیره می‌شود تا مدیران بعدها بتوانند آن را مرور یا چاپ کنند.',
    internalMechanicsFa:
      'تابع `saveAuditReportToHistory` شناسه یکتا (`audit_...`) ساخته و گزارش کامل را در کالکشن `audit_history` همان شرکت ثبت می‌کند.',
    payloadSummaryFa: 'StoredAuditHistoryEntry → audit_history collection',
  },

  // Delivery & Telemetry Connections — ZONE 6
  {
    id: 'conn-regulatory-to-stream',
    fromModuleId: 'german-regulatory-engine',
    toModuleId: 'ndjson-heartbeat-stream',
    labelFa: 'ارسال گزارش نهایی از طریق استریم ضربان قلب',
    whatItDoesFa:
      'به‌محض آماده شدن گزارش نهایی، پالس‌های ۸ ثانیه‌ای متوقف می‌شوند و کل گزارش در یک بسته نهایی به مرورگر کاربر ارسال می‌گردد.',
    internalMechanicsFa:
      'تایمر ضربان قلب قطع شده و فریم `{"type":"result","status":200,"data":...}` به تابع `fetchJsonWithHeartbeat` در داشبورد تحویل داده می‌شود.',
    payloadSummaryFa: 'NDJSON Final Result Frame → Web Dashboard + A4 Print PDF',
  },
  {
    id: 'conn-audit-to-telemetry',
    fromModuleId: 'dual-stage-auditor',
    toModuleId: 'sse-live-telemetry',
    labelFa: 'ارسال رویدادهای ساختاریافته به استریم زنده SSE',
    whatItDoesFa:
      'خلاصه فنی عملیات (مدل استفاده‌شده، حکم، نمره و نیاز به Betriebsrat) بدون افشای رمزها به مانیتور زنده `/system` فرستاده می‌شود.',
    internalMechanicsFa:
      'فراخوانی `systemLogger.info("audit.engine", ...)` رویداد پاکسازی‌شده را در بافر حلقوی ثبت و برای تمام مرورگرهای متصل به `/api/system/logs/stream` پخش می‌کند.',
    payloadSummaryFa: 'Redacted SystemLogEntry → SSE text/event-stream (/system)',
  },
];

export function getBlueprintZoneById(
  zoneId: BlueprintZoneId
): BlueprintZoneSpec | undefined {
  return BLUEPRINT_ZONES.find((z) => z.id === zoneId);
}

export function getBlueprintModuleById(
  moduleId: string
): BlueprintModuleSpec | undefined {
  return BLUEPRINT_MODULES.find((m) => m.id === moduleId);
}

export function getBlueprintConnectionById(
  connectionId: string
): BlueprintConnectionSpec | undefined {
  return BLUEPRINT_CONNECTIONS.find((c) => c.id === connectionId);
}
