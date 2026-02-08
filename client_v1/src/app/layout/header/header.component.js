import template from "./header.component.html";

class HeaderController {
  constructor($http, $window, $location) {}
  profileMenuOptions = [
    { label: "Profile", icon: "person" },
    { label: "Change Password", icon: "settings" },
  ];
  notifications = [
    { message: "New user registered", time: "2 mins ago" },
    { message: "Server downtime scheduled", time: "1 hour ago" },
  ];
}

HeaderController.$inject = ["$http", "$window", "$location"];

angular.module("app.header", []).component("header", {
  template: template,
  controller: HeaderController,
});
