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
      'این ماژول اولین نقطه برخورد هر درخواست HTTP با پلتفرم MindMittel است. پیش از آنکه هیچ صفحه یا API اجرا شود، نام میزبان (Host) را بررسی می‌کند تا مشخص شود کاربر وارد سایت معرفی (`mindmittel.de`)، پنل مدیریت مرکزی (`admin.mindmittel.de`) یا فضای کاری اختصاصی یک شرکت (`company.mindmittel.de`) شده است.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. تشخیص زون از نام دامنه و هدر پروکسی',
        detailFa:
          'ابتدا فایل‌های استاتیک (`/_next` و فایل‌های دارای پسوند) را مستقیم عبور می‌دهد. سپس هدر `x-forwarded-host` یا `host` را می‌خواند و از طریق `resolveHostZone` مشخص می‌کند درخواست متعلق به کدام زون (`marketing`، `admin` یا `tenant`) است.',
        codeRef: 'src/middleware.ts → resolveHostZone() in src/core/tenancy/hostResolver.ts',
      },
      {
        stepTitleFa: '۲. اعمال قوانین دسترسی مسیرها در هر زون',
        detailFa:
          'تابع `routeRequestForZone` اجازه نمی‌دهد مسیرهای ادمین روی دامنه مشتری باز شوند یا برعکس؛ در صورت مغایرت، پاسخ `404` برمی‌گرداند. برای درخواست‌های معتبر، هدرهای داخلی `x-mindmittel-zone` و `x-mindmittel-tenant` را روی درخواست تزریق می‌کند.',
        codeRef: 'src/core/tenancy/zoneRouting.ts → routeRequestForZone()',
      },
    ],
    inputsFa: [
      'درخواست خام HTTP از مرورگر یا کلاینت API شامل هدر `Host` و مسیر URL',
    ],
    outputsFa: [
      'درخواست برچسب‌گذاری‌شده با `x-mindmittel-zone` و `x-mindmittel-tenant` به نگهبان نشست و RBAC',
      'یا مسدودسازی فوری با پاسخ `404 Not Found` برای مسیرهای غیرمجاز',
    ],
    sourceFiles: [
      'src/middleware.ts',
      'src/core/tenancy/hostResolver.ts',
      'src/core/tenancy/zoneRouting.ts',
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
      'این لایه امنیتی تمام APIهای فضای کاری را دربر می‌گیرد و تضمین می‌کند هیچ کاربری نتواند به داده‌های شرکت دیگر، یا حتی دپارتمان‌های غیرمجاز درون شرکت خودش دسترسی پیدا کند. همچنین کانتکست سازمان فعال را در طول کل چرخه درخواست به‌صورت خودکار و بدون نیاز به پاس‌دادن دستی پارامترها نگه می‌دارد.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. اعتبارسنجی سازمان و امضای کوکی نشست',
        detailFa:
          'تابع `withTenantApi` سازمان را از دیتابیس مرکزی پیدا می‌کند (`resolveTenantBySlug`). اگر سازمان معلق باشد `403` برمی‌گرداند. در حالت `otp`، کوکی `mm_tenant_session` با الگوریتم HMAC در `verifySessionToken` اعتبارسنجی می‌شود و تطابق دقیق آن با ساب‌دامین فعلی کنترل می‌گردد.',
        codeRef:
          'src/infrastructure/http/tenantRequestGuard.ts → withTenantApi() & readTenantSession()',
      },
      {
        stepTitleFa: '۲. قفل Zero-Trust برای کاربران در انتظار تایید و فیلتر دپارتمان',
        detailFa:
          'پروفایل دسترسی کاربر از `getTenantUserAccessProfile` خوانده می‌شود. اگر وضعیت کاربر `pending` باشد، با خطای `403 PENDING_APPROVAL` متوقف می‌شود. سپس توابع `canEditDocuments`، `canManageConnectors` و `resolveEffectiveDepartmentFilter` مجوز ویرایش و لیست دقیق دپارتمان‌های مجاز را در سمت سرور محاسبه می‌کنند.',
        codeRef:
          'src/core/auth/rbac.ts → resolveEffectiveDepartmentFilter(), canEditDocuments(), canManageConnectors()',
      },
      {
        stepTitleFa: '۳. حبس اجرایی درخواست در AsyncLocalStorage',
        detailFa:
          'کل بدنه هندلر API درون `runWithTenantContext({ tenant, session }, ...)` اجرا می‌شود تا هر ماژول پایین‌دستی (دیتابیس، حافظه، کلید Gemini و لاگر) به‌صورت خودکار فقط به منابع همان سازمان وصل شود.',
        codeRef: 'src/infrastructure/tenancy/tenantContext.ts → runWithTenantContext()',
      },
    ],
    inputsFa: [
      'درخواست مسیریابی‌شده با هدر `x-mindmittel-tenant` و کوکی `mm_tenant_session`',
    ],
    outputsFa: [
      'کانتکست امن و تاییدشده (`tenant`, `session`, `userAccess`) به لایه‌های دریافت داده، RAG و ممیزی',
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
      'این ماژول ارتباط بین ابزارهای روزمره سازمان و مغز شرکت (Company Brain) را مدیریت می‌کند. ادمین شرکت می‌تواند هر یک از ۷ کانکتور سازمانی را احراز هویت، روشن/خاموش و همگام‌سازی کند تا دانش پراکنده بدون کپی‌کاری دستی وارد سیستم شود.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. چرخه پیکربندی، کلید امن و سوئیچ روشن/خاموش',
        detailFa:
          'مسیر `POST /api/connectors` سه عملیات `configure`، `toggle` و `sync` را صرفاً برای ادمین شرکت (`canManageConnectors`) انجام می‌دهد. توکن‌ها پیش از نمایش به کاربر توسط `maskSecretToken` پوشانده می‌شوند و نسخه اصلی فقط در فیلد `serverSecret` سمت سرور ذخیره می‌شود.',
        codeRef:
          'src/app/api/connectors/route.ts & src/core/connectors/connectorRegistry.ts → createInitialConnectorsState()',
      },
      {
        stepTitleFa: '۲. اتصال زنده به APIها و همگام‌سازی هوشمند Google Drive',
        detailFa:
          'تابع `fetchLiveConnectorPayloadOrFallback` برای Slack (`conversations.list`) و Notion (`v1/search`) با تایم‌اوت ۳.۵ ثانیه تماس زنده می‌گیرد و برای `google-drive` کنترل را به `fetchLiveGoogleDrivePayload` می‌سپارد. در Google Drive، کلیدهای Service Account با JWT امضاشده `RS256` تبدیل به توکن ۱ ساعته می‌شوند (`mintGoogleServiceAccountToken`) و از طریق **Smart Delta Sync** (مقایسه `modifiedTime` با `lastSyncedAt`) در صورت عدم تغییر فایل‌ها، دانلود مجدد با مصرف صفر توکن رد می‌شود.',
        codeRef:
          'src/core/connectors/googleDriveImporter.ts → fetchLiveGoogleDrivePayload() & mintGoogleServiceAccountToken()',
      },
      {
        stepTitleFa: '۳. پاکسازی نسخه‌های قدیمی پیش از ثبت جدید',
        detailFa:
          'در `syncConnectorDataIntoBrain` پیش از ثبت سند جدید، اسناد قدیمی همان کانکتور و محدوده از `raw_documents` و `vector_store` حذف می‌شوند تا کارت تکراری ایجاد نشود. کانکتورهای `ms-teams`، `confluence`، `zoom-meetings` و `google-meet` در حالت فعلی از طریق قالب‌های ساختاریافته `buildConnectorSyncDocument` همگام‌سازی می‌شوند.',
        codeRef: 'src/infrastructure/rag/brainRepository.ts → syncConnectorDataIntoBrain()',
      },
    ],
    inputsFa: [
      'درخواست پیکربندی یا همگام‌سازی ادمین + توکن OAuth یا Service Account JSON',
      'محتوای دریافتی از APIهای خارجی (Google Drive، Slack، Notion و قالب‌های کانکتور)',
    ],
    outputsFa: [
      'سند نرمال‌سازی‌شده (`title`, `content`, `department`, `sourceType`, `tags`) به پایپ‌لاین RAG',
      'ذخیره وضعیت و زمان آخرین همگام‌سازی در کالکشن `connectors`',
    ],
    sourceFiles: [
      'src/app/api/connectors/route.ts',
      'src/core/connectors/connectorRegistry.ts',
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
      'مدیران می‌توانند به‌جای تایپ دستی، اسناد PDF، اسلایدهای پاورپوینت، عکس اسناد، فایل متنی یا حتی صدای ضبط‌شده جلسات را آپلود کنند. این ماژول نوع فایل را تشخیص می‌دهد، حجم آن را کنترل می‌کند و با بهترین روش (پارسر داخلی یا هوش مصنوعی چندرسانه‌ای) متن آن را بیرون می‌کشد.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. کنترل حجم ۱۵ مگابایت و دسته‌بندی خودکار نوع ورودی',
        detailFa:
          'مسیر `POST /api/brain/extract` فایل را از `FormData` می‌خواند، توسط `validateMultimodalFileSize` سقف `15 MB` را اعمال می‌کند (خطای `413` در صورت تجاوز) و با `classifyMultimodalInput` فایل را به یکی از ۵ دسته `text`، `presentation`، `pdf`، `image` یا `audio` طبقه‌بندی می‌کند.',
        codeRef:
          'src/app/api/brain/extract/route.ts & src/core/rag/multimodalExtractor.ts → classifyMultimodalInput()',
      },
      {
        stepTitleFa: '۲. پارسرهای سریع و بومی سمت سرور (متن، PPTX و PDF)',
        detailFa:
          'فایل‌های متنی (و همچنین `.docx` که در حال حاضر به مسیر متن ساده هدایت می‌شود) با `extractTextFromPlainBuffer` خوانده می‌شوند. فایل‌های `.pptx` بدون ارسال به LLM توسط `extractTextFromPptxBuffer` از ساختار ZIP باز (`zlib.inflateRawSync`) و تگ‌های `<a:t>` استخراج می‌شوند. برای PDF نیز پارسر بومی `extractTextFromPdfBuffer` جریان‌های `FlateDecode` و بلوک‌های `BT...ET` را رمزگشایی می‌کند.',
        codeRef:
          'src/core/rag/multimodalExtractor.ts → extractTextFromPptxBuffer(), extractTextFromPdfBuffer(), extractTextFromPlainBuffer()',
      },
      {
        stepTitleFa: '۳. استخراج هوشمند PDF، تصویر و صوت از طریق مسیریاب AI',
        detailFa:
          'برای PDF، تصویر و فایل صوتی، بافر به Base64 تبدیل شده و از طریق `geminiModelSelector.executeWithFallback("fast", ...)` با تایم‌اوت ۱۸ ثانیه به Gemini ارسال می‌شود. در صورت قطع دسترسی شبکه، سیستم به‌جای خطا دادن به پارسر جایگزین عقب‌نشینی می‌کند.',
        codeRef: 'src/app/api/brain/extract/route.ts → executeWithFallback("fast")',
      },
    ],
    inputsFa: [
      'فایل آپلودشده (`multipart/form-data`) شامل PDF، PPTX، DOCX، تصویر، صوت یا متن ساده',
    ],
    outputsFa: [
      'متن استخراج‌شده و عنوان پیشنهادی به فرم بررسی کاربر و سپس `POST /api/brain/documents`',
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
      'در سیستم‌های RAG معمولی، اگر تکه‌های متن خیلی کوچک باشند مدل هوش مصنوعی بافت حقوقی جمله را گم می‌کند و اگر خیلی بزرگ باشند دقت جستجوی برداری افت می‌کند. این ماژول با معماری دوطبقه Parent-Child هر دو مزیت را هم‌زمان فراهم می‌کند.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. نرمال‌سازی متادیتا برای فیلتر دقیق دپارتمان',
        detailFa:
          'تابع `createParentChildChunks` ابتدا نام دپارتمان و برچسب‌ها را توسط `normalizeToken` و `normalizeMetadataTags` به فرمت یکدست `kebab-case` تبدیل می‌کند و روی هر قطعه فرزند کپی (Denormalize) می‌کند.',
        codeRef: 'src/core/rag/chunker.ts → normalizeToken() & normalizeMetadataTags()',
      },
      {
        stepTitleFa: '۲. برش دوطبقه با هم‌پوشانی و تولید شناسه قطعی SHA-256',
        detailFa:
          'متن اصلی با `sliceTextWithOverlap` به بلوک‌های **والد `2000` کاراکتری** (با `100` کاراکتر هم‌پوشانی) تقسیم شده و با هش `SHA-256` شناسه یکتا (`parent_<24hex>`) می‌گیرد. سپس هر والد به تکه‌های **فرزند `400` کاراکتری** (با `50` کاراکتر هم‌پوشانی و گام `350`) شکسته می‌شود تا هیچ جمله‌ای در مرز برش قطع نشود.',
        codeRef: 'src/core/rag/chunker.ts → createParentChildChunks() & sliceTextWithOverlap()',
      },
    ],
    inputsFa: [
      'سند نرمال‌سازی‌شده (`RawGovernanceDocumentInput`) از آپلود دستی یا کانکتورها',
    ],
    outputsFa: [
      'آرایه `ParentDocumentChunk[]` (برای ذخیره در `raw_documents`)',
      'آرایه `ChildVectorChunk[]` (برای ارسال به سرویس امبدینگ)',
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
      'برای اینکه سیستم بتواند معنای یک تصمیم مدیریتی را با سیاست‌های شرکت مقایسه کند (حتی اگر کلمات دقیقاً یکسان نباشند)، هر تکه فرزند و هر پرسش ورودی به یک بردار ریاضی قفل‌شده در `768` بعد تبدیل می‌شود.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. تولید بردار زنده با مدل text-embedding-004',
        detailFa:
          'تابع `generateGeminiEmbedding768` رشته ترکیبی دپارتمان، تگ‌ها و متن فرزند را با `outputDimensionality: 768` و تایم‌اوت ۸ ثانیه به API جمنای ارسال می‌کند و دقیقاً ۷۶۸ عدد بودن خروجی را کنترل می‌کند.',
        codeRef: 'src/infrastructure/gemini/embeddingService.ts → generateGeminiEmbedding768()',
      },
      {
        stepTitleFa: '۲. موتور بردارسازی قطعی و آفلاین (تضمین عدم توقف)',
        detailFa:
          'اگر کلید API تنظیم نشده باشد یا شبکه دچار اختلال شود، تابع `generateDeterministicSemanticEmbedding` به‌صورت خودکار بردار ۷۶۸ بعدی نرمال‌سازی‌شده L2 می‌سازد: ابعاد `0..63` برای ۶ خوشه مفهومی دوزبانه (مالی، هیئت‌مدیره، اسکرام، نقض قانون، امنیت/DSGVO، منابع انسانی)، ابعاد `64..511` با هش FNV-1a کلمات، و ابعاد `512..767` با تری‌گرام کاراکتری برای تطبیق ریشه کلمات.',
        codeRef: 'src/core/rag/vectorMath.ts → generateDeterministicSemanticEmbedding()',
      },
    ],
    inputsFa: [
      'تکه‌های `ChildVectorChunk` هنگام ثبت سند، یا متن `decisionProposal` هنگام ممیزی',
    ],
    outputsFa: [
      'بردار عددی ۷۶۸ بعدی (`number[]`) برای ذخیره در `vector_store` یا اجرای جستجوی برداری',
    ],
    sourceFiles: [
      'src/infrastructure/gemini/embeddingService.ts',
      'src/core/rag/vectorMath.ts',
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
      'هنگام ارزیابی یک تصمیم، این ماژول مغز شرکت را بر اساس معنا جستجو می‌کند، دسترسی دپارتمانی کاربر را در سطح دیتابیس قفل می‌کند، اسناد مستثنی‌شده توسط کاربر را کنار می‌گذارد و فقط اسناد والد با بالاترین ارتباط را به موتور ممیزی تحویل می‌دهد.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. جستجوی برداری بومی با فیلتر اجباری RBAC',
        detailFa:
          'تابع `searchBrainByVectorSimilarity` ابتدا اگر کاربر هیچ دپارتمان مجازی نداشته باشد سریعاً آرایه خالی برمی‌گرداند. سپس پایپ‌لاین `$vectorSearch` را روی اندیس `mindmittel_vector_index` با `numCandidates = 50 + excluded * 5` و فیلتر `metadata.department: { $in: allowedDeptCandidates }` اجرا می‌کند.',
        codeRef:
          'src/infrastructure/rag/brainRepository.ts → searchBrainByVectorSimilarity()',
      },
      {
        stepTitleFa: '۲. بازسازی سند کامل والد و پشتیبان شباهت کسینوسی',
        detailFa:
          'شناسه‌های والد (`parentId`) یافت‌شده از `raw_documents` واکشی و بر اساس عنوان یکتاسازی می‌شوند. اگر اندیس Atlas هنوز در حال ساخت باشد یا دیتابیس آفلاین باشد، `hydrateVaultFromMongo` و `rankParentDocumentsByVectorMatch` با شباهت کسینوسی دقیق جایگزین می‌شوند.',
        codeRef: 'src/core/rag/vectorMath.ts → rankParentDocumentsByVectorMatch() & computeCosineSimilarity()',
      },
      {
        stepTitleFa: '۳. هرس هوشمند استنادات کم‌ارتباط (Citation Pruning)',
        detailFa:
          'تابع `filterRelevantCitations` همیشه بهترین سند (`topMatch`) را حفظ می‌کند اما اسناد بعدی را در صورتی که افت امتیازشان نسبت به اولی بیشتر از `0.15` باشد (`maxDrop = 0.15`) یا امتیاز مطلقشان کمتر از `0.70` باشد (`minAbsoluteScore = 0.70`) حذف می‌کند تا نویز وارد پرامپت LLM نشود.',
        codeRef: 'src/core/audit/decisionEvaluator.ts → filterRelevantCitations()',
      },
    ],
    inputsFa: [
      'بردار پرسش ۷۶۸ بعدی، لیست دپارتمان‌های مجاز کاربر (`allowedDepartments`) و `excludedParentIds`',
    ],
    outputsFa: [
      'لیست هرس‌شده و باکیفیت `MatchedParentContextInput[]` به موتور ممیزی تصمیمات',
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
      'حتی قبل از آنکه مدیری تصمیمی بگیرد، ممکن است دو سند داخلی شرکت (مثلاً آیین‌نامه مالی قدیمی و مصوبه جدید Slack) با یکدیگر در تضاد باشند. این ماژول به‌طور خودکار این تعارض‌ها را شناسایی و در صفحه مغز شرکت برجسته می‌کند.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. تشخیص هم‌پوشانی موضوعی اسناد متمایز',
        detailFa:
          'تابع `detectBrainDocumentConflicts` تمام جفت‌اسناد با عنوان متفاوت را با شباهت کسینوسی مقایسه می‌کند. دو سند زمانی «هم‌موضوع» شناخته می‌شوند که شباهت آن‌ها در دپارتمان‌های مختلف حداقل `0.34` و در دپارتمان یکسان حداقل `0.24` باشد.',
        codeRef: 'src/core/rag/conflictDetector.ts → detectBrainDocumentConflicts()',
      },
      {
        stepTitleFa: '۲. کشف تضاد قطبی (الزامی در برابر لغو) و تضاد آستانه‌های عددی',
        detailFa:
          'دو نوع تعارض کشف می‌شود: `POLICY_POLARITY_CONFLICT` (یکی قانون الزامی/ممنوعیت دارد و دیگری آن را اختیاری یا لغو می‌کند) و `NUMERIC_THRESHOLD_CONFLICT` که توسط `extractKeyNumbers` مبالغ ارزی (یورو/دلار)، درصدها و بازه‌های زمانی را استخراج کرده (با حذف دقیق تاریخ‌های تقویمی) و اختلاف آن‌ها را گزارش می‌دهد.',
        codeRef: 'src/core/rag/conflictDetector.ts → extractKeyNumbers()',
      },
    ],
    inputsFa: [
      'لیست کامل اسناد والد مجاز کاربر از `listBrainDocuments()`',
    ],
    outputsFa: [
      'آرایه هشدارهای دوزبانه `BrainKnowledgeConflictWarning[]` به رابط کاربری Company Brain',
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
      'به‌جای هاردکد کردن نام یک مدل هوش مصنوعی که ممکن است منقضی، شلوغ یا دارای خطای سهمیه شود، این هاب مرکزی کاتالوگ زنده مدل‌های Gemini را تحلیل می‌کند، برای هر درخواست بهترین مدل را امتیازدهی می‌کند و در صورت بروز هرگونه خطای شبکه یا HTTP، به‌صورت خودکار و بی‌صدا به مدل بعدی در زنجیره پشتیبان سوئیچ می‌کند.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. تشخیص خودکار پروفایل fast در برابر reasoning و فیلتر مدل‌ها',
        detailFa:
          'تابع `inferProfileFromQuery` اگر طول پرسش بیش از `110` کاراکتر باشد یا شامل کلیدواژه‌های ممیزی/ریسک باشد پروفایل `reasoning` (اولویت Pro) و در غیر این صورت `fast` (اولویت Flash) را انتخاب می‌کند. سپس `isTextGenerationCandidate` مدل‌های نامناسب مانند `embedding`، `tts`، `imagen`، `image`، `nano banana`، `customtools`، `audio` و `gemma` را از هر دو فیلد `modelId` و `displayName` حذف می‌کند.',
        codeRef:
          'src/core/ai/modelRanking.ts → inferProfileFromQuery(), isTextGenerationCandidate(), scoreModelForProfile()',
      },
      {
        stepTitleFa: '۲. امتیازدهی پویا و کش ۶ ساعته کاتالوگ (با پشتیبان Stale-If-Error)',
        detailFa:
          'فرمول `familyWeight + version * 50 + stabilityWeight + canonicalBonus` مدل‌ها را رتبه‌بندی می‌کند (`pro/flash = 300`، `stable = 40`). کاتالوگ مدل‌ها برای `6 ساعت` کش می‌شود و اگر تماس زنده قطع شود، از آخرین کش معتبر (`staleCacheFallback`) استفاده می‌گردد.',
        codeRef: 'src/infrastructure/gemini/modelSelector.ts → getModelCatalog() & selectModel()',
      },
      {
        stepTitleFa: '۳. فیوز ۱۵ دقیقه‌ای (Circuit Breaker) و زنجیره Fallback تا ۴ تلاش',
        detailFa:
          'تابع `executeWithFallback` حداکثر `4` مدل کاندیدا را امتحان می‌کند (و همیشه یک مدل پایدار نسل `2.x` را به‌عنوان تور ایمنی نهایی در انتهای زنجیره قرار می‌دهد). در صورت خطای قابل بازیابی (`404`، `429`، `5xx`، `TimeoutError` یا `fetch failed`)، مدل خطادار در `unhealthyUntilByModel` برای `15 دقیقه` قرنطینه می‌شود تا درخواست‌های بعدی معطل نشوند.',
        codeRef:
          'src/infrastructure/gemini/modelSelector.ts → executeWithFallback() & markModelUnhealthy()',
      },
    ],
    inputsFa: [
      'درخواست انتخاب مدل و اجرای عملیات از ماژول‌های استخراج فایل (Zone 1)، بردارسازی (Zone 2) و ممیزی تصمیم (Zone 4)',
    ],
    outputsFa: [
      'خروجی تضمین‌شده عملیات به همراه شناسه مدل استفاده‌شده (`usedModelId`) و تعداد تلاش‌ها (`attempts`)',
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
      'این ماژول قلب تحلیل مدیریتی MindMittel است. تصمیم پیشنهادی مدیر را همراه با اسناد والد بازیابی‌شده دریافت می‌کند و یک گزارش اجرایی کامل شامل حکم نهایی (`CERTIFIED` / `CONDITIONAL` / `POLICY_CONFLICT`)، نمره انطباق، نقاط قوت و ضعف و نقشه راه ۳ مرحله‌ای تولید می‌کند.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. مرحله اول: تولید گزارش پایه قطعی (Deterministic Baseline)',
        detailFa:
          'پیش از هر تماس با LLM، تابع `evaluateDecisionAgainstPoliciesHeuristic` وجود الگوهای نقض/دورزدن (`CONFLICT_TRIGGER_PATTERN`) را در کنار قوانین الزامی اسناد (`MANDATORY_POLICY_PATTERN`) می‌سنجد و یک گزارش معتبر پایه تولید می‌کند (نمره `34` برای تعارض، `62-68` برای مشروط، `92` برای تایید). به این ترتیب سیستم حتی در قطعی کامل اینترنت پاسخ معتبر دارد.',
        codeRef:
          'src/core/audit/decisionEvaluator.ts → evaluateDecisionAgainstPoliciesHeuristic()',
      },
      {
        stepTitleFa: '۲. مرحله دوم: سنتز عمیق JSON توسط مدل انتخاب‌شده',
        detailFa:
          'اگر کلید API فعال باشد، `callGeminiAuditSynthesis` اسناد والد را در قالب ساختاریافته همراه با دمای پایین (`temperature: 0.2`) و اجبار خروجی `application/json` (تایم‌اوت ۱۸ ثانیه) از طریق `geminiModelSelector.executeWithFallback` به مدل می‌فرستد و فیلدهای تحلیل راهبردی گزارش را غنی‌سازی می‌کند.',
        codeRef: 'src/app/api/brain/audit/route.ts → callGeminiAuditSynthesis()',
      },
    ],
    inputsFa: [
      'متن تصمیم پیشنهادی (`decisionProposal`)، زبان خروجی (`en` / `de`) و اسناد والد هرس‌شده از Zone 2',
    ],
    outputsFa: [
      'گزارش ارزیابی پایه یا غنی‌شده با LLM (`ExecutiveAuditReport`) به موتور غربالگری قوانین آلمان',
    ],
    sourceFiles: [
      'src/app/api/brain/audit/route.ts',
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
      'برای شرکت‌های آلمانی (Mittelstand)، حتی اگر سیاست داخلی شرکت با یک تصمیم مشکلی نداشته باشد، ممکن است آن تصمیم قوانین آمره کار یا حفاظت از داده را نقض کند. این ماژول عمداً **بعد از پاسخ هوش مصنوعی** اجرا می‌شود تا LLM هرگز نتواند هشدارهای قانونی را سانسور یا نادیده بگیرد.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. غربالگری هم‌زمان ۴ چارچوب قانونی آلمان و اروپا',
        detailFa:
          'تابع `evaluateGermanRegulatoryAdvisory` چهار ارزیاب مستقل را اجرا می‌کند: **BetrVG §87/90/111** (پایش کارکنان، ساعت کار، دورکاری، تعدیل نیرو و نیاز به Betriebsrat)، **DSGVO / BDSG §26** (داده شخصی، انتقال خارج از اتحادیه، DSFA/DPIA)، **EU AI Act** (هوش مصنوعی پرخطر در استخدام/ارزیابی Annex III و شفافیت Art. 50) و **NIS-2** (تضعیف MFA/فایروال/رمزنگاری و زنجیره تامین).',
        codeRef:
          'src/core/audit/germanRegulatoryAdvisor.ts → evaluateGermanRegulatoryAdvisory()',
      },
      {
        stepTitleFa: '۲. تشخیص شکاف دانشی در مغز شرکت (Knowledge Gap Detection)',
        detailFa:
          'تابع `computeTopicOverlap` هم‌پوشانی ریشه‌های ۵ کاراکتری کلمات تصمیم را با اسناد شرکت می‌سنجد (`>=3` کلمه: پوشش کامل، `1-2`: پوشش جزئی، `0`: `KNOWLEDGE_GAP_DETECTED`) و در صورت نبود سیاست داخلی، عنوان و دپارتمان پیشنهادی برای ثبت سیاست جدید ارائه می‌دهد.',
        codeRef: 'src/core/audit/germanRegulatoryAdvisor.ts → computeTopicOverlap()',
      },
      {
        stepTitleFa: '۳. گارد یک‌طرفه تنزل حکم (Verdict Downgrade Guard)',
        detailFa:
          'تابع `applyGermanAdvisoryToReport` هرگز حکم را ارتقا نمی‌دهد؛ اما اگر حتی یک چارچوب قانونی در وضعیت `TRIGGERED` باشد، حکم `CERTIFIED` را به‌اجبار به `CONDITIONAL` تنزل می‌دهد، سقف نمره انطباق را روی `74` قفل می‌کند و اقدامات الزامی قانونی (مثلاً هماهنگی با Betriebsrat یا DPO) را به `cons` و `roadmap` اضافه می‌نماید.',
        codeRef: 'src/core/audit/germanRegulatoryAdvisor.ts → applyGermanAdvisoryToReport()',
      },
    ],
    inputsFa: [
      'گزارش تولیدشده توسط ارزیاب دومرحله‌ای + متن تصمیم + اسناد والد مرتبط',
    ],
    outputsFa: [
      'گزارش نهایی ممهور به `germanAdvisory` و `excludedDocuments` جهت ثبت در `audit_history` و ارسال به کاربر',
    ],
    sourceFiles: [
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
      'این هاب ذخیره‌سازی پایدار کل پلتفرم است. به‌جای ریختن داده‌های همه شرکت‌ها در یک جدول مشترک، برای هر سازمان یک پایگاه داده مستقل (`mindmittel_<slug>` یا اتصال اختصاصی کاملاً مجزا) ایجاد و مدیریت می‌کند.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. استخر اتصال هوشمند (Primary + LRU Isolated Pool)',
        detailFa:
          'تابع `getMindMittelDb` سازمان فعال را از `AsyncLocalStorage` می‌خواند و از طریق `resolveDatabaseTarget` تصمیم می‌گیرد روی کلاستر اصلی (`maxPoolSize: 10`) به دیتابیس اختصاصی آن سازمان وصل شود یا از استخر `getIsolatedClient` (با سقف `5` کلاینت LRU) به MongoDB اختصاصی مشتری متصل گردد.',
        codeRef:
          'src/infrastructure/db/mongo.ts → getMindMittelDb(), getMongoClient(), getIsolatedClient()',
      },
      {
        stepTitleFa: '۲. کالکشن‌های ایزوله و اندیس برداری کسینوسی ۷۶۸ بعدی',
        detailFa:
          'کالکشن‌های هر سازمان شامل `raw_documents` (اسناد والد)، `vector_store` (تکه‌های فرزند با بردار ۷۶۸ بعدی)، `audit_history` (تاریخچه ممیزی‌ها)، `connectors` (تنظیمات کانکتورها)، `users` (نقش‌ها و دپارتمان‌ها) و `tenant_departments` هستند. اندیس `mindmittel_vector_index` به‌طور خودکار توسط `ensureAtlasVectorIndexProvisioned` بررسی و ساخته می‌شود.',
        codeRef:
          'src/infrastructure/db/schemas.ts → COLLECTIONS & VECTOR_INDEX_DEFINITION',
      },
    ],
    inputsFa: [
      'عملیات نوشتن/به‌روزرسانی/حذف آبشاری از Zone 1 (کانکتورها و اسناد)، Zone 2 (RAG) و Zone 4 (تاریخچه ممیزی)',
    ],
    outputsFa: [
      'نتایج جستجوی `$vectorSearch`، اسناد والد، تاریخچه ممیزی و تنظیمات دسترسی کاربران',
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
      'در سرورهای ابری ممکن است پس از ری‌استارت کانتینر (Dyno Restart) یا هنگام ساخت اندیس برداری در Atlas، دسترسی به جستجوی برداری چند ثانیه تاخیر داشته باشد. این لایه با همگام‌سازی خودکار بین MongoDB و رم، تداوم سرویس را تضمین می‌کند.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. تفکیک کامل حافظه رم به ازای هر سازمان',
        detailFa:
          'تابع `getMemoryVault` برای هر سازمان یک `InMemoryBrainVault` مجزا در `globalThis.__mindmittelBrainVaultMap` نگه می‌دارد تا داده‌های دو شرکت هرگز حتی در حافظه موقت با هم تداخل نکنند.',
        codeRef: 'src/infrastructure/rag/brainRepository.ts → getMemoryVault()',
      },
      {
        stepTitleFa: '۲. هیدراتاسیون خودکار از دیتابیس و حذف آبشاری اتمیک',
        detailFa:
          'تابع `hydrateVaultFromMongo` تا `100` سند والد و `500` بردار فرزند را از MongoDB به رم بارگذاری می‌کند. همچنین در ویرایش (`updateBrainDocument`) و حذف (`removeBrainDocument`)، تمام تکه‌های والد و فرزند هم‌زمان در رم و MongoDB به‌صورت اتمیک به‌روزرسانی یا پاک می‌شوند.',
        codeRef:
          'src/infrastructure/rag/brainRepository.ts → hydrateVaultFromMongo(), updateBrainDocument(), removeBrainDocument()',
      },
    ],
    inputsFa: [
      'داده‌های واکشی‌شده از MongoDB و عملیات نوشتن لحظه‌ای از `brainRepository.ts`',
    ],
    outputsFa: [
      'پشتیبان سریع جستجوی کسینوسی، لیست اسناد و وضعیت تشخیصی اندیس (`VectorSearchDiagnosticStatus`)',
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
      'تحلیل یک تصمیم پیچیده با LLM یا استخراج یک فایل PDF حجیم ممکن است بیش از ۳۰ ثانیه طول بکشد که در زیرساخت‌هایی مثل Heroku باعث خطای `H12 Request Timeout` می‌شود. این ماژول اتصال HTTP را با پالس‌های کوچک زنده نگه می‌دارد و در نهایت گزارش کامل را تحویل رابط کاربری می‌دهد.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. ارسال فوری اولین بایت و پالس هر ۸ ثانیه',
        detailFa:
          'تابع `runWithHeartbeatStream` با دیدن هدر `x-mindmittel-stream: 1` یک `ReadableStream` با نوع `application/x-ndjson` باز می‌کند، در کمتر از ۵ میلی‌ثانیه اولین فریم `{"type":"heartbeat"}` را می‌فرستد و هر `8000ms` آن را تکرار می‌کند تا پنجره تایم‌اوت پروکسی پیوسته تمدید شود. پس از پایان کار، فریم `{"type":"result","status":200,"data":...}` ارسال و استریم بسته می‌شود.',
        codeRef: 'src/infrastructure/http/streamingResponse.ts → runWithHeartbeatStream()',
      },
      {
        stepTitleFa: '۲. مصرف‌کننده کلاینت و خروجی چاپی گزارش A4 PDF',
        detailFa:
          'در فرانت‌اند، تابع `fetchJsonWithHeartbeat` جریان NDJSON را خط‌به‌خط می‌خواند، فریم‌های ضربان قلب را بی‌صدا نادیده می‌گیرد و خروجی نهایی را در داشبورد نمایش می‌دهد. همچنین مدیران می‌توانند گزارش نهایی را با لوگوی شرکت خود از طریق `window.print()` به‌صورت سند رسمی A4 PDF ذخیره کنند.',
        codeRef: 'src/app/page.tsx → fetchJsonWithHeartbeat() & handleRunExecutiveAudit()',
      },
    ],
    inputsFa: [
      'خروجی نهایی ممیزی از Zone 4 (`/api/brain/audit`) و استخراج فایل از Zone 1 (`/api/brain/extract`)',
    ],
    outputsFa: [
      'رندر زنده گزارش ممیزی در داشبورد وب، تاریخچه قابل مرور و خروجی چاپی A4 PDF',
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
      'این ماژول چشمان مهندسان سیستم در زمان اجرا است. هر اتفاق مهم در پلتفرم (از انتخاب مدل AI تا استخراج فایل، جستجوی برداری و ممیزی تصمیم) را به‌صورت ساختاری ثبت کرده و بدون نیاز به رفرش صفحه روی داشبورد `/system` پخش می‌کند.',
    internalMechanicsFa: [
      {
        stepTitleFa: '۱. بافر حلقوی ۲۵۰ تایی و پاکسازی بازگشتی اسرار',
        detailFa:
          'تابع `createRingBufferLogger` حداکثر `250` رویداد اخیر را در رم نگه می‌دارد تا مصرف حافظه هرگز نشت نکند. پیش از ثبت هر رویداد، `redactSensitiveMetadata` به‌صورت بازگشتی تمام کلیدهای حساس (`apiKey`، `password`، `secret`، `token`، `authorization`، `mongodb_uri`) را با `[REDACTED]` جایگزین می‌کند.',
        codeRef:
          'src/infrastructure/logging/logger.ts → createRingBufferLogger() & redactSensitiveMetadata()',
      },
      {
        stepTitleFa: '۲. پخش زنده SSE با فیلتر اختصاصی هر سازمان',
        detailFa:
          'مسیر `GET /api/system/logs/stream` یک کانال `text/event-stream` باز می‌کند، ۵۰ لاگ اخیر همان سازمان را بازپخش کرده و از طریق `systemLogger.subscribe` رویدادهای جدید را لحظه‌ای به `EventSource` در پنل `SystemObservabilityPanel` ارسال می‌کند.',
        codeRef:
          'src/app/api/system/logs/stream/route.ts & src/components/system/SystemObservabilityPanel.tsx',
      },
    ],
    inputsFa: [
      'رویدادهای `systemLogger.info/warn/error` از تمام ماژول‌های هسته و زیرساخت',
    ],
    outputsFa: [
      'استریم زنده رویدادهای پاکسازی‌شده در داشبورد مانیتورینگ `/system`',
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
      'پس از تایید دامنه و زون در Middleware، درخواست با هدر `x-mindmittel-tenant` به لایه احراز هویت و کنترل دسترسی تحویل داده می‌شود.',
    internalMechanicsFa:
      'تابع `middleware` هدرهای داخلی `x-mindmittel-zone` و `x-mindmittel-tenant` را روی درخواست ست می‌کند و `withTenantApi` از همین هدرها برای بارگذاری تنظیمات سازمان و بررسی کوکی `mm_tenant_session` استفاده می‌کند.',
    payloadSummaryFa: 'HTTP Request + x-mindmittel-tenant + mm_tenant_session Cookie',
  },
  {
    id: 'conn-guard-to-connectors',
    fromModuleId: 'tenant-rbac-guard',
    toModuleId: 'enterprise-connectors',
    labelFa: 'دسترسی ادمین شرکت به کانکتورها',
    whatItDoesFa:
      'فقط کاربرانی که نقش `admin` فعال دارند اجازه پیکربندی، روشن/خاموش کردن و همگام‌سازی کانکتورهای سازمانی را پیدا می‌کنند.',
    internalMechanicsFa:
      'تابع `canManageConnectors(userAccess)` پیش از هر عملیات در `/api/connectors` بررسی می‌شود؛ در غیر این صورت پاسخ `403 FORBIDDEN_ADMIN_ONLY` برگردانده می‌شود.',
    payloadSummaryFa: 'Authorized Admin Context + Connector Action (configure | toggle | sync)',
  },
  {
    id: 'conn-guard-to-extractor',
    fromModuleId: 'tenant-rbac-guard',
    toModuleId: 'multimodal-extractor',
    labelFa: 'مجوز آپلود فایل و استخراج متن',
    whatItDoesFa:
      'دسترسی آپلود فایل و ثبت سند فقط به نقش‌های `admin` و `editor` در دپارتمان‌های مجاز داده می‌شود.',
    internalMechanicsFa:
      'بررسی `canEditDocuments(userAccess)` در `/api/brain/extract` و کنترل دپارتمان مقصد در `POST /api/brain/documents` جلوی دستکاری غیرمجاز دانش سازمانی را می‌گیرد.',
    payloadSummaryFa: 'Authorized Editor/Admin Context + Multipart File Buffer (<= 15 MB)',
  },
  {
    id: 'conn-guard-to-auditor',
    fromModuleId: 'tenant-rbac-guard',
    toModuleId: 'dual-stage-auditor',
    labelFa: 'ارسال تصمیم مدیریتی با محدوده دپارتمان مجاز',
    whatItDoesFa:
      'هر کاربر تاییدشده (از جمله نقش `evaluator`) می‌تواند تصمیم مدیریتی را ممیزی کند، اما دامنه جستجوی او به دپارتمان‌های مجازش محدود می‌شود.',
    internalMechanicsFa:
      'تابع `resolveEffectiveDepartmentFilter(userAccess, departmentFilter)` در سمت سرور لیست دقیق دپارتمان‌های مجاز کاربر را محاسبه کرده و به پایپ‌لاین ممیزی تحویل می‌دهد.',
    payloadSummaryFa: 'decisionProposal + locale + effectiveAllowedDepts + excludedParentIds',
  },
  {
    id: 'conn-connectors-to-chunker',
    fromModuleId: 'enterprise-connectors',
    toModuleId: 'parent-child-chunker',
    labelFa: 'ارسال سند همگام‌سازی‌شده به پایپ‌لاین خردکردن',
    whatItDoesFa:
      'متن استخراج‌شده از Google Drive، Slack، Notion یا سایر کانکتورها به‌عنوان سند نرمال‌سازی‌شده وارد چرخه Parent-Child RAG می‌شود.',
    internalMechanicsFa:
      'پس از پاکسازی نسخه‌های قبلی همان کانکتور، تابع `syncConnectorDataIntoBrain` متد `ingestDocumentIntoBrain` را صدا می‌زند که `createParentChildChunks` را اجرا می‌کند.',
    payloadSummaryFa: 'RawGovernanceDocumentInput (sourceType: gdrive | slack | confluence | upload)',
  },
  {
    id: 'conn-extractor-to-chunker',
    fromModuleId: 'multimodal-extractor',
    toModuleId: 'parent-child-chunker',
    labelFa: 'تحویل متن استخراج‌شده فایل به خردکننده',
    whatItDoesFa:
      'متن تمیز استخراج‌شده از PDF، پاورپوینت، تصویر یا صوت پس از تایید عنوان و دپارتمان در رابط کاربری، برای خردکردن و نمایه‌سازی ارسال می‌شود.',
    internalMechanicsFa:
      'خروجی `/api/brain/extract` از طریق `POST /api/brain/documents` وارد `ingestDocumentIntoBrain` شده و به بلوک‌های والد ۲۰۰۰ کاراکتری و فرزند ۴۰۰ کاراکتری تقسیم می‌شود.',
    payloadSummaryFa: 'Normalized Title + Extracted Text + Department + Tags',
  },
  {
    id: 'conn-chunker-to-embedding',
    fromModuleId: 'parent-child-chunker',
    toModuleId: 'embedding-engine',
    labelFa: 'ارسال تکه‌های ۴۰۰ کاراکتری برای بردارسازی',
    whatItDoesFa:
      'تمام `ChildVectorChunk`های تولیدشده یکی‌یکی به بردارهای ۷۶۸ بعدی تبدیل می‌شوند تا قابلیت جستجوی معنایی پیدا کنند.',
    internalMechanicsFa:
      'برای هر تکه فرزند، رشته ترکیبی دپارتمان + تگ‌ها + متن به `generateGeminiEmbedding768` داده می‌شود و در صورت نبود شبکه، موتور بردارسازی آفلاین جایگزین می‌شود.',
    payloadSummaryFa: 'ChildVectorChunk[] → EmbeddedChildChunk[] (768-d vectors)',
  },
  {
    id: 'conn-embedding-to-retriever',
    fromModuleId: 'embedding-engine',
    toModuleId: 'vector-retriever',
    labelFa: 'بردار پرسش ۷۶۸ بعدی برای جستجوی معنایی',
    whatItDoesFa:
      'متن تصمیم پیشنهادی مدیر نیز با همان مدل ۷۶۸ بعدی بردارسازی می‌شود تا در فضای برداری با سیاست‌های شرکت مقایسه گردد.',
    internalMechanicsFa:
      'تابع `searchBrainByVectorSimilarity` ابتدا `generateGeminiEmbedding768(params.query)` را اجرا کرده و بردار حاصل را به `$vectorSearch` یا شباهت کسینوسی می‌دهد.',
    payloadSummaryFa: 'Query Vector (768-d Float Array) + RBAC Department Filter',
  },
  {
    id: 'conn-retriever-to-auditor',
    fromModuleId: 'vector-retriever',
    toModuleId: 'dual-stage-auditor',
    labelFa: 'تحویل اسناد والد هرس‌شده به موتور ممیزی',
    whatItDoesFa:
      'تنها اسناد والدی که بیشترین ارتباط معنایی را با تصمیم دارند (پس از حذف موارد کم‌ربط) به‌عنوان شواهد به موتور ممیزی ارسال می‌شوند.',
    internalMechanicsFa:
      'نتایج `$vectorSearch` ابتدا به اسناد والد کامل نگاشت شده و سپس توسط `filterRelevantCitations(maxDrop=0.15, minScore=0.70)` پالایش می‌شوند.',
    payloadSummaryFa: 'MatchedParentContextInput[] (Full Parent Content + Similarity Scores)',
  },
  {
    id: 'conn-auditor-to-regulatory',
    fromModuleId: 'dual-stage-auditor',
    toModuleId: 'german-regulatory-engine',
    labelFa: 'عبور اجباری گزارش از غربالگر قوانین آلمان',
    whatItDoesFa:
      'گزارش تولیدشده توسط ارزیاب قطعی و LLM پیش از ذخیره و ارسال به کاربر، الزاماً از فیلتر قوانین آلمان و اروپا عبور می‌کند.',
    internalMechanicsFa:
      'تابع `applyGermanAdvisoryToReport` روی خروجی نهایی اعمال می‌شود؛ اگر هر قانون (`BetrVG`، `DSGVO`، `EU AI Act`، `NIS-2`) فعال شده باشد، حکم `CERTIFIED` به `CONDITIONAL` تنزل می‌یابد و نمره در `74` قفل می‌شود.',
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
      'مسیریاب AI بهترین مدل پروفایل `fast` را برای استخراج متن از PDF، تصاویر و فایل‌های صوتی انتخاب کرده و خطاها را مدیریت می‌کند.',
    internalMechanicsFa:
      'در `POST /api/brain/extract` فراخوانی `geminiModelSelector.executeWithFallback("fast", ...)` با فیوز ۱۵ دقیقه‌ای و تایم‌اوت ۱۸ ثانیه انجام می‌شود.',
    payloadSummaryFa: 'Profile: fast → Selected Flash Model + Circuit-Breaker Fallback Chain',
  },
  {
    id: 'conn-router-to-embedding',
    fromModuleId: 'ai-model-router',
    toModuleId: 'embedding-engine',
    labelFa: 'تامین کلید API اختصاصی و تاب‌آوری بردارسازی',
    isCrossHub: true,
    whatItDoesFa:
      'لایه AI کلید Gemini اختصاصی سازمان فعال را در اختیار سرویس بردارسازی می‌گذارد و سیاست عدم توقف را هماهنگ می‌کند.',
    internalMechanicsFa:
      'تابع `resolveGeminiApiKey()` کلید اختصاصی سازمان (رمزگشایی‌شده از کنترل‌پلین) یا کلید پایه را به `generateGeminiEmbedding768` تحویل می‌دهد؛ در صورت خطا، بردارساز آفلاین فعال می‌شود.',
    payloadSummaryFa: 'Tenant-Scoped Gemini API Key → text-embedding-004 (768-d) / Offline Fallback',
  },
  {
    id: 'conn-router-to-auditor',
    fromModuleId: 'ai-model-router',
    toModuleId: 'dual-stage-auditor',
    labelFa: 'انتخاب مدل استدلالی و زنجیره پشتیبان ممیزی',
    isCrossHub: true,
    whatItDoesFa:
      'بر اساس پیچیدگی تصمیم، مدل مناسب (`reasoning` یا `fast`) را انتخاب و در صورت خطای سهمیه یا تایم‌اوت، به مدل بعدی در زنجیره سوئیچ می‌کند.',
    internalMechanicsFa:
      'مسیر `/api/brain/audit` ابتدا `selectModel(inferredProfile)` را به موازات جستجوی برداری اجرا کرده و سپس `callGeminiAuditSynthesis` را درون `executeWithFallback` با فیوز ۱۵ دقیقه‌ای اجرا می‌کند.',
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
      'وضعیت فعال بودن، محدوده هدف، کلید رمزنگاری‌شده و تاریخ آخرین همگام‌سازی هر کانکتور در کالکشن `connectors` سازمان ذخیره می‌شود.',
    internalMechanicsFa:
      'تابع `persistConnectorItemToAtlas` از `updateOne({ id }, { $set }, { upsert: true })` استفاده می‌کند و هنگام بارگذاری، `getConnectorsList` آن را در حافظه بازسازی می‌نماید.',
    payloadSummaryFa: 'EnterpriseConnectorItem + serverSecret → connectors collection',
  },
  {
    id: 'conn-rag-to-db',
    fromModuleId: 'embedding-engine',
    toModuleId: 'tenant-mongodb-cluster',
    labelFa: 'نوشتن اسناد والد و بردارهای فرزند ۷۶۸ بعدی',
    isCrossHub: true,
    whatItDoesFa:
      'پس از خردکردن و بردارسازی، اسناد والد در `raw_documents` و تکه‌های برداری در `vector_store` دیتابیس ایزوله سازمان ذخیره می‌شوند.',
    internalMechanicsFa:
      'تابع `ingestDocumentIntoBrain` هر دو مجموعه را هم‌زمان در `InMemoryBrainVault` و MongoDB Atlas درج کرده و وجود اندیس `mindmittel_vector_index` را بررسی می‌کند.',
    payloadSummaryFa: 'RawDocumentRecord[] → raw_documents | VectorStoreRecord[] → vector_store',
  },
  {
    id: 'conn-db-to-retriever',
    fromModuleId: 'tenant-mongodb-cluster',
    toModuleId: 'vector-retriever',
    labelFa: 'اجرای جستجوی برداری و هیدراتاسیون اسناد والد',
    isCrossHub: true,
    whatItDoesFa:
      'دیتابیس برداری نزدیک‌ترین تکه‌های فرزند را به موتور بازیابی برمی‌گرداند و متن کامل والد را از `raw_documents` واکشی می‌کند.',
    internalMechanicsFa:
      'پایپ‌لاین `$vectorSearch` روی `vector_store` اجرا شده و در صورت در دسترس نبودن اندیس، لایه `in-memory-vault-hydration` از طریق `hydrateVaultFromMongo` پاسخ را تامین می‌کند.',
    payloadSummaryFa: 'Atlas $vectorSearch Hits + RawDocumentRecord Parents',
  },
  {
    id: 'conn-db-to-conflict',
    fromModuleId: 'in-memory-vault-hydration',
    toModuleId: 'conflict-detector',
    labelFa: 'تامین اسناد تجمیع‌شده برای کشف تضادها',
    isCrossHub: true,
    whatItDoesFa:
      'تمام تکه‌های والد مربوط به یک سند منطقی به هم دوخته می‌شوند و برای مقایسه دوبه‌دو به کاشف تعارض تحویل داده می‌شوند.',
    internalMechanicsFa:
      'تابع `listBrainDocuments` پس از هیدراتاسیون، بلوک‌های والد هم‌عنوان را مرتب و یکپارچه کرده و `listBrainDocumentConflicts` آن‌ها را به `detectBrainDocumentConflicts` می‌دهد.',
    payloadSummaryFa: 'Grouped Logical Brain Documents → Conflict Analysis',
  },
  {
    id: 'conn-regulatory-to-db',
    fromModuleId: 'german-regulatory-engine',
    toModuleId: 'tenant-mongodb-cluster',
    labelFa: 'ثبت ماندگار گزارش نهایی در تاریخچه ممیزی',
    isCrossHub: true,
    whatItDoesFa:
      'گزارش نهایی ممیزی (همراه با هشدارهای قانونی، استنادات و اسناد مستثنی‌شده) به‌عنوان رکورد قابل ردیابی در `audit_history` ثبت می‌شود.',
    internalMechanicsFa:
      'تابع `saveAuditReportToHistory` شناسه `audit_<ts>_<rand>` تولید کرده و سند کامل `StoredAuditHistoryEntry` را در `audit_history` و حافظه رم درج می‌کند.',
    payloadSummaryFa: 'StoredAuditHistoryEntry → audit_history collection',
  },

  // Delivery & Telemetry Connections — ZONE 6
  {
    id: 'conn-regulatory-to-stream',
    fromModuleId: 'german-regulatory-engine',
    toModuleId: 'ndjson-heartbeat-stream',
    labelFa: 'ارسال گزارش نهایی از طریق استریم ضربان قلب',
    whatItDoesFa:
      'به‌محض آماده شدن گزارش نهایی و ثبت در تاریخچه، آخرین فریم NDJSON به مرورگر ارسال شده و اتصال استریم بسته می‌شود.',
    internalMechanicsFa:
      'تایمر ۸ ثانیه‌ای ضربان قلب متوقف شده و فریم `{"type":"result","status":200,"data":{ ok, report, entry, history }}` توسط `fetchJsonWithHeartbeat` در داشبورد دریافت و رندر می‌شود.',
    payloadSummaryFa: 'NDJSON Final Result Frame → Web Dashboard + A4 Print PDF',
  },
  {
    id: 'conn-audit-to-telemetry',
    fromModuleId: 'dual-stage-auditor',
    toModuleId: 'sse-live-telemetry',
    labelFa: 'ارسال رویدادهای ساختاریافته به استریم زنده SSE',
    whatItDoesFa:
      'نتیجه ممیزی، مدل استفاده‌شده، تعداد اسناد مرتبط و وضعیت نیاز به Betriebsrat به‌صورت لحظه‌ای در لاگر حلقوی ثبت و پخش می‌شود.',
    internalMechanicsFa:
      'فراخوانی `systemLogger.info("audit.engine", ...)` رویداد را پس از پاکسازی کلیدهای حساس و تگ‌گذاری سازمان به همه مشترکان فعال `/api/system/logs/stream` ارسال می‌کند.',
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
