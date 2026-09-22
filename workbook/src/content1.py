# -*- coding: utf-8 -*-
from kit import *

PRON_TABLE = table(
    [('ضمائر الفاعل','ar'),('ضمائر م. به','ar'),('ضمائر التملك','ar'),('الضمائر الانعكاسية','ar')],
    [[('I','key'),('me','en'),('my','en'),('myself','en')],
     [('he','key'),('him','en'),('his','en'),('himself','en')],
     [('she','key'),('her','en'),('her','en'),('herself','en')],
     [('it','key'),('it','en'),('its','en'),('itself','en')],
     [('you','key'),('you','en'),('your','en'),('yourself / yourselves','en')],
     [('we','key'),('us','en'),('our','en'),('ourselves','en')],
     [('they','key'),('them','en'),('their','en'),('themselves','en')]])

PART1 = [
    h2('1', 'nouns', 'الاسماء'),
    ar('الاسماء: هي كلمات نستخدمها للاشارة الى اشخاص او اماكن او افكار..الخ..وينقسم الى انواع :'),

    h3('a. Proper nouns', 'اسماء العلم'),
    ar('اسماء العلم هي اسماء اشخاص او بلدان وتبدي بحرف كبير:'),
    bank('(Ali/Hussain/John/Baghdad/London)'),

    h3('b. Common nouns', 'اسماء الشائعة'),
    ar('اسماء الشائعة هي الاسماء تشير الى الاشياء العامة :'),
    bank('(boy/girl/school/stone)'),

    h3('c. Countable nouns', 'اسماء المعدودة'),
    ar('اسماء المعدودة هي الاسماء يمكن عدها و ممكن ان تاتي جمع  او مفرد- يعني يعني اشياء '
       'نكدر نحسبها مثلا سيارة سيارتين تفاحه تفاحتين كتاب كتابين :'),
    bank('(book/student/apple/car)'),
    note('*نعرف الاسم جمع من خلال  حرف  ال <b>(S)</b> نهاية الاسم. '
         '( هنالك ايضا جمع شاذ لا ياخذ  <b>S</b>) سيتم التطرق لهم بالفقرات القادمة:'),
    bank('(Book : books / Apple : apple)'),

    h3('d. Non-countable nouns', 'اسماء الغير المعدودة'),
    ar('اسماء الغير  المعدودة هي الاسماء التي  لا  يمكن عدها - يعني اشياء ما نكدر نحسبها :'),
    bank('(water . money , sugar , salt , air , meat etc. )'),

    h2('2', 'pronouns', 'الضمائر'),
    ar('الضمائر: الضمائر هي  كلمات تحل محل الاسماء للاختصار او اجتناب التكرار يعني مثلا بدل ان اقول '
       'احمد ذهب الى السوق اقول هو ذهب الى السوق. انواع الضمائر:'),
    PRON_TABLE,

    h3('a. Subject pronouns', 'ضمائر الفاعل'),
    ar('ضمائر الفاعل هي الضمائر التي تحل محل الفاعل ( الفاعل هو الشخص او الشيء الذي يقوم بالفعل'),
    bank('(he, she, it, I, you, we ,they)'),
    ex(('<b>You</b> are kind', '<b>انت</b> طيب'),
       ('<b>I</b> am a teacher', '<b>انا</b> معلم')),
    note('ضمير الفاعل غالباً ياتي بداية الجملة.'),

    h3('b. Object pronouns', 'ضمائر الفاعل'),
    ar('ضمائر المفعول به  تحل محل الاسم المفعول به (المفعول به هو الشخص او الشي الذي وقعه عليه '
       'الحدث او الفعل) يعني بدله من ان نقوله علي اطعم الكلب نقول علي اطعمه:'),
    bank('(Me, you, him,  her, It,  us, them)'),
    ex(('He saw <b>me</b>', 'هو رأ<b>ني</b>'),
       ('I know <b>him</b>', 'انا اعرف<b>ه</b>')),
    note('ضمير المفعول به  غالباً ياتي ثالث كلمة او بالوسط .'),

    h3('c. Possessive pronouns', 'ضمائر التملك'),
    ar('ضمائر التملك هي ضمائر نستخدمها للاشارة الى انه فلان شيء ملك لفلان شخص '
       '(هذه سيارت<b>ها</b>) (هذه سيارت<b>ي</b>)'),
    bank('(My / his / her / their / its / our / your)'),
    note('ضمائر التملك دائما يجي بعدهم اسم الشي الي نملكه'),
    ex(('This is <b>my</b> car', 'هذه سيارت<b>ي</b>'),
       ('I saw <b>his</b> house', 'رأيت منزل<b>ه</b>')),

    h3('d. Reflexive pronouns', 'ضمائر الانعكاسية'),
    ar('هي ضمائر تستخدم عندما يكون الفاعل والمفعول به نفس الشي او الشخص(الفعل الي يقوم بيه الفاعل '
       'ينعكس عليه يعني من اكول: انا جرحت <b>نفسي</b> .يعني الشخص هو نفسة الفاعل وهو نفسة المفعول به)'),
    bank('( yourself / myself / himself / herself / itself / themselves / ourselves / yourselves)'),

    h2('3', 'Verb', 'الافعال'),
    ar('<b>الفعل</b> هو الحدث او الشي الذي يقوم به الفاعل .مثلا ( هو <b>يلعب</b> الكرة) <b>يلعب</b> هنا فعل'),
    bank('(Go / play / see / look / listen / kill etc.)'),
    ex(('He <b>plays</b> football', 'هو <b>يلعب</b> كرة القدم')),

    h2('4', 'Adjective', 'الصفات'),
    ar('الصفات هي الكلمات التي نستخدمها لوصف الاشخاص او الاشياء او الاماكن '
       '(هذا الشخص <b>جميل</b> ) <b>جميل</b> هنا صفة.'),
    bank('(Beautiful / nice / strong/ fat / slim / happy / sad / big / small etc.)'),
    ex(('He is so <b>strong</b>', 'هو قوي <b>جداً</b>'),
       ('He seems <b>sad</b>', 'هو يبدو <b>حزيناً</b>')),

    h2('5', 'Adverb', 'الظروف'),
    ar('<b>الظروف</b> ينقسم الى عدة انواع:'),

    h3('a. Adverb of time', 'ظروف الزمان'),
    ar('كل كلمة تدل على وقت معين ( اليوم/ غدا/ البارحة)'),
    bank('(  today / tomorrow / tonight / yesterday / 2020/ November )'),
    ex(('I saw him <b>yesterday</b>', 'لقد رايته البارحة'),
       ('She will be there <b>tomorrow</b>', 'هي ستكون هنا غدا')),

    h3('b. Adverb of place', 'ظروف المكان'),
    ar('كلمة تدل على مكان معين( هنا / هناك / الجامعة/ المنزل / بغداد الخ...)'),
    bank('(here/ there/ university / home / Baghdad / etc.)'),
    ex(('He is at the university', 'هو في الجامعة')),

    h3('c. Adverb of manner', 'ظروف الحال'),
    ar('<b>ظروف الحال</b> هي الظروف التي تصف الافعال او الكيفية التي تم به الفعل. '
       '( هو ركظ <b>بسرعة</b>) فهنا نحن وصفنا الفعل ( الركظ ) . كيف ركظ؟ ركظ بسرعة. (بسرعة) هنا ظرف حال.'),
    note('ظروف الحال باللغة الانكليزية تنتهي ب ( <b>ly</b> )'),
    ex(('She sings <b>beautifully</b>', 'هي غنت <b>بشكل جميل</b>'),
       ('He run <b>quickly</b>', 'هو ركظ <b>بسرعة</b>')),
    ar('ظروف شاذة  بدون (ly):'),
    bank('(fast/hard/well)'),
    ex(('It went too <b>fast</b>', 'جرى <b>بسرعة</b> كبيرة'),
       ('He tried <b>hard</b>', 'هو حاول <b>بجد</b>')),

    qbar(),
    q('He__________to find a job, but he had no luck',
      ['A) tried hard', 'B) hard tried', 'c)hardly tried', 'd)tried hardly'], 0),

    h2('6', 'preposition', 'حروف الجر'),
    bank('(In / on / at / to / from /with / by /for / about / of / etc.)'),

    h3('a. In', 'في'),
    ar('نستخدم <b>(In)</b>  مع السنوات او الاشهر او القرون او الاماكن :'),
    ex(('She was born <b>in</b> 2002', 'ولدت <b>في</b> سنة 2002'),
       ('She was born <b>in</b> January', 'هي ولدت <b>في</b> كانون الثاني'),
       ('He was <b>in</b> the university', 'هو كان <b>في</b> الجامعة')),

    h3('b. on', 'على'),
    ar('تُستخدم مع ايام الاسبوع و مواعيد والاماكن المحددة'),
    ex(('She was born <b>on</b> Monday',),
       ('The meeting is <b>on</b> July 4th',),
       ('The book is <b>on</b> the table',)),

    h3('c. At', 'عند'),
    ar('نستخدم  “<b>at</b>” مع الساعات او اوقات محددة من اليوم والاماكن المحددة'),
    ex(('The meeting is <b>at</b> 5 pm', 'الحفلة <b>عند</b> الساعة الخامسة مسائاً'),
       ('He is <b>at</b> the door', 'هي <b>عند</b> الباب')),

    h3('d. to', 'الى'),
    ar('يعبر عن الذهاب الى مكان معين'),
    ex(('I went <b>to</b> Baghdad', 'انا ذهبت <b>الى</b> بغداد')),

    h3('e. From', 'من'),
    ar('يعبر على القدوم من مكان معين'),
    ex(('He came <b>from</b> London', 'هو جاء <b>من</b> لندن')),

    h3('f. With', 'مع'),
    ar('تستخدم للرفقة ( شخص مع شخص او شيء مع شيء الخ...)'),
    ex(('I saw him <b>with</b> my brother', 'انا رايته <b>مع</b> اخي')),

    h3('g. By', 'بواسطة'),
    ar('تستخدم للاشارة الى الوسيلة التي نستخدمها للقيام بشيء'),
    ex(('She usually goes to work <b>by bus</b>', 'هي عادتاً تذهب الى العمل <b>ب</b>الحافلة'),
       ('He went to school <b>by</b> feet', 'هو ذهب الى المدرسة مشياً على الاقدام')),

    h3('h. For', 'لأجل'),
    ar('تستخدم عندما تقوم بشيء من اجل شخص او شيء'),
    ex(('Can you fix the car <b>for</b> me?', 'هل يمكننك اصلاح السيارة لاجلي'),
       ('I did all that <b>for</b> you', 'اناا قمت بكل هذا من اجلك')),

    h3('i. About', 'حول أو عن'),
    ex(('He talks <b>about</b> me', 'هو يتكلم <b>عن</b>ي')),

    qbar(),
    q('I was born _____1993', ['A) on', 'b) in', 'c)at', 'd)to'], 1),
    q('most of alumina arrived ________ buses', ['A) with', 'B) By', 'C)From', 'D) In'], 1),

    h2('7', 'Conjunction', 'ادوات الربط'),
    bank('(and / or / because / but)'),
    h3('a. And', 'و'),
    ex(('I like chicken <b>and</b> rice', 'انا احب الدجاج <b>و</b> الرز')),
    h3('b. Or', 'او'),
    ex(('Do you like banana <b>or</b> apple?', 'هل تحب الموز <b>او</b> التفاح؟')),
    h3('c. But', 'لكن'),
    ex(('I don’t know him personally <b>but</b> he seems a good person',
        'ما اعرفة شخصيا <b>لكن</b> يبين شخص جيد')),
    h3('d. Because', 'بسبب'),
    ar('يعبر عن الذهاب الى مكان معين'),
    ex(('I hate him <b>because</b> he is not polite', 'اكره <b>لأنه</b> ليس مؤدب')),

    h2('8', 'Interjunction', 'ادوات التعجب او الانفعال'),
    bank('(wow! / oh! / ouch! / hey! / hurray! Etc. )'),
    note('<b>اجزاء الكلام</b> ممكن ياتي بالامتحان عن طريق اعطائك جملة ويحددلك كلمة يسألك ما نوع هذه الكلمة',
         ', هل هي فعل , اسم   , ضمير وهكذا...'),

    qbar(),
    q('In the sentence "This is my pen," what is "my"?',
      ['a) pronoun', 'b) Noun', 'c) verb', 'd) adverb'], 0),
]

PART2 = [
    h2('1', 'a/an', 'أدوات التنكير'),
    ar('نستخدمهن فقط مع الاسماء المفردة النكرة .'),
    ar('نستخدم (<b>a</b>)  عندما تبدأ الكلمة بحرف او صوت صحيح - ( كل الاحرف ما عدا الاحرف العلة الخمسة) .'),
    ar('نستخدم (<b>an</b>)  عندما تبدا الكلمة بحرف او علة  .'),
    bank('احرف العلة الخمسة : ( a / i / u / o / e )', rtl=True),
    ex(('Ahmed bought <b>a c</b>ar',),
       ('Ali ate <b>an a</b>pple',)),

    h2('2', 'the', 'ال -التعريف'),
    ar('نستخدم (the) للحديث عن شي معروف لدى المتكلم و المستمع, أي تم الحديث عن هذا الشي مسبقا.'),
    ar('مع جميع الاسماء الاسماء سواء كان جمع او مفرد او غير معدود.'),
    ar('يتم استخدامها ايضا مع القمر و الشمس و اسماء البحار والانهار و المحيطات.'),
    ex(('<b>The</b> car that Ahmed bought was nice',),
       ('Look at <b>the sun</b>', 'انظر <b>للشمس</b>'),
       ('<b>The Nile</b> is a river in Egypt', '<b>النيل</b> نهر في مصر')),
]

IRREG_PLURAL = table(
    [('Singular','en'),('Plural','en'),('Singular','en'),('Plural','en')],
    [[('man','key'),('men','en'),('knife','key'),('knives','en')],
     [('woman','key'),('women','en'),('tomato','key'),('tomatoes','en')],
     [('child','key'),('children','en'),('foot','key'),('feet','en')],
     [('tooth','key'),('teeth','en'),('fireman','key'),('firemen','en')],
     [('mouse','key'),('mice','en'),('',''),('','')],
     [('ox','key'),('oxen','en'),('',''),('','')],
     [('leaf','key'),('leaves','en'),('',''),('','')]],
    caption_en='Irregular Plural Nouns', tight=True)

PART3 = [
    h2('1', 'Regular Plural', 'ألجمع القياسي'),
    ar('تحويل الاسم من جمع الى مفرد يتم باضافة <b>s</b> او <b>es</b> للاسماء القياسية الغير الشاذة .'),
    bank('(books / pens / rooms / solders etc.)'),

    h2('2', 'Irregular Plural', 'ألجمع الشاذ'),
    ar('الجمع الشاذ هو الجمع الذي يتم بدون اضافة s الجمع انما يتم عن طريق تغير بعض احرف الاسم :'),
    IRREG_PLURAL,
    note('الضمائر المفردة هي : (he , she , it )',
         'بينما ضمائر الجمع : (we , they, you)'),
    note('صح الضمير <b>(you)</b> من ناحية المعنى يعتبر مفرد,,',
         'لكن من ناحية القواعد يعامل معاملة الجمع.'),
]
