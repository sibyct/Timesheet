import template from "./header.component.html";

class HeaderController {
  constructor($http, $window, $location) {}
}

HeaderController.$inject = ["$http", "$window", "$location"];

angular.module("app.header", []).component("header", {
  template: template,
  controller: HeaderController,
});
