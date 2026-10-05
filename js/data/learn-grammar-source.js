/* ═══════════════════════════════════════════════════════════════════════
   INELT · الملزمة — فرع القواعد

   المحتوى من ملزمة "الامتحان الوطني الانكليزي" للأستاذ علي عدنان، منقولاً
   نصاً ومُراجَعاً لغوياً. كل تصحيح على الأصل موثّق في booklet-changes.md.

   بيانات ثابتة فقط: هذا الملف لا يلمس Supabase ولا منطق الامتحان.

   شكل الكتل:
     {t:'p',       ar}                 فقرة شرح
     {t:'sub',     ar, en}             عنوان فرعي داخل الدرس
     {t:'words',   items:[]}           قائمة كلمات
     {t:'ex',      en, ar}             مثال إنكليزي ومعناه
     {t:'formula', text}               صيغة التركيب
     {t:'note',    ar}                 ملاحظة مهمة
     {t:'table',   head:[], rows:[[]]} جدول
     {t:'q',       q, opts:[], a}      سؤال اختياري، a = فهرس الجواب
   ═══════════════════════════════════════════════════════════════════════ */
window.BOOKLET = {
  section: 'grammar',
  title: 'القواعد',
  subtitle: 'ملزمة الامتحان الوطني الإنكليزي',
  author: 'الأستاذ علي عدنان',
  parts: [

/* ═════════ 1 ═════════ */
{ n: 1, ar: 'أجزاء الكلام', en: 'Parts of Speech', lessons: [

  { ar: 'الأسماء', en: 'Nouns', body: [
    { t: 'p', ar: 'الأسماء: هي كلمات نستخدمها للإشارة إلى أشخاص أو أماكن أو أفكار… إلخ، وتنقسم إلى أنواع:' },
    { t: 'sub', ar: 'أسماء العلم', en: 'a. Proper nouns' },
    { t: 'p', ar: 'أسماء العلم هي أسماء أشخاص أو بلدان، وتبدأ بحرف كبير:' },
    { t: 'words', items: ['Ali', 'Hussain', 'John', 'Baghdad', 'London'] },
    { t: 'sub', ar: 'الأسماء الشائعة', en: 'b. Common nouns' },
    { t: 'p', ar: 'الأسماء الشائعة هي الأسماء التي تشير إلى الأشياء العامة:' },
    { t: 'words', items: ['boy', 'girl', 'school', 'stone'] },
    { t: 'sub', ar: 'الأسماء المعدودة', en: 'c. Countable nouns' },
    { t: 'p', ar: 'الأسماء المعدودة هي الأسماء التي يمكن عدّها، وممكن أن تأتي مفرد أو جمع — يعني أشياء نكدر نحسبها: سيارة سيارتين، تفاحة تفاحتين، كتاب كتابين:' },
    { t: 'words', items: ['book', 'student', 'apple', 'car'] },
    { t: 'note', ar: 'نعرف الاسم جمع من خلال حرف الـ (s) في نهاية الاسم. وهنالك أيضاً جمع شاذ لا يأخذ (s) سيتم التطرق له لاحقاً: book → books / apple → apples' },
    { t: 'sub', ar: 'الأسماء غير المعدودة', en: 'd. Uncountable nouns' },
    { t: 'p', ar: 'الأسماء غير المعدودة هي الأسماء التي لا يمكن عدّها — يعني أشياء ما نكدر نحسبها:' },
    { t: 'words', items: ['water', 'money', 'sugar', 'salt', 'air', 'meat'] }
  ]},

  { ar: 'الضمائر', en: 'Pronouns', body: [
    { t: 'p', ar: 'الضمائر هي كلمات تحلّ محلّ الأسماء للاختصار أو لتجنّب التكرار. يعني بدل أن أقول «أحمد ذهب إلى السوق» أقول «هو ذهب إلى السوق». أنواع الضمائر:' },
    { t: 'sub', ar: 'ضمائر الفاعل', en: 'a. Subject pronouns' },
    { t: 'p', ar: 'ضمائر الفاعل هي الضمائر التي تحلّ محلّ الفاعل (الفاعل هو الشخص أو الشيء الذي يقوم بالفعل).' },
    { t: 'words', items: ['I', 'you', 'he', 'she', 'it', 'we', 'they'] },
    { t: 'ex', en: 'You are kind', ar: 'أنت طيب' },
    { t: 'ex', en: 'I am a teacher', ar: 'أنا معلّم' },
    { t: 'note', ar: 'ضمير الفاعل غالباً يأتي في بداية الجملة.' },
    { t: 'sub', ar: 'ضمائر المفعول به', en: 'b. Object pronouns' },
    { t: 'p', ar: 'ضمائر المفعول به تحلّ محلّ الاسم المفعول به (المفعول به هو الشخص أو الشيء الذي وقع عليه الفعل). يعني بدلاً من أن نقول «علي أطعم الكلب» نقول «علي أطعمه»:' },
    { t: 'words', items: ['me', 'you', 'him', 'her', 'it', 'us', 'them'] },
    { t: 'ex', en: 'He saw me', ar: 'هو رآني' },
    { t: 'ex', en: 'I know him', ar: 'أنا أعرفه' },
    { t: 'note', ar: 'ضمير المفعول به غالباً يأتي بعد الفعل، أي في وسط الجملة أو آخرها.' },
    { t: 'sub', ar: 'صفات التملّك', en: 'c. Possessive adjectives' },
    { t: 'p', ar: 'صفات التملّك نستخدمها للإشارة إلى أن شيئاً ما ملك لشخص (هذه سيارتي / هذه سيارتها):' },
    { t: 'words', items: ['my', 'your', 'his', 'her', 'its', 'our', 'their'] },
    { t: 'note', ar: 'صفات التملّك دائماً يأتي بعدها اسم الشيء الذي نملكه.' },
    { t: 'ex', en: 'This is my car', ar: 'هذه سيارتي' },
    { t: 'ex', en: 'I saw his house', ar: 'رأيت منزله' },
    { t: 'note', ar: 'انتبه: ضمائر التملّك الحقيقية (possessive pronouns) هي mine / yours / his / hers / its / ours / theirs ولا يأتي بعدها اسم — مثل: This car is mine.' },
    { t: 'sub', ar: 'الضمائر الانعكاسية', en: 'd. Reflexive pronouns' },
    { t: 'p', ar: 'هي ضمائر تُستخدم عندما يكون الفاعل والمفعول به نفس الشخص أو الشيء — يعني الفعل الذي يقوم به الفاعل ينعكس عليه. مثل: أنا جرحت نفسي.' },
    { t: 'words', items: ['myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves'] }
  ]},

  { ar: 'الأفعال', en: 'Verbs', body: [
    { t: 'p', ar: 'الفعل هو الحدث أو الشيء الذي يقوم به الفاعل. مثلاً (هو يلعب الكرة) — «يلعب» هنا فعل.' },
    { t: 'words', items: ['go', 'play', 'see', 'look', 'listen', 'kill'] },
    { t: 'ex', en: 'He plays football', ar: 'هو يلعب كرة القدم' }
  ]},

  { ar: 'الصفات', en: 'Adjectives', body: [
    { t: 'p', ar: 'الصفات هي الكلمات التي نستخدمها لوصف الأشخاص أو الأشياء أو الأماكن (هذا الشخص جميل) — «جميل» هنا صفة.' },
    { t: 'words', items: ['beautiful', 'nice', 'strong', 'fat', 'slim', 'happy', 'sad', 'big', 'small'] },
    { t: 'ex', en: 'He is so strong', ar: 'هو قوي جداً' },
    { t: 'ex', en: 'He seems sad', ar: 'هو يبدو حزيناً' }
  ]},

  { ar: 'الظروف', en: 'Adverbs', body: [
    { t: 'p', ar: 'الظروف تنقسم إلى عدة أنواع:' },
    { t: 'sub', ar: 'ظروف الزمان', en: 'a. Adverbs of time' },
    { t: 'p', ar: 'كل كلمة تدلّ على وقت معيّن (اليوم / غداً / البارحة).' },
    { t: 'words', items: ['today', 'tomorrow', 'tonight', 'yesterday', '2020', 'November'] },
    { t: 'ex', en: 'I saw him yesterday', ar: 'لقد رأيته البارحة' },
    { t: 'ex', en: 'She will be there tomorrow', ar: 'هي ستكون هناك غداً' },
    { t: 'sub', ar: 'ظروف المكان', en: 'b. Adverbs of place' },
    { t: 'p', ar: 'كلمة تدلّ على مكان معيّن (هنا / هناك / الجامعة / المنزل / بغداد… إلخ).' },
    { t: 'words', items: ['here', 'there', 'university', 'home', 'Baghdad'] },
    { t: 'ex', en: 'He is at the university', ar: 'هو في الجامعة' },
    { t: 'sub', ar: 'ظروف الحال', en: 'c. Adverbs of manner' },
    { t: 'p', ar: 'ظروف الحال هي الظروف التي تصف الأفعال أو الكيفية التي تمّ بها الفعل. (هو ركض بسرعة) — فهنا وصفنا الفعل (الركض)، كيف ركض؟ ركض بسرعة. «بسرعة» هنا ظرف حال.' },
    { t: 'note', ar: 'ظروف الحال في اللغة الإنكليزية غالباً تنتهي بـ (ly).' },
    { t: 'ex', en: 'She sang beautifully', ar: 'هي غنّت بشكل جميل' },
    { t: 'ex', en: 'He runs quickly', ar: 'هو يركض بسرعة' },
    { t: 'p', ar: 'ظروف شاذة بدون (ly):' },
    { t: 'words', items: ['fast', 'hard', 'well'] },
    { t: 'ex', en: 'It went very fast', ar: 'جرى بسرعة كبيرة' },
    { t: 'ex', en: 'He tried hard', ar: 'هو حاول بجدّ' },
    { t: 'q', q: 'He __________ to find a job, but he had no luck.',
      opts: ['tried hard', 'hard tried', 'hardly tried', 'tried hardly'], a: 0 }
  ]},

  { ar: 'حروف الجر', en: 'Prepositions', body: [
    { t: 'words', items: ['in', 'on', 'at', 'to', 'from', 'with', 'by', 'for', 'about', 'of'] },
    { t: 'sub', ar: 'في', en: 'a. In' },
    { t: 'p', ar: 'نستخدم (in) مع السنوات أو الأشهر أو القرون أو الأماكن:' },
    { t: 'ex', en: 'She was born in 2002', ar: 'هي وُلدت في سنة 2002' },
    { t: 'ex', en: 'She was born in January', ar: 'هي وُلدت في كانون الثاني' },
    { t: 'ex', en: 'He was in the university', ar: 'هو كان في الجامعة' },
    { t: 'sub', ar: 'على', en: 'b. On' },
    { t: 'p', ar: 'تُستخدم مع أيام الأسبوع والمواعيد والأماكن المحددة:' },
    { t: 'ex', en: 'She was born on Monday', ar: 'هي وُلدت يوم الاثنين' },
    { t: 'ex', en: 'The meeting is on July 4th', ar: 'الاجتماع في الرابع من تموز' },
    { t: 'ex', en: 'The book is on the table', ar: 'الكتاب على الطاولة' },
    { t: 'sub', ar: 'عند', en: 'c. At' },
    { t: 'p', ar: 'نستخدم (at) مع الساعات أو أوقات محددة من اليوم والأماكن المحددة:' },
    { t: 'ex', en: 'The meeting is at 5 pm', ar: 'الاجتماع عند الساعة الخامسة مساءً' },
    { t: 'ex', en: 'She is at the door', ar: 'هي عند الباب' },
    { t: 'sub', ar: 'إلى', en: 'd. To' },
    { t: 'p', ar: 'يعبّر عن الذهاب إلى مكان معيّن:' },
    { t: 'ex', en: 'I went to Baghdad', ar: 'أنا ذهبت إلى بغداد' },
    { t: 'sub', ar: 'من', en: 'e. From' },
    { t: 'p', ar: 'يعبّر عن القدوم من مكان معيّن:' },
    { t: 'ex', en: 'He came from London', ar: 'هو جاء من لندن' },
    { t: 'sub', ar: 'مع', en: 'f. With' },
    { t: 'p', ar: 'تُستخدم للرفقة (شخص مع شخص أو شيء مع شيء… إلخ):' },
    { t: 'ex', en: 'I saw him with my brother', ar: 'أنا رأيته مع أخي' },
    { t: 'sub', ar: 'بواسطة', en: 'g. By' },
    { t: 'p', ar: 'تُستخدم للإشارة إلى الوسيلة التي نستخدمها للقيام بشيء:' },
    { t: 'ex', en: 'She usually goes to work by bus', ar: 'هي عادةً تذهب إلى العمل بالحافلة' },
    { t: 'note', ar: 'استثناء مهم: المشي على الأقدام تُقال on foot وليس by feet — He went to school on foot.' },
    { t: 'sub', ar: 'لأجل', en: 'h. For' },
    { t: 'p', ar: 'تُستخدم عندما تقوم بشيء من أجل شخص أو شيء:' },
    { t: 'ex', en: 'Can you fix the car for me?', ar: 'هل يمكنك إصلاح السيارة لأجلي؟' },
    { t: 'ex', en: 'I did all that for you', ar: 'أنا قمت بكل هذا من أجلك' },
    { t: 'sub', ar: 'حول أو عن', en: 'i. About' },
    { t: 'ex', en: 'He talks about me', ar: 'هو يتكلّم عنّي' },
    { t: 'q', q: 'I was born _____ 1993.', opts: ['on', 'in', 'at', 'to'], a: 1 },
    { t: 'q', q: 'Most of the alumni arrived ________ bus.', opts: ['with', 'by', 'from', 'in'], a: 1 }
  ]},

  { ar: 'أدوات الربط', en: 'Conjunctions', body: [
    { t: 'words', items: ['and', 'or', 'but', 'because'] },
    { t: 'sub', ar: 'و', en: 'a. And' },
    { t: 'ex', en: 'I like chicken and rice', ar: 'أنا أحب الدجاج والرز' },
    { t: 'sub', ar: 'أو', en: 'b. Or' },
    { t: 'ex', en: 'Do you like a banana or an apple?', ar: 'هل تحب الموز أو التفاح؟' },
    { t: 'sub', ar: 'لكن', en: 'c. But' },
    { t: 'ex', en: 'I don’t know him personally, but he seems a good person', ar: 'ما أعرفه شخصياً لكن يبيّن شخص جيد' },
    { t: 'sub', ar: 'بسبب / لأنّ', en: 'd. Because' },
    { t: 'p', ar: 'تعبّر عن السبب:' },
    { t: 'ex', en: 'I hate him because he is not polite', ar: 'أكرهه لأنه ليس مؤدباً' }
  ]},

  { ar: 'أدوات التعجب', en: 'Interjections', body: [
    { t: 'words', items: ['wow!', 'oh!', 'ouch!', 'hey!', 'hurray!'] },
    { t: 'note', ar: 'أجزاء الكلام ممكن تأتي في الامتحان عن طريق إعطائك جملة ويحدّد لك كلمة ويسألك: ما نوع هذه الكلمة؟ هل هي فعل، اسم، ضمير… وهكذا.' },
    { t: 'q', q: 'In the sentence "This is my pen," what is "my"?',
      opts: ['pronoun', 'noun', 'verb', 'adverb'], a: 0 }
  ]}
]},

/* ═════════ 2 ═════════ */
{ n: 2, ar: 'أدوات التعريف والتنكير', en: 'Articles', lessons: [
  { ar: 'أدوات التنكير', en: 'a / an', body: [
    { t: 'p', ar: 'نستخدمهما فقط مع الأسماء المفردة النكرة.' },
    { t: 'p', ar: 'نستخدم (a) عندما تبدأ الكلمة بحرف أو صوت ساكن — أي كل الأحرف ما عدا أحرف العلة الخمسة.' },
    { t: 'p', ar: 'نستخدم (an) عندما تبدأ الكلمة بحرف أو صوت علّة.' },
    { t: 'words', items: ['a', 'e', 'i', 'o', 'u'] },
    { t: 'ex', en: 'Ahmed bought a car', ar: 'أحمد اشترى سيارة' },
    { t: 'ex', en: 'Ali ate an apple', ar: 'علي أكل تفاحة' }
  ]},
  { ar: 'أداة التعريف', en: 'the', body: [
    { t: 'p', ar: 'نستخدم (the) للحديث عن شيء معروف لدى المتكلم والمستمع، أي تمّ الحديث عنه مسبقاً. وتأتي مع جميع الأسماء سواء كانت مفردة أو جمع أو غير معدودة.' },
    { t: 'p', ar: 'تُستخدم أيضاً مع القمر والشمس وأسماء البحار والأنهار والمحيطات.' },
    { t: 'ex', en: 'The car that Ahmed bought was nice', ar: 'السيارة التي اشتراها أحمد كانت جميلة' },
    { t: 'ex', en: 'Look at the sun', ar: 'انظر إلى الشمس' },
    { t: 'ex', en: 'The Nile is a river in Egypt', ar: 'النيل نهر في مصر' }
  ]}
]},

/* ═════════ 3 ═════════ */
{ n: 3, ar: 'الجمع', en: 'Plural', lessons: [
  { ar: 'الجمع القياسي', en: 'Regular Plural', body: [
    { t: 'p', ar: 'تحويل الاسم من مفرد إلى جمع يتم بإضافة s أو es للأسماء القياسية غير الشاذة.' },
    { t: 'words', items: ['books', 'pens', 'rooms', 'soldiers'] }
  ]},
  { ar: 'الجمع الشاذ', en: 'Irregular Plural', body: [
    { t: 'p', ar: 'الجمع الشاذ هو الجمع الذي يتم بدون إضافة s، إنما عن طريق تغيير بعض أحرف الاسم:' },
    { t: 'table', head: ['المفرد', 'الجمع'], rows: [
      ['man', 'men'], ['woman', 'women'], ['child', 'children'],
      ['tooth', 'teeth'], ['mouse', 'mice'] ] },
    { t: 'note', ar: 'الضمائر المفردة هي: he , she , it — بينما ضمائر الجمع: we , they , you. صحيح أن الضمير (you) من ناحية المعنى قد يكون مفرداً، لكن من ناحية القواعد يُعامل معاملة الجمع.' }
  ]}
]}
,

/* ═════════ 4 ═════════ */
{ n: 4, ar: 'الأزمان', en: 'Tenses', lessons: [

  { ar: 'المضارع البسيط', en: 'Present Simple', body: [
    { t: 'p', ar: 'نستخدم زمن المضارع البسيط للحديث عن حقائق عامة أو علمية، أو عن العادات والروتين اليومي وشيء متكرر ودائم الحصول. الدلائل:' },
    { t: 'words', items: ['always', 'usually', 'never', 'sometimes', 'rarely', 'often', 'every'] },
    { t: 'sub', ar: 'الإثبات', en: 'a. Affirmative' },
    { t: 'p', ar: 'الفعل يكون مجرداً خالياً من الإضافة إذا كان الفاعل (I , you , we , they) أو اسماً جمعاً، ويتم إضافة (s) أو (es) للفعل إذا كان الفاعل (he , she , it) أو اسماً مفرداً:' },
    { t: 'formula', text: 'فاعل + فعل مجرد / فعل + s + تكملة الجملة' },
    { t: 'ex', en: 'They never go to the museum.', ar: 'هم لا يذهبون إلى المتحف أبداً' },
    { t: 'ex', en: 'He often finds it.', ar: 'هو غالباً يجده' },
    { t: 'sub', ar: 'النفي', en: 'b. Negative' },
    { t: 'p', ar: 'يتم النفي بإضافة (don’t) مع الفاعل الجمع، و(doesn’t) مع المفرد، والفعل في الحالتين مجرد:' },
    { t: 'formula', text: 'فاعل + don’t / doesn’t + فعل مجرد' },
    { t: 'ex', en: 'They don’t want to be here.', ar: 'هم لا يريدون أن يكونوا هنا' },
    { t: 'ex', en: 'She doesn’t always go to the market.', ar: 'هي لا تذهب دائماً إلى السوق' },
    { t: 'sub', ar: 'الاستفهام', en: 'c. Question' },
    { t: 'p', ar: 'الاستفهام يتم عن طريق إضافة (do) في حالة الجمع أو (does) في حالة المفرد قبل الفاعل:' },
    { t: 'formula', text: 'do / does + فاعل + فعل مجرد ؟' },
    { t: 'ex', en: 'Do you even care?', ar: 'هل تهتم أصلاً؟' },
    { t: 'ex', en: 'Does Ali love pizza?', ar: 'هل يحب علي البيتزا؟' },
    { t: 'note', ar: 'نستخدم (has , is) مع الفاعل المفرد، و(have , are) مع الفاعل الجمع، و(am , have) مع الضمير I.' },
    { t: 'q', q: '_____ many times every winter in Frankfurt.',
      opts: ['It snows', 'It snowed', 'It is snowing', 'It is snow'], a: 0 },
    { t: 'q', q: 'I don’t understand this sentence. What ______ ?',
      opts: ['does mean this word', 'does this word mean', 'means this word', 'do this word mean'], a: 1 },
    { t: 'q', q: 'The north pole ____ a latitude of 90 degrees north.',
      opts: ['it has', 'has', 'which is having', 'are having'], a: 1 }
  ]},

  { ar: 'المضارع المستمر', en: 'Present Continuous', body: [
    { t: 'p', ar: 'نستخدم زمن المضارع المستمر للحديث عن أشياء تحصل في لحظة الكلام. الدلائل:' },
    { t: 'words', items: ['now', 'at this moment', 'currently', 'this day', 'this week', 'this year'] },
    { t: 'p', ar: 'يتكوّن من فاعل وفعل مساعد (is مع المفرد، am مع I، are مع الجمع) والفعل الرئيسي مع إضافة ing له.' },
    { t: 'sub', ar: 'الإثبات', en: 'a. Affirmative' },
    { t: 'formula', text: 'فاعل + is / am / are + فعل + ing' },
    { t: 'ex', en: 'The number of people in Iraq is rising', ar: 'عدد السكان في العراق يرتفع' },
    { t: 'ex', en: 'You are sitting here now', ar: 'أنت جالس هنا الآن' },
    { t: 'ex', en: 'I’m doing my job now', ar: 'أنا أقوم بعملي الآن' },
    { t: 'sub', ar: 'النفي', en: 'b. Negative' },
    { t: 'p', ar: 'النفي يتم فقط بإضافة not للأفعال المساعدة (وعادة ما يتم اختصاره إلى n’t):' },
    { t: 'ex', en: 'I’m not doing anything now', ar: 'أنا لا أفعل شيئاً الآن' },
    { t: 'ex', en: 'Ali isn’t going anywhere', ar: 'علي لا يذهب إلى أي مكان' },
    { t: 'ex', en: 'We aren’t watching a movie', ar: 'نحن لا نشاهد فيلماً' },
    { t: 'sub', ar: 'الاستفهام', en: 'c. Question' },
    { t: 'p', ar: 'الاستفهام يتم عن طريق تغيير مكان الأفعال المساعدة ووضعها قبل الفاعل:' },
    { t: 'ex', en: 'Am I doing something wrong?', ar: 'هل أفعل شيئاً خاطئاً؟' },
    { t: 'ex', en: 'What is Ahmed watching?', ar: 'ماذا يشاهد أحمد؟' },
    { t: 'ex', en: 'Are you kidding me?', ar: 'هل تمزح معي؟' },
    { t: 'q', q: 'Your friend is from Basra. Ask him where he is living now.',
      opts: ['Where are you live now?', 'Where you living now?', 'Where did her lived?', 'Where are you living now?'], a: 3 },
    { t: 'q', q: 'I want to lose weight, so this week __________ dinner.',
      opts: ['I am not eating', 'I am eating', 'I never eating', 'I am not eat'], a: 0 },
    { t: 'q', q: 'Is your English ________ better? — Yes, it is.',
      opts: ['getting', 'was getting', 'get', 'got'], a: 0 },
    { t: 'q', q: 'The cost of living _________. Every year things are getting more expensive.',
      opts: ['is rise', 'is rising', 'are rising', 'were rising'], a: 1 }
  ]},

  { ar: 'المضارع التام البسيط', en: 'Present Perfect Simple', body: [
    { t: 'p', ar: 'نستخدمه للحديث عن أشياء حصلت في الماضي لكن الأثر لا يزال قائماً إلى هذه اللحظة. الدلائل:' },
    { t: 'words', items: ['already', 'just', 'yet', 'never', 'ever', 'since', 'for'] },
    { t: 'p', ar: 'يتكوّن من فاعل وفعل مساعد (has) إذا كان الفاعل (he , she , it) أو اسماً مفرداً، أو (have) إذا كان الفاعل (you , we , they) أو اسماً جمعاً. والفعل الرئيسي يكون بصيغة التصريف الثالث.' },
    { t: 'note', ar: 'ما هو التصريف الثالث؟ هو شكل خاص من الفعل (نرمز له p.p) نستخدمه في المضارع التام والماضي التام والمبني للمجهول. في أغلب الأحيان يتم تحويل الفعل إليه بإضافة -ed في نهايته: play → played ، want → wanted. وهناك أفعال شاذة تتحول بدون -ed.' },
    { t: 'sub', ar: 'الإثبات', en: 'a. Affirmative' },
    { t: 'formula', text: 'فاعل + has / have + p.p' },
    { t: 'ex', en: 'She has never been to Paris', ar: 'هي لم تزر باريس أبداً' },
    { t: 'ex', en: 'My students have already visited me', ar: 'طلابي زاروني بالفعل' },
    { t: 'sub', ar: 'النفي', en: 'b. Negative' },
    { t: 'ex', en: 'Sarah has not eaten yet', ar: 'سارة لم تأكل بعد' },
    { t: 'ex', en: 'The people haven’t got mad yet', ar: 'الناس لم يغضبوا بعد' },
    { t: 'sub', ar: 'الاستفهام', en: 'c. Question' },
    { t: 'ex', en: 'Has Ali done anything yet?', ar: 'هل فعل علي أي شيء بعد؟' },
    { t: 'ex', en: 'Have you ever been to London?', ar: 'هل سبق أن زرت لندن؟' },
    { t: 'note', ar: 'ever تُستخدم مع الجمل الاستفهامية، بينما never تُستخدم مع الجمل المثبتة، ومكانهما قبل الفعل الرئيسي. و yet تُستخدم مع الاستفهام والنفي وغالباً تأتي آخر كلمة في الجملة.' },
    { t: 'sub', ar: 'since و for', en: 'Since / For' },
    { t: 'p', ar: 'نستخدم since (منذ) مع نقطة بداية محددة في الزمن:' },
    { t: 'table', head: ['النوع', 'أمثلة'], rows: [
      ['السنوات والشهور والأيام', 'since 2018 · since May · since Monday'],
      ['الساعات المحددة', 'since 8 o’clock · since 4 PM'],
      ['مراحل الحياة أو أحداث معينة', 'since childhood · since graduation'] ] },
    { t: 'p', ar: 'ونستخدم for (لمدة) مع طول المدة:' },
    { t: 'table', head: ['النوع', 'أمثلة'], rows: [
      ['الدقائق والساعات', 'for 20 minutes · for 5 hours'],
      ['الأيام والأسابيع', 'for 4 days · for 3 weeks'],
      ['الشهور والسنوات', 'for 6 months · for 10 years'] ] },
    { t: 'q', q: 'I haven’t finished my English homework _______.',
      opts: ['since', 'yet', 'ever', 'for'], a: 1 },
    { t: 'q', q: 'My uncle has worked in this factory _______ 15 years.',
      opts: ['for', 'since', 'never', 'yet'], a: 0 },
    { t: 'q', q: 'She has been a teacher _______ she graduated in 2018.',
      opts: ['for', 'yet', 'ever', 'since'], a: 3 },
    { t: 'q', q: 'They _______ written the report yet.',
      opts: ['have', 'haven’t', 'has', 'didn’t'], a: 1 }
  ]},

  { ar: 'الماضي البسيط', en: 'Past Simple', body: [
    { t: 'p', ar: 'يُستخدم هذا الزمن للتحدث عن حدث حصل وانتهى في الماضي. الدلائل:' },
    { t: 'words', items: ['yesterday', 'ago', 'last'] },
    { t: 'p', ar: 'يتم تحويل الفعل إلى ماضٍ بإضافة ed في نهايته، ويوجد أيضاً مجموعة من الأفعال الشاذة لا تقبل الـ ed عند تحويلها إلى الماضي.' },
    { t: 'sub', ar: 'الإثبات', en: 'a. Affirmative' },
    { t: 'formula', text: 'فاعل + فعل + ed' },
    { t: 'ex', en: 'He killed it yesterday', ar: 'هو قتله البارحة' },
    { t: 'sub', ar: 'النفي', en: 'b. Negative' },
    { t: 'p', ar: 'النفي يتم بإضافة didn’t قبل الفعل الرئيسي، والفعل الرئيسي يكون بصيغة المجرد:' },
    { t: 'formula', text: 'فاعل + didn’t + فعل مجرد' },
    { t: 'ex', en: 'They didn’t buy a car yesterday', ar: 'هم لم يشتروا سيارة البارحة' },
    { t: 'sub', ar: 'الاستفهام', en: 'c. Question' },
    { t: 'p', ar: 'الاستفهام يتم بإضافة did قبل الفاعل، والفعل الرئيسي يكون بصيغة المجرد:' },
    { t: 'formula', text: 'Did + فاعل + فعل مجرد ؟' },
    { t: 'ex', en: 'Where did he go yesterday?', ar: 'إلى أين ذهب البارحة؟' },
    { t: 'q', q: 'Yesterday, I _______ a beautiful movie with my family.',
      opts: ['watch', 'watched', 'watching', 'has watched'], a: 1 },
    { t: 'q', q: 'My family _______ to Egypt for vacation last summer.',
      opts: ['go', 'goes', 'went', 'gone'], a: 2 },
    { t: 'q', q: 'They _______ enjoy the party because the music was too loud.',
      opts: ['don’t', 'doesn’t', 'didn’t', 'wasn’t'], a: 2 }
  ]},

  { ar: 'الماضي المستمر', en: 'Past Continuous', body: [
    { t: 'p', ar: 'نستخدم هذا الزمن للحديث عن شيء حصل في الماضي واستمر لفترة معينة ثم انتهى. الدلائل:' },
    { t: 'words', items: ['as', 'while', 'when'] },
    { t: 'p', ar: 'يتم تكوينه بالفعل المساعد (was) مع الفاعل المفرد (he , she , it , I) أو (were) مع الفاعل الجمع (we , you , they)، مع إضافة ing للفعل الرئيسي.' },
    { t: 'sub', ar: 'الإثبات', en: 'a. Affirmative' },
    { t: 'formula', text: 'فاعل + was / were + فعل + ing' },
    { t: 'ex', en: 'I was playing football when my father came.', ar: 'كنت ألعب كرة القدم عندما جاء أبي' },
    { t: 'ex', en: 'I saw them while they were driving.', ar: 'رأيتهم بينما كانوا يقودون' },
    { t: 'sub', ar: 'النفي', en: 'b. Negative' },
    { t: 'ex', en: 'She wasn’t doing anything wrong.', ar: 'هي لم تكن تفعل شيئاً خاطئاً' },
    { t: 'ex', en: 'They were not doing anything useful.', ar: 'هم لم يكونوا يفعلون شيئاً مفيداً' },
    { t: 'sub', ar: 'الاستفهام', en: 'c. Question' },
    { t: 'ex', en: 'Was it flying when he came?', ar: 'هل كان يطير عندما جاء؟' },
    { t: 'ex', en: 'Where were they going?', ar: 'إلى أين كانوا ذاهبين؟' },
    { t: 'q', q: 'At 8 o’clock last night, I _______ studying for my English exam.',
      opts: ['is', 'was', 'were', 'am'], a: 1 },
    { t: 'q', q: 'What _______ you doing when I called you yesterday afternoon?',
      opts: ['was', 'did', 'were', 'are'], a: 2 },
    { t: 'q', q: 'While my mother _______ dinner, the doorbell rang.',
      opts: ['cooks', 'was cooking', 'cooked', 'is cooking'], a: 1 }
  ]},

  { ar: 'الماضي التام البسيط', en: 'Past Perfect Simple', body: [
    { t: 'p', ar: 'غالباً ما يأتي مع زمن الماضي البسيط في نفس الجملة. الفرق بينهما من ناحية المعنى أن كليهما ماضٍ، لكن الماضي التام أقدم من الماضي البسيط. الدلائل:' },
    { t: 'words', items: ['after', 'before', 'by the time', 'as soon as', 'until'] },
    { t: 'p', ar: 'تتكوّن جملة الماضي التام من فاعل وفعل مساعد (had) ثم فعل رئيسي بصيغة التصريف الثالث (p.p).' },
    { t: 'sub', ar: 'الإثبات', en: 'a. Affirmative' },
    { t: 'formula', text: 'فاعل + had + p.p' },
    { t: 'ex', en: 'I had finished my homework before my friend arrived.', ar: 'كنت قد أنهيت واجبي قبل أن يصل صديقي' },
    { t: 'ex', en: 'She went to bed after she had watched the movie.', ar: 'ذهبت إلى النوم بعد أن شاهدت الفيلم' },
    { t: 'sub', ar: 'النفي', en: 'b. Negative' },
    { t: 'ex', en: 'By the time the teacher came, the students hadn’t prepared the lesson.', ar: 'بحلول وقت مجيء المعلّم، لم يكن الطلاب قد حضّروا الدرس' },
    { t: 'sub', ar: 'الاستفهام', en: 'c. Question' },
    { t: 'ex', en: 'Had you finished your homework before your father came?', ar: 'هل كنت قد أنهيت واجبك قبل أن يأتي أبوك؟' },
    { t: 'note', ar: 'لاحظ: جملة الماضي التام تأتي بعد كلمة "after" وقبل كلمة "before".' },
    { t: 'q', q: 'By the time the police arrived, the thief _______ escaped.',
      opts: ['has', 'had', 'was', 'did'], a: 1 },
    { t: 'q', q: '_______ you studied English before you moved to London?',
      opts: ['Had', 'Have', 'Did', 'Were'], a: 0 },
    { t: 'q', q: 'After Ali _______ his homework, he went out to play football.',
      opts: ['finishes', 'finished', 'had finished', 'has finished'], a: 2 }
  ]},

  { ar: 'المستقبل البسيط', en: 'Future Simple', body: [
    { t: 'p', ar: 'يُستخدم للتعبير عن أفعال أو أحداث ستحدث في وقت لاحق في المستقبل. الدلائل:' },
    { t: 'words', items: ['tomorrow', 'soon', 'next'] },
    { t: 'p', ar: 'تتكوّن الجملة من فاعل و (will) وبعدها يأتي الفعل الرئيسي مجرداً.' },
    { t: 'sub', ar: 'الإثبات', en: 'a. Affirmative' },
    { t: 'formula', text: 'فاعل + will + فعل مجرد' },
    { t: 'ex', en: 'I will go tomorrow', ar: 'سأذهب غداً' },
    { t: 'sub', ar: 'النفي', en: 'b. Negative' },
    { t: 'ex', en: 'It will not rain tomorrow.', ar: 'لن تمطر غداً' },
    { t: 'sub', ar: 'الاستفهام', en: 'c. Question' },
    { t: 'ex', en: 'Will you go next year?', ar: 'هل ستذهب السنة القادمة؟' }
  ]},

  { ar: 'المستقبل المستمر', en: 'Future Continuous', body: [
    { t: 'p', ar: 'يعبّر عن حدث سيكون مستمراً وقائماً في وقت محدد أو لحظة معينة في المستقبل. الدلائل:' },
    { t: 'words', items: ['this time', 'while', 'when', 'tomorrow'] },
    { t: 'p', ar: 'تتكوّن الجملة من فاعل و (will be) وبعدها الفعل الرئيسي مضافاً له ing.' },
    { t: 'sub', ar: 'الإثبات', en: 'a. Affirmative' },
    { t: 'formula', text: 'فاعل + will be + فعل + ing' },
    { t: 'ex', en: 'This time tomorrow, I will be traveling to Baghdad.', ar: 'في مثل هذا الوقت غداً سأكون مسافراً إلى بغداد' },
    { t: 'sub', ar: 'النفي', en: 'b. Negative' },
    { t: 'ex', en: 'This time tomorrow I will not be doing this job', ar: 'في مثل هذا الوقت غداً لن أكون أقوم بهذا العمل' },
    { t: 'sub', ar: 'الاستفهام', en: 'c. Question' },
    { t: 'ex', en: 'Will they be studying at this time tomorrow?', ar: 'هل سيكونون يدرسون في مثل هذا الوقت غداً؟' }
  ]}
]}
,

/* ═════════ 5 ═════════ */
{ n: 5, ar: 'أدوات السؤال', en: 'Wh-questions', lessons: [
  { ar: 'أدوات السؤال الأساسية', en: 'Wh-words', body: [
    { t: 'table', head: ['الأداة', 'الاستخدام', 'مثال'], rows: [
      ['What', 'ما / ماذا — للسؤال عن شيء عام أو غير عاقل', 'What is your name? — ما اسمك؟'],
      ['Who', 'مَن — للسؤال عن العاقل (فاعل)', 'Who is this person? — من هذا الشخص؟'],
      ['Whom', 'مَن — للسؤال عن العاقل (مفعول به)', 'Whom did you meet yesterday? — من قابلت البارحة؟'],
      ['Whose', 'لِمَن — للسؤال عن الملكية', 'Whose car is this? — لمن هذه السيارة؟'],
      ['Which', 'أيّ — للاختيار بين أشياء محددة', 'Which color do you prefer? Red or blue?'],
      ['When', 'متى — للسؤال عن الوقت', 'When did he leave? — متى غادر؟'],
      ['Where', 'أين — للسؤال عن المكان', 'Where do you live? — أين تعيش؟'],
      ['Why', 'لماذا — للسؤال عن السبب', 'Why are you always crying? — لماذا تبكي دائماً؟'],
      ['How', 'كيف — للسؤال عن الحال', 'How was your day? — كيف كان يومك؟'] ] },
    { t: 'note', ar: 'كما علمنا في موضوع الأزمنة، الفعل المساعد يسبق الفاعل في حالة السؤال.' }
  ]},
  { ar: 'استخدامات How', en: 'How + word', body: [
    { t: 'p', ar: 'توجد استخدامات أخرى للأداة how حسب الكلمة التي تليها:' },
    { t: 'table', head: ['الأداة', 'الاستخدام', 'مثال'], rows: [
      ['How much', 'للسؤال عن الكمية غير المعدودة أو السعر', 'How much water do you drink? / How much is this book?'],
      ['How many', 'للسؤال عن الكمية المعدودة', 'How many books are on the table?'],
      ['How long', 'للسؤال عن المدة (الوقت)', 'How long will the meeting last?'],
      ['How often', 'للسؤال عن عدد المرات / التكرار', 'How often do you go to the gym?'],
      ['How far', 'للسؤال عن المسافة', 'How far is the school from your house?'],
      ['How old', 'للسؤال عن العمر', 'How old are you?'] ] },
    { t: 'note', ar: 'في الامتحان ممكن يعطيك جملة ويقول لك: اختر أداة السؤال المناسبة.' },
    { t: 'q', q: '___________ is your best friend? — Ahmed.', opts: ['What', 'Who', 'Where', 'Why'], a: 1 },
    { t: 'q', q: '_____ car do you prefer? The red one or the blue one?', opts: ['Which', 'Who', 'Where', 'When'], a: 0 },
    { t: 'q', q: '___________ do you live? — I live in Baghdad.', opts: ['When', 'Where', 'Who', 'Which'], a: 1 },
    { t: 'q', q: '___________ does the movie start? — At 9:00 PM.', opts: ['When', 'What', 'Where', 'Who'], a: 0 }
  ]}
]},

/* ═════════ 6 ═════════ */
{ n: 6, ar: 'If الشرطية', en: 'If Conditionals', lessons: [
  { ar: 'مقدّمة', en: 'Introduction', body: [
    { t: 'p', ar: 'if معناها (إذا). نستخدمها عندما نريد الحديث عن شرط ونتيجة:' },
    { t: 'ex', en: 'If you study hard, you will pass the exam.', ar: 'إذا درست جيداً سوف تنجح' },
    { t: 'p', ar: 'if ممكن أن تأتي في بداية الجملة أو في وسطها:' },
    { t: 'ex', en: 'If it rains, I will stay home', ar: 'إذا أمطرت سأبقى في المنزل' },
    { t: 'ex', en: 'I will stay home if it rains', ar: 'سأبقى في المنزل إذا أمطرت' },
    { t: 'note', ar: 'الجملة التي تحتوي على if تسمى جملة الشرط، والجملة الأخرى تسمى جواب الشرط. في اللغة الإنكليزية لدينا 4 حالات رئيسية، كل واحدة تختلف عن الأخرى بالزمن وبالاستخدام.' }
  ]},
  { ar: 'الحالة الصفرية', en: 'a. Zero Conditional', body: [
    { t: 'p', ar: 'نستخدم الحالة الصفرية للحديث عن الحقائق العامة والعلمية والقوانين. زمن جملة الشرط وجواب الشرط يجب أن يكونا بزمن المضارع البسيط:' },
    { t: 'formula', text: 'If + مضارع بسيط , مضارع بسيط' },
    { t: 'ex', en: 'If you heat ice, it melts', ar: 'إذا سخّنت الثلج، فإنه يذوب' }
  ]},
  { ar: 'الحالة الأولى', en: 'b. First Conditional', body: [
    { t: 'p', ar: 'نستخدمها للحديث عن أشياء ممكن أن تحدث في المستقبل أو يُتوقّع حدوثها. جملة الشرط بزمن المضارع البسيط بينما جواب الشرط بزمن المستقبل البسيط:' },
    { t: 'formula', text: 'If + مضارع بسيط , مستقبل بسيط' },
    { t: 'ex', en: 'If I work harder, I will get what I want', ar: 'إذا عملت بجدّ أكبر سأحصل على ما أريد' },
    { t: 'ex', en: 'He will be fat if he keeps eating junk food', ar: 'سيصبح سميناً إذا استمرّ بأكل الوجبات السريعة' }
  ]},
  { ar: 'الحالة الثانية', en: 'c. Second Conditional', body: [
    { t: 'p', ar: 'تُستخدم للتعبير عن مواقف غير واقعية أو تخيّلية أو شبه مستحيلة في الحاضر أو المستقبل. جملة الشرط تكون في زمن الماضي البسيط بينما جواب الشرط يتكوّن من (would + فعل مجرد).' },
    { t: 'formula', text: 'If + ماضٍ بسيط , would + فعل مجرد' },
    { t: 'note', ar: 'من الممكن استبدال would بـ could أو might، فليس شرطاً would فقط.' },
    { t: 'ex', en: 'She would call him if she knew his number', ar: 'كانت ستتصل به لو عرفت رقمه' },
    { t: 'ex', en: 'If I had a lot of money, I would buy a mansion', ar: 'لو كان عندي مال كثير لاشتريت قصراً' },
    { t: 'note', ar: 'في الحالة الثانية نستخدم الفعل were بدلاً من was مع كل الفواعل سواء كان مفرداً أو جمعاً: If I were you, I would stay here.' }
  ]},
  { ar: 'الحالة الثالثة', en: 'd. Third Conditional', body: [
    { t: 'p', ar: 'تُستخدم للتعبير عن الندم أو تخيّل سيناريو مختلف لشيء حدث بالفعل في الماضي واستحال تغييره الآن. جملة الشرط تكون بزمن الماضي التام بينما جواب الشرط يتكوّن من would have وبعدها فعل بصيغة التصريف الثالث:' },
    { t: 'formula', text: 'If + ماضٍ تام , would have + p.p' },
    { t: 'ex', en: 'If I had studied harder, I would have passed the exam.', ar: 'لو كنت درست بجدّ أكبر لنجحت في الامتحان' },
    { t: 'ex', en: 'I would have helped you if you had asked me.', ar: 'كنت سأساعدك لو طلبت مني' },
    { t: 'note', ar: 'في الامتحان ممكن يعطيك جملة الشرط (التي تحتوي على if) كاملة ويطلب منك اختيار الفعل الصحيح في جواب الشرط، أو العكس.' },
    { t: 'q', q: 'If you heat water to 100°C, it _______.',
      opts: ['will boil', 'boils', 'would boil', 'boiled'], a: 1 },
    { t: 'q', q: 'If it rains tomorrow, we ______ at home.',
      opts: ['stay', 'stayed', 'will stay', 'would stay'], a: 2 },
    { t: 'q', q: 'If I ______ rich, I would travel around the world.',
      opts: ['am', 'were', 'will be', 'had been'], a: 1 },
    { t: 'q', q: 'If she had studied harder, she ______ the exam.',
      opts: ['would pass', 'will pass', 'would have passed', 'passed'], a: 2 }
  ]}
]},

/* ═════════ 7 ═════════ */
{ n: 7, ar: 'الأسئلة الذيلية', en: 'Tag Questions', lessons: [
  { ar: 'القاعدة', en: 'The rule', body: [
    { t: 'p', ar: 'السؤال الذيلي هو سؤال قصير يُضاف إلى نهاية الجملة، ويُستخدم للتأكيد أو طلب الموافقة. بالعربي نقول (أليس كذلك؟):' },
    { t: 'ex', en: 'He is a good person, isn’t he?', ar: 'هو إنسان جيد، أليس كذلك؟' },
    { t: 'p', ar: 'إذا كانت الجملة الأولى مثبتة فيجب أن يكون السؤال الذيلي منفياً، والعكس صحيح:' },
    { t: 'ex', en: 'They are here, aren’t they?', ar: 'هم هنا، أليس كذلك؟' },
    { t: 'ex', en: 'Ali isn’t here, is he?', ar: 'علي ليس هنا، أليس كذلك؟' },
    { t: 'p', ar: 'يمكننا معرفة أن الجملة منفية عند رؤية إحدى الكلمات الآتية:' },
    { t: 'words', items: ['not', 'n’t', 'never', 'seldom', 'rarely'] },
    { t: 'p', ar: 'السؤال الذيلي غالباً ما يتكوّن من نفس الفعل المساعد وضمير الفاعل الموجودين في الجملة الأولى:' },
    { t: 'ex', en: 'He has been here, hasn’t he?', ar: 'هو كان هنا، أليس كذلك؟' },
    { t: 'ex', en: 'Sarah was eating, wasn’t she?', ar: 'سارة كانت تأكل، أليس كذلك؟' },
    { t: 'p', ar: 'في حال كانت الجملة لا تحتوي على فعل مساعد، يتم استخدام:' },
    { t: 'table', head: ['الحالة', 'السؤال الذيلي', 'مثال'], rows: [
      ['الفعل الرئيسي مجرد', 'don’t', 'They love pizza, don’t they?'],
      ['الفعل الرئيسي ينتهي بـ s', 'doesn’t', 'He loves pizza, doesn’t he?'],
      ['الفعل بصيغة الماضي أو ينتهي بـ ed', 'didn’t', 'They loved pizza, didn’t they?'] ] },
    { t: 'note', ar: 'حالتان خاصتان: إذا وجدنا I’m نختار aren’t I ، وإذا وجدنا Let’s نختار shall we.' },
    { t: 'q', q: 'She is a teacher, ______?', opts: ['is she', 'isn’t she', 'doesn’t she', 'wasn’t she'], a: 1 },
    { t: 'q', q: 'I’m late, ______?', opts: ['am I', 'aren’t I', 'isn’t I', 'don’t I'], a: 1 },
    { t: 'q', q: 'They don’t like coffee, ______?', opts: ['do they', 'don’t they', 'are they', 'did they'], a: 0 },
    { t: 'q', q: 'He rarely goes out at night, ______?', opts: ['does he', 'doesn’t he', 'is he', 'did he'], a: 0 },
    { t: 'q', q: 'Ahmed went to Baghdad yesterday, ______?', opts: ['didn’t he', 'did he', 'wasn’t he', 'doesn’t he'], a: 0 },
    { t: 'q', q: 'You haven’t finished your homework, ______?', opts: ['haven’t you', 'did you', 'have you', 'do you'], a: 2 },
    { t: 'q', q: 'She can speak English fluently, ______?', opts: ['can she', 'doesn’t she', 'can’t she', 'isn’t she'], a: 2 },
    { t: 'q', q: 'Let’s go for a walk, ______?', opts: ['shall we', 'will we', 'do we', 'aren’t we'], a: 0 }
  ]}
]},

/* ═════════ 8 ═════════ */
{ n: 8, ar: 'المحددات', en: 'Determiners', lessons: [
  { ar: 'Many / Few', en: 'a. Many / Few', body: [
    { t: 'p', ar: 'نستخدم (many: الكثير) و (few: القليل) مع الأسماء الجمع. ركّز لي: (الجمع). يعني ليس من الممكن استخدامهما مع المفرد أو غير المعدود.' },
    { t: 'ex', en: 'She has a few friends', ar: 'لديها قليل من الأصدقاء' },
    { t: 'ex', en: 'He does not have many books', ar: 'ليس لديه كتب كثيرة' }
  ]},
  { ar: 'Much / Little', en: 'b. Much / Little', body: [
    { t: 'p', ar: 'نستخدم (much: الكثير) و (little: القليل) مع الأسماء غير المعدودة. ركّز لي: (غير المعدودة). يعني ليس من الممكن استخدامهما مع الجمع.' },
    { t: 'ex', en: 'John does not have much money', ar: 'جون ليس لديه مال كثير' },
    { t: 'ex', en: 'There is little to do', ar: 'لا يوجد الكثير لفعله' },
    { t: 'note', ar: 'يعني إذا كانت الكلمة التي بعد الفراغ في الامتحان جمعاً، نستبعد much / little.' },
    { t: 'q', q: 'She is lucky, she has ________ problems.', opts: ['few', 'so many', 'little', 'much'], a: 0 },
    { t: 'q', q: 'This is a boring place, there is __________ to do.', opts: ['little', 'many', 'few', 'any'], a: 0 }
  ]},
  { ar: 'Some / Any', en: 'c. Some / Any', body: [
    { t: 'p', ar: 'نستخدم (some: البعض) مع الجمل المثبتة والعرض والطلب.' },
    { t: 'note', ar: 'جملة الطلب غالباً ما تحتوي على (can I أو could you)، وجملة العرض غالباً ما تحتوي على (would you).' },
    { t: 'ex', en: 'Can I have some juice?', ar: 'هل يمكنني الحصول على بعض العصير؟' },
    { t: 'ex', en: 'He told me some information', ar: 'أخبرني ببعض المعلومات' },
    { t: 'ex', en: 'Would you like some cake?', ar: 'هل تحب بعض الكعك؟' },
    { t: 'p', ar: 'ونستخدم (any: أيّ) مع جمل النفي والاستفهام.' },
    { t: 'ex', en: 'He doesn’t have any problems', ar: 'ليس لديه أي مشاكل' },
    { t: 'ex', en: 'Are there any apples on the table?', ar: 'هل توجد أي تفاحات على الطاولة؟' },
    { t: 'q', q: 'There aren’t _______ buses in the evening.', opts: ['some', 'any', 'a', 'no'], a: 1 },
    { t: 'q', q: 'Can I have _________ tea?', opts: ['some', 'any', 'the', 'no'], a: 0 }
  ]}
]},

/* ═════════ 9 ═════════ */
{ n: 9, ar: 'اعتاد على', en: 'Used to', lessons: [
  { ar: 'Used to', en: 'Used to', body: [
    { t: 'p', ar: 'نستخدم used to للحديث عن شيء اعتدنا على القيام به في الماضي لكننا توقّفنا عن القيام به.' },
    { t: 'ex', en: 'I used to rule the world, now in the morning I sleep alone.', ar: 'كنت أحكم العالم، والآن أنام وحيداً في الصباح' },
    { t: 'p', ar: 'used to يأخذ فعلاً مجرداً خالياً من أي إضافة، وغالباً ما نلاحظ وجود كلمة now:' },
    { t: 'ex', en: 'I used to sleep a lot, but now I don’t.', ar: 'كنت أنام كثيراً، لكن الآن لا' },
    { t: 'note', ar: 'لكن في حال وجدنا فعل كينونة مثل (am , is , are) قبل كلمة used، هنا be used to تأخذ فعلاً ينتهي بـ ing أو اسماً، ومعناها «معتاد على»: I am used to sleeping a lot.' },
    { t: 'q', q: 'Dave _______ in a factory, now he works in a supermarket.',
      opts: ['working', 'works', 'used to work', 'will work'], a: 2 }
  ]}
]}
,

/* ═════════ 10 ═════════ */
{ n: 10, ar: 'المبني للمعلوم والمجهول', en: 'Active and Passive Voice', lessons: [
  { ar: 'القاعدة', en: 'The rule', body: [
    { t: 'p', ar: 'نستخدم جملة المبني للمجهول عندما يكون الفاعل مجهولاً، أو للتركيز على الحدث نفسه بدلاً من التركيز على من قام بهذا الحدث.' },
    { t: 'ex', en: 'Hussain broke the window', ar: 'حسين كسر النافذة' },
    { t: 'ex', en: 'The window was broken', ar: 'النافذة كُسرت' },
    { t: 'p', ar: 'الجملة الأولى مبنية للمعلوم (active voice) لأننا نعرف الشخص الذي كسر النافذة (حسين). أما الجملة الثانية (النافذة كُسرت) فمن كسرها؟ لا نعرف، لأن الجملة مبنية للمجهول (passive voice).' },
    { t: 'p', ar: 'جملة المبني للمجهول تتكوّن من مفعول به، وبعدها فعل كينونة، وبعدها الفعل الرئيسي دائماً بصيغة التصريف الثالث (p.p):' },
    { t: 'formula', text: 'مفعول به + فعل كينونة + p.p' },
    { t: 'ex', en: 'The bird is killed', ar: 'الطائر يُقتل' },
    { t: 'note', ar: 'في الامتحان يعطيك جملة مبنية للمعلوم والمطلوب تحويلها إلى المجهول، أو يعطيك جملة وتختار صيغة الفعل المناسب (p.p)، أو تختار فعل كينونة مناسباً.' }
  ]},
  { ar: 'فعل الكينونة حسب الزمن', en: 'Be-verb by tense', body: [
    { t: 'table', head: ['الزمن', 'فعل الكينونة', 'المعلوم', 'المجهول'], rows: [
      ['المضارع البسيط', 'is / am / are', 'Ahmed eats the burger.', 'The burger is eaten.'],
      ['الماضي البسيط', 'was / were', 'Ali killed the bugs.', 'The bugs were killed.'],
      ['المستقبل البسيط', 'will be', 'Sara will finish the project.', 'The project will be finished.'],
      ['المضارع المستمر', 'is / am / are being', 'They are watching a movie.', 'A movie is being watched.'],
      ['الماضي المستمر', 'was / were being', 'He was reading a book.', 'A book was being read.'],
      ['المضارع التام', 'has / have been', 'We have visited Iraq.', 'Iraq has been visited by us.'],
      ['الماضي التام', 'had been', 'They had completed the work.', 'The work had been completed.'],
      ['المستقبل التام', 'will have been', 'We will have finished the task.', 'The task will have been finished.'] ] },
    { t: 'note', ar: 'عند تحويل الجملة من المعلوم إلى المجهول: أول شيء يتم حذف الفاعل واستبداله بالمفعول به، ثم اختيار فعل كينونة مناسب للزمن وللمفعول به (مفرد / جمع)، ثم إضافة الفعل الرئيسي بعد تحويله إلى تصريف ثالث p.p.' },
    { t: 'q', q: 'Ahmed writes a letter every day. → Change to passive.',
      opts: ['A letter is written by Ahmed every day.', 'A letter was written by Ahmed every day.',
             'A letter is wrote by Ahmed every day.', 'A letter has written by Ahmed every day.'], a: 0 },
    { t: 'q', q: 'They cleaned the room yesterday. → Change to passive.',
      opts: ['The room is cleaned yesterday.', 'The room was cleaned yesterday.',
             'The room were cleaned yesterday.', 'The room cleaned yesterday.'], a: 1 },
    { t: 'q', q: 'They have been ________ a false belief since their childhood.',
      opts: ['teach', 'taught', 'teaching', 'teaches'], a: 1 },
    { t: 'q', q: 'The letter ______ by Ali last week.',
      opts: ['is written', 'was written', 'writes', 'has written'], a: 1 }
  ]}
]},

/* ═════════ 11 ═════════ */
{ n: 11, ar: 'صفات المقارنة والمفاضلة', en: 'Comparatives and Superlatives', lessons: [
  { ar: 'المفاضلة', en: 'a. Superlatives', body: [
    { t: 'p', ar: 'تُستخدم صفات المفاضلة لتفضيل شخص أو شيء على مجموعة معينة. مثل ما نقول بالعربي: ميسي الأفضل في العالم.' },
    { t: 'p', ar: 'بالإنكليزي نكوّن صفة المفاضلة بإضافة "est" لنهاية الصفة إذا كانت الصفة قصيرة (مقطع صوتي واحد):' },
    { t: 'table', head: ['الصفة', 'المفاضلة'], rows: [
      ['nice', 'nicest'], ['cold', 'coldest'], ['happy', 'happiest'] ] },
    { t: 'note', ar: 'في حال انتهاء الصفة بـ y يتم قلبها إلى i ونضيف "est": happy → happiest.' },
    { t: 'p', ar: 'أو بإضافة "most" قبل الصفة إذا كانت الصفة طويلة (مقطعان صوتيان فأكثر):' },
    { t: 'table', head: ['الصفة', 'المفاضلة'], rows: [
      ['beautiful', 'most beautiful'], ['expensive', 'most expensive'] ] },
    { t: 'ex', en: 'This is the nicest car in the world', ar: 'هذه أجمل سيارة في العالم' },
    { t: 'ex', en: 'I saw the most beautiful bird', ar: 'رأيت أجمل طائر' },
    { t: 'note', ar: 'كلمة "the" تُعتبر دليلاً على موضوع المفاضلة، يعني إذا وجدنا هذه الكلمة قبل الفراغ نختار صفة المفاضلة.' },
    { t: 'q', q: 'This is the ___________ movie I have ever seen.',
      opts: ['most exciting', 'more exciting', 'excitingest', 'excitinger'], a: 0 }
  ]},
  { ar: 'المقارنة', en: 'b. Comparatives', body: [
    { t: 'p', ar: 'تُستخدم صفات المقارنة للمقارنة بين شخصين أو مجموعتين. مثل ما نقول بالعربي: ميسي أحسن من رونالدو.' },
    { t: 'p', ar: 'بالإنكليزي نكوّن صفة المقارنة بإضافة "er" لنهاية الصفة إذا كانت الصفة قصيرة (مقطع صوتي واحد):' },
    { t: 'table', head: ['الصفة', 'المقارنة'], rows: [
      ['nice', 'nicer'], ['cold', 'colder'], ['happy', 'happier'] ] },
    { t: 'p', ar: 'أو بإضافة "more" قبل الصفة إذا كانت الصفة طويلة:' },
    { t: 'table', head: ['الصفة', 'المقارنة'], rows: [
      ['beautiful', 'more beautiful'], ['expensive', 'more expensive'] ] },
    { t: 'ex', en: 'This car is nicer than your car', ar: 'هذه السيارة أجمل من سيارتك' },
    { t: 'ex', en: 'I think this bird is more beautiful than yours', ar: 'أعتقد أن هذا الطائر أجمل من طائرك' },
    { t: 'note', ar: 'كلمة "than" تُعتبر دليلاً على موضوع المقارنة، يعني إذا وجدنا هذه الكلمة بعد الفراغ نختار صفة المقارنة.' },
    { t: 'q', q: 'Ahmed is ___________ than his brother.',
      opts: ['tall', 'taller', 'the tallest', 'as tall'], a: 1 }
  ]},
  { ar: 'الصفات الشاذة', en: 'Irregular adjectives', body: [
    { t: 'p', ar: 'صفات شاذة يتغيّر شكلها عند تحويلها إلى مقارنة أو مفاضلة:' },
    { t: 'table', head: ['الصفة', 'المقارنة', 'المفاضلة'], rows: [
      ['good', 'better than', 'the best'],
      ['bad', 'worse than', 'the worst'],
      ['far', 'farther / further than', 'the farthest / the furthest'],
      ['little', 'less than', 'the least'] ] },
    { t: 'q', q: 'Russia is ___________ than Canada.', opts: ['biger', 'bigger', 'biggest', 'the biggest'], a: 1 },
    { t: 'q', q: 'Gold is more expensive ___________ silver.', opts: ['then', 'than', 'as', 'of'], a: 1 },
    { t: 'q', q: 'The cheetah is the ___________ animal in the world.', opts: ['faster', 'fastest', 'more fast', 'fast'], a: 1 },
    { t: 'q', q: 'Of all the students in the class, Sarah is the _______.', opts: ['smart', 'smarter', 'smartest', 'more smart'], a: 2 }
  ]},
  { ar: 'قاعدة التساوي', en: 'c. As … as', body: [
    { t: 'p', ar: 'تُستخدم هذه التركيبة للتعبير عن أن شيئين أو شخصين متساويان تماماً في صفة معينة:' },
    { t: 'ex', en: 'English is as important as mathematics', ar: 'اللغة الإنجليزية مهمة بنفس درجة أهمية الرياضيات' },
    { t: 'note', ar: 'الصفة يجب أن تكون بدون الإضافات الخاصة بالمقارنة والمفاضلة (er أو est أو more أو most)، وموقع الصفة يكون بين كلمتَي as … as.' },
    { t: 'q', q: 'My phone is just as ___________ as yours.',
      opts: ['expensive', 'more expensive', 'expensiver', 'most expensive'], a: 0 },
    { t: 'q', q: 'The apartment is ___________ big ___________ the old house.',
      opts: ['more / than', 'as / than', 'as / as', 'so / than'], a: 2 },
    { t: 'q', q: 'Ali runs as ___________ as a tiger.',
      opts: ['faster', 'fast', 'fastest', 'the fastest'], a: 1 },
    { t: 'q', q: 'Typing on a laptop is not as ___________ as writing by hand.',
      opts: ['easy', 'easier', 'easiest', 'more easy'], a: 0 },
    { t: 'q', q: 'This winter is not as ___________ as last year’s winter.',
      opts: ['colder', 'cold', 'coldest', 'colder than'], a: 1 }
  ]}
]},

/* ═════════ 12 ═════════ */
{ n: 12, ar: 'الكلام المنقول', en: 'Reported Speech', lessons: [
  { ar: 'القاعدة', en: 'The rule', body: [
    { t: 'p', ar: 'يتم استخدام Reported Speech لنقل كلام شخص آخر دون استخدام كلماته الحرفية:' },
    { t: 'ex', en: 'He said "I am tired" → He said that he was tired', ar: 'كلام مباشر ← كلام منقول' },
    { t: 'ex', en: 'They told me "We have been to Mecca" → They told me that they had been to Mecca', ar: 'كلام مباشر ← كلام منقول' },
    { t: 'p', ar: 'في الامتحان مطلوب منك تحويل الجملة من كلام مباشر إلى كلام منقول، والمطلوب أن تختار الجواب الذي يتبع الشروط الآتية:' },
    { t: 'p', ar: 'أولاً: إما "فاعل + said" أو "فاعل + told me" تنزل كما هي حسب الموجود في السؤال.' },
    { t: 'p', ar: 'ثانياً: علامات التنصيص " " يجب أن تُحذف، ويجب إضافة كلمة that بمكان علامة التنصيص الأولى.' },
    { t: 'p', ar: 'ثالثاً: يجب تغيير الضمير الذي كان بعد علامة التنصيص الأولى حسب الجدول الآتي:' },
    { t: 'table', head: ['الكلام المباشر', 'الكلام المنقول', 'مثال'], rows: [
      ['I', 'he / she', 'She said "I am tired" → She said that she was tired.'],
      ['you', 'I / we', 'They told me "You are happy" → They told me that I was happy.'],
      ['we', 'they', 'Ahmed said "We were in Baghdad" → Ahmed said that they had been in Baghdad.'],
      ['your', 'my / our', 'The person told me "I want to see your bag" → The person told me that he wanted to see my bag.'],
      ['my', 'his / her', 'He said "You ate my food" → He said that I had eaten his food.'] ] },
    { t: 'note', ar: 'في حال وجدنا told him بدل told me ورأينا you بعدها، هذا الـ you يتحوّل إلى he. وفي حال وجدنا told her ورأينا you بعدها، يتحوّل إلى she.' },
    { t: 'ex', en: 'They told him "You are happy" → They told him that he was happy', ar: '' },
    { t: 'ex', en: 'They told her "You are happy" → They told her that she was happy', ar: '' },
    { t: 'p', ar: 'رابعاً: يجب عمل شيء اسمه back-shifting، ومعناه أن نرجع زمن الجملة الأصلية إلى زمن أقدم منه:' },
    { t: 'table', head: ['الزمن في الكلام المباشر', 'يتحوّل إلى', 'مثال'], rows: [
      ['المضارع البسيط', 'الماضي البسيط', 'She said "I play tennis" → She said that she played tennis.'],
      ['المضارع المستمر', 'الماضي المستمر', 'He said "I am working" → He said that he was working.'],
      ['الماضي البسيط', 'الماضي التام', 'She said "I played tennis" → She said that she had played tennis.'],
      ['المضارع التام', 'الماضي التام', 'Sara said "I have finished" → Sara said that she had finished.'],
      ['will', 'would', 'He said "I will go" → He said that he would go.'],
      ['can', 'could', 'He said "I can swim" → He said that he could swim.'],
      ['must', 'had to', 'She said "I must leave" → She said that she had to leave.'] ] },
    { t: 'q', q: 'The teacher said, "You must submit your assignments on time." → Change to indirect speech.',
      opts: ['The teacher said that we must submit our assignments on time.',
             'The teacher said that we had to submit our assignments on time.',
             'The teacher says that we have to submit our assignments on time.',
             'The teacher says. You must submit your assignments on time.'], a: 1 },
    { t: 'q', q: 'Ali said, "I am very tired." → Change to indirect speech.',
      opts: ['Ali said that I am very tired.', 'Ali said that he was very tired.',
             'Ali says that he was very tired.', 'Ali said that he is very tired.'], a: 1 },
    { t: 'q', q: 'Sara said, "I have finished my work." → Change to indirect speech.',
      opts: ['Sara said that she had finished her work.', 'Sara said that she has finished my work.',
             'Sara says that she had finished her work.', 'Sara said that I had finished my work.'], a: 0 },
    { t: 'q', q: 'Ali told me, "I am very tired." → Change to indirect speech.',
      opts: ['Ali told me that he was very tired.', 'Ali told me that I am very tired.',
             'Ali told that he was very tired.', 'Ali told me that I had been very tired.'], a: 0 }
  ]}
]},

/* ═════════ 13 ═════════ */
{ n: 13, ar: 'So · Very · Too', en: 'So, Very and Too', lessons: [
  { ar: 'الفرق بينها', en: 'The difference', body: [
    { t: 'p', ar: 'الكلمات so و very و too معناها «جداً»، لكن لكل منها استخدام مختلف:' },
    { t: 'sub', ar: 'Very', en: 'a. Very' },
    { t: 'p', ar: 'تُستخدم لتقوية الصفة أو الظرف بشكل بسيط ومحايد بدون معنى إضافي، وتدلّ على كمية كبيرة لكنها مقبولة.' },
    { t: 'ex', en: 'The room was very small', ar: 'الغرفة كانت صغيرة جداً' },
    { t: 'sub', ar: 'So', en: 'b. So' },
    { t: 'p', ar: 'أقوى قليلاً من very وتحمل طابعاً تعبيرياً أو عاطفياً (دهشة، فرح، إعجاب)، وغالباً ما ترتبط بقاعدة السبب والنتيجة باستخدام so … that.' },
    { t: 'ex', en: 'The weather is so hot that I can’t go outside', ar: 'الطقس حار جداً لدرجة أنني لا أستطيع الخروج' },
    { t: 'sub', ar: 'Too', en: 'c. Too' },
    { t: 'p', ar: 'تدلّ على الإفراط وزيادة الشيء عن الحد المطلوب بشكل سلبي أو مزعج، وتدلّ على عدم الرضا أو استحالة فعل الشيء. وغالباً تأتي معها to في نفس الجملة.' },
    { t: 'ex', en: 'This car is too expensive to buy', ar: 'هذه السيارة غالية جداً بحيث لا يمكن شراؤها' },
    { t: 'q', q: 'The cake tasted ________ good that I couldn’t finish it.',
      opts: ['so', 'too', 'very', 'such'], a: 0 },
    { t: 'q', q: 'I can’t walk, the weather is _____ hot.',
      opts: ['so', 'too', 'very', 'such'], a: 1 },
    { t: 'q', q: 'The water is ________ cold for the children to swim in.',
      opts: ['so', 'very', 'too', 'such'], a: 2 }
  ]}
]}

]};
