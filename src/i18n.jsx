import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// O'zbekcha (lotin) va ruscha matnlar. Yangi matn qo'shilsa, ikkala tilga ham qo'shing.
const uz = {
  'nav.home': 'UniGoh bosh sahifa',
  'nav.login': 'Kirish',
  'nav.logout': 'Chiqish',
  'nav.lang': 'Til',

  'landing.h1a': 'Bitta ariza —',
  'landing.h1b': 'barcha universitetlar.',
  'landing.lead': "Har bir universitetga alohida borish shart emas. Profilingizni bir marta to'ldiring va uydan turib istalgan nodavlat universitetga hujjat topshiring.",
  'landing.start': 'Boshlash',
  'landing.how': 'Qanday ishlaydi?',
  'landing.grants': 'Grantlar ham shu yerda — 100% gacha.',
  'landing.stepsTitle': "3 qadamda talaba bo'ling",
  'landing.step': '{n}-qadam',
  'landing.s1t': "Profil to'ldiring",
  'landing.s1d': "Ma'lumot va hujjatlaringizni bir marta yuklaysiz.",
  'landing.s2t': 'Universitet tanlang',
  'landing.s2d': "Narx, grant va yo'nalishlarni yonma-yon solishtiring.",
  'landing.s3t': 'Ariza topshiring',
  'landing.s3d': "Universitet javob berganda telefoningizga SMS keladi. Qabul qilinsangiz, rozilik berasiz va universitet siz bilan bog'lanadi.",
  'landing.openProfile': 'Profil ochish',
  'landing.story': 'Vodiydan boshlandi',
  'landing.storyRest': "— butun O'rta Osiyo yoshlari uchun.",
  'landing.privacy': 'Maxfiylik siyosati',

  'auth.signin': 'Kirish',
  'auth.signup': "Ro'yxatdan o'tish",
  'auth.reset': 'Parolni tiklash',
  'auth.resetHint': "Emailingizni yozing, yangi parol o'rnatish uchun havola yuboramiz.",
  'auth.name': 'Ism va familiya',
  'auth.namePh': 'Ali Valiyev',
  'auth.email': 'Email',
  'auth.password': 'Parol',
  'auth.passwordPh': 'Kamida 8 ta belgi',
  'auth.forgot': 'Parolni unutdingizmi?',
  'auth.consentPre': '',
  'auth.consentLink': 'Maxfiylik siyosati va foydalanish shartlari',
  'auth.consentRest': "ga roziman va shaxsiy ma'lumotlarim ariza topshirish uchun qayta ishlanishiga rozilik beraman.",
  'auth.sendLink': 'Havola yuborish',
  'auth.wait': 'Kuting...',
  'auth.noAccount': "Akkauntingiz yo'qmi?",
  'auth.haveAccount': 'Akkauntingiz bormi?',
  'auth.close': 'Yopish',
  'auth.confirmSent': "Emailingizga tasdiqlash xati yubordik. Xatdagi havolani bosing, so'ng kiring.",
  'auth.resetSent': "Agar bu email ro'yxatdan o'tgan bo'lsa, unga parolni tiklash havolasi yuborildi. Pochtangizni (va Spam papkasini) tekshiring.",
  'auth.err.invalid': "Email yoki parol noto'g'ri.",
  'auth.err.notConfirmed': 'Email hali tasdiqlanmagan. Pochtangizdagi xatdagi havolani bosing.',
  'auth.err.exists': 'Bu email bilan akkaunt bor. «Kirish»ni tanlang yoki parolni tiklang.',
  'auth.err.rate': "Juda ko'p urinish bo'ldi. Bir daqiqadan keyin qayta urinib ko'ring.",
  'auth.err.short': "Parol kamida 8 ta belgidan iborat bo'lsin.",
  'auth.err.same': 'Yangi parol eskisidan farq qilishi kerak.',
  'auth.err.generic': "Nimadir xato ketdi. Qayta urinib ko'ring.",
  'auth.newTitle': "Yangi parol o'rnating",
  'auth.newPass': 'Yangi parol',
  'auth.repeat': 'Yana bir marta',
  'auth.mismatch': 'Parollar bir xil emas.',
  'auth.updated': 'Parol yangilandi. Siz tizimdasiz.',
  'auth.save': 'Saqlash',
  'auth.saving': 'Saqlanmoqda...',

  'greet.morning': 'Xayrli tong',
  'greet.day': 'Xayrli kun',
  'greet.evening': 'Xayrli kech',
  'greet.night': 'Xayrli tun',
  'greet.full': "Profilingiz to'liq. Endi universitet tanlashingiz mumkin.",
  'greet.notFull': "Profilingizni to'ldiring — bir marta, barcha universitetlar uchun.",
  'greet.progress': "Profil to'ldirilgan",

  'tabs.label': "Kabinet bo'limlari",
  'tabs.profile': 'Profilim',
  'tabs.universities': 'Universitetlar',
  'tabs.applications': 'Arizalarim',
  'tabs.notifications': 'Xabarlar',

  'profile.loading': 'Profil yuklanmoqda',
  'profile.saved': "Ma'lumotlar saqlandi.",
  'profile.error': 'Xatolik yuz berdi: {msg}',
  'profile.required': 'Majburiy',
  'profile.s1': "Shaxsiy ma'lumotlar",
  'profile.s2': "Ta'lim",
  'profile.s3': 'Hujjatlar',
  'profile.s4': 'Imtihon ballari',
  'profile.s5': 'Sertifikatlar',
  'profile.s6': 'Portfolio va yutuqlar',
  'profile.email': 'Email',
  'profile.fullName': 'Ism va familiya *',
  'profile.fullNamePh': 'masalan: Ali Valiyev',
  'profile.phone': 'Telefon raqam *',
  'profile.region': 'Viloyat / shahar *',
  'profile.regionPh': 'masalan: Andijon',
  'profile.bio': "O'zingiz haqingizda qisqacha",
  'profile.bioPh': 'Qiziqishlaringiz va maqsadlaringiz haqida bir-ikki gap...',
  'profile.school': 'Maktab / litsey / kollej nomi *',
  'profile.schoolPh': 'masalan: Andijon shahar 21-maktab',
  'profile.score': 'DTM / kirish imtihoni bali',
  'profile.scorePh': 'masalan: 145.8',
  'profile.save': 'Saqlash',
  'profile.saving': 'Saqlanmoqda...',
  'profile.saveFirst': 'Fayl yuklash uchun avval yuqoridagi majburiy maydonlarni to\'ldirib, «Saqlash» tugmasini bosing.',
  'profile.certHint': "IELTS, CEFR yoki milliy sertifikatlaringiz bo'lsa, qo'shing — grant olish imkoniyatini oshiradi.",
  'profile.certTitle': 'Sertifikat nomi (IELTS, CEFR...)',
  'profile.certScore': 'Ball yoki daraja (7.0, B2...)',
  'profile.certNeedTitle': 'Avval sertifikat nomi va ballini yozing.',
  'profile.portfolioHint': "Diplomlar, olimpiada g'olibligi, loyihalaringiz — PDF yoki rasm qilib yuklang.",
  'profile.legacyLink': 'havola',

  'docs.private': "Fayllar yopiq omborda saqlanadi. Ularni faqat siz, ariza yuborilgan universitet va UniGoh administratori ko'ra oladi.",
  'docs.passport': 'Pasport yoki ID karta',
  'docs.diploma': 'Shahodatnoma / attestat / diplom',
  'docs.other': 'Boshqa hujjat',
  'docs.portfolio': 'Portfolio fayli',
  'docs.certificate': 'Sertifikat',
  'docs.choose': 'Fayl tanlash',
  'docs.uploading': 'Yuklanmoqda...',
  'docs.view': "Ko'rish",
  'docs.remove': "O'chirish",
  'docs.confirmRemove': "«{name}» o'chirilsinmi?",
  'docs.typeError': 'Faqat PDF, JPG yoki PNG fayl yuklang.',
  'docs.sizeError': "Fayl 10 MB dan oshmasin. Rasmni kichikroq qilib yoki PDF qilib yuklang.",
  'docs.uploadError': "Yuklab bo'lmadi: {msg}",
  'docs.openError': "Faylni ochib bo'lmadi: {msg}",
  'docs.formats': 'PDF, JPG yoki PNG, har biri 10 MB gacha.',

  'unis.loading': 'Yuklanmoqda...',
  'unis.empty': "Hozircha universitetlar qo'shilmagan.",
  'unis.fillProfile': "Ariza topshirishdan oldin «Profilim» bo'limida ism, telefon, viloyat va maktabingizni kiritib saqlang.",
  'unis.apply': 'Ariza topshirish',
  'unis.applying': 'Yuborilmoqda...',
  'unis.applied': 'Ariza yuborilgan',
  'unis.perYear': 'yil',
  'unis.already': "Bu yo'nalishga allaqachon ariza topshirgansiz.",
  'unis.sent': "Ariza topshirildi: {uni} — {program}. Universitet javob berganda telefoningizga SMS keladi.",
  'unis.error': 'Xatolik: {msg}',
  'unis.sum': "so'm",

  'apps.empty': 'Hali ariza topshirmagansiz.',
  'apps.choose': 'Universitet tanlash',
  'apps.current': 'Hozirgi bosqich',
  'apps.exam': 'Suhbat yoki imtihon: {date}',
  'apps.claim': "O'qishga kirdim",
  'apps.claimConfirm': "Shartnoma bo'yicha to'lov qilib, o'qishga kirganingizni tasdiqlaysizmi?",
  'apps.congrats': "Tabriklaymiz! O'qishga kirganingizni tasdiqladingiz.",
  'apps.withdraw': 'Arizadan voz kechish',
  'apps.withdrawConfirm': "Arizadan voz kechmoqchimisiz? Buni ortga qaytarib bo'lmaydi.",
  'apps.admittedTitle': 'Tabriklaymiz, siz qabul qilindingiz!',
  'apps.admittedText': "Davom etish uchun rozilik bering. Shundan so'ng ismingiz, telefon raqamingiz va hujjatlaringiz universitetga yuboriladi va universitet shartnoma tuzish uchun siz bilan bog'lanadi.",
  'apps.accept': 'Roziman, davom etaman',
  'apps.accepting': 'Yuborilmoqda...',
  'apps.acceptConfirm': "Ma'lumotlaringiz universitetga yuborilsinmi ({uni})? Universitet siz bilan bog'lanadi.",
  'apps.decline': 'Rad etaman',
  'apps.declineConfirm': "Bu universitetdan voz kechasizmi? Buni ortga qaytarib bo'lmaydi.",
  'apps.sentText': "Ma'lumotlaringiz universitetga yuborildi. Universitet tez orada siz bilan telefon orqali bog'lanadi va shartnoma tuzish uchun chaqiradi.",
  'apps.rejectedText': "Afsuski, bu safar universitet arizangizni qabul qilmadi. Boshqa universitetlarga ham topshirishingiz mumkin.",
  'profile.phoneHint': "Universitet javob berganda shu raqamga SMS keladi.",

  'status.NEW': 'Ariza topshirildi',
  'status.DOCS_REVIEW': "Universitet ko'rib chiqmoqda",
  'status.EXAM': 'Suhbat yoki imtihon',
  'status.ADMITTED': 'Qabul qilindi',
  'status.SENT': "Universitet siz bilan bog'lanadi",
  'status.CONTRACT': 'Universitet bilan shartnoma',
  'status.ENROLLED': "O'qishga kirdi",
  'status.REJECTED': 'Rad etildi',
  'status.WITHDRAWN': 'Bekor qilindi',

  'agr.title': 'UniGoh bilan shartnoma',
  'agr.intro': "Ma'lumotlaringiz universitetga yuborilishidan oldin UniGoh bilan shartnomani o'qib, elektron imzolang. Bu bir marta qilinadi.",
  'agr.version': '{n}-versiya',
  'agr.fullName': "To'liq ismingiz (pasportdagidek)",
  'agr.draw': 'Imzongizni shu yerga chizing',
  'agr.clear': 'Tozalash',
  'agr.agree': "Shartnomani o'qidim va uning shartlariga roziman.",
  'agr.sign': 'Imzolash va rozilik berish',
  'agr.signing': 'Imzolanmoqda...',
  'agr.needSignature': 'Imzongizni chizing.',
  'agr.needName': "To'liq ismingizni yozing.",
  'agr.signed': 'Imzolangan: {date}',
  'agr.notSigned': "Hali imzolanmagan. Universitet sizni qabul qilganda imzolaysiz.",
  'agr.view': "Shartnomani ko'rish",
  'agr.print': 'Chop etish yoki PDF saqlash',
  'agr.cancel': 'Bekor qilish',
  'agr.section': 'Shartnoma',
  'agr.signer': 'Imzolovchi',
  'agr.signedAt': 'Imzolangan sana',

  'notif.title': 'Xabarlar',
  'notif.empty': "Hozircha xabarlar yo'q. Ariza holati o'zgarganda shu yerda ko'rasiz.",
  'notif.markAll': "Hammasini o'qilgan deb belgilash",
  'notif.submitted': "Ariza topshirildi: {university} — {program}. Universitet ko'rib chiqadi, javob SMS orqali keladi.",
  'notif.exam': '{university}: suhbat yoki imtihon sanasi — {date}.',
  'notif.note': '{university} universitetidan xabar: {note}',
  'notif.status.SENT': "Ma'lumotlaringiz universitetga yuborildi: {university}. Universitet tez orada siz bilan bog'lanadi.",
  'notif.status.DOCS_REVIEW': "{university} arizangizni ko'rib chiqmoqda.",
  'notif.status.EXAM': '{university} sizni suhbat yoki imtihonga chaqirdi.',
  'notif.status.ADMITTED': "Tabriklaymiz! {university} sizni qabul qildi. «Arizalarim» bo'limida rozilik bering — shundan so'ng universitet siz bilan bog'lanadi.",
  'notif.status.CONTRACT': 'Universitet bilan shartnoma tuzildi: {university}.',
  'notif.status.ENROLLED': "Siz endi talabasiz: {university}. O'qishingizda omad!",
  'notif.status.REJECTED': 'Afsuski, {university} arizangizni rad etdi. Boshqa universitetlarga ham topshirishingiz mumkin.',
  'notif.status.WITHDRAWN': 'Ariza bekor qilindi: {university}.',
  'notif.status.other': "Ariza holati o'zgardi: {university}.",


  'privacy.back': 'Bosh sahifa',
};

const ru = {
  'nav.home': 'UniGoh — главная',
  'nav.login': 'Войти',
  'nav.logout': 'Выйти',
  'nav.lang': 'Язык',

  'landing.h1a': 'Одна заявка —',
  'landing.h1b': 'все университеты.',
  'landing.lead': 'Не нужно ездить в каждый университет отдельно. Заполните профиль один раз и подавайте документы в любой негосударственный университет, не выходя из дома.',
  'landing.start': 'Начать',
  'landing.how': 'Как это работает?',
  'landing.grants': 'Гранты тоже здесь — до 100%.',
  'landing.stepsTitle': 'Стать студентом за 3 шага',
  'landing.step': 'Шаг {n}',
  'landing.s1t': 'Заполните профиль',
  'landing.s1d': 'Данные и документы загружаются один раз.',
  'landing.s2t': 'Выберите университет',
  'landing.s2d': 'Сравните стоимость, гранты и направления.',
  'landing.s3t': 'Подайте заявку',
  'landing.s3d': 'Когда университет ответит, вам придёт SMS. Если вас приняли, вы даёте согласие, и университет свяжется с вами.',
  'landing.openProfile': 'Создать профиль',
  'landing.story': 'Начали с Ферганской долины',
  'landing.storyRest': '— для молодёжи всей Центральной Азии.',
  'landing.privacy': 'Политика конфиденциальности',

  'auth.signin': 'Вход',
  'auth.signup': 'Регистрация',
  'auth.reset': 'Восстановление пароля',
  'auth.resetHint': 'Введите email — мы отправим ссылку для установки нового пароля.',
  'auth.name': 'Имя и фамилия',
  'auth.namePh': 'Али Валиев',
  'auth.email': 'Email',
  'auth.password': 'Пароль',
  'auth.passwordPh': 'Не менее 8 символов',
  'auth.forgot': 'Забыли пароль?',
  'auth.consentPre': 'Я ознакомлен(а) с ',
  'auth.consentLink': 'Политикой конфиденциальности и условиями использования',
  'auth.consentRest': ', согласен(на) с ними и даю согласие на обработку моих персональных данных для подачи заявок.',
  'auth.sendLink': 'Отправить ссылку',
  'auth.wait': 'Подождите...',
  'auth.noAccount': 'Нет аккаунта?',
  'auth.haveAccount': 'Уже есть аккаунт?',
  'auth.close': 'Закрыть',
  'auth.confirmSent': 'Мы отправили письмо для подтверждения. Перейдите по ссылке в письме, затем войдите.',
  'auth.resetSent': 'Если этот email зарегистрирован, на него отправлена ссылка для восстановления пароля. Проверьте почту (и папку «Спам»).',
  'auth.err.invalid': 'Неверный email или пароль.',
  'auth.err.notConfirmed': 'Email ещё не подтверждён. Перейдите по ссылке в письме.',
  'auth.err.exists': 'Аккаунт с этим email уже есть. Нажмите «Войти» или восстановите пароль.',
  'auth.err.rate': 'Слишком много попыток. Попробуйте через минуту.',
  'auth.err.short': 'Пароль должен содержать не менее 8 символов.',
  'auth.err.same': 'Новый пароль должен отличаться от старого.',
  'auth.err.generic': 'Что-то пошло не так. Попробуйте ещё раз.',
  'auth.newTitle': 'Установите новый пароль',
  'auth.newPass': 'Новый пароль',
  'auth.repeat': 'Повторите пароль',
  'auth.mismatch': 'Пароли не совпадают.',
  'auth.updated': 'Пароль обновлён. Вы вошли в систему.',
  'auth.save': 'Сохранить',
  'auth.saving': 'Сохранение...',

  'greet.morning': 'Доброе утро',
  'greet.day': 'Добрый день',
  'greet.evening': 'Добрый вечер',
  'greet.night': 'Доброй ночи',
  'greet.full': 'Профиль заполнен. Теперь можно выбрать университет.',
  'greet.notFull': 'Заполните профиль один раз — для всех университетов.',
  'greet.progress': 'Профиль заполнен на',

  'tabs.label': 'Разделы кабинета',
  'tabs.profile': 'Профиль',
  'tabs.universities': 'Университеты',
  'tabs.applications': 'Мои заявки',
  'tabs.notifications': 'Уведомления',

  'profile.loading': 'Загрузка профиля',
  'profile.saved': 'Данные сохранены.',
  'profile.error': 'Произошла ошибка: {msg}',
  'profile.required': 'Обязательно',
  'profile.s1': 'Личные данные',
  'profile.s2': 'Образование',
  'profile.s3': 'Документы',
  'profile.s4': 'Баллы экзаменов',
  'profile.s5': 'Сертификаты',
  'profile.s6': 'Портфолио и достижения',
  'profile.email': 'Email',
  'profile.fullName': 'Имя и фамилия *',
  'profile.fullNamePh': 'например: Али Валиев',
  'profile.phone': 'Номер телефона *',
  'profile.region': 'Область / город *',
  'profile.regionPh': 'например: Андижан',
  'profile.bio': 'Коротко о себе',
  'profile.bioPh': 'Пара предложений о ваших интересах и целях...',
  'profile.school': 'Школа / лицей / колледж *',
  'profile.schoolPh': 'например: школа № 21, г. Андижан',
  'profile.score': 'Балл DTM / вступительного экзамена',
  'profile.scorePh': 'например: 145.8',
  'profile.save': 'Сохранить',
  'profile.saving': 'Сохранение...',
  'profile.saveFirst': 'Чтобы загружать файлы, сначала заполните обязательные поля выше и нажмите «Сохранить».',
  'profile.certHint': 'Если у вас есть IELTS, CEFR или национальные сертификаты, добавьте их — это повышает шансы на грант.',
  'profile.certTitle': 'Название (IELTS, CEFR...)',
  'profile.certScore': 'Балл или уровень (7.0, B2...)',
  'profile.certNeedTitle': 'Сначала укажите название и балл сертификата.',
  'profile.portfolioHint': 'Дипломы, победы в олимпиадах, ваши проекты — загрузите в формате PDF или изображения.',
  'profile.legacyLink': 'ссылка',

  'docs.private': 'Файлы хранятся в закрытом хранилище. Их видите только вы, университет, куда отправлена заявка, и администратор UniGoh.',
  'docs.passport': 'Паспорт или ID-карта',
  'docs.diploma': 'Аттестат / диплом',
  'docs.other': 'Другой документ',
  'docs.portfolio': 'Файл портфолио',
  'docs.certificate': 'Сертификат',
  'docs.choose': 'Выбрать файл',
  'docs.uploading': 'Загрузка...',
  'docs.view': 'Открыть',
  'docs.remove': 'Удалить',
  'docs.confirmRemove': 'Удалить «{name}»?',
  'docs.typeError': 'Загружайте только файлы PDF, JPG или PNG.',
  'docs.sizeError': 'Размер файла — не более 10 МБ. Уменьшите изображение или сохраните как PDF.',
  'docs.uploadError': 'Не удалось загрузить: {msg}',
  'docs.openError': 'Не удалось открыть файл: {msg}',
  'docs.formats': 'PDF, JPG или PNG, до 10 МБ каждый.',

  'unis.loading': 'Загрузка...',
  'unis.empty': 'Университеты пока не добавлены.',
  'unis.fillProfile': 'Перед подачей заявки укажите в разделе «Профиль» имя, телефон, область и школу и сохраните.',
  'unis.apply': 'Подать заявку',
  'unis.applying': 'Отправка...',
  'unis.applied': 'Заявка подана',
  'unis.perYear': 'год',
  'unis.already': 'Вы уже подали заявку на это направление.',
  'unis.sent': 'Заявка подана: {uni} — {program}. Когда университет ответит, вам придёт SMS.',
  'unis.error': 'Ошибка: {msg}',
  'unis.sum': 'сум',

  'apps.empty': 'Вы ещё не подали ни одной заявки.',
  'apps.choose': 'Выбрать университет',
  'apps.current': 'Текущий этап',
  'apps.exam': 'Собеседование или экзамен: {date}',
  'apps.claim': 'Я поступил(а)',
  'apps.claimConfirm': 'Подтверждаете, что оплатили обучение по договору и поступили?',
  'apps.congrats': 'Поздравляем! Вы подтвердили поступление.',
  'apps.withdraw': 'Отозвать заявку',
  'apps.withdrawConfirm': 'Отозвать заявку? Это действие нельзя отменить.',
  'apps.admittedTitle': 'Поздравляем, вас приняли!',
  'apps.admittedText': 'Чтобы продолжить, дайте согласие. После этого ваше имя, телефон и документы будут переданы в университет, и университет свяжется с вами для заключения договора.',
  'apps.accept': 'Согласен(на), продолжить',
  'apps.accepting': 'Отправка...',
  'apps.acceptConfirm': 'Передать ваши данные в {uni}? Университет свяжется с вами.',
  'apps.decline': 'Отказаться',
  'apps.declineConfirm': 'Отказаться от этого университета? Это действие нельзя отменить.',
  'apps.sentText': 'Ваши данные переданы в университет. Университет скоро позвонит вам и пригласит для заключения договора.',
  'apps.rejectedText': 'К сожалению, в этот раз университет не принял вашу заявку. Вы можете подать заявку в другие университеты.',
  'profile.phoneHint': 'Когда университет ответит, на этот номер придёт SMS.',

  'status.NEW': 'Заявка подана',
  'status.DOCS_REVIEW': 'Университет рассматривает',
  'status.EXAM': 'Собеседование или экзамен',
  'status.ADMITTED': 'Вас приняли',
  'status.SENT': 'Университет свяжется с вами',
  'status.CONTRACT': 'Договор с университетом',
  'status.ENROLLED': 'Зачисление',
  'status.REJECTED': 'Отказано',
  'status.WITHDRAWN': 'Отозвано',

  'agr.title': 'Договор с UniGoh',
  'agr.intro': 'Перед передачей ваших данных в университет прочитайте договор с UniGoh и подпишите его электронно. Это делается один раз.',
  'agr.version': 'Версия {n}',
  'agr.fullName': 'Ваше полное имя (как в паспорте)',
  'agr.draw': 'Нарисуйте подпись здесь',
  'agr.clear': 'Очистить',
  'agr.agree': 'Я прочитал(а) договор и согласен(на) с его условиями.',
  'agr.sign': 'Подписать и дать согласие',
  'agr.signing': 'Подписание...',
  'agr.needSignature': 'Нарисуйте подпись.',
  'agr.needName': 'Укажите полное имя.',
  'agr.signed': 'Подписан: {date}',
  'agr.notSigned': 'Ещё не подписан. Вы подпишете его, когда университет вас примет.',
  'agr.view': 'Открыть договор',
  'agr.print': 'Распечатать или сохранить PDF',
  'agr.cancel': 'Отмена',
  'agr.section': 'Договор',
  'agr.signer': 'Подписант',
  'agr.signedAt': 'Дата подписания',

  'notif.title': 'Уведомления',
  'notif.empty': 'Уведомлений пока нет. Здесь появятся изменения статуса ваших заявок.',
  'notif.markAll': 'Отметить все как прочитанные',
  'notif.submitted': 'Заявка подана: {university} — {program}. Университет рассмотрит её, ответ придёт по SMS.',
  'notif.exam': '{university}: дата собеседования или экзамена — {date}.',
  'notif.note': 'Сообщение от университета {university}: {note}',
  'notif.status.SENT': 'Ваши данные переданы в университет: {university}. Университет скоро свяжется с вами.',
  'notif.status.DOCS_REVIEW': '{university} рассматривает вашу заявку.',
  'notif.status.EXAM': '{university} приглашает вас на собеседование или экзамен.',
  'notif.status.ADMITTED': 'Поздравляем! {university} принял вас. Дайте согласие в разделе «Мои заявки» — после этого университет свяжется с вами.',
  'notif.status.CONTRACT': 'Договор с университетом оформлен: {university}.',
  'notif.status.ENROLLED': 'Вы зачислены: {university}. Желаем успехов в учёбе!',
  'notif.status.REJECTED': 'К сожалению, заявка в {university} отклонена. Вы можете подать заявку в другие университеты.',
  'notif.status.WITHDRAWN': 'Заявка отозвана: {university}.',
  'notif.status.other': 'Статус заявки изменён: {university}.',


  'privacy.back': 'На главную',
};

const DICT = { uz, ru };
const LangContext = createContext({ lang: 'uz', setLang: () => {}, t: (k) => k });

function initialLang() {
  try {
    const saved = localStorage.getItem('unigoh_lang');
    if (saved === 'uz' || saved === 'ru') return saved;
  } catch (_) { /* brauzer xotirasi yopiq */ }
  const nav = (navigator.language || '').toLowerCase();
  return nav.startsWith('ru') ? 'ru' : 'uz';
}

export function LangProvider({ children, onChange }) {
  const [lang, setLangState] = useState(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem('unigoh_lang', l); } catch (_) { /* e'tiborsiz */ }
    onChange?.(l);
  }, [onChange]);

  const t = useCallback((key, vars) => {
    let s = DICT[lang][key] ?? DICT.uz[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v ?? '');
    return s;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

// Universitet ma'lumotlarida ruscha variant bo'lsa — o'shani, bo'lmasa o'zbekchasini
export function loc(obj, field, lang) {
  if (!obj) return '';
  if (lang === 'ru' && obj[`${field}_ru`]) return obj[`${field}_ru`];
  return obj[field] || '';
}

export function formatDate(d, lang, withTime = true) {
  if (!d) return '';
  return new Date(d).toLocaleString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', {
    timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function notificationText(n, t) {
  const d = n.data || {};
  const vars = { university: d.university, program: d.program, note: d.note, date: d.date_local };
  if (n.kind === 'status') {
    const key = `notif.status.${d.status}`;
    return t(DICT.uz[key] ? key : 'notif.status.other', vars);
  }
  return t(`notif.${n.kind}`, vars);
}

// Yo'nalish darajasi va muddati: ruscha variant kiritilmagan bo'lsa, odatiy qiymatlarni tarjima qilamiz
const DEGREE_RU = { bakalavr: 'Бакалавриат', magistratura: 'Магистратура', magistr: 'Магистратура', doktorantura: 'Докторантура' };
export function programMeta(p, lang) {
  let degree = loc(p, 'degree', lang);
  let duration = loc(p, 'duration', lang);
  if (lang === 'ru') {
    if (!p.degree_ru && degree) degree = DEGREE_RU[degree.trim().toLowerCase()] || degree;
    if (!p.duration_ru && duration) {
      const m = duration.match(/^(\d+(?:[.,]\d+)?)\s*yil$/i);
      if (m) {
        const n = parseFloat(m[1].replace(',', '.'));
        const word = !Number.isInteger(n) ? 'года' : n % 10 === 1 && n % 100 !== 11 ? 'год' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'года' : 'лет';
        duration = `${m[1]} ${word}`;
      }
    }
  }
  return [degree, duration];
}
