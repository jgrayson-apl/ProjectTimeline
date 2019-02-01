/* global dojoConfig:true */
const package_path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/"));
dojoConfig = {
  async: true,
  parseOnLoad: true,
  packages: [
    { name: "application", location: package_path + "/js/application", main: "app_cedar_issue" },
    { name: "boilerplate", location: package_path + "/js/boilerplate", main: "Boilerplate" },
    { name: "config", location: package_path + "/config" },
    { name: 'd3', location: 'https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.6', main: 'd3.min' },
    { name: 'vega', location: 'https://cdnjs.cloudflare.com/ajax/libs/vega/2.6.1', main: 'vega.min' },
    { name: 'cedar', location: 'https://unpkg.com/arcgis-cedar@0.9.1/dist', main: 'cedar.min' }
  ]
};
if(location.search.match(/locale=([\w-]+)/)) {
  dojoConfig.locale = RegExp.$1;
}
