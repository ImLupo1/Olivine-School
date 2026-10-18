(function () {
  const text = {
    'انتقل إلى المحتوى': ['Aller au contenu', 'Skip to content'],
    'الرئيسية': ['Accueil', 'Home'], 'المنشورات': ['Publications', 'Posts'], 'منشورات': ['Publications', 'Posts'],
    'من المدرسة مباشرة': ['Directement de l’école', 'Straight from school'], 'حكايات صغيرة،': ['Petites histoires,', 'Small stories,'],
    'خطوات كبيرة.': ['grands progrès.', 'big steps.'], 'كل جديد عن الدورات والأنشطة واللحظات التي تصنع مجتمع Olivine School.': ['Les nouvelles des cours, des activités et des moments qui font vivre la communauté Olivine School.', 'News about the courses, activities, and moments that make the Olivine School community.'],
    'اكتشف آخر ما نشرناه': ['Découvrez nos dernières publications', 'Explore our latest posts'], '— منشور': ['— publication', '— posts'],
    'دفتر المدرسة': ['Le journal de l’école', 'The school journal'], 'من يوميات': ['Le quotidien de', 'From the days at'],
    'تصفّح الإعلانات، الدورات، واللحظات الجديدة التي نشاركها معكم.': ['Parcourez les annonces, les cours et les moments que nous partageons avec vous.', 'Explore announcements, courses, and new moments we share with you.'],
    'تصفية المنشورات': ['Filtrer les publications', 'Filter posts'], 'الكل': ['Tout', 'All'],
    'ابحث في المنشورات': ['Rechercher dans les publications', 'Search posts'], 'مساحة لشيء جديد': ['La place pour du nouveau', 'Room for something new'],
    'كل قصة تبدأ بلحظة.': ['Chaque histoire commence par un instant.', 'Every story starts with a moment.'],
    'لا توجد منشورات تطابق اختيارك الآن. عُد قريباً للاطلاع على جديد المدرسة.': ['Aucune publication ne correspond à votre sélection. Revenez bientôt pour découvrir les nouvelles de l’école.', 'No posts match your selection right now. Come back soon for the latest from school.'],
    'تواصل مع المدرسة': ['Contacter l’école', 'Contact the school'], 'نلتقي في الصف': ['Rendez-vous en classe', 'See you in class'],
    'خطوتك التالية': ['Votre prochaine étape', 'Your next step'], 'تبدأ هنا.': ['commence ici.', 'starts here.'],
    'العودة إلى الصفحة الرئيسية ↑': ['Retour à l’accueil ↑', 'Back to homepage ↑'],
    'لغات ودعم دراسي · البليدة': ['Langues et soutien scolaire · Blida', 'Languages & tutoring · Blida'],
    'البرامج': ['Programmes', 'Programs'], 'دورات': ['Cours', 'Courses'], 'المراحل': ['Niveaux', 'School levels'],
    'عن المدرسة': ['À propos', 'About'], 'الأسئلة الشائعة': ['FAQ', 'FAQs'],
    'تواصل معنا': ['Contact', 'Contact'], 'الإعدادات': ['Paramètres', 'Settings'],
    'حسابي': ['Mon compte', 'My account'], 'استفسر عن التسجيل': ['Demander des informations', 'Ask about enrollment'],
    'أولاد يعيش · البليدة': ['Ouled Yaïch · Blida', 'Ouled Yaïch · Blida'],
    'خطوتك الأولى نحو مستقبل': ['Le premier pas vers un avenir', 'Your first step toward a future'],
    'مليء بالفرص': ['plein de possibilités', 'full of possibilities'],
    'في Olivine School، نساعدك على تطوير مهاراتك اللغوية وتعزيز مستواك الدراسي من خلال برامج تناسب احتياجاتك.': ['À Olivine School, nous vous aidons à développer vos compétences linguistiques et scolaires grâce à des programmes adaptés à vos besoins.', 'At Olivine School, we help you develop language skills and strengthen your studies through programs suited to your needs.'],
    'سجّل اهتمامك': ['Exprimer mon intérêt', 'Register your interest'], 'اكتشف برامجنا': ['Découvrir nos programmes', 'Explore our programs'],
    'لغات جديدة، دعم دراسي، وخطوة واثقة إلى الأمام.': ['De nouvelles langues, un accompagnement scolaire et un pas assuré vers l’avenir.', 'New languages, academic support, and a confident step forward.'],
    'نتعلّم معاً': ['Apprenons ensemble', 'Learning together'], 'ونتقدّم بثقة': ['et avançons avec confiance', 'moving forward with confidence'],
    'تعلم · طموح · نمو': ['Apprendre · ambition · progrès', 'Learn · aspire · grow'],
    'معرفة تُفتح بها الآفاق': ['Le savoir ouvre de nouveaux horizons', 'Knowledge opens new horizons'],
    'مرّر لاكتشاف البرامج': ['Faites défiler pour découvrir nos programmes', 'Scroll to explore our programs'],
    'مسارات للتعلّم': ['Parcours d’apprentissage', 'Learning paths'], 'الإنجليزية': ['Anglais', 'English'],
    'الفرنسية': ['Français', 'French'], 'التركية': ['Turc', 'Turkish'], 'دعم دراسي': ['Soutien scolaire', 'Academic tutoring'],
    'برامجنا': ['Nos programmes', 'Our programs'], 'مساحة تنمو فيها': ['Un espace pour développer', 'A place to grow your'],
    'المهارات': ['vos compétences', 'skills'],
    'سواء كنت تخطو نحو لغة جديدة أو تبحث عن دعم دراسي، تعرّف على البرامج التي يمكنك الاستفسار عنها.': ['Que vous souhaitiez apprendre une nouvelle langue ou bénéficier d’un soutien scolaire, découvrez les programmes disponibles.', 'Whether you want to learn a new language or get academic support, explore the programs you can ask us about.'],
    'تعلّم اللغات': ['Apprentissage des langues', 'Language learning'],
    'استفسر عن برامج اللغة الإنجليزية المتاحة وطرق الالتحاق بها.': ['Renseignez-vous sur les cours d’anglais actuellement proposés et les modalités d’inscription.', 'Ask about available English courses and how to enroll.'],
    'استفسر عن البرنامج': ['En savoir plus', 'Ask about this program'],
    'اسأل فريق المدرسة عن دورات الفرنسية ومواعيدها المتاحة.': ['Contactez l’école pour connaître les cours de français et les horaires disponibles.', 'Ask the school about French courses and available schedules.'],
    'تواصل معنا لمعرفة تفاصيل برنامج اللغة التركية والتسجيل.': ['Contactez-nous pour connaître les détails des cours de turc et de l’inscription.', 'Contact us for details about Turkish courses and enrollment.'],
    'مرافقة دراسية': ['Accompagnement scolaire', 'Academic support'], 'دروس الدعم': ['Soutien scolaire', 'Academic tutoring'],
    'دعم دراسي لتلاميذ الابتدائي والمتوسط والثانوي. أكّد معنا المواد المتاحة.': ['Soutien scolaire pour les niveaux primaire, moyen et secondaire. Contactez-nous pour confirmer les matières proposées.', 'Tutoring for primary, middle, and secondary students. Contact us to confirm the subjects currently offered.'],
    'الدعم الدراسي': ['Soutien scolaire', 'Academic tutoring'], 'دعم يناسب': ['Un accompagnement adapté', 'Support for'],
    'مرحلتك': ['à votre niveau', 'your level'],
    'لأن احتياجات التعلّم تختلف من مرحلة إلى أخرى، نرحّب باستفساراتكم حول المستوى والمواد المتاحة.': ['Les besoins évoluent avec chaque niveau. Contactez-nous pour connaître les classes et les matières disponibles.', 'Learning needs change at every stage. Contact us to ask which levels and subjects are available.'],
    'اسأل عن الدعم الدراسي': ['Demander des informations', 'Ask about tutoring'],
    'التعليم الابتدائي': ['Primaire', 'Primary school'], 'استفسر عن المواد المتاحة لهذا المستوى.': ['Renseignez-vous sur les matières proposées à ce niveau.', 'Ask which subjects are available for this level.'],
    'التعليم المتوسط': ['Moyen', 'Middle school'], 'تعرّف على خيارات الدعم والمواعيد.': ['Découvrez les options de soutien et les horaires.', 'Ask about tutoring options and schedules.'],
    'التعليم الثانوي': ['Secondaire', 'Secondary school'], 'تواصل معنا لتأكيد تفاصيل المرحلة.': ['Contactez-nous pour confirmer les détails de ce niveau.', 'Contact us to confirm details for this level.'],
    'عن Olivine': ['À propos d’Olivine', 'About Olivine'], 'التعلّم يفتح': ['L’apprentissage ouvre', 'Learning opens'],
    'آفاقاً جديدة': ['de nouveaux horizons', 'new horizons'],
    'Olivine School Dz مدرسة لغات ومركز للدروس الخصوصية في أولاد يعيش، البليدة. نجمع بين تعلّم اللغات والدعم الدراسي في مكان واحد.': ['Olivine School Dz est une école de langues et un centre de soutien scolaire à Ouled Yaïch, Blida. Nous réunissons les langues et l’accompagnement scolaire au même endroit.', 'Olivine School Dz is a language school and tutoring center in Ouled Yaïch, Blida. We bring language learning and academic support together.'],
    'نؤمن أن أفضل بداية هي السؤال المناسب: أخبرنا بالمادة أو اللغة والمستوى الذي تبحث عنه، وسنساعدك في معرفة التفاصيل المتاحة.': ['La meilleure façon de commencer est de poser la bonne question. Indiquez la matière, la langue et le niveau recherchés ; nous vous renseignerons sur les options disponibles.', 'A good first step is asking the right question. Tell us the subject, language, and level you are interested in, and we will share the available details.'],
    'لغات ودعم دراسي': ['Langues et soutien scolaire', 'Languages and tutoring'], 'مراحل تعليمية متنوعة': ['Plusieurs niveaux scolaires', 'Programs for different school levels'],
    'تواصل مباشر وواضح': ['Un contact direct et clair', 'Direct, clear communication'], 'تعرّف على طرق التواصل': ['Voir les moyens de contact', 'See contact options'],
    'كيف تبدأ؟': ['Comment commencer ?', 'How to get started'], 'ثلاث خطوات': ['Trois étapes', 'Three simple steps'], 'بسيطة': ['simples', ''],
    'استفسر أولاً، ثم أكّد التفاصيل مباشرة مع المدرسة.': ['Renseignez-vous d’abord, puis confirmez les détails directement auprès de l’école.', 'Ask first, then confirm the details directly with the school.'],
    'اختر ما تبحث عنه': ['Choisissez votre programme', 'Choose what you need'], 'حدّد اللغة أو المرحلة التعليمية التي تهمّك.': ['Choisissez la langue ou le niveau scolaire qui vous intéresse.', 'Select the language or school level you are interested in.'],
    'تواصل للاستفسار': ['Contactez-nous', 'Contact the school'], 'اسأل عن التوفر والمواعيد والمواد المطروحة.': ['Demandez les disponibilités, les horaires et les matières proposées.', 'Ask about availability, schedules, and subjects offered.'],
    'أكّد تفاصيل التسجيل': ['Confirmez l’inscription', 'Confirm enrollment details'], 'استكمل معلومات التسجيل مباشرة مع المدرسة.': ['Finalisez les modalités d’inscription directement auprès de l’école.', 'Confirm registration details directly with the school.'],
    'نجيب عن استفساراتكم': ['Vos questions', 'Here to answer your questions'], 'أسئلة': ['Questions', 'Questions'], 'شائعة': ['fréquentes', 'common'],
    'لم تجد ما تبحث عنه؟ يسعدنا تواصلك معنا مباشرة.': ['Vous ne trouvez pas la réponse ? Contactez-nous directement.', 'Didn’t find what you need? Contact us directly.'],
    'ما اللغات التي يمكنني الاستفسار عنها؟': ['Quelles langues puis-je découvrir ?', 'Which languages can I ask about?'],
    'يمكنك الاستفسار عن دورات اللغة الإنجليزية والفرنسية والتركية. تواصل معنا لتأكيد الدورات المتاحة حالياً.': ['Vous pouvez demander des informations sur les cours d’anglais, de français et de turc. Contactez-nous pour confirmer les cours actuellement proposés.', 'You can ask about English, French, and Turkish courses. Contact us to confirm current availability.'],
    'هل تتوفر دروس دعم لكل المراحل؟': ['Y a-t-il du soutien pour chaque niveau ?', 'Is tutoring available for each school level?'],
    'تقدّم المدرسة دروس دعم لتلاميذ الابتدائي والمتوسط والثانوي. يُرجى التواصل للتأكد من المواد والمستويات المتاحة حالياً.': ['L’école propose du soutien scolaire aux élèves du primaire, du moyen et du secondaire. Contactez-nous pour confirmer les matières et niveaux disponibles.', 'The school offers tutoring for primary, middle, and secondary students. Contact us to confirm current subjects and availability.'],
    'كيف أعرف المواعيد والأسعار؟': ['Comment connaître les horaires et les tarifs ?', 'How can I find out about schedules and fees?'],
    'المواعيد والأسعار غير منشورة هنا. يرجى الاتصال بالمدرسة مباشرة للحصول على المعلومات المحدثة.': ['Les horaires et les tarifs ne sont pas publiés ici. Contactez directement l’école pour obtenir les informations à jour.', 'Schedules and fees are not listed here. Contact the school directly for current information.'],
    'أين تقع المدرسة؟': ['Où se trouve l’école ?', 'Where is the school located?'],
    'تقع المدرسة في أولاد يعيش، البليدة. استخدم رابط خرائط Google أدناه للوصول إلى الموقع.': ['L’école se trouve à Ouled Yaïch, Blida. Utilisez le lien Google Maps ci-dessous pour vous y rendre.', 'The school is in Ouled Yaïch, Blida. Use the Google Maps link below for directions.'],
    'كيف أستفسر عن التسجيل؟': ['Comment demander des informations sur l’inscription ?', 'How can I ask about enrollment?'],
    'املأ نموذج الاستفسار واختر إرسال الرسالة عبر واتساب أو البريد الإلكتروني. لن تُرسل الرسالة إلا بعد تأكيدك في التطبيق المختار.': ['Remplissez le formulaire, puis choisissez WhatsApp ou e-mail. Le message ne sera envoyé qu’après votre confirmation dans l’application choisie.', 'Complete the inquiry form and choose WhatsApp or email. The message is sent only after you confirm it in the selected app.'],
    'خطوتك التالية': ['À vous de jouer', 'Your next step'], 'هل لديك': ['Une', 'Have a'], 'سؤال؟': ['question ?', 'question?'],
    'أخبرنا بما تبحث عنه. سنجهّز لك رسالة يمكنك مراجعتها وإرسالها عبر واتساب أو البريد الإلكتروني.': ['Dites-nous ce que vous recherchez. Nous préparerons un message que vous pourrez vérifier et envoyer par WhatsApp ou e-mail.', 'Tell us what you are looking for. We’ll prepare a message for you to review and send by WhatsApp or email.'],
    'اتصل بنا مباشرة': ['Appelez-nous directement', 'Call us directly'], 'نموذج الاستفسار': ['Formulaire de demande', 'Inquiry form'],
    'الحقول المعلّمة بـ * مطلوبة': ['Les champs marqués d’un * sont obligatoires', 'Fields marked * are required'],
    'الاسم': ['Nom', 'Name'], 'رقم الهاتف أو البريد الإلكتروني': ['Téléphone ou adresse e-mail', 'Phone number or email'],
    'ما الذي تود الاستفسار عنه؟': ['Quel est votre sujet ?', 'What would you like to ask about?'], 'اختر البرنامج': ['Choisir un programme', 'Choose a program'],
    'دروس اللغة الإنجليزية': ['Cours d’anglais', 'English courses'], 'دروس اللغة الفرنسية': ['Cours de français', 'French courses'],
    'دروس اللغة التركية': ['Cours de turc', 'Turkish courses'], 'استفسار عام': ['Demande générale', 'General inquiry'],
    'المرحلة التعليمية': ['Niveau scolaire', 'School level'], '(اختياري)': ['(facultatif)', '(optional)'], 'اختر المرحلة': ['Choisir un niveau', 'Choose a level'],
    'طريقة التواصل المفضّلة': ['Moyen de contact préféré', 'Preferred contact method'], 'واتساب': ['WhatsApp', 'WhatsApp'], 'البريد الإلكتروني': ['E-mail', 'Email'],
    'رسالتك': ['Votre message', 'Your message'], 'أوافق على فتح تطبيق المراسلة لإرسال هذا الاستفسار. لن تُرسل بياناتي أو تُخزّن على هذا الموقع.': ['J’accepte d’ouvrir l’application de messagerie pour envoyer cette demande. Ce site ne transmet ni ne stocke mes données.', 'I agree to open a messaging app to send this inquiry. This site does not send or store my information.'],
    'جهّز رسالة الاستفسار': ['Préparer ma demande', 'Prepare inquiry message'],
    'بعد الضغط، ستتمكن من مراجعة الرسالة وإرسالها بنفسك. تعبئة النموذج لا تؤكد التسجيل.': ['Vous pourrez vérifier le message et l’envoyer vous-même. Remplir ce formulaire ne confirme pas une inscription.', 'You can review and send the message yourself. Completing this form does not confirm enrollment.'],
    'نحن هنا للمساعدة': ['Nous sommes là pour vous aider', 'We are here to help'], 'تواصل مع': ['Contactez', 'Contact'],
    'للاستفسار عن البرامج والتوفر، تواصل مباشرة مع المدرسة عبر القناة التي تناسبك.': ['Pour connaître les programmes et les disponibilités, contactez directement l’école par le moyen qui vous convient.', 'Ask the school directly about programs and availability through whichever channel suits you.'],
    'اتصال هاتفي': ['Téléphone', 'Phone'], 'اضغط للاتصال': ['Appuyer pour appeler', 'Tap to call'], 'راسلنا عبر البريد': ['Écrivez-nous', 'Email us'],
    'موقعنا': ['Nous trouver', 'Find us'], 'أولاد يعيش، البليدة': ['Ouled Yaïch, Blida', 'Ouled Yaïch, Blida'],
    'FVX7+WP9 · افتح خرائط Google': ['FVX7+WP9 · Ouvrir Google Maps', 'FVX7+WP9 · Open Google Maps'],
    'تابعنا على Instagram': ['Suivez-nous sur Instagram', 'Follow us on Instagram'], 'تابعنا على Facebook': ['Suivez-nous sur Facebook', 'Follow us on Facebook'],
    'مساحة للتعلّم وتطوير المهارات اللغوية والدراسية في أولاد يعيش، البليدة.': ['Un lieu pour apprendre et développer ses compétences linguistiques et scolaires à Ouled Yaïch, Blida.', 'A place to learn and build language and academic skills in Ouled Yaïch, Blida.'],
    'روابط سريعة': ['Liens rapides', 'Quick links'], 'أولاد يعيش، البليدة ↗': ['Ouled Yaïch, Blida ↗', 'Ouled Yaïch, Blida ↗'],
    'Olivine School Dz · جميع الحقوق محفوظة': ['Olivine School Dz · Tous droits réservés', 'Olivine School Dz · All rights reserved'],
    'مساحة حساب Olivine': ['Espace membre Olivine', 'Olivine member space'],
    'إعدادات الموقع': ['Paramètres du site', 'Site settings'], 'لغة الموقع': ['Langue du site', 'Website language'], 'العربية': ['العربية', 'Arabic'],
    'المظهر والألوان': ['Apparence et couleurs', 'Appearance and colors'], 'أخضر أوليفين': ['Vert Olivine', 'Olivine green'],
    'أسود ليلي': ['Noir nuit', 'Midnight black'], 'أزرق بحري': ['Bleu océan', 'Ocean blue'], 'بنفسجي هادئ': ['Prune doux', 'Soft plum'], 'رملي دافئ': ['Sable chaud', 'Warm sand'],
    'تباين أعلى': ['Contraste renforcé', 'Higher contrast'], 'تُحفظ اللغة والمظهر على هذا الجهاز فقط.': ['La langue et l’apparence sont enregistrées sur cet appareil uniquement.', 'Language and appearance are saved on this device only.'],
    'تسجيل الدخول': ['Connexion', 'Sign in'], 'إنشاء حساب': ['Créer un compte', 'Create account'], 'كلمة المرور': ['Mot de passe', 'Password'],
    'كلمة المرور (12 خانة على الأقل)': ['Mot de passe (12 caractères minimum)', 'Password (at least 12 characters)'], 'إنشاء الحساب': ['Créer le compte', 'Create account'],
    'تابع الدورات والمنشورات الجديدة في الموقع، وتواصل معنا للاستفسار عن التسجيل.': ['Suivez les nouveaux cours et publications, puis contactez-nous pour toute question sur l’inscription.', 'Follow new courses and posts, and contact us with enrollment questions.'],
    'فتح لوحة الإدارة': ['Ouvrir le tableau de bord', 'Open admin dashboard'], 'أخبار Olivine': ['Actualités Olivine', 'Olivine news'],
    'آخر': ['Dernières', 'Latest'], 'المستجدات': ['actualités', 'updates'],
    'تابع جديد الدورات والإعلانات والأنشطة في المدرسة.': ['Suivez les cours, annonces et activités de l’école.', 'Follow new courses, announcements, and school activities.'],
    'آخر ما نُشر': ['Dernières publications', 'Latest updates'], 'ستظهر الدورات والمنشورات الجديدة هنا.': ['Les nouveaux cours et publications apparaîtront ici.', 'New courses and posts will appear here.'],
    'دورة جديدة': ['Nouveau cours', 'New course'], 'منشور جديد': ['Nouvelle publication', 'New post'],
    'هذه مساحة حساب أساسية. أرسل استفسارك عن البرامج والتسجيل عبر نموذج التواصل.': ['Votre espace membre est prêt. Utilisez le formulaire de contact pour toute demande sur les cours ou l’inscription.', 'Your basic member space is ready. Use the contact form for course or enrollment questions.'],
    'تسجيل الخروج': ['Se déconnecter', 'Sign out'],
    'يُحفظ الاسم والبريد الإلكتروني وتجزئة كلمة المرور في قاعدة بيانات الحسابات. لا تُخزّن بيانات دراسية أو صحية. لا يتوفر التحقق عبر البريد أو استعادة كلمة المرور بعد.': ['Le nom, l’adresse e-mail et le condensat du mot de passe sont enregistrés dans la base des comptes. Aucune donnée scolaire ou médicale n’est stockée. La vérification par e-mail et la réinitialisation du mot de passe ne sont pas encore disponibles.', 'Name, email address, and a password hash are stored in the account database. No school or health records are stored. Email verification and password recovery are not available yet.'],
  };

  const attributes = {
    'Olivine School Dz، الصفحة الرئيسية': ['Olivine School Dz, accueil', 'Olivine School Dz home'],
    'التنقل الرئيسي': ['Navigation principale', 'Main navigation'],
    'تصفية المنشورات': ['Filtrer les publications', 'Filter posts'], 'ابحث في المنشورات': ['Rechercher dans les publications', 'Search posts'],
    'تفاصيل المنشور': ['Détails de la publication', 'Post details'],
    'فتح القائمة': ['Ouvrir le menu', 'Open menu'], 'إغلاق القائمة': ['Fermer le menu', 'Close menu'],
    'إغلاق': ['Fermer', 'Close'], 'شعار Olivine School Dz': ['Logo Olivine School Dz', 'Olivine School Dz logo'],
    'طلاب يدرسون معاً في قاعة تعليمية': ['Des élèves étudient ensemble dans une salle de classe', 'Students studying together in a classroom'],
    'الاسم الذي نُناديك به': ['Le nom à utiliser', 'The name we should use'],
    'كيف يمكننا الرد عليك؟': ['Comment pouvons-nous vous répondre ?', 'How can we reply to you?'],
    'ما التفاصيل التي تريد معرفتها؟': ['Quelles informations souhaitez-vous ?', 'What would you like to know?'],
  };

  const ui = {
    ar: {
      formReady: 'تم تجهيز الرسالة. لم تُرسل بعد؛ راجعها في التطبيق ثم اضغط إرسال.',
      whatsappSend: 'فتح واتساب وإرسال الرسالة', emailSend: 'فتح البريد لإرسال الرسالة',
      requiredName: 'يرجى إدخال الاسم.', requiredContact: 'يرجى إدخال رقم هاتف أو بريد إلكتروني.',
      invalidContact: 'أدخل بريداً إلكترونياً صحيحاً أو رقم هاتف صالحاً.', requiredService: 'يرجى اختيار البرنامج الذي تود الاستفسار عنه.',
      requiredConsent: 'يرجى الموافقة قبل تجهيز الرسالة.',
      inquiryIntro: 'السلام عليكم، أود الاستفسار عن برامج Olivine School Dz.', name: 'الاسم', contact: 'رقم الهاتف أو البريد الإلكتروني', service: 'البرنامج', level: 'المرحلة التعليمية', method: 'طريقة التواصل المفضّلة', message: 'رسالة إضافية', subject: 'استفسار عن برامج Olivine School Dz',
      networkError: 'تعذر الاتصال بالخادم. شغّل الموقع عبر node serve.cjs وحاول مجدداً.', emailExists: 'يوجد حساب بهذا البريد الإلكتروني.',
      badCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', weakPassword: 'يجب ألا تقل كلمة المرور عن 12 خانة.',
      invalidName: 'أدخل اسماً من 1 إلى 80 حرفاً.', genericError: 'تعذر إكمال الطلب الآن. حاول مجدداً.',
      accountCreated: 'تم إنشاء الحساب وتسجيل الدخول.', signedIn: 'تم تسجيل الدخول بنجاح.', signedOut: 'تم تسجيل الخروج.',
      'آخر ما نُشر': 'آخر ما نُشر', 'ستظهر الدورات والمنشورات الجديدة هنا.': 'ستظهر الدورات والمنشورات الجديدة هنا.',
      'دورة جديدة': 'دورة جديدة', 'منشور جديد': 'منشور جديد',
      emailLabel: 'البريد الإلكتروني', login: 'تسجيل الدخول', register: 'إنشاء حساب', openMenu: 'فتح القائمة', closeMenu: 'إغلاق القائمة',
    },
    fr: {
      formReady: 'Message préparé. Il n’a pas encore été envoyé ; vérifiez-le dans l’application puis appuyez sur Envoyer.',
      whatsappSend: 'Ouvrir WhatsApp et envoyer', emailSend: 'Ouvrir l’e-mail et envoyer',
      requiredName: 'Veuillez saisir votre nom.', requiredContact: 'Veuillez saisir un numéro de téléphone ou une adresse e-mail.',
      invalidContact: 'Saisissez une adresse e-mail ou un numéro valide.', requiredService: 'Veuillez choisir le programme souhaité.',
      requiredConsent: 'Veuillez donner votre accord avant de préparer le message.',
      inquiryIntro: 'Bonjour, je souhaite obtenir des informations sur les programmes d’Olivine School Dz.', name: 'Nom', contact: 'Téléphone ou e-mail', service: 'Programme', level: 'Niveau scolaire', method: 'Moyen de contact préféré', message: 'Message complémentaire', subject: 'Demande d’informations sur Olivine School Dz',
      networkError: 'Le serveur est inaccessible. Lancez node serve.cjs puis réessayez.', emailExists: 'Un compte existe déjà avec cette adresse e-mail.',
      badCredentials: 'Adresse e-mail ou mot de passe incorrect.', weakPassword: 'Le mot de passe doit contenir au moins 12 caractères.',
      invalidName: 'Saisissez un nom de 1 à 80 caractères.', genericError: 'Impossible de terminer la demande. Réessayez.',
      accountCreated: 'Compte créé. Vous êtes connecté.', signedIn: 'Connexion réussie.', signedOut: 'Vous êtes déconnecté.',
      'آخر ما نُشر': 'Dernières publications', 'ستظهر الدورات والمنشورات الجديدة هنا.': 'Les nouveaux cours et publications apparaîtront ici.',
      'دورة جديدة': 'Nouveau cours', 'منشور جديد': 'Nouvelle publication',
      emailLabel: 'Adresse e-mail', login: 'Connexion', register: 'Créer un compte', openMenu: 'Ouvrir le menu', closeMenu: 'Fermer le menu',
    },
    en: {
      formReady: 'Message prepared. It has not been sent yet; review it in the app, then press Send.',
      whatsappSend: 'Open WhatsApp and send', emailSend: 'Open email and send',
      requiredName: 'Please enter your name.', requiredContact: 'Please enter a phone number or email address.',
      invalidContact: 'Enter a valid email address or phone number.', requiredService: 'Please choose a program to ask about.',
      requiredConsent: 'Please agree before preparing the message.',
      inquiryIntro: 'Hello, I would like to ask about Olivine School Dz programs.', name: 'Name', contact: 'Phone number or email', service: 'Program', level: 'School level', method: 'Preferred contact method', message: 'Additional message', subject: 'Question about Olivine School Dz programs',
      networkError: 'The server could not be reached. Run node serve.cjs and try again.', emailExists: 'An account already exists for this email address.',
      badCredentials: 'The email address or password is incorrect.', weakPassword: 'Password must be at least 12 characters long.',
      invalidName: 'Enter a name between 1 and 80 characters.', genericError: 'Could not complete the request. Please try again.',
      accountCreated: 'Account created and signed in.', signedIn: 'You are signed in.', signedOut: 'You are signed out.',
      'آخر ما نُشر': 'Latest updates', 'ستظهر الدورات والمنشورات الجديدة هنا.': 'New courses and posts will appear here.',
      'دورة جديدة': 'New course', 'منشور جديد': 'New post',
      emailLabel: 'Email address', login: 'Sign in', register: 'Create account', openMenu: 'Open menu', closeMenu: 'Close menu',
    },
  };

  const languageMeta = {
    ar: { dir: 'rtl', title: 'Olivine School Dz | لغات ودعم دراسي في البليدة', description: 'Olivine School Dz في أولاد يعيش، البليدة: دورات في الإنجليزية والفرنسية والتركية، ودروس دعم للمراحل الابتدائية والمتوسطة والثانوية.' },
    fr: { dir: 'ltr', title: 'Olivine School Dz | Langues et soutien scolaire à Blida', description: 'Olivine School Dz à Ouled Yaïch, Blida : cours d’anglais, de français et de turc, ainsi que soutien scolaire au primaire, au moyen et au secondaire.' },
    en: { dir: 'ltr', title: 'Olivine School Dz | Languages and tutoring in Blida', description: 'Olivine School Dz in Ouled Yaïch, Blida: English, French, and Turkish courses, plus tutoring for primary, middle, and secondary students.' },
  };

  const initialText = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const value = node.nodeValue;
    if (value.trim()) initialText.set(node, { key: value.trim(), lead: value.match(/^\s*/)?.[0] || '', tail: value.match(/\s*$/)?.[0] || '' });
  }
  const initialAttributes = [];
  document.querySelectorAll('[aria-label], [alt], [placeholder]').forEach((element) => {
    for (const name of ['aria-label', 'alt', 'placeholder']) {
      if (element.hasAttribute(name)) initialAttributes.push({ element, name, key: element.getAttribute(name) });
    }
  });

  let language = 'ar';
  let theme = 'green';
  let highContrast = false;
  try {
    language = localStorage.getItem('olivine.language') || 'ar';
    theme = localStorage.getItem('olivine.theme') || 'green';
    highContrast = localStorage.getItem('olivine.contrast') === 'true';
  } catch {}
  if (!['ar', 'fr', 'en'].includes(language)) language = 'ar';
  if (!['green', 'dark', 'ocean', 'plum', 'sand'].includes(theme)) theme = 'green';

  function applyTheme() {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.contrast = highContrast ? 'high' : 'normal';
    const colors = { green: '#123c34', dark: '#101713', ocean: '#153e5b', plum: '#4a3051', sand: '#4b3d2d' };
    document.querySelector('meta[name="theme-color"]').content = colors[theme];
    const themeSelect = document.querySelector('#theme-setting');
    const contrastCheck = document.querySelector('#contrast-setting');
    if (themeSelect) themeSelect.value = theme;
    if (contrastCheck) contrastCheck.checked = highContrast;
    try {
      localStorage.setItem('olivine.theme', theme);
      localStorage.setItem('olivine.contrast', String(highContrast));
    } catch {}
  }

  function setLanguage(next) {
    if (!['ar', 'fr', 'en'].includes(next)) return;
    language = next;
    document.documentElement.lang = next;
    document.documentElement.dir = languageMeta[next].dir;
    for (const [node, original] of initialText) {
      const translated = text[original.key]?.[next === 'fr' ? 0 : 1];
      const value = next === 'ar' || translated === undefined ? original.key : translated;
      node.nodeValue = original.lead + value + original.tail;
    }
    for (const item of initialAttributes) {
      const translated = attributes[item.key]?.[next === 'fr' ? 0 : 1];
      item.element.setAttribute(item.name, next === 'ar' || translated === undefined ? item.key : translated);
    }
    const menuButton = document.querySelector('.menu-toggle');
    if (menuButton) menuButton.setAttribute('aria-label', ui[next][menuButton.getAttribute('aria-expanded') === 'true' ? 'closeMenu' : 'openMenu']);
    document.title = languageMeta[next].title;
    document.querySelector('meta[name="description"]').content = languageMeta[next].description;
    document.querySelector('meta[property="og:title"]').content = languageMeta[next].title;
    document.querySelector('meta[property="og:description"]').content = languageMeta[next].description;
    document.querySelector('meta[property="og:locale"]').content = next === 'ar' ? 'ar_DZ' : next === 'fr' ? 'fr_DZ' : 'en_DZ';
    const languageSelect = document.querySelector('#language-setting');
    if (languageSelect) languageSelect.value = next;
    try { localStorage.setItem('olivine.language', next); } catch {}
  }

  window.olivineI18n = {
    get language() { return language; },
    t(key) { return ui[language][key] || ui.ar[key] || key; },
    welcome(name) {
      if (language === 'fr') return `Bienvenue sur votre espace, ${name}.`;
      if (language === 'en') return `Welcome to your account, ${name}.`;
      return `مرحباً ${name}، أهلاً بك في حسابك.`;
    },
    setLanguage,
  };

  applyTheme();
  setLanguage(language);
  document.querySelector('#language-setting').addEventListener('change', (event) => setLanguage(event.target.value));
  document.querySelector('#theme-setting').addEventListener('change', (event) => {
    if (['green', 'dark', 'ocean', 'plum', 'sand'].includes(event.target.value)) theme = event.target.value;
    applyTheme();
  });
  document.querySelector('#contrast-setting').addEventListener('change', (event) => {
    highContrast = event.target.checked;
    applyTheme();
  });
})();
