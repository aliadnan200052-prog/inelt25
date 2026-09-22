# -*- coding: utf-8 -*-
from kit import *

WH_TABLE = table(
    [('الرقم','ar'),('الأداة','ar'),('الاستخدام','ar'),('مثال','ar')],
    [[('1','num'),('What:','key'),('ما / ماذا: للسؤال عن شي عام أو غير عاقل','ar'),
      ('<ar>ماهو اسمك؟</ar><en><b>What</b> is your name?</en>','arc')],
     [('2','num'),('Who:','key'),('من: للسؤال عن العاقل','ar'),
      ('<ar>من هذا الشخص؟</ar><en><b>Who</b> is this person?</en>','arc')],
     [('3','num'),('Whom:','key'),('من: للسؤال عن العاقل لمفعول به','ar'),
      ('<en><b>Whom</b> did you meet yesterday?</en>','arc')],
     [('4','num'),('Whose:','key'),('لمن: للسؤال عن الملكية','ar'),
      ('<ar>لمن هذه السيارة؟</ar><en><b>Whose</b> car is this?</en>','arc')],
     [('5','num'),('Which:','key'),('أي: للاختيار بين أشياء محددة','ar'),
      ('<ar>أي لون تفضل؟ الأحمر أو الأزرق؟</ar><en><b>Which</b> color do you prefer? red or blue?</en>','arc')],
     [('6','num'),('When:','key'),('متى: للسؤال عن الوقت','ar'),
      ('<ar>متى غادر؟</ar><en><b>When</b> did he leave?</en>','arc')],
     [('7','num'),('Where:','key'),('أين: للسؤال عن المكان','ar'),
      ('<ar>أين تعيش؟</ar><en><b>Where</b> do you live?</en>','arc')],
     [('8','num'),('Why:','key'),('لماذا: للسؤال عن السبب','ar'),
      ('<ar>لماذا دائما تبكي؟</ar><en><b>Why</b> are always crying?</en>','arc')],
     [('9','num'),('How:','key'),('كيف: للسؤال عن الحال','ar'),
      ('<ar>كيف كان يومك؟</ar><en><b>How</b> was your day?</en>','arc')]],
    caption_ar='أدوات الاستفهام (السؤال)', caption_en='Wh-questions',
    widths=['9mm','20mm','36%','auto'])

HOW_TABLE = table(
    [('الرقم','ar'),('الأداة','ar'),('الاستخدام','ar'),('مثال','ar')],
    [[('1','num'),('How much','key'),('للسؤال عن الكمية غير المعدودة أو السعر','ar'),
      ('<en><b>How much</b> water do you drink ?</en><en><b>How much</b> is this book?</en>','arc')],
     [('2','num'),('How many','key'),('للسؤال عن الكمية المعدودة','ar'),
      ('<en><b>How many</b> books are on the table?</en>','arc')],
     [('3','num'),('How long','key'),('للسؤال عن المدة (الوقت)','ar'),
      ('<en><b>How long</b> will the meeting last?</en>','arc')],
     [('4','num'),('How often','key'),('للسؤال عن عدد المرات/التكرار','ar'),
      ('<en><b>How often</b> do you go to the gym?</en>','arc')],
     [('5','num'),('How far','key'),('للسؤال عن المسافة','ar'),
      ('<en><b>How far</b> is the school from your house?</en>','arc')],
     [('6','num'),('How old','key'),('للسؤال عن العمر','ar'),
      ('<en><b>How old</b> are you?</en>','arc')]],
    caption_ar='أدوات الاستفهام (السؤال)', caption_en='How + word', tight=True,
    widths=['9mm','24mm','36%','auto'])

PART_WH = [
    ar('توجد استخدامات اخرى للاداة how حسب الكلمة التي تليها:'),
    WH_TABLE,
    note('كما علمنا في موضوع الازمنة,', 'الفعل المساعد يسبق الفاعل في حالة السؤال.'),
    group(ar('توجد استخدامات اخرى للاداة <b>how</b> حسب الكلمة التي تليها:'), HOW_TABLE),
    note('بالامتحان ممكن يعطيك جملة و يقلك اختار اداة السؤال المناسبة:'),
    qbar(),
    q('___________ is your best friend? - Ahmed.',
      ['a) What', 'b) Who', 'c) Where', 'd) Why'], 1),
    q('___________ do you live? - I live in Baghdad.',
      ['a) When', 'b) Where', 'c) Who', 'd) Which'], 1),
    group(q('_____car do you prefer? The red one <b>or</b> the blue one?',
            ['a) Which', 'b) Who', 'c) Where', 'd) When'], 0),
          note('غالبا <b>which</b> يجي للتخيير بين شيئين')),
]

PART_IF = [
    ar('<b>if</b> معناها ( <b>اذا</b> ). نستخدمها عندما نريد الحديث عن شرط ونتيجة يعني :'),
    ex(('<b>If</b> you study hard, you will pass the exam.', '<b>اذا</b> درست جيدًا ,سوف تنجح')),
    ar('<b>If</b> ممكن ان تاتي ببداية او بوسط الجملة :'),
    ex(('I<b>f</b> it rains, I will stay home', '<b>اذا</b> تمطر, سابقى في المنزل'),
       ('I will stay home <b>if</b> it rains', 'سابقى في المنزل <b>اذا</b> تمطر')),
    ar('الجملة التي تحتوي على <b>if</b> تسمى جملة الشرط و الجملة الاخرى تسمى جواب الشرط.'),
    ar('باللغة الانكليزية لدينا <b>4</b> انواع او حالات رئيسية من <b>if</b>  الشرطية كل واحدة تختلف عن الاخرى '
       'بالزمن سواء ماضي , مضارع او مستقبل , وايضا تختلف في الاستخدام:'),

    h3('a. Zero Conditional', 'حالة الصفر'),
    ar('نستخدم حالة الصفر للحديث عن حقائق عامة و العلمية والقوانين.'),
    ar('زمن جملة الشرط و جواب الشرط يجب ان يكونا بزمن <b>المضارع البسيط:</b>'),
    formula('مضارع بسيط , مضارع بسيط + If'),
    ex(('<b>If</b> you heat ice, it melts',)),

    h3('b. First Conditional', 'حالة الاولى'),
    ar('نستخدم حالة الاولى للحديث عن اشياء ممكن تحدث بالمستقبل او يتوقع حدوثها بالمستقبل.'),
    ar('جملة الشرط تكون بزمن المضارع البسيط بينما جواب الشرط بزمن المستقبل البسيط'),
    formula('مستقبل بسيط  , مضارع بسيط + If'),
    ex(('<b>If I work</b> harder, I will get what I want',),
       ('He <b>will be</b> fat, <b>if he still eats</b> junk food',)),

    h3('c. Second Conditional', 'حالة الثانية'),
    ar('الحالة الشرطية الثانية تُستخدم للتعبير عن مواقف غير واقعية، تخيلية، أو شبه مستحيلة في الحاضر أو المستقبل.'),
    ar('جملة الشرط تكون في زمن الماضي البسيط بينما تتكون جملة جواب الشرط من <b>(فعل مجرد + would).</b>'),
    ar('ايضا من الممكن استبدال <b>would</b> ب <b>could</b> او <b>might ,</b> يعني ليس شرطًا فقط <b>would</b>'),
    formula('فعل مجرد  +  would  ,ماضي بسيط  +  If'),
    ex(('She <b>would call</b> him<b>, if she knew</b> his number',),
       ('<b>If</b> I <b>had</b> a lot of money, I <b>would buy</b> a mansion',)),
    note('في الحالة الثانية ب if الشرطية نستخدم الفعل <b>were</b> بدلا من <b>was</b> مع كل الفواعل سواء كان مفرد او جمع'),
    ex(('If  I <b>were</b> you ,I would stay  here',)),

    h3('d. Third Conditional', 'حالة الثالثة'),
    ar('يتم استخدام الحالة الثالثة للتعبير عن الندم أو تخيل سيناريو مختلف لشيء حدث بالفعل في الماضي '
       'واستحال تغييره الآن.'),
    ar('بالحالة الثالثة , جملة الشرط تكون بزمن الماضي التام بينما جواب الشرط يتكون من <b>would have</b> '
       'وبعد ال <b>have</b> يأتي فعل بصيغة التصريف الثالث:'),
    formula('would have  +  p.p  ,  ماضي تام + If'),
    ex(('<b>If I had studied</b> harder, I <b>would have passed</b> the exam.',),
       ('I <b>would have helped</b> you <b>if</b> you <b>had asked me</b>.',)),
    note('بعد ان علمنا ان هذا الموضوع يتكون من جملتين, جملة الشرط وجملة جواب الشرط وكل جملة تتغير زمنها حسب الحالة:',
         'بالامتحان ممكن يعطيك جملة الشرط (التي تحتوي على If)  كاملة، ويطلب منك اختيار  الفعل الصحيح في  جملة جواب الشرط,',
         'او العكس ممكن يعطيك جملة جواب الشرط ) كاملة، ويطلب منك اختيار الفعل الصحيح في جملة الشرط.'),

    qbar(),
    qcols(
        q('If you heat water to 100°C, it_______',
          ['A) will boil', 'B) boils', 'C) would boil', 'D) boiled'], 1),
        q('If I ______ rich, I would travel around the world',
          ['A) am', 'B) were', 'C) will be', 'D) had been'], 1)),
    qcols(
        q('If it rains tomorrow, we ______ at home',
          ['A) stay', 'B) stayed', 'C) will stay', 'D) would stay'], 2),
        q('If she had studied harder, she ______ the exam.',
          ['A) would pass', 'B) will pass', 'C) would have passed', 'D) passed'], 2)),
]

PART_TAG = [
    ar('السؤال الذيلي هو سؤال قصير يضاف الى نهاية الجملة ويستخدم للتاكيد او طلب الموافقة '
       'بالعربي نقول <b>(اليس كذلك ؟):</b>'),
    ex(('He is a good person<b>, isn’t he?</b>', 'هو انسان جيد<b>, اليس كذلك؟</b>')),
    ar('اذا كانت الجملة الاولى <b>مثبته</b> فلازم السؤال الذيلي يكون <b>نفي,</b> والعكس صحيح في حال كانت '
       'الجملة الاولى <b>منفية</b>, السؤال الذيلي يجب ان يكون <b>مثبت</b>:'),
    ex(('<b>They are</b> here<b>, aren’t they?</b>',),
       ('<b>Ali isn’t</b> here<b>, is he?</b>',)),
    ar('يممكنا معرفة ان الجملة تكون منفية عند رؤية احدى الاتي:'),
    bank('( not , n’t  , never  seldom , rarely)'),
    ar('السؤال الذيلي  <b>غالبًا</b> ما يتكون من نفس الفعل مساعد و ضمير الفاعل الموجودين بالجملة الاولى:'),
    ex(('<b>He has</b> been here,<b>has</b>n’t <b>he</b>?',),
       ('<b>Sarah was</b> eating, <b>wasn’t she</b>?',)),
    ar('في حال كانت الجملة لا تحتوي على فعل مساعد, يتم استخدام:'),
    ar('في حال كان الفعل الرئيسي مجرد <b>:</b> 1.<b>don’t</b>'),
    ex(('they <b>love</b> pizza, <b>don’t</b> they?',)),
    ar('في حال كان الفعل الرئيسي ينتهي ب 2.<b>doesn’t : s</b>'),
    ex(('he <b>loves</b> pizza, <b>does’nt</b> he?',)),
    ar('في حال كان الفعل الرئيسي بصيغة الماضي او ينتهي ب 3.<b>didn’t : ed</b>'),
    ex(('they <b>loved</b> pizza’ <b>didn’t</b> they?',)),

    qbar(),
    qcols(
        q('She is a teacher, ______?',
          ['A) is she', 'B) isn’t she', 'C) doesn’t she', 'D) wasn’t she'], 1),
        q('<b>I’m</b> late, ______?',
          ['A) am I', 'B) aren’t I', 'C) isn’t I', 'D) don’t I'], 1)),
    note('اذا لقينا I’m, نختار aren’t I'),
    qcols(
        q('They don’t like coffee, ______?',
          ['A) do they', 'B) don’t they', 'C) are they', 'D) did they'], 0),
        q('He <b>rarely</b> goes out at night, ______?',
          ['A) does he', 'B) doesn’t he', 'C) is he', 'D) did he'], 0)),
    qcols(
        q('Ahmed went to Baghdad yesterday, ______?',
          ['A) didn’t he', 'B) did he', 'C) wasn’t he', 'D) doesn’t he'], 0),
        q('You haven’t finished your homework, ______?',
          ['A) haven’t you', 'B) did you', 'C) have you', 'D) do you]'], 2)),
    qcols(
        q('She can speak English fluently, ______?',
          ['A) can she', 'B) doesn’t she', 'C) can’t she', 'D) isn’t she'], 2),
        q('<b>Let’s</b> go for a walk, ______?',
          ['A) shall we', 'B) will we', 'C) do we', 'D) aren’t we'], 0)),
    note('اذا لقينا <b>let’s</b> نختار  <b>Shall we</b>'),
]

PART_DET = [
    h3('a. Many / Few', ''),
    ar('نستخدم  ( <b>الكثير</b> : <b>many )</b> و <b>(</b> القليل : <b>few )</b> مع الاسماء الجمع. '
       'ركزلي ( <b>الجمع</b> ) . يعني ليس من الممكن استخدامهم مع المفرد او الغير معدود.'),
    ex(('She has a <b>few friends</b>',),
       ('He does not have <b>many books</b>',)),

    h3('b. Much / Little', ''),
    ar('نستخدم  ( <b>الكثير</b> : <b>much )</b> و <b>(</b> القليل : <b>Little)</b> مع الاسماء '
       '<b>غير المعدودة</b>. ركزلي ( <b>غير المعدودة</b>). يعني ليس من الممكن استخدامهم مع الجمع.'),
    ex(('John does not have <b>much</b> money',),
       ('There <b>is</b> a little to do',)),
    note('يعني اذا كانت الكلمة الي بعد الفراغ بالامتحان جمع نقوم باستبعاد <b>much / little</b>'),

    qbar(),
    qcols(
        q('She is lucky, she has ________ problems',
          ['A) few', 'B) so many', 'C) little', 'D) much'], 0),
        q('This is a boring place, there is __________ to do',
          ['A) little', 'B) many', 'C) few', 'D) any'], 0)),

    h3('c. Some / Any', ''),
    ar('نستخدم  ( <b>البعض</b>: <b>some)</b> مع الجمل المثبتة والعرض والطلب.'),
    ar('جملة <b>الطلب</b> غالبا ما تحتوي على <b>( can I او could you )</b>'),
    ar('جملة <b>العرض</b> غالبا ما تحتوي على <b>( would you )</b>'),
    ex(('<b>Can I</b> have <b>some</b> juice ?',),
       ('He told me <b>some</b> information',),
       ('<b>Would you</b> like <b>some</b> cake?',)),
    ar('و نستخدم   ( <b>أي</b>: <b>any)</b> مع الجمل النفي والاستفهام.'),
    ex(('He <b>doesn’t</b> have <b>any</b> problems',),
       ('<b>Are</b> there <b>any</b> apples on the table<b>?</b>',)),

    qbar(),
    qcols(
        q('There <b>aren’t</b> _______buses in the evening',
          ['A) some', 'B) any', 'C) a', 'D) no'], 1),
        q('Can I have_________ tea ?',
          ['A) some', 'B) any', 'C) the', 'D) no'], 0)),
]

PART_USEDTO = [
    ar('نستخدم <b>used to</b> للحديث عن شيء  اعتدنا على القيام به في الماضي لكننا توقفنا عن القيام به.'),
    ex(('I <b>used to</b> rule the world, <b>now</b> in the morning I sleep alone.',)),
    ar('<b>used to</b>  ياخذ فعل مجرد خالي من اي اضافة و غالبًا ما نلاحظ وجود كلمة <b>now</b> :'),
    ex(('I <b>used to sleep</b> a lot, but <b>now</b> I don’t.',)),
    note('لكن  في حال لقينا فعل كينونة مثل <b>( am , is , are )</b> قبل كلمة <b>used,</b> '
         'هنا <b>Used to</b> تاخذ فعل ينتهي <b>ing</b> او <b>اسم:</b>'),
    ex(('I <b>am used to sleeping</b> a lot.',)),

    qbar(),
    q('Dave_______ in a factory, now he works in a super market',
      ['A) working', 'B) works', 'C)Used to work', 'D) will work'], 2),
]
