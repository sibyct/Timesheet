import template from "./navigation.component.html";

class NavigationController {
  constructor($http, $window, $location) {}
  items = [
    {
      name: "User Management",
      imgUrl: "images/userid.svg",
    },
    {
      name: "Time Sheets",
      imgUrl: "images/time.svg",
    },
  ];
}

NavigationController.$inject = ["$http", "$window", "$location"];

angular.module("app.navigation", []).component("navigation", {
  template: template,
  controller: NavigationController,
});
