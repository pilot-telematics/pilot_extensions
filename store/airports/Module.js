Ext.define('Store.airports.Module', {
    extend: 'Ext.Component', // функция инициализации модуля
    initModule: function () {
        var cmp = this;
        //создаем панель - закладку для раздела навигации
        var nav = Ext.create('Store.airports.Tab', {});
        // создаем панель для отображения в области карты связянную с панелью навигации
        nav.map_frame = Ext.create('Store.airports.Map', {});
        // размещаем элементы в нужные позиции
        skeleton.navigation.add(nav);
        skeleton.mapframe.add(nav.map_frame);
        //if you need to load css file
        // загружаем дополнительный файл стилей
        var css = document.createElement("link")
        css.setAttribute("rel", "stylesheet")
        css.setAttribute("type", "text/css")
        css.setAttribute("href", '/store/airports/airports.css');

    }
});