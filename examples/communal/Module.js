Ext.define('Store.communal.Module', {
    extend: 'Ext.Component', // функция инициализации модуля
    initModule: function () {
        //создаем панель - закладку для раздела навигации
        var nav = Ext.create('Store.communal.Tab', {});
        // создаем панель для отображения в области карты связянную с панелью навигации
        nav.map_frame = Ext.create('Store.communal.Map', {});
        // размещаем элементы в нужные позиции
        skeleton.navigation.add(nav);
        skeleton.mapframe.add(nav.map_frame);
        //if you need to load css file
        // загружаем дополнительный файл стилей
        var css = document.createElement("link")
        css.setAttribute("rel", "stylesheet")
        css.setAttribute("type", "text/css")
        css.setAttribute("href", '/store/communal/communal.css');

    }
});