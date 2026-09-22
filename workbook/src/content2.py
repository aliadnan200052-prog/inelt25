# -*- coding: utf-8 -*-
from kit import *

PP_TABLE = table(
    [('فعل مجرد','ar'),('تصريف ثالث','ar'),('فعل مجرد','ar'),('تصريف ثالث','ar')],
    [[('be','key'),('been','en'),('know','key'),('known','en')],
     [('do','key'),('done','en'),('wear','key'),('worn','en')],
     [('go','key'),('gone','en'),('choose','key'),('chosen','en')],
     [('see','key'),('seen','en'),('break','key'),('broken','en')],
     [('eat','key'),('eaten','en'),('begin','key'),('begun','en')],
     [('drink','key'),('drunk','en'),('forget','key'),('forgotten','en')],
     [('write','key'),('written','en'),('find','key'),('found','en')],
     [('drive','key'),('driven','en'),('make','key'),('made','en')],
     [('speak','key'),('spoken','en'),('say','key'),('said','en')],
     [('give','key'),('given','en'),('',''),('','')],
     [('take','key'),('taken','en'),('',''),('','')]],
    caption_ar='الافعال الشاذة — التصريف الثالث', caption_en='Past participle', tight=True)

PART_TENSES = [
    h2('1', 'Present Simple', 'المضارع البسيط'),
    ar('نستخدم زمن المضارع البسيط للحديث عن حقائق عامة أو الحقائق العلمية أو عن العادات والروتين '
       'اليومي وشي متكرر ودائم الحصول. الدلائل:'),
    bank('(always ,usually , never , sometimes , rarely , often , every )'),

    h3('a. Affirmative', 'الاثبات'),
    ar('الفعل يكون مجرد خالي من الاضافة في حال الفاعل كان <b>(you , I , They , we )</b> او اسم <b>جمع</b>, '
       'ويتم اضافة <b>(s) او (es)</b> للفعل في حال كان  الفاعل <b>( he, she, it )</b>  او اسم مفرد:'),
    formula('تكملة الجملة + s فعل /  فعل مجرد + فاعل'),
    ex(('<b>They</b> never <b>go</b> to the museum.',),
       ('<b>He</b> often <b>finds</b> it .',)),

    h3('b. Negative', 'النفي'),
    ar('يتم النفي عند اضافة <b>(don’t)</b> في الفاعل جمع. و <b>(doesn’t)</b> في حالة المفرد والفعل , بالحالتين مجرد:'),
    formula('فعل مجرد + don’t /  doesn’t + فاعل'),
    ex(('<b>They don’t</b> want to be here.',),
       ('<b>She doesn’t</b> always go to the market.',)),

    h3('c. Question', 'الاستفهام'),
    ar('الاستفهام  يتم عن طريق اضافة <b>(do)</b> في حالة الجمع <b>او (does)</b> في حالة المفرد قبل الفاعل:'),
    formula('فعل مجرد + فاعل  + do / does'),
    ex(('<b>Do you</b> even care?',),
       ('<b>Does Ali</b> love the pizza?',)),
    note('نستخدم الفعلين (<b>has</b> , <b>is</b>)  مع الفاعل المفرد.',
         'اما  (<b>have</b> , <b>are</b>) مع الفاعل الجمع.',
         '(<b>am</b> , <b>have</b>)  مع الضمير  I'),

    qbar(),
    q('_____ many times every winter in Frankfurt.',
      ['A) it snows', 'B) it snowed', 'C) it is snowing', 'D) it is snow'], 0),
    q('I don’t understand this sentence. what ______ ?',
      ['A) does mean this word', 'B) does this word mean', 'C) means this word',
       'D) do this word mean'], 1),
    q('The north pole____ a latitude of 90 degrees north',
      ['A)  it has', 'D)  has', 'C) which is having', 'D) are having'], 1),

    h2('2', 'Present Continuous', 'المضارع المستمر'),
    ar('نستخدم زمن المضارع المتسمر للحديث عن اشياء تحصل في لحظ الكلام. الدلائل:'),
    bank('(now , at this moment , currently, this day ,this week ,this year )'),
    ar('زمن المضارع المستمر يتكون من فاعل و فعل مساعد ( اما <b>is مع المفرد</b>  او <b>am مع I</b> '
       'او <b>are مع الجمع</b>  ) والفعل الرئيسي مع اضافة <b>ing</b> له'),

    h3('a. Affirmative', 'الاثبات'),
    formula('ing فعل + is , am , are + فاعل'),
    ex(('<b>The number of people in Iraq is rising</b>',),
       ('<b>You are sitting here now</b>',),
       ('<b>I\'m doing my job now</b>',)),

    h3('b. Negative', 'النفي'),
    ar('النفي يتم فقط عن طريق اضافة <b>not</b> للافعال المساعدة  ( عادة ما يتم اختصاره الى  <b>n’t )</b>'),
    ex(('I\'m <b>not</b> doing anything now',),
       ('Ali is<b>n’t</b> going anywhere',),
       ('We are<b>n’t</b> watching a movie',)),

    h3('c. Question', 'الاستفهام'),
    ar('الاستفهام  يتم عن طريق تغيير مكان الافعال المساعدة ووضعهم قبل الفاعل :'),
    ex(('<b>Am</b> I doing something wrong?',),
       ('What <b>is</b> Ahmed watching ?',),
       ('<b>are</b> you kidding me?',)),

    qbar(),
    q('Your friend is from Basra, ask him where he is living now?',
      ['A) where are you live now?', 'B) where you living now?', 'C)where did her lived?',
       'D)where are you living now?'], 3),
    q('want to lose weight, so this week __________dinner',
      ['A) I am not eating', 'B) I am eating', 'C) I never eating', 'D) I am not eat'], 0),
    q('Is your English ________better? Yes, it is',
      ['A) getting', 'B) was getting', 'C)get', 'D) got'], 0),
    q('The cost of living _________. Every year things are getting more expensive',
      ['A) is rise', 'B) is rising', 'C) are rising', 'D)were rising'], 1),

    h2('3', 'Present Perfect simple', 'المضارع التام البسيط'),
    ar('نستخدم زمن المضارع التام البسيط للحديث عن اشياء حصلت في الماضي لكن الاثر لا يزال قائما الى هذه اللحظة.'),
    bank('(already , just , yet ,never , ever, since , for)'),
    ar('زمن المضارع التام البسيط يتكون من فاعل و فعل مساعد “<b>has</b>” في حال كان الفاعل: '
       '( <b>he, she ,it والاسم المفرد</b>)'),
    ar('أو “<b>have</b>” في حال كان الفاعل<b>: (you, we ,they او اسم جمع).</b> '
       'والفعل الرئيسي يكون بصيغة التصريف الثالث.'),
    note('ماهو التصريف الثالث؟',
         'التصريف الثالث هو شكل خاص من الفعل ( نرمز له <b>p.p</b>)  نستخدمه في زمن المضارع التام و الماضي '
         'تام, و المبني للمجهول. في اغلب الاحيان, يتم تحويل الفعل الى صيغة التصريف الثالث عن طريق اضافة '
         '<b>ed-</b> نهاية الفعل.   e.g. play-play<b>ed</b> , want-want<b>ed</b>'),
    ar('ايضا يوجد بعض الافعال الشاذة  يتم تحويلها الي تصريف ثالث <b>بدون</b> اضافة ed- :'),
    PP_TABLE,

    h3('a. Affirmative', 'الاثبات'),
    formula('has , have +  p.p + فاعل'),
    ex(('She <b>has</b> never <b>been</b> to Paris',),
       ('My students <b>have</b> already <b>visited</b> me',)),

    h3('b. Negative', 'النفي'),
    ar('النفي يتم فقط عن طريق اضافة <b>not</b> للافعال المساعدة  ( عادة ما يتم اختصاره الى  <b>n’t )</b>'),
    ex(('Sarah <b>has not</b> eaten yet',),
       ('The people <b>haven’t</b> got mad yet',)),

    h3('c. Question', 'الاستفهام'),
    ar('الاستفهام يتم عن طريق تغيير مكان الافعال المساعدة ووضعهم قبل الفاعل :'),
    ex(('<b>Has</b> Ali done anything yet?',),
       ('<b>Have</b> you ever been in London?',)),
    note('<b>ever</b> تُستخدم  مع الجمل الاستفهامية — Has he <b>ever</b> cared?',
         'بينما <b>never</b> تُستخدم مع الجمل المثبته ومكانهم قبل الفعل الرئيسي — She has <b>never</b> cared.',
         'نستخدم <b>yet</b> مع الجمل الاستفهامية والنفي, وغالبًا تاتي اخر كلمة بالجملة — I haven’t been here <b>yet.</b>'),

    ar('نستخدم <b>Since (مُنذ)</b> مع الاتي<b>:</b>'),
    ar('السنوات والشهور والأيام: ( Since 2018, Since May, since Monday)'),
    ar('الساعات المحددة: (Since 8 o\'clock, Since 4 PM)'),
    ar('مراحل الحياة أو أحداث معينة: (Since childhood, Since graduation)'),
    ar('تُستخدم <b>For  (لمدة)</b> مع الاتي'),
    ar('الدقائق والساعات: (For 20 minutes, For 5 hours)'),
    ar('الأيام والأسابيع :(For 4 days, For 3 weeks)'),
    ar('الشهور والسنوات: (For 6 months, For 10 years)'),

    qbar(),
    q('I haven\'t finished my English homework_______.',
      ['A) since', 'B) yet', 'C) ever', 'D) For'], 1),
    q('My uncle has worked in this factory _______ 15 years.',
      ['A) for', 'B) since', 'C) never', 'D) yet'], 0),
    q('She has been a teacher _______ she graduated in 2018.',
      ['A) for', 'B) yet', 'C) ever', 'D) since'], 3),
    q('They _______ written the report yet.',
      ['A) have', 'B) haven\'t', 'C) has', 'D) didn\'t'], 1),

    h2('4', 'Past Simple', 'الماضي البسيط'),
    ar('يُستخدم هذا الزمن  للتحدث عن حدث حصل وانتهى في الماضي. الدلائل:'),
    bank('(Yesterday / ago / last)'),
    ar('يتم تحويل الفعل الى ماضي باضافة <b>ed</b> نهاية الفعل , ويوجد ايضا مجموعة من الافعال الشاذة لا '
       'تقبل ال <b>ed</b>  عند تحويلها الى الماضي.'),

    h3('a. Affirmative', 'الاثبات'),
    formula('ed  فعل  + فاعل'),
    ex(('He killed it yesterday',)),

    h3('b. Negative', 'النفي'),
    ar('النفي يتم فقط عن طريق اضافة <b>didn’t</b> قبل الفعل الرئيسي<b>,</b> والفعل الرئيسي يكون بصيغة المجرد:'),
    formula('فعل مجرد  + didn’t + فاعل'),
    ex(('They didn’t buy a car yesterday',)),

    h3('c. Question', 'استفهام'),
    ar('الاستفهام يتم فقط عن طريق اضافة <b>did</b> قبل الفاعل<b>,</b> والفعل الرئيسي يكون بصيغة المجرد:'),
    formula('? فعل مجرد  + فاعل  + Did'),
    ex(('Where <b>did</b> he <b>go</b> last day?',)),

    qbar(),
    q('Yesterday, I _______ a beautiful movie with my family.',
      ['A) watch', 'B) watched', 'C) watching', 'D) has watched'], 1),
    q('My family _______ to Egypt for vacation last summer.',
      ['A) go', 'B) goes', 'C) went', 'D) gone'], 2),
    q('They _______ enjoy the party because the music was too loud.',
      ['A) don\'t', 'B) doesn\'t', 'C) didn\'t', 'D) wasn\'t'], 2),

    h2('5', 'Past continuous', 'الماضي المستمر'),
    ar('نستخدم هذا الزمن للحديث عن شي حصل في الماضي واستمر لفترة معينة ثم انتهى.الدلائل:'),
    bank('( as , while ,when )'),
    ar('يتم تحويل الفعل الى ماضي مستمر  باضافة الفعل المساعد “<b>was</b>” مع (الفاعل المفرد, he, she, it, I) '
       'او <b>“were”</b> مع (الفاعل الجمع, we, you, they). مع اضافة “<b>ing</b>”  للفعل الرئيسي'),

    h3('a. Affirmative', 'الاثبات'),
    formula('ing فعل + was, were  + فاعل'),
    ex(('I was playing football when my father came.',),
       ('I saw them while they were driving.',)),

    h3('b. Negative', 'النفي'),
    ar('النفي يتم فقط عن طريق اضافة <b>NOT</b> للافعال المساعدة ال <b>was</b>  و <b>were</b>. '
       'او كاختصار <b>wasn’t</b> /weren’t'),
    ex(('She wasn’t doing anything wrong.',),
       ('They were not doing anything useful.',)),

    h3('c. Question', 'استفهام'),
    ar('يتم تحويل الجملة الى استفهام عن طريق تغيير مكان الافعال المساعدة الى ما قبل الفاعل.'),
    ex(('was it flying when he came?',),
       ('where were they going?',)),

    qbar(),
    q('At 8 o\'clock last night, I _______ studying for my English exam.',
      ['A) is', 'B) was', 'C) were', 'D) am'], 1),
    q('What _______ you doing <b>when</b> I called you yesterday afternoon?',
      ['A) was', 'B) did', 'C) were', 'D) are'], 2),
    q('<b>While</b> my mother _______ dinner, the doorbell rang.',
      ['A) cooks', 'B) was cooking', 'C) cooked', 'D) is cooking'], 1),

    h2('6', 'Past Perfect Simple', 'الماضي التام البسيط'),
    ar('<b>الماضي التام البسيط</b> غالبا ما ياتي مع زمن الماضي البسيط ( تم شرحه مسبقًا) في نفس الجملة , '
       'الفرق بينهم من ناحية المعنى انه صح ثنينهم ماضي لكن الماضي التام اقدم من الماضي البسيط'),
    bank('(after / before /by the time / as soon as/until)'),
    ar('تتكون جملة الماضي التام البسيط من فاعل  و فعل مساعد <b>(had)</b> ثم فعل رئيسي يكون '
       'بصيغة التصريف الثالث <b>(p.p)</b> .'),

    h3('a. Affirmative', 'الاثبات'),
    formula('had +  p.p + فاعل'),
    ex(('I <b>had finished</b> my homework <b>before</b> my friend  arrived.',),
       ('She went to bed <b>after</b> she <b>had watched</b> the movie.',)),

    h3('b. Negative', 'النفي'),
    ar('النفي يتم فقط عن طريق اضافة <b>not</b> بعد الفعل المساعد <b>had ,</b> او كاختصار  <b>hadn’t</b>'),
    ex(('<b>By the time</b> the teacher came, the students <b>hadn’t prepared</b> the lesson.',)),

    h3('c. Question', 'استفهام'),
    ar('يتم تحويل الجملة الى استفهام عن طريق تغيير مكان الفعل المساعد <b>had</b> الى ما قبل الفاعل.'),
    ex(('<b>Had</b> you <b>finished</b> your homework <b>before</b> your father came?',)),

    qbar(),
    q('<b>By the time</b> the police arrived, the thief _______ escaped.',
      ['A) has', 'B) had', 'C) was', 'D) did'], 1),
    q('_______ you studied English <b>before</b> you moved to London?',
      ['A) Had', 'B) Have', 'C) Did', 'D) Were'], 0),
    q('<b>After</b> Ali _______ his homework, he went out to play football.',
      ['A) finishes', 'B) finished', 'C) had finished', 'D) has finished'], 2),
    note('لاحظ جملة زمن الماضي التام تأتي بعد كلمة “<b>after</b>”<b>,</b> وقبل كلمة “<b>before</b>”'),

    h2('7', 'Future Simple', 'المستقبل البسيط'),
    ar('يُستخدم للتعبير عن أفعال أو أحداث ستحدث في وقت لاحق في المستقبل. الدلائل:'),
    bank('(Tomorrow, soon, next)'),
    ar('تتكون جملة المستقبل البسيط من فاعل  و <b>“will”</b> بعده ياتي <b>ال</b>فعل رئيسي يكون مجرد'),

    h3('a. Affirmative', 'الاثبات'),
    formula('فعل مجرد + will + فاعل'),
    ex(('I <b>will</b> go <b>tomorrow</b>',)),

    h3('b. Negative', 'النفي'),
    ar('النفي يتم فقط عن طريق اضافة <b>not</b> بعد الفعل المساعد <b>will ,</b> او كاختصار  <b>won’t</b>'),
    ex(('It <b>will not</b> rain <b>tomorrow</b>.',)),

    h3('c. Question', 'استفهام'),
    ar('يتم تحويل الجملة الى استفهام عن طريق تغيير مكان الفعل المساعد <b>will</b> الى ما قبل الفاعل.'),
    ex(('<b>Will you go next year?</b>',)),

    h2('8', 'Future Continuous', 'المستقبل المستمر'),
    ar('يعبر عن حدث سيكون مستمراً وقائماً في وقت محدد أو في لحظة معينة في المستقبل الدلائل:'),
    bank('(this time ,while , when, tomorrow)'),
    ar('تتكون جملة المستقبل البسيط من فاعل  و <b>( will be )</b> بعده ياتي <b>ال</b>فعل رئيسي المضافه له <b>Ing</b>'),

    h3('a. Affirmative', 'الاثبات'),
    formula('will be +  v.ing + فاعل'),
    ex(('<b>This time</b> tomorrow, I <b>will be traveling</b> to Baghdad.',)),

    h3('b. Negative', 'النفي'),
    ar('النفي يتم فقط عن طريق اضافة <b>not</b> بعد الفعل المساعد <b>will ,</b> او كاختصار  <b>won’t</b>'),
    ex(('This time tomorrow I will not be doing this job',)),

    h3('c. Question', 'استفهام'),
    ar('يتم تحويل الجملة الى استفهام عن طريق تغيير مكان الفعل المساعد <b>will</b> الى ما قبل الفاعل.'),
    ex(('<b>Will they be studying</b> at this time tomorrow?',)),
]
