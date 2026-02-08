import template from "./navigation.component.html";
import "./navigation.component.css";
class NavigationController {
  constructor($http, $window, $location) {}
  items = [
    {
      name: "User Management",
      icon: "person",
    },
    {
      name: "Time Sheets",
      icon: "access_time",
    },
  ];
}

NavigationController.$inject = ["$http", "$window", "$location"];

angular.module("app.navigation", []).component("navigation", {
  template: template,
  controller: NavigationController,
});
