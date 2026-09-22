# -*- coding: utf-8 -*-
from kit import *

BE_TABLE = table(
    [('الزمن','ar'),('شكل فعل الكينونة','ar'),('مثال (المعلوم)','ar'),('مثال (المجهول)','ar')],
    [[('المضارع البسيط<br>Present Simple','arc'),('Is, am, are','key'),
      ('<b>Ahmed</b> eats burger.','enl'),('The burger <b>is</b> eaten.','enl')],
     [('الماضي البسيط<br>Past Simple','arc'),('Was, were','key'),
      ('<b>Ali</b> killed the bugs.','enl'),('The bugs <b>were</b> killed.','enl')],
     [('المستقبل البسيط<br>Future Simple','arc'),('Will be','key'),
      ('<b>Sara</b> will finish the project.','enl'),('The project <b>will be</b> finished.','enl')],
     [('المضارع المستمر<br>Present Continuous','arc'),('Is being, am being, are being','key'),
      ('<b>They are</b> watching a movie.','enl'),('A movie <b>is being</b> watched.','enl')],
     [('الماضي المستمر<br>Past Continuous','arc'),('Was being, were being','key'),
      ('<b>He was</b> reading a book.','enl'),('A book <b>was being</b> read.','enl')],
     [('المضارع التام<br>Present Perfect','arc'),('Has been, have been','key'),
      ('<b>We have</b> visited Iraq.','enl'),('Iraq <b>has been</b> visited by us.','enl')],
     [('الماضي التام<br>Past Perfect','arc'),('Had been','key'),
      ('<b>They had</b> completed the work.','enl'),('The work <b>had been</b> completed.','enl')],
     [('المستقبل التام<br>Future Perfect','arc'),('Will have been','key'),
      ('<b>We will have</b> finished the task.','enl'),('The task <b>will have been</b> finished.','enl')]],
    caption_en='Verb “to be”',
    tight=True, widths=['24%','22%','27%','27%'])

IRREG_ADJ = table(
    [('الصفة','ar'),('المقارنة','ar'),('المفاضلة','ar')],
    [[('Good','key'),('Better than','en'),('The best','en')],
     [('Bad','key'),('Worse than','en'),('The worst','en')],
     [('Far','key'),('Farther / Further than','en'),('The farthest / the furthest','en')],
     [('Little','key'),('Less than','en'),('The least','en')]],
    caption_ar='الصفات الشاذة', caption_en='Irregular adjectives')

PRON_SHIFT = table(
    [('الكلام المباشر<br>(Direct Speech)','ar'),('الكلام المنقول<br>(Reported Speech)','ar'),
     ('Examples','en')],
    [[('I','key'),('He/she','key'),
      ('She said "I am tired". →<br>She said that she <b>was</b> tired.','enl')],
     [('you','key'),('I/we','key'),
      ('They told me "You are happy"→<br>they told me that <b>I was</b> happy.','enl')],
     [('we','key'),('they','key'),
      ('Ahmed said "we were in Baghdad" →<br>Ahmed said that <b>they had been</b> in Baghdad.','enl')],
     [('Your','key'),('My/our','key'),
      ('The person told me "I want to see <b>your</b> bag". → The person told me that he wanted '
       'to see <b>my</b> bag.','enl')],
     [('My','key'),('His /her','key'),
      ('He said "you ate my food"→<br>He said that <b>i had eaten</b> my food.','enl')]],
    caption_ar='تغيير الضمائر في الكلام المنقول', caption_en='Pronoun shift',
    widths=['20%','20%','60%'])

BACKSHIFT = table(
    [('Original<br>(Direct Speech)','en'),('Backshifted<br>(Reported Speech)','en'),('Example','en')],
    [[('am / is<br>are','key'),('was<br>were','key'),
      ('He said, “I am tired.” →<br>He said that he <b>was</b> tired.','enl')],
     [('was / were','key'),('had been','key'),
      ('He said, “I was hungry.” →<br>He said that he <b>had been</b> hungry.','enl')],
     [('have / has','key'),('had','key'),
      ('She said, “I have finished.” →<br>She said that she <b>had finished</b>.','enl')],
     [('will','key'),('would','key'),
      ('She said, “I will go.” →<br>She said that she <b>would</b> go.','enl')],
     [('shall','key'),('would','key'),
      ('He said, “I shall help.” →<br>He said that he <b>would</b> help.','enl')],
     [('can','key'),('could','key'),
      ('He said, “I can swim.” →<br>He said that he <b>could</b> swim.','enl')],
     [('may','key'),('might','key'),
      ('She said, “I may come.” →<br>She said that she <b>might</b> come.','enl')],
     [('must','key'),('had to','key'),
      ('He said, “I must study.” →<br>He said that he <b>had to</b> study.','enl')],
     [('do / does','key'),('did','key'),
      ('He said, “I do my homework.”→<br>He said that he <b>did</b> his homework.','enl')],
     [('did','key'),('had done','key'),
      ('He said, “I did my homework.” →<br>He said that he <b>had done</b> his homework.','enl')]],
    caption_ar='تغيير الأزمنة في الكلام المنقول', caption_en='Back-shifting',
    tight=True, widths=['20%','22%','58%'])

PART_VOICE = [
    ar('نستخدم جملة <b>المبني للمجهول</b> عندما يكون الفاعل مجهول, او للتركيز على الحدث نفسه '
       'بدًلا من التركيز على من قام بهذا الحدث'),
    ex(('Hussain  broke the window', '<b>حسين كسر النافذة</b>'),
       ('The window <b>was broken</b>', '<b>النافذة كُسرت</b>')),
    ar('الجملة الاولى مبني للمعلوم <b>(active voice)</b> لأن نعرف الشخص الي كسر النافذة  (حسين).'),
    ar('اما الجملة الثانية <b>(ا</b>لنافذة كُسرت<b>)</b>. زين منو كسرها ؟ ما نعرف لأن الجملة مبني '
       'للمجهول <b>(Passive voice)</b>.'),
    ar('جملة المبني للمجهول تتكون من مفعول به وبعدها فعل كينونة وبعدها يأتي الفعل الرئيسي دائما '
       'بصيغة التصريف الثالث <b>(P.P) :</b>'),
    formula('p.p + فعل كينونة  + مفعول به'),
    ex(('The bird <b>is killed</b>', 'النافذة كُسرت')),
    note('بالامتحان يعطيك جملة مبني للمعلوم والمطلوب تحويله الى مبني للمجهول, يعني لازم تختار الجملة المناسبة.',
         'او يعطيك جملة والمطلوب من عندك تختار صيغة الفعل المناسب <b>(p.p)</b> او تختار فعل كينونة مناسب.'),
    ar('<b>فعل الكينونة</b> يتغير شكله حسب <b>زمن</b> الجملة:'),
    BE_TABLE,
    note('لاحظ عند تحويل الجملة من المعلوم الى المجهول, اول شي يتم فعله هو حذف الفاعل واستبداله بالمفعول به.',
         'بعدها يتم اختيار فعل كينونة مناسب للزمن و المفعول به <b>( مفرد / جمع )</b>',
         'بعدها يتم اضافة الفعل الرئيسي بعد تحويله الى تصريف ثالث <b>p.p</b>'),

    qbar(),
    q('Ahmed writes a letter every day. Change to passive',
      ['A) A letter is written by Ahmed every day.',
       'B) A letter was written by Ahmed every day.',
       'C) A letter is wrote by Ahmed every day.',
       'D) A letter has written by Ahmed every day.'], 0),
    q('They cleaned the room yesterday. Change to passive',
      ['A) The room is cleaned yesterday.',
       'B) The room was cleaned yesterday.',
       'C) The room were cleaned yesterday.',
       'D) The room cleaned yesterday.'], 1),
    q('They have been________ false belief since there childhood.',
      ['A) teach', 'B) taught', 'C) teaching', 'D) teaches'], 1),
    q('The letter ______ by Ali last week.',
      ['A) is written', 'B) was written', 'C) writes', 'D) has written'], 1),
]

PART_COMP = [
    h3('a. Superlatives', 'المفاضلة'),
    ar('يتم استخدام صفات المفاضلة لتفضيل شخص عن مجموعة معينة. مثل ما نقول بالعربي: '
       'ميسي <b>الافضل</b> في العالم.'),
    ar('بالانكليزي نقوم بعمل صفات مفاضلة عن طريق اما اضافة “<b>est</b>” لنهاية الصفة في حال كانت الصفة '
       'تحتوي على حرف او صوت علة واحد:'),
    ex(('<b>nice ---- nicest</b>',), ('<b>cold ---- coldest</b>',)),
    ar('في حال انتهاء الصفة ب <b>y</b>,  يتم قلبه الى <b>i</b>  ونضيف <b>”happy ---- happiest -  “est</b>'),
    ar('او عن طريق اضافة  اضافة <b>“most”</b> في حال كانت الصفات الطويلة التي  تحتوي على اكثر من حرف او صوت علة:'),
    ex(('<b>Beautiful ---- most beautiful</b>',), ('<b>Expensive ---- most expensive</b>',)),
    ex(('This is <b>the nicest</b> car in the world',),
       ('I saw <b>the most beautiful</b> bird',)),
    note('كلمة <b>“the”</b> تعتبر دليل على موضوع المفاضلة, يعني  في حال وجدنا هذه الكلمة قبل الفراغ, '
         'نختار صفة المفاضلة:'),
    qbar(),
    q('This is <b>the</b> ___________ movie I have ever seen.',
      ['a) most exciting', 'b) more exciting', 'c) excitingest', 'd) excitinger'], 0),

    h3('b. Comparative', 'المقارنة'),
    ar('يتم استخدام صفات المقارنة للمقارنة بين شخصين او  مجموعتين . مثل ما نقول بالعربي: '
       'ميسي <b>احسن</b> من رونالدو.'),
    ar('بالانكليزي نقوم بعمل صفات المقارنة عن طريق اما اضافة <b>“er”</b> لنهاية الصفة في حال كانت الصفة '
       'تحتوي على حرف او صوت علة واحد:'),
    ex(('<b>nice ---- nicer</b>',), ('<b>cold ---- colder</b>',)),
    ar('في حال انتهاء الصفة ب <b>y</b>,  يتم قلبه الى <b>i</b>  ونضيف <b>”happy ---- happier -  “er</b>'),
    ar('او عن طريق اضافة   <b>“more”</b>  في حال كانت الصفات الطويلة التي  تحتوي على اكثر من حرف او صوت علة:'),
    ex(('<b>Beautiful ---- more beautiful</b>',), ('<b>Expensive ---- more expensive</b>',)),
    ex(('This car is <b>nicer than</b> your car',),
       ('I think this bird is <b>more beautiful than</b> yours',)),
    note('كلمة <b>“than”</b> تعتبر دليل على موضوع المقارنة, يعني  في حال وجدنا هذه الكلمة بعد الفراغ, '
         'نختار صفة المقارنة:'),
    qbar(),
    q('Ahmed is ___________ <b>than</b> his brother.',
      ['a) tall', 'b) taller', 'c) the tallest', 'd) as tall'], 1),

    ar('صفات شاذة يتغير شكلها عند تحويلها الى مقارنة او مفاضلة:'),
    IRREG_ADJ,

    qbar(),
    qcols(
        q('Russia is ___________ than Canada.',
          ['a) biger', 'b) bigger', 'c) biggest', 'd) the biggest'], 1),
        q('Gold is more expensive ___________ silver.',
          ['a) then', 'b) than', 'c) as', 'd) of'], 1)),
    qcols(
        q('The cheetah is the ___________ animal in the world.',
          ['a) faster', 'b) fastest', 'c) more fast', 'd) fast'], 1),
        q('Of all the students in the class, Sarah is the _______.',
          ['a) smart', 'b) smarter', 'c) smartest', 'd) more smart'], 2)),

    h3('c. As ... As', 'قاعدة التساوي'),
    ar('تُستخدم هذه التركيبة للتعبير عن أن شيئين أو شخصين متساويان تمامًا في صفة معينة:'),
    ex(('English is <b>as important as</b> mathematics',
        'اللغة الإنجليزية <b>مهمة بنفس درجة</b> أهمية الرياضيات.')),
    ar('الصفة يجب ان تكون بدون الاضافات الخاصة بالمقارنة و المفاضلة: '
       '“<b>er</b> و <b>est</b> او <b>more</b> و <b>most</b>”'),
    ar('و موقع الصفة يكون بين كلمتين as as'),

    qbar(),
    qcols(
        q('My phone is just as ___________ as yours.',
          ['a) expensive', 'b) more expensive', 'c) expensiver', 'd) most expensive'], 0),
        q('The apartment is ___________ big ___________ the old house.',
          ['a) more / than', 'b) as / than', 'c) as / as', 'd) so / than'], 2)),
    qcols(
        q('Ali runs as ___________ as a tiger.',
          ['a) faster', 'b) fast', 'c) fastest', 'd) the fastest'], 1),
        q('Typing on a laptop is not as ___________ as writing by hand.',
          ['a) easy', 'b) easier', 'c) easiest', 'd) more easy'], 0)),
    q('This winter is not as ___________ as last year\'s winter.',
      ['a) colder', 'b) cold', 'c) coldest', 'd) colder than'], 1),
]

PART_REPORTED = [
    ar('يتم استخدام <b>“Reported speech”</b> لنقل كلام شخص آخر دون استخدام كلماته الحرفية.'),
    ex(('He said "I am tired"', '<b>كلام مباشر -</b>'),
       ('He said that he was tired', '<b>كلام منقول -</b>'),
       ('they told me "we have been to Mecca"', '<b>كلام مباشر -</b>'),
       ('they told me that they had been to Mecca', '<b>كلام منقول -</b>')),
    note('بالامتحان مطلوب منك تحول الجملة من كلام مباشر الى كلام منقول',
         'المطلوب منك تختار الاختيار الي يتبع الشروط الاتية :'),

    ar('<b>اولاً:</b> اما <b>“said + فاعل”</b> أو <b>“told me+ فاعل”</b> ينزل كما هو حسب الموجود بالسؤال:'),
    ex(('<b>She said</b> ”I am watching”',),
       ('<b>she said</b> that she was watching.',)),

    ar('<b>ثانياً:</b> الفوارز <b>" "</b> يجب ان تحذف و يجب اضافة كلمة <b>that</b> بمكان الفارزة الاولى<b>:</b>'),
    ex(('She said <b>”</b>I am watching<b>”</b>',),
       ('she said <b>that</b> she was watching.',)),

    ar('<b>ثالثاً:</b> يجب تغيير ضمير الي كان بعد الفارزة الاولى  حسب جدول الاتي:'),
    PRON_SHIFT,
    note('في حال لقينا <b>told him</b> بدل <b>told me</b>  وشفنا <b>you</b> بعدهم، هذا ال <b>you</b> يتحول الى <b>he</b>',
         'في حال لقينا <b>told her</b> بدل <b>told me</b>  وشفنا <b>you</b> بعدهم، هذا ال <b>you</b> يتحول الى <b>she</b>'),
    ex(('They <b>told him</b> " <b>you</b> are happy"',),
       ('They <b>told him</b> that <b>he</b> was happy',),
       ('They <b>told her</b> " <b>you</b> are happy"',),
       ('They <b>told her</b> that <b>she</b> was happy',)),

    ar('<b>رابعاً</b> : يجب عمل شيء اسمه <b>”back-shifting“</b>  الى معناها نرجع زمن الجملة الاصلية الى زمن '
       'اقدم منه. مثلا اذا كانت الجملة بزمن <b>المضارع البسيط</b> تتحول الى <b>الماضي البسيط</b>.'),
    ar('تقدرون تمشون حسب الجدول الاتي:'),
    BACKSHIFT,
    note('واذا كان الفعل مجرد او يحتوى على <b>“s”</b> الشخص الثالث, يتم تحويله الى ماضي بسيط:'),
    ex(('She said "I <b>play</b> tennis"',),
       ('She said that she <b>played</b> tennis”',)),
    note('واذا كان الفعل بزمن ماضي بسيط, يتم تحويله الى ماضي تام:'),
    ex(('She said "I <b>played</b> tennis"',),
       ('She said that she <b>had played</b> tennis”',)),

    qbar(),
    q('Change the sentence to indirect speech. The teacher said "you must submit your assignments"',
      ['a)The teacher said that we must submit our assignments on time.',
       'b)The teacher said that we had to submit our assignments on time.',
       'c)The teacher says that we have to submit our assignments on time.',
       'd)The teacher says. You must submit your assignments on time.'], 1),
    q('Change the sentence to indirect speech. Ali said, “I am very tired.”',
      ['a) Ali said that I am very tired.',
       'b) Ali said that he was very tired.',
       'c) Ali says that he was very tired.',
       'd) Ali said that he is very tired.'], 1),
    q('Change the sentence to indirect speech. Sara said, “I have finished my work.”',
      ['a) Sara said that she had finished her work.',
       'b) Sara said that she has finished my work.',
       'c) Sara says that she had finished her work.',
       'd) Sara said that I had finished my work.'], 0),
    q('Ali told me, “I am very tired.”',
      ['a) Ali told me that he was very tired.',
       'b) Ali told me that I am very tired.',
       'c) Ali told that he was very tired.',
       'd) Ali told me that I had been very tired.'], 1),
]

PART_SVT = [
    ar('الكلمات “<b>so</b>” و <b>”very”</b> و <b>“too”</b>  معناهم "<b>جداً</b>"'),
    ar('لكن لكل منها استخدام مختلف:'),

    h3('a. Very', ''),
    ar('تستخدم  <b>“very”</b> لتقوية الصفة او الظرف بشكل بسيط ومحايد بدون معنى إضافي.'),
    ar('تدل على كمية كبيرة لكنها مقبولة.'),
    ex(('The room was <b>very</b> small',)),

    h3('b. So', ''),
    ar('<b>“So”</b> أقوى قليًلا من <b>“very”</b> وتحمل طابعًا تعبيريًا أو عاطفيًا (دهشة، فرح، إعجاب).'),
    ar('غالبًا ما ترتبط بقاعدة النتيجة والسبب باستخدام so... that.'),
    ex(('The weather is <b>so</b> hot <b>that</b> I can\'t go outside',)),

    h3('c. Too', ''),
    ar('<b>“Too”</b> تدل على الإفراط وزيادة الشيء عن الحد المطلوب بشكل سلبي أو مزعج.'),
    ar('تدل على عدم الرضا أو استحالة فعل الشيء.'),
    ar('غالبًا يأتي مع <b>“to”</b> بنفس الجملة'),
    ex(('This car is <b>too</b> expensive <b>to</b> buy',)),

    qbar(),
    q('The cake tasted________ good <b>that</b> I couldn’t finish it.',
      ['a) so', 'b) too', 'c) very', 'd)such'], 0),
    q('I can’t walk, the weather is_____ hot',
      ['a) so', 'b) too', 'c) very', 'd)such'], 1),
    q('The water is ________ cold for the children <b>to</b> swim in.',
      ['a) so', 'b) very', 'c) too', 'd) such'], 2),
]
