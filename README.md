# Мой Стартовый Шаблон Вёрстки

структура файлов:
index.html и index.pug находятся в одной директории,
чтобы не было путанится в путях до подключаемых картинок, скриптов и т.д.

вёртска блоков находится в pugBlocks, в этой же папке, где находятся index.html и index.pug
в index.pug подключаются блоки из папок pugBlocks ->
-> (basic - бургев, прелоадер и базовые элементы, blocks - блоки самого лендинга или сайта)

в папке assets находятся js, css, fonts, img, scss.
папки css и scss находятся на одном уровне, чтоб не было путаницы.


в JS надо тоже создать несколько подпапок
___


форма js отправляется и никакие доп js-скрипты не нужны.

Расширения картинок указывать в атрибуте data-src, в src - заглушка. Это нужно для Ленивой Загрузки (Lazy Load)

PUG (шаблон написания блока):

```

mixin blog(blogClass, dirToImg, professionText, blogSubtitle, blogDescription, blogDescriptionClass)
    .blog(class=blogClass)
                img(class='blog__img' src='placeholder.jpg' data-src=dirToImg)
                .profession
                    span.profession__text= professionText

                h3.subtitle.blog__subtitle= blogSubtitle

                if (blogDescription)
                each i in blogDescription
                    p.i(class = blogDescriptionClass) !{i}

                button.btn.btn__readMore Read more

.latestBlocks 
   .wrapper //- делает обёртку, с паддингами слева и права по 30px
      h2.title.latestBlocks__title latest blocks
      div.latestBlocks__content
      
   .row.latestBlocks__row //- создаёт строку с display: flex, 
   //- justify-content: space-between,     flex-wrap: wrap;

      //- в начале файла был написан миксин. Здесь он только подключается
      +blog('blog1', 'img/7latestblogs/webp/blog_1.webp', 
      'Design system', 'How many participants for a ux interview',
      ['Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed <br/> quia consequuntur magni dolores eos.']
      )
      //- создаёт блок, к этому классу применён миксин @include col().
      //- @include col() -  это box-sizing: border-box; word-wrap: break-word; И
      //-

      +blog('blog2', 'img/7latestblogs/webp/blog_2.webp', 
      'Development', 'How many participants for a ux interview',
      ['Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed <br/> quia consequuntur magni dolores eos.']
      )
```

В PUG картинкам указывать директорию img/папкаБлока/webp/название.webp, а в img тэге указывать атрибут data-ext с оригинальным расширением. Если браузер не поддерживает webp, то скрипт поменяет расширение на значение атрибута data-ext. Пример:
```
img(class='makeyoursite__img' src='assets/img/3makeyoursite/webp/image.webp' data-ext='jpg')
```

---
в JS использовать импорты:
в JS можно использовать импорты, чтобы переменные, объекты и классы хранить в одном файле,
а использовать их - в другом

в firstScripts подключить скрипты бургерМеню и Webp, в secondScript подключать остальное.

```
import { a, Slider } from './vars.js';
```

такая запись работает если запускать через OpenServer, если залить на хостинг 
ИЛИ если запустить через браузер с отключённым CORS.
Включённый CORS блокирует импорты в локальных файлах и разрешает импорты только через http или другие схемы.
Отключать CORS не безопасно
в файл, в который идёт импорт другого файла, добавить type='module': 

```
index.pug:
script(src='assets/js/secondScripts.js' type='module')
```

1. Скачать этот репозиторий архивом ИЛИ в пустой папке написать git init, затем git clone _ссылка на этот репозиторий_ ИЛИ в пустой папке написать git init, затем git pull _ссылка на этот репозиторий_;

2. Написать в консоли: npm i (это сокращение от: npm install). Пойдет загрузка папки нужных зависимостей:
   node_modules;

3. Затем в консоли написать gulp;

4. Изначально в html все картинки должны быть в формате .webp. А потом скрипт canUseWebp.js поменяет их на старые расширения (они указаны в атрибуте data-ext у тэгов img, image и т.д.) если webp не поддерживается ос или браузером.

Картинки должны быть ИЗНАЧАЛЬНО в формате .webp, иначе Google PageSpeed их не увидит, если их вставить после загрузки DOM.

В папке IMG создавать папку для каждого блока html-вёрстки и там будут лежать картинки для этого блока.

А в папке каждого блока будет папка webp, в которой будут эти же картинки в формате webp. Такая идеология.

Для каждого тэга img, image, picture и т.д. задавать атрибут data-ext, в котором писать расширение картинки по умолчанию (в каком формате картинка лежит в папке блока) НА ТОТ СЛУЧАЙ, если браузер не поддерживает webp

5. в dev - версия разработки, в prod - продакшен версия.
   папка img, и всё её содержимое копируется галпом в prod/img.
   папка js, и всё её содержимое копируется и минимизируется (но не периеменовывается) галпом в prod/js.

6. Gulp следит за картинками и шрифтами и в случае изменений добавляет изменения в production. Надо научить ещё удалять вслед за удалением картинки или шрифта соответствующий элемент в production.

7. Теперь в IMG есть 2 папки webp и nowebp, и там и там иерархия одинаковая.
   В Gulpfile таск toWebp берёт файлы из './dev/img/noWebp/\*_/_.{png,gif,jpg}' и преобразует их в webp в './dev/img/webp'. А скрипт canUseWebp.js теперь если видит, что webp не поддерживается и картинка в .webp, то меняет img/webp на `img/nowebp/${нужнаяподпапка}/${имяФайла}.${расширениеФайла(указано в аттрибуте img тэга data-ext)}`
8. Работать!

(Пока временно закомментировал BrowserSync.Reload)
