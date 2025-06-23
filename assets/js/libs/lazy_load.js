"use strict";
exports.__esModule = true;
exports.lazyLoad = void 0;
function lazyLoad(selector, 
//берём все элементы с этим селектором и применяем к ним lazyLoad, 
dataAttr, //здесь хранится истинный путь до картинки/видео
config) {
    if (selector === void 0) { selector = '[data-src]'; }
    if (dataAttr === void 0) { dataAttr = 'data-src'; }
    if (config === void 0) { config = {
        rootMargin: '0px 0px 50px 0px',
        threshold: 0
    }; }
    // регистрируем объект config с экземпляром
    // intersectionObserver
    var observer = new IntersectionObserver(function (entries, self) {
        //функция замены src на нужный атрибут
        function preloadImage(el) {
            var attr = el.getAttribute(dataAttr);
            el.setAttribute('src', attr);
        }
        // перебираем все элементы
        entries.forEach(function (entry) {
            // обрабатываем только изображения, которые пересекаются.
            // isIntersecting - это свойство, предоставляемое интерфейсом
            //entry.target - сама картинка
            if (entry.isIntersecting) {
                // пользовательская функция, которая копирует путь к img
                // из data-src в src
                preloadImage(entry.target);
                // теперь изображение размещено, прекращаем наблюдение
                self.unobserve(entry.target);
            }
        });
    }, config);
    var imgs = document.querySelectorAll(selector);
    imgs.forEach(function (img) {
        observer.observe(img);
    });
}
exports.lazyLoad = lazyLoad;

//# sourceMappingURL=lazyLoad.js.map
